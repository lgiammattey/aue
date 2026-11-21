// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import type { CapturaPcmV2 } from '../../portas/capturaPcmV2';
import { criarOndaDoAudio } from '../../plataforma/web/ondaDoAudio';
import { ArenaV2 } from './ArenaV2';

vi.mock('../../plataforma/web/enderecoDeAudio', () => ({ criarEnderecoLocal: () => 'blob:local', soltarEnderecoLocal: vi.fn() }));
vi.mock('../../plataforma/web/ondaDoAudio', () => ({ criarOndaDoAudio: vi.fn() }));
afterEach(() => { cleanup(); vi.resetAllMocks(); });

async function abrirRevisao() {
  let eventos!: Parameters<CapturaPcmV2['iniciar']>[0];
  const tom = (amplitude: number) => Float32Array.from({ length: 1000 }, (_, i) => amplitude * Math.sin(2 * Math.PI * 40 * i / 1000));
  const captura: CapturaPcmV2 = {
    iniciar: vi.fn(async (valor) => { eventos = valor; return { ok: true as const }; }),
    parar: vi.fn(async () => ({ ok: true as const, audio: new Blob(['teste']), formato: 'audio/webm', ambiente: tom(0.01), emissao: tom(0.1), sampleRate: 1000 })),
    cancelar: vi.fn(), nivelAtual: () => 0, estaGravando: () => true,
  };
  render(<ArenaV2 captura={captura} />);
  fireEvent.click(screen.getByRole('button', { name: 'Gravar agora' }));
  await screen.findByText(/Calibrando\. Fica quieto 1s\./);
  act(() => eventos.aoCalibrar());
  fireEvent.click(await screen.findByRole('button', { name: 'Finalizar gravação' }));
  await screen.findByRole('heading', { name: 'SUA GRAVAÇÃO' });
}

it('permite ouvir com o player nativo quando a onda falha', async () => {
  vi.mocked(criarOndaDoAudio).mockRejectedValue(new Error('Onda indisponível'));
  await abrirRevisao();
  await waitFor(() => expect(criarOndaDoAudio).toHaveBeenCalledOnce());
  expect(screen.getByLabelText('Sua gravação').hasAttribute('controls')).toBe(true);
  expect(screen.queryByRole('button', { name: 'Reproduzir gravação' })).toBeNull();
});

it('encerra a onda se a pessoa descartar antes de ela estar pronta', async () => {
  const encerrar = vi.fn();
  let concluir!: (controle: Awaited<ReturnType<typeof criarOndaDoAudio>>) => void;
  vi.mocked(criarOndaDoAudio).mockImplementation(() => new Promise((resolve) => { concluir = resolve; }));
  await abrirRevisao();
  await waitFor(() => expect(criarOndaDoAudio).toHaveBeenCalledOnce());
  fireEvent.click(screen.getByRole('button', { name: 'Descartar e gravar outra' }));
  await act(async () => concluir({ encerrar, alternar: async () => {}, buscar: () => {} }));
  expect(encerrar).toHaveBeenCalledOnce();
});
