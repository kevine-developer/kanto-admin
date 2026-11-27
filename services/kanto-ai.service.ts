import { fetchApi } from '@/lib/api-client';
import { getApiBaseUrl } from '@/lib/config';

export interface AiConversationSummary {
  id: string;
  title: string;
  defaultPlatform: string | null;
  defaultLanguage: string | null;
  defaultTone: string | null;
  campaignId: string | null;
  lastMessageAt: string;
  createdAt: string;
  _count?: {
    messages: number;
    drafts: number;
  };
}

export interface AiSourceTrace {
  documentId: string;
  title: string;
  category: string;
  version: string;
  source: string;
  heading?: string | null;
  score: number;
}

export interface AiToolTrace {
  toolName: string;
  args: Record<string, unknown>;
  executedAt: string;
  durationMs: number;
  summary: string;
}

export interface AiDeliverable {
  title: string;
  platform: string;
  language: string;
  tone?: string;
  body: string;
  hashtags: string[];
  cta?: string;
  visualConcept?: string;
  visualAspectRatio?: string;
  imagePrompt?: string;
}

export interface AiMessageItem {
  id: string;
  conversationId: string;
  role: 'USER' | 'ASSISTANT' | 'SYSTEM' | 'TOOL';
  content: string;
  toolCallsJson?: AiToolTrace[] | null;
  sourcesJson?: AiSourceTrace[] | null;
  deliverableJson?: AiDeliverable | null;
  provider?: string | null;
  model?: string | null;
  inputTokens: number;
  outputTokens: number;
  estimatedCostUsd: number;
  latencyMs: number;
  createdAt: string;
}

export interface AiConversationDetail extends AiConversationSummary {
  contextSummary?: string | null;
  messages: AiMessageItem[];
}

export type AiKnowledgeStatus = 'DRAFT' | 'VALIDATED' | 'ARCHIVED';
export type AiKnowledgeVisibility = 'ADMIN_ONLY' | 'INTERNAL_TEAM';

export interface AiKnowledgeDocument {
  id: string;
  slug: string;
  title: string;
  category: string;
  version: string;
  source: string;
  validationStatus: AiKnowledgeStatus;
  visibilityScope: AiKnowledgeVisibility;
  content: string;
  lastIndexedAt?: string | null;
  updatedAt: string;
  _count?: { chunks: number };
}

export type AiFeatureStatus =
  | 'AVAILABLE'
  | 'BETA'
  | 'IN_DEVELOPMENT'
  | 'PLANNED'
  | 'DEPRECATED';

export interface AiFeatureItem {
  id: string;
  key: string;
  nameFr: string;
  nameMg: string;
  category: string;
  status: AiFeatureStatus;
  platforms: string[];
  description: string;
  notes?: string | null;
  updatedAt: string;
}

export type AiDraftStatus = 'DRAFT' | 'READY' | 'APPROVED' | 'ARCHIVED';

export interface AiMarketingDraft {
  id: string;
  title: string;
  platform: string;
  language: string;
  tone?: string | null;
  body: string;
  hashtags: string[];
  cta?: string | null;
  visualConcept?: string | null;
  visualAspectRatio?: string | null;
  imagePrompt?: string | null;
  status: AiDraftStatus;
  conversationId?: string | null;
  campaignId?: string | null;
  updatedAt: string;
}

export interface AiUsageSummary {
  periodDays: number;
  provider: string;
  defaultModel: string;
  isConfigured: boolean;
  supportedModels: string[];
  quota: {
    dailyUsed: number;
    dailyLimit: number;
    monthlyBudgetUsd: number;
  };
  totals: {
    requests: number;
    inputTokens: number;
    outputTokens: number;
    estimatedCostUsd: number;
  };
  byModel: Array<{
    provider: string;
    model: string;
    requests: number;
    inputTokens: number;
    outputTokens: number;
    estimatedCostUsd: number;
  }>;
  recentLogs: Array<{
    id: string;
    provider: string;
    model: string;
    operation: string;
    inputTokens: number;
    outputTokens: number;
    estimatedCostUsd: number;
    latencyMs: number;
    status: string;
    errorCode?: string | null;
    createdAt: string;
  }>;
}

export const AI_PLATFORMS = [
  { value: 'FACEBOOK', label: 'Facebook' },
  { value: 'INSTAGRAM', label: 'Instagram' },
  { value: 'TIKTOK', label: 'TikTok / Reels' },
  { value: 'YOUTUBE', label: 'YouTube' },
  { value: 'THREADS', label: 'Threads' },
  { value: 'LINKEDIN', label: 'LinkedIn' },
  { value: 'NEWSLETTER', label: 'Newsletter' },
  { value: 'PRESS', label: 'Communiqué' },
  { value: 'SEO_BLOG', label: 'Article SEO / Blog' },
  { value: 'VIDEO_SCRIPT', label: 'Script vidéo' },
] as const;

