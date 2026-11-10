export type LearningLevel = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';

export type LessonType =
  | 'VOCABULARY'
  | 'GRAMMAR'
  | 'CULTURE'
  | 'TRADITION'
  | 'LITERATURE';

export interface AdminLearningSection {
  type: 'intro' | 'concept' | 'example' | 'didYouKnow' | 'quiz' | 'phonetic' | 'config';
  audioEnabled?: boolean;
  textFr?: string;
  textMg?: string;
  termMg?: string;
  phonetic?: string;
  meaningFr?: string;
  explanation?: string;
  letterOrSound?: string;
  frenchEquivalent?: string;
  sampleWordMg?: string;
  sampleTranslationFr?: string;
  question?: string;
  questionMg?: string;
  choices?: string[];
  correctIndex?: number;
}

export interface AdminLearningLesson {
  id: string;
  trackId: string;
  slug: string;
  title: string;
  titleMg: string;
  summary?: string;
  summaryMg?: string;
  type: LessonType;
  orderIndex: number;
  durationMinutes: number;
  isPublished: boolean;
  audioEnabled?: boolean;
  sections: AdminLearningSection[];
  createdAt: string;
  updatedAt: string;
  track?: {
    id: string;
    title: string;
    titleMg: string;
    slug: string;
  };
}

export interface AdminLearningTrack {
  id: string;
  slug: string;
  title: string;
  titleMg: string;
  description?: string;
  descriptionMg?: string;
  level: LearningLevel;
  icon?: string;
  color?: string;
  orderIndex: number;
  estimatedMinutes: number;
  isPublished: boolean;
  lessons?: AdminLearningLesson[];
  _count?: {
    lessons: number;
  };
}

