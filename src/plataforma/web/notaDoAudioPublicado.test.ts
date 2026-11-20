import { beforeEach, describe, expect, it, vi } from 'vitest';
const rpc = vi.hoisted(() => vi.fn());
const sessao = vi.hoisted(() => vi.fn());
const juiz = vi.hoisted(() => vi.fn());
const analisar = vi.hoisted(() => vi.fn());
const calcular = vi.hoisted(() => vi.fn());
vi.mock('../../db/supabase', () => ({ configuracaoAusente: false, supabase: { rpc } }));
vi.mock('../../shared/auth/sessaoAnonima', () => ({ garantirSessao: sessao }));
vi.mock('../../features/audio/juiz/julgarSeEhArroto', () => ({ julgarSeEhArroto: juiz }));
vi.mock('../../features/audio/engine', () => ({ analyzeAudio: analisar }));
vi.mock('../../features/audio/rules', () => ({ calculateScore: calcular }));
import { analisarNotaDoAudioPublicado, registrarNotaDoAudioPublicado, registrarOuGuardarNotaPublicada, retentarNotasPublicadasPendentes } from './notaDoAudioPublicado';

beforeEach(() => { vi.clearAllMocks(); juiz.mockResolvedValue({ status: 'arroto' }); analisar.mockResolvedValue({}); calcular.mockReturnValue({ score: 54 }); sessao.mockResolvedValue({ user: { id: 'a' } }); rpc.mockResolvedValue({ data: true, error: null }); });
describe('nota de áudio publicado', () => {
  it('usa as parciais acústicas da régua retrospectiva, sem inventar origem', async () => {
    expect(await analisarNotaDoAudioPublicado(new Blob(['audio']))).toEqual({ ok: true, nota: 60 });
    expect(calcular).toHaveBeenCalledWith({}, 'Puxei ar');
  });
  it('não cria nota para áudio recusado ou falha de análise', async () => {
    juiz.mockResolvedValueOnce({ status: 'nao-e-arroto' }).mockResolvedValueOnce({ status: 'indisponivel' });
    expect(await analisarNotaDoAudioPublicado(new Blob())).toEqual({ ok: false, motivo: 'naoEArroto' });
    expect(await analisarNotaDoAudioPublicado(new Blob())).toEqual({ ok: false, motivo: 'indisponivel' });
    expect(analisar).not.toHaveBeenCalled();
  });
  it('só confirma gravação quando o banco confirma e evita mandar nota inválida', async () => {
    expect(await registrarNotaDoAudioPublicado('perfil', 'id', 60)).toBe(true);
    rpc.mockResolvedValueOnce({ data: false, error: null });
    expect(await registrarNotaDoAudioPublicado('perfil', 'id', 60)).toBe(false);
    expect(await registrarNotaDoAudioPublicado('perfil', 'id', NaN)).toBe(false);
    expect(rpc).toHaveBeenCalledTimes(2);
  });
  it('retenta apenas a nota pendente da conta correta e não guarda o áudio', async () => {
    const memoria = new Map<string, string>();
    vi.stubGlobal('localStorage', {
      getItem: (chave: string) => memoria.get(chave) ?? null,
      setItem: (chave: string, valor: string) => memoria.set(chave, valor),
      removeItem: (chave: string) => memoria.delete(chave),
    });
    try {
      rpc.mockResolvedValueOnce({ data: false, error: null });
      expect(await registrarOuGuardarNotaPublicada('perfil', 'id', 60)).toBe(false);
      expect([...memoria.values()].join()).not.toContain('audio');
      sessao.mockResolvedValue({ user: { id: 'outra-conta' } });
      await retentarNotasPublicadasPendentes();
      expect(rpc).toHaveBeenCalledTimes(1);
      sessao.mockResolvedValue({ user: { id: 'a' } });
      await retentarNotasPublicadasPendentes();
      expect(rpc).toHaveBeenCalledTimes(2);
      expect(memoria.size).toBe(0);
    } finally { vi.unstubAllGlobals(); }
  });
});
