// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CardDoPost } from './CardDoPost';
import type { ItemDoFeed } from './tipos';

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
    expect(screen.getByText('NOTA')).toBeTruthy();
    expect(screen.getByText('88')).toBeTruthy();
    expect(screen.getByText('O arroto que ecoou no estádio')).toBeTruthy();
    expect(screen.getByText('Estava 0x0 quando soltei o trovão e a torcida calou.')).toBeTruthy();
  });

  it('dispara ação de curtir e abrir comentários com ícones estilo Twitter', () => {
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

  it('deixa salvar indisponível sem uma porta de persistência', () => {
    render(
      <MemoryRouter>
        <CardDoPost
          post={postExemplo}
          salvo={false}
          audioTocando={false}
          tempoAtualDoAudio={0}
          duracaoDoAudio={null}
          aoTocarAudio={vi.fn()}
        />
      </MemoryRouter>,
    );

    expect(screen.getByRole('button', { name: 'Salvar' }).hasAttribute('disabled')).toBe(true);
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

  describe('vídeo do YouTube/TikTok', () => {
    const renderizar = (post: ItemDoFeed) =>
      render(
        <MemoryRouter>
          <CardDoPost
            post={post}
            salvo={false}
            audioTocando={false}
            tempoAtualDoAudio={0}
            duracaoDoAudio={null}
            aoAlternarSalvar={vi.fn()}
            aoTocarAudio={vi.fn()}
          />
        </MemoryRouter>,
      );
    const iframe = () => document.querySelector('iframe.post-video');

    it('tópico espelhado do acervo (link no texto, sem anexo) ganha o player', () => {
      renderizar({ ...postExemplo, corpo: 'Concurso de Rap em Arrotos.\nhttps://youtu.be/nXazacLACYw' });
      expect(iframe()?.getAttribute('src')).toContain('youtube-nocookie.com/embed/nXazacLACYw');
    });

    it('anexo de vídeo continua mandando no que é embutido', () => {
      renderizar({
        ...postExemplo,
        corpo: 'veja https://youtu.be/aaaaaaaaaaa',
        anexo: { tipo: 'videoExterno', url: 'https://www.youtube.com/watch?v=bbbbbbbbbbb' },
      });
      expect(iframe()?.getAttribute('src')).toContain('/embed/bbbbbbbbbbb');
    });

    it('post com imagem ou áudio não vira player só porque o texto cita um link', () => {
      renderizar({ ...postExemplo, corpo: 'https://youtu.be/nXazacLACYw', anexo: { tipo: 'imagem', url: 'https://cdn.test/a.jpg' } });
      expect(iframe()).toBeNull();
    });

    it('sem link de vídeo, não há player', () => {
      renderizar(postExemplo);
      expect(iframe()).toBeNull();
    });
  });
});
