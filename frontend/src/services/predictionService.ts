import { api } from '@/api';
import {
  FailurePredictionRequest,
  FailurePredictionResponse,
} from '../types/apiContracts';

export const predictionService = {
  async predict(
    payload: FailurePredictionRequest,
  ): Promise<FailurePredictionResponse> {
    return api.post<FailurePredictionResponse>(
      '/api/v1/predictions/failure',
      payload,
    );
  },
};
