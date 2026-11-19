// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import type { CapturaPcmV2 } from '../../portas/capturaPcmV2';
import type { DueloV2 } from '../../portas/dueloV2';
import type { Compartilhamento } from '../../portas/compartilhamento';
import { FluxoArenaV2 } from './FluxoArenaV2';
import { soltarEnderecoLocal } from '../../plataforma/web/enderecoDeAudio';

vi.mock('../../plataforma/web/enderecoDeAudio', () => ({ criarEnderecoLocal: () => 'blob:local', soltarEnderecoLocal: vi.fn() }));
afterEach(cleanup);
const token = 'a'.repeat(64);
function dados() {
  let eventos!: Parameters<CapturaPcmV2['iniciar']>[0];
  const tom = (n: number, amp: number) => Float32Array.from({ length: n }, (_, i) => amp * Math.sin(2 * Math.PI * 40 * i / 1000));
  const captura: CapturaPcmV2 = { iniciar: vi.fn(async (e) => { eventos = e; return { ok: true as const }; }), parar: vi.fn(async () => ({ ok: true as const, audio: new Blob(['original']), formato: 'audio/webm', ambiente: tom(500, .01), emissao: tom(1000, .1), sampleRate: 1000 })), cancelar: vi.fn(), nivelAtual: () => 0, estaGravando: () => true };
  const cancelar = vi.fn(async () => ({ ok: true as const, valor: 'cancelada_local' as const }));
  const d = {
    iniciarEnvioGravacao: vi.fn((_audio: Blob, _duracaoMs: number) => ({ resultado: Promise.resolve({ ok: true as const, valor: { id: 'audio' } }), cancelar })),
    novoToken: vi.fn(() => ({ ok: true as const, valor: token })),
    criar: vi.fn(async () => ({ ok: true as const, valor: { estado: 'aguardando_resposta', id: 'duelo', versao: 1, prazo: '2027-01-01' } })),
    abrir: vi.fn(async () => ({ ok: true as const, valor: 'aguardando_resposta' })),
    responder: vi.fn(async () => ({ ok: true as const, valor: 'respondido' })),
    revelar: vi.fn(async () => ({ ok: true as const, valor: { criador: { duracaoMs: 1200 }, desafiante: { duracaoMs: 1000 }, resultadoProvisorio: 'criador', versaoRegua: 'x', origemMedicao: 'cliente_nao_verificada' } })),
    baixarAudio: vi.fn(),
  };
  const compartilhar = { compartilhar: vi.fn(), copiar: vi.fn(), sabeMandarImagem: () => false } as unknown as Compartilhamento;
  return { captura, eventos: () => eventos, duelo: d as unknown as DueloV2, d, compartilhar, cancelar };
}
async function gravar(d: ReturnType<typeof dados>) {
  fireEvent.click(screen.getByRole('button', { name: 'Gravar meu arroto' }));
  await screen.findByText(/Calibrando o ambiente/);
  act(() => d.eventos().aoCalibrar());
  fireEvent.click(await screen.findByRole('button', { name: 'Finalizar gravação' }));
  await screen.findByRole('heading', { name: 'SUA GRAVAÇÃO' });
}
it('cria convite somente após revisão e ação explícita', async () => {
  const d = dados();
  render(<FluxoArenaV2 modo="criar" duelo={d.duelo} compartilhar={d.compartilhar} origem="https://teste.example" captura={d.captura} />);
  await gravar(d);
  expect(d.d.iniciarEnvioGravacao).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Criar desafio' }));
  expect(d.d.iniciarEnvioGravacao).not.toHaveBeenCalled();
  fireEvent.click(screen.getByLabelText(/Autorizo enviar minha gravação/));
  fireEvent.click(screen.getByRole('button', { name: 'Criar desafio' }));
  await screen.findByRole('button', { name: 'Compartilhar convite' });
  expect(d.d.iniciarEnvioGravacao.mock.calls[0][0].type).toBe('audio/wav');
});
it('grava resposta sem carregar áudio do adversário e só revela depois de confirmar', async () => {
  const d = dados();
  render(<FluxoArenaV2 modo="responder" duelo={d.duelo} lerToken={() => token} captura={d.captura} />);
  fireEvent.click(await screen.findByRole('button', { name: 'Aceitar e gravar' }));
  await gravar(d);
  fireEvent.click(screen.getByRole('button', { name: 'Usar esta gravação' }));
  expect(d.d.baixarAudio).not.toHaveBeenCalled();
  expect(d.d.responder).not.toHaveBeenCalled();
  fireEvent.click(screen.getByLabelText(/Autorizo enviar minha gravação/));
  fireEvent.click(screen.getByRole('button', { name: 'Confirmar resposta' }));
  await screen.findByRole('heading', { name: 'RESULTADO PROVISÓRIO' });
  expect(d.d.responder).toHaveBeenCalledOnce();
  expect(d.d.baixarAudio).not.toHaveBeenCalled();
});
it('permite pré-visualizar o placar e iniciar outra disputa sem enviar automaticamente', async () => {
  const d = dados();
  vi.mocked(d.compartilhar.compartilhar).mockResolvedValue({ ok: true, via: 'texto' });
  render(<FluxoArenaV2 modo="responder" duelo={d.duelo} compartilhar={d.compartilhar} origem="https://teste.example" lerToken={() => token} captura={d.captura} />);
  fireEvent.click(await screen.findByRole('button', { name: 'Aceitar e gravar' }));
  await gravar(d);
  fireEvent.click(screen.getByRole('button', { name: 'Usar esta gravação' }));
  fireEvent.click(screen.getByRole('checkbox', { name: /Autorizo enviar minha gravação/ }));
  fireEvent.click(screen.getByRole('button', { name: 'Confirmar resposta' }));
  await screen.findByRole('heading', { name: 'RESULTADO PROVISÓRIO' });
  fireEvent.click(screen.getByRole('button', { name: 'Compartilhar resultado' }));
  expect(screen.getByText(/Resultado provisório no Auê:/).textContent).not.toContain(token);
  expect(d.compartilhar.compartilhar).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Abrir compartilhamento' }));
  await waitFor(() => expect(d.compartilhar.compartilhar).toHaveBeenCalledOnce());
  expect(vi.mocked(d.compartilhar.compartilhar).mock.calls[0][0].texto).not.toContain(token);
  fireEvent.click(screen.getByRole('button', { name: 'Pedir revanche' }));
  expect(screen.getByRole('button', { name: 'Gravar meu arroto' })).toBeTruthy();
  expect(d.d.criar).not.toHaveBeenCalled();
  await gravar(d);
  expect(screen.getByRole('button', { name: 'Criar desafio' })).toBeTruthy();
});
it('cancela envio pendente no fluxo de criação', async () => {
  const d = dados();
  d.d.iniciarEnvioGravacao.mockReturnValueOnce({ resultado: new Promise(() => {}), cancelar: d.cancelar });
  render(<FluxoArenaV2 modo="criar" duelo={d.duelo} compartilhar={d.compartilhar} origem="https://teste.example" captura={d.captura} />);
  await gravar(d);
  fireEvent.click(screen.getByRole('button', { name: 'Criar desafio' }));
  fireEvent.click(screen.getByLabelText(/Autorizo enviar minha gravação/));
  fireEvent.click(screen.getByRole('button', { name: 'Criar desafio' }));
  fireEvent.click(screen.getByRole('button', { name: 'Cancelar envio' }));
  await waitFor(() => expect(d.cancelar).toHaveBeenCalledOnce());
  expect(d.d.criar).not.toHaveBeenCalled();
});
it('sem configuração mantém gravação local e não abre duelo', async () => {
  const d = dados();
  render(<FluxoArenaV2 modo="criar" captura={d.captura} aoVoltar={vi.fn()} />);
  await gravar(d);
  expect(screen.queryByRole('button', { name: 'Criar desafio' })).toBeNull();
  expect(screen.getByText('O duelo não está disponível neste ambiente. Sua gravação continua local.')).toBeTruthy();
});

