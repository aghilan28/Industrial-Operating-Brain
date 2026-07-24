import { api } from '@/api';
import {
  AssetSchema,
  AssetDetailSchema,
  PaginatedResponse,
} from '../types/apiContracts';

export const equipmentService = {
  async listAssets(
    page = 1,
    size = 20,
    status?: string,
  ): Promise<PaginatedResponse<AssetSchema>> {
    return api.get<PaginatedResponse<AssetSchema>>('/api/v1/assets', {
      params: { page, size, status },
    });
  },

  async getAssetById(id: string): Promise<AssetDetailSchema> {
    return api.get<AssetDetailSchema>(`/api/v1/assets/${id}`);
  },
};
