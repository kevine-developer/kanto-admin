'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AdminShell } from '@/components/layout/AdminShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/lib/hooks/useToast';
import {
  AI_LANGUAGES,
  AI_PLATFORMS,
  AiConversationSummary,
  AiDeliverable,
  AiFeatureItem,
  AiKnowledgeDocument,
  AiMarketingDraft,
  AiMessageItem,
  AiSourceTrace,
  AiToolTrace,
  AiUsageSummary,
  kantoAiService,
} from '@/services/kanto-ai.service';
import { KnowledgePanel } from './components/KnowledgePanel';
import { FeatureRegistryPanel } from './components/FeatureRegistryPanel';
import { DraftsAndUsagePanel } from './components/DraftsAndUsagePanel';
import {
  BarChart3,
  BookOpen,
  Bot,
  Check,
  Copy,
  Database,
  Download,
  FileEdit,
  Layers,
  MessageSquare,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  Search,
  Send,
  Square,
  Trash2,
} from 'lucide-react';

type StudioTab = 'studio' | 'knowledge' | 'features' | 'drafts';

const QUICK_STARTERS = [
  {
    label: 'Bilan bêta réel',
    prompt:
      'Fais-moi un point factuel sur nos métriques produit et le programme bêta Android/iOS, puis propose un post LinkedIn sobre mettant en avant la progression.',
  },
  {
    label: 'Post Proverbe (FR/MG)',
    prompt:
      'Recherche un proverbe malgache sur le fihavanana ou le travail dans le corpus Kanto, vérifie sa traduction exacte, et rédige un post Instagram bilingue.',
  },
  {
    label: 'Annonce mise à jour',
    prompt:
      'Consulte nos dernières versions et l’état des stores pour préparer une newsletter destinée aux bêta-testeurs iOS et Android.',
  },
  {
    label: 'Retours communauté',
    prompt:
      'Synthétise de manière anonymisée les derniers avis et retours bêta, puis suggère 2 axes de communication prioritaires.',
  },
];

