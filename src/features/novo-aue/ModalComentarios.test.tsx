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

  it('abre já direcionado quando a resposta parte da trilha do feed', () => {
    render(
      <MemoryRouter>
        <ModalComentarios
          aberto={true}
          post={postExemplo}
          comentarios={comentariosExemplo}
          carregando={false}
          enviando={false}
          comentarioInicialParaResponder={comentariosExemplo[0]}
          aoFechar={vi.fn()}
          aoEnviarComentario={vi.fn()}
        />
      </MemoryRouter>,
    );

    expect(screen.getByText(/Respondendo a/)).toBeTruthy();
    expect(screen.getByPlaceholderText('Responder a Bia do Grave…')).toBeTruthy();
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
    fireEvent.change(input, { target: { value: 'Comentário teste!\nSegunda linha\n\nOutro parágrafo' } });

    const btnEnviar = screen.getByRole('button', { name: 'Responder' });
    fireEvent.click(btnEnviar);

    expect(aoEnviar).toHaveBeenCalledWith({
      conteudo: 'Comentário teste!\nSegunda linha\n\nOutro parágrafo',
      paiId: null,
      anexo: null,
    });
  });

  it('detecta um link do YouTube no texto e mostra sua prévia antes do envio', () => {
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

    fireEvent.change(screen.getByPlaceholderText('Responder para a roda…'), {
      target: { value: 'Olha isso https://youtu.be/dQw4w9WgXcQ' },
    });

    expect(screen.getByTitle('Prévia do YouTube').getAttribute('src')).toBe(
      'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?rel=0&playsinline=1',
    );
  });

  it('não envia texto enquanto o início da gravação ainda está pendente', () => {
    const aoEnviar = vi.fn(async () => true);
    const inicioPendente = new Promise<never>(() => {});
    const gravacao = {
      iniciar: vi.fn(() => inicioPendente), parar: vi.fn(), cancelar: vi.fn(), estaGravando: vi.fn(() => false),
    };
    render(<MemoryRouter><ModalComentarios aberto post={postExemplo} comentarios={comentariosExemplo} carregando={false} enviando={false} criarGravacao={() => gravacao} aoFechar={vi.fn()} aoEnviarComentario={aoEnviar} /></MemoryRouter>);

    fireEvent.change(screen.getByRole('textbox', { name: 'Escrever resposta' }), { target: { value: 'Texto não pode escapar sem o áudio.' } });
    fireEvent.click(screen.getByRole('button', { name: 'Gravar áudio' }));
    fireEvent.submit(screen.getByRole('button', { name: 'Responder' }).closest('form')!);

    expect(aoEnviar).not.toHaveBeenCalled();
  });

  it('mantém a intenção após falha até descartar a gravação explicitamente', async () => {
    const aoEnviar = vi.fn(async () => false);
    const gravacao = { iniciar: vi.fn(async () => ({ ok: false as const, motivo: 'falhou' as const })), parar: vi.fn(), cancelar: vi.fn(), estaGravando: vi.fn(() => false) };
    render(<MemoryRouter><ModalComentarios aberto post={postExemplo} comentarios={comentariosExemplo} carregando={false} enviando={false} criarGravacao={() => gravacao} aoFechar={vi.fn()} aoEnviarComentario={aoEnviar} /></MemoryRouter>);
    fireEvent.change(screen.getByRole('textbox', { name: 'Escrever resposta' }), { target: { value: 'Texto preservado.' } });
    fireEvent.click(screen.getByRole('button', { name: 'Gravar áudio' }));
    expect(await screen.findByText('Gravação não concluída.')).toBeTruthy();
    expect((screen.getByRole('button', { name: 'Responder' }) as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: 'Descartar gravação' }));
    fireEvent.click(screen.getByRole('button', { name: 'Responder' }));
    expect(aoEnviar).toHaveBeenCalledWith(expect.objectContaining({ conteudo: 'Texto preservado.', anexo: null }));
  });

  it('cancela a tentativa pendente ao trocar de tópico sem desmontar o modal', async () => {
    const inicioPendente = new Promise<never>(() => {});
    const gravacao = { iniciar: vi.fn(() => inicioPendente), parar: vi.fn(), cancelar: vi.fn(), estaGravando: vi.fn(() => false) };
    const props = { aberto: true, comentarios: comentariosExemplo, carregando: false, enviando: false, criarGravacao: () => gravacao, aoFechar: vi.fn(), aoEnviarComentario: vi.fn(async () => false) };
    const tela = render(<MemoryRouter><ModalComentarios {...props} post={postExemplo} /></MemoryRouter>);
    fireEvent.click(screen.getByRole('button', { name: 'Gravar áudio' }));
    expect(await screen.findByText('Preparando microfone…')).toBeTruthy();
    tela.rerender(<MemoryRouter><ModalComentarios {...props} post={{ ...postExemplo, id: 'topico-11' }} /></MemoryRouter>);
    expect(gravacao.cancelar).toHaveBeenCalledOnce();
    expect(screen.queryByText('Preparando microfone…')).toBeNull();
  });
});
