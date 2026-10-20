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

/** Player visual único para causos e arrotos do perfil. */
export function PlayerDoArroto({ tocando, tempoAtualSegundos, duracaoSegundos, aoAlternar }: Props) {
  const tempoAtual = formatarTempo(tempoAtualSegundos);
  const temDuracao = duracaoSegundos !== null && Number.isFinite(duracaoSegundos) && duracaoSegundos > 0;
  const tempo = temDuracao ? `${tempoAtual} / ${formatarTempo(duracaoSegundos)}` : tempoAtual;

  return (
    <div className="burp-player" role="region" aria-label="Player do arroto">
      <button
        type="button"
        className="play"
        aria-label={tocando ? 'Pausar áudio' : 'Ouvir áudio'}
        onClick={aoAlternar}
      >
        {tocando ? '❚❚' : '▶'}
      </button>
      <div className="wave" aria-hidden="true">
        {[12, 22, 16, 26, 18, 14, 28, 20, 16, 24, 10, 18, 22, 14].map((h, i) => (
          <i
            key={i}
            style={{ '--h': `${tocando ? Math.max(6, (h * (i % 2 === 0 ? 1.2 : 0.8)) % 28) : h}px` } as React.CSSProperties}
          />
        ))}
      </div>
      <span className="player-time" aria-label={`Tempo do áudio: ${tempo}`}>{tempo}</span>
    </div>
  );
}
