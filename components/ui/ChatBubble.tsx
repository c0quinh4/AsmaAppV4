// components/ui/ChatBubble.tsx
import { View, Text, StyleSheet } from 'react-native';

export default function ChatBubble({
  content,
  role,
}: {
  content: string;
  role: 'user' | 'model';
}) {
  const isUser = role === 'user';
  return (
    <View style={[styles.wrap, isUser ? styles.right : styles.left]}>
      <View style={[styles.bubble, isUser ? styles.user : styles.model]}>
        <Text style={styles.text}>{content}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingVertical: 6, paddingHorizontal: 10 },
  left: { alignItems: 'flex-start' },
  right: { alignItems: 'flex-end' },
  bubble: {
    maxWidth: '92%',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  user: { backgroundColor: '#E6F4FE' },
  model: { backgroundColor: '#FFFFFF' },
  text: { fontSize: 16, lineHeight: 22 },
});
