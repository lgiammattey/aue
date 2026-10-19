// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import { LayoutPublico } from './LayoutPublico';

function montar() {
  render(
    <MemoryRouter initialEntries={['/como-jogar']}>
      <LayoutPublico eyebrow="Guia" titulo="Título" resumo="Resumo">
        <p>Conteúdo</p>
      </LayoutPublico>
    </MemoryRouter>,
  );
  return screen.getByRole('button', { name: /menu/i });
}

describe('menu hambúrguer das páginas públicas', () => {
  afterEach(() => {
    cleanup();
  });

  it('começa fechado', () => {
    const botao = montar();

    expect(botao.getAttribute('aria-label')).toBe('Abrir menu');
    expect(botao.getAttribute('aria-expanded')).toBe('false');
    expect(document.getElementById('menu-publico')?.hasAttribute('hidden')).toBe(true);
  });

  it('abre, lista as páginas, e fecha de novo no mesmo botão', () => {
    const botao = montar();

    fireEvent.click(botao);
    expect(botao.getAttribute('aria-expanded')).toBe('true');
    expect(botao.getAttribute('aria-label')).toBe('Fechar menu');

    const menu = document.getElementById('menu-publico') as HTMLElement;
    expect(menu.hasAttribute('hidden')).toBe(false);
    const links = [...menu.querySelectorAll('a')].map((a) => a.getAttribute('href'));
    expect(links).toEqual([
      '/como-jogar',
      '/comunidade',
      '/como-arrotar',
      '/tipos-de-arroto',
      '/ranking-de-arrotos',
      '/grupos',
      '/videos-de-arroto',
    ]);

    fireEvent.click(botao);
    expect(menu.hasAttribute('hidden')).toBe(true);
  });

  it('Esc fecha o menu', () => {
    const botao = montar();

    fireEvent.click(botao);
    fireEvent.keyDown(botao, { key: 'Escape' });

    expect(botao.getAttribute('aria-expanded')).toBe('false');
  });

  it('escolher uma página fecha o menu', () => {
    const botao = montar();

    fireEvent.click(botao);
    const menu = document.getElementById('menu-publico') as HTMLElement;
    fireEvent.click(menu.querySelector('a[href="/grupos"]') as HTMLElement);

    expect(botao.getAttribute('aria-expanded')).toBe('false');
  });
});
