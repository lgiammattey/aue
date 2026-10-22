// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PreviaDaConversa } from './PreviaDaConversa';
import type { ItemComentario, ItemDoFeed } from './tipos';

describe('PreviaDaConversa', () => {
  afterEach(cleanup);

  it('oferece resposta direta em cada comentário já visível no feed', () => {
    const post: ItemDoFeed = {
      id: 'topico-1',
      tipo: 'topico',
      comunidadeSlug: 'eu-arroto-e-dai',
      titulo: 'Post',
      corpo: 'Causo',
      autorNome: 'Giam',
      criadoEm: '2026-10-22T12:00:00Z',
      respostasTotal: 1,
    };
    const comentario: ItemComentario = {
      id: 'resposta-felippe',
      autorNome: 'Felippe',
      autorHandle: 'mistelin',
      conteudo: 'Eita porra',
      criadoEm: '2026-10-22T12:05:00Z',
      nivel: 0,
    };
    const aoResponder = vi.fn();

    render(
      <MemoryRouter>
        <PreviaDaConversa
          post={post}
          comentarios={[comentario]}
          temMais={false}
          aoCarregarMais={vi.fn()}
          aoResponder={aoResponder}
        />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Responder a Felippe' }));
    expect(aoResponder).toHaveBeenCalledWith(comentario);
  });

  it('exibe o áudio anexado dentro da própria trilha da conversa', () => {
    const post: ItemDoFeed = {
      id: 'topico-1',
      tipo: 'topico',
      comunidadeSlug: 'eu-arroto-e-dai',
      titulo: 'Post',
      corpo: 'Causo',
      autorNome: 'Giam',
      criadoEm: '2026-10-22T12:00:00Z',
      respostasTotal: 1,
    };
    const comentario: ItemComentario = {
      id: 'resposta-com-audio',
      autorNome: 'Felippe',
      conteudo: 'Meu arroto de uma hora atrás.',
      criadoEm: '2026-10-22T12:05:00Z',
      nivel: 0,
      anexo: {
        tipo: 'audio',
        url: 'https://cdn.exemplo.test/arrotinho.webm',
      },
    };

    const { container } = render(
      <MemoryRouter>
        <PreviaDaConversa
          post={post}
          comentarios={[comentario]}
          temMais={false}
          aoCarregarMais={vi.fn()}
          aoResponder={vi.fn()}
        />
      </MemoryRouter>,
    );

    const audio = container.querySelector('audio');
    expect(audio).not.toBeNull();
    expect(audio?.hasAttribute('controls')).toBe(true);
    expect(audio?.getAttribute('src')).toBe('https://cdn.exemplo.test/arrotinho.webm');
  });
});
