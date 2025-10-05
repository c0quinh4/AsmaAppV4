// services/gemini.ts
import Constants from 'expo-constants';

type Role = 'user' | 'model';

export type ChatMessage = {
  role: Role;
  content: string;
};

const EXTRA = Constants.expoConfig?.extra ?? {};
const API_KEY = EXTRA.googleApiKey as string;
const MODEL = (EXTRA.geminiModel as string) || 'gemini-2.5-flash';
const EMBEDDING_MODEL =
  (EXTRA.embeddingModel as string) || 'models/text-embedding-004';

const BASE = 'https://generativelanguage.googleapis.com/v1beta';

// Segurança básica para não fazer chamada sem key
function assertKey() {
  if (!API_KEY) throw new Error('Faltou GOOGLE_API_KEY em app.json (extra.googleApiKey)');
}

/**
 * Gera resposta do chat a partir do histórico + prompt atual.
 * System prompt vai como "systemInstruction".
 * Caso você queira incluir dados de sensores, use "sensorContext".
 */
export async function generateChat(
  history: ChatMessage[],
  userPrompt: string,
  opts?: {
    systemPrompt?: string;
    sensorContext?: string; // opcional: resumo do MQTT
    temperature?: number;
    maxTokens?: number;
  }
): Promise<string> {
  assertKey();

  const { systemPrompt, sensorContext, temperature = 0.35, maxTokens = 1024 } =
    opts || {};

  // Monta o histórico no formato aceito pela API
  const contents = [
    ...history.map((m) => ({
      role: m.role,
      parts: [{ text: m.content }],
    })),
    {
      role: 'user',
      parts: [
        {
          text:
            (sensorContext
              ? `Contexto dos sensores (resumo atual):\n${sensorContext}\n\n`
              : '') + userPrompt,
        },
      ],
    },
  ];

  const body = {
    contents,
    ...(systemPrompt
      ? { systemInstruction: { parts: [{ text: systemPrompt }] } }
      : {}),
    generationConfig: {
      temperature,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: maxTokens,
      candidateCount: 1,
    },
  };

  const url = `${BASE}/models/${MODEL}:generateContent?key=${API_KEY}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini API error: ${res.status} ${err}`);
  }

  const json = await res.json();
  const text =
    json?.candidates?.[0]?.content?.parts?.map((p: any) => p?.text).join('') ||
    '';

  return text.trim();
}

/** Exemplo de uso do modelo de embedding (para memória semântica/RAG simples) */
export async function embed(text: string): Promise<number[]> {
  assertKey();
  const url = `${BASE}/${EMBEDDING_MODEL}:embedContent?key=${API_KEY}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content: { parts: [{ text }] } }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Embedding error: ${res.status} ${err}`);
  }
  const json = await res.json();
  return json?.embedding?.values ?? [];
}
