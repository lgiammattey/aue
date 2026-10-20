// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CardDoPost } from './CardDoPost';
import type { ItemComentario, ItemDoFeed } from './tipos';

describe('CardDoPost (Formato Twitter / OpenDesign)', () => {
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
    votos: 42,
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

  it('renderiza o post com avatar lateral em imagem, autor com handle, tempo e badge de nota', () => {
    render(
      <MemoryRouter>
        <CardDoPost
          post={postExemplo}
          salvo={false}
          audioTocando={false}
          tempoAtualDoAudio={0}
          duracaoDoAudio={null}
          aoAlternarSalvar={vi.fn()}
          aoTocarAudio={vi.fn()}
        />
      </MemoryRouter>,
    );

    const imgAvatar = screen.getByRole('img', { name: 'Mestre do Eco' });
    expect(imgAvatar).toBeTruthy();
    expect(imgAvatar.getAttribute('src')).toBe('https://cdn.test/avatar-mestre.jpg');
    expect(screen.getByText('Mestre do Eco')).toBeTruthy();
    expect(screen.getByText('u/mestre_eco')).toBeTruthy();
    expect(screen.getByText('r/arena-do-arroto')).toBeTruthy();
    expect(screen.getByText('NOTA 88')).toBeTruthy();
    expect(screen.getByText('O arroto que ecoou no estádio')).toBeTruthy();
    expect(screen.getByText('Estava 0x0 quando soltei o trovão e a torcida calou.')).toBeTruthy();
  });

  it('dispara ação de curtir e alternar thread com ícones estilo Twitter', () => {
    const aoCurtir = vi.fn();
    const aoAbrirComentarios = vi.fn();

    render(
      <MemoryRouter>
        <CardDoPost
          post={postExemplo}
          salvo={false}
          audioTocando={false}
          tempoAtualDoAudio={0}
          duracaoDoAudio={null}
          aoCurtir={aoCurtir}
          aoAbrirComentarios={aoAbrirComentarios}
          aoAlternarSalvar={vi.fn()}
          aoTocarAudio={vi.fn()}
        />
      </MemoryRouter>,
    );

    const btnComentarios = screen.getByRole('button', { name: /7 comentários/i });
    fireEvent.click(btnComentarios);
    expect(aoAbrirComentarios).toHaveBeenCalledOnce();

    const btnCurtir = screen.getByRole('button', { name: /Curtir/i });
    fireEvent.click(btnCurtir);
    expect(aoCurtir).toHaveBeenCalledOnce();
  });

  it('exibe thread inline de comentários e compositor com gravação de áudio', () => {
    const aoEnviar = vi.fn(async () => true);

    render(
      <MemoryRouter>
        <CardDoPost
          post={postExemplo}
          salvo={false}
          audioTocando={false}
          tempoAtualDoAudio={0}
          duracaoDoAudio={null}
          threadAberta={true}
          comentarios={comentariosExemplo}
          carregandoComentarios={false}
          aoEnviarComentario={aoEnviar}
          aoAlternarSalvar={vi.fn()}
          aoTocarAudio={vi.fn()}
        />
      </MemoryRouter>,
    );

    // Thread inline exibida no próprio card
    expect(screen.getByRole('heading', { level: 2, name: 'Resenha na roda' })).toBeTruthy();
    expect(screen.getByText('Esse som foi histórico na firma!')).toBeTruthy();
    expect(screen.getByText('Pedro Som')).toBeTruthy();

    // Avatar do comentarista com foto
    const imgComentarista = screen.getByRole('img', { name: 'Pedro Som' });
    expect(imgComentarista.getAttribute('src')).toBe('https://cdn.test/avatar-pedro.jpg');

    // Botão de gravação de áudio com 1 clique disponível no compositor inline
    expect(screen.getByRole('button', { name: /Gravar áudio/i })).toBeTruthy();

    // Enviar comentário na thread inline
    const input = screen.getByPlaceholderText('Responder para a roda…');
    fireEvent.change(input, { target: { value: 'Comentário inline!' } });
    fireEvent.click(screen.getByRole('button', { name: 'Responder' }));

    expect(aoEnviar).toHaveBeenCalledWith({
      conteudo: 'Comentário inline!',
      paiId: null,
      anexo: null,
    });
  });

  it('copia link para o clipboard ao clicar em compartilhar', () => {
    const writeTextMock = vi.fn();
    Object.assign(navigator, {
      clipboard: {
        writeText: writeTextMock,
      },
    });

    render(
      <MemoryRouter>
        <CardDoPost
          post={postExemplo}
          salvo={false}
          audioTocando={false}
          tempoAtualDoAudio={0}
          duracaoDoAudio={null}
          aoAlternarSalvar={vi.fn()}
          aoTocarAudio={vi.fn()}
        />
      </MemoryRouter>,
    );

    const btnShare = screen.getByRole('button', { name: /Compartilhar/i });
    fireEvent.click(btnShare);
    expect(writeTextMock).toHaveBeenCalledWith(expect.stringContaining('/r/arena-do-arroto'));
  });
});
