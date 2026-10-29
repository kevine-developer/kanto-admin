import { describe, it, expect } from 'vitest';

interface ParsedImportRow {
  malagasy: string;
  french: string;
  meaning: string;
  example?: string;
  category: 'PROVERBE' | 'EXPRESSION' | 'DICTON';
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  themes?: string[];
  origins?: string[];
  isValid: boolean;
  isDuplicate?: boolean;
  duplicateReason?: string;
}

// Fonction pure de normalisation identique à celle de proverbes/page.tsx
export const normalizeMalagasyText = (t: string) =>
  t.toLowerCase().replace(/[\s\p{P}]+/gu, '').trim();

// Simulateur de parsing JSON fidèle à l'implémentation de kanto-admin
export function parseJsonTextHelper(text: string): ParsedImportRow[] {
  let rawData: unknown;
  try {
    rawData = JSON.parse(text);
  } catch {
    throw new Error('Fichier JSON invalide. Veuillez vérifier la syntaxe.');
  }

  type RawRecord = Record<string, unknown>;
  let itemsArray: RawRecord[] = [];
  if (Array.isArray(rawData)) {
    itemsArray = rawData.filter((it): it is RawRecord => Boolean(it && typeof it === 'object'));
  } else if (rawData && typeof rawData === 'object') {
    const obj = rawData as RawRecord;
    if (Array.isArray(obj.items)) {
      itemsArray = (obj.items as unknown[]).filter((it): it is RawRecord => Boolean(it && typeof it === 'object'));
    } else if (Array.isArray(obj.data)) {
      itemsArray = (obj.data as unknown[]).filter((it): it is RawRecord => Boolean(it && typeof it === 'object'));
    } else {
      itemsArray = [obj];
    }
  }

  return itemsArray.map((item) => {
    const malagasy = String(
      item.malagasy || item.malagasyText || item.texte || item.proverbe || item.text || ''
    ).trim();
    const french = String(
      item.french || item.frenchTranslation || item.traduction || item.francais || item.frenchText || ''
    ).trim();
    const meaning = String(
      item.meaning || item.sens || item.explication || item.definition || ''
    ).trim();

    let category: 'PROVERBE' | 'EXPRESSION' | 'DICTON' = 'PROVERBE';
    const cat = String(item.category || item.categorie || 'PROVERBE').toUpperCase();
    if (cat.includes('DICTON')) category = 'DICTON';
    else if (cat.includes('EXPRESSION')) category = 'EXPRESSION';

    let difficulty: 'EASY' | 'MEDIUM' | 'HARD' = 'EASY';
    const diff = String(item.difficulty || item.difficulte || 'EASY').toUpperCase();
    if (diff === 'MEDIUM') difficulty = 'MEDIUM';
    else if (diff === 'HARD') difficulty = 'HARD';

    const isValid = Boolean(malagasy && french && meaning);

    return {
      malagasy,
      french,
      meaning,
      category,
      difficulty,
      isValid,
    };
  });
}

// Simulateur de détection de doublons (serveur + lot)
export function checkDuplicatesHelper(
  rows: ParsedImportRow[],
  existingServerTexts: string[]
): ParsedImportRow[] {
  const serverDuplicates = new Set(existingServerTexts.map((d) => normalizeMalagasyText(d)));
  const seenInBatch = new Set<string>();

  return rows.map((row) => {
    if (!row.isValid) {
      return { ...row, isDuplicate: false };
    }

    const norm = normalizeMalagasyText(row.malagasy);

    if (serverDuplicates.has(norm)) {
      return {
        ...row,
        isDuplicate: true,
        duplicateReason: 'Déjà enregistré en base de données',
      };
    }

    if (seenInBatch.has(norm)) {
      return {
        ...row,
        isDuplicate: true,
        duplicateReason: 'En double dans ce fichier',
      };
    }

    seenInBatch.add(norm);
    return {
      ...row,
      isDuplicate: false,
    };
  });
}

describe('features/proverbes - Logique d\'Importation & Détection de Doublons', () => {
  it('analyse correctement un tableau JSON brut avec les champs malagasy/french/meaning', () => {
    const rawJson = JSON.stringify([
      {
        malagasy: 'Ny hazo no vanon-ko lakana, ny tany naniriany no tsara.',
        french: 'Si l’arbre est devenu une bonne pirogue, c’est que la terre où il a poussé était fertile.',
        meaning: 'Le mérite revient aux éducateurs et au milieu d’origine.',
        category: 'PROVERBE',
        difficulty: 'EASY',
      },
    ]);

    const result = parseJsonTextHelper(rawJson);
    expect(result).toHaveLength(1);
    expect(result[0].isValid).toBe(true);
    expect(result[0].malagasy).toBe('Ny hazo no vanon-ko lakana, ny tany naniriany no tsara.');
    expect(result[0].category).toBe('PROVERBE');
  });

  it('prend en charge les alias de colonnes (texte, traduction, sens)', () => {
    const rawJson = JSON.stringify({
      items: [
        {
          texte: 'Avo lenta',
          traduction: 'De haut rang',
          sens: 'Personne de qualité éminente',
          categorie: 'EXPRESSION',
        },
      ],
    });

    const result = parseJsonTextHelper(rawJson);
    expect(result).toHaveLength(1);
    expect(result[0].isValid).toBe(true);
    expect(result[0].malagasy).toBe('Avo lenta');
    expect(result[0].french).toBe('De haut rang');
    expect(result[0].meaning).toBe('Personne de qualité éminente');
    expect(result[0].category).toBe('EXPRESSION');
  });

  it('marque isValid = false si un champ requis manque', () => {
    const rawJson = JSON.stringify([
      {
        malagasy: 'Teny zato, kabary arivo',
        french: 'Cent mots, mille discours',
        // 'meaning' manquant volontairement
      },
    ]);

    const result = parseJsonTextHelper(rawJson);
    expect(result).toHaveLength(1);
    expect(result[0].isValid).toBe(false);
  });

  it('détecte un doublon existant déjà sur le serveur malgré différences de ponctuation/casse', () => {
    const rows: ParsedImportRow[] = [
      {
        malagasy: 'Ny hazo no vanon-ko lakana !',
        french: 'Arbre pirogue',
        meaning: 'Éducation',
        category: 'PROVERBE',
        difficulty: 'EASY',
        isValid: true,
      },
    ];

    const serverExisting = ['ny hazo no vanon ko lakana'];

    const analyzed = checkDuplicatesHelper(rows, serverExisting);
    expect(analyzed[0].isDuplicate).toBe(true);
    expect(analyzed[0].duplicateReason).toBe('Déjà enregistré en base de données');
  });

  it('détecte un doublon interne au sein du fichier importé', () => {
    const rows: ParsedImportRow[] = [
      {
        malagasy: 'Lalao madio',
        french: 'Jeu propre',
        meaning: 'Fair-play',
        category: 'EXPRESSION',
        difficulty: 'EASY',
        isValid: true,
      },
      {
        malagasy: 'lalao madio...',
        french: 'Jeu loyal',
        meaning: 'Intégrité',
        category: 'EXPRESSION',
        difficulty: 'EASY',
        isValid: true,
      },
    ];

    const analyzed = checkDuplicatesHelper(rows, []);
    expect(analyzed[0].isDuplicate).toBe(false);
    expect(analyzed[1].isDuplicate).toBe(true);
    expect(analyzed[1].duplicateReason).toBe('En double dans ce fichier');
  });
});

