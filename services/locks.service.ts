import { fetchApi } from '@/lib/api-client';
import {
  LocksResponse,
  ModuleLockItem,
  CreateModuleDto,
  UpdateModuleDto,
} from '@/types/lock';

export const locksService = {
  async getLocks(): Promise<LocksResponse> {
    return fetchApi<LocksResponse>('/admin/locks');
  },

  async getLock(key: string): Promise<ModuleLockItem> {
    return fetchApi<ModuleLockItem>(`/admin/locks/${encodeURIComponent(key)}`);
  },

  async createModule(data: CreateModuleDto): Promise<ModuleLockItem> {
    return fetchApi<ModuleLockItem>('/admin/locks', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateModule(key: string, data: UpdateModuleDto): Promise<ModuleLockItem> {
    return fetchApi<ModuleLockItem>(`/admin/locks/${encodeURIComponent(key)}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  async toggleLock(key: string, isLocked: boolean): Promise<ModuleLockItem> {
    return fetchApi<ModuleLockItem>(`/admin/locks/${encodeURIComponent(key)}`, {
      method: 'PATCH',
      body: JSON.stringify({ isLocked }),
    });
  },

  async deleteModule(key: string): Promise<void> {
    await fetchApi(`/admin/locks/${encodeURIComponent(key)}`, {
      method: 'DELETE',
    });
  },
};
