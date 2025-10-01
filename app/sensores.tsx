// app/sensores.tsx
import { ScrollView, View, Text, StyleSheet } from 'react-native';
import { useMqttSensors } from '@/hooks/useMqttSensors';
import SensorCard from '@/components/ui/SensorCard';
import { SENSORS_META, SensorId } from '@/constants/mqtt';
import { useEffect } from 'react';

export default function SensoresScreen() {
  const { connected, sensors } = useMqttSensors();

  // Se quiser logar os updates para debug:
  useEffect(() => {
    // console.log('sensors', sensors);
  }, [sensors]);

  const orderedIds = Object.keys(SENSORS_META) as SensorId[];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Sensores</Text>
        <Text style={[styles.badge, connected ? styles.ok : styles.err]}>
          {connected ? 'Conectado' : 'Desconectado'}
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.list}>
        {orderedIds.map((id) => {
          const meta = SENSORS_META[id];
          const sVal = sensors[id];
          return (
            <SensorCard
              key={id}
              title={meta.label}
              value={sVal?.value as any}
              unit={meta.unit}
              updatedAt={sVal?.updatedAt}
            />
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7FAFF' },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  title: { fontSize: 20, fontWeight: '700' },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    fontSize: 12,
    overflow: 'hidden',
  },
  ok: { backgroundColor: '#E9FFF1', color: '#0E8F44' },
  err: { backgroundColor: '#FFF0F0', color: '#C73939' },
  list: { paddingBottom: 24 },
});
