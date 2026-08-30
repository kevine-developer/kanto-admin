import { Difficulty } from './common';

// ─── Vrai ou Faux ─────────────────────────────────────────────────────────────
export interface TrueFalseQuestion {
  id: string;
  questionMg: string;
  questionFr?: string | null;
  isTrue: boolean;
  explanationMg: string;
  explanationFr?: string | null;
  theme: string;
  difficulty: string;
  source?: string | null;
  status: string;
  timesPlayed: number;
  timesCorrect: number;
}

// ─── Mot Manquant ─────────────────────────────────────────────────────────────
export interface MissingWordQuestion {
  id: string;
  orderIndex: number;
  template: string[];
  correctWord: string;
  choices: string[];
  french: string;
  explanation?: string | null;
  hint?: string | null;
  status: string;
}

export interface MissingWordLevel {
  id: string;
  levelNumber: number;
  titleMg: string;
  titleFr?: string | null;
  description?: string | null;
  difficulty: Difficulty;
  passThreshold: number;
  totalQuestions: number;
  status: string;
  questions?: MissingWordQuestion[];
  _count?: { questions: number };
}

// ─── Remise en Ordre (Word Puzzle) ────────────────────────────────────────────
export interface WordPuzzleSentence {
  id: string;
  orderIndex: number;
  scrambledWords: string[];
  correctSentenceMg: string;
  translationFr: string;
  notes?: string | null;
  status: string;
}

export interface WordPuzzleLevel {
  id: string;
  levelNumber: number;
  titleMg: string;
  titleFr?: string | null;
  description?: string | null;
  difficulty: Difficulty;
  passThreshold: number;
  totalSentences: number;
  status: string;
  sentences?: WordPuzzleSentence[];
  _count?: { sentences: number };
}
