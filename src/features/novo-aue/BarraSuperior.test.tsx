// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { BarraSuperior } from './BarraSuperior';

afterEach(cleanup);

const montar = (extra: Partial<React.ComponentProps<typeof BarraSuperior>> = {}) =>
  render(
    <MemoryRouter>
      <BarraSuperior busca="" estaAutenticado meuPerfil={null} aoBuscar={vi.fn()} {...extra} />
    </MemoryRouter>,
  );

describe('BarraSuperior mobile enxuta', () => {
  it('renderiza marca mobile, atalhos diretos para Ranking e Grupos, e sem busca ou chat', () => {
    montar();
    expect(screen.getByRole('link', { name: 'Auê mobile' }).getAttribute('href')).toBe('/');
    expect(screen.getByRole('link', { name: 'Ranking' }).getAttribute('href')).toBe('/ranking-de-arrotos');
    expect(screen.getByRole('link', { name: 'Grupos' }).getAttribute('href')).toBe('/grupos');
    expect(screen.queryByRole('search')).toBeNull();
    expect(screen.queryByLabelText('Campo de busca')).toBeNull();
    expect(screen.queryByRole('button', { name: /chat|mensagem/i })).toBeNull();
  });

  it('mostra Entrar para visitante e dispara aoEntrar; mostra Perfil quando autenticado', () => {
    const aoEntrar = vi.fn();
    montar({ estaAutenticado: false, aoEntrar });
    fireEvent.click(screen.getByRole('button', { name: 'Fazer login' }));
    expect(aoEntrar).toHaveBeenCalledOnce();

    cleanup();
    montar({ estaAutenticado: true });
    expect(screen.getByRole('link', { name: 'Abrir meu perfil' }).getAttribute('href')).toBe('/perfil');
  });
});
