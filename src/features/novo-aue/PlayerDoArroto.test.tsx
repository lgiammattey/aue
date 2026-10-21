// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PlayerDoArroto } from './PlayerDoArroto';

describe('PlayerDoArroto', () => {
  afterEach(cleanup);

  it('em repouso, com duração conhecida, mostra só a duração (como no print)', () => {
    render(
      <PlayerDoArroto
        tocando={false}
        tempoAtualSegundos={61.8}
        duracaoSegundos={93.4}
        aoAlternar={vi.fn()}
      />,
    );

    expect(screen.getByText('1:33')).toBeTruthy();
    expect(screen.queryByText(/1:01/)).toBeNull();
    expect(screen.getByLabelText('Tempo do áudio: 1:33')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Ouvir áudio' })).toBeTruthy();
    expect(document.querySelectorAll('.player-arroto__onda i.is-tocada')).toHaveLength(0);
  });

  it('tocando, mostra o tempo corrido e preenche a onda aos poucos', () => {
    const { rerender } = render(
      <PlayerDoArroto tocando tempoAtualSegundos={0} duracaoSegundos={10} aoAlternar={vi.fn()} />,
    );
    const tocadas = () => document.querySelectorAll('.player-arroto__onda i.is-tocada').length;
    expect(screen.getByLabelText('Tempo do áudio: 0:00')).toBeTruthy();
    expect(tocadas()).toBe(0);
    rerender(<PlayerDoArroto tocando tempoAtualSegundos={5} duracaoSegundos={10} aoAlternar={vi.fn()} />);
    expect(screen.getByLabelText('Tempo do áudio: 0:05')).toBeTruthy();
    expect(tocadas()).toBe(28);
    rerender(<PlayerDoArroto tocando tempoAtualSegundos={99} duracaoSegundos={10} aoAlternar={vi.fn()} />);
    expect(tocadas()).toBe(56);
    // Pausou: volta ao repouso, só a duração e a onda parada.
    rerender(<PlayerDoArroto tocando={false} tempoAtualSegundos={5} duracaoSegundos={10} aoAlternar={vi.fn()} />);
    expect(screen.getByLabelText('Tempo do áudio: 0:10')).toBeTruthy();
    expect(tocadas()).toBe(0);
  });

  it('sem duração conhecida não preenche a onda (não inventa progresso)', () => {
    render(<PlayerDoArroto tocando tempoAtualSegundos={5} duracaoSegundos={null} aoAlternar={vi.fn()} />);
    expect(document.querySelectorAll('.player-arroto__onda i.is-tocada')).toHaveLength(0);
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
