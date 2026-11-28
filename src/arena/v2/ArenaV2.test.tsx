// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { CapturaDeAudio, PedidoDeMicrofone } from '../../portas/captura';
import type { CapturaPcmV2, InicioCapturaPcmV2 } from '../../portas/capturaPcmV2';
import { ArenaV2 } from './ArenaV2';
import { criarEnderecoLocal } from '../../plataforma/web/enderecoDeAudio';

vi.mock('../../plataforma/web/enderecoDeAudio', () => ({
  criarEnderecoLocal: vi.fn(() => 'blob:gravacao'),
  soltarEnderecoLocal: vi.fn(),
}));

afterEach(() => { cleanup(); vi.useRealTimers(); });

type Eventos = Parameters<CapturaPcmV2['iniciar']>[0];
function tom(segundos: number, amplitude: number) {
  return Float32Array.from({ length: 1000 * segundos }, (_, i) => amplitude * Math.sin(2 * Math.PI * 40 * i / 1000));
}
function aparelho(inicio: Promise<InicioCapturaPcmV2> = Promise.resolve({ ok: true })) {
  let eventos: Eventos | undefined;
  const captura = {
    iniciar: vi.fn((novos: Eventos) => { eventos = novos; return inicio; }),
    parar: vi.fn(async () => ({ ok: true as const, audio: new Blob(['som'], { type: 'audio/webm' }), formato: 'audio/webm', ambiente: tom(0.5, 0.01), emissao: tom(1, 0.1), sampleRate: 1000 })),
    nivelAtual: vi.fn(() => 0.2),
    cancelar: vi.fn(),
    estaGravando: vi.fn(() => true),
  } satisfies CapturaPcmV2;
  return { captura, eventos: () => { if (!eventos) throw new Error('captura não iniciada'); return eventos; } };
}

function gravadorSimples(pedido: Promise<PedidoDeMicrofone> = Promise.resolve({ ok: true })) {
  return {
    pedir: vi.fn(() => pedido),
    comecar: vi.fn(() => true),
    parar: vi.fn(async () => ({ dados: new Blob(['som']), formato: 'audio/webm', duracaoMs: 1000, resumo: { rms: 0.1, pico: 0.3 } })),
    nivelAtual: vi.fn(() => 0.2),
    soltar: vi.fn(),
    estaVivo: vi.fn(() => true),
    estaGravando: vi.fn(() => true),
  } satisfies CapturaDeAudio;
}

async function iniciar(duble: ReturnType<typeof aparelho>) {
  fireEvent.click(screen.getByRole('button', { name: 'Gravar agora' }));
  await screen.findByText(/Calibrando\. Fica quieto 1s\./);
  act(() => { duble.eventos().aoCalibrar(); });
  await screen.findByRole('button', { name: 'Finalizar gravação' });
}

