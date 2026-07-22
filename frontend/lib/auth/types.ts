export interface AuthUser {
  id: string;
  role: string;
  roles: string[];
  permissions: string[];
}

export interface JWTClaims {
  sub: string;
  role?: string;
  roles?: string[];
  permissions?: string[];
  type: 'access' | 'refresh';
  exp: number;
}

export interface AuthState {
  user: AuthUser | null;
  token: string | null;
  status: 'loading' | 'authenticated' | 'unauthenticated';
  error: string | null;
}

export interface AuthContextType extends AuthState {
  login: (token: string) => void;
  logout: () => void;
}
