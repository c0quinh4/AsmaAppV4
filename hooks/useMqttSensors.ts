// hooks/useMqttSensors.ts
import { useEffect, useMemo, useRef, useState } from 'react';
import { Client, Message } from 'paho-mqtt';
import { Buffer } from 'buffer'; // para conversões em publish

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

function isSensorId(x: string | undefined): x is SensorId {
  return !!x && Object.prototype.hasOwnProperty.call(SENSORS_META, x);
}

function parsePayloadFromString(text: string): number | string {
  // Tenta JSON com chave { "valor": ... }
  try {
    const obj = JSON.parse(text);
    if (obj && typeof obj === 'object' && 'valor' in obj) {
      // ts-expect-error acesso dinâmico
      return obj.valor;
    }
  } catch {
    // não era JSON
  }

  // Tenta número cru
  const n = Number(text);
  if (!Number.isNaN(n)) return n;

  // Fallback: string original
  return text;
}

export function useMqttSensors() {
  const clientRef = useRef<Client | null>(null);
  const [connected, setConnected] = useState(false);
  const [sensors, setSensors] = useState<SensorMap>({});

  useEffect(() => {
    // Paho aceita URL wss e clientId
    const clientId = `asmaapp-${Math.random().toString(16).slice(2)}`;
    // Ex.: 'wss://broker.hivemq.com:8884/mqtt'
    const client = new Client(MQTT_BROKER_URL, clientId);
    clientRef.current = client;

    client.onConnectionLost = () => {
      setConnected(false);
    };

    client.onMessageArrived = (msg) => {
      const topic = msg.destinationName; // ex.: sensorestcc/batimentos-cardiacos
      const parts = topic?.split('/') ?? [];
      const id = parts[1];

      if (!isSensorId(id)) return;

      // payloadString sempre vem em string no Paho
      const text = msg.payloadString ?? '';
      const value = parsePayloadFromString(text);

      setSensors((prev) => ({
        ...prev,
        [id]: { value, updatedAt: Date.now() },
      }));
    };

    client.connect({
      useSSL: true, // obrigatório para wss
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

  // Publicação: aceita string, Uint8Array ou ArrayBuffer
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

  return useMemo(() => ({ connected, sensors, publish }), [connected, sensors]);
}