describe('Arena v2', () => {
  it('mede somente etapas concluídas e não confunde abertura de compartilhamento com envio', async () => {
    const duble = aparelho(); const registrar = vi.fn();
    const compartilhamento = { compartilhar: vi.fn(async () => 'aberto' as const), baixar: vi.fn(() => true) };
    render(<ArenaV2 captura={duble.captura} telemetria={{ registrar }} compartilhamentoDeAudio={compartilhamento} />);
    expect(registrar).toHaveBeenCalledWith('abriu_arena_v2');
    await iniciar(duble);
    expect(registrar).toHaveBeenCalledWith('iniciou_gravacao');
    fireEvent.click(screen.getByRole('button', { name: 'Finalizar gravação' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Compartilhar áudio' }));
    await screen.findByText('Opções de compartilhamento abertas.');
    fireEvent.click(screen.getByRole('button', { name: 'Baixar áudio' }));
    expect(registrar.mock.calls.map(([evento]) => evento)).toEqual(['abriu_arena_v2', 'iniciou_gravacao', 'concluiu_gravacao', 'laudo_disponivel', 'abriu_compartilhamento_audio', 'solicitou_download_audio']);
    expect(registrar.mock.calls.every((args) => args.length === 1)).toBe(true);
  });
  it('laudo inconclusivo registra indisponibilidade, não resultado', async () => {
    const duble = aparelho(); const registrar = vi.fn();
    duble.captura.parar.mockResolvedValueOnce({ ok: true, audio: new Blob(['som']), formato: 'audio/webm', ambiente: new Float32Array(500), emissao: tom(1, 0.1), sampleRate: 1000 });
    render(<ArenaV2 captura={duble.captura} telemetria={{ registrar }} />);
    await iniciar(duble); fireEvent.click(screen.getByRole('button', { name: 'Finalizar gravação' }));
    await screen.findByText(/Não foi possível medir o ambiente/);
    expect(registrar).toHaveBeenCalledWith('laudo_indisponivel');
    expect(registrar).not.toHaveBeenCalledWith('laudo_disponivel');
  });
  it('mantém o desafio visível e explica quando a duração não pôde ser medida', async () => {
    const duble = aparelho();
    duble.captura.parar.mockResolvedValueOnce({ ok: true, audio: new Blob(['som']), formato: 'audio/webm', ambiente: tom(0.5, 0.01), emissao: new Float32Array(1000), sampleRate: 1000 });
    const avancar = vi.fn();
    render(<ArenaV2 captura={duble.captura} aoUsarTentativa={avancar} rotuloUsarTentativa="Criar desafio" />);
    await iniciar(duble);
    fireEvent.click(screen.getByRole('button', { name: 'Finalizar gravação' }));
    const botao = await screen.findByRole('button', { name: 'Criar desafio' });
    expect(botao.hasAttribute('disabled')).toBe(true);
    expect(screen.getByText(/Não conseguimos medir a duração desta tentativa/)).toBeTruthy();
    expect(screen.getByText(/grave outra tentativa com medição disponível/)).toBeTruthy();
    fireEvent.click(botao);
    expect(avancar).not.toHaveBeenCalled();
  });
  it('em inglês, a Arena fala inglês do começo ao fim e não mostra atalhos em português', async () => {
    const duble = aparelho();
    render(<ArenaV2 captura={duble.captura} idioma="en" />);
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('BURP IT OUT.');
    expect(screen.getByText('Record on your mic, see your score and send it to your friends.')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Gravar agora' })).toBeNull();
    expect(screen.queryByRole('link', { name: 'Mural' })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Record now' }));
    await screen.findByText('Calibrating. Stay quiet for 1 second.');
    act(() => { duble.eventos().aoCalibrar(); });
    await screen.findByRole('button', { name: 'Stop recording' });
    expect(screen.getByText('RECORDING')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Stop recording' }));
    await screen.findByText('YOUR RECORDING');
    expect(screen.getByRole('button', { name: 'Discard and record another' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Share audio' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Download audio' })).toBeTruthy();
  });

  it('em inglês, o microfone negado aparece em inglês, com o botão de tentar de novo', async () => {
    const duble = aparelho(Promise.resolve({ ok: false, motivo: 'permissao_negada' }));
    render(<ArenaV2 captura={duble.captura} idioma="en" />);
    fireEvent.click(screen.getByRole('button', { name: 'Record now' }));
    expect((await screen.findByRole('alert')).textContent).toBe('The microphone is blocked. Allow access in your browser settings and try again.');
    expect(screen.getByRole('button', { name: 'Try again' })).toBeTruthy();
  });

  it('avisa que o jogo está em beta ao lado da marca, sem tirar o botão de gravar do lugar', () => {
    const duble = aparelho();
    render(<ArenaV2 captura={duble.captura} />);
    const selo = screen.getByText('BETA');
    expect(selo.previousElementSibling?.textContent).toBe('AUÊ!');
    expect(screen.getByRole('button', { name: 'Gravar agora' })).toBeTruthy();
  });

  it('não pede microfone na entrada e abre o mural pela rota existente', () => {
    const { captura } = aparelho();
    render(<ArenaV2 captura={captura} />);
    expect(captura.iniciar).not.toHaveBeenCalled();
    expect(screen.getByRole('link', { name: 'Mural' }).getAttribute('href')).toBe('/feed');
    expect(screen.getByRole('button', { name: 'Gravar agora' })).toBeTruthy();
  });

  it('calibra, grava após a referência e mostra leitura experimental sem publicar', async () => {
    const duble = aparelho();
    render(<ArenaV2 captura={duble.captura} />);
    await iniciar(duble);
    fireEvent.click(screen.getByRole('button', { name: 'Finalizar gravação' }));
    await screen.findByRole('heading', { name: 'SUA GRAVAÇÃO' });
    expect(duble.captura.parar).toHaveBeenCalledOnce();
    expect(screen.getByText(/ela não foi publicada no Auê/)).toBeTruthy();
    expect(screen.getByRole('region', { name: 'Laudo experimental' })).toBeTruthy();
    expect(screen.getByText('Nota do arroto')).toBeTruthy();
    expect(screen.getByRole('img', { name: /Nota: \d+ de 100/ })).toBeTruthy();
    expect(screen.getByText('Duração detectada')).toBeTruthy();
    expect(screen.getByText('Potência relativa')).toBeTruthy();
    expect(screen.getByText('Indisponível')).toBeTruthy();
    expect(await screen.findByLabelText('Sua gravação')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Descartar e gravar outra' }));
    expect(screen.getByRole('button', { name: 'Gravar agora' })).toBeTruthy();
  });

  it('só mostra o conteúdo posterior depois da revisão da gravação', async () => {
    const duble = aparelho();
    render(<ArenaV2 captura={duble.captura} conteudoAposResultado={<aside>Espaço após o resultado</aside>} />);
    expect(screen.queryByText('Espaço após o resultado')).toBeNull();
    await iniciar(duble);
    fireEvent.click(screen.getByRole('button', { name: 'Finalizar gravação' }));
    expect(await screen.findByText('Espaço após o resultado')).toBeTruthy();
  });

  it('entrega a duração real e pausa a reprodução antes de pedir publicação', async () => {
    const duble = aparelho();
    const publicar = vi.fn();
    render(<ArenaV2 captura={duble.captura} aoPublicarAudio={publicar} />);
    await iniciar(duble);
    fireEvent.click(screen.getByRole('button', { name: 'Finalizar gravação' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Publicar no Mural' }));
    expect(publicar).toHaveBeenCalledWith(expect.any(Blob), expect.any(Number), 1000);
  });

  it('reproduz só o PCM da emissão, sem áudio da calibração ou arquivo original', async () => {
    const duble = aparelho();
    const ambiente = new Float32Array(500).fill(0.75);
    const emissao = new Float32Array([0.25, -0.25, 0, 0.5]);
    duble.captura.parar.mockResolvedValueOnce({ ok: true, audio: new Blob(['ARQUIVO COM AMBIENTE']), formato: 'audio/webm', ambiente, emissao, sampleRate: 1000 });
    render(<ArenaV2 captura={duble.captura} />);
    await iniciar(duble);
    fireEvent.click(screen.getByRole('button', { name: 'Finalizar gravação' }));
    await screen.findByLabelText('Sua gravação');
    const audio = vi.mocked(criarEnderecoLocal).mock.lastCall?.[0];
    expect(audio?.type).toBe('audio/wav');
    const buffer = await new Promise<ArrayBuffer>((resolve, reject) => {
      const leitor = new FileReader();
      leitor.onload = () => resolve(leitor.result as ArrayBuffer);
      leitor.onerror = () => reject(leitor.error);
      leitor.readAsArrayBuffer(audio!);
    });
    const dados = new DataView(buffer);
    expect(dados.getUint32(40, true)).toBe(8);
    expect(Array.from({ length: 4 }, (_, i) => dados.getInt16(44 + i * 2, true))).toEqual([8192, -8192, 0, 16384]);
    expect(screen.getByText(/A calibração não está neste áudio/)).toBeTruthy();
  });

  it('não usa o arquivo com calibração se a emissão não puder virar WAV', async () => {
    const duble = aparelho();
    duble.captura.parar.mockResolvedValueOnce({ ok: true, audio: new Blob(['AMBIENTE']), formato: 'audio/webm', ambiente: tom(0.5, 0.01), emissao: new Float32Array([NaN]), sampleRate: 1000 });
    render(<ArenaV2 captura={duble.captura} />);
    await iniciar(duble);
    fireEvent.click(screen.getByRole('button', { name: 'Finalizar gravação' }));
    expect((await screen.findByRole('alert')).textContent).toContain('Não foi possível concluir');
    expect(screen.queryByLabelText('Sua gravação')).toBeNull();
  });

  it('conserva a tentativa audível, mas informa quando o laudo é inconclusivo', async () => {
    const duble = aparelho();
    duble.captura.parar.mockResolvedValueOnce({ ok: true, audio: new Blob(['som']), formato: 'audio/webm', ambiente: new Float32Array(500), emissao: tom(1, 0.1), sampleRate: 1000 });
    render(<ArenaV2 captura={duble.captura} />);
    await iniciar(duble);
    fireEvent.click(screen.getByRole('button', { name: 'Finalizar gravação' }));
    expect(await screen.findByText(/Não foi possível medir o ambiente/)).toBeTruthy();
    expect(await screen.findByLabelText('Sua gravação')).toBeTruthy();
    expect(screen.queryByText('Potência relativa')).toBeNull();
    expect(screen.queryByText('Nota do arroto')).toBeNull();
  });

  it('oferece gravação sem laudo após falha da medição e não abre dois microfones', async () => {
    const duble = aparelho(Promise.resolve({ ok: false, motivo: 'pcm_indisponivel' }));
    const simples = gravadorSimples();
    render(<ArenaV2 captura={duble.captura} capturaSemLaudo={simples} />);
    fireEvent.click(screen.getByRole('button', { name: 'Gravar agora' }));
    const fallback = await screen.findByRole('button', { name: 'Gravar sem laudo' });
    expect(simples.pedir).not.toHaveBeenCalled();
    fireEvent.click(fallback);
    await screen.findByRole('button', { name: 'Finalizar gravação' });
    expect(duble.captura.cancelar.mock.invocationCallOrder.at(-1)).toBeLessThan(simples.pedir.mock.invocationCallOrder[0]);
    fireEvent.click(screen.getByRole('button', { name: 'Finalizar gravação' }));
    expect(await screen.findByText('Esta gravação não tem laudo nem nota.')).toBeTruthy();
    expect(screen.queryByText('Potência relativa')).toBeNull();
    expect(await screen.findByLabelText('Sua gravação')).toBeTruthy();
  });

  it('cancela o pedido de microfone do fallback e ignora a concessão tardia', async () => {
    let resolver!: (valor: PedidoDeMicrofone) => void;
    const duble = aparelho(Promise.resolve({ ok: false, motivo: 'pcm_indisponivel' }));
    const simples = gravadorSimples(new Promise((resolve) => { resolver = resolve; }));
    render(<ArenaV2 captura={duble.captura} capturaSemLaudo={simples} />);
    fireEvent.click(screen.getByRole('button', { name: 'Gravar agora' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Gravar sem laudo' }));
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar pedido' }));
    await act(async () => { resolver({ ok: true }); });
    expect(simples.soltar).toHaveBeenCalled();
    expect(simples.comecar).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Gravar agora' })).toBeTruthy();
  });

  it('interrompe o fallback ao sair da página', async () => {
    const duble = aparelho(Promise.resolve({ ok: false, motivo: 'pcm_indisponivel' }));
    const simples = gravadorSimples();
    render(<ArenaV2 captura={duble.captura} capturaSemLaudo={simples} />);
    fireEvent.click(screen.getByRole('button', { name: 'Gravar agora' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Gravar sem laudo' }));
    await screen.findByRole('button', { name: 'Finalizar gravação' });
    fireEvent(window, new Event('pagehide'));
    expect(simples.soltar).toHaveBeenCalled();
    expect(screen.getByRole('alert').textContent).toContain('interrompida');
  });

  it('informa permissão negada e permite tentar novamente', async () => {
    const { captura } = aparelho(Promise.resolve({ ok: false, motivo: 'permissao_negada' }));
    const registrar = vi.fn();
    render(<ArenaV2 captura={captura} telemetria={{ registrar }} />);
    fireEvent.click(screen.getByRole('button', { name: 'Gravar agora' }));
    expect((await screen.findByRole('alert')).textContent).toContain('microfone está bloqueado');
    expect(screen.getByRole('button', { name: 'Tentar novamente' })).toBeTruthy();
    expect(registrar.mock.calls).toEqual([['abriu_arena_v2'], ['falhou_gravacao']]);
  });

  it('ao sair durante permissão, ignora a resposta tardia', async () => {
    let resolver!: (resposta: InicioCapturaPcmV2) => void;
    const duble = aparelho(new Promise((resolve) => { resolver = resolve; }));
    render(<ArenaV2 captura={duble.captura} />);
    fireEvent.click(screen.getByRole('button', { name: 'Gravar agora' }));
    fireEvent(window, new Event('pagehide'));
    await act(async () => { resolver({ ok: true }); duble.eventos().aoCalibrar(); });
    expect(duble.captura.cancelar).toHaveBeenCalled();
    expect(screen.getByRole('alert').textContent).toContain('interrompida');
    expect(screen.queryByText('GRAVANDO')).toBeNull();
  });

  it('permite cancelar enquanto a permissão está pendente e ignora concessão tardia', async () => {
    let resolver!: (resposta: InicioCapturaPcmV2) => void;
    const duble = aparelho(new Promise((resolve) => { resolver = resolve; }));
    render(<ArenaV2 captura={duble.captura} />);
    fireEvent.click(screen.getByRole('button', { name: 'Gravar agora' }));
    expect(screen.getByRole('status').textContent).toContain('Libera o mic');
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar pedido' }));
    await act(async () => { resolver({ ok: true }); duble.eventos().aoCalibrar(); });
    expect(duble.captura.cancelar).toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Gravar agora' })).toBeTruthy();
    expect(screen.queryByText('GRAVANDO')).toBeNull();
  });

  it('permite cancelar durante a calibração e ignora callback tardio', async () => {
    const duble = aparelho();
    render(<ArenaV2 captura={duble.captura} />);
    fireEvent.click(screen.getByRole('button', { name: 'Gravar agora' }));
    await screen.findByText(/Calibrando\. Fica quieto 1s\./);
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar gravação' }));
    act(() => { duble.eventos().aoCalibrar(); });
    expect(screen.getByRole('button', { name: 'Gravar agora' })).toBeTruthy();
    expect(duble.captura.cancelar).toHaveBeenCalled();
  });

  it('encerra calibração quando o navegador não entrega amostras', async () => {
    vi.useFakeTimers();
    const duble = aparelho();
    render(<ArenaV2 captura={duble.captura} />);
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Gravar agora' })); });
    expect(screen.getByText(/Calibrando\. Fica quieto 1s\./)).toBeTruthy();
    await act(async () => { vi.advanceTimersByTime(5000); });
    expect(screen.getByRole('alert').textContent).toContain('Não recebemos áudio suficiente');
    expect(duble.captura.cancelar).toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Tentar novamente' })).toBeTruthy();
  });

  it('informa falha do coletor e ignora resultados que chegarem depois', async () => {
    const duble = aparelho();
    render(<ArenaV2 captura={duble.captura} />);
    await iniciar(duble);
    act(() => { duble.eventos().aoErro('pcm_indisponivel'); });
    expect(screen.getByRole('alert').textContent).toContain('medição experimental');
    act(() => { duble.eventos().aoLimite(); });
    expect(duble.captura.parar).not.toHaveBeenCalled();
    expect(screen.queryByText('GRAVANDO')).toBeNull();
  });

  it('aceita a calibração que chega antes da promessa de início', async () => {
    let resolver!: (resposta: InicioCapturaPcmV2) => void;
    const duble = aparelho(new Promise((resolve) => { resolver = resolve; }));
    render(<ArenaV2 captura={duble.captura} />);
    fireEvent.click(screen.getByRole('button', { name: 'Gravar agora' }));
    act(() => { duble.eventos().aoCalibrar(); });
    await act(async () => { resolver({ ok: true }); });
    expect(screen.getByRole('button', { name: 'Finalizar gravação' })).toBeTruthy();
  });

  it('libera o microfone ao desmontar durante a gravação', async () => {
    const duble = aparelho();
    const tela = render(<ArenaV2 captura={duble.captura} />);
    await iniciar(duble);
    tela.unmount();
    expect(duble.captura.cancelar).toHaveBeenCalled();
  });

  it('informa interrupção se o gravador parar por conta própria', async () => {
    vi.useFakeTimers();
    const duble = aparelho();
    render(<ArenaV2 captura={duble.captura} />);
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Gravar agora' })); });
    act(() => { duble.eventos().aoCalibrar(); });
    duble.captura.estaGravando.mockReturnValue(false);
    await act(async () => { vi.advanceTimersByTime(100); });
    expect(screen.getByRole('alert').textContent).toContain('interrompida');
    expect(duble.captura.cancelar).toHaveBeenCalled();
  });

  it('fecha ao atingir o limite sinalizado pelo coletor', async () => {
    const duble = aparelho();
    render(<ArenaV2 captura={duble.captura} />);
    await iniciar(duble);
    await act(async () => { duble.eventos().aoLimite(); });
    expect(duble.captura.parar).toHaveBeenCalledOnce();
    expect(await screen.findByRole('heading', { name: 'SUA GRAVAÇÃO' })).toBeTruthy();
  });
  it('interrompe a reprodução antes de avançar para o duelo', async () => {
    const duble = aparelho();
    const pausar = vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {});
    const avancar = vi.fn();
    try {
      render(<ArenaV2 captura={duble.captura} aoUsarTentativa={avancar} />);
      await iniciar(duble);
      fireEvent.click(screen.getByRole('button', { name: 'Finalizar gravação' }));
      const elemento = await screen.findByLabelText('Sua gravação');
      Object.defineProperty(elemento, 'paused', { configurable: true, value: false });
      expect(pausar).not.toHaveBeenCalled();
      fireEvent.click(screen.getByRole('button', { name: 'Continuar' }));
      expect(pausar).toHaveBeenCalledOnce();
      expect(avancar).toHaveBeenCalledOnce();
      expect(pausar.mock.invocationCallOrder[0]).toBeLessThan(avancar.mock.invocationCallOrder[0]);
    } finally { pausar.mockRestore(); }
  });

  it.each([
    ['aberto', 'Opções de compartilhamento abertas.'],
    ['cancelado', 'Compartilhamento cancelado.'],
    ['indisponivel', 'Este aparelho não compartilha este arquivo. Você pode baixá-lo.'],
    ['falhou', 'Não foi possível compartilhar. Tente novamente ou baixe o arquivo.'],
  ] as const)('compartilha WAV revisado e informa %s sem inventar envio', async (resultado, texto) => {
    const duble = aparelho();
    const compartilhar = vi.fn(async (_audio: Blob) => resultado);
    const baixar = vi.fn((_audio: Blob) => true);
    render(<ArenaV2 captura={duble.captura} compartilhamentoDeAudio={{ compartilhar, baixar }} />);
    await iniciar(duble);
    fireEvent.click(screen.getByRole('button', { name: 'Finalizar gravação' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Compartilhar áudio' }));
    expect(await screen.findByText(texto)).toBeTruthy();
    expect(compartilhar.mock.calls[0][0].type).toBe('audio/wav');
    fireEvent.click(screen.getByRole('button', { name: 'Baixar áudio' }));
    expect(baixar.mock.calls[0][0]).toBe(compartilhar.mock.calls[0][0]);
    expect(screen.getByText('Download solicitado ao navegador.')).toBeTruthy();
  });

  it('compartilha o formato real do fallback sem laudo', async () => {
    const duble = aparelho(Promise.resolve({ ok: false, motivo: 'pcm_indisponivel' }));
    const simples = gravadorSimples();
    simples.parar.mockResolvedValueOnce({ dados: new Blob(['som'], { type: 'audio/webm' }), formato: 'audio/webm', duracaoMs: 1000, resumo: { rms: .1, pico: .3 } });
    const compartilhar = vi.fn(async (_audio: Blob) => 'aberto' as const);
    render(<ArenaV2 captura={duble.captura} capturaSemLaudo={simples} compartilhamentoDeAudio={{ compartilhar, baixar: () => true }} />);
    fireEvent.click(screen.getByRole('button', { name: 'Gravar agora' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Gravar sem laudo' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Finalizar gravação' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Compartilhar áudio' }));
    await screen.findByText('Opções de compartilhamento abertas.');
    expect(compartilhar.mock.calls[0][0].type).toBe('audio/webm');
  });

  it('descartar durante compartilhamento ignora o resultado tardio', async () => {
    const duble = aparelho();
    let concluir!: (valor: 'aberto') => void;
    const compartilhar = vi.fn(() => new Promise<'aberto'>(resolve => { concluir = resolve; }));
    render(<ArenaV2 captura={duble.captura} compartilhamentoDeAudio={{ compartilhar, baixar: () => true }} />);
    await iniciar(duble);
    fireEvent.click(screen.getByRole('button', { name: 'Finalizar gravação' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Compartilhar áudio' }));
    fireEvent.click(screen.getByRole('button', { name: 'Descartar e gravar outra' }));
    await act(async () => concluir('aberto'));
    expect(screen.queryByText('Opções de compartilhamento abertas.')).toBeNull();
    expect(screen.getByRole('button', { name: 'Gravar agora' })).toBeTruthy();
  });

  it('mostra o @ do adversário na faixa de desafio quando recebido por parâmetro', () => {
    const { captura } = aparelho();
    render(<ArenaV2 captura={captura} adversarioHandle="@pedro_som" />);
    expect(screen.getByText('CONTRA @PEDRO_SOM')).toBeTruthy();
  });

});
