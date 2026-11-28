import { useState, type ReactNode } from 'react';
import { analyticsArenaV2 } from '../../plataforma/web/analyticsArenaV2';
import { useLocation, useNavigate } from 'react-router-dom';
import { criarCompartilhamentoWeb } from '../../plataforma/web/compartilhamento';
import { criarDueloV2 } from '../../plataforma/web/dueloV2';
import { origemDoConviteV2 } from '../../plataforma/web/origemDoConviteV2';
import { FluxoArenaV2 } from './FluxoArenaV2';

/** Apenas montada com a flag de duelo ligada para o ambiente escolhido. */
export function EntradaDueloIntegrado({
  modo,
  conteudoDoRepouso,
  rankingDoHero,
  conteudoAposResultado,
  adversarioHandle,
  telaInicial,
  modoEmbutido = false,
  experienciaM05 = false,
  aoPublicarAudio,
}: {
  modo: 'criar' | 'responder';
  conteudoDoRepouso?: ReactNode;
  rankingDoHero?: ReactNode;
  conteudoAposResultado?: ReactNode;
  adversarioHandle?: string | null;
  telaInicial?: 'arena' | 'meus';
  modoEmbutido?: boolean;
  experienciaM05?: boolean;
  aoPublicarAudio?: (audio: Blob, nota: number | null, duracaoMs: number) => void;
}) {
  const navigate = useNavigate();
  const { search } = useLocation();
  const adversario = adversarioHandle ?? new URLSearchParams(search).get('desafiar');
  const [portas] = useState(() => ({
    duelo: criarDueloV2(),
    compartilhar: criarCompartilhamentoWeb(),
    origem: origemDoConviteV2(),
  }));
  return (
    <FluxoArenaV2
      modo={modo}
      conteudoDoRepouso={conteudoDoRepouso}
      rankingDoHero={rankingDoHero}
      conteudoAposResultado={conteudoAposResultado}
      adversarioHandle={adversario}
      telaInicial={telaInicial}
      modoEmbutido={modoEmbutido}
      experienciaM05={experienciaM05}
      aoPublicarAudio={aoPublicarAudio}
      {...portas}
      telemetria={analyticsArenaV2}
      aoVoltar={modo === 'responder' ? () => navigate('/') : telaInicial === 'meus' ? () => navigate('/arena') : undefined}
    />
  );
}
