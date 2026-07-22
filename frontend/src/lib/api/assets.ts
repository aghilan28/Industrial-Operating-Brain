import { apiClient } from './client';
import { Asset, AssetDetail } from './types';

export const assetsApi = {
  getAll: () => apiClient.get<Asset[]>('/assets/'),
  getById: (id: string) => apiClient.get<AssetDetail>(`/assets/${id}`),
};
