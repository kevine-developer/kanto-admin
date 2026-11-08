import { fetchApi } from '@/lib/api-client';
import { ConteItem, ConteFormData } from '@/types/conte';

export const contesService = {
  /**
   * Récupère la liste des contes malagasy archivés avec pagination.
   * @param limit - Nombre maximum de contes à renvoyer
   * @returns Liste des contes trouvés
   */
  async getContes(limit: number = 100): Promise<ConteItem[]> {
    const res = await fetchApi<{ data: ConteItem[] }>(`/contes?limit=${limit}`);
    return res.data || [];
  },

  /**
   * Récupère les détails intégraux d'un conte par son identifiant.
   * @param id - Identifiant unique du conte
   * @returns Conte complet avec ses paragraphes bilingues
   */
  async getConteById(id: string): Promise<ConteItem> {
    return fetchApi<ConteItem>(`/contes/${id}`);
  },

  /**
   * Crée un nouveau conte bilingue dans la base de données.
   * @param data - Données du formulaire du conte
   * @returns Le conte créé
   */
  async createConte(data: ConteFormData): Promise<ConteItem> {
    const validParagraphs = data.paragraphs
      .filter((p) => p.textMg.trim() && p.textFr.trim())
      .map((p, idx) => ({
        paragraphNumber: idx + 1,
        textMg: p.textMg.trim(),
        textFr: p.textFr.trim(),
      }));

    return fetchApi<ConteItem>('/contes', {
      method: 'POST',
      body: JSON.stringify({
        title: data.title.trim(),
        titleFr: data.titleFr.trim(),
        subtitle: data.subtitle?.trim() || undefined,
        author: data.author?.trim() || 'Angano Malagasy',
        moralMg: data.moralMg?.trim() || undefined,
        moralFr: data.moralFr?.trim() || undefined,
        audioUrlMg: data.audioUrlMg ?? undefined,
        audioUrlFr: data.audioUrlFr ?? undefined,
        isHumanVoiceMg: data.isHumanVoiceMg ?? undefined,
        isHumanVoiceFr: data.isHumanVoiceFr ?? undefined,
        paragraphs: validParagraphs,
      }),
    });
  },

  /**
   * Met à jour les informations et les paragraphes d'un conte existant.
   * @param id - Identifiant unique du conte
   * @param data - Nouvelles données du conte
   * @returns Le conte modifié
   */
  async updateConte(id: string, data: ConteFormData): Promise<ConteItem> {
    const validParagraphs = data.paragraphs
      .filter((p) => p.textMg.trim() && p.textFr.trim())
      .map((p, idx) => ({
        paragraphNumber: idx + 1,
        textMg: p.textMg.trim(),
        textFr: p.textFr.trim(),
      }));

    return fetchApi<ConteItem>(`/contes/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        title: data.title.trim(),
        titleFr: data.titleFr.trim(),
        subtitle: data.subtitle?.trim() || undefined,
        author: data.author?.trim() || 'Angano Malagasy',
        moralMg: data.moralMg?.trim() || undefined,
        moralFr: data.moralFr?.trim() || undefined,
        audioUrlMg: data.audioUrlMg ?? undefined,
        audioUrlFr: data.audioUrlFr ?? undefined,
        isHumanVoiceMg: data.isHumanVoiceMg ?? undefined,
        isHumanVoiceFr: data.isHumanVoiceFr ?? undefined,
        paragraphs: validParagraphs,
      }),
    });
  },

  /**
   * Supprime définitivement un conte de la base de données.
   * @param id - Identifiant du conte à supprimer
   */
  async deleteConte(id: string): Promise<void> {
    await fetchApi(`/contes/${id}`, { method: 'DELETE' });
  },

  /**
   * Déclenche la génération vocale TTS (Text-to-Speech) d'un conte.
   * @param id - Identifiant du conte
   * @param lang - Langue audio cible ('mg', 'fr' ou 'all')
   * @param force - Forcer la re-génération même si le fichier audio existe déjà
   * @returns Métadonnées des fichiers audios générés
   */
  async generateAudio(
    id: string,
    lang: 'mg' | 'fr' | 'all',
    force: boolean = false,
    voiceId?: string
  ): Promise<{
    id?: string;
    slug?: string;
    audioUrl?: string;
    language?: string;
    audioUrlMg?: string | null;
    audioUrlFr?: string | null;
    status?: string;
  }> {
    if (lang === 'all') {
      return fetchApi(`/contes/${id}/generate-audio-both`, {
        method: 'POST',
        body: JSON.stringify({ force, voiceId }),
      });
    }

    return fetchApi(`/contes/${id}/generate-audio`, {
      method: 'POST',
      body: JSON.stringify({ language: lang, force, voiceId }),
    });
  },

  /**
   * Téléverse un fichier audio (humain / studio) et l'héberge sur Cloudinary CDN.
   * @param id - Identifiant du conte
   * @param lang - Langue de l'audio ('mg' ou 'fr')
   * @param file - Fichier audio sélectionné
   * @param isHumanVoice - Indique s'il s'agit d'une voix humaine certifiée
   */
  async uploadAudio(
    id: string,
    lang: 'mg' | 'fr',
    file: File,
    isHumanVoice: boolean = true,
  ): Promise<{
    id?: string;
    slug?: string;
    audioUrl: string;
    language: string;
    audioUrlMg?: string | null;
    audioUrlFr?: string | null;
    isHumanVoiceMg?: boolean;
    isHumanVoiceFr?: boolean;
    status: string;
  }> {
    const base64Data = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });

    return fetchApi(`/contes/${id}/upload-audio`, {
      method: 'POST',
      body: JSON.stringify({
        language: lang,
        base64Data,
        isHumanVoice,
      }),
    });
  },
};
