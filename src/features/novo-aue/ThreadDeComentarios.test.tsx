// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
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

  it('já abre o compositor direcionado quando a resposta parte da conversa no feed', () => {
    const aoEnviar = vi.fn(async () => true);

    render(
      <MemoryRouter>
        <ThreadDeComentarios
          post={postExemplo}
          comentarios={comentariosExemplo}
          carregando={false}
          enviando={false}
          aoVoltar={vi.fn()}
          comentarioInicialParaResponder={comentariosExemplo[0]}
          aoEnviarComentario={aoEnviar}
        />
      </MemoryRouter>,
    );

    const input = screen.getByPlaceholderText('Responder a Pedro Som…');
    fireEvent.change(input, { target: { value: 'Concordo!' } });
    fireEvent.click(screen.getByRole('button', { name: 'Responder' }));

    expect(aoEnviar).toHaveBeenCalledWith({
      conteudo: 'Concordo!',
      paiId: 'com-1',
      anexo: null,
    });
  });

  it('não envia texto enquanto o início da gravação ainda está pendente', () => {
    const aoEnviar = vi.fn(async () => true);
    const inicioPendente = new Promise<never>(() => {});
    const gravacao = {
      iniciar: vi.fn(() => inicioPendente), parar: vi.fn(), cancelar: vi.fn(), estaGravando: vi.fn(() => false),
    };
    render(<MemoryRouter><ThreadDeComentarios post={postExemplo} comentarios={comentariosExemplo} carregando={false} enviando={false} criarGravacao={() => gravacao} aoVoltar={vi.fn()} aoEnviarComentario={aoEnviar} /></MemoryRouter>);

    fireEvent.change(screen.getByRole('textbox', { name: 'Escrever resposta' }), { target: { value: 'Texto não pode escapar sem o áudio.' } });
    fireEvent.click(screen.getByRole('button', { name: 'Gravar áudio' }));
    fireEvent.submit(screen.getByRole('button', { name: 'Responder' }).closest('form')!);

    expect(aoEnviar).not.toHaveBeenCalled();
  });

  it('mantém a intenção após falha até descartar a gravação explicitamente', async () => {
    const aoEnviar = vi.fn(async () => false);
    const gravacao = { iniciar: vi.fn(async () => ({ ok: false as const, motivo: 'falhou' as const })), parar: vi.fn(), cancelar: vi.fn(), estaGravando: vi.fn(() => false) };
    render(<MemoryRouter><ThreadDeComentarios post={postExemplo} comentarios={comentariosExemplo} carregando={false} enviando={false} criarGravacao={() => gravacao} aoVoltar={vi.fn()} aoEnviarComentario={aoEnviar} /></MemoryRouter>);
    fireEvent.change(screen.getByRole('textbox', { name: 'Escrever resposta' }), { target: { value: 'Texto preservado.' } });
    fireEvent.click(screen.getByRole('button', { name: 'Gravar áudio' }));
    expect(await screen.findByText('Gravação não concluída.')).toBeTruthy();
    expect((screen.getByRole('button', { name: 'Responder' }) as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: 'Descartar gravação' }));
    fireEvent.click(screen.getByRole('button', { name: 'Responder' }));
    expect(aoEnviar).toHaveBeenCalledWith(expect.objectContaining({ conteudo: 'Texto preservado.', anexo: null }));
  });

  it('cancela a tentativa pendente ao voltar, mesmo sem desmontar a thread', async () => {
    const inicioPendente = new Promise<never>(() => {});
    const gravacao = { iniciar: vi.fn(() => inicioPendente), parar: vi.fn(), cancelar: vi.fn(), estaGravando: vi.fn(() => false) };
    const aoVoltar = vi.fn();
    render(<MemoryRouter><ThreadDeComentarios post={postExemplo} comentarios={comentariosExemplo} carregando={false} enviando={false} criarGravacao={() => gravacao} aoVoltar={aoVoltar} aoEnviarComentario={vi.fn(async () => false)} /></MemoryRouter>);
    fireEvent.click(screen.getByRole('button', { name: 'Gravar áudio' }));
    expect(await screen.findByText('Preparando microfone…')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Voltar para o feed' }));
    expect(gravacao.cancelar).toHaveBeenCalledOnce();
    expect(aoVoltar).toHaveBeenCalledOnce();
    expect(screen.queryByText('Preparando microfone…')).toBeNull();
  });
});
