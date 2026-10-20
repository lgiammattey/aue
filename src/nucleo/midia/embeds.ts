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

const ANTES = String.raw`(?<![A-Za-z0-9.@-])`;
const ID_YOUTUBE = '([A-Za-z0-9_-]{11})';

const YOUTUBE = new RegExp(
  `${ANTES}(?:https?:\\/\\/)?(?:(?:www\\.|m\\.|music\\.)?youtube\\.com\\/(?:watch\\?(?:[^#\\s]*&)?v=|shorts\\/|live\\/|embed\\/)|youtu\\.be\\/)${ID_YOUTUBE}`,
  'i',
);
const TIKTOK = new RegExp(
  `${ANTES}(?:https?:\\/\\/)?(?:www\\.|m\\.)?tiktok\\.com\\/(@[A-Za-z0-9._-]{1,24})\\/video\\/(\\d{10,25})`,
  'i',
);

/**
 * Extrai um vídeo do YouTube ou TikTok de um texto ou link.
 *
 * `urlOriginal` sai sempre na forma canônica (https, host com www), a mesma que
 * a função SQL `aue_url_video_externo_canonica` devolve. É isso que viaja ao
 * banco: qualquer ajuste aqui precisa ser espelhado lá (ver embeds.test.ts).
 */
export function detectarLinkDeVideo(texto: string): VideoEmbedInfo | null {
  if (!texto) return null;

  const yt = texto.match(YOUTUBE);
  if (yt?.[1]) {
    const id = yt[1];
    return {
      tipo: 'youtube',
      urlOriginal: `https://www.youtube.com/watch?v=${id}`,
      embedUrl: `https://www.youtube-nocookie.com/embed/${id}?rel=0&playsinline=1`,
      id,
    };
  }

  const tt = texto.match(TIKTOK);
  if (tt?.[1] && tt[2]) {
    return {
      tipo: 'tiktok',
      urlOriginal: `https://www.tiktok.com/${tt[1]}/video/${tt[2]}`,
      embedUrl: `https://www.tiktok.com/embed/v2/${tt[2]}`,
      id: tt[2],
    };
  }

  return null;
}
