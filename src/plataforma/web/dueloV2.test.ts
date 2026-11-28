// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { criarDueloV2, type TransporteDueloV2 } from './dueloV2';

const usuario = '00000000-0000-4000-8000-000000000001';
const gravacao = '00000000-0000-4000-8000-000000000002';
const outra = '00000000-0000-4000-8000-000000000003';
const token = 'a'.repeat(64);
const audio = () => new Blob([new Uint8Array(50)], { type: 'audio/wav' });
const caminho = `${usuario}/${gravacao}.wav`;
const revelado = { id: outra, estado: 'revelado', bucket: 'duelos_v2', versao_regua: 'experimental-2', origem_medicao: 'cliente_nao_verificada', efeito_competitivo: false, criador: { duracao_ms: 1500, caminho }, desafiante: { duracao_ms: 900, caminho: `${outra}/${outra}.wav` } };
function transporte() {
  return {
    sessao: vi.fn(async () => ({ user: { id: usuario } })),
    novoToken: vi.fn(() => token),
    rpc: vi.fn(async (nome: string, _parametros?: Record<string, unknown>): Promise<{data: unknown; error: unknown}> => {
      if (nome === 'aue_v2_preparar_gravacao') return { data: { id: gravacao, bucket: 'duelos_v2', caminho }, error: null };
      if (nome === 'aue_v2_confirmar_gravacao') return { data: { id: gravacao, estado: 'confirmada' }, error: null };
      if (nome === 'aue_v2_criar_duelo') return { data: { estado: 'aguardando_resposta', id: outra, versao: 1, prazo: '2026-11-25T00:00:00Z' }, error: null };
      if (nome === 'aue_v2_abrir_duelo') return { data: { estado: 'aguardando_resposta', categoria: 'duracao', nota: 123, caminho: 'dado indevido' }, error: null };
      if (nome === 'aue_v2_responder_duelo') return { data: { estado: 'respondido' }, error: null };
      if (nome === 'aue_v2_revelar_duelo') return { data: revelado, error: null };
      return { data: null, error: 'erro' };
    }),
    upload: vi.fn(async (_caminho: string, _audio: Blob): Promise<{data: unknown; error: unknown}> => ({ data: {}, error: null })),
    download: vi.fn(async (_dueloId: string, _lado: 'criador' | 'desafiante'): Promise<{data: unknown; error: unknown}> => ({ data: audio(), error: null })),
    remover: vi.fn(async (_caminho: string): Promise<{data: unknown; error: unknown}> => ({ data: [{ name: caminho }], error: null })),
  } satisfies TransporteDueloV2;
}