it('voltar durante gravação encerra captura e reabre Arena pronta', async () => {
  const d = dados();
  render(<FluxoArenaV2 modo="responder" duelo={d.duelo} lerToken={() => token} captura={d.captura} />);
  fireEvent.click(await screen.findByRole('button', { name: 'Aceitar e gravar' }));
  fireEvent.click(screen.getByRole('button', { name: 'Gravar meu arroto' }));
  await screen.findByText(/Calibrando o ambiente/);
  act(() => d.eventos().aoCalibrar());
  await screen.findByRole('button', { name: 'Finalizar gravação' });
  fireEvent.click(screen.getByRole('button', { name: 'Voltar' }));
  expect(d.captura.cancelar).toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Aceitar e gravar' }));
  expect(screen.getByRole('button', { name: 'Gravar meu arroto' })).toBeTruthy();
  expect(screen.queryByRole('button', { name: 'Finalizar gravação' })).toBeNull();
});

it('ao encerrar desmonta a Arena e libera endereço local da gravação', async () => {
  const d = dados();
  vi.mocked(soltarEnderecoLocal).mockClear();
  render(<FluxoArenaV2 modo="criar" captura={d.captura} aoVoltar={vi.fn()} />);
  await gravar(d);
  await screen.findByLabelText('Sua gravação');
  fireEvent.click(screen.getByRole('button', { name: 'Voltar' }));
  expect(screen.getByText('Fluxo encerrado.')).toBeTruthy();
  expect(soltarEnderecoLocal).toHaveBeenCalledWith('blob:local');
  expect(screen.queryByLabelText('Sua gravação')).toBeNull();
});


it('abre meus desafios a partir da Arena e permite voltar', async () => {
  const d = dados();
  Object.assign(d.d, { listarMeusDuelos: vi.fn(async () => ({ ok: true, valor: { itens: [], temMais: false } })) });
  render(<FluxoArenaV2 modo="criar" duelo={d.duelo} compartilhar={d.compartilhar} origem="https://teste.example" captura={d.captura} />);
  fireEvent.click(screen.getByRole('button', { name: 'Meus desafios' }));
  expect(await screen.findByText('Nenhum desafio encontrado nesta sessão.')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Voltar' }));
  expect(screen.getByRole('button', { name: 'Gravar meu arroto' })).toBeTruthy();
});

it('não abre meus desafios por cima de uma tentativa em andamento ou revisão', async () => {
  const d = dados();
  render(<FluxoArenaV2 modo="criar" duelo={d.duelo} compartilhar={d.compartilhar} origem="https://teste.example" captura={d.captura} />);
  expect(screen.getByRole('button', { name: 'Meus desafios' })).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Gravar meu arroto' }));
  expect(screen.queryByRole('button', { name: 'Meus desafios' })).toBeNull();
  await screen.findByText(/Calibrando o ambiente/);
  act(() => d.eventos().aoCalibrar());
  fireEvent.click(await screen.findByRole('button', { name: 'Finalizar gravação' }));
  await screen.findByRole('heading', { name: 'SUA GRAVAÇÃO' });
  expect(screen.queryByRole('button', { name: 'Meus desafios' })).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Descartar e gravar outra' }));
  expect(screen.getByRole('button', { name: 'Meus desafios' })).toBeTruthy();
});
