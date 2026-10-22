import type { ItemDoFeed } from './tipos';

interface Props {
  readonly topicos: readonly ItemDoFeed[];
  readonly aoAbrirTopico: (topico: ItemDoFeed) => void;
}

function formatarTempoRelativo(isoOuData: string): string {
  try {
    const segundos = Math.max(0, Math.floor((Date.now() - new Date(isoOuData).getTime()) / 1000));
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

function tipoDeMidia(topico: ItemDoFeed): string | null {
  if (topico.anexo?.tipo === 'audio' || topico.temAudio) return 'Áudio';
  if (topico.anexo?.tipo === 'imagem') return 'Imagem';
  if (topico.anexo?.tipo === 'videoExterno') return 'Vídeo';
  return null;
}

/**
 * A entrada da comunidade é uma pauta de fórum: assunto, recorte e atividade.
 * A conversa completa só aparece ao abrir o tópico.
 */
export function ListaDeTopicos({ topicos, aoAbrirTopico }: Props) {
  return (
    <ol className="community-topic-list" aria-label="Lista de tópicos">
      {topicos.map((topico) => {
        const midia = tipoDeMidia(topico);
        const resumo = topico.corpo.trim();

        return (
          <li className="community-topic-list__item" key={topico.id}>
            <button
              type="button"
              className="community-topic-list__button"
              onClick={() => aoAbrirTopico(topico)}
              aria-label={`Abrir tópico: ${topico.titulo}`}
            >
              <span className="community-topic-list__main">
                <span className="community-topic-list__title">{topico.titulo}</span>
                {resumo && <span className="community-topic-list__excerpt">{resumo}</span>}
                <span className="community-topic-list__meta">
                  <strong>{topico.autorNome}</strong>
                  <span aria-hidden="true">·</span>
                  <time dateTime={topico.criadoEm}>{formatarTempoRelativo(topico.criadoEm)}</time>
                  {midia && <span className="community-topic-list__media">{midia}</span>}
                </span>
              </span>
              <span className="community-topic-list__activity" aria-label={`${topico.respostasTotal} ${topico.respostasTotal === 1 ? 'resposta' : 'respostas'}`}>
                <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M20 4.5H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h9l5 3.5v-3.5h2a2 2 0 0 0 2-2v-9a2 2 0 0 0-2-2Z" /><path d="M8 11h.01M12 11h.01M16 11h.01" /></svg>
                <b>{topico.respostasTotal}</b>
              </span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}
