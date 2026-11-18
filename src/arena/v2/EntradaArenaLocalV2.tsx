import { ArenaV2 } from './ArenaV2';

/** Entrada isolada da Arena: não monta cliente de duelo nem depende de sessão. */
export function EntradaArenaLocalV2() {
  return <div className="fluxo-arena-v2"><ArenaV2 /></div>;
}
