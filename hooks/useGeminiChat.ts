// hooks/useGeminiChat.ts
import { useCallback, useMemo, useRef, useState } from 'react';
import { generateChat, ChatMessage } from '@/services/gemini';

export function useGeminiChat(opts?: {
  systemPrompt?: string;
  sensorContextProvider?: () => string | undefined;
}) {
  const { systemPrompt, sensorContextProvider } = opts || {};
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const send = useCallback(
    async (text: string) => {
      if (!text?.trim()) return;
      setError(null);
      setLoading(true);

      // adiciona pergunta do usuário
      setMessages((prev) => [...prev, { role: 'user', content: text }]);

      try {
        const sensorContext = sensorContextProvider?.();
        const reply = await generateChat(messages, text, {
          systemPrompt,
          sensorContext,
          temperature: 0.35,
          maxTokens: 1024,
        });

        setMessages((prev) => [...prev, { role: 'model', content: reply }]);
      } catch (e: any) {
        setError(e?.message || String(e));
      } finally {
        setLoading(false);
      }
    },
    [messages, sensorContextProvider, systemPrompt]
  );

  const reset = useCallback(() => {
    setMessages([]);
    setError(null);
    abortRef.current?.abort();
    abortRef.current = null;
  }, []);

  return useMemo(
    () => ({ messages, loading, error, send, reset }),
    [messages, loading, error, send, reset]
  );
}
