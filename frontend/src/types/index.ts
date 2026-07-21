/**
 * Shared TypeScript types for the IOB frontend foundation.
 * Domain-specific types (Signals, Assets, Workflows, etc.) will be added
 * alongside their features in later phases.
 */

export interface BaseEntity {
  id: string;
  createdAt?: string;
  updatedAt?: string;
}

export type ConnectionStatus = "connected" | "connecting" | "disconnected" | "degraded";

export interface EnvironmentConfig {
  name: string;
  version: string;
  build?: string;
}
