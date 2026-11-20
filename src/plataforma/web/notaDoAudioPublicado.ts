import { configuracaoAusente, supabase } from '../../db/supabase';
import { garantirSessao } from '../../shared/auth/sessaoAnonima';

/** A mesma régua acústica aplicada aos áudios anteriores; origem não é inferida. */
export async function analisarNotaDoAudioPublicado(audio: Blob): Promise<
  | { ok: true; nota: number }
  | { ok: false; motivo: 'naoEArroto' | 'indisponivel' }
> {
  try {
    const [{ julgarSeEhArroto }, { analyzeAudio }, { calculateScore }] = await Promise.all([
      import('../../features/audio/juiz/julgarSeEhArroto'),
      import('../../features/audio/engine'),
      import('../../features/audio/rules'),
    ]);
    const veredito = await julgarSeEhArroto(audio);
    if (veredito.status === 'nao-e-arroto') return { ok: false, motivo: 'naoEArroto' };
    if (veredito.status !== 'arroto') return { ok: false, motivo: 'indisponivel' };
    const metricas = await analyzeAudio(audio);
    const nota = Math.round(calculateScore(metricas, 'Puxei ar').score / 0.9);
    if (!Number.isFinite(nota) || nota < 0 || nota > 100) return { ok: false, motivo: 'indisponivel' };
    return { ok: true, nota };
  } catch {
    return { ok: false, motivo: 'indisponivel' };
  }
}

/** Só registra no servidor depois de a publicação existir e ser confirmada. */
export async function registrarNotaDoAudioPublicado(
  tipo: 'topico' | 'resposta' | 'perfil', id: string, nota: number,
): Promise<boolean> {
  if (configuracaoAusente || !Number.isInteger(nota) || nota < 0 || nota > 100) return false;
  try {
    const sessao = await garantirSessao();
    if (!sessao?.user?.id) return false;
    const { data, error } = await supabase.rpc('registrar_nota_de_audio_publicado', {
      p_tipo: tipo, p_id: id, p_nota: nota,
    });
    return !error && data === true;
  } catch {
    return false;
  }
}

type Pendencia = { usuario: string; tipo: 'topico' | 'resposta' | 'perfil'; id: string; nota: number };
const CHAVE_DAS_PENDENCIAS = 'aue.notas-publicadas.pendentes.v1';
function pendencias(): Pendencia[] {
  try {
    const dados: unknown = JSON.parse(localStorage.getItem(CHAVE_DAS_PENDENCIAS) ?? '[]');
    if (!Array.isArray(dados)) return [];
    return dados.filter((p): p is Pendencia => p && typeof p === 'object' && typeof p.usuario === 'string'
      && (p.tipo === 'topico' || p.tipo === 'resposta' || p.tipo === 'perfil')
      && typeof p.id === 'string' && Number.isInteger(p.nota) && p.nota >= 0 && p.nota <= 100);
  } catch { return []; }
}
function guardarPendencias(lista: Pendencia[]): boolean {
  try {
    if (lista.length) localStorage.setItem(CHAVE_DAS_PENDENCIAS, JSON.stringify(lista));
    else localStorage.removeItem(CHAVE_DAS_PENDENCIAS);
    return true;
  } catch { return false; }
}

/** Retenta apenas notas da conta atual. Não armazena o áudio. */
export async function retentarNotasPublicadasPendentes(): Promise<void> {
  try {
    const usuario = (await garantirSessao())?.user?.id;
    if (!usuario) return;
    for (const item of pendencias().filter((p) => p.usuario === usuario)) {
      if (await registrarNotaDoAudioPublicado(item.tipo, item.id, item.nota)) {
        // Relê a fila para preservar entradas criadas enquanto a RPC aguardava.
        guardarPendencias(pendencias().filter((p) => !(p.usuario === item.usuario && p.tipo === item.tipo && p.id === item.id && p.nota === item.nota)));
      }
    }
  } catch { /* Mantém a fila para a próxima tentativa. */ }
}

/** A publicação já ocorreu. False significa nota pendente, não falha do post. */
export async function registrarOuGuardarNotaPublicada(tipo: Pendencia['tipo'], id: string, nota: number): Promise<boolean> {
  if (await registrarNotaDoAudioPublicado(tipo, id, nota)) return true;
  try {
    const usuario = (await garantirSessao())?.user?.id;
    if (!usuario) return false;
    const lista = pendencias().filter((p) => !(p.usuario === usuario && p.tipo === tipo && p.id === id));
    guardarPendencias([...lista, { usuario, tipo, id, nota }]);
  } catch { /* O post existe; não inventar confirmação de nota. */ }
  return false;
}
