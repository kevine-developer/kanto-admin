import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Pagination } from '@/components/ui/Pagination';

describe('components/ui/Pagination', () => {
  it('ne rend rien si totalPages <= 1 et totalCount === 0', () => {
    const { container } = render(
      <Pagination
        currentPage={1}
        totalPages={1}
        totalCount={0}
        onPageChange={vi.fn()}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('affiche correctement le résumé des éléments paginés', () => {
    render(
      <Pagination
        currentPage={2}
        totalPages={5}
        totalCount={48}
        pageSize={10}
        itemLabel="proverbes"
        onPageChange={vi.fn()}
      />
    );

    // Page 2 avec pageSize 10 -> de 11 à 20 sur 48 proverbes
    expect(screen.getByText('Affichage de', { exact: false })).toBeInTheDocument();
    expect(screen.getByText('11')).toBeInTheDocument();
    expect(screen.getByText('20')).toBeInTheDocument();
    expect(screen.getByText('48')).toBeInTheDocument();
    expect(screen.getByText('proverbes', { exact: false })).toBeInTheDocument();
    expect(screen.getByText('Page 2 / 5')).toBeInTheDocument();
  });

  it('désactive le bouton précédent sur la première page', () => {
    render(
      <Pagination
        currentPage={1}
        totalPages={3}
        totalCount={30}
        onPageChange={vi.fn()}
      />
    );

    const prevButton = screen.getByTitle('Page précédente');
    expect(prevButton).toBeDisabled();

    const nextButton = screen.getByTitle('Page suivante');
    expect(nextButton).not.toBeDisabled();
  });

  it('désactive le bouton suivant sur la dernière page', () => {
    render(
      <Pagination
        currentPage={3}
        totalPages={3}
        totalCount={30}
        onPageChange={vi.fn()}
      />
    );

    const nextButton = screen.getByTitle('Page suivante');
    expect(nextButton).toBeDisabled();
  });

  it('déclenche onPageChange avec les valeurs correctes lors des clics', async () => {
    const handlePageChange = vi.fn();
    const user = userEvent.setup();

    render(
      <Pagination
        currentPage={2}
        totalPages={4}
        totalCount={40}
        onPageChange={handlePageChange}
      />
    );

    const prevButton = screen.getByTitle('Page précédente');
    await user.click(prevButton);
    expect(handlePageChange).toHaveBeenCalledWith(1);

    const nextButton = screen.getByTitle('Page suivante');
    await user.click(nextButton);
    expect(handlePageChange).toHaveBeenCalledWith(3);
  });
});