export const AI_LANGUAGES = [
  { value: 'BILINGUAL', label: 'Bilingue (FR / MG)' },
  { value: 'FR', label: 'Français' },
  { value: 'MG', label: 'Malagasy' },
] as const;

export interface SseCallbacks {
  onChunk?: (delta: string) => void;
  onSources?: (sources: AiSourceTrace[]) => void;
  onToolCall?: (call: { name: string; args: Record<string, unknown> }) => void;
  onToolResult?: (trace: AiToolTrace) => void;
  onDeliverable?: (payload: { messageId: string; deliverable: AiDeliverable }) => void;
  onUsage?: (usage: {
    provider: string;
    model: string;
    inputTokens: number;
    outputTokens: number;
    estimatedCostUsd: number;
    latencyMs: number;
  }) => void;
  onDone?: (payload: {
    messageId?: string;
    cleanText?: string;
    deliverable?: AiDeliverable | null;
    sources?: AiSourceTrace[];
    toolTraces?: AiToolTrace[];
    aborted?: boolean;
  }) => void;
  onError?: (message: string) => void;
}

async function consumeSseResponse(
  response: Response,
  callbacks: SseCallbacks,
): Promise<void> {
  if (!response.ok) {
    let errMsg = `Erreur HTTP ${response.status}`;
    try {
      const json = (await response.json()) as { message?: string };
      if (json.message) errMsg = json.message;
    } catch {
      // ignorer
    }
    throw new Error(errMsg);
  }

  if (!response.body) {
    throw new Error('Flux SSE indisponible depuis le serveur.');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let buffer = '';

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const blocks = buffer.split('\n\n');
    buffer = blocks.pop() ?? '';

    for (const block of blocks) {
      if (!block.trim()) continue;
      let eventName = 'message';
      const dataLines: string[] = [];

      for (const line of block.split('\n')) {
        if (line.startsWith('event:')) {
          eventName = line.slice(6).trim();
        } else if (line.startsWith('data:')) {
          dataLines.push(line.slice(5).trim());
        }
      }

      if (dataLines.length === 0) continue;
      const rawData = dataLines.join('\n');
      let parsed: Record<string, unknown>;
      try {
        parsed = JSON.parse(rawData) as Record<string, unknown>;
      } catch {
        continue;
      }

      switch (eventName) {
        case 'chunk':
          if (typeof parsed.delta === 'string') callbacks.onChunk?.(parsed.delta);
          break;
        case 'sources':
          callbacks.onSources?.((parsed.ragSources as AiSourceTrace[]) || []);
          break;
        case 'tool_call':
          callbacks.onToolCall?.(parsed as { name: string; args: Record<string, unknown> });
          break;
        case 'tool_result':
          callbacks.onToolResult?.(parsed as unknown as AiToolTrace);
          break;
        case 'deliverable':
          callbacks.onDeliverable?.(
            parsed as { messageId: string; deliverable: AiDeliverable },
          );
          break;
        case 'usage':
          callbacks.onUsage?.(
            parsed as {
              provider: string;
              model: string;
              inputTokens: number;
              outputTokens: number;
              estimatedCostUsd: number;
              latencyMs: number;
            },
          );
          break;
        case 'done':
          callbacks.onDone?.(parsed);
          break;
        case 'error':
          callbacks.onError?.(
            typeof parsed.message === 'string'
              ? parsed.message
              : 'Erreur de génération IA.',
          );
          break;
        default:
          break;
      }
    }
  }
}

