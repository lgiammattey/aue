import { memo } from 'react';
import type { ItemDoFeed } from './tipos';

interface Props {
  readonly post: ItemDoFeed;
  readonly voto: 1 | -1 | undefined;
  readonly salvo: boolean;
  readonly audioTocando: boolean;
  readonly aoVotar: (delta: 1 | -1) => void;
  readonly aoAlternarSalvar: () => void;
  readonly aoTocarAudio: (urlOuResolver?: string | (() => Promise<string | null>)) => void;
  readonly aoAbrirComentarios?: () => void;
}

function formatarTempoRelativo(isoOuData: string): string {
  try {
    const data = new Date(isoOuData);
    const segundos = Math.max(0, Math.floor((Date.now() - data.getTime()) / 1000));
    if (segundos < 60) return 'agora';
    const minutos = Math.floor(segundos / 60);
    if (minutos < 60) return `há ${minutos} min`;
    const horas = Math.floor(minutos / 60);
    if (horas < 24) return `há ${horas} h`;
    const dias = Math.floor(horas / 24);
    if (dias === 1) return 'ontem';
    if (dias < 7) return `há ${dias} dias`;
    return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' }).format(data);
  } catch {
    return 'agora';
  }
}

export const CardDoPost = memo(function CardDoPost({
  post,
  voto,
  salvo,
  audioTocando,
  aoVotar,
  aoAlternarSalvar,
  aoTocarAudio,
  aoAbrirComentarios,
}: Props) {
  const pontuacaoAtual = post.votos + (voto ?? 0);
  const autorIdentificador = post.autorHandle ? `u/${post.autorHandle}` : post.autorNome;
  const comunidadeIdentificador = `r/${post.comunidadeSlug}`;

  return (
    <article className="post" data-post-id={post.id}>
      <div className="vote" aria-label="Pontuação do post">
        <button
          type="button"
          aria-label="Votar positivo"
          className={voto === 1 ? 'voted' : ''}
          onClick={() => aoVotar(1)}
        >
          ▲
        </button>
        <span className="score" aria-label={`${pontuacaoAtual} pontos`}>
          {pontuacaoAtual}
        </span>
        <button
          type="button"
          aria-label="Votar negativo"
          className={voto === -1 ? 'voted' : ''}
          onClick={() => aoVotar(-1)}
        >
          ▼
        </button>
      </div>

      <div className="post-body">
        <div className="post-meta">
          <span className="badge">{comunidadeIdentificador}</span>
          <span>•</span>
          <span>{autorIdentificador}</span>
          <span>•</span>
          <span>{formatarTempoRelativo(post.criadoEm)}</span>
          {typeof post.nota === 'number' && post.nota > 0 && (
            <span className="badge-nota" title="Nota do Arroto">
              NOTA {Math.round(post.nota)}
            </span>
          )}
        </div>

        <h3
          onClick={aoAbrirComentarios}
          style={{ cursor: aoAbrirComentarios ? 'pointer' : 'default' }}
          tabIndex={aoAbrirComentarios ? 0 : undefined}
          onKeyDown={(e) => {
            if ((e.key === 'Enter' || e.key === ' ') && aoAbrirComentarios) {
              e.preventDefault();
              aoAbrirComentarios();
            }
          }}
        >
          {post.titulo}
        </h3>

        {post.corpo && <p>{post.corpo}</p>}

        {(post.temAudio || post.enderecoDoAudio) && (
          <div className="burp-player" role="region" aria-label="Player do arroto">
            <button
              type="button"
              className="play"
              aria-label={audioTocando ? 'Pausar áudio' : 'Ouvir áudio'}
              onClick={() => aoTocarAudio(post.enderecoDoAudio)}
            >
              {audioTocando ? '❚❚' : '▶'}
            </button>
            <div className="wave" aria-hidden="true">
              {[12, 22, 16, 26, 18, 14, 28, 20, 16, 24, 10, 18, 22, 14].map((h, i) => (
                <i
                  key={i}
                  style={
                    {
                      '--h': `${audioTocando ? Math.max(6, (h * (i % 2 === 0 ? 1.2 : 0.8)) % 28) : h}px`,
                    } as React.CSSProperties
                  }
                />
              ))}
            </div>
            <span className="player-time">{audioTocando ? '0:02' : '0:03'}</span>
          </div>
        )}

        <div className="post-actions">
          <button type="button" onClick={aoAbrirComentarios}>
            💬 {post.respostasTotal} comentários
          </button>
          <button type="button" onClick={aoAlternarSalvar}>
            {salvo ? '★ Salvo' : '☆ Salvar'}
          </button>
          <button
            type="button"
            onClick={() => {
              if (navigator.clipboard) {
                navigator.clipboard.writeText(window.location.href);
              }
            }}
          >
            ↗ Compartilhar
          </button>
        </div>
      </div>
    </article>
  );
});
