import type { ReactNode } from 'react';
import { ArenaV2 } from './ArenaV2';
import { analyticsArenaV2 } from '../../plataforma/web/analyticsArenaV2';

/** Entrada isolada da Arena: não monta cliente de duelo nem depende de sessão. */
export function EntradaArenaLocalV2({ conteudoDoRepouso, adversarioHandle }: { conteudoDoRepouso?: ReactNode; adversarioHandle?: string | null } = {}) {
  return <div className="fluxo-arena-v2"><ArenaV2 conteudoDoRepouso={conteudoDoRepouso} adversarioHandle={adversarioHandle} telemetria={analyticsArenaV2} /></div>;
}
