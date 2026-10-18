/**
 * Utilitários de detecção e formatação de embeds de vídeo (YouTube e TikTok).
 * Permite reproduzir vídeos sem sair do app Auê.
 */

export interface VideoEmbedInfo {
  readonly tipo: 'youtube' | 'tiktok';
  readonly urlOriginal: string;
  readonly embedUrl: string;
  readonly id: string;
}

/**
 * Extrai URL de vídeo do YouTube ou TikTok presente em um texto ou string direta.
 */
export function detectarLinkDeVideo(texto: string): VideoEmbedInfo | null {
  if (!texto) return null;

  // YouTube matchers: watch?v=ID, youtu.be/ID, shorts/ID
  const ytMatch = texto.match(
    /(?:https?:\/\/)?(?:www\.|m\.)?(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/i,
  );

  if (ytMatch && ytMatch[1]) {
    const id = ytMatch[1];
    return {
      tipo: 'youtube',
      urlOriginal: ytMatch[0],
      embedUrl: `https://www.youtube-nocookie.com/embed/${id}?rel=0&playsinline=1`,
      id,
    };
  }

  // TikTok matcher: tiktok.com/@user/video/ID
  const tiktokMatch = texto.match(
    /(?:https?:\/\/)?(?:www\.)?tiktok\.com\/@[^/]+\/video\/(\d+)/i,
  );

  if (tiktokMatch && tiktokMatch[1]) {
    const id = tiktokMatch[1];
    return {
      tipo: 'tiktok',
      urlOriginal: tiktokMatch[0],
      embedUrl: `https://www.tiktok.com/embed/v2/${id}`,
      id,
    };
  }

  return null;
}
