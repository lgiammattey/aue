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
