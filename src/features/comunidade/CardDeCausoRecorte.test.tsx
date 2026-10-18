// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { CardDeCauso } from './components/CardDeCauso';
import type { CausoPostado } from '../../portas/comunidade';

const causoBase: CausoPostado = {
  id: 'causo-teste-1',
  comunidadeId: 'comu-bonde',
  comunidadeSlug: 'bonde-geral',
  autorNome: 'Tiago do Bonde',
  autorHandle: 'tiagobonde',
  conteudo: 'Este é um texto curto de arroto.',
  reacoes: { fogo: 10, nojo: 1, trofeu: 5 },
  curtidas: 10,
  reposts: 2,
  totalComentarios: 0,
  criadoEm: '2026-10-18T10:00:00.000Z',
};

describe('CardDeCauso — Recorte Enxuto de Lançamento', () => {
  afterEach(() => {
    cleanup();
  });

  it('mostra texto curto normalmente sem truncar', () => {
    render(
      <CardDeCauso
        causo={causoBase}
        aoCurtir={vi.fn()}
        aoRepostar={vi.fn()}
        aoDuvidar={vi.fn()}
        aoCompartilhar={vi.fn()}
        aoResponder={vi.fn()}
        aoDenunciar={vi.fn()}
      />,
    );

    expect(screen.getByText('Este é um texto curto de arroto.')).toBeDefined();
    expect(screen.queryByText(/abrir história completa/i)).toBeNull();
  });

  it('condensa texto maior que 120 caracteres com "..." e exibe botão para abrir história completa', () => {
    const textoLongo = 'A'.repeat(150);
    const aoAbrirHistoria = vi.fn();

    render(
      <CardDeCauso
        causo={{ ...causoBase, conteudo: textoLongo }}
        aoCurtir={vi.fn()}
        aoRepostar={vi.fn()}
        aoDuvidar={vi.fn()}
        aoCompartilhar={vi.fn()}
        aoResponder={vi.fn()}
        aoDenunciar={vi.fn()}
        aoAbrirHistoria={aoAbrirHistoria}
      />,
    );

    // Texto truncado em 120 caracteres + '...'
    const textoEsperado = `${'A'.repeat(120)}...`;
    expect(screen.getByText(new RegExp(textoEsperado))).toBeDefined();

    const btnAbrir = screen.getByRole('button', { name: /abrir história completa/i });
    expect(btnAbrir).toBeDefined();

    fireEvent.click(btnAbrir);
    expect(aoAbrirHistoria).toHaveBeenCalledWith('causo-teste-1');
  });

  it('permite abrir comentários em lista simples e enviar resposta ao causo', () => {
    const aoResponder = vi.fn();
    const causoComComentarios: CausoPostado = {
      ...causoBase,
      totalComentarios: 1,
      comentarios: [
        {
          id: 'com-1',
          causoId: 'causo-teste-1',
          autorNome: 'Iury da Oficina',
          autorHandle: 'iury_oficina',
          conteudo: 'Mandou bem demais!',
          criadoEm: '2026-10-18T10:05:00.000Z',
        },
      ],
    };

    render(
      <CardDeCauso
        causo={causoComComentarios}
        aoCurtir={vi.fn()}
        aoRepostar={vi.fn()}
        aoDuvidar={vi.fn()}
        aoCompartilhar={vi.fn()}
        aoResponder={aoResponder}
        aoDenunciar={vi.fn()}
      />,
    );

    // Abre a lista de comentários
    const btnThread = screen.getByRole('button', { name: 'Responder' });
    fireEvent.click(btnThread);

    // Comentário exibido em lista simples
    expect(screen.getByText('Mandou bem demais!')).toBeDefined();
    expect(screen.getByText('Iury da Oficina')).toBeDefined();

    // Digita e envia resposta
    const input = screen.getByPlaceholderText(/Responder a @tiagobonde/i);
    fireEvent.change(input, { target: { value: 'Valeu Iury!' } });

    const btnEnviar = screen.getByRole('button', { name: 'Enviar resposta' });
    fireEvent.click(btnEnviar);

    expect(aoResponder).toHaveBeenCalledWith('causo-teste-1', 'Valeu Iury!');
  });
});
