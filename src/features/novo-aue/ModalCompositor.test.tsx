// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ModalCompositor } from './ModalCompositor';

describe('ModalCompositor', () => {
  afterEach(cleanup);

  it('delega bloqueio e visibilidade do teclado à porta ao abrir e focar o texto', () => {
    const liberarRolagem = vi.fn();
    const controleDeDialogo = {
      bloquearRolagemDoDocumento: vi.fn(() => liberarRolagem),
      manterCampoVisivelAoAbrirTeclado: vi.fn(() => vi.fn()),
    };
    const { unmount } = render(
      <ModalCompositor
        aberto
        controleDeDialogo={controleDeDialogo}
        comunidades={[]}
        aoFechar={vi.fn()}
        aoPublicar={vi.fn(async () => false)}
      />,
    );

    const campo = screen.getByRole('textbox', { name: 'Texto da publicação' });
    expect(campo.id).toBe('compositor-campo');
    expect(controleDeDialogo.bloquearRolagemDoDocumento).toHaveBeenCalledOnce();
    fireEvent.focus(campo);
    expect(controleDeDialogo.manterCampoVisivelAoAbrirTeclado).toHaveBeenCalledTimes(2);
    unmount();
    expect(liberarRolagem).toHaveBeenCalledOnce();
  });
});
