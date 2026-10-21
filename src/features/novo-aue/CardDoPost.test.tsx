// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
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
    expect(screen.getByText('@mestre_eco')).toBeTruthy();
    expect(screen.getByText('r/arena-do-arroto')).toBeTruthy();
    expect(screen.getByText('NOTA')).toBeTruthy();
    expect(screen.getByText('88')).toBeTruthy();
    expect(screen.getByText('O arroto que ecoou no estádio')).toBeTruthy();
    expect(screen.getByText('Estava 0x0 quando soltei o trovão e a torcida calou.')).toBeTruthy();
  });

  it('reserva o quadro da imagem antes do carregamento, sem declarar dimensões da origem', () => {
    render(
      <MemoryRouter>
        <CardDoPost
          post={{ ...postExemplo, anexo: { tipo: 'imagem', url: 'https://cdn.test/causo.jpg' } }}
          salvo={false}
          audioTocando={false}
          tempoAtualDoAudio={0}
          duracaoDoAudio={null}
          aoTocarAudio={vi.fn()}
        />
      </MemoryRouter>,
    );

    const quadro = document.querySelector('.post-media-image');
    const imagem = screen.getByRole('img', { name: 'Anexo do causo' });
    expect(quadro).toBeTruthy();
    expect(imagem.classList.contains('post-attachment-img')).toBe(true);
    expect(imagem.getAttribute('loading')).toBe('lazy');
    expect(imagem.hasAttribute('width')).toBe(false);
    expect(imagem.hasAttribute('height')).toBe(false);
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

  const mostrar = (extra: Partial<React.ComponentProps<typeof CardDoPost>> = {}, post: ItemDoFeed = postExemplo) =>
    render(
      <MemoryRouter>
        <CardDoPost
          post={post}
          audioTocando={false}
          tempoAtualDoAudio={0}
          duracaoDoAudio={null}
          aoTocarAudio={vi.fn()}
          {...extra}
        />
      </MemoryRouter>,
    );

  it('compartilhar copia o link real do tópico (/c/:slug/t/:id), não uma rota que não existe', async () => {
    const writeText = vi.fn(async () => undefined);
    Object.assign(navigator, { clipboard: { writeText }, share: undefined });
    mostrar();
    fireEvent.click(screen.getByRole('button', { name: /Compartilhar/i }));
    await waitFor(() => expect(writeText).toHaveBeenCalledWith(`${window.location.origin}/c/arena-do-arroto/t/1`));
    expect(await screen.findByText('Copiado!')).toBeTruthy();
  });

  it('causo compartilha /historia/:id', async () => {
    const writeText = vi.fn(async () => undefined);
    Object.assign(navigator, { clipboard: { writeText }, share: undefined });
    mostrar({}, { ...postExemplo, id: 'causo-abc', tipo: 'causo' });
    fireEvent.click(screen.getByRole('button', { name: /Compartilhar/i }));
    await waitFor(() => expect(writeText).toHaveBeenCalledWith(`${window.location.origin}/historia/abc`));
  });

  it('sem permissão de área de transferência não diz "Copiado!": entrega o link para copiar', async () => {
    Object.assign(navigator, { clipboard: { writeText: vi.fn(async () => { throw new Error('negado'); }) }, share: undefined });
    const prompt = vi.spyOn(window, 'prompt').mockReturnValue(null);
    mostrar();
    fireEvent.click(screen.getByRole('button', { name: /Compartilhar/i }));
    await waitFor(() => expect(prompt).toHaveBeenCalledWith('Copie o link:', `${window.location.origin}/c/arena-do-arroto/t/1`));
    expect(screen.queryByText('Copiado!')).toBeNull();
    prompt.mockRestore();
  });

  it('usa o compartilhamento nativo quando existe', async () => {
    const share = vi.fn(async () => undefined);
    Object.assign(navigator, { share });
    mostrar();
    fireEvent.click(screen.getByRole('button', { name: /Compartilhar/i }));
    await waitFor(() => expect(share).toHaveBeenCalledWith({ title: postExemplo.titulo, url: `${window.location.origin}/c/arena-do-arroto/t/1` }));
    Object.assign(navigator, { share: undefined });
  });

  it('variante feed (padrão) segue com nota, emoji e salvar, e o ⋯ vai para o topo do card', () => {
    mostrar({ salvo: false, aoCurtir: vi.fn(), aoReagir: vi.fn(), aoAlternarSalvar: vi.fn(), aoApagar: vi.fn() });
    const card = document.querySelector('article.card-do-post') as HTMLElement;
    expect(card.classList.contains('card-do-post--perfil')).toBe(false);
    expect(screen.getByText('NOTA')).toBeTruthy();
    for (const nome of ['🔥', '🤢', '🏆', 'Salvar']) expect(screen.getByRole('button', { name: nome })).toBeTruthy();
    const toolbar = screen.getByRole('toolbar', { name: 'Ações do causo' });
    const mais = screen.getByRole('button', { name: 'Mais ações' });
    expect(card.querySelector('header')?.contains(mais)).toBe(true);
    expect(toolbar.contains(mais)).toBe(false);
  });

  it('r/comunidade fica em linha própria, fora da linha do nome e do @', () => {
    mostrar();
    const roda = screen.getByText('r/arena-do-arroto');
    const ident = document.querySelector('.post-meta-ident') as HTMLElement;
    expect(ident.contains(roda)).toBe(false);
    expect(roda.getAttribute('href')).toBe('/c/arena-do-arroto');
  });

  it('contadores aparecem sempre; o de curtidas só com número vindo da porta', () => {
    mostrar({ aoCurtir: vi.fn() }, { ...postExemplo, respostasTotal: 0 });
    expect(screen.getByRole('button', { name: '0 comentários' }).textContent).toContain('0');
    expect(screen.getByRole('button', { name: 'Curtir' }).querySelector('.action-btn__count')?.textContent).toBe('');
    cleanup();
    mostrar({ aoCurtir: vi.fn(), reacoes: { like: 0, fogo: 0, nojo: 0, trofeu: 0 } });
    expect(screen.getByRole('button', { name: 'Curtir' }).querySelector('.action-btn__count')?.textContent).toBe('0');
  });

  it('mostra a duração que a porta trouxe antes de dar play; sem duração, o tempo corrido', () => {
    mostrar({}, { ...postExemplo, temAudio: true, enderecoDoAudio: 'https://cdn.test/a.webm', duracaoSegundos: 6 });
    expect(screen.getByLabelText('Tempo do áudio: 0:06')).toBeTruthy();
    cleanup();
    mostrar({}, { ...postExemplo, temAudio: true, enderecoDoAudio: 'https://cdn.test/a.webm' });
    expect(screen.getByLabelText('Tempo do áudio: 0:00')).toBeTruthy();
    cleanup();
    mostrar({ duracaoDoAudio: 12 }, { ...postExemplo, temAudio: true, enderecoDoAudio: 'https://cdn.test/a.webm', duracaoSegundos: 6 });
    expect(screen.getByLabelText('Tempo do áudio: 0:12')).toBeTruthy();
  });

  describe('variante perfil (print do perfil)', () => {
    it('sem nota, sem reações emoji e sem salvar; só comentar, curtir e compartilhar', () => {
      mostrar(
        { variante: 'perfil', salvo: false, reacoes: { like: 1, fogo: 2, nojo: 0, trofeu: 3 }, aoCurtir: vi.fn(), aoReagir: vi.fn(), aoAlternarSalvar: vi.fn() },
        { ...postExemplo, nota: 82 },
      );
      expect(document.querySelector('article.card-do-post')?.classList.contains('card-do-post--perfil')).toBe(true);
      expect(screen.queryByText('NOTA')).toBeNull();
      for (const nome of ['🔥', '🤢', '🏆', 'Salvar', 'Salvo']) expect(screen.queryByRole('button', { name: nome })).toBeNull();
      const toolbar = screen.getByRole('toolbar', { name: 'Ações do causo' });
      expect(toolbar.querySelectorAll('button')).toHaveLength(3);
      expect(screen.getByRole('button', { name: 'Curtir' }).textContent).toContain('1');
    });

    it('sem ação de curtir ligada à porta o coração nem aparece (não fica desabilitado com número)', () => {
      mostrar({ variante: 'perfil', aoCurtir: undefined });
      expect(screen.queryByRole('button', { name: 'Curtir' })).toBeNull();
      expect(screen.getByRole('toolbar', { name: 'Ações do causo' }).querySelectorAll('button')).toHaveLength(2);
    });

    it('⋯ apaga no perfil do dono e denuncia no de outra pessoa', () => {
      const aoApagar = vi.fn();
      mostrar({ variante: 'perfil', aoApagar });
      fireEvent.click(screen.getByRole('button', { name: 'Mais ações' }));
      expect(screen.queryByRole('menuitem', { name: 'Denunciar' })).toBeNull();
      fireEvent.click(screen.getByRole('menuitem', { name: 'Apagar' }));
      expect(aoApagar).toHaveBeenCalledOnce();
      cleanup();
      const aoDenunciar = vi.fn();
      mostrar({ variante: 'perfil', aoDenunciar });
      fireEvent.click(screen.getByRole('button', { name: 'Mais ações' }));
      expect(screen.queryByRole('menuitem', { name: 'Apagar' })).toBeNull();
      fireEvent.click(screen.getByRole('menuitem', { name: 'Denunciar' }));
      expect(aoDenunciar).toHaveBeenCalledOnce();
    });
  });

  it('botão sem ação fica desabilitado e explica, em vez de não fazer nada', () => {
    mostrar({ aoCurtir: undefined, aoReagir: undefined, aoAlternarSalvar: undefined, salvo: false });
    for (const nome of ['Curtir', '🔥', '🤢', '🏆', 'Salvar']) {
      const botao = screen.getByRole('button', { name: nome });
      expect(botao.hasAttribute('disabled'), nome).toBe(true);
      expect(botao.getAttribute('title'), nome).toMatch(/não está disponível/);
    }
  });

  it('mantém todas as ações do card na toolbar canônica', () => {
    mostrar({ salvo: false, aoCurtir: vi.fn(), aoReagir: vi.fn(), aoAlternarSalvar: vi.fn() });
    const toolbar = screen.getByRole('toolbar', { name: 'Ações do causo' });

    for (const nome of [/7 comentários/i, 'Curtir', '🔥', '🤢', '🏆', 'Salvar', 'Compartilhar']) {
      expect(screen.getByRole('button', { name: nome })).toBeTruthy();
    }

    expect(toolbar.querySelectorAll('button')).toHaveLength(7);
  });

  it('mostra contagens e marca o que a conta já fez; os cliques chegam aos handlers', () => {
    const aoCurtir = vi.fn();
    const aoReagir = vi.fn();
    const aoAlternarSalvar = vi.fn();
    mostrar({
      reacoes: { like: 3, fogo: 2, nojo: 0, trofeu: 1 },
      minhas: ['like', 'fogo'],
      salvo: true,
      aoCurtir,
      aoReagir,
      aoAlternarSalvar,
    });
    expect(screen.getByRole('button', { name: 'Curtir' }).getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByRole('button', { name: '🔥' }).getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByRole('button', { name: '🤢' }).getAttribute('aria-pressed')).toBe('false');
    expect(screen.getByRole('button', { name: '🔥' }).textContent).toContain('2');
    expect(screen.getByRole('button', { name: '🏆' }).textContent).toContain('1');
    expect(screen.getByRole('button', { name: 'Salvo' }).getAttribute('aria-pressed')).toBe('true');
    fireEvent.click(screen.getByRole('button', { name: 'Curtir' }));
    fireEvent.click(screen.getByRole('button', { name: '🤢' }));
    fireEvent.click(screen.getByRole('button', { name: 'Salvo' }));
    expect(aoCurtir).toHaveBeenCalledOnce();
    expect(aoReagir).toHaveBeenCalledWith('nojo');
    expect(aoAlternarSalvar).toHaveBeenCalledOnce();
  });

  it('mostra "Mais ações" só quando há o que fazer (apagar o próprio ou denunciar o dos outros)', () => {
    mostrar({});
    expect(screen.queryByRole('button', { name: 'Mais ações' })).toBeNull();
    cleanup();
    const aoDenunciar = vi.fn();
    mostrar({ aoDenunciar });
    fireEvent.click(screen.getByRole('button', { name: 'Mais ações' }));
    fireEvent.click(screen.getByRole('menuitem', { name: 'Denunciar' }));
    expect(aoDenunciar).toHaveBeenCalledOnce();
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
