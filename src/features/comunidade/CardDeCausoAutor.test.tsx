// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { CardDeCauso } from './components/CardDeCauso';
import type { CausoPostado } from '../../portas/comunidade';

const causo: CausoPostado = {
  id: 'c1',
  comunidadeId: 'x',
  comunidadeSlug: 'feed',
  autorNome: 'Giam',
  autorHandle: 'giam',
  autorHandleDoServidor: true,
  conteudo: 'Burpzilla acordou.',
  reacoes: { fogo: 0, nojo: 0, trofeu: 0 },
  curtidas: 0,
  reposts: 0,
  totalComentarios: 0,
  criadoEm: '2026-08-28T12:00:00Z',
};

function card(c: CausoPostado, extra: Partial<React.ComponentProps<typeof CardDeCauso>> = {}) {
  const aoAbrirPerfil = vi.fn();
  const aoAbrirHistoria = vi.fn();
  const aoCompartilhar = vi.fn();
  const utils = render(
    <div onClick={aoAbrirHistoria}>
      <CardDeCauso
        causo={c}
        aoCurtir={vi.fn()}
        aoRepostar={vi.fn()}
        aoDuvidar={vi.fn()}
        aoCompartilhar={aoCompartilhar}
        aoResponder={vi.fn()}
        aoDenunciar={vi.fn()}
        aoAbrirPerfil={aoAbrirPerfil}
        {...extra}
      />
    </div>,
  );
  return { ...utils, aoAbrirPerfil, aoAbrirHistoria };
}

afterEach(cleanup);

describe('CardDeCauso: autor abre o perfil', () => {
  it('nome, @ e avatar são botões de 44px que abrem o perfil e não propagam', () => {
    const { aoAbrirPerfil, aoAbrirHistoria } = card(causo);
    const botoes = screen.getAllByRole('button', { name: /Ver perfil de/ });
    expect(botoes).toHaveLength(2);
    const nome = botoes.find((b) => b.textContent?.includes('@giam'))!;
    expect(nome.style.minHeight).toBe('44px');
    const avatar = botoes.find((b) => b !== nome)!;
    expect(avatar.style.width).toBe('44px');
    expect(avatar.style.height).toBe('44px');

    fireEvent.click(nome);
    fireEvent.click(avatar);
    expect(aoAbrirPerfil).toHaveBeenCalledTimes(2);
    expect(aoAbrirPerfil).toHaveBeenCalledWith('giam', 'Giam');
    expect(aoAbrirHistoria).not.toHaveBeenCalled();
  });

  it('@ fabricado a partir do nome não vira link', () => {
    card({ ...causo, autorHandleDoServidor: false });
    expect(screen.queryByRole('button', { name: /Ver perfil de/ })).toBeNull();
    expect(screen.getByText(/@giam/)).toBeDefined();
  });

  it('causo só neste aparelho não vira link', () => {
    card({ ...causo, somenteNesteAparelho: true });
    expect(screen.queryByRole('button', { name: /Ver perfil de/ })).toBeNull();
  });

  it('sem aoAbrirPerfil não há link', () => {
    card(causo, { aoAbrirPerfil: undefined });
    expect(screen.queryByRole('button', { name: /Ver perfil de/ })).toBeNull();
  });

  it('o card nunca mostra o símbolo Burpzilla', () => {
    const { container } = card(causo);
    expect(container.querySelector('[aria-label*="Burpzilla"]')).toBeNull();
    expect(container.textContent).not.toMatch(/Burpzilla\s*@/);
  });
});

describe('CardDeCauso: causo sem nota', () => {
  it('com áudio e sem nota, mostra o player e nenhum selo de pontuação', () => {
    const { container } = card({ ...causo, temAudio: true, enderecoDoAudio: async () => 'x', duracaoSegundos: 12 });
    expect(screen.getByRole('button', { name: 'Tocar' })).toBeDefined();
    expect(container.textContent).not.toMatch(/nota|pontos|score|\b\d{2,3}\s*\/\s*100/i);
    expect(container.querySelector('[data-testid*="nota"], [data-testid*="selo"]')).toBeNull();
  });
});
