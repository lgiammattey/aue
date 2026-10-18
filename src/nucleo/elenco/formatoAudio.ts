/**
 * O formato do áudio da casa: `.m4a` (AAC em MP4), até 1 MB.
 *
 * É o que o bucket `audio_da_casa` aceita (`audio/mp4`) e o que toca em iPhone
 * e Android. Esta checagem olha os bytes, não a extensão: um `.ogg` renomeado
 * não passa.
 */

export const MIME_DO_AUDIO_DA_CASA = 'audio/mp4';
export const LIMITE_DO_AUDIO_DA_CASA_BYTES = 1_048_576;

const MARCAS_ACEITAS = ['M4A ', 'isom', 'iso2', 'mp41', 'mp42'] as const;

export type ResultadoDoFormato = { readonly ok: true } | { readonly ok: false; readonly motivo: string };

export function validarM4a(bytes: Uint8Array): ResultadoDoFormato {
  if (bytes.length < 16) return { ok: false, motivo: 'arquivo pequeno demais para ser um m4a' };
  if (bytes.length > LIMITE_DO_AUDIO_DA_CASA_BYTES) {
    return { ok: false, motivo: `passa de ${LIMITE_DO_AUDIO_DA_CASA_BYTES} bytes (limite do bucket)` };
  }
  const ler = (de: number) => String.fromCharCode(...bytes.slice(de, de + 4));
  if (ler(4) !== 'ftyp') return { ok: false, motivo: 'sem a caixa ftyp: não é um container MP4' };
  const marca = ler(8);
  if (!(MARCAS_ACEITAS as readonly string[]).includes(marca)) {
    return { ok: false, motivo: `marca "${marca}" não é de áudio MP4` };
  }
  return { ok: true };
}

/** Onde o áudio de um post mora dentro do bucket. */
export function caminhoDoAudioDaCasa(postId: string): string {
  return `burpzilla/${postId}.m4a`;
}
