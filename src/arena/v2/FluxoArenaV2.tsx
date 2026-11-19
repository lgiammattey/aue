import { useState } from 'react';
import type { CapturaDeAudio } from '../../portas/captura';
import type { CapturaPcmV2 } from '../../portas/capturaPcmV2';
import type { Compartilhamento } from '../../portas/compartilhamento';
import type { DueloV2 } from '../../portas/dueloV2';
import type { TelemetriaArenaV2 } from '../../portas/telemetriaArenaV2';
import { ArenaV2 } from './ArenaV2';
import { CriarDueloV2, type TentativaDoDuelo } from './duelo/DueloV2';
import { EntradaDueloV2 } from './duelo/EntradaDueloV2';
import { MeusDuelosV2 } from './duelo/MeusDuelosV2';

export interface FluxoArenaV2Props {
  readonly modo: 'criar' | 'responder';
  readonly duelo?: DueloV2;
  readonly compartilhar?: Compartilhamento;
  readonly origem?: string;
  readonly lerToken?: () => string | null;
  readonly captura?: CapturaPcmV2;
  readonly capturaSemLaudo?: CapturaDeAudio;
  readonly aoVoltar?: () => void;
  readonly telemetria?: TelemetriaArenaV2;
}

/** Composição local: dependências explícitas evitam conexão acidental com produção. */
export function FluxoArenaV2({ modo, duelo, compartilhar, origem, lerToken, captura, capturaSemLaudo, aoVoltar, telemetria }: FluxoArenaV2Props) {
  const [tela, setTela] = useState<'arena' | 'duelo' | 'meus' | 'encerrado'>(modo === 'criar' ? 'arena' : 'duelo');
  const [tentativa, setTentativa] = useState<TentativaDoDuelo | null>(null);
  const habilitado = Boolean(duelo && (modo === 'responder' || (compartilhar && origem)));
  const sair = () => { setTentativa(null); setTela('encerrado'); aoVoltar?.(); };
  const usar = (nova: TentativaDoDuelo) => { setTentativa(nova); setTela('duelo'); };

  return <div className="fluxo-arena-v2">
    {tela !== 'encerrado' && tela !== 'meus' && <div hidden={tela !== 'arena'}>
      <ArenaV2 telemetria={telemetria} captura={captura} capturaSemLaudo={capturaSemLaudo} aoUsarTentativa={habilitado ? usar : undefined}
        rotuloUsarTentativa={modo === 'criar' ? 'Criar desafio' : 'Usar esta gravação'}
        aoVoltar={modo === 'responder' ? () => setTela('duelo') : aoVoltar ? sair : undefined} />
      {habilitado && modo === 'criar' && <button type="button" onClick={() => setTela('meus')}>Meus desafios</button>}
      {!habilitado && <p role="status">O duelo não está disponível neste ambiente. Sua gravação continua local.</p>}
    </div>}
    <div hidden={tela !== 'duelo'}>
      {tela !== 'encerrado' && habilitado && duelo && modo === 'responder' && <EntradaDueloV2 duelo={duelo} lerToken={lerToken} tentativa={tentativa} aoGravar={() => { setTentativa(null); setTela('arena'); }} aoVoltar={sair} />}
      {habilitado && duelo && modo === 'criar' && tentativa && compartilhar && origem && tela === 'duelo' && <CriarDueloV2 duelo={duelo} compartilhar={compartilhar} origem={origem} tentativa={tentativa} aoVoltar={() => setTela('arena')} />}
      {!habilitado && <section><p role="status">O duelo não está disponível neste ambiente.</p><button type="button" onClick={sair}>Voltar</button></section>}
    </div>
    {tela === 'meus' && duelo && compartilhar && origem && <MeusDuelosV2 duelo={duelo} compartilhar={compartilhar} origem={origem} aoVoltar={() => setTela('arena')} />}
    {tela === 'encerrado' && <p>Fluxo encerrado.</p>}
  </div>;
}
