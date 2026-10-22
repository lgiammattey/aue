// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ModalCompositor } from './ModalCompositor';

describe('ModalCompositor', () => {
  afterEach(cleanup);

  it('envia o tópico preservando quebras de linha e parágrafos', () => {
    const aoPublicar = vi.fn(async () => false);
    render(<ModalCompositor aberto destino="comunidade" comunidades={[{ id: 'roda-1', slug: 'teste', nome: 'Teste', descricao: '', icone: null, membrosTotal: 1, topicosTotal: 0, ultimaAtividadeEm: null, souMembro: true }]} aoFechar={vi.fn()} aoPublicar={aoPublicar} />);
    fireEvent.change(screen.getByRole('textbox', { name: 'Título do tópico' }), { target: { value: 'Quebras de linha' } });
    const corpo = 'Primeira linha\nSegunda linha\n\nOutro parágrafo';
    fireEvent.change(screen.getByRole('textbox', { name: 'Mensagem do tópico' }), { target: { value: corpo } });
    fireEvent.click(screen.getByRole('button', { name: 'Publicar' }));
    expect(aoPublicar).toHaveBeenCalledWith(expect.objectContaining({ corpo }));
  });

  it('delega bloqueio e visibilidade do teclado à porta ao abrir e focar o texto', () => {
    const liberarRolagem = vi.fn();
    const controleDeDialogo = {
      bloquearRolagemDoDocumento: vi.fn(() => liberarRolagem),
      manterCampoVisivelAoAbrirTeclado: vi.fn(() => vi.fn()),
    };
    const { unmount } = render(
      <ModalCompositor
        aberto
        controleDeDialogo={controleDeDialogo}
        comunidades={[]}
        aoFechar={vi.fn()}
        aoPublicar={vi.fn(async () => false)}
      />,
    );

    const campo = screen.getByRole('textbox', { name: 'Texto da publicação' });
    expect(campo.id).toBe('compositor-campo');
    expect(controleDeDialogo.bloquearRolagemDoDocumento).toHaveBeenCalledOnce();
    fireEvent.focus(campo);
    expect(controleDeDialogo.manterCampoVisivelAoAbrirTeclado).toHaveBeenCalledTimes(2);
    unmount();
    expect(liberarRolagem).toHaveBeenCalledOnce();
  });

  it('não publica texto enquanto o início da gravação ainda está pendente', () => {
    const aoPublicar = vi.fn(async () => true);
    const inicioPendente = new Promise<never>(() => {});
    const gravacao = {
      iniciar: vi.fn(() => inicioPendente), parar: vi.fn(), cancelar: vi.fn(), estaGravando: vi.fn(() => false),
    };
    render(<ModalCompositor aberto comunidades={[]} criarGravacao={() => gravacao} aoFechar={vi.fn()} aoPublicar={aoPublicar} />);

    fireEvent.change(screen.getByRole('textbox', { name: 'Texto da publicação' }), { target: { value: 'Texto não pode escapar sem o áudio.' } });
    fireEvent.click(screen.getByRole('button', { name: 'Gravar áudio' }));
    fireEvent.submit(screen.getByRole('button', { name: 'Publicar' }).closest('form')!);

    expect(aoPublicar).not.toHaveBeenCalled();
  });

  it('mantém a intenção após falha até descartar a gravação explicitamente', async () => {
    const aoPublicar = vi.fn(async () => false);
    const gravacao = { iniciar: vi.fn(async () => ({ ok: false as const, motivo: 'falhou' as const })), parar: vi.fn(), cancelar: vi.fn(), estaGravando: vi.fn(() => false) };
    render(<ModalCompositor aberto comunidades={[]} criarGravacao={() => gravacao} aoFechar={vi.fn()} aoPublicar={aoPublicar} />);
    fireEvent.change(screen.getByRole('textbox', { name: 'Texto da publicação' }), { target: { value: 'Texto preservado.' } });
    fireEvent.click(screen.getByRole('button', { name: 'Gravar áudio' }));
    expect(await screen.findByText('Gravação não concluída.')).toBeTruthy();
    expect((screen.getByRole('button', { name: 'Publicar' }) as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: 'Descartar gravação' }));
    fireEvent.click(screen.getByRole('button', { name: 'Publicar' }));
    expect(aoPublicar).toHaveBeenCalledWith(expect.objectContaining({ corpo: 'Texto preservado.', anexo: null }));
  });
});
