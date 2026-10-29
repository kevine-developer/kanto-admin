import { describe, it, expect } from 'vitest';
import { resolveMediaUrl, toRoman, shuffleArray, slugify } from '@/lib/utils/media';

describe('lib/utils/media - Utilitaires Média & Formatage', () => {
  describe('resolveMediaUrl', () => {
    it('renvoie une chaîne vide si aucune URL n\'est fournie', () => {
      expect(resolveMediaUrl(null)).toBe('');
      expect(resolveMediaUrl(undefined)).toBe('');
      expect(resolveMediaUrl('')).toBe('');
    });

    it('préserve les URLs complètes HTTPS et Cloudinary', () => {
      const url = 'https://res.cloudinary.com/kanto/image/upload/v1/banner.jpg';
      expect(resolveMediaUrl(url)).toBe(url);
    });

    it('préserve les data URIs', () => {
      const dataUri = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...';
      expect(resolveMediaUrl(dataUri)).toBe(dataUri);
    });

    it('résout les chemins relatifs en les préfixant avec l\'API Backend', () => {
      const relative = '/uploads/events/hero.webp';
      const resolved = resolveMediaUrl(relative);
      expect(resolved).toMatch(/\/uploads\/events\/hero\.webp$/);
      expect(resolved.startsWith('http')).toBe(true);
    });

    it('nettoie l\'ancienne IP de développement 192.168.1.100', () => {
      const oldUrl = 'http://192.168.1.100:3000/assets/img.png';
      const resolved = resolveMediaUrl(oldUrl);
      expect(resolved).not.toContain('192.168.1.100:3000');
      expect(resolved).toMatch(/\/assets\/img\.png$/);
    });
  });

  describe('toRoman', () => {
    it('convertit correctement les chiffres romains usuels', () => {
      expect(toRoman(1)).toBe('I');
      expect(toRoman(3)).toBe('III');
      expect(toRoman(4)).toBe('IV');
      expect(toRoman(5)).toBe('V');
      expect(toRoman(9)).toBe('IX');
      expect(toRoman(10)).toBe('X');
      expect(toRoman(14)).toBe('XIV');
      expect(toRoman(28)).toBe('XXVIII');
    });

    it('renvoie I par défaut pour des nombres inférieurs à 1', () => {
      expect(toRoman(0)).toBe('I');
    });
  });

  describe('slugify', () => {
    it('génère un slug propre avec suppression des accents et caractères spéciaux', () => {
      expect(slugify('Ny fanamby lehibe 2026 !')).toBe('ny-fanamby-lehibe-2026');
      expect(slugify('Hazo avo halan-drivotra')).toBe('hazo-avo-halan-drivotra');
      expect(slugify('Événement Spécial & Fête')).toBe('evenement-special-fete');
    });

    it('élimine les tirets en début et fin de chaîne', () => {
      expect(slugify('---test-slug---')).toBe('test-slug');
    });
  });

  describe('shuffleArray', () => {
    it('renvoie une nouvelle référence de tableau sans modifier l\'original', () => {
      const original = [1, 2, 3, 4, 5, 6, 7, 8, 9];
      const shuffled = shuffleArray(original);

      expect(shuffled).not.toBe(original);
      expect(shuffled).toHaveLength(original.length);
      expect(shuffled.sort()).toEqual(original.sort());
    });
  });
});

