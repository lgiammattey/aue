import { describe, expect, it } from 'vitest';
import { detectarImagem, gerarSlug, limparLink, validarCadastro } from './regras';

const BASE = {
  nome: 'Arroto Trovão',
  descricao: 'Grupo de quem arrota alto e com orgulho.',
  plataforma: 'whatsapp',
  link: 'https://chat.whatsapp.com/JaC2ggM5mG12pioXJnOgHc',
};

describe('validarCadastro', () => {
  it('aceita um cadastro completo e limpa o espaço sobrando', () => {
    const r = validarCadastro({ ...BASE, nome: '  Arroto   Trovão ' });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.grupo.nome).toBe('Arroto Trovão');
  });

  it('tira o ?mode= que o WhatsApp pendura no convite', () => {
    const r = validarCadastro({ ...BASE, link: `${BASE.link}?mode=gi_t` });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.grupo.link).toBe(BASE.link);
  });

  it.each([
    ['whatsapp', 'https://chat.whatsapp.com/JaC2ggM5mG12pioXJnOgHc'],
    ['telegram', 'https://t.me/+AbCdEf12345'],
    ['telegram', 'https://t.me/meugrupo'],
    ['tiktok', 'https://www.tiktok.com/@fulano.x'],
    ['tiktok', 'https://tiktok.com/@fulano/'],
  ])('aceita link %s %s', (plataforma, link) => {
    expect(validarCadastro({ ...BASE, plataforma, link }).ok).toBe(true);
  });

  it.each([
    ['whatsapp', 'http://chat.whatsapp.com/JaC2ggM5mG12pioXJnOgHc'],
    ['whatsapp', 'https://chat.whatsapp.com.evil.com/JaC2ggM5mG12pioXJnOgHc'],
    ['whatsapp', 'https://evil.com/https://chat.whatsapp.com/JaC2ggM5mG12pioXJnOgHc'],
    ['whatsapp', 'https://chat.whatsapp.com/abc'],
    ['telegram', 'https://t.me/a'],
    ['telegram', 'https://telegram.me.evil.io/meugrupo'],
    ['tiktok', 'https://tiktok.com.evil.io/@x'],
    ['tiktok', 'https://www.tiktok.com/@fulano/video/1'],
    ['whatsapp', 'javascript:alert(1)'],
  ])('recusa link %s %s', (plataforma, link) => {
    const r = validarCadastro({ ...BASE, plataforma, link });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.campo).toBe('link');
  });

  it('recusa link do WhatsApp quando a plataforma escolhida é outra', () => {
    expect(validarCadastro({ ...BASE, plataforma: 'telegram' }).ok).toBe(false);
  });

  it('recusa plataforma desconhecida e valor que não é texto', () => {
    expect(validarCadastro({ ...BASE, plataforma: 'discord' }).ok).toBe(false);
    expect(validarCadastro({ ...BASE, nome: 42 }).ok).toBe(false);
    expect(validarCadastro({ ...BASE, link: null }).ok).toBe(false);
  });

  it('confere o tamanho do nome e da descrição', () => {
    expect(validarCadastro({ ...BASE, nome: 'ab' }).ok).toBe(false);
    expect(validarCadastro({ ...BASE, nome: 'a'.repeat(61) }).ok).toBe(false);
    expect(validarCadastro({ ...BASE, descricao: 'curta' }).ok).toBe(false);
    expect(validarCadastro({ ...BASE, descricao: 'a'.repeat(601) }).ok).toBe(false);
  });
});

describe('limparLink', () => {
  it('só corta query e hash', () => {
    expect(limparLink(' https://t.me/x#a ')).toBe('https://t.me/x');
    expect(limparLink(undefined)).toBe('');
  });
});

describe('gerarSlug', () => {
  it('tira acento e vira hífen', () => {
    expect(gerarSlug('Arroto e Peido Dos Profissionais')).toBe('arroto-e-peido-dos-profissionais');
    expect(gerarSlug('Grupo do Peido & Arroto!!')).toBe('grupo-do-peido-arroto');
    expect(gerarSlug('Zoeira Atômica')).toBe('zoeira-atomica');
  });

  it('respeita o formato que o banco exige', () => {
    for (const nome of ['😀😀😀', 'ab', 'A'.repeat(100), '   ']) {
      const s = gerarSlug(nome);
      expect(s).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
      expect(s.length).toBeGreaterThanOrEqual(3);
      expect(s.length).toBeLessThanOrEqual(60);
    }
  });
});

describe('detectarImagem', () => {
  it('reconhece pelos bytes', () => {
    expect(detectarImagem(Uint8Array.from([0xff, 0xd8, 0xff, 0xe0]))).toBe('jpg');
    expect(detectarImagem(Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))).toBe('png');
    expect(
      detectarImagem(Uint8Array.from([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50])),
    ).toBe('webp');
  });

  it('recusa o que só tem nome de imagem', () => {
    expect(detectarImagem(new TextEncoder().encode('<svg onload=alert(1)>'))).toBeNull();
    expect(detectarImagem(new Uint8Array())).toBeNull();
  });
});
