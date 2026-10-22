import { detectarLinkDeVideo } from '../../nucleo/midia/embeds';

interface Props {
  readonly conteudo: string;
  readonly urlDoAnexo?: string;
}

/**
 * Respostas aceitam vídeo externo apenas pelos provedores aprovados. Um URL
 * colado no texto recebe o mesmo tratamento do anexo explícito da resposta.
 */
export function VideoDaResposta({ conteudo, urlDoAnexo }: Props) {
  const video = (urlDoAnexo ? detectarLinkDeVideo(urlDoAnexo) : null) ?? detectarLinkDeVideo(conteudo);
  if (!video) return null;

  return (
    <iframe
      className="reply-video"
      src={video.embedUrl}
      title={`Vídeo ${video.tipo === 'youtube' ? 'do YouTube' : 'do TikTok'} na resposta`}
      loading="lazy"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
      allowFullScreen
    />
  );
}
