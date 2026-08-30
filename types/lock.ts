export type ModuleType = 'GAME' | 'CATEGORY' | 'FEATURE';

export interface ModuleLockItem {
  id: string;
  key: string;
  type: ModuleType;
  nameFr: string;
  nameMg: string;
  imageUrl?: string | null;
  isLocked: boolean;
  lockReason?: string | null;
  minTier?: string | null;
  updatedAt: string;
  createdAt: string;
}

export interface LocksStats {
  total: number;
  locked: number;
  active: number;
}

export interface LocksResponse {
  stats: LocksStats;
  modules: ModuleLockItem[];
}

export interface CreateModuleDto {
  key: string;
  type: 'GAME' | 'CATEGORY';
  nameFr: string;
  nameMg: string;
  imageUrl?: string | null;
  isLocked?: boolean;
  lockReason?: string | null;
}

export interface UpdateModuleDto {
  type?: 'GAME' | 'CATEGORY';
  nameFr?: string;
  nameMg?: string;
  imageUrl?: string | null;
  isLocked?: boolean;
  lockReason?: string | null;
}
