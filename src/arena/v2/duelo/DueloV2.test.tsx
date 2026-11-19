// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { DueloV2 } from '../../../portas/dueloV2';
import type { Compartilhamento, PedidoDeCompartilhamento } from '../../../portas/compartilhamento';
import { CriarDueloV2, ResponderDueloV2 } from './DueloV2';

const token = 'a'.repeat(64);
const audio = new Blob(['audio'], { type: 'audio/wav' });
const tentativa = { audio, duracaoMs: 1400 };
const resultado = { criador: { duracaoMs: 1200 }, desafiante: { duracaoMs: 1400 }, resultadoProvisorio: 'desafiante', versaoRegua: 'experimental-2', origemMedicao: 'cliente_nao_verificada' } as const;
function portas() {
  const duelo = {
    enviarGravacao: vi.fn(async () => ({ ok: true as const, valor: { id: 'gravacao' } })),
    retomarEnvio: vi.fn(async () => ({ ok: true as const, valor: { id: 'gravacao' } })),
    descartarTentativa: vi.fn(async () => ({ ok: true as const, valor: 'removida' as const })),
    removerGravacao: vi.fn(async () => ({ ok: true as const, valor: 'removida' as const })),
    novoToken: vi.fn(() => ({ ok: true as const, valor: token })),
    criar: vi.fn(async () => ({ ok: true as const, valor: { estado: 'aguardando_resposta' as const, id: 'duelo', versao: 1, prazo: '2026-11-25T00:00:00Z' } })),
    abrir: vi.fn(async () => ({ ok: true as const, valor: 'aguardando_resposta' as const })),
    responder: vi.fn(async () => ({ ok: true as const, valor: 'respondido' as const })),
    revelar: vi.fn(async () => ({ ok: true as const, valor: resultado })),
    baixarAudio: vi.fn(async () => ({ ok: true as const, valor: audio })),
    denunciar: vi.fn(async () => ({ ok: true as const, valor: 'registrada' as const })),
  };
  const cancelar = vi.fn(async () => ({ ok: true as const, valor: 'cancelada_local' as const }));
  const iniciarEnvioGravacao = vi.fn(() => ({ resultado: duelo.enviarGravacao(), cancelar }));
  Object.assign(duelo, { iniciarEnvioGravacao });
  const compartilhar = {
    compartilhar: vi.fn(async (_pedido: PedidoDeCompartilhamento) => ({ ok: true as const, via: 'texto' as const })),
    copiar: vi.fn(async () => true), sabeMandarImagem: vi.fn(() => false),
  } satisfies Compartilhamento;
  return { d: duelo, duelo: duelo as unknown as DueloV2, compartilhar, cancelar };
}
afterEach(cleanup);

