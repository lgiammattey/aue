import { memo } from 'react';
import { Link } from 'react-router-dom';
import type { ItemDoFeed } from './tipos';
import { PlayerDoArroto } from './PlayerDoArroto';
import { detectarLinkDeVideo } from '../../nucleo/midia/embeds';

interface Props {
  readonly post: ItemDoFeed;
  readonly salvo: boolean;
  readonly audioTocando: boolean;
  readonly tempoAtualDoAudio: number;
  readonly duracaoDoAudio: number | null;
  readonly aoCurtir?: () => void;
  readonly aoReagir?: (tipo: 'fogo' | 'nojo' | 'trofeu') => void;
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
  salvo,
  audioTocando,
  tempoAtualDoAudio,
  duracaoDoAudio,
  aoCurtir,
  aoReagir,
  aoAlternarSalvar,
  aoTocarAudio,
  aoAbrirComentarios,
}: Props) {
  const autorIdentificador = post.autorHandle ? `u/${post.autorHandle}` : post.autorNome;
  const comunidadeIdentificador = `r/${post.comunidadeSlug}`;
  const video = post.videoUrl ? detectarLinkDeVideo(post.videoUrl) : null;

  return (
    <article className="post" data-post-id={post.id}>
      <div className="post-body">
        <div className="post-meta">
          <span className="badge">{comunidadeIdentificador}</span>
          <span>•</span>
          {post.autorHandle ? (
            <Link to={`/u/${post.autorHandle}`} aria-label={`Abrir perfil de ${autorIdentificador}`}>
              {autorIdentificador}
            </Link>
          ) : <span>{autorIdentificador}</span>}
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
        {video?.tipo === 'youtube' && <iframe className="post-video" src={video.embedUrl} title={`Vídeo: ${post.titulo}`} loading="lazy" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" />}

        {(post.temAudio || post.enderecoDoAudio) && (
          <PlayerDoArroto
            tocando={audioTocando}
            tempoAtualSegundos={tempoAtualDoAudio}
            duracaoSegundos={duracaoDoAudio}
            aoAlternar={() => aoTocarAudio(post.enderecoDoAudio)}
          />
        )}

        <div className="post-actions">
          <button type="button" onClick={aoCurtir} disabled={!aoCurtir}>♡ Curtir</button>
          <button type="button" onClick={() => aoReagir?.('fogo')} disabled={!aoReagir}>🔥</button>
          <button type="button" onClick={() => aoReagir?.('nojo')} disabled={!aoReagir}>🤢</button>
          <button type="button" onClick={() => aoReagir?.('trofeu')} disabled={!aoReagir}>🏆</button>
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
