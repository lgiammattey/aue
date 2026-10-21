// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Conexao } from '../../portas/perfil';
import { ModalConexoes } from './ModalConexoes';

afterEach(cleanup);

const conexao = (n: number, extra: Partial<Conexao> = {}): Conexao => ({ id: `id-${n}`, handle: `pessoa${n}`, apelido: `Pessoa ${n}`, euSigo: false, ...extra });

const abrir = (props: Partial<React.ComponentProps<typeof ModalConexoes>> = {}) => {
  const aoFechar = vi.fn();
  const aoTentarDeNovo = vi.fn();
  render(
    <MemoryRouter>
      <ModalConexoes aberto titulo="Seguidores" estado="pronto" conexoes={[]} limite={100} aoFechar={aoFechar} aoTentarDeNovo={aoTentarDeNovo} {...props} />
    </MemoryRouter>,
  );
  return { aoFechar, aoTentarDeNovo };
};

describe('ModalConexoes', () => {
  it('lista quem é, com @ e link para o perfil, e fecha ao abrir um perfil', () => {
    const { aoFechar } = abrir({ conexoes: [conexao(1), conexao(2, { avatarUrl: 'https://cdn.test/a.jpg' })] });
    expect(screen.getByRole('dialog', { name: 'Seguidores' })).toBeTruthy();
    const link = screen.getByRole('link', { name: /Pessoa 1/ });
    expect(link.getAttribute('href')).toBe('/u/pessoa1');
    expect(screen.getByText('@pessoa2')).toBeTruthy();
    fireEvent.click(link);
    expect(aoFechar).toHaveBeenCalled();
  });

  it('vazio de verdade diz que não há ninguém', () => {
    abrir({ conexoes: [] });
    expect(screen.getByText('Ninguém por aqui ainda.')).toBeTruthy();
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('falha NÃO vira "ninguém por aqui" e dá para tentar de novo', () => {
    const { aoTentarDeNovo } = abrir({ estado: 'erro' });
    expect(screen.getByRole('alert').textContent).toContain('Não deu para carregar a lista');
    expect(screen.queryByText('Ninguém por aqui ainda.')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Tentar de novo' }));
    expect(aoTentarDeNovo).toHaveBeenCalled();
  });

  it('carregando mostra isso, e a lista cheia avisa que é parcial', () => {
    abrir({ estado: 'carregando' });
    expect(screen.getByText('Carregando…')).toBeTruthy();
    cleanup();
    abrir({ conexoes: Array.from({ length: 3 }, (_, i) => conexao(i)), limite: 3 });
    expect(screen.getByText('Mostrando só os 3 primeiros.')).toBeTruthy();
  });

  it('Esc e o botão fechar fecham; fechado não renderiza', () => {
    const { aoFechar } = abrir();
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
    fireEvent.click(screen.getByRole('button', { name: 'Fechar lista' }));
    expect(aoFechar).toHaveBeenCalledTimes(2);
    cleanup();
    abrir({ aberto: false });
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});
