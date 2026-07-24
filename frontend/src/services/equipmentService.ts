/**
 * Equipment Domain Service
 *
 * Migrated from the legacy Axios-based client (`src/lib/api.ts`) to the
 * unified centralized `HttpClient`. All requests now flow through the
 * single `api` singleton, gaining automatic auth injection, token refresh,
 * correlation IDs, and unified error handling.
 *
 * Usage:
 *   import { EquipmentService } from '@/services/equipmentService';
 *   const list = await EquipmentService.getAll();
 */

import { api } from '@/api';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Equipment {
  id: string;
  name: string;
  status: 'OPERATIONAL' | 'MAINTENANCE' | 'OFFLINE';
  /** Optional metadata fields returned by the backend. */
  description?: string;
  location?: string;
  lastUpdated?: string;
}

export interface EquipmentStatusUpdate {
  status: Equipment['status'];
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

export const EquipmentService = {
  /** Fetch all equipment records. */
  async getAll(): Promise<Equipment[]> {
    return api.get<Equipment[]>('/equipment');
  },

  /** Fetch a single equipment record by ID. */
  async getById(id: string): Promise<Equipment> {
    return api.get<Equipment>(`/equipment/${id}`);
  },

  /** Update the operational status of an equipment asset. */
  async updateStatus(
    id: string,
    status: Equipment['status'],
  ): Promise<Equipment> {
    return api.patch<Equipment>(`/equipment/${id}`, { status });
  },

  /** Create a new equipment record. */
  async create(data: Omit<Equipment, 'id'>): Promise<Equipment> {
    return api.post<Equipment>('/equipment', data);
  },

  /** Delete an equipment record by ID. */
  async remove(id: string): Promise<void> {
    return api.delete<void>(`/equipment/${id}`);
  },
};
