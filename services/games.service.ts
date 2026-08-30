import { fetchApi } from '@/lib/api-client';
import {
  TrueFalseQuestion,
  MissingWordLevel,
  MissingWordQuestion,
  WordPuzzleLevel,
  WordPuzzleSentence,
  PaginatedResponse,
  PaginationParams,
} from '@/types';

export const gamesService = {
  // ─── Vrai ou Faux ─────────────────────────────────────────────────────────────
  async getTrueFalse(
    params: PaginationParams & { theme?: string; difficulty?: string } = {}
  ): Promise<PaginatedResponse<TrueFalseQuestion>> {
    const query = new URLSearchParams();
    if (params.page) query.append('page', String(params.page));
    if (params.limit) query.append('limit', String(params.limit));
    if (params.theme && params.theme !== 'ALL') query.append('theme', params.theme);
    if (params.difficulty && params.difficulty !== 'ALL') query.append('difficulty', params.difficulty);
    if (params.search?.trim()) query.append('search', params.search.trim());

    return fetchApi<PaginatedResponse<TrueFalseQuestion>>(`/admin/true-false?${query.toString()}`);
  },

  async createTrueFalse(data: Partial<TrueFalseQuestion>): Promise<TrueFalseQuestion> {
    return fetchApi<TrueFalseQuestion>('/admin/true-false', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateTrueFalse(id: string, data: Partial<TrueFalseQuestion>): Promise<TrueFalseQuestion> {
    return fetchApi<TrueFalseQuestion>(`/admin/true-false/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  async deleteTrueFalse(id: string): Promise<void> {
    await fetchApi(`/admin/true-false/${id}`, { method: 'DELETE' });
  },

  // ─── Mot Manquant ─────────────────────────────────────────────────────────────
  async getMissingWordLevels(): Promise<MissingWordLevel[]> {
    return fetchApi<MissingWordLevel[]>('/admin/missing-word/levels');
  },

  async getMissingWordLevel(id: string): Promise<MissingWordLevel> {
    return fetchApi<MissingWordLevel>(`/admin/missing-word/levels/${id}`);
  },

  async createMissingWordLevel(data: Partial<MissingWordLevel>): Promise<MissingWordLevel> {
    return fetchApi<MissingWordLevel>('/admin/missing-word/levels', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateMissingWordLevel(id: string, data: Partial<MissingWordLevel>): Promise<MissingWordLevel> {
    return fetchApi<MissingWordLevel>(`/admin/missing-word/levels/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  async deleteMissingWordLevel(id: string): Promise<void> {
    await fetchApi(`/admin/missing-word/levels/${id}`, { method: 'DELETE' });
  },

  async createMissingWordQuestion(
    levelId: string,
    data: Partial<MissingWordQuestion>
  ): Promise<MissingWordQuestion> {
    return fetchApi<MissingWordQuestion>(`/admin/missing-word/levels/${levelId}/questions`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateMissingWordQuestion(
    questionId: string,
    data: Partial<MissingWordQuestion>
  ): Promise<MissingWordQuestion> {
    return fetchApi<MissingWordQuestion>(`/admin/missing-word/questions/${questionId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  async deleteMissingWordQuestion(questionId: string): Promise<void> {
    await fetchApi(`/admin/missing-word/questions/${questionId}`, { method: 'DELETE' });
  },

  // ─── Remise en Ordre (Word Puzzle) ────────────────────────────────────────────
  async getWordPuzzleLevels(): Promise<WordPuzzleLevel[]> {
    return fetchApi<WordPuzzleLevel[]>('/admin/word-puzzle/levels');
  },

  async getWordPuzzleLevel(id: string): Promise<WordPuzzleLevel> {
    return fetchApi<WordPuzzleLevel>(`/admin/word-puzzle/levels/${id}`);
  },

  async createWordPuzzleLevel(data: Partial<WordPuzzleLevel>): Promise<WordPuzzleLevel> {
    return fetchApi<WordPuzzleLevel>('/admin/word-puzzle/levels', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateWordPuzzleLevel(id: string, data: Partial<WordPuzzleLevel>): Promise<WordPuzzleLevel> {
    return fetchApi<WordPuzzleLevel>(`/admin/word-puzzle/levels/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  async deleteWordPuzzleLevel(id: string): Promise<void> {
    await fetchApi(`/admin/word-puzzle/levels/${id}`, { method: 'DELETE' });
  },

  async moveSentence(sentenceId: string, direction: 'up' | 'down'): Promise<void> {
    await fetchApi(`/admin/word-puzzle/sentences/${sentenceId}/move`, {
      method: 'POST',
      body: JSON.stringify({ direction }),
    });
  },

  async createWordPuzzleSentence(
    levelId: string,
    data: Partial<WordPuzzleSentence>
  ): Promise<WordPuzzleSentence> {
    return fetchApi<WordPuzzleSentence>(`/admin/word-puzzle/levels/${levelId}/sentences`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateWordPuzzleSentence(
    sentenceId: string,
    data: Partial<WordPuzzleSentence>
  ): Promise<WordPuzzleSentence> {
    return fetchApi<WordPuzzleSentence>(`/admin/word-puzzle/sentences/${sentenceId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  async deleteWordPuzzleSentence(sentenceId: string): Promise<void> {
    await fetchApi(`/admin/word-puzzle/sentences/${sentenceId}`, { method: 'DELETE' });
  },
};
