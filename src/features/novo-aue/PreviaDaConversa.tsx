import { Link } from 'react-router-dom';
import type { ItemComentario, ItemDoFeed } from './tipos';
import { VideoDaResposta } from './VideoDaResposta';

interface Props {
  readonly post: ItemDoFeed;
  readonly comentarios: readonly ItemComentario[];
  readonly carregando?: boolean;
  readonly expandida?: boolean;
  readonly carregandoMais?: boolean;
  readonly temMais?: boolean;
  readonly aoCarregarMais: () => void;
  /** Abre o compositor já vinculado ao comentário escolhido. */
  readonly aoResponder: (comentario: ItemComentario) => void;
}

function formatarTempoRelativo(isoOuData: string): string {
  try {
    const data = new Date(isoOuData);
    const segundos = Math.max(0, Math.floor((Date.now() - data.getTime()) / 1000));
    if (segundos < 60) return 'agora';
    const minutos = Math.floor(segundos / 60);
    if (minutos < 60) return `${minutos}m`;
    const horas = Math.floor(minutos / 60);
    if (horas < 24) return `${horas}h`;
    const dias = Math.floor(horas / 24);
    return dias === 1 ? 'ontem' : `${dias}d`;
  } catch {
    return 'agora';
  }
}

/**
 * Uma prévia fica fora do CardDoPost: conversa não é um detalhe visual do post,
 * mas continua visível no feed sem exigir que a pessoa abra a thread inteira.
 */
export function PreviaDaConversa({
  post,
  comentarios,
  carregando = false,
  expandida = false,
  carregandoMais = false,
  temMais = true,
  aoCarregarMais,
  aoResponder,
}: Props) {
  if (post.tipo !== 'topico' || post.respostasTotal === 0) return null;

  const faltam = expandida ? Math.max(0, post.respostasTotal - comentarios.length) : post.respostasTotal;
  const quantidade = Math.min(3, faltam);
  const rotulo = carregandoMais
    ? 'Carregando respostas…'
    : `Ver ${expandida ? 'mais ' : ''}${quantidade} ${quantidade === 1 ? 'resposta' : 'respostas'}`;

  return (
    <section
      className={`conversation-preview${!temMais && comentarios.length > 0 ? ' conversation-preview--complete' : ''}`}
      aria-label={`Conversa: ${post.respostasTotal} respostas`}
    >
      {carregando ? (
        <p className="conversation-preview__loading">Carregando respostas…</p>
      ) : (
        comentarios.map((comentario) => {
          const inicial = (comentario.autorNome || '?').charAt(0).toUpperCase();
          const perfil = comentario.autorHandle ? `/u/${comentario.autorHandle}` : null;

          return (
            <article className="conversation-preview__reply" key={comentario.id}>
              {perfil ? (
                <Link className="conversation-preview__avatar" to={perfil} aria-label={`Abrir perfil de ${comentario.autorNome}`}>
                  {comentario.autorAvatarUrl ? <img src={comentario.autorAvatarUrl} alt="" /> : inicial}
                </Link>
              ) : (
                <span className="conversation-preview__avatar" aria-hidden="true">{inicial}</span>
              )}
              <div className="conversation-preview__body">
                <div className="conversation-preview__meta">
                  <span className="conversation-preview__author">{comentario.autorNome}</span>
                  <time dateTime={comentario.criadoEm}>{formatarTempoRelativo(comentario.criadoEm)}</time>
                </div>
                <p>{comentario.conteudo}</p>
                {comentario.anexo?.tipo === 'audio' && comentario.anexo.url && (
                  <div className="comment-audio conversation-preview__audio">
                    <audio controls src={comentario.anexo.url} preload="metadata" />
                  </div>
                )}
                <VideoDaResposta
                  conteudo={comentario.conteudo}
                  urlDoAnexo={comentario.anexo?.tipo === 'videoExterno' ? comentario.anexo.url : undefined}
                />
                <button
                  type="button"
                  className="conversation-preview__reply-action"
                  onClick={() => aoResponder(comentario)}
                  aria-label={`Responder a ${comentario.autorNome}`}
                >
                  Responder
                </button>
              </div>
            </article>
          );
        })
      )}

      {temMais && quantidade > 0 && (
        <button
          type="button"
          className="conversation-preview__more"
          onClick={aoCarregarMais}
          disabled={carregandoMais}
        >
          {rotulo}
        </button>
      )}
    </section>
  );
}
