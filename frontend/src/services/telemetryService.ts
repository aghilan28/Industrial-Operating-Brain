import { api } from '@/api';
import { TelemetrySeriesResponse, TelemetryQuery } from '../types/apiContracts';

export const telemetryService = {
  async getHistory(
    assetId: string,
    query?: TelemetryQuery,
  ): Promise<TelemetrySeriesResponse> {
    return api.get<TelemetrySeriesResponse>(
      `/api/v1/assets/${assetId}/telemetry`,
      {
        params: {
          ...(query?.start_time ? { start_time: query.start_time } : {}),
          ...(query?.end_time ? { end_time: query.end_time } : {}),
          ...(query?.sensors && query.sensors.length > 0 ? { sensors: query.sensors } : {}),
        },
      },
    );
  },
};
