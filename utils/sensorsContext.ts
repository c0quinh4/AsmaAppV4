// utils/sensorsContext.ts
import { SENSORS_META, SensorId } from '@/constants/mqtt';

type SensorValue = { value: number | string; updatedAt: number };
type SensorMap = Partial<Record<SensorId, SensorValue>>;

export function buildSensorsContext(sensors: SensorMap): string {
  const keys: SensorId[] = [
    'batimentos-cardiacos',
    'saturacao',
    'temperatura-ambiente',
    'umidade',
    'qualidade-ar-aqi',
    'qualidade-ar-o3',
    'qualidade-ar-no2',
    'qualidade-ar-so2',
    'qualidade-ar-pm25',
    'qualidade-ar-pm10',
  ];

  const lines = keys
    .filter((k) => sensors[k])
    .map((k) => {
      const meta = SENSORS_META[k];
      const v = sensors[k]!.value;
      const unit = meta.unit ? ` ${meta.unit}` : '';
      return `- ${meta.label}: ${v}${unit}`;
    });

  if (!lines.length) return '';
  return `Leituras mais recentes:
${lines.join('\n')}
(Obs.: caso algum valor pareça "0", pode indicar falta de dedo no oxímetro ou sensor sem leitura no momento.)`;
}
