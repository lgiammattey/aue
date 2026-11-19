// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { DueloV2 } from '../../../portas/dueloV2';
import { EntradaDueloV2 } from './EntradaDueloV2';

const token = 'a'.repeat(64);
const tentativa = { audio: new Blob([new Uint8Array(50)], { type: 'audio/wav' }), duracaoMs: 1200 };
afterEach(cleanup);

describe('entrada do convite', () => {
  it('oferece volta quando o link é inválido sem abrir convite', () => {
    const abrir = vi.fn(); const voltar = vi.fn();
    render(<EntradaDueloV2 tentativa={null} aoGravar={vi.fn()} aoVoltar={voltar} duelo={{ abrir } as unknown as DueloV2} lerToken={() => 'invalido'} />);
    expect(screen.getByText('O link está incompleto ou é inválido. Peça um novo convite.')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Voltar' }));
    expect(voltar).toHaveBeenCalledOnce(); expect(abrir).not.toHaveBeenCalled();
  });
  it('abre convite e pede à Arena uma tentativa, sem enviar nem revelar', async () => {
    const abrir = vi.fn(async () => ({ ok: true as const, valor: 'aguardando_resposta' as const }));
    const iniciarEnvioGravacao = vi.fn(); const revelar = vi.fn(); const gravar = vi.fn();
    const duelo = { abrir, iniciarEnvioGravacao, revelar } as unknown as DueloV2;
    render(<EntradaDueloV2 tentativa={null} aoGravar={gravar} aoVoltar={vi.fn()} duelo={duelo} lerToken={() => token} />);
    fireEvent.click(await screen.findByRole('button', { name: 'Aceitar e gravar' }));
    expect(abrir).toHaveBeenCalledWith(token); expect(gravar).toHaveBeenCalledOnce();
    expect(iniciarEnvioGravacao).not.toHaveBeenCalled(); expect(revelar).not.toHaveBeenCalled();
  });
  it('usa a tentativa revisada e cancela envio ao desmontar', async () => {
    const cancelar = vi.fn(async () => ({ ok: true as const, valor: 'remocao_pendente' as const }));
    const iniciarEnvioGravacao = vi.fn(() => ({ resultado: new Promise<never>(() => {}), cancelar }));
    const responder = vi.fn(); const revelar = vi.fn();
    const duelo = { abrir: vi.fn(async () => ({ ok: true as const, valor: 'aguardando_resposta' as const })), iniciarEnvioGravacao, responder, revelar } as unknown as DueloV2;
    const tela = render(<EntradaDueloV2 tentativa={tentativa} aoGravar={vi.fn()} aoVoltar={vi.fn()} duelo={duelo} lerToken={() => token} />);
    fireEvent.click(await screen.findByRole('checkbox', { name: /Autorizo enviar minha gravação/ }));
    fireEvent.click(await screen.findByRole('button', { name: 'Confirmar resposta' }));
    expect(iniciarEnvioGravacao).toHaveBeenCalledWith(tentativa.audio, tentativa.duracaoMs);
    tela.unmount();
    await waitFor(() => expect(cancelar).toHaveBeenCalledOnce());
    expect(responder).not.toHaveBeenCalled(); expect(revelar).not.toHaveBeenCalled();
  });
});
