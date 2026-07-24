import { api } from '@/api';
import { TokenResponse } from '../types/apiContracts';

export const authService = {
  /**
   * Encodes login requests as application/x-www-form-urlencoded
   * to align with FastAPI OAuth2PasswordRequestForm expectations.
   */
  async login(username: string, password: string): Promise<TokenResponse> {
    const formData = new URLSearchParams();
    formData.append('username', username);
    formData.append('password', password);

    return api.post<TokenResponse>('/api/v1/auth/token', formData, {
      skipAuth: true,
    });
  },

  async refresh(refreshToken: string): Promise<TokenResponse> {
    return api.post<TokenResponse>('/api/v1/auth/refresh', {
      refresh_token: refreshToken,
    }, { skipAuth: true });
  },
};
