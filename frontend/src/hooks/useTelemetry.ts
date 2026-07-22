import { useTelemetryContext } from '../providers/TelemetryProvider';

export function useTelemetry(topicKey?: string) {
  const { latestValues, history, status, reconnect } = useTelemetryContext();

  if (!topicKey) {
    return { latestValues, history, status, reconnect };
  }

  // Exact match or partial topic match for flex filtering
  const matchingKey = Object.keys(latestValues).find((k) => k.includes(topicKey) || k === topicKey);
  const currentPayload = matchingKey ? latestValues[matchingKey] : undefined;
  const historyData = matchingKey ? history[matchingKey] || [] : [];

  return {
    data: currentPayload,
    history: historyData,
    status,
    reconnect,
  };
}
