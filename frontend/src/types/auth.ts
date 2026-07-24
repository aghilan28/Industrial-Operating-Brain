/**
 * Auth payload interfaces — updated for Phase 2 contract alignment.
 */

export interface LoginPayload {
  username: string;
  password: string;
}

export interface RefreshPayload {
  refresh_token: string;
}