export default function KantoAiStudioPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<StudioTab>('studio');

  // Données partagées
  const [conversations, setConversations] = useState<AiConversationSummary[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<AiMessageItem[]>([]);
  const [searchConv, setSearchConv] = useState('');
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameTitle, setRenameTitle] = useState('');

  // Onglets gouvernance
  const [knowledgeDocs, setKnowledgeDocs] = useState<AiKnowledgeDocument[]>([]);
  const [features, setFeatures] = useState<AiFeatureItem[]>([]);
  const [drafts, setDrafts] = useState<AiMarketingDraft[]>([]);
  const [usageSummary, setUsageSummary] = useState<AiUsageSummary | null>(null);

  // Paramètres conversationnels optionnels (non bloquants)
  const [platform, setPlatform] = useState('FACEBOOK');
  const [language, setLanguage] = useState('BILINGUAL');
  const [tone, setTone] = useState('EDITORIAL');
  const [objective, setObjective] = useState('');
  const [promptInput, setPromptInput] = useState('');

  // Streaming & traces temps réel
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [liveSources, setLiveSources] = useState<AiSourceTrace[]>([]);
  const [liveTools, setLiveTools] = useState<AiToolTrace[]>([]);
  const [activeToolName, setActiveToolName] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const chatBottomRef = useRef<HTMLDivElement | null>(null);
  const tempMsgSeqRef = useRef(0);

  // Volet droit : Éditeur & Atelier de contenu
  const [editorDeliverable, setEditorDeliverable] = useState<AiDeliverable>({
    title: '',
    platform: 'FACEBOOK',
    language: 'BILINGUAL',
    tone: 'EDITORIAL',
    body: '',
    hashtags: [],
    cta: '',
    visualConcept: '',
    visualAspectRatio: '4:5',
    imagePrompt: '',
  });
  const [editingDraftId, setEditingDraftId] = useState<string | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<string | undefined>(undefined);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [hashtagsText, setHashtagsText] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  const loadConversations = useCallback(async (query?: string) => {
    try {
      const list = await kantoAiService.listConversations(query);
      setConversations(list);
      return list;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Impossible de charger les sessions.');
      return [];
    }
  }, [toast]);

  const loadGovernanceData = useCallback(async () => {
    try {
      const [docs, feats, savedDrafts, usage] = await Promise.all([
        kantoAiService.listKnowledge(),
        kantoAiService.listFeatures(),
        kantoAiService.listDrafts(),
        kantoAiService.getUsageSummary(30),
      ]);
      setKnowledgeDocs(docs);
      setFeatures(feats);
      setDrafts(savedDrafts);
      setUsageSummary(usage);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur chargement données studio.');
    }
  }, [toast]);

  const selectConversation = useCallback(async (id: string) => {
    try {
      const detail = await kantoAiService.getConversation(id);
      setActiveConvId(detail.id);
      setMessages(detail.messages || []);
      if (detail.defaultPlatform) setPlatform(detail.defaultPlatform);
      if (detail.defaultLanguage) setLanguage(detail.defaultLanguage);
      if (detail.defaultTone) setTone(detail.defaultTone);

      const lastWithDeliverable = [...(detail.messages || [])]
        .reverse()
        .find((m) => m.deliverableJson);
      if (lastWithDeliverable?.deliverableJson) {
        const d = lastWithDeliverable.deliverableJson;
        setEditorDeliverable(d);
        setHashtagsText((d.hashtags || []).join(' '));
        setEditingMessageId(lastWithDeliverable.id);
        setEditingDraftId(null);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Impossible d’ouvrir la session.');
    }
  }, [toast]);

  useEffect(() => {
    async function init() {
      const list = await loadConversations();
      if (list.length > 0) {
        await selectConversation(list[0].id);
      }
      await loadGovernanceData();
    }
    void init();
  }, [loadConversations, selectConversation, loadGovernanceData]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, streamingText]);

  async function handleNewConversation(): Promise<string | null> {
    try {
      const created = await kantoAiService.createConversation({
        title: 'Nouvelle session éditoriale',
        defaultPlatform: platform,
        defaultLanguage: language,
        defaultTone: tone,
      });
      await loadConversations(searchConv);
      setActiveConvId(created.id);
      setMessages([]);
      setLiveSources([]);
      setLiveTools([]);
      return created.id;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Création de session impossible.');
      return null;
    }
  }

  async function handleRenameSubmit(id: string) {
    if (!renameTitle.trim()) {
      setRenamingId(null);
      return;
    }
    try {
      await kantoAiService.updateConversation(id, { title: renameTitle.trim() });
      setRenamingId(null);
      await loadConversations(searchConv);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Renommage impossible.');
    }
  }

  async function handleDeleteConversation(id: string) {
    if (!window.confirm('Supprimer cette conversation de l’historique ?')) return;
    try {
      await kantoAiService.deleteConversation(id);
      const list = await loadConversations(searchConv);
      if (activeConvId === id) {
        if (list.length > 0) {
          await selectConversation(list[0].id);
        } else {
          setActiveConvId(null);
          setMessages([]);
        }
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Suppression impossible.');
    }
  }

  function applyDeliverableToEditor(deliverable: AiDeliverable, msgId?: string, draftId?: string) {
    setEditorDeliverable({
      ...deliverable,
      hashtags: deliverable.hashtags || [],
      visualAspectRatio: deliverable.visualAspectRatio || '4:5',
    });
    setHashtagsText((deliverable.hashtags || []).join(' '));
    setEditingMessageId(msgId);
    setEditingDraftId(draftId || null);
  }

  async function handleSendMessage(customPrompt?: string) {
    const text = (customPrompt ?? promptInput).trim();
    if (!text || isStreaming) return;

    let convId = activeConvId;
    if (!convId) {
      convId = await handleNewConversation();
      if (!convId) return;
    }

    if (!customPrompt) setPromptInput('');

    tempMsgSeqRef.current += 1;
    const optimisticUserMsg: AiMessageItem = {
      id: `temp_user_${tempMsgSeqRef.current}`,
      conversationId: convId,
      role: 'USER',
      content: text,
      inputTokens: 0,
      outputTokens: 0,
      estimatedCostUsd: 0,
      latencyMs: 0,
      createdAt: '',
    };

    setMessages((prev) => [...prev, optimisticUserMsg]);
    setIsStreaming(true);
    setStreamingText('');
    setLiveSources([]);
    setLiveTools([]);
    setActiveToolName(null);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      await kantoAiService.streamMessage(
        convId,
        {
          content: text,
          platform,
          language,
          tone,
          objective: objective.trim() || undefined,
        },
        {
          onChunk: (delta) => setStreamingText((prev) => prev + delta),
          onSources: (sources) => setLiveSources(sources),
          onToolCall: (call) => setActiveToolName(call.name),
          onToolResult: (trace) => {
            setActiveToolName(null);
            setLiveTools((prev) => [...prev, trace]);
          },
          onDeliverable: ({ messageId, deliverable }) => {
            applyDeliverableToEditor(deliverable, messageId);
          },
          onDone: async (payload) => {
            if (payload.deliverable) {
              applyDeliverableToEditor(payload.deliverable, payload.messageId);
            }
            await selectConversation(convId);
            await loadConversations(searchConv);
            await loadGovernanceData();
          },
          onError: (msg) => {
            toast.error(msg);
          },
        },
        controller.signal,
      );
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        toast.error(err instanceof Error ? err.message : 'Erreur de génération IA.');
      }
    } finally {
      setIsStreaming(false);
      setStreamingText('');
      setActiveToolName(null);
      abortControllerRef.current = null;
    }
  }

  async function handleRegenerate() {
    if (!activeConvId || isStreaming) return;
    setIsStreaming(true);
    setStreamingText('');
    setLiveSources([]);
    setLiveTools([]);
    setActiveToolName(null);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      await kantoAiService.regenerateReply(
        activeConvId,
        {
          onChunk: (delta) => setStreamingText((prev) => prev + delta),
          onSources: (sources) => setLiveSources(sources),
          onToolCall: (call) => setActiveToolName(call.name),
          onToolResult: (trace) => {
            setActiveToolName(null);
            setLiveTools((prev) => [...prev, trace]);
          },
          onDeliverable: ({ messageId, deliverable }) => {
            applyDeliverableToEditor(deliverable, messageId);
          },
          onDone: async () => {
            await selectConversation(activeConvId);
            await loadGovernanceData();
          },
          onError: (msg) => toast.error(msg),
        },
        controller.signal,
      );
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        toast.error(err instanceof Error ? err.message : 'Régénération impossible.');
      }
    } finally {
      setIsStreaming(false);
      setStreamingText('');
      setActiveToolName(null);
      abortControllerRef.current = null;
    }
  }

  function handleStopGeneration() {
    abortControllerRef.current?.abort();
  }

  async function handleSaveDraft() {
    if (!editorDeliverable.title.trim() || !editorDeliverable.body.trim()) {
      toast.error('Le livrable doit contenir un titre et un corps de texte.');
      return;
    }

    const hashtags = hashtagsText
      .split(/[\s,]+/)
      .map((t) => t.trim())
      .filter(Boolean);

    try {
      setIsSavingDraft(true);
      if (editingDraftId) {
        await kantoAiService.updateDraft(editingDraftId, {
          title: editorDeliverable.title,
          platform: editorDeliverable.platform,
          language: editorDeliverable.language,
          tone: editorDeliverable.tone,
          body: editorDeliverable.body,
          hashtags,
          cta: editorDeliverable.cta,
          visualConcept: editorDeliverable.visualConcept,
          visualAspectRatio: editorDeliverable.visualAspectRatio,
          imagePrompt: editorDeliverable.imagePrompt,
        });
        toast.success('Brouillon mis à jour.');
      } else {
        const created = await kantoAiService.saveDraft({
          title: editorDeliverable.title,
          platform: editorDeliverable.platform,
          language: editorDeliverable.language,
          tone: editorDeliverable.tone,
          body: editorDeliverable.body,
          hashtags,
          cta: editorDeliverable.cta,
          visualConcept: editorDeliverable.visualConcept,
          visualAspectRatio: editorDeliverable.visualAspectRatio,
          imagePrompt: editorDeliverable.imagePrompt,
          conversationId: activeConvId || undefined,
          sourceMessageId: editingMessageId,
        });
        setEditingDraftId(created.id);
        toast.success('Brouillon enregistré en base.');
      }
      await loadGovernanceData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Sauvegarde impossible.');
    } finally {
      setIsSavingDraft(false);
    }
  }

  function handleExport(format: 'md' | 'txt' | 'json') {
    const hashtags = hashtagsText.trim();
    let content = '';
    if (format === 'json') {
      content = JSON.stringify(
        {
          ...editorDeliverable,
          hashtags: hashtags ? hashtags.split(/\s+/) : [],
        },
        null,
        2,
      );
    } else if (format === 'md') {
      content = `# ${editorDeliverable.title}\n\n- Plateforme : ${editorDeliverable.platform}\n- Langue : ${editorDeliverable.language}\n\n${editorDeliverable.body}\n\n${editorDeliverable.cta ? `**CTA :** ${editorDeliverable.cta}\n\n` : ''}${hashtags}\n\n---\nConcept visuel (${editorDeliverable.visualAspectRatio || '4:5'}) : ${editorDeliverable.visualConcept || '—'}\nPrompt image : ${editorDeliverable.imagePrompt || '—'}\n`;
    } else {
      content = `${editorDeliverable.title}\n\n${editorDeliverable.body}\n\n${editorDeliverable.cta || ''}\n${hashtags}`.trim();
    }

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kanto-ai-${editorDeliverable.platform.toLowerCase()}.${format}`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const activeConversation = useMemo(
    () => conversations.find((c) => c.id === activeConvId) || null,
    [conversations, activeConvId],
  );

  return (
    <AdminShell>
      <div className="space-y-4">
        <PageHeader
          title="Kanto AI Studio"
          description="Copilote marketing et studio éditorial relié au corpus vérifié, aux métriques réelles et à la base documentaire Kanto MG."
          icon={Bot}
          badge={
            usageSummary ? (
              <span
                className="text-[11px] font-mono px-2 py-0.5 rounded-md"
                style={{
                  background: 'var(--input-bg)',
                  border: '1px solid var(--card-border)',
                  color: 'var(--text-muted)',
                }}
              >
                {usageSummary.provider} / {usageSummary.defaultModel} •{' '}
                {usageSummary.quota.dailyUsed}/{usageSummary.quota.dailyLimit} req aujourd&apos;hui
              </span>
            ) : null
          }
          actions={
            <div className="flex flex-wrap items-center gap-1.5">
              {(
                [
                  { id: 'studio', label: 'Studio IA', icon: MessageSquare },
                  { id: 'knowledge', label: `Base RAG (${knowledgeDocs.length})`, icon: BookOpen },
                  { id: 'features', label: `Registre Produit (${features.length})`, icon: Layers },
                  { id: 'drafts', label: `Brouillons & Coûts (${drafts.length})`, icon: BarChart3 },
                ] as const
              ).map((tab) => {
                const TabIcon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
                    style={{
                      background: isActive ? 'var(--accent)' : 'var(--card)',
                      color: isActive ? '#FFFFFF' : 'var(--foreground)',
                      border: `1px solid ${isActive ? 'var(--accent)' : 'var(--card-border)'}`,
                    }}
                  >
                    <TabIcon size={13} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          }
        />

        {activeTab === 'knowledge' && (
          <KnowledgePanel documents={knowledgeDocs} onRefresh={loadGovernanceData} />
        )}

        {activeTab === 'features' && (
          <FeatureRegistryPanel features={features} onRefresh={loadGovernanceData} />
        )}

        {activeTab === 'drafts' && (
          <DraftsAndUsagePanel
            drafts={drafts}
            usage={usageSummary}
            onRefresh={loadGovernanceData}
            onOpenInEditor={(deliverable, draftId) => {
              applyDeliverableToEditor(deliverable, undefined, draftId);
              setActiveTab('studio');
            }}
          />
        )}

        {activeTab === 'studio' && (
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-start">
            {/* COLONNE 1 : HISTORIQUE PERSISTANT DES SESSIONS */}
            <aside
              className="xl:col-span-3 rounded-xl p-3 flex flex-col gap-3"
              style={{
                background: 'var(--card)',
                border: '1px solid var(--card-border)',
                maxHeight: '78vh',
              }}
            >
              <Button
                size="sm"
                leftIcon={<Plus size={14} />}
                onClick={() => void handleNewConversation()}
                className="w-full"
              >
                Nouvelle session
              </Button>

              <div className="relative">
                <Search
                  size={13}
                  className="absolute left-2.5 top-2.5"
                  style={{ color: 'var(--text-subtle)' }}
                />
                <input
                  value={searchConv}
                  onChange={(e) => {
                    setSearchConv(e.target.value);
                    void loadConversations(e.target.value);
                  }}
                  placeholder="Rechercher une session..."
                  className="w-full rounded-lg pl-8 pr-2.5 py-1.5 text-xs"
                  style={{
                    background: 'var(--input-bg)',
                    border: '1px solid var(--input-border)',
                    color: 'var(--input-text)',
                  }}
                />
              </div>

              <div className="flex-1 overflow-y-auto space-y-1 pr-1">
                {conversations.map((conv) => {
                  const isSel = conv.id === activeConvId;
                  return (
                    <div
                      key={conv.id}
                      className="rounded-lg p-2.5 transition-colors"
                      style={{
                        background: isSel ? 'var(--accent-light)' : 'var(--input-bg)',
                        border: `1px solid ${isSel ? 'var(--accent-border)' : 'var(--card-border)'}`,
                      }}
                    >
                      {renamingId === conv.id ? (
                        <div className="flex items-center gap-1">
                          <input
                            value={renameTitle}
                            onChange={(e) => setRenameTitle(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') void handleRenameSubmit(conv.id);
                              if (e.key === 'Escape') setRenamingId(null);
                            }}
                            autoFocus
                            className="flex-1 rounded px-1.5 py-1 text-xs"
                            style={{
                              background: 'var(--surface)',
                              border: '1px solid var(--input-border)',
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => void handleRenameSubmit(conv.id)}
                            className="p-1 cursor-pointer"
                            title="Valider"
                          >
                            <Check size={13} />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-start justify-between gap-1.5">
                          <button
                            type="button"
                            onClick={() => void selectConversation(conv.id)}
                            className="text-left flex-1 min-w-0 cursor-pointer"
                          >
                            <div className="text-xs font-semibold truncate">{conv.title}</div>
                            <div className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                              {conv._count?.messages ?? 0} msg •{' '}
                              {new Date(conv.lastMessageAt).toLocaleDateString('fr-FR')}
                            </div>
                          </button>
                          <div className="flex items-center gap-0.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => {
                                setRenamingId(conv.id);
                                setRenameTitle(conv.title);
                              }}
                              className="p-1 rounded hover:opacity-75 cursor-pointer"
                              title="Renommer"
                            >
                              <Pencil size={11} />
                            </button>
                            <button
                              type="button"
                              onClick={() => void handleDeleteConversation(conv.id)}
                              className="p-1 rounded text-red-500 hover:opacity-75 cursor-pointer"
                              title="Supprimer"
                            >
                              <Trash2 size={11} />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}

                {conversations.length === 0 && (
                  <p className="text-xs text-center py-6" style={{ color: 'var(--text-muted)' }}>
                    Aucune session enregistrée.
                  </p>
                )}
              </div>
            </aside>

            {/* COLONNE 2 : CONVERSATION, STREAMING & SOURCES */}
            <section
              className="xl:col-span-5 rounded-xl flex flex-col"
              style={{
                background: 'var(--card)',
                border: '1px solid var(--card-border)',
                height: '78vh',
              }}
            >
              {/* Paramètres optionnels non bloquants */}
              <div
                className="p-3 border-b grid grid-cols-2 sm:grid-cols-4 gap-2"
                style={{ borderColor: 'var(--card-border)' }}
              >
                <select
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value)}
                  className="rounded-lg px-2 py-1.5 text-xs"
                  style={{
                    background: 'var(--input-bg)',
                    border: '1px solid var(--input-border)',
                    color: 'var(--input-text)',
                  }}
                  aria-label="Plateforme cible"
                >
                  {AI_PLATFORMS.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </select>

                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="rounded-lg px-2 py-1.5 text-xs"
                  style={{
                    background: 'var(--input-bg)',
                    border: '1px solid var(--input-border)',
                    color: 'var(--input-text)',
                  }}
                  aria-label="Langue"
                >
                  {AI_LANGUAGES.map((l) => (
                    <option key={l.value} value={l.value}>
                      {l.label}
                    </option>
                  ))}
                </select>

                <select
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                  className="rounded-lg px-2 py-1.5 text-xs"
                  style={{
                    background: 'var(--input-bg)',
                    border: '1px solid var(--input-border)',
                    color: 'var(--input-text)',
                  }}
                  aria-label="Ton éditorial"
                >
                  <option value="EDITORIAL">Éditorial sobre</option>
                  <option value="PEDAGOGICAL">Pédagogique</option>
                  <option value="NARRATIVE">Narratif / Conte</option>
                  <option value="INSTITUTIONAL">Institutionnel</option>
                </select>

                <input
                  value={objective}
                  onChange={(e) => setObjective(e.target.value)}
                  placeholder="Objectif (optionnel)"
                  className="rounded-lg px-2 py-1.5 text-xs"
                  style={{
                    background: 'var(--input-bg)',
                    border: '1px solid var(--input-border)',
                    color: 'var(--input-text)',
                  }}
                />
              </div>

              {/* Fil de conversation */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 && !isStreaming && (
                  <div className="space-y-3 py-4">
                    <div className="text-xs font-semibold" style={{ color: 'var(--foreground)' }}>
                      {activeConversation ? activeConversation.title : 'Démarrer avec Kanto AI'}
                    </div>
                    <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                      Posez une question sur l’état du produit, vérifiez un proverbe du corpus ou demandez un contenu marketing adapté. Chaque chiffre et texte culturel s’appuie sur les données réelles de la base.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      {QUICK_STARTERS.map((st) => (
                        <button
                          key={st.label}
                          type="button"
                          onClick={() => void handleSendMessage(st.prompt)}
                          className="text-left rounded-lg p-2.5 text-xs transition-colors cursor-pointer hover:opacity-90"
                          style={{
                            background: 'var(--input-bg)',
                            border: '1px solid var(--card-border)',
                          }}
                        >
                          <div className="font-semibold" style={{ color: 'var(--accent)' }}>
                            {st.label}
                          </div>
                          <div className="text-[11px] mt-0.5 line-clamp-2" style={{ color: 'var(--text-muted)' }}>
                            {st.prompt}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {messages.map((msg) => {
                  const isUser = msg.role === 'USER';
                  return (
                    <div
                      key={msg.id}
                      className={`rounded-xl p-3.5 text-xs leading-relaxed ${
                        isUser ? 'ml-6' : 'mr-2'
                      }`}
                      style={{
                        background: isUser ? 'var(--accent-light)' : 'var(--input-bg)',
                        border: `1px solid ${isUser ? 'var(--accent-border)' : 'var(--card-border)'}`,
                      }}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className="font-bold uppercase tracking-wider text-[10px]" style={{ color: isUser ? 'var(--accent-text)' : 'var(--text-muted)' }}>
                          {isUser ? 'Administrateur' : `Kanto AI${msg.model ? ` • ${msg.model}` : ''}`}
                        </span>
                        {!isUser && (
                          <div className="flex items-center gap-1.5">
                            {msg.deliverableJson && (
                              <button
                                type="button"
                                onClick={() =>
                                  applyDeliverableToEditor(msg.deliverableJson!, msg.id)
                                }
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold cursor-pointer"
                                style={{
                                  background: 'var(--accent)',
                                  color: '#FFFFFF',
                                }}
                              >
                                <FileEdit size={11} />
                                Ouvrir dans l’éditeur
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                void navigator.clipboard.writeText(msg.content);
                                toast.success('Réponse copiée.');
                              }}
                              className="p-1 rounded hover:opacity-75 cursor-pointer"
                              title="Copier"
                            >
                              <Copy size={12} />
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="whitespace-pre-wrap">{msg.content}</div>

                      {!isUser &&
                        ((msg.sourcesJson && msg.sourcesJson.length > 0) ||
                          (msg.toolCallsJson && msg.toolCallsJson.length > 0)) && (
                          <div
                            className="mt-2.5 pt-2 border-t flex flex-wrap gap-1.5 text-[10px]"
                            style={{ borderColor: 'var(--card-border)', color: 'var(--text-muted)' }}
                          >
                            {msg.toolCallsJson?.map((t, i) => (
                              <span
                                key={`${t.toolName}_${i}`}
                                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded"
                                style={{ background: 'var(--card)', border: '1px solid var(--card-border)' }}
                                title={t.summary}
                              >
                                <Database size={10} />
                                {t.toolName} ({t.durationMs}ms)
                              </span>
                            ))}
                            {msg.sourcesJson?.map((s, i) => (
                              <span
                                key={`${s.documentId}_${i}`}
                                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded"
                                style={{ background: 'var(--card)', border: '1px solid var(--card-border)' }}
                              >
                                <BookOpen size={10} />
                                {s.title} (v{s.version})
                              </span>
                            ))}
                          </div>
                        )}
                    </div>
                  );
                })}

                {isStreaming && (
                  <div
                    className="rounded-xl p-3.5 text-xs leading-relaxed mr-2"
                    style={{
                      background: 'var(--input-bg)',
                      border: '1px solid var(--accent-border)',
                    }}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="font-bold uppercase tracking-wider text-[10px]" style={{ color: 'var(--accent)' }}>
                        Kanto AI — génération en cours...
                      </span>
                      {activeToolName && (
                        <span className="text-[10px] font-mono" style={{ color: 'var(--text-muted)' }}>
                          Outil : {activeToolName}...
                        </span>
                      )}
                    </div>
                    <div className="whitespace-pre-wrap">
                      {streamingText || 'Consultation des sources et préparation de la réponse...'}
                    </div>
                    {(liveSources.length > 0 || liveTools.length > 0) && (
                      <div className="mt-2 flex flex-wrap gap-1 text-[10px]" style={{ color: 'var(--text-muted)' }}>
                        {liveTools.map((t, idx) => (
                          <span key={idx} className="px-1.5 py-0.5 rounded border" style={{ borderColor: 'var(--card-border)' }}>
                            {t.toolName}
                          </span>
                        ))}
                        {liveSources.map((s, idx) => (
                          <span key={idx} className="px-1.5 py-0.5 rounded border" style={{ borderColor: 'var(--card-border)' }}>
                            RAG : {s.title}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                <div ref={chatBottomRef} />
              </div>

              {/* Zone de saisie + Contrôles Stop / Régénérer */}
              <div className="p-3 border-t space-y-2" style={{ borderColor: 'var(--card-border)' }}>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    {isStreaming ? (
                      <Button
                        size="sm"
                        variant="danger"
                        leftIcon={<Square size={12} />}
                        onClick={handleStopGeneration}
                      >
                        Arrêter la génération
                      </Button>
                    ) : (
                      messages.length > 0 && (
                        <Button
                          size="sm"
                          variant="outline"
                          leftIcon={<RefreshCw size={12} />}
                          onClick={() => void handleRegenerate()}
                        >
                          Régénérer
                        </Button>
                      )
                    )}
                  </div>
                  <span className="text-[10px]" style={{ color: 'var(--text-subtle)' }}>
                    Entrée pour envoyer • Maj+Entrée pour nouvelle ligne
                  </span>
                </div>

                <div className="flex items-end gap-2">
                  <textarea
                    rows={2}
                    value={promptInput}
                    onChange={(e) => setPromptInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        void handleSendMessage();
                      }
                    }}
                    placeholder="Demandez un post, une synthèse produit ou une recherche dans le corpus..."
                    className="flex-1 rounded-lg px-3 py-2 text-xs resize-none"
                    style={{
                      background: 'var(--input-bg)',
                      border: '1px solid var(--input-border)',
                      color: 'var(--input-text)',
                    }}
                  />
                  <Button
                    size="md"
                    disabled={isStreaming || !promptInput.trim()}
                    leftIcon={<Send size={14} />}
                    onClick={() => void handleSendMessage()}
                  >
                    Envoyer
                  </Button>
                </div>
              </div>
            </section>

            {/* COLONNE 3 : ATELIER / ÉDITEUR DE LIVRABLE & PRÉVISUALISATION LOCALE */}
            <aside
              className="xl:col-span-4 rounded-xl p-4 space-y-3 overflow-y-auto"
              style={{
                background: 'var(--card)',
                border: '1px solid var(--card-border)',
                maxHeight: '78vh',
              }}
            >
              <div className="flex items-center justify-between gap-2 pb-2 border-b" style={{ borderColor: 'var(--card-border)' }}>
                <div className="flex items-center gap-2">
                  <FileEdit size={15} style={{ color: 'var(--accent)' }} />
                  <h2 className="text-sm font-semibold">Atelier & Éditeur</h2>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPreview((p) => !p)}
                  className="text-xs font-semibold px-2 py-1 rounded border cursor-pointer"
                  style={{ borderColor: 'var(--card-border)' }}
                >
                  {showPreview ? 'Éditer' : 'Prévisualiser'}
                </button>
              </div>

              {showPreview ? (
                <div className="space-y-3">
                  <div
                    className="text-[11px] font-medium px-2.5 py-1.5 rounded border"
                    style={{
                      background: 'var(--input-bg)',
                      borderColor: 'var(--card-border)',
                      color: 'var(--text-muted)',
                    }}
                  >
                    Prévisualisation locale ({editorDeliverable.platform}) — aucune publication automatique
                  </div>
                  <div
                    className="rounded-xl p-4 space-y-2.5"
                    style={{
                      background: 'var(--input-bg)',
                      border: '1px solid var(--card-border)',
                    }}
                  >
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span>Kanto MG</span>
                      <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                        {editorDeliverable.language}
                      </span>
                    </div>
                    {editorDeliverable.title && (
                      <div className="text-sm font-bold">{editorDeliverable.title}</div>
                    )}
                    <div className="text-xs whitespace-pre-wrap leading-relaxed">
                      {editorDeliverable.body || 'Aucun texte dans l’éditeur.'}
                    </div>
                    {editorDeliverable.cta && (
                      <div className="text-xs font-semibold pt-1" style={{ color: 'var(--accent)' }}>
                        {editorDeliverable.cta}
                      </div>
                    )}
                    {hashtagsText.trim() && (
                      <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                        {hashtagsText}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-2.5">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-medium mb-1">Plateforme</label>
                      <select
                        value={editorDeliverable.platform}
                        onChange={(e) =>
                          setEditorDeliverable((prev) => ({ ...prev, platform: e.target.value }))
                        }
                        className="w-full rounded-lg px-2.5 py-1.5 text-xs"
                        style={{
                          background: 'var(--input-bg)',
                          border: '1px solid var(--input-border)',
                          color: 'var(--input-text)',
                        }}
                      >
                        {AI_PLATFORMS.map((p) => (
                          <option key={p.value} value={p.value}>
                            {p.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium mb-1">Langue</label>
                      <select
                        value={editorDeliverable.language}
                        onChange={(e) =>
                          setEditorDeliverable((prev) => ({ ...prev, language: e.target.value }))
                        }
                        className="w-full rounded-lg px-2.5 py-1.5 text-xs"
                        style={{
                          background: 'var(--input-bg)',
                          border: '1px solid var(--input-border)',
                          color: 'var(--input-text)',
                        }}
                      >
                        {AI_LANGUAGES.map((l) => (
                          <option key={l.value} value={l.value}>
                            {l.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium mb-1">Titre du livrable</label>
                    <input
                      value={editorDeliverable.title}
                      onChange={(e) =>
                        setEditorDeliverable((prev) => ({ ...prev, title: e.target.value }))
                      }
                      placeholder="Titre éditorial..."
                      className="w-full rounded-lg px-2.5 py-1.5 text-xs"
                      style={{
                        background: 'var(--input-bg)',
                        border: '1px solid var(--input-border)',
                        color: 'var(--input-text)',
                      }}
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium mb-1">Corps du texte</label>
                    <textarea
                      rows={7}
                      value={editorDeliverable.body}
                      onChange={(e) =>
                        setEditorDeliverable((prev) => ({ ...prev, body: e.target.value }))
                      }
                      placeholder="Le livrable généré apparaît ici pour retouche manuelle..."
                      className="w-full rounded-lg px-2.5 py-2 text-xs leading-relaxed"
                      style={{
                        background: 'var(--input-bg)',
                        border: '1px solid var(--input-border)',
                        color: 'var(--input-text)',
                      }}
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium mb-1">Appel à l&apos;action (CTA)</label>
                    <input
                      value={editorDeliverable.cta || ''}
                      onChange={(e) =>
                        setEditorDeliverable((prev) => ({ ...prev, cta: e.target.value }))
                      }
                      placeholder="Ex : Rejoindre la bêta sur app-kanto.gastsar.fr"
                      className="w-full rounded-lg px-2.5 py-1.5 text-xs"
                      style={{
                        background: 'var(--input-bg)',
                        border: '1px solid var(--input-border)',
                        color: 'var(--input-text)',
                      }}
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium mb-1">Hashtags</label>
                    <input
                      value={hashtagsText}
                      onChange={(e) => setHashtagsText(e.target.value)}
                      placeholder="#KantoMG #CultureMalgache"
                      className="w-full rounded-lg px-2.5 py-1.5 text-xs"
                      style={{
                        background: 'var(--input-bg)',
                        border: '1px solid var(--input-border)',
                        color: 'var(--input-text)',
                      }}
                    />
                  </div>

                  <div className="pt-2 border-t space-y-2" style={{ borderColor: 'var(--card-border)' }}>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold">Concept visuel & Prompt image</span>
                      <input
                        value={editorDeliverable.visualAspectRatio || '4:5'}
                        onChange={(e) =>
                          setEditorDeliverable((prev) => ({
                            ...prev,
                            visualAspectRatio: e.target.value,
                          }))
                        }
                        className="w-16 text-center rounded px-1.5 py-0.5 text-[11px] font-mono"
                        style={{
                          background: 'var(--input-bg)',
                          border: '1px solid var(--input-border)',
                        }}
                        title="Ratio recommandé"
                      />
                    </div>
                    <textarea
                      rows={2}
                      value={editorDeliverable.visualConcept || ''}
                      onChange={(e) =>
                        setEditorDeliverable((prev) => ({
                          ...prev,
                          visualConcept: e.target.value,
                        }))
                      }
                      placeholder="Concept graphique recommandé..."
                      className="w-full rounded-lg px-2.5 py-1.5 text-xs"
                      style={{
                        background: 'var(--input-bg)',
                        border: '1px solid var(--input-border)',
                        color: 'var(--input-text)',
                      }}
                    />
                    <textarea
                      rows={2}
                      value={editorDeliverable.imagePrompt || ''}
                      onChange={(e) =>
                        setEditorDeliverable((prev) => ({
                          ...prev,
                          imagePrompt: e.target.value,
                        }))
                      }
                      placeholder="Prompt prêt pour outil d'image..."
                      className="w-full rounded-lg px-2.5 py-1.5 text-xs font-mono"
                      style={{
                        background: 'var(--input-bg)',
                        border: '1px solid var(--input-border)',
                        color: 'var(--input-text)',
                      }}
                    />
                  </div>
                </div>
              )}

              <div className="pt-2 border-t space-y-2" style={{ borderColor: 'var(--card-border)' }}>
                <Button
                  size="sm"
                  className="w-full"
                  isLoading={isSavingDraft}
                  leftIcon={<Save size={13} />}
                  onClick={() => void handleSaveDraft()}
                >
                  {editingDraftId ? 'Mettre à jour le brouillon' : 'Sauvegarder en brouillon'}
                </Button>

                <div className="grid grid-cols-4 gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      void navigator.clipboard.writeText(
                        `${editorDeliverable.title}\n\n${editorDeliverable.body}\n\n${editorDeliverable.cta || ''}\n${hashtagsText}`.trim(),
                      );
                      toast.success('Contenu copié.');
                    }}
                    className="inline-flex items-center justify-center gap-1 py-1.5 rounded-lg border text-[11px] font-medium cursor-pointer"
                    style={{ borderColor: 'var(--card-border)' }}
                  >
                    <Copy size={11} />
                    Copier
                  </button>
                  <button
                    type="button"
                    onClick={() => handleExport('md')}
                    className="inline-flex items-center justify-center gap-1 py-1.5 rounded-lg border text-[11px] font-medium cursor-pointer"
                    style={{ borderColor: 'var(--card-border)' }}
                  >
                    <Download size={11} />
                    .md
                  </button>
                  <button
                    type="button"
                    onClick={() => handleExport('txt')}
                    className="inline-flex items-center justify-center gap-1 py-1.5 rounded-lg border text-[11px] font-medium cursor-pointer"
                    style={{ borderColor: 'var(--card-border)' }}
                  >
                    <Download size={11} />
                    .txt
                  </button>
                  <button
                    type="button"
                    onClick={() => handleExport('json')}
                    className="inline-flex items-center justify-center gap-1 py-1.5 rounded-lg border text-[11px] font-medium cursor-pointer"
                    style={{ borderColor: 'var(--card-border)' }}
                  >
                    <Download size={11} />
                    .json
                  </button>
                </div>
              </div>
            </aside>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
