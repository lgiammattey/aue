import { describe, expect, it } from 'vitest';
import { caminhoDoAudioDaCasa, LIMITE_DO_AUDIO_DA_CASA_BYTES, validarM4a } from './formatoAudio';

function m4a(marca: string, tamanho = 64): Uint8Array {
  const b = new Uint8Array(tamanho);
  b.set([0, 0, 0, 0x20], 0);
  b.set(new TextEncoder().encode('ftyp'), 4);
  b.set(new TextEncoder().encode(marca), 8);
  return b;
}

describe('formato do áudio da casa', () => {
  it('aceita container MP4 com marca de áudio', () => {
    for (const marca of ['M4A ', 'isom', 'mp42']) expect(validarM4a(m4a(marca)).ok).toBe(true);
  });

  it('recusa ogg, mesmo com nome de m4a', () => {
    const ogg = new Uint8Array(64);
    ogg.set(new TextEncoder().encode('OggS'), 0);
    const r = validarM4a(ogg);
    expect(r.ok).toBe(false);
  });

  it('recusa marca de vídeo e arquivo vazio', () => {
    expect(validarM4a(m4a('qt  ')).ok).toBe(false);
    expect(validarM4a(new Uint8Array(0)).ok).toBe(false);
  });

  it('recusa o que passa de 1 MB', () => {
    expect(LIMITE_DO_AUDIO_DA_CASA_BYTES).toBe(1_048_576);
    expect(validarM4a(m4a('M4A ', LIMITE_DO_AUDIO_DA_CASA_BYTES)).ok).toBe(true);
    expect(validarM4a(m4a('M4A ', LIMITE_DO_AUDIO_DA_CASA_BYTES + 1)).ok).toBe(false);
  });

  it('o caminho no bucket sai do id do post', () => {
    expect(caminhoDoAudioDaCasa('abc')).toBe('burpzilla/abc.m4a');
  });
});