export const kantoAiService = {
  async listConversations(search?: string): Promise<AiConversationSummary[]> {
    const qs = search?.trim() ? `?search=${encodeURIComponent(search.trim())}` : '';
    return (await fetchApi<AiConversationSummary[]>(`/admin/ai/conversations${qs}`)) || [];
  },

  async createConversation(input?: {
    title?: string;
    defaultPlatform?: string;
    defaultLanguage?: string;
    defaultTone?: string;
  }): Promise<AiConversationSummary> {
    return fetchApi<AiConversationSummary>('/admin/ai/conversations', {
      method: 'POST',
      body: JSON.stringify(input || {}),
    });
  },

  async getConversation(id: string): Promise<AiConversationDetail> {
    return fetchApi<AiConversationDetail>(`/admin/ai/conversations/${id}`);
  },

  async updateConversation(
    id: string,
    input: {
      title?: string;
      defaultPlatform?: string;
      defaultLanguage?: string;
      defaultTone?: string;
    },
  ): Promise<AiConversationSummary> {
    return fetchApi<AiConversationSummary>(`/admin/ai/conversations/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    });
  },

  async deleteConversation(id: string): Promise<void> {
    await fetchApi(`/admin/ai/conversations/${id}`, { method: 'DELETE' });
  },

  async streamMessage(
    conversationId: string,
    payload: {
      content: string;
      platform?: string;
      language?: string;
      objective?: string;
      tone?: string;
      model?: string;
    },
    callbacks: SseCallbacks,
    signal?: AbortSignal,
  ): Promise<void> {
    const response = await fetch(
      `${getApiBaseUrl()}/admin/ai/conversations/${conversationId}/messages/stream`,
      {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal,
      },
    );
    await consumeSseResponse(response, callbacks);
  },

  async regenerateReply(
    conversationId: string,
    callbacks: SseCallbacks,
    signal?: AbortSignal,
    model?: string,
  ): Promise<void> {
    const response = await fetch(
      `${getApiBaseUrl()}/admin/ai/conversations/${conversationId}/regenerate`,
      {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(model ? { model } : {}),
        signal,
      },
    );
    await consumeSseResponse(response, callbacks);
  },

  async listKnowledge(): Promise<AiKnowledgeDocument[]> {
    return (await fetchApi<AiKnowledgeDocument[]>('/admin/ai/knowledge')) || [];
  },

  async createKnowledge(input: {
    title: string;
    category: string;
    version?: string;
    source?: string;
    validationStatus: AiKnowledgeStatus;
    visibilityScope: AiKnowledgeVisibility;
    content: string;
  }): Promise<AiKnowledgeDocument> {
    return fetchApi<AiKnowledgeDocument>('/admin/ai/knowledge', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  async updateKnowledge(
    id: string,
    input: Partial<{
      title: string;
      category: string;
      version: string;
      source: string;
      validationStatus: AiKnowledgeStatus;
      visibilityScope: AiKnowledgeVisibility;
      content: string;
    }>,
  ): Promise<AiKnowledgeDocument> {
    return fetchApi<AiKnowledgeDocument>(`/admin/ai/knowledge/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    });
  },

  async reindexKnowledge(id: string): Promise<{ chunksIndexed: number }> {
    return fetchApi<{ chunksIndexed: number }>(`/admin/ai/knowledge/${id}/reindex`, {
      method: 'POST',
    });
  },

  async deleteKnowledge(id: string): Promise<void> {
    await fetchApi(`/admin/ai/knowledge/${id}`, { method: 'DELETE' });
  },

  async listFeatures(): Promise<AiFeatureItem[]> {
    return (await fetchApi<AiFeatureItem[]>('/admin/ai/features')) || [];
  },

  async updateFeature(
    id: string,
    input: Partial<{
      status: AiFeatureStatus;
      description: string;
      notes: string;
    }>,
  ): Promise<AiFeatureItem> {
    return fetchApi<AiFeatureItem>(`/admin/ai/features/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    });
  },

  async listDrafts(): Promise<AiMarketingDraft[]> {
    return (await fetchApi<AiMarketingDraft[]>('/admin/ai/drafts')) || [];
  },

  async saveDraft(input: {
    title: string;
    platform: string;
    language: string;
    tone?: string;
    body: string;
    hashtags?: string[];
    cta?: string;
    visualConcept?: string;
    visualAspectRatio?: string;
    imagePrompt?: string;
    status?: AiDraftStatus;
    conversationId?: string;
    sourceMessageId?: string;
  }): Promise<AiMarketingDraft> {
    return fetchApi<AiMarketingDraft>('/admin/ai/drafts', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  async updateDraft(
    id: string,
    input: Partial<{
      title: string;
      platform: string;
      language: string;
      tone: string;
      body: string;
      hashtags: string[];
      cta: string;
      visualConcept: string;
      visualAspectRatio: string;
      imagePrompt: string;
      status: AiDraftStatus;
    }>,
  ): Promise<AiMarketingDraft> {
    return fetchApi<AiMarketingDraft>(`/admin/ai/drafts/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    });
  },

  async deleteDraft(id: string): Promise<void> {
    await fetchApi(`/admin/ai/drafts/${id}`, { method: 'DELETE' });
  },

  async getUsageSummary(days = 30): Promise<AiUsageSummary> {
    return fetchApi<AiUsageSummary>(`/admin/ai/usage/summary?days=${days}`);
  },
};
