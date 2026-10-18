import type { RotuloDeAgente, Roteiro, Sorteio } from './tipos.ts';
import { brasiliaParaUtc, JANELA_DA_CASA } from './horario.ts';

/** Gerador pseudoaleatório pequeno e determinístico (mulberry32). */
export function mulberry32(semente: number): () => number {
  let a = semente >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const ROTULOS: readonly RotuloDeAgente[] = ['A', 'B', 'C', 'D', 'E'];

function inteiro(rng: () => number, min: number, max: number): number {
  return min + Math.floor(rng() * (max - min + 1));
}

/**
 * Sorteia quem é cada "agente A..E" e quanto tempo depois do post cada
 * comentário sai. A mesma semente sempre dá o mesmo resultado, e o resultado
 * nasce `PENDENTE_REVISAO`: alguém precisa olhar antes de aplicar.
 *
 * O atraso é de minutos (3 a 59) ou de horas (1h a 4h49), e nunca passa do fim
 * da janela do conteúdo da casa.
 */
export function sortear(roteiro: Roteiro, semente: number): Sorteio {
  const rng = mulberry32(semente);

  const usados = ROTULOS.filter((r) => roteiro.comentarios.some((c) => c.agente === r));
  if (roteiro.poolDeAgentes.length < usados.length) {
    throw new Error('O pool de agentes é menor que o número de rótulos do cronograma.');
  }

  // Fisher-Yates sobre uma cópia: o pool original não muda.
  const pool = [...roteiro.poolDeAgentes];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  const agentes = Object.fromEntries(
    ROTULOS.map((r) => [r, usados.includes(r) ? pool[usados.indexOf(r)] : '']),
  ) as Record<RotuloDeAgente, string>;

  const fim = Date.parse(JANELA_DA_CASA.fimUtc);
  const atrasos: Record<string, number> = {};
  for (const c of roteiro.comentarios) {
    const post = roteiro.posts.find((p) => p.chave === c.postChave);
    if (!post) throw new Error(`Comentário ${c.chave} aponta para o post ${c.postChave}, que não existe.`);
    const folga = Math.floor((fim - Date.parse(brasiliaParaUtc(post.quando))) / 60_000);

    const emHoras = rng() >= 0.55;
    let atraso = emHoras ? inteiro(rng, 1, 4) * 60 + inteiro(rng, 0, 49) : inteiro(rng, 3, 59);
    if (atraso > folga) atraso = inteiro(rng, 3, Math.max(3, Math.min(59, folga - 1)));
    atrasos[c.chave] = atraso;
  }

  return { semente, status: 'PENDENTE_REVISAO', agentes, atrasosEmMinutos: atrasos };
}
