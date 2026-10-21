// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ThreadDeComentarios } from './ThreadDeComentarios';
import type { ItemComentario, ItemDoFeed } from './tipos';

describe('ThreadDeComentarios (Padrão Twitter / Fora do Card)', () => {
  afterEach(() => {
    cleanup();
  });

  const postExemplo: ItemDoFeed = {
    id: 'topico-1',
    tipo: 'topico',
    comunidadeSlug: 'arena-do-arroto',
    titulo: 'O arroto que ecoou no estádio',
    corpo: 'Estava 0x0 quando soltei o trovão e a torcida calou.',
    autorNome: 'Mestre do Eco',
    autorHandle: 'mestre_eco',
    autorAvatarUrl: 'https://cdn.test/avatar-mestre.jpg',
    criadoEm: '2026-10-20T12:00:00Z',
    respostasTotal: 7,
    nota: 88,
  };

  const comentariosExemplo: ItemComentario[] = [
    {
      id: 'com-1',
      autorNome: 'Pedro Som',
      autorHandle: 'pedro_som',
      autorAvatarUrl: 'https://cdn.test/avatar-pedro.jpg',
      conteudo: 'Esse som foi histórico na firma!',
      criadoEm: '2026-10-20T12:05:00Z',
      nivel: 0,
    },
  ];

  it('exibe o post original no topo, a lista de respostas e o compositor com áudio de 1 clique fora do card', () => {
    const aoEnviar = vi.fn(async () => true);
    const aoVoltar = vi.fn();

    render(
      <MemoryRouter>
        <ThreadDeComentarios
          post={postExemplo}
          comentarios={comentariosExemplo}
          carregando={false}
          enviando={false}
          aoVoltar={aoVoltar}
          aoEnviarComentario={aoEnviar}
        />
      </MemoryRouter>,
    );

    // Botão de voltar e cabeçalho da conversa
    expect(screen.getByRole('heading', { level: 2, name: 'Resenha na roda' })).toBeTruthy();
    const btnVoltar = screen.getByRole('button', { name: /Voltar para o feed/i });
    expect(btnVoltar).toBeTruthy();
    fireEvent.click(btnVoltar);
    expect(aoVoltar).toHaveBeenCalledOnce();

    // Post original no topo
    expect(screen.getByText('O arroto que ecoou no estádio')).toBeTruthy();
    expect(screen.getByText('Estava 0x0 quando soltei o trovão e a torcida calou.')).toBeTruthy();

    // Comentário da resposta
    expect(screen.getByText('Esse som foi histórico na firma!')).toBeTruthy();
    expect(screen.getByText('Pedro Som')).toBeTruthy();
    const imgComentarista = screen.getByRole('img', { name: 'Pedro Som' });
    expect(imgComentarista.getAttribute('src')).toBe('https://cdn.test/avatar-pedro.jpg');

    // Botão de gravação de áudio em 1 clique
    expect(screen.getByRole('button', { name: /Gravar áudio/i })).toBeTruthy();

    // Enviar resposta
    const input = screen.getByPlaceholderText('Responder para a roda…');
    fireEvent.change(input, { target: { value: 'Comentário na thread!' } });
    fireEvent.click(screen.getByRole('button', { name: 'Responder' }));

    expect(aoEnviar).toHaveBeenCalledWith({
      conteudo: 'Comentário na thread!',
      paiId: null,
      anexo: null,
    });
  });

  it('desenha a cadeia por paiId, conserva todos os ramos e satura o recuo no segundo nível', () => {
    const comentarios: ItemComentario[] = [
      { id: 'raiz', autorNome: 'Tiago', conteudo: 'Primeira fala.', criadoEm: '2026-10-20T12:05:00Z', paiId: null },
      { id: 'outra-raiz', autorNome: 'Rafa', conteudo: 'Outro ramo.', criadoEm: '2026-10-20T12:06:00Z', paiId: null },
      { id: 'filha', autorNome: 'Camillo', conteudo: 'Resposta da primeira.', criadoEm: '2026-10-20T12:07:00Z', paiId: 'raiz' },
      { id: 'neta', autorNome: 'Tiago', conteudo: 'Terceira fala.', criadoEm: '2026-10-20T12:08:00Z', paiId: 'filha' },
      { id: 'bisneta', autorNome: 'Camillo', conteudo: 'Quarta fala sem abrir mais recuo.', criadoEm: '2026-10-20T12:09:00Z', paiId: 'neta' },
    ];

    const { container } = render(
      <MemoryRouter>
        <ThreadDeComentarios post={postExemplo} comentarios={comentarios} carregando={false} enviando={false} aoVoltar={vi.fn()} aoEnviarComentario={vi.fn(async () => true)} />
      </MemoryRouter>,
    );

    const respostas = Array.from(container.querySelectorAll('.thread-reply-text')).map((elemento) => elemento.textContent);
    expect(respostas).toEqual([
      'Primeira fala.',
      'Resposta da primeira.',
      'Terceira fala.',
      'Quarta fala sem abrir mais recuo.',
      'Outro ramo.',
    ]);
    expect(container.querySelector('[data-profundidade-visual="0"]')).toBeTruthy();
    expect(container.querySelectorAll('[data-profundidade-visual="2"]')).toHaveLength(2);
  });

  it('mantém o rascunho e mostra erro quando o servidor não confirma a resposta', async () => {
    const aoEnviar = vi.fn(async () => false);
    render(
      <MemoryRouter>
        <ThreadDeComentarios post={postExemplo} comentarios={comentariosExemplo} carregando={false} enviando={false} aoVoltar={vi.fn()} aoEnviarComentario={aoEnviar} />
      </MemoryRouter>,
    );

    const input = screen.getByPlaceholderText('Responder para a roda…');
    fireEvent.change(input, { target: { value: 'Não pode sumir.' } });
    fireEvent.click(screen.getByRole('button', { name: 'Responder' }));

    await waitFor(() => expect(screen.getByRole('alert').textContent).toContain('Seu rascunho continua aqui.'));
    expect((input as HTMLTextAreaElement).value).toBe('Não pode sumir.');
  });
});
