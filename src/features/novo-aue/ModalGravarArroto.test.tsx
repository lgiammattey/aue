// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ModalGravarArroto } from './ModalGravarArroto';

describe('ModalGravarArroto', () => {
  afterEach(cleanup);

  it('bloqueia a rolagem do documento enquanto a gravação direta está aberta', () => {
    const liberarRolagem = vi.fn();
    const controleDeDialogo = {
      bloquearRolagemDoDocumento: vi.fn(() => liberarRolagem),
      manterCampoVisivelAoAbrirTeclado: vi.fn(() => vi.fn()),
    };
    const { unmount } = render(
      <ModalGravarArroto
        aberto
        controleDeDialogo={controleDeDialogo}
        estado="ocioso"
        aoFechar={vi.fn()}
        aoIniciarGravacao={vi.fn()}
        aoPararGravacao={vi.fn()}
        aoRegravar={vi.fn()}
        aoEnviar={vi.fn()}
      />,
    );

    expect(screen.getByRole('dialog')).toBeTruthy();
    expect(controleDeDialogo.bloquearRolagemDoDocumento).toHaveBeenCalledOnce();
    unmount();
    expect(liberarRolagem).toHaveBeenCalledOnce();
  });
});
