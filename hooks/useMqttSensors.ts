// hooks/useMqttSensors.ts
import { useEffect, useMemo, useRef, useState } from 'react';
import { Client, Message } from 'paho-mqtt';
import { Buffer } from 'buffer';
import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  MQTT_BROKER_URL,
  MQTT_TOPIC,
  SensorId,
  SENSORS_META,
} from '@/constants/mqtt';

type SensorValue = {
  value: number | string;
  updatedAt: number; // epoch ms
};
type SensorMap = Partial<Record<SensorId, SensorValue>>;

type HistoryEntry = { ts: number; value: number | string };
type HistoryMap = Partial<Record<SensorId, HistoryEntry[]>>;

const STORE_KEY = '@asma/sensors:last';
const HISTORY_KEY = '@asma/sensors:history';
const HISTORY_MAX = 100;

/** Considera "0" para número 0 ou string que parseia para 0 (ex.: "0", "0.0"). */
function isZeroLike(v: number | string): boolean {
  if (typeof v === 'number') return v === 0;
  const s = String(v).trim();
  const n = Number(s);
  if (!Number.isNaN(n)) return n === 0;
  return s === '0';
}

function isSensorId(x: string | undefined): x is SensorId {
  return !!x && Object.prototype.hasOwnProperty.call(SENSORS_META, x);
}

function parsePayloadFromString(text: string): number | string {
  // tenta JSON { "valor": ... }
  try {
    const obj = JSON.parse(text);
    if (obj && typeof obj === 'object' && 'valor' in obj) {
      // ts-expect-error acesso dinâmico
      return obj.valor;
    }
  } catch {
    // não era JSON
  }
  // tenta número cru
  const n = Number(text);
  if (!Number.isNaN(n)) return n;
  return text;
}

/** Pega último valor NÃO-ZERO para IA; cai para o último em memória se for válido. */
function pickLastForAI(
  id: SensorId,
  last: SensorValue | undefined,
  history: HistoryMap
): number | string | undefined {
  const arr = history[id] ?? [];
  for (let i = arr.length - 1; i >= 0; i--) {
    const v = arr[i].value;
    if (!isZeroLike(v)) return v;
  }
  if (last?.value !== undefined && !isZeroLike(last.value)) {
    return last.value;
  }
  return undefined;
}

export function useMqttSensors() {
  const clientRef = useRef<Client | null>(null);
  const [connected, setConnected] = useState(false);
  const [sensors, setSensors] = useState<SensorMap>({});
  const [history, setHistory] = useState<HistoryMap>({});

  // Rehidrata cache e histórico
  useEffect(() => {
    (async () => {
      try {
        const [rawLast, rawHist] = await Promise.all([
          AsyncStorage.getItem(STORE_KEY),
          AsyncStorage.getItem(HISTORY_KEY),
        ]);
        if (rawLast) {
          const parsed = JSON.parse(rawLast) as SensorMap;
          const sanitized: SensorMap = {};
          Object.entries(parsed).forEach(([k, v]) => {
            if (isSensorId(k) && v && typeof v === 'object') {
              sanitized[k as SensorId] = v as SensorValue;
            }
          });
          setSensors(sanitized);
        }
        if (rawHist) {
          const parsed = JSON.parse(rawHist) as HistoryMap;
          const sanitized: HistoryMap = {};
          Object.entries(parsed).forEach(([k, v]) => {
            if (isSensorId(k) && Array.isArray(v)) {
              sanitized[k as SensorId] = v as HistoryEntry[];
            }
          });
          setHistory(sanitized);
        }
      } catch (e) {
        console.warn('Falha ao carregar cache/histórico:', e);
      }
    })();
  }, []);

  // Conexão MQTT (Paho)
  useEffect(() => {
    const clientId = `asmaapp-${Math.random().toString(16).slice(2)}`;
    const client = new Client(MQTT_BROKER_URL, clientId);
    clientRef.current = client;

    client.onConnectionLost = () => setConnected(false);

    client.onMessageArrived = (msg: Message) => {
      const topic = msg.destinationName; // sensorestcc/<id>
      const parts = topic?.split('/') ?? [];
      const id = parts[1];

      if (!isSensorId(id)) return;

      const text = msg.payloadString ?? '';
      const parsed = parsePayloadFromString(text);
      const now = Date.now();

      // 1) Sempre registra no HISTÓRICO (inclusive zeros)
      setHistory((prev) => {
        const arr = [...(prev[id] ?? [])];
        arr.push({ ts: now, value: parsed });
        while (arr.length > HISTORY_MAX) arr.shift();
        const next = { ...prev, [id]: arr };
        AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(next)).catch(() => {});
        return next;
      });

      // 2) Filtro: NÃO sobrescrever "último valor" quando for zero-like
      if (isZeroLike(parsed)) {
        return; // aborta update do "sensors"
      }

      // 3) Atualiza último valor válido
      setSensors((prev) => {
        const next: SensorMap = {
          ...prev,
          [id]: { value: parsed, updatedAt: now },
        };
        AsyncStorage.setItem(STORE_KEY, JSON.stringify(next)).catch(() => {});
        return next;
      });
    };

    client.connect({
      useSSL: true,
      timeout: 10,
      keepAliveInterval: 60,
      cleanSession: true,
      onSuccess: () => {
        setConnected(true);
        client.subscribe(MQTT_TOPIC); // sensorestcc/#
      },
      onFailure: (err) => {
        setConnected(false);
        console.warn('Falha ao conectar MQTT:', err?.errorMessage ?? err);
      },
    });

    return () => {
      try {
        client.disconnect();
      } catch {}
      clientRef.current = null;
    };
  }, []);

  // Publicação
  const publish = (topic: string, msg: string | Uint8Array | ArrayBuffer) => {
    const c = clientRef.current;
    if (!c || !connected) return;

    try {
      const payloadStr =
        typeof msg === 'string'
          ? msg
          : Buffer.from(msg as ArrayBufferLike).toString('utf8');

      const m = new Message(payloadStr);
      m.destinationName = topic;
      c.send(m);
    } catch (e) {
      console.warn('Falha ao publicar MQTT:', e);
    }
  };

  // Snapshot pronto para a IA (ignora zeros para todos os sensores)
  const getAISnapshot = (): Partial<Record<SensorId, number | string>> => {
    const out: Partial<Record<SensorId, number | string>> = {};
    (Object.keys(SENSORS_META) as SensorId[]).forEach((id) => {
      const v = pickLastForAI(id, sensors[id], history);
      if (v !== undefined) out[id] = v;
    });
    return out;
  };

  return useMemo(
    () => ({ connected, sensors, history, publish, getAISnapshot }),
    [connected, sensors, history]
  );
}
