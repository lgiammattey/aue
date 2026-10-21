// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it } from 'vitest';
import { TelaNaoEncontrada } from './TelaNaoEncontrada';

afterEach(cleanup);

describe('TelaNaoEncontrada', () => {
  it('diz que a página não existe e oferece o caminho de volta', () => {
    render(<MemoryRouter><TelaNaoEncontrada /></MemoryRouter>);
    expect(screen.getByRole('heading', { level: 1, name: 'Página não encontrada.' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Voltar para o Bonde' }).getAttribute('href')).toBe('/');
    expect(screen.getByRole('link', { name: 'Ver comunidades' }).getAttribute('href')).toBe('/comunidades');
  });

  it('pede para o Google não indexar e troca o título; ao sair, desfaz as duas coisas', () => {
    document.title = 'Título de antes';
    const { unmount } = render(<MemoryRouter><TelaNaoEncontrada /></MemoryRouter>);
    expect(document.title).toBe('Página não encontrada · Auê!');
    expect(document.head.querySelector('meta[name="robots"]')?.getAttribute('content')).toBe('noindex');
    unmount();
    expect(document.title).toBe('Título de antes');
    expect(document.head.querySelector('meta[name="robots"]')).toBeNull();
  });

  it('se a página já tem meta robots (index, follow), troca o valor e devolve ao sair — sem criar um segundo', () => {
    const meta = document.createElement('meta');
    meta.name = 'robots';
    meta.content = 'index, follow';
    document.head.appendChild(meta);
    const { unmount } = render(<MemoryRouter><TelaNaoEncontrada /></MemoryRouter>);
    expect(document.head.querySelectorAll('meta[name="robots"]')).toHaveLength(1);
    expect(meta.content).toBe('noindex');
    unmount();
    expect(meta.content).toBe('index, follow');
    meta.remove();
  });
});
