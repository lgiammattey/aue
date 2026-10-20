import { describe, it, expect } from 'vitest';
import { detectarLinkDeVideo } from './embeds';

describe('detectarLinkDeVideo', () => {
  it('detecta link padrão de YouTube', () => {
    const res = detectarLinkDeVideo('Olha esse arroto https://www.youtube.com/watch?v=dQw4w9WgXcQ muito bom');
    expect(res).not.toBeNull();
    expect(res?.tipo).toBe('youtube');
    expect(res?.id).toBe('dQw4w9WgXcQ');
    expect(res?.embedUrl).toContain('youtube-nocookie.com/embed/dQw4w9WgXcQ');
  });

  it('detecta link encurtado youtu.be', () => {
    const res = detectarLinkDeVideo('https://youtu.be/dQw4w9WgXcQ');
    expect(res?.tipo).toBe('youtube');
    expect(res?.id).toBe('dQw4w9WgXcQ');
  });

  it('detecta YouTube Shorts', () => {
    const res = detectarLinkDeVideo('Causo em shorts https://youtube.com/shorts/dQw4w9WgXcQ?feature=share');
    expect(res?.tipo).toBe('youtube');
    expect(res?.id).toBe('dQw4w9WgXcQ');
  });

  it('detecta vídeo do TikTok', () => {
    const res = detectarLinkDeVideo('Arroto insano https://www.tiktok.com/@arrotador/video/7123456789012345678');
    expect(res).not.toBeNull();
    expect(res?.tipo).toBe('tiktok');
    expect(res?.id).toBe('7123456789012345678');
    expect(res?.embedUrl).toContain('tiktok.com/embed/v2/7123456789012345678');
  });

  it('retorna null quando não há link suportado', () => {
    expect(detectarLinkDeVideo('Apenas um causo em texto sem link')).toBeNull();
  });
});

describe('detectarLinkDeVideo — forma canônica enviada ao banco', () => {
  const ID = 'dQw4w9WgXcQ';
  const casos: ReadonlyArray<[string, string]> = [
    [`https://www.youtube.com/watch?v=${ID}`, `https://www.youtube.com/watch?v=${ID}`],
    [`youtube.com/watch?v=${ID}`, `https://www.youtube.com/watch?v=${ID}`],
    [`https://m.youtube.com/watch?v=${ID}`, `https://www.youtube.com/watch?v=${ID}`],
    [`https://www.youtube.com/watch?feature=share&v=${ID}`, `https://www.youtube.com/watch?v=${ID}`],
    [`https://youtu.be/${ID}?si=abc123`, `https://www.youtube.com/watch?v=${ID}`],
    [`https://www.youtube.com/shorts/${ID}`, `https://www.youtube.com/watch?v=${ID}`],
    [`https://www.youtube.com/live/${ID}`, `https://www.youtube.com/watch?v=${ID}`],
    [`https://music.youtube.com/watch?v=${ID}`, `https://www.youtube.com/watch?v=${ID}`],
    ['https://www.tiktok.com/@arrotador/video/7123456789012345678', 'https://www.tiktok.com/@arrotador/video/7123456789012345678'],
    ['tiktok.com/@arrotador/video/7123456789012345678?lang=pt', 'https://www.tiktok.com/@arrotador/video/7123456789012345678'],
    ['https://m.tiktok.com/@a.b_c/video/7123456789012345678', 'https://www.tiktok.com/@a.b_c/video/7123456789012345678'],
  ];

  it.each(casos)('normaliza %s', (entrada, esperado) => {
    expect(detectarLinkDeVideo(entrada)?.urlOriginal).toBe(esperado);
  });

  it.each([
    'https://notyoutube.com/watch?v=dQw4w9WgXcQ',
    'https://www.youtube.com/watch?v=curto',
    'https://www.youtube.com/@canal',
    'https://vimeo.com/123456789',
    'https://www.tiktok.com/@arrotador',
  ])('rejeita %s', (entrada) => {
    expect(detectarLinkDeVideo(entrada)).toBeNull();
  });
});
