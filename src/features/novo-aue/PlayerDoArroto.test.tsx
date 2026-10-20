// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PlayerDoArroto } from './PlayerDoArroto';

describe('PlayerDoArroto', () => {
  afterEach(cleanup);

  it('mostra o tempo que já correu e a duração real', () => {
    render(
      <PlayerDoArroto
        tocando
        tempoAtualSegundos={61.8}
        duracaoSegundos={93.4}
        aoAlternar={vi.fn()}
      />,
    );

    expect(screen.getByText('1:01 / 1:33')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Pausar áudio' })).toBeTruthy();
  });

  it('não inventa duração e preserva o ponto ao pausar', () => {
    const aoAlternar = vi.fn();
    const { rerender } = render(
      <PlayerDoArroto tocando tempoAtualSegundos={12.2} duracaoSegundos={null} aoAlternar={aoAlternar} />,
    );
    expect(screen.getByText('0:12')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Pausar áudio' }));
    expect(aoAlternar).toHaveBeenCalledOnce();

    rerender(<PlayerDoArroto tocando={false} tempoAtualSegundos={12.2} duracaoSegundos={36} aoAlternar={aoAlternar} />);
    expect(screen.getByText('0:12 / 0:36')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Ouvir áudio' })).toBeTruthy();
  });
});
