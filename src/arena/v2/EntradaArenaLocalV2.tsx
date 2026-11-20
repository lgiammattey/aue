import type { ReactNode } from 'react';
import { ArenaV2 } from './ArenaV2';
import { analyticsArenaV2 } from '../../plataforma/web/analyticsArenaV2';

/** Entrada isolada da Arena: não monta cliente de duelo nem depende de sessão. */
export function EntradaArenaLocalV2({ conteudoDoRepouso }: { conteudoDoRepouso?: ReactNode } = {}) {
  return <div className="fluxo-arena-v2"><ArenaV2 conteudoDoRepouso={conteudoDoRepouso} telemetria={analyticsArenaV2} /></div>;
}
