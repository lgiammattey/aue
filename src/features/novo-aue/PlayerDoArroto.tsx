import './TokensDoCard.css';
import './PlayerDoArroto.css';

interface Props {
  readonly tocando: boolean;
  readonly tempoAtualSegundos: number;
  readonly duracaoSegundos: number | null;
  readonly aoAlternar: () => void;
}

function formatarTempo(segundos: number): string {
  const total = Number.isFinite(segundos) ? Math.max(0, Math.floor(segundos)) : 0;
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}

/**
 * Forma de onda do protótipo (56 barras, mesma conta do `waveBars`). É desenho,
 * não medida do áudio: não existe análise do arquivo na tela, então ela fica
 * parada e cinza. Calculada uma vez, fora do render.
 */
const ALTURAS_DA_ONDA: readonly number[] = Array.from({ length: 56 }, (_, i) => {
  const envelope = 0.35 + 0.65 * Math.sin((Math.PI * (i + 3)) / 62);
  return Math.round(3 + envelope * 13 * Math.abs(Math.sin(i * 1.3)));
});

const CAMINHO_DO_PLAY = 'M7 4l13 8-13 8z';
const CAMINHO_DO_PAUSE = 'M6 4h4v16H6zM14 4h4v16h-4z';

/**
 * Player visual único para causos, tópicos e arrotos do perfil.
 * Em repouso, com duração conhecida, mostra só ela (como no print). Tocando,
 * mostra o tempo corrido e preenche a onda aos poucos, em --fg (nunca verde).
 * Sem duração conhecida mostra o tempo corrido. Nunca inventa duração.
 */
export function PlayerDoArroto({ tocando, tempoAtualSegundos, duracaoSegundos, aoAlternar }: Props) {
  const temDuracao = duracaoSegundos !== null && Number.isFinite(duracaoSegundos) && duracaoSegundos > 0;
  const mostraCorrido = tocando || !temDuracao;
  const tempo = mostraCorrido ? formatarTempo(tempoAtualSegundos) : formatarTempo(duracaoSegundos);
  // Quantas barras já foram tocadas; só com duração conhecida e tocando.
  const tocadas = tocando && temDuracao
    ? Math.min(ALTURAS_DA_ONDA.length, Math.floor((Math.max(0, tempoAtualSegundos) / duracaoSegundos) * ALTURAS_DA_ONDA.length))
    : 0;

  return (
    <div className="player-arroto" role="region" aria-label="Player do arroto">
      <button
        type="button"
        className="player-arroto__play"
        aria-label={tocando ? 'Pausar áudio' : 'Ouvir áudio'}
        onClick={aoAlternar}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false">
          <path d={tocando ? CAMINHO_DO_PAUSE : CAMINHO_DO_PLAY} />
        </svg>
      </button>
      <div className="player-arroto__onda" aria-hidden="true">
        {ALTURAS_DA_ONDA.map((altura, i) => (
          <i key={i} className={i < tocadas ? 'is-tocada' : undefined} style={{ height: altura }} />
        ))}
      </div>
      <span className="player-arroto__tempo" aria-label={`Tempo do áudio: ${tempo}`}>{tempo}</span>
      <svg className="player-arroto__ondas" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true" focusable="false">
        <path d="M4 10v4M8 6v12M12 3v18M16 7v10M20 10v4" />
      </svg>
    </div>
  );
}
