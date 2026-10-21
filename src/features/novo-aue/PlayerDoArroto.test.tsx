// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PlayerDoArroto } from './PlayerDoArroto';

describe('PlayerDoArroto', () => {
  afterEach(cleanup);

  it('com duração conhecida mostra só a duração, sem o tempo corrido', () => {
    render(
      <PlayerDoArroto
        tocando
        tempoAtualSegundos={61.8}
        duracaoSegundos={93.4}
        aoAlternar={vi.fn()}
      />,
    );

    expect(screen.getByText('1:33')).toBeTruthy();
    expect(screen.queryByText(/1:01/)).toBeNull();
    expect(screen.getByLabelText('Tempo do áudio: 1:33')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Pausar áudio' })).toBeTruthy();
  });

  it('não inventa duração e preserva o ponto ao pausar', () => {
    const aoAlternar = vi.fn();
    const { rerender } = render(
      <PlayerDoArroto tocando tempoAtualSegundos={12.2} duracaoSegundos={null} aoAlternar={aoAlternar} />,
    );
    expect(screen.getByText('0:12')).toBeTruthy();
    expect(screen.getByLabelText('Tempo do áudio: 0:12')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Pausar áudio' }));
    expect(aoAlternar).toHaveBeenCalledOnce();

    rerender(<PlayerDoArroto tocando={false} tempoAtualSegundos={12.2} duracaoSegundos={36} aoAlternar={aoAlternar} />);
    expect(screen.getByText('0:36')).toBeTruthy();
    expect(screen.queryByText('0:12')).toBeNull();
    expect(screen.getByRole('button', { name: 'Ouvir áudio' })).toBeTruthy();
  });

  it('usa classes próprias e a forma de onda do protótipo (56 barras)', () => {
    const { container } = render(
      <PlayerDoArroto tocando={false} tempoAtualSegundos={0} duracaoSegundos={6} aoAlternar={vi.fn()} />,
    );
    expect(container.querySelector('.player-arroto')).toBeTruthy();
    expect(container.querySelectorAll('.player-arroto__onda i')).toHaveLength(56);
    expect(container.querySelector('.burp-player, .play, .wave')).toBeNull();
  });
});
