// components/ui/SensorCard.tsx
import { View, Text, StyleSheet } from 'react-native';

type Props = {
  title: string;
  value?: number | string;
  unit?: string;
  updatedAt?: number; // epoch ms
};

function formatTime(ts?: number) {
  if (!ts) return '—';
  const d = new Date(ts);
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

export default function SensorCard({ title, value, unit, updatedAt }: Props) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.row}>
        <Text style={styles.value}>{value ?? 0}</Text>
        {!!unit && <Text style={styles.unit}>{` ${unit}`}</Text>}
      </View>
      <Text style={styles.updated}>Atualizado: {formatTime(updatedAt)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    // borda lateral discreta para lembrar seu design
    borderLeftWidth: 4,
    borderLeftColor: '#e1e8ff',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  title: { fontSize: 16, fontWeight: '600', marginBottom: 8 },
  row: { flexDirection: 'row', alignItems: 'flex-end' },
  value: { fontSize: 28, fontWeight: '700' },
  unit: { fontSize: 16, opacity: 0.8, marginLeft: 4 },
  updated: { marginTop: 6, fontSize: 12, opacity: 0.7 },
});
