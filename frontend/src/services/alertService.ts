import { api } from '@/api';
import {
  AlertSchema,
  AcknowledgeAlertRequest,
  PaginatedResponse,
  AlertFilters,
} from '../types/apiContracts';

export const alertService = {
  async listAlerts(
    page = 1,
    size = 20,
    filters?: AlertFilters,
  ): Promise<PaginatedResponse<AlertSchema>> {
    return api.get<PaginatedResponse<AlertSchema>>('/api/v1/alerts', {
      params: { page, size, ...filters },
    });
  },

  async ackAlert(
    alertId: string,
    payload: AcknowledgeAlertRequest,
  ): Promise<AlertSchema> {
    return api.patch<AlertSchema>(`/api/v1/alerts/${alertId}/ack`, payload);
  },
};
