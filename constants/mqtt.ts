// constants/mqtt.ts
export const MQTT_BROKER_URL = 'wss://broker.hivemq.com:8884/mqtt'; // WebSocket seguro
export const MQTT_TOPIC = 'sensorestcc/#'; // casa com o Python (sensorestcc/+ também serve)

export type SensorId =
  | 'frequencia-respiratoria'
  | 'batimentos-cardiacos'
  | 'saturacao'
  | 'temperatura-corporal'
  | 'temperatura-ambiente'
  | 'temperatura-oximetro'
  | 'qualidade-ar-pm25'
  | 'qualidade-ar-pm10'
  | 'qualidade-ar-aqi'
  | 'qualidade-ar-o3'
  | 'qualidade-ar-no2'
  | 'qualidade-ar-so2'
  | 'piezo'
  | 'contagem-tosse'
  | 'som'
  | 'umidade'
  | 'acelerometro-x'
  | 'acelerometro-y'
  | 'acelerometro-z'
  | 'giroscopio-x'
  | 'giroscopio-y'
  | 'giroscopio-z';

export const SENSORS_META: Record<
  SensorId,
  { label: string; unit: string; description?: string }
> = {
  'frequencia-respiratoria': { label: 'Frequência Respiratória', unit: 'rpm' },
  'batimentos-cardiacos': { label: 'Batimentos Cardíacos', unit: 'bpm' },
  saturacao: { label: 'Saturação de Oxigênio (SpO₂)', unit: '%' },
  'temperatura-corporal': { label: 'Temperatura Corporal', unit: '°C' },
  'temperatura-ambiente': { label: 'Temperatura Ambiente', unit: '°C' },
  'temperatura-oximetro': { label: 'Temperatura Oxímetro', unit: '°C' },
  'qualidade-ar-pm25': { label: 'Qualidade do Ar (PM2.5)', unit: 'µg/m³' },
  'qualidade-ar-pm10': { label: 'Qualidade do Ar (PM10)', unit: 'µg/m³' },
  'qualidade-ar-aqi': { label: 'Índice de Qualidade do Ar (AQI)', unit: '' },
  'qualidade-ar-o3': { label: 'Ozônio (O₃)', unit: 'µg/m³' },
  'qualidade-ar-no2': { label: 'Dióxido de Nitrogênio (NO₂)', unit: 'µg/m³' },
  'qualidade-ar-so2': { label: 'Dióxido de Enxofre (SO₂)', unit: 'µg/m³' },
  piezo: { label: 'Movimento Torácico (Piezo)', unit: 'Hz' },
  'contagem-tosse': { label: 'Contagem Tosse', unit: 'no dia' },
  som: { label: 'Som', unit: 'no dia' },
  umidade: { label: 'Umidade do Ar', unit: '%' },
  'acelerometro-x': { label: 'Acelerômetro X', unit: '' },
  'acelerometro-y': { label: 'Acelerômetro Y', unit: '' },
  'acelerometro-z': { label: 'Acelerômetro Z', unit: '' },
  'giroscopio-x': { label: 'Giroscópio X', unit: '' },
  'giroscopio-y': { label: 'Giroscópio Y', unit: '' },
  'giroscopio-z': { label: 'Giroscópio Z', unit: '' },
};