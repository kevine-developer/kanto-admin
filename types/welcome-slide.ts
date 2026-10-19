export interface WelcomeSlide {
  id: string;
  title?: string;
  titleMg?: string | null;
  badge?: string;
  badgeMg?: string;
  tag?: string | null;
  imageUrl: string;
  accentColor?: string;
  orderIndex: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type CreateWelcomeSlideInput = Partial<
  Omit<WelcomeSlide, 'id' | 'createdAt' | 'updatedAt' | 'imageUrl'>
> & {
  imageUrl: string;
};

export type UpdateWelcomeSlideInput = Partial<CreateWelcomeSlideInput>;
