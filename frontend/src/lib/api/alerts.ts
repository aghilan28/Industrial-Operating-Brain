import { apiClient } from './client';
import { Alert, AlarmAcknowledgeRequest, AlarmResolveRequest } from './types';

export const alertsApi = {
  getAll: (status?: string, limit?: number) => {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (limit) params.append('limit', limit.toString());
    const query = params.toString() ? `?${params.toString()}` : '';
    return apiClient.get<Alert[]>(`/alerts/${query}`);
  },
  acknowledge: (id: string, body?: AlarmAcknowledgeRequest) => 
    apiClient.post<Alert>(`/alerts/${id}/acknowledge`, body),
  resolve: (id: string, body: AlarmResolveRequest) => 
    apiClient.post<Alert>(`/alerts/${id}/resolve`, body),
};
