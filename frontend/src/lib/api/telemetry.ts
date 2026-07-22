import { apiClient } from './client';
import { TelemetryResponse } from './types';

export const telemetryApi = {
  getHistory: (machineId: string, limit: number = 100) => 
    apiClient.get<TelemetryResponse>(`/api/telemetry/history?machine_id=${encodeURIComponent(machineId)}&limit=${limit}`),
};
