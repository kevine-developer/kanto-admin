export type ModuleType = 'GAME' | 'CATEGORY' | 'FEATURE';

export interface ModuleLockItem {
  id: string;
  key: string;
  type: ModuleType;
  nameFr: string;
  nameMg: string;
  imageUrl?: string | null;
  bgImageUrl?: string | null;
  isLocked: boolean;
  lockReason?: string | null;
  isVisible: boolean;
  minTier?: string | null;
  updatedAt: string;
  createdAt: string;
}

export interface LocksStats {
  total: number;
  locked: number;
  active: number;
  visible?: number;
  hidden?: number;
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
  bgImageUrl?: string | null;
  isLocked?: boolean;
  lockReason?: string | null;
  isVisible?: boolean;
}

export interface UpdateModuleDto {
  type?: 'GAME' | 'CATEGORY';
  nameFr?: string;
  nameMg?: string;
  imageUrl?: string | null;
  bgImageUrl?: string | null;
  isLocked?: boolean;
  lockReason?: string | null;
  isVisible?: boolean;
}