describe('duelo v2 — adaptador', () => {
  it('cancela imediatamente antes de preparar sem criar registro', async () => {
    const t = transporte(); const envio = criarDueloV2(t).iniciarEnvioGravacao(audio(), 1500);
    expect(await envio.cancelar()).toEqual({ ok: true, valor: 'cancelada_local' });
    expect(await envio.resultado).toEqual({ ok: false, motivo: 'cancelada' });
    expect(t.rpc).not.toHaveBeenCalled();
  });
  it('cancela durante preparo e limpa o registro quando o servidor responder', async () => {
    const t = transporte(); let liberar!: (r: { data: unknown; error: unknown }) => void;
    const original = t.rpc.getMockImplementation()!;
    t.rpc.mockImplementation(async (nome, params) => {
      if (nome === 'aue_v2_preparar_gravacao') return new Promise((resolve) => { liberar = resolve; });
      if (nome === 'aue_v2_solicitar_exclusao') return { data: { estado: 'remocao_pendente', bucket: 'duelos_v2', caminho }, error: null };
      if (nome === 'aue_v2_confirmar_exclusao') return { data: { estado: 'removida' }, error: null };
      return original(nome, params);
    });
    const envio = criarDueloV2(t).iniciarEnvioGravacao(audio(), 1500);
    await vi.waitFor(() => expect(t.rpc).toHaveBeenCalledWith('aue_v2_preparar_gravacao'));
    const cancelamento = envio.cancelar();
    liberar({ data: { id: gravacao, bucket: 'duelos_v2', caminho }, error: null });
    expect(await envio.resultado).toEqual({ ok: false, motivo: 'cancelada' });
    expect(await cancelamento).toEqual({ ok: true, valor: 'removida' });
    expect(t.upload).not.toHaveBeenCalled();
    expect(t.remover).toHaveBeenCalledTimes(1);
  });
  it('preparo sem resposta retorna incerteza e tenta limpar quando a resposta chega tarde', async () => {
    const t = transporte(); let liberar!: (r: { data: unknown; error: unknown }) => void;
    t.rpc.mockImplementation(async (nome) => {
      if (nome === 'aue_v2_preparar_gravacao') return new Promise((resolve) => { liberar = resolve; });
      if (nome === 'aue_v2_solicitar_exclusao') return { data: { estado: 'remocao_pendente', bucket: 'duelos_v2', caminho }, error: null };
      if (nome === 'aue_v2_confirmar_exclusao') return { data: { estado: 'removida' }, error: null };
      return { data: null, error: 'inesperado' };
    });
    const envio = criarDueloV2(t).iniciarEnvioGravacao(audio(), 1500);
    await vi.waitFor(() => expect(t.rpc).toHaveBeenCalledWith('aue_v2_preparar_gravacao'));
    vi.useFakeTimers();
    try {
      const cancelamento = envio.cancelar(); await vi.advanceTimersByTimeAsync(3000);
      expect(await cancelamento).toEqual({ ok: true, valor: 'preparacao_incerta' });
      liberar({ data: { id: gravacao, bucket: 'duelos_v2', caminho }, error: null });
      expect(await envio.resultado).toEqual({ ok: false, motivo: 'cancelada' });
      await vi.waitFor(() => expect(t.remover).toHaveBeenCalledTimes(1));
      expect(t.upload).not.toHaveBeenCalled();
    } finally { vi.useRealTimers(); }
  });
  it('falha de rede no preparo cancelado não inventa um ID nem exclusão', async () => {
    const t = transporte(); let rejeitar!: (e: Error) => void;
    t.rpc.mockImplementationOnce(() => new Promise((_resolve, reject) => { rejeitar = reject; }));
    const envio = criarDueloV2(t).iniciarEnvioGravacao(audio(), 1500);
    await vi.waitFor(() => expect(t.rpc).toHaveBeenCalled());
    const cancelamento = envio.cancelar(); rejeitar(new Error('rede'));
    expect(await cancelamento).toEqual({ ok: true, valor: 'preparacao_incerta' });
    expect(await envio.resultado).toEqual({ ok: false, motivo: 'cancelada' });
    expect(t.remover).not.toHaveBeenCalled();
  });
  it('cancelamento durante o primeiro upload bloqueia acesso e espera antes de remover', async () => {
    const t = transporte(); let liberar!: (r: { data: unknown; error: unknown }) => void;
    t.upload.mockImplementationOnce(() => new Promise((resolve) => { liberar = resolve; }));
    const original = t.rpc.getMockImplementation()!;
    t.rpc.mockImplementation(async (nome, params) => {
      if (nome === 'aue_v2_solicitar_exclusao') return { data: { estado: 'remocao_pendente', bucket: 'duelos_v2', caminho }, error: null };
      if (nome === 'aue_v2_confirmar_exclusao') return { data: { estado: 'removida' }, error: null };
      return original(nome, params);
    });
    const envio = criarDueloV2(t).iniciarEnvioGravacao(audio(), 1500);
    await vi.waitFor(() => expect(t.upload).toHaveBeenCalledTimes(1));
    const cancelamento = envio.cancelar();
    await vi.waitFor(() => expect(t.rpc).toHaveBeenCalledWith('aue_v2_solicitar_exclusao', { p_id: gravacao }));
    expect(t.remover).not.toHaveBeenCalled();
    liberar({ data: {}, error: null });
    expect(await envio.resultado).toEqual({ ok: false, motivo: 'cancelada' });
    expect(await cancelamento).toEqual({ ok: true, valor: 'removida' });
    expect(t.rpc.mock.calls.filter(([nome]) => nome === 'aue_v2_confirmar_gravacao')).toHaveLength(0);
  });
  it('envia áudio privado e confirma somente depois do upload', async () => {
    const t = transporte(); const d = criarDueloV2(t);
    expect(await d.enviarGravacao(audio(), 1500)).toEqual({ ok: true, valor: { id: gravacao } });
    expect(t.upload).toHaveBeenCalledWith(caminho, expect.any(Blob));
    expect(t.rpc.mock.invocationCallOrder[0]).toBeLessThan(t.upload.mock.invocationCallOrder[0]);
    expect(t.upload.mock.invocationCallOrder[0]).toBeLessThan(t.rpc.mock.invocationCallOrder[1]);
    expect(t.rpc).toHaveBeenLastCalledWith('aue_v2_confirmar_gravacao', { p_id: gravacao, p_duracao_ms: 1500, p_versao_regua: 'experimental-2' });
  });
  it('não considera gravado quando o upload falha e o servidor não encontra o objeto', async () => {
    const t = transporte(); t.upload.mockResolvedValue({ data: null, error: 'falhou' });
    t.rpc.mockImplementation(async (nome) => nome === 'aue_v2_preparar_gravacao'
      ? { data: { id: gravacao, bucket: 'duelos_v2', caminho }, error: null }
      : { data: null, error: 'objeto ausente' });
    const log = vi.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      expect(await criarDueloV2(t).enviarGravacao(audio(), 1500)).toEqual({ ok: false, motivo: 'envio_falhou', tentativaId: gravacao });
      expect(t.rpc).toHaveBeenCalledTimes(2);
      expect(log.mock.calls).toEqual([['[duelo-v2] Falha no envio', 'upload', 'envio_falhou']]);
    } finally {
      log.mockRestore();
    }
  });
  it('consulta confirmação quando a resposta do upload se perdeu', async () => {
    const t = transporte(); t.upload.mockRejectedValueOnce(new Error('timeout'));
    expect(await criarDueloV2(t).enviarGravacao(audio(), 1500)).toEqual({ ok: true, valor: { id: gravacao } });
    expect(t.rpc).toHaveBeenLastCalledWith('aue_v2_confirmar_gravacao', { p_id: gravacao, p_duracao_ms: 1500, p_versao_regua: 'experimental-2' });
  });
  it('retry reutiliza a gravação e confirma upload cuja resposta se perdeu', async () => {
    const t = transporte();
    t.upload.mockResolvedValueOnce({ data: {}, error: null }).mockResolvedValueOnce({ data: null, error: 'objeto já existe' });
    const rpcOriginal = t.rpc.getMockImplementation()!;
    let confirmacoes = 0;
    t.rpc.mockImplementation(async (nome, parametros) => {
      if (nome === 'aue_v2_confirmar_gravacao' && confirmacoes++ === 0) return { data: null, error: 'timeout' };
      return rpcOriginal(nome, parametros);
    });
    const d = criarDueloV2(t);
    expect(await d.enviarGravacao(audio(), 1500)).toEqual({ ok: false, motivo: 'falha_rede', tentativaId: gravacao });
    expect(await d.retomarEnvio(gravacao)).toEqual({ ok: true, valor: { id: gravacao } });
    expect(t.rpc.mock.calls.filter(([nome]) => nome === 'aue_v2_preparar_gravacao')).toHaveLength(1);
    expect(t.upload).toHaveBeenCalledTimes(2);
  });
  it('não retoma tentativa de outra conta após troca de sessão', async () => {
    const t = transporte();
    t.upload.mockResolvedValueOnce({ data: null, error: 'falha' });
    t.rpc.mockImplementation(async (nome) => nome === 'aue_v2_preparar_gravacao'
      ? { data: { id: gravacao, bucket: 'duelos_v2', caminho }, error: null }
      : { data: null, error: 'sem objeto' });
    const d = criarDueloV2(t);
    await d.enviarGravacao(audio(), 1500);
    t.sessao.mockResolvedValue({ user: { id: outra } });
    expect(await d.retomarEnvio(gravacao)).toEqual({ ok: false, motivo: 'sem_sessao', tentativaId: gravacao });
    expect(t.upload).toHaveBeenCalledTimes(1);
  });
  it('desistência aguarda upload em voo antes de remover e não confirma a tentativa cancelada', async () => {
    const t = transporte();
    let liberar!: (resultado: { data: unknown; error: unknown }) => void;
    t.upload.mockResolvedValueOnce({ data: null, error: 'primeira falhou' })
      .mockImplementationOnce(() => new Promise((resolve) => { liberar = resolve; }));
    t.rpc.mockImplementation(async (nome) => {
      if (nome === 'aue_v2_preparar_gravacao') return { data: { id: gravacao, bucket: 'duelos_v2', caminho }, error: null };
      if (nome === 'aue_v2_solicitar_exclusao') return { data: { estado: 'remocao_pendente', bucket: 'duelos_v2', caminho }, error: null };
      if (nome === 'aue_v2_confirmar_exclusao') return { data: { estado: 'removida' }, error: null };
      return { data: null, error: 'objeto ausente' };
    });
    const d = criarDueloV2(t);
    await d.enviarGravacao(audio(), 1500);
    const retomada = d.retomarEnvio(gravacao);
    await vi.waitFor(() => expect(t.upload).toHaveBeenCalledTimes(2));
    const descarte = d.descartarTentativa(gravacao);
    await vi.waitFor(() => expect(t.rpc).toHaveBeenCalledWith('aue_v2_solicitar_exclusao', { p_id: gravacao }));
    expect(t.remover).not.toHaveBeenCalled();
    liberar({ data: {}, error: null });
    expect(await retomada).toEqual({ ok: false, motivo: 'cancelada' });
    expect(await descarte).toEqual({ ok: true, valor: 'removida' });
    expect(t.remover).toHaveBeenCalledTimes(1);
    expect(t.rpc.mock.calls.filter(([nome]) => nome === 'aue_v2_confirmar_gravacao')).toHaveLength(1);
    expect(await d.retomarEnvio(gravacao)).toEqual({ ok: false, motivo: 'entrada_invalida' });
  });
  it('offline descarta referência local sem afirmar bloqueio remoto', async () => {
    const t = transporte();
    t.upload.mockResolvedValueOnce({ data: null, error: 'falhou' });
    t.rpc.mockImplementation(async (nome) => nome === 'aue_v2_preparar_gravacao'
      ? { data: { id: gravacao, bucket: 'duelos_v2', caminho }, error: null }
      : { data: null, error: 'rede indisponível' });
    const d = criarDueloV2(t);
    await d.enviarGravacao(audio(), 1500);
    expect(await d.descartarTentativa(gravacao)).toEqual({ ok: true, valor: 'bloqueio_nao_confirmado' });
    expect(await d.retomarEnvio(gravacao)).toEqual({ ok: false, motivo: 'entrada_invalida' });
    expect(t.remover).not.toHaveBeenCalled();
  });
  it('se upload em voo não termina retorna pendência após bloqueio sem apagar cedo', async () => {
    const t = transporte();
    let liberar!: (resultado: { data: unknown; error: unknown }) => void;
    t.upload.mockResolvedValueOnce({ data: null, error: 'primeira falhou' })
      .mockImplementationOnce(() => new Promise((resolve) => { liberar = resolve; }));
    t.rpc.mockImplementation(async (nome) => {
      if (nome === 'aue_v2_preparar_gravacao') return { data: { id: gravacao, bucket: 'duelos_v2', caminho }, error: null };
      if (nome === 'aue_v2_solicitar_exclusao') return { data: { estado: 'remocao_pendente', bucket: 'duelos_v2', caminho }, error: null };
      if (nome === 'aue_v2_confirmar_exclusao') return { data: { estado: 'removida' }, error: null };
      return { data: null, error: 'objeto ausente' };
    });
    const d = criarDueloV2(t);
    await d.enviarGravacao(audio(), 1500);
    const retomada = d.retomarEnvio(gravacao);
    await vi.waitFor(() => expect(t.upload).toHaveBeenCalledTimes(2));
    vi.useFakeTimers();
    try {
      const descarte = d.descartarTentativa(gravacao);
      await vi.advanceTimersByTimeAsync(3000);
      expect(await descarte).toEqual({ ok: true, valor: 'remocao_pendente' });
      expect(t.remover).not.toHaveBeenCalled();
      liberar({ data: {}, error: null });
      expect(await retomada).toEqual({ ok: false, motivo: 'cancelada' });
      expect(await d.descartarTentativa(gravacao)).toEqual({ ok: true, valor: 'removida' });
    } finally { vi.useRealTimers(); }
  });
  it('recusa bucket ou caminho divergente antes do envio', async () => {
    const t = transporte(); t.rpc.mockResolvedValueOnce({ data: { id: gravacao, bucket: 'audio_records', caminho }, error: null });
    expect(await criarDueloV2(t).enviarGravacao(audio(), 1500)).toEqual({ ok: false, motivo: 'resposta_invalida' });
    expect(t.upload).not.toHaveBeenCalled();
  });
  it('sem sessão, arquivo inválido ou duração inválida não grava nem cria', async () => {
    const t = transporte(); t.sessao.mockResolvedValueOnce(null as never);
    const d = criarDueloV2(t);
    expect(await d.enviarGravacao(audio(), 1500)).toEqual({ ok: false, motivo: 'sem_sessao' });
    expect(await d.enviarGravacao(new Blob(['x'], { type: 'audio/wav' }), 1500)).toEqual({ ok: false, motivo: 'entrada_invalida' });
    expect(await d.enviarGravacao(audio(), 0)).toEqual({ ok: false, motivo: 'entrada_invalida' });
    expect(t.rpc).not.toHaveBeenCalled();
  });
  it('prévia devolve apenas o estado, sem nota nem caminho, mesmo se servidor errar', async () => {
    const t = transporte(); const d = criarDueloV2(t);
    expect(await d.abrir(token)).toEqual({ ok: true, valor: 'aguardando_resposta' });
    expect(t.download).not.toHaveBeenCalled();
    expect(t.sessao).not.toHaveBeenCalled();
  });
  it('não baixa áudio quando revelação é negada ou inválida', async () => {
    const t = transporte(); t.rpc.mockResolvedValue({ data: { estado: 'indisponivel', caminho }, error: null });
    const d = criarDueloV2(t);
    expect(await d.baixarAudio(token, 'criador')).toEqual({ ok: false, motivo: 'resultado_indisponivel' });
    expect(t.download).not.toHaveBeenCalled();
  });
  it('baixa somente após revelação autenticada e não expõe caminhos na interface', async () => {
    const t = transporte(); const d = criarDueloV2(t);
    const r = await d.revelar(token);
    expect(r.ok && JSON.stringify(r)).not.toContain('caminho');
    expect(await d.baixarAudio(token, 'criador')).toEqual({ ok: true, valor: expect.any(Blob) });
    expect(t.download).toHaveBeenCalledWith(outra, 'criador');
    expect(t.rpc).toHaveBeenCalledWith('aue_v2_revelar_duelo', { p_token: token });
  });
  it('diagnostica falha no download sem registrar dados do duelo', async () => {
    const t = transporte();
    t.download.mockRejectedValueOnce(new Error(caminho));
    const log = vi.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      expect(await criarDueloV2(t).baixarAudio(token, 'criador')).toEqual({ ok: false, motivo: 'falha_rede' });
      expect(log.mock.calls).toEqual([['[duelo-v2] Falha na reprodução', 'falha_rede']]);
    } finally {
      log.mockRestore();
    }
  });

  it('token e id inválidos não são enviados; criação incerta mantém token para retry', async () => {
    const t = transporte(); const d = criarDueloV2(t);
    expect(d.novoToken()).toEqual({ ok: true, valor: token });
    expect(await d.abrir('invalido')).toEqual({ ok: false, motivo: 'entrada_invalida' });
    t.rpc.mockRejectedValueOnce(new Error('rede'));
    expect(await d.criar(gravacao, token)).toEqual({ ok: false, motivo: 'criacao_incerta' });
    expect(await d.criar(gravacao, token)).toEqual({ ok: true, valor: { estado: 'aguardando_resposta', id: outra, versao: 1, prazo: '2026-11-25T00:00:00Z' } });
    expect(t.rpc).toHaveBeenLastCalledWith('aue_v2_criar_duelo', { p_gravacao_id: gravacao, p_token: token });
  });
  it('bloqueia leitura antes de remover e só confirma exclusão depois do Storage', async () => {
    const t = transporte();
    t.rpc.mockImplementation(async (nome) => {
      if (nome === 'aue_v2_solicitar_exclusao') return { data: { estado: 'remocao_pendente', bucket: 'duelos_v2', caminho }, error: null };
      if (nome === 'aue_v2_confirmar_exclusao') return { data: { estado: 'removida' }, error: null };
      return { data: null, error: 'inesperado' };
    });
    expect(await criarDueloV2(t).removerGravacao(gravacao)).toEqual({ ok: true, valor: 'removida' });
    expect(t.rpc.mock.invocationCallOrder[0]).toBeLessThan(t.remover.mock.invocationCallOrder[0]);
    expect(t.remover.mock.invocationCallOrder[0]).toBeLessThan(t.rpc.mock.invocationCallOrder[1]);
    expect(t.remover).toHaveBeenCalledWith(caminho);
  });
  it('resposta vazia do Storage não comprova exclusão física', async () => {
    const t = transporte();
    t.rpc.mockImplementation(async (nome) => nome === 'aue_v2_solicitar_exclusao'
      ? { data: { estado: 'remocao_pendente', bucket: 'duelos_v2', caminho }, error: null }
      : { data: { estado: 'removida' }, error: null });
    t.remover.mockResolvedValueOnce({ data: [], error: null });
    expect(await criarDueloV2(t).removerGravacao(gravacao)).toEqual({ ok: true, valor: 'remocao_nao_verificada' });
  });
  it('estado SQL removido isolado não comprova exclusão física', async () => {
    const t = transporte(); t.rpc.mockResolvedValueOnce({ data: { estado: 'removida' }, error: null });
    expect(await criarDueloV2(t).removerGravacao(gravacao)).toEqual({ ok: true, valor: 'remocao_nao_verificada' });
    expect(t.remover).not.toHaveBeenCalled();
  });
  it('após retomada só reconhece remoção com confirmação explícita do serviço', async () => {
    const t = transporte();
    t.rpc.mockResolvedValueOnce({ data: { estado: 'removida' }, error: null })
      .mockResolvedValueOnce({ data: { estado: 'removida_pelo_servico' }, error: null });
    expect(await criarDueloV2(t).removerGravacao(gravacao)).toEqual({ ok: true, valor: 'removida' });
    expect(t.rpc).toHaveBeenNthCalledWith(2, 'aue_v2_confirmar_exclusao', { p_id: gravacao });
    expect(t.remover).not.toHaveBeenCalled();
  });
  it('resposta antiga de confirmação não transforma marca antiga em evidência', async () => {
    const t = transporte();
    t.rpc.mockResolvedValueOnce({ data: { estado: 'removida' }, error: null })
      .mockResolvedValueOnce({ data: { estado: 'removida' }, error: null });
    expect(await criarDueloV2(t).removerGravacao(gravacao)).toEqual({ ok: true, valor: 'remocao_nao_verificada' });
  });
  it('falha do Storage mantém exclusão pendente sem prometer apagamento', async () => {
    const t = transporte();
    t.rpc.mockResolvedValueOnce({ data: { estado: 'remocao_pendente', bucket: 'duelos_v2', caminho }, error: null });
    t.remover.mockRejectedValueOnce(new Error('rede'));
    expect(await criarDueloV2(t).removerGravacao(gravacao)).toEqual({ ok: true, valor: 'remocao_pendente' });
    expect(t.rpc).toHaveBeenCalledTimes(1);
  });
  it('não apaga caminho de outra conta ou bucket legado', async () => {
    const t = transporte();
    t.rpc.mockResolvedValueOnce({ data: { estado: 'remocao_pendente', bucket: 'audio_records', caminho }, error: null });
    expect(await criarDueloV2(t).removerGravacao(gravacao)).toEqual({ ok: false, motivo: 'resposta_invalida' });
    expect(t.remover).not.toHaveBeenCalled();
  });
  it('após recarga lista somente IDs de exclusões pendentes da conta', async () => {
    const t = transporte();
    t.rpc.mockResolvedValueOnce({ data: [{ id: gravacao, bucket: 'duelos_v2', caminho }], error: null });
    const resultado = await criarDueloV2(t).listarExclusoesPendentes();
    expect(resultado).toEqual({ ok: true, valor: [gravacao] });
    expect(JSON.stringify(resultado)).not.toContain('caminho');
  });
  it('não lista exclusões de outra conta mesmo se a RPC retornar caminho incorreto', async () => {
    const t = transporte();
    t.rpc.mockResolvedValueOnce({ data: [{ id: gravacao, bucket: 'duelos_v2', caminho: `${outra}/${gravacao}.wav` }], error: null });
    expect(await criarDueloV2(t).listarExclusoesPendentes()).toEqual({ ok: false, motivo: 'resposta_invalida' });
  });
  it('denúncia exige sessão e encaminha somente alvo e motivo permitidos', async () => {
    const t = transporte(); t.rpc.mockResolvedValueOnce({ data: { estado: 'registrada' }, error: null });
    expect(await criarDueloV2(t).denunciar(token, 'criador', 'ofensivo')).toEqual({ ok: true, valor: 'registrada' });
    expect(t.rpc).toHaveBeenCalledWith('aue_v2_denunciar_audio', { p_token: token, p_alvo: 'criador', p_motivo: 'ofensivo' });
  });
  it('denuncia duelo recuperado pela sessão, sem enviar token', async () => {
    const t = transporte(); t.rpc.mockResolvedValueOnce({ data: { estado: 'registrada' }, error: null });
    expect(await criarDueloV2(t).denunciarPorDuelo(outra, 'criador', 'ofensivo')).toEqual({ ok: true, valor: 'registrada' });
    expect(t.sessao).toHaveBeenCalledOnce();
    expect(t.rpc).toHaveBeenCalledExactlyOnceWith('aue_v2_denunciar_por_duelo', { p_duelo_id: outra, p_alvo: 'criador', p_motivo: 'ofensivo' });
  });
  it('informa que denúncia já foi analisada nos dois caminhos', async () => {
    const t = transporte(); const d = criarDueloV2(t);
    t.rpc.mockResolvedValue({ data: { estado: 'ja_analisada' }, error: null });
    expect(await d.denunciar(token, 'criador', 'ofensivo')).toEqual({ ok: true, valor: 'ja_analisada' });
    expect(await d.denunciarPorDuelo(outra, 'criador', 'ofensivo')).toEqual({ ok: true, valor: 'ja_analisada' });
  });
  it('rejeita duelo, alvo ou motivo inválido antes de consultar sessão', async () => {
    const t = transporte(); const d = criarDueloV2(t);
    expect(await d.denunciarPorDuelo('inválido', 'criador', 'outro')).toEqual({ ok: false, motivo: 'entrada_invalida' });
    expect(await d.denunciarPorDuelo(outra, 'ninguém' as 'criador', 'outro')).toEqual({ ok: false, motivo: 'entrada_invalida' });
    expect(await d.denunciarPorDuelo(outra, 'criador', 'inválido' as 'outro')).toEqual({ ok: false, motivo: 'entrada_invalida' });
    expect(t.sessao).not.toHaveBeenCalled();
    expect(t.rpc).not.toHaveBeenCalled();
  });
  it('não envia denúncia sem sessão', async () => {
    const t = transporte(); t.sessao.mockResolvedValueOnce(null as never);
    expect(await criarDueloV2(t).denunciarPorDuelo(outra, 'desafiante', 'outro')).toEqual({ ok: false, motivo: 'sem_sessao' });
    expect(t.rpc).not.toHaveBeenCalled();
  });
  it('preserva indisponibilidade e trata falhas e resposta desconhecida', async () => {
    const t = transporte(); const d = criarDueloV2(t);
    t.rpc.mockResolvedValueOnce({ data: { estado: 'indisponivel' }, error: null });
    expect(await d.denunciarPorDuelo(outra, 'desafiante', 'outro')).toEqual({ ok: true, valor: 'indisponivel' });
    t.rpc.mockResolvedValueOnce({ data: null, error: 'erro' });
    expect(await d.denunciarPorDuelo(outra, 'criador', 'ofensivo')).toEqual({ ok: false, motivo: 'falha_rede' });
    t.rpc.mockRejectedValueOnce(new Error('rede'));
    expect(await d.denunciarPorDuelo(outra, 'criador', 'ofensivo')).toEqual({ ok: false, motivo: 'falha_rede' });
    t.rpc.mockResolvedValueOnce({ data: { estado: 'inesperado' }, error: null });
    expect(await d.denunciarPorDuelo(outra, 'criador', 'ofensivo')).toEqual({ ok: false, motivo: 'resposta_invalida' });
  });
  it('criação não depende de token devolvido pelo servidor', async () => {
    const t = transporte(); const d = criarDueloV2(t);
    expect(await d.criar(gravacao, token)).toEqual({ ok: true, valor: { estado: 'aguardando_resposta', id: outra, versao: 1, prazo: '2026-11-25T00:00:00Z' } });
  });
  it('criação retorna conflito sem transformar token rejeitado em link válido', async () => {
    const t = transporte(); t.rpc.mockResolvedValueOnce({ data: { estado: 'conflito', id: outra, versao: 2, prazo: '2026-11-25T00:00:00Z' }, error: null });
    const resposta = await criarDueloV2(t).criar(gravacao, token);
    expect(resposta).toEqual({ ok: true, valor: { estado: 'conflito', id: outra, versao: 2, prazo: '2026-11-25T00:00:00Z' } });
    expect(JSON.stringify(resposta)).not.toContain(token);
  });
  it('reemitir e revogar usam versão esperada e preservam conflitos', async () => {
    const t = transporte();
    t.rpc.mockResolvedValueOnce({ data: { estado: 'conflito', id: outra, versao: 3, prazo: '2026-11-25T00:00:00Z' }, error: null })
      .mockResolvedValueOnce({ data: { estado: 'revogado', id: outra, versao: 4, prazo: '2026-11-25T00:00:00Z' }, error: null });
    const d = criarDueloV2(t);
    expect(await d.reemitir(gravacao, token, 1)).toEqual({ ok: true, valor: { estado: 'conflito', id: outra, versao: 3, prazo: '2026-11-25T00:00:00Z' } });
    expect(await d.revogar(gravacao, 3)).toEqual({ ok: true, valor: { estado: 'revogado', id: outra, versao: 4, prazo: '2026-11-25T00:00:00Z' } });
    expect(t.rpc).toHaveBeenNthCalledWith(1, 'aue_v2_reemitir_convite', { p_gravacao_id: gravacao, p_token_novo: token, p_versao_esperada: 1 });
    expect(t.rpc).toHaveBeenNthCalledWith(2, 'aue_v2_revogar_convite', { p_gravacao_id: gravacao, p_versao_esperada: 3 });
  });
  it('lista apenas o vínculo próprio, sem segredo nem dados do adversário', async () => {
    const t = transporte();
    t.rpc.mockResolvedValueOnce({ data: { itens: [{ id: outra, gravacao_propria_id: gravacao, lado: 'criador', estado: 'aguardando_resposta', versao: 1, prazo: '2026-11-25T00:00:00Z', token, caminho }], tem_mais: false }, error: null });
    const resultado = await criarDueloV2(t).listarMeusDuelos(0);
    expect(resultado).toEqual({ ok: true, valor: { itens: [{ id: outra, gravacaoPropriaId: gravacao, lado: 'criador', estado: 'aguardando_resposta', versao: 1, prazo: '2026-11-25T00:00:00Z' }], temMais: false } });
    expect(JSON.stringify(resultado)).not.toContain(token);
    expect(JSON.stringify(resultado)).not.toContain(caminho);
  });
  it('não consulta página inválida', async () => {
    const t = transporte();
    expect(await criarDueloV2(t).listarMeusDuelos(-1)).toEqual({ ok: false, motivo: 'entrada_invalida' });
    expect(t.rpc).not.toHaveBeenCalled();
  });
  it('preserva item indisponível no histórico sem expor dados adicionais', async () => {
    const t = transporte();
    t.rpc.mockResolvedValueOnce({ data: { itens: [{ id: outra, gravacao_propria_id: gravacao, lado: 'criador', estado: 'indisponivel', versao: 1, prazo: '2026-11-25T00:00:00Z', caminho }], tem_mais: false }, error: null });
    const resultado = await criarDueloV2(t).listarMeusDuelos(0);
    expect(resultado).toEqual({ ok: true, valor: { itens: [{ id: outra, gravacaoPropriaId: gravacao, lado: 'criador', estado: 'indisponivel', versao: 1, prazo: '2026-11-25T00:00:00Z' }], temMais: false } });
    expect(JSON.stringify(resultado)).not.toContain(caminho);
  });
  it('recupera resultado sem devolver caminho e só baixa depois da revalidação', async () => {
    const t = transporte(); t.rpc.mockResolvedValue({ data: revelado, error: null });
    const d = criarDueloV2(t);
    const r = await d.recuperar(gravacao);
    expect(r.ok && JSON.stringify(r)).not.toContain('caminho');
    expect(r).toEqual({ ok: true, valor: { estado: 'revelado', resultado: { criador: { duracaoMs: 1500 }, desafiante: { duracaoMs: 900 }, efeitoCompetitivo: false, versaoRegua: 'experimental-2', origemMedicao: 'cliente_nao_verificada' } } });
    expect(await d.baixarAudioRecuperado(gravacao, 'desafiante')).toEqual({ ok: true, valor: expect.any(Blob) });
    expect(t.download).toHaveBeenCalledWith(gravacao, 'desafiante');
    expect(t.rpc).toHaveBeenCalledWith('aue_v2_recuperar_duelo', { p_duelo_id: gravacao });
  });
  it('ignora resultado provisório antigo e nunca o repassa à experiência', async () => {
    const t = transporte();
    t.rpc.mockResolvedValueOnce({ data: { ...revelado, resultado_provisorio: 'criador' }, error: null });
    expect(await criarDueloV2(t).recuperar(gravacao)).toEqual({ ok: true, valor: { estado: 'revelado', resultado: { criador: { duracaoMs: 1500 }, desafiante: { duracaoMs: 900 }, efeitoCompetitivo: false, versaoRegua: 'experimental-2', origemMedicao: 'cliente_nao_verificada' } } });
  });
  it('recusa payload que afirme efeito competitivo', async () => {
    const t = transporte();
    t.rpc.mockResolvedValueOnce({ data: { ...revelado, efeito_competitivo: true }, error: null });
    expect(await criarDueloV2(t).recuperar(gravacao)).toEqual({ ok: false, motivo: 'resposta_invalida' });
  });
  it('reemitir com rede incerta não cria outro token automaticamente', async () => {
    const t = transporte(); t.rpc.mockRejectedValueOnce(new Error('perdeu resposta'));
    const d = criarDueloV2(t);
    expect(await d.reemitir(gravacao, token, 2)).toEqual({ ok: false, motivo: 'criacao_incerta' });
    expect(t.novoToken).not.toHaveBeenCalled();
  });
  it('retorna estado de vaga ocupada sem inventar resultado', async () => {
    const t = transporte(); t.rpc.mockResolvedValueOnce({ data: { estado: 'ocupado' }, error: null });
    expect(await criarDueloV2(t).responder(token, gravacao)).toEqual({ ok: true, valor: 'ocupado' });
    expect(t.download).not.toHaveBeenCalled();
  });
});
