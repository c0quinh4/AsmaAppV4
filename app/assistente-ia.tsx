// app/assistente-ia.tsx
import { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ChatBubble from '@/components/ui/ChatBubble';
import { useGeminiChat } from '@/hooks/useGeminiChat';

// (opcional) importar sensores para contexto
import { useMqttSensors } from '@/hooks/useMqttSensors';
import { buildSensorsContext } from '@/utils/sensorsContext';

const SUGGESTIONS = [
  'Como estão meus sintomas?',
  'Faça um relatório da minha situação atual',
  'Como está o ambiente para um asmático?',
];

const SYSTEM_PROMPT = `
Você é um assistente de saúde respiratória para um usuário asmático.
- Use linguagem clara e objetiva, evitando alarmismo.
- Quando o usuário pedir avaliação do "ambiente" ou "sintomas", considere o contexto dos sensores se fornecido (temperatura, umidade, AQI, O3, NO2, SO2, PM2.5/PM10, batimentos, SpO2).
- Se os sensores não estiverem disponíveis, explique de forma neutra como o usuário pode monitorá-los.
- Inclua recomendações práticas e sinais de alerta que exijam buscar atendimento.
- NÃO faça diagnóstico médico; deixe claro que é suporte informativo.
`.trim();

export default function AssistenteIA() {
  // (opcional) sensores → contexto
  const { sensors } = useMqttSensors();
  const sensorContextProvider = () => buildSensorsContext(sensors as any);

  const { messages, loading, error, send, reset } = useGeminiChat({
    systemPrompt: SYSTEM_PROMPT,
    sensorContextProvider,
  });

  const [input, setInput] = useState('');
  const scrollRef = useRef<ScrollView>(null);

  const handleSend = async (text?: string) => {
    const value = (text ?? input).trim();
    if (!value) return;
    setInput('');
    await send(value);
    queueMicrotask(() => scrollRef.current?.scrollToEnd({ animated: true }));
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#F7FAFF' }}
      behavior={Platform.select({ ios: 'padding', android: undefined })}
    >
      <ScrollView
        contentContainerStyle={{ paddingBottom: 16 }}
        ref={scrollRef}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.title}>Assistente IA</Text>
          <Text style={styles.subtitle}>
            Obtenha suporte personalizado e respostas sobre saúde respiratória da nossa IA especializada.
          </Text>
        </View>

        <View style={styles.chatBox}>
          {messages.length === 0 && (
            <Text style={styles.placeholder}>
              Faça uma pergunta sobre seus sintomas, ambiente ou rotinas de controle.
            </Text>
          )}
          {messages.map((m, i) => (
            <ChatBubble key={i} content={m.content} role={m.role} />
          ))}
          {loading && <Text style={styles.thinking}>IA digitando…</Text>}
          {!!error && <Text style={styles.error}>{error}</Text>}
        </View>

        {/* Chips de sugestão */}
        <View style={styles.suggestions}>
          {SUGGESTIONS.map((s) => (
            <Pressable key={s} onPress={() => handleSend(s)} style={styles.chip}>
              <Text style={styles.chipText}>{s}</Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>

      {/* Input + send */}
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="Digite sua pergunta..."
          placeholderTextColor="#9AA4B2"
          multiline
        />
        <Pressable onPress={() => handleSend()} style={styles.sendBtn}>
          <Ionicons name="send" size={22} color="#0B7CFF" />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1387E5',
  },
  subtitle: {
    marginTop: 6,
    fontSize: 14,
    color: '#667085',
  },
  chatBox: {
    marginHorizontal: 16,
    marginTop: 12,
    backgroundColor: '#fff',
    borderRadius: 14,
    minHeight: 260,
    paddingVertical: 10,
    // sombra leve
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  placeholder: {
    paddingHorizontal: 12,
    paddingTop: 10,
    color: '#94A3B8',
  },
  thinking: {
    paddingHorizontal: 12,
    paddingBottom: 12,
    color: '#475569',
    fontStyle: 'italic',
  },
  error: {
    paddingHorizontal: 12,
    paddingBottom: 12,
    color: '#B00020',
  },
  suggestions: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 6,
    flexWrap: 'wrap',
  },
  chip: {
    backgroundColor: '#D9EAFE',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
  },
  chipText: { color: '#1D4ED8', fontWeight: '600' },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F7FAFF',
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    borderRadius: 24,
    backgroundColor: '#fff',
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 16,
    color: '#1F2937',
  },
  sendBtn: {
    padding: 8,
    borderRadius: 999,
    backgroundColor: '#E6F4FE',
  },
});
