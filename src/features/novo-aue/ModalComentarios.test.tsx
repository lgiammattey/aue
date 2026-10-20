// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ModalComentarios } from './ModalComentarios';
import type { ItemComentario, ItemDoFeed } from './tipos';

describe('ModalComentarios (Thread de Respostas / Estilo Twitter)', () => {
  afterEach(() => {
    cleanup();
  });

  const postExemplo: ItemDoFeed = {
    id: 'topico-10',
    tipo: 'topico',
    comunidadeSlug: 'cervejeiros',
    titulo: 'IPA artesanal e arroto em Sol sustenido',
    corpo: 'A carbonatação dessa garrafa foi perfeita para o eco.',
    autorNome: 'Cervejeiro Raiz',
    autorHandle: 'cervejeiro',
    criadoEm: '2026-10-20T10:00:00Z',
    votos: 15,
    respostasTotal: 1,
  };

  const comentariosExemplo: ItemComentario[] = [
    {
      id: 'com-1',
      autorNome: 'Bia do Grave',
      autorHandle: 'bia_grave',
      conteudo: 'Quero ver manter o pitch por 5 segundos!',
      criadoEm: '2026-10-20T10:15:00Z',
      nivel: 0,
    },
  ];

  it('renderiza a thread de comentários com post pai, resposta e formulário de resposta', () => {
    render(
      <MemoryRouter>
        <ModalComentarios
          aberto={true}
          post={postExemplo}
          comentarios={comentariosExemplo}
          carregando={false}
          enviando={false}
          aoFechar={vi.fn()}
          aoEnviarComentario={vi.fn()}
        />
      </MemoryRouter>,
    );

    expect(screen.getByText('Resenha na roda')).toBeTruthy();
    expect(screen.getByText('Cervejeiro Raiz')).toBeTruthy();
    expect(screen.getByText('IPA artesanal e arroto em Sol sustenido')).toBeTruthy();
    expect(screen.getByText('Bia do Grave')).toBeTruthy();
    expect(screen.getByText('Quero ver manter o pitch por 5 segundos!')).toBeTruthy();
    expect(screen.getByPlaceholderText('Responder para a roda…')).toBeTruthy();
  });

  it('permite focar em responder a um usuário específico', () => {
    render(
      <MemoryRouter>
        <ModalComentarios
          aberto={true}
          post={postExemplo}
          comentarios={comentariosExemplo}
          carregando={false}
          enviando={false}
          aoFechar={vi.fn()}
          aoEnviarComentario={vi.fn()}
        />
      </MemoryRouter>,
    );

    const btnResponder = screen.getByRole('button', { name: 'Responder a Bia do Grave' });
    fireEvent.click(btnResponder);

    expect(screen.getByText(/Respondendo a/)).toBeTruthy();
    expect(screen.getByPlaceholderText('Responder a @bia_grave…')).toBeTruthy();
  });

  it('envia comentário digitado', async () => {
    const aoEnviar = vi.fn(async () => true);

    render(
      <MemoryRouter>
        <ModalComentarios
          aberto={true}
          post={postExemplo}
          comentarios={comentariosExemplo}
          carregando={false}
          enviando={false}
          aoFechar={vi.fn()}
          aoEnviarComentario={aoEnviar}
        />
      </MemoryRouter>,
    );

    const input = screen.getByPlaceholderText('Responder para a roda…');
    fireEvent.change(input, { target: { value: 'Comentário teste!' } });

    const btnEnviar = screen.getByRole('button', { name: 'Responder' });
    fireEvent.click(btnEnviar);

    expect(aoEnviar).toHaveBeenCalledWith({
      conteudo: 'Comentário teste!',
      paiId: null,
      anexo: null,
    });
  });
});
