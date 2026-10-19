// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { TelaHistoria } from './TelaHistoria';
import { criarComunidadeWeb } from '../../plataforma/web/comunidade';
import type { CausoPostado } from '../../portas/comunidade';

const CAUSO: CausoPostado = {
  id: 'causo-layout',
  comunidadeId: 'c1',
  comunidadeSlug: 'cerveja-gelada',
  autorNome: 'Tiago do Bonde',
  autorHandle: 'tiagobonde',
  conteudo: 'Conto de teste do layout.',
  reacoes: { fogo: 0, nojo: 0, trofeu: 0 },
  curtidas: 0,
  reposts: 0,
  totalComentarios: 0,
  comentarios: [],
  criadoEm: '2026-10-17T18:00:00.000Z',
};

function abrirCom(largura: number) {
  Object.defineProperty(window, 'innerWidth', { configurable: true, value: largura });
  const porta = criarComunidadeWeb({ causosIniciais: [CAUSO], forcarOffline: true });
  return render(
    <MemoryRouter initialEntries={['/historia/causo-layout']}>
      <Routes>
        <Route path="/historia/:id" element={<TelaHistoria porta={porta} />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('TelaHistoria — layout por largura', () => {
  afterEach(() => {
    cleanup();
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
  });

  it('celular (375px): só a barra inferior, sem lateral de desktop', async () => {
    abrirCom(375);
    await screen.findByText(/Conto de teste do layout/);
    expect(screen.getByRole('navigation', { name: 'Navegação móvel' })).toBeDefined();
    expect(screen.queryByRole('button', { name: 'Alternar tema' })).toBeNull();
  });

  it('tablet (800px): navegação lateral, sem barra inferior', async () => {
    abrirCom(800);
    await screen.findByText(/Conto de teste do layout/);
    expect(screen.queryByRole('navigation', { name: 'Navegação móvel' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Alternar tema' })).toBeDefined();
  });

  it('desktop (1280px): sem barra inferior', async () => {
    abrirCom(1280);
    await screen.findByText(/Conto de teste do layout/);
    expect(screen.queryByRole('navigation', { name: 'Navegação móvel' })).toBeNull();
  });

  it.each([
    [699, true, false],
    [700, false, false],
    [999, false, false],
    [1000, false, true],
  ])('fronteira em %ipx: barra inferior=%s, coluna direita=%s', async (largura, barraInferior, colunaDireita) => {
    abrirCom(largura);
    await screen.findByText(/Conto de teste do layout/);
    expect(!!screen.queryByRole('navigation', { name: 'Navegação móvel' })).toBe(barraInferior);
    // ColunaTendencias só entra a partir de 1000px: procura o campo de busca dela.
    expect(!!screen.queryByPlaceholderText(/buscar/i)).toBe(colunaDireita);
  });

  it('o botão de tema troca o tema de verdade', async () => {
    abrirCom(1280);
    await screen.findByText(/Conto de teste do layout/);
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    fireEvent.click(screen.getByRole('button', { name: 'Alternar tema' }));
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    expect(localStorage.getItem('bda-theme')).toBe('light');
  });
});
