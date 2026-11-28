import type { ReactNode } from 'react';
import { ArenaV2 } from './ArenaV2';
import { analyticsArenaV2 } from '../../plataforma/web/analyticsArenaV2';

/** Entrada isolada da Arena: não monta cliente de duelo nem depende de sessão. */
export function EntradaArenaLocalV2({
  conteudoDoRepouso,
  rankingDoHero,
  conteudoAposResultado,
  adversarioHandle,
  modoEmbutido = false,
  experienciaM05 = false,
  aoPublicarAudio,
}: {
  conteudoDoRepouso?: ReactNode;
  rankingDoHero?: ReactNode;
  conteudoAposResultado?: ReactNode;
  adversarioHandle?: string | null;
  modoEmbutido?: boolean;
  experienciaM05?: boolean;
  aoPublicarAudio?: (audio: Blob, nota: number | null, duracaoMs: number) => void;
} = {}) {
  return (
    <div className={`fluxo-arena-v2${modoEmbutido ? ' fluxo-arena-v2--embutida' : ''}`}>
      <ArenaV2
        conteudoDoRepouso={conteudoDoRepouso}
        rankingDoHero={rankingDoHero}
        conteudoAposResultado={conteudoAposResultado}
        adversarioHandle={adversarioHandle}
        modoEmbutido={modoEmbutido}
        experienciaM05={experienciaM05}
        aoPublicarAudio={aoPublicarAudio}
        telemetria={analyticsArenaV2}
      />
    </div>
  );
}
