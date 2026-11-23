import type { ReactNode } from 'react';
import { ArenaV2 } from './ArenaV2';
import { analyticsArenaV2 } from '../../plataforma/web/analyticsArenaV2';

/** Entrada isolada da Arena: não monta cliente de duelo nem depende de sessão. */
export function EntradaArenaLocalV2({
  conteudoDoRepouso,
  rankingDoHero,
  adversarioHandle,
  modoEmbutido = false,
  aoPublicarAudio,
}: {
  conteudoDoRepouso?: ReactNode;
  rankingDoHero?: ReactNode;
  adversarioHandle?: string | null;
  modoEmbutido?: boolean;
  aoPublicarAudio?: (audio: Blob, nota?: number | null) => void;
} = {}) {
  return (
    <div className={`fluxo-arena-v2${modoEmbutido ? ' fluxo-arena-v2--embutida' : ''}`}>
      <ArenaV2
        conteudoDoRepouso={conteudoDoRepouso}
        rankingDoHero={rankingDoHero}
        adversarioHandle={adversarioHandle}
        modoEmbutido={modoEmbutido}
        aoPublicarAudio={aoPublicarAudio}
        telemetria={analyticsArenaV2}
      />
    </div>
  );
}
