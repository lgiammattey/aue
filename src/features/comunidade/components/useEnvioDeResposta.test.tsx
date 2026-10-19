// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ArvoreDeComentarios } from './ArvoreDeComentarios';
import type { RespostaDeCauso } from '../../../portas/comunidade';

const resposta: RespostaDeCauso = {
  id: 'r1',
  causoId: 'c1',
  autorNome: 'Iury',
  autorHandle: 'iury',
  conteudo: 'Isso não é arroto de visita.',
  criadoEm: '2026-10-17T18:10:00.000Z',
};

function abrirFormulario(aoResponder: (t: string, r?: string) => unknown) {
  render(<ArvoreDeComentarios comentarios={[resposta]} aoResponder={aoResponder as never} />);
  fireEvent.click(screen.getByRole('button', { name: 'Responder' }));
  const campo = screen.getByLabelText('Responder a @iury') as HTMLInputElement;
  fireEvent.change(campo, { target: { value: 'Concordo.' } });
  return campo;
}

describe('resposta que falha não some', () => {
  afterEach(cleanup);

  it('mantém o texto e mostra erro quando o envio devolve false', async () => {
    const campo = abrirFormulario(vi.fn().mockResolvedValue(false));
    fireEvent.click(screen.getByRole('button', { name: 'Enviar' }));
    expect(await screen.findByRole('alert')).toBeDefined();
    expect(campo.value).toBe('Concordo.');
  });

  it('mantém o texto quando o envio lança exceção', async () => {
    const campo = abrirFormulario(vi.fn().mockRejectedValue(new Error('rede')));
    fireEvent.click(screen.getByRole('button', { name: 'Enviar' }));
    expect(await screen.findByRole('alert')).toBeDefined();
    expect(campo.value).toBe('Concordo.');
  });

  it('limpa o campo só quando o envio dá certo', async () => {
    abrirFormulario(vi.fn().mockResolvedValue(true));
    fireEvent.click(screen.getByRole('button', { name: 'Enviar' }));
    await waitFor(() => expect(screen.queryByLabelText('Responder a @iury')).toBeNull());
  });

  it('segundo toque durante o envio não posta duas vezes', async () => {
    let liberar: (v: boolean) => void = () => {};
    const aoResponder = vi.fn(() => new Promise<boolean>((r) => { liberar = r; }));
    abrirFormulario(aoResponder);
    const botao = screen.getByRole('button', { name: 'Enviar' });
    fireEvent.click(botao);
    fireEvent.click(botao);
    expect(aoResponder).toHaveBeenCalledTimes(1);
    liberar(true);
    await waitFor(() => expect(screen.queryByLabelText('Responder a @iury')).toBeNull());
  });
});
