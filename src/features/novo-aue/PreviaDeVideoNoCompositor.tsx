import { detectarLinkDeVideo } from '../../nucleo/midia/embeds';

interface Props {
  readonly texto: string;
}

/**
 * O link continua fazendo parte do texto publicado. Esta prévia só revela, no
 * rascunho, o mesmo vídeo aprovado que será mostrado no feed e nas respostas.
 */
export function PreviaDeVideoNoCompositor({ texto }: Props) {
  const video = detectarLinkDeVideo(texto);
  if (!video) return null;

  const nomeDaPlataforma = video.tipo === 'youtube' ? 'YouTube' : 'TikTok';

  return (
    <figure className="composer-video-preview">
      <figcaption>Prévia do {nomeDaPlataforma}</figcaption>
      <iframe
        src={video.embedUrl}
        title={`Prévia do ${nomeDaPlataforma}`}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
      />
    </figure>
  );
}