describe('convite do duelo v2', () => {
  it('só envia após ação e compartilha link sem marca ou áudio', async () => {
    const { d, duelo, compartilhar } = portas();
    render(<CriarDueloV2 duelo={duelo} compartilhar={compartilhar} origem="https://teste.example" tentativa={tentativa} aoVoltar={vi.fn()} />);
    expect(d.enviarGravacao).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Criar desafio' }));
    expect(d.enviarGravacao).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('checkbox', { name: /Autorizo enviar minha gravação/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Criar desafio' }));
    expect(await screen.findByRole('button', { name: 'Compartilhar convite' })).toBeTruthy();
    const link = `https://teste.example/duelo#t=${token}`;
    expect((screen.getByLabelText('Link do desafio') as HTMLInputElement).value).toBe(link);
    fireEvent.click(screen.getByRole('button', { name: 'Compartilhar convite' }));
    await waitFor(() => expect(compartilhar.compartilhar).toHaveBeenCalledOnce());
    const pedido = compartilhar.compartilhar.mock.calls[0][0];
    expect(pedido.url).toBe(link);
    expect(JSON.stringify(pedido)).not.toContain('1400');
    expect(JSON.stringify(pedido)).not.toContain('audio/wav');
  });

  it('repete criação incerta com o mesmo token e sem novo upload', async () => {
    const { d, duelo, compartilhar } = portas();
    d.criar.mockRejectedValueOnce(new Error('timeout'));
    render(<CriarDueloV2 duelo={duelo} compartilhar={compartilhar} origem="https://teste.example" tentativa={tentativa} aoVoltar={vi.fn()} />);
    fireEvent.click(screen.getByRole('checkbox', { name: /Autorizo enviar minha gravação/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Criar desafio' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Tentar novamente' }));
    await screen.findByRole('button', { name: 'Compartilhar convite' });
    expect(d.enviarGravacao).toHaveBeenCalledTimes(1);
    expect(d.novoToken).toHaveBeenCalledTimes(1);
    expect(d.criar).toHaveBeenCalledTimes(2);
    expect(d.criar.mock.calls[0]).toEqual(['gravacao', token]);
    expect(d.criar.mock.calls[1]).toEqual(['gravacao', token]);
  });

  it('não revela nem baixa o rival antes de resposta confirmada', async () => {
    const { d, duelo } = portas();
    let confirmar!: (valor: { ok: true; valor: 'respondido' }) => void;
    d.responder.mockReturnValueOnce(new Promise((resolve) => { confirmar = resolve; }));
    render(<ResponderDueloV2 duelo={duelo} token={token} tentativa={tentativa} aoGravar={vi.fn()} aoVoltar={vi.fn()} />);
    fireEvent.click(await screen.findByRole('button', { name: 'Confirmar resposta' }));
    expect(d.enviarGravacao).not.toHaveBeenCalled();
    fireEvent.click(await screen.findByRole('checkbox', { name: /Autorizo enviar minha gravação/ }));
    fireEvent.click(await screen.findByRole('button', { name: 'Confirmar resposta' }));
    await waitFor(() => expect(d.responder).toHaveBeenCalledOnce());
    expect(d.revelar).not.toHaveBeenCalled();
    expect(d.baixarAudio).not.toHaveBeenCalled();
    confirmar({ ok: true, valor: 'respondido' });
    expect(await screen.findByRole('heading', { name: 'RESULTADO PROVISÓRIO' })).toBeTruthy();
    expect(d.revelar).toHaveBeenCalledOnce();
    expect(d.baixarAudio).not.toHaveBeenCalled();
  });

  it('não revela quando outra pessoa respondeu primeiro', async () => {
    const { d, duelo } = portas();
    d.responder.mockResolvedValueOnce({ ok: true, valor: 'ocupado' } as never);
    render(<ResponderDueloV2 duelo={duelo} token={token} tentativa={tentativa} aoGravar={vi.fn()} aoVoltar={vi.fn()} />);
    fireEvent.click(await screen.findByRole('checkbox', { name: /Autorizo enviar minha gravação/ }));
    fireEvent.click(await screen.findByRole('button', { name: 'Confirmar resposta' }));
    expect(await screen.findByText('Outra pessoa respondeu primeiro.')).toBeTruthy();
    expect(d.revelar).not.toHaveBeenCalled();
    expect(d.baixarAudio).not.toHaveBeenCalled();
  });

  it('reabre resultado autorizado sem supor qual participante está na sessão', async () => {
    const { d, duelo } = portas();
    d.abrir.mockResolvedValueOnce({ ok: true, valor: 'respondido' } as never);
    render(<ResponderDueloV2 duelo={duelo} token={token} tentativa={null} aoGravar={vi.fn()} aoVoltar={vi.fn()} />);
    expect(await screen.findByRole('heading', { name: 'RESULTADO PROVISÓRIO' })).toBeTruthy();
    expect(d.revelar).toHaveBeenCalledExactlyOnceWith(token);
    expect(screen.getByText('Quem criou')).toBeTruthy();
    expect(screen.getByText('Quem respondeu')).toBeTruthy();
    expect(screen.getByText('Quem respondeu levou esta rodada.')).toBeTruthy();
    expect(screen.queryByText('Você')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Denunciar áudio do adversário' })).toBeNull();
    expect(d.baixarAudio).not.toHaveBeenCalled();
  });

  it('não revela para terceiro quando o servidor nega acesso', async () => {
    const { d, duelo } = portas();
    d.abrir.mockResolvedValueOnce({ ok: true, valor: 'respondido' } as never);
    d.revelar.mockResolvedValueOnce({ ok: false, motivo: 'resultado_indisponivel' } as never);
    render(<ResponderDueloV2 duelo={duelo} token={token} tentativa={null} aoGravar={vi.fn()} aoVoltar={vi.fn()} />);
    expect(await screen.findByText('Não foi possível abrir o resultado. Tente novamente.')).toBeTruthy();
    expect(screen.queryByRole('heading', { name: 'RESULTADO PROVISÓRIO' })).toBeNull();
    expect(d.baixarAudio).not.toHaveBeenCalled();
  });

  it('não revela se a consulta do resultado falhar e permite nova tentativa', async () => {
    const { d, duelo } = portas();
    d.abrir.mockResolvedValueOnce({ ok: true, valor: 'respondido' } as never);
    d.revelar.mockResolvedValueOnce({ ok: false, motivo: 'falha_rede' } as never);
    render(<ResponderDueloV2 duelo={duelo} token={token} tentativa={null} aoGravar={vi.fn()} aoVoltar={vi.fn()} />);
    fireEvent.click(await screen.findByRole('button', { name: 'Tentar abrir resultado' }));
    expect(await screen.findByRole('heading', { name: 'RESULTADO PROVISÓRIO' })).toBeTruthy();
    expect(d.revelar).toHaveBeenCalledTimes(2);
    expect(screen.getByText('Quem criou')).toBeTruthy();
  });

  it('só denuncia o áudio adversário após escolher motivo e enviar', async () => {
    const { d, duelo } = portas();
    render(<ResponderDueloV2 duelo={duelo} token={token} tentativa={tentativa} aoGravar={vi.fn()} aoVoltar={vi.fn()} />);
    fireEvent.click(await screen.findByRole('checkbox', { name: /Autorizo enviar minha gravação/ }));
    fireEvent.click(await screen.findByRole('button', { name: 'Confirmar resposta' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Denunciar áudio do adversário' }));
    expect(d.denunciar).not.toHaveBeenCalled();
    expect((screen.getByRole('button', { name: 'Enviar denúncia' }) as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(screen.getByLabelText('Outro motivo'));
    expect(d.denunciar).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Enviar denúncia' }));
    expect(await screen.findByText('Denúncia registrada. O áudio ficará indisponível enquanto for analisado.')).toBeTruthy();
    expect(d.denunciar).toHaveBeenCalledExactlyOnceWith(token, 'criador', 'outro');
    expect((screen.getByRole('button', { name: 'Ouvir adversário' }) as HTMLButtonElement).disabled).toBe(true);
  });

  it.each([
    ['ja_analisada', 'Você já denunciou este áudio e a denúncia foi analisada.'],
    ['indisponivel', 'Não foi possível denunciar este áudio porque ele está indisponível.'],
  ] as const)('apresenta o retorno %s sem prometer novo registro', async (estado, mensagem) => {
    const { d, duelo } = portas();
    d.denunciar.mockResolvedValueOnce({ ok: true, valor: estado } as never);
    render(<ResponderDueloV2 duelo={duelo} token={token} tentativa={tentativa} aoGravar={vi.fn()} aoVoltar={vi.fn()} />);
    fireEvent.click(await screen.findByRole('checkbox', { name: /Autorizo enviar minha gravação/ }));
    fireEvent.click(await screen.findByRole('button', { name: 'Confirmar resposta' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Denunciar áudio do adversário' }));
    fireEvent.click(screen.getByLabelText('Conteúdo ofensivo'));
    fireEvent.click(screen.getByRole('button', { name: 'Enviar denúncia' }));
    expect(await screen.findByText(mensagem)).toBeTruthy();
    expect(d.denunciar).toHaveBeenCalledExactlyOnceWith(token, 'criador', 'ofensivo');
  });

  it('trata falha e impede envios simultâneos, permitindo nova tentativa explícita', async () => {
    const { d, duelo } = portas();
    let concluir!: (v: { ok: false; motivo: 'falha_rede' }) => void;
    d.denunciar.mockReturnValueOnce(new Promise(resolve => { concluir = resolve; }) as never);
    render(<ResponderDueloV2 duelo={duelo} token={token} tentativa={tentativa} aoGravar={vi.fn()} aoVoltar={vi.fn()} />);
    fireEvent.click(await screen.findByRole('checkbox', { name: /Autorizo enviar minha gravação/ }));
    fireEvent.click(await screen.findByRole('button', { name: 'Confirmar resposta' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Denunciar áudio do adversário' }));
    fireEvent.click(screen.getByLabelText('Conteúdo ofensivo'));
    const enviar = screen.getByRole('button', { name: 'Enviar denúncia' });
    fireEvent.click(enviar); fireEvent.click(enviar);
    expect(d.denunciar).toHaveBeenCalledTimes(1);
    await act(async () => { concluir({ ok: false, motivo: 'falha_rede' }); });
    expect(screen.getByRole('alert').textContent).toMatch(/Não foi possível confirmar/);
    fireEvent.click(screen.getByRole('button', { name: 'Enviar denúncia' }));
    expect(await screen.findByText(/Denúncia registrada/)).toBeTruthy();
    expect(d.denunciar).toHaveBeenCalledTimes(2);
  });

  it('informa falha quando carregar áudio rejeita a promessa', async () => {
    const { d, duelo } = portas();
    d.baixarAudio.mockRejectedValueOnce(new Error('rede'));
    render(<ResponderDueloV2 duelo={duelo} token={token} tentativa={tentativa} aoGravar={vi.fn()} aoVoltar={vi.fn()} />);
    fireEvent.click(await screen.findByRole('checkbox', { name: /Autorizo enviar minha gravação/ }));
    fireEvent.click(await screen.findByRole('button', { name: 'Confirmar resposta' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Ouvir adversário' }));
    expect((await screen.findByRole('alert')).textContent).toBe('Não foi possível carregar esse áudio.');
  });

  it('não abre áudio cujo download terminou depois de uma denúncia registrada', async () => {
    const { d, duelo } = portas();
    let concluir!: (v: { ok: true; valor: Blob }) => void;
    d.baixarAudio.mockReturnValueOnce(new Promise(resolve => { concluir = resolve; }));
    render(<ResponderDueloV2 duelo={duelo} token={token} tentativa={tentativa} aoGravar={vi.fn()} aoVoltar={vi.fn()} />);
    fireEvent.click(await screen.findByRole('checkbox', { name: /Autorizo enviar minha gravação/ }));
    fireEvent.click(await screen.findByRole('button', { name: 'Confirmar resposta' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Ouvir adversário' }));
    fireEvent.click(screen.getByRole('button', { name: 'Denunciar áudio do adversário' }));
    fireEvent.click(screen.getByLabelText('Conteúdo ofensivo'));
    fireEvent.click(screen.getByRole('button', { name: 'Enviar denúncia' }));
    await screen.findByText(/Denúncia registrada/);
    await act(async () => { concluir({ ok: true, valor: audio }); });
    expect(screen.queryByLabelText('Áudio do adversário')).toBeNull();
  });

  it('informa falha quando o envio da denúncia rejeita a promessa', async () => {
    const { d, duelo } = portas();
    d.denunciar.mockRejectedValueOnce(new Error('rede'));
    render(<ResponderDueloV2 duelo={duelo} token={token} tentativa={tentativa} aoGravar={vi.fn()} aoVoltar={vi.fn()} />);
    fireEvent.click(await screen.findByRole('checkbox', { name: /Autorizo enviar minha gravação/ }));
    fireEvent.click(await screen.findByRole('button', { name: 'Confirmar resposta' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Denunciar áudio do adversário' }));
    fireEvent.click(screen.getByLabelText('Conteúdo ofensivo'));
    fireEvent.click(screen.getByRole('button', { name: 'Enviar denúncia' }));
    expect((await screen.findByRole('alert')).textContent).toMatch(/Não foi possível confirmar/);
  });
  it('ignora conclusão tardia após cancelamento incerto', async () => {
    const { d, duelo, compartilhar, cancelar } = portas();
    let concluir!: (v: { ok: true; valor: { id: string } }) => void;
    d.enviarGravacao.mockReturnValueOnce(new Promise(resolve => { concluir = resolve; }));
    cancelar.mockResolvedValueOnce({ ok: true, valor: 'preparacao_incerta' } as never);
    render(<CriarDueloV2 duelo={duelo} compartilhar={compartilhar} origem="https://teste.example" tentativa={tentativa} aoVoltar={vi.fn()} />);
    fireEvent.click(screen.getByRole('checkbox', { name: /Autorizo enviar minha gravação/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Criar desafio' }));
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar envio' }));
    expect(await screen.findByText(/Não foi possível confirmar o cancelamento no servidor/)).toBeTruthy();
    await act(async () => { concluir({ ok: true, valor: { id: 'gravacao' } }); });
    expect(d.criar).not.toHaveBeenCalled();
  });

  it('tenta cancelar upload pendente ao desmontar', async () => {
    const { d, duelo, cancelar } = portas();
    d.enviarGravacao.mockReturnValueOnce(new Promise(() => {}));
    const view = render(<ResponderDueloV2 duelo={duelo} token={token} tentativa={tentativa} aoGravar={vi.fn()} aoVoltar={vi.fn()} />);
    fireEvent.click(await screen.findByRole('checkbox', { name: /Autorizo enviar minha gravação/ }));
    fireEvent.click(await screen.findByRole('button', { name: 'Confirmar resposta' }));
    view.unmount();
    expect(cancelar).toHaveBeenCalledOnce();
    expect(d.responder).not.toHaveBeenCalled();
  });

  it('tenta descartar retomada pendente ao desmontar', async () => {
    const { d, duelo, compartilhar } = portas();
    d.enviarGravacao.mockResolvedValueOnce({ ok: false, tentativaId: 'pendente' } as never);
    d.retomarEnvio.mockReturnValueOnce(new Promise(() => {}));
    const view = render(<CriarDueloV2 duelo={duelo} compartilhar={compartilhar} origem="https://teste.example" tentativa={tentativa} aoVoltar={vi.fn()} />);
    fireEvent.click(screen.getByRole('checkbox', { name: /Autorizo enviar minha gravação/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Criar desafio' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Tentar novamente' }));
    view.unmount();
    expect(d.descartarTentativa).toHaveBeenCalledWith('pendente');
  });

  it('não responde após cancelamento e conclusão tardia do envio', async () => {
    const { d, duelo, cancelar } = portas();
    let concluir!: (v: { ok: true; valor: { id: string } }) => void;
    d.enviarGravacao.mockReturnValueOnce(new Promise(resolve => { concluir = resolve; }));
    cancelar.mockResolvedValueOnce({ ok: true, valor: 'preparacao_incerta' } as never);
    render(<ResponderDueloV2 duelo={duelo} token={token} tentativa={tentativa} aoGravar={vi.fn()} aoVoltar={vi.fn()} />);
    fireEvent.click(await screen.findByRole('checkbox', { name: /Autorizo enviar minha gravação/ }));
    fireEvent.click(await screen.findByRole('button', { name: 'Confirmar resposta' }));
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar envio' }));
    await screen.findByText(/Não foi possível confirmar o cancelamento no servidor/);
    await act(async () => { concluir({ ok: true, valor: { id: 'gravacao' } }); });
    expect(d.responder).not.toHaveBeenCalled();
    expect(d.revelar).not.toHaveBeenCalled();
  });

});

it('identifica a pessoa ao reabrir e denuncia somente o adversário', async () => {
  const { d, duelo } = portas();
  d.abrir.mockResolvedValueOnce({ ok: true, valor: 'respondido' } as never);
  d.revelar.mockResolvedValueOnce({ ok: true, valor: { criador: { duracaoMs: 1200 }, desafiante: { duracaoMs: 1400 }, resultadoProvisorio: 'desafiante', versaoRegua: 'experimental-2', origemMedicao: 'cliente_nao_verificada', ladoSessao: 'criador' } } as never);
  render(<ResponderDueloV2 duelo={duelo} token={token} tentativa={null} aoGravar={vi.fn()} aoVoltar={vi.fn()} />);
  expect(await screen.findByText('Seu adversário levou esta rodada.')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Denunciar áudio do adversário' }));
  fireEvent.click(screen.getByLabelText('Conteúdo ofensivo'));
  fireEvent.click(screen.getByRole('button', { name: 'Enviar denúncia' }));
  await screen.findByText(/Denúncia registrada/);
  expect(d.denunciar).toHaveBeenCalledWith(token, 'desafiante', 'ofensivo');
});
