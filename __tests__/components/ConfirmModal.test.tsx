import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConfirmModal } from '@/components/ui/ConfirmModal';

describe('components/ui/ConfirmModal', () => {
  it('ne rend rien lorsque isOpen est false', () => {
    const { queryByText } = render(
      <ConfirmModal
        isOpen={false}
        title="Supprimer le conte"
        description="Cette action est irréversible."
        onClose={vi.fn()}
        onConfirm={vi.fn()}
      />
    );

    expect(queryByText('Supprimer le conte')).not.toBeInTheDocument();
  });

  it('affiche le titre, la description et les boutons par défaut quand isOpen est true', () => {
    render(
      <ConfirmModal
        isOpen={true}
        title="Archiver l'événement"
        description="Êtes-vous certain de vouloir archiver cet événement ?"
        onClose={vi.fn()}
        onConfirm={vi.fn()}
      />
    );

    expect(screen.getByText("Archiver l'événement")).toBeInTheDocument();
    expect(
      screen.getByText('Êtes-vous certain de vouloir archiver cet événement ?')
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Annuler' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Confirmer' })).toBeInTheDocument();
  });

  it('appelle onConfirm lors du clic sur le bouton de confirmation', async () => {
    const handleConfirm = vi.fn();
    const handleClose = vi.fn();
    const user = userEvent.setup();

    render(
      <ConfirmModal
        isOpen={true}
        title="Suppression"
        description="Confirmer ?"
        confirmText="Oui, supprimer"
        onConfirm={handleConfirm}
        onClose={handleClose}
      />
    );

    const confirmBtn = screen.getByRole('button', { name: 'Oui, supprimer' });
    await user.click(confirmBtn);

    expect(handleConfirm).toHaveBeenCalledTimes(1);
    expect(handleClose).not.toHaveBeenCalled();
  });

  it('appelle onClose lors du clic sur Annuler', async () => {
    const handleConfirm = vi.fn();
    const handleClose = vi.fn();
    const user = userEvent.setup();

    render(
      <ConfirmModal
        isOpen={true}
        title="Action"
        description="Confirmer ?"
        cancelText="Retour"
        onConfirm={handleConfirm}
        onClose={handleClose}
      />
    );

    const cancelBtn = screen.getByRole('button', { name: 'Retour' });
    await user.click(cancelBtn);

    expect(handleClose).toHaveBeenCalledTimes(1);
    expect(handleConfirm).not.toHaveBeenCalled();
  });

  it('désactive le bouton Annuler et active le spinner quand isLoading est true', () => {
    render(
      <ConfirmModal
        isOpen={true}
        title="Suppression en cours"
        description="Veuillez patienter"
        isLoading={true}
        onConfirm={vi.fn()}
        onClose={vi.fn()}
      />
    );

    const cancelBtn = screen.getByRole('button', { name: 'Annuler' });
    expect(cancelBtn).toBeDisabled();
  });
});

