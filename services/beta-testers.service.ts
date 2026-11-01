import { fetchApi } from '@/lib/api-client';

export type TesterStatus = 'PENDING' | 'APPROVED' | 'INVITED' | 'REJECTED';
export type PlatformType = 'ANDROID' | 'IOS' | 'ALL';

export interface BetaGroup {
  id: string;
  name: string;
  description?: string | null;
  color?: string | null;
  targetPlatforms: string[];
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: {
    testers: number;
  };
}

export interface BetaTester {
  id: string;
  email: string;
  fullName?: string | null;
  platforms: string[]; // ["ANDROID"], ["IOS"], ou ["ANDROID", "IOS"]
  status: TesterStatus;
  androidStatus: string;
  iosStatus: string;
  termsAccepted: boolean;
  termsAcceptedAt?: string | null;
  groupId?: string | null;
  group?: BetaGroup | null;
  androidInvitedAt?: string | null;
  iosInvitedAt?: string | null;
  androidInviteCount: number;
  iosInviteCount: number;
  playLinkSent?: string | null;
  testFlightLinkSent?: string | null;
  unsubscribeToken?: string | null;
  unsubscribedAt?: string | null;
  unsubscribeReason?: string | null;
  notes?: string | null;
  lastContactedAt?: string | null;
  deviceModel?: string | null;
  androidVersion?: string | null;
  _count?: {
    feedbacks: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface BetaVersion {
  id: string;
  version: string;
  buildNumber: number;
  platform: 'ANDROID' | 'IOS' | 'ALL';
  title?: string | null;
  releaseNotes?: string | null;
  knownIssues?: string | null;
  downloadUrl?: string | null;
  status: string; // "DRAFT" | "ACTIVE" | "EXPIRED" | "ARCHIVED"
  publishedAt: string;
  notifiedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BetaFeedback {
  id: string;
  testerId?: string | null;
  tester?: {
    id: string;
    email: string;
    fullName?: string | null;
    platforms: string[];
  } | null;
  email: string;
  category: string;
  title?: string | null;
  description: string;
  platform: string;
  appVersion?: string | null;
  deviceInfo?: string | null;
  screenshotUrl?: string | null;
  status: string; // "NEW" | "IN_PROGRESS" | "RESOLVED" | "REJECTED" | "CLOSED"
  priority: string; // "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"
  internalNotes?: string | null;
  assignedTo?: string | null;
  resolvedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BetaEmailTemplate {
  id: string;
  code: string;
  name: string;
  subject: string;
  title: string;
  senderName?: string | null;
  contentHtml: string;
  contentText?: string | null;
  buttonText?: string | null;
  buttonUrl?: string | null;
  secondaryButtonText?: string | null;
  secondaryButtonUrl?: string | null;
  footerText?: string | null;
  accentColor?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BetaAutomationConfig {
  id: string;
  autoConfirmRegistration: boolean;
  autoInviteOnApproval: boolean;
  autoNotifyNewVersions: boolean;
  reminderIntervalDays: number;
  feedbackRequestDays: number;
  playStoreWebLink: string;
  playStoreAppLink: string;
  testFlightPublicLink?: string | null;
  supportEmail: string;
}

export interface BetaTesterStats {
  total: number;
  androidCount: number;
  iosCount: number;
  bothPlatformsCount: number;
  pendingCount: number;
  invitedCount: number;
  activeCount: number;
  unsubscribedCount: number;
  feedbacksCount: number;
  // Rétrocompatibilité
  pending?: number;
  approved?: number;
  invited?: number;
  rejected?: number;
}

export interface BetaTestersResponse {
  data: BetaTester[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  stats: BetaTesterStats;
}

export interface BetaFeedbacksResponse {
  data: BetaFeedback[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  counts: Record<string, number>;
}

export interface ExportCsvResponse {
  count: number;
  csv: string;
  emailsOnly: string;
}

export interface ExportEmailsResponse {
  count: number;
  emails: string[];
  commaSeparated?: string;
  csvFormat?: string;
}

export const betaTestersService = {
  // ─── PARTICIPANTS ──────────────────────────────────────────────────────────

  async getTesters(params?: {
    status?: string;
    androidStatus?: string;
    iosStatus?: string;
    groupId?: string;
    platform?: 'ANDROID' | 'IOS' | 'ALL';
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<BetaTestersResponse> {
    const query = new URLSearchParams();
    if (params?.status && params.status !== 'ALL') query.set('status', params.status);
    if (params?.androidStatus && params.androidStatus !== 'ALL') query.set('androidStatus', params.androidStatus);
    if (params?.iosStatus && params.iosStatus !== 'ALL') query.set('iosStatus', params.iosStatus);
    if (params?.groupId && params.groupId !== 'ALL') query.set('groupId', params.groupId);
    if (params?.platform && params.platform !== 'ALL') query.set('platform', params.platform);
    if (params?.search) query.set('search', params.search);
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));

    const qs = query.toString();
    return fetchApi<BetaTestersResponse>(`/api/beta-testers${qs ? `?${qs}` : ''}`);
  },

  async getTester(id: string): Promise<BetaTester> {
    return fetchApi<BetaTester>(`/api/beta-testers/${id}`);
  },

  async updateTester(id: string, data: Partial<BetaTester>): Promise<BetaTester> {
    return fetchApi<BetaTester>(`/api/beta-testers/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  async updateStatus(
    id: string,
    status: TesterStatus,
    notes?: string
  ): Promise<BetaTester> {
    return fetchApi<BetaTester>(`/api/beta-testers/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, notes }),
    });
  },

  async sendAndroidInvite(id: string): Promise<{ success: boolean; message: string; tester: BetaTester }> {
    return fetchApi<{ success: boolean; message: string; tester: BetaTester }>(
      `/api/beta-testers/${id}/send-android-invite`,
      { method: 'POST' }
    );
  },

  async sendIosInvite(id: string): Promise<{ success: boolean; message: string; tester: BetaTester }> {
    return fetchApi<{ success: boolean; message: string; tester: BetaTester }>(
      `/api/beta-testers/${id}/send-ios-invite`,
      { method: 'POST' }
    );
  },

  async bulkAction(params: {
    testerIds: string[];
    action: 'INVITE_ANDROID' | 'INVITE_IOS' | 'INVITE_BOTH' | 'ASSIGN_GROUP' | 'CHANGE_STATUS' | 'DELETE';
    targetGroupId?: string;
    targetStatus?: string;
  }): Promise<{ success: boolean; successCount: number; failedCount: number; message: string }> {
    return fetchApi<{ success: boolean; successCount: number; failedCount: number; message: string }>(
      '/api/beta-testers/bulk-action',
      {
        method: 'POST',
        body: JSON.stringify(params),
      }
    );
  },

  async exportEmails(status?: string): Promise<ExportEmailsResponse> {
    const qs = status && status !== 'ALL' ? `?status=${status}` : '';
    return fetchApi<ExportEmailsResponse>(`/api/beta-testers/export${qs}`);
  },

  async exportCsv(params?: { platform?: string; status?: string }): Promise<ExportCsvResponse> {
    const query = new URLSearchParams();
    if (params?.platform && params.platform !== 'ALL') query.set('platform', params.platform);
    if (params?.status && params.status !== 'ALL') query.set('status', params.status);
    const qs = query.toString();
    return fetchApi<ExportCsvResponse>(`/api/beta-testers/export-csv${qs ? `?${qs}` : ''}`);
  },

  async deleteTester(id: string): Promise<{ success: boolean; message: string }> {
    return fetchApi<{ success: boolean; message: string }>(`/api/beta-testers/${id}`, {
      method: 'DELETE',
    });
  },

  async getStats(): Promise<BetaTesterStats> {
    return fetchApi<BetaTesterStats>('/api/beta-testers/stats');
  },

  // ─── GROUPES / COHORTES ────────────────────────────────────────────────────

  async getGroups(): Promise<BetaGroup[]> {
    return fetchApi<BetaGroup[]>('/api/beta-testers/groups');
  },

  async createGroup(data: {
    name: string;
    description?: string;
    color?: string;
    targetPlatforms?: string[];
    isDefault?: boolean;
  }): Promise<BetaGroup> {
    return fetchApi<BetaGroup>('/api/beta-testers/groups', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateGroup(id: string, data: Partial<BetaGroup>): Promise<BetaGroup> {
    return fetchApi<BetaGroup>(`/api/beta-testers/groups/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  async deleteGroup(id: string): Promise<{ success: boolean; message: string }> {
    return fetchApi<{ success: boolean; message: string }>(`/api/beta-testers/groups/${id}`, {
      method: 'DELETE',
    });
  },

  // ─── VERSIONS BÊTA ─────────────────────────────────────────────────────────

  async getVersions(): Promise<BetaVersion[]> {
    return fetchApi<BetaVersion[]>('/api/beta-testers/versions');
  },

  async createVersion(data: {
    version: string;
    buildNumber: number;
    platform: 'ANDROID' | 'IOS' | 'ALL';
    title?: string;
    releaseNotes?: string;
    knownIssues?: string;
    downloadUrl?: string;
    status?: string;
    notifyTesters?: boolean;
  }): Promise<BetaVersion> {
    return fetchApi<BetaVersion>('/api/beta-testers/versions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateVersion(id: string, data: Partial<BetaVersion>): Promise<BetaVersion> {
    return fetchApi<BetaVersion>(`/api/beta-testers/versions/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  async deleteVersion(id: string): Promise<{ success: boolean; message: string }> {
    return fetchApi<{ success: boolean; message: string }>(`/api/beta-testers/versions/${id}`, {
      method: 'DELETE',
    });
  },

  async notifyVersion(id: string): Promise<{ success: boolean; notifiedCount: number; message: string }> {
    return fetchApi<{ success: boolean; notifiedCount: number; message: string }>(
      `/api/beta-testers/versions/${id}/notify`,
      { method: 'POST' }
    );
  },

  // ─── RETOURS & FEEDBACK ────────────────────────────────────────────────────

  async getFeedbacks(params?: {
    category?: string;
    status?: string;
    platform?: string;
    priority?: string;
    page?: number;
    limit?: number;
  }): Promise<BetaFeedbacksResponse> {
    const query = new URLSearchParams();
    if (params?.category && params.category !== 'ALL') query.set('category', params.category);
    if (params?.status && params.status !== 'ALL') query.set('status', params.status);
    if (params?.platform && params.platform !== 'ALL') query.set('platform', params.platform);
    if (params?.priority && params.priority !== 'ALL') query.set('priority', params.priority);
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));

    const qs = query.toString();
    return fetchApi<BetaFeedbacksResponse>(`/api/beta-testers/feedbacks${qs ? `?${qs}` : ''}`);
  },

  async updateFeedback(
    id: string,
    data: {
      status?: string;
      priority?: string;
      internalNotes?: string;
      assignedTo?: string;
    }
  ): Promise<BetaFeedback> {
    return fetchApi<BetaFeedback>(`/api/beta-testers/feedbacks/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  async deleteFeedback(id: string): Promise<{ success: boolean; message: string }> {
    return fetchApi<{ success: boolean; message: string }>(`/api/beta-testers/feedbacks/${id}`, {
      method: 'DELETE',
    });
  },

  // ─── MODÈLES D'EMAILS ──────────────────────────────────────────────────────

  async getTemplates(): Promise<BetaEmailTemplate[]> {
    return fetchApi<BetaEmailTemplate[]>('/api/beta-testers/templates');
  },

  async getTemplate(code: string): Promise<BetaEmailTemplate> {
    return fetchApi<BetaEmailTemplate>(`/api/beta-testers/templates/${code}`);
  },

  async updateTemplate(code: string, data: Partial<BetaEmailTemplate>): Promise<BetaEmailTemplate> {
    return fetchApi<BetaEmailTemplate>(`/api/beta-testers/templates/${code}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  async sendTestEmail(code: string, email: string): Promise<{ success: boolean; message?: string }> {
    return fetchApi<{ success: boolean; message?: string }>(`/api/beta-testers/templates/${code}/test`, {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  // ─── CONFIGURATION D'AUTOMATISATION ────────────────────────────────────────

  async getAutomationConfig(): Promise<BetaAutomationConfig> {
    return fetchApi<BetaAutomationConfig>('/api/beta-testers/automation-config');
  },

  async updateAutomationConfig(data: Partial<BetaAutomationConfig>): Promise<BetaAutomationConfig> {
    return fetchApi<BetaAutomationConfig>('/api/beta-testers/automation-config', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },
};
