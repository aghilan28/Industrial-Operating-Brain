import { apiClient } from './client';
import { SystemStatus } from './types';

export const dashboardApi = {
  getSystemStatus: () => apiClient.get<SystemStatus>('/'),
};
