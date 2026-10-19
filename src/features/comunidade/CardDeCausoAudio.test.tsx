// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { CardDeCauso } from './components/CardDeCauso';
import type { CausoPostado } from '../../portas/comunidade';

const base: CausoPostado = {
  id: 'causo-a',
  comunidadeId: 'c',
  comunidadeSlug: 'eu-arroto-e-dai',
  autorNome: 'Ana',
  conteudo: 'Arroto no shopping.',
  reacoes: { fogo: 0, nojo: 0, trofeu: 0 },
  curtidas: 0,
  reposts: 0,
  totalComentarios: 0,
  criadoEm: '2026-10-18T10:00:00.000Z',
  temAudio: true,
  enderecoDoAudio: async () => 'https://audio.exemplo/a.webm',
};

function montar(causo: CausoPostado) {
  return render(
    <CardDeCauso
      causo={causo}
      aoCurtir={vi.fn()}
      aoDuvidar={vi.fn()}
      aoCompartilhar={vi.fn()}
      aoResponder={vi.fn()}
      aoDenunciar={vi.fn()}
    />,
  );
}

describe('CardDeCauso — áudio', () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('sem duração medida não inventa "0:07"', () => {
    montar(base);
    expect(screen.queryByText('0:07')).toBeNull();
    expect(screen.queryByLabelText(/Duração do arroto/)).toBeNull();
  });

  it('com duração medida mostra o tempo real', () => {
    montar({ ...base, duracaoSegundos: 12 });
    expect(screen.getByText('0:12')).toBeDefined();
  });

  it('tocar um segundo arroto pausa o primeiro', async () => {
    const instancias: { pause: ReturnType<typeof vi.fn> }[] = [];
    vi.stubGlobal(
      'Audio',
      class {
        pause = vi.fn();
        play = vi.fn(() => Promise.resolve());
        onended: (() => void) | null = null;
        constructor() {
          instancias.push(this);
        }
      },
    );

    montar(base);
    montar({ ...base, id: 'causo-b', autorNome: 'Beto' });
    const botoes = screen.getAllByRole('button', { name: /ouvir|tocar|play/i });
    fireEvent.click(botoes[0]);
    await waitFor(() => expect(instancias).toHaveLength(1));
    fireEvent.click(botoes[1]);
    await waitFor(() => expect(instancias).toHaveLength(2));
    expect(instancias[0].pause).toHaveBeenCalled();
    expect(instancias[1].pause).not.toHaveBeenCalled();
  });

  it('sair da tela enquanto o endereço vem não deixa áudio órfão tocando', async () => {
    const instancias: { play: ReturnType<typeof vi.fn> }[] = [];
    vi.stubGlobal(
      'Audio',
      class {
        pause = vi.fn();
        play = vi.fn(() => Promise.resolve());
        onended: (() => void) | null = null;
        constructor() {
          instancias.push(this);
        }
      },
    );
    let liberar: (v: string) => void = () => {};
    const demorado = { ...base, enderecoDoAudio: () => new Promise<string | null>((r) => { liberar = r; }) };
    const { unmount } = montar(demorado);

    fireEvent.click(screen.getAllByRole('button', { name: /ouvir|tocar|play/i })[0]);
    unmount();
    liberar('https://audio.exemplo/a.webm');
    await new Promise((r) => setTimeout(r, 20));

    expect(instancias).toHaveLength(0);
  });
});
