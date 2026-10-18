import { describe, expect, it } from 'vitest';
import {
  acrescentarAoSitemap,
  escaparHtml,
  type GrupoParaPagina,
  hashDaLista,
  montarListaEstatica,
  montarPaginaDoGrupo,
  resumoDaDescricao,
  urlDoGrupo,
} from './paginaEstatica';

const ORIGEM = 'https://aue.web.app';

const GRUPO: GrupoParaPagina = {
  slug: 'gym-arrotos',
  nome: 'GYM Arrotos',
  descricao: 'Grupo pra quem tem talento em arrotar.',
  plataforma: 'whatsapp',
  link: 'https://chat.whatsapp.com/KrRzws9Xhlo4RmOq8TmVue',
  imagemUrl: null,
};

describe('montarPaginaDoGrupo', () => {
  const html = montarPaginaDoGrupo(GRUPO, ORIGEM);

  it('tem título, descrição e canonical próprios, com a barra final', () => {
    expect(html).toContain('<title>GYM Arrotos — grupo de WhatsApp no Auê!</title>');
    expect(html).toContain('<link rel="canonical" href="https://aue.web.app/g/gym-arrotos/" />');
    expect(html).toContain('<meta property="og:url" content="https://aue.web.app/g/gym-arrotos/" />');
    expect(html).toContain('content="Grupo pra quem tem talento em arrotar."');
    expect(html).not.toMatch(/noindex/i);
  });

  it('declara dados estruturados WebPage em JSON-LD', () => {
    expect(html).toContain('"@type":"WebPage"');
    expect(html).toContain('"url":"https://aue.web.app/g/gym-arrotos/"');
    expect(html).toContain('"inLanguage":"pt-BR"');
  });

  it('o link do convite sai com nofollow e sem passar o referrer', () => {
    expect(html).toMatch(/<a class="botao" href="https:\/\/chat\.whatsapp\.com\/KrRzws9Xhlo4RmOq8TmVue" target="_blank" rel="nofollow ugc noopener noreferrer">Entrar no grupo<\/a>/);
  });

  it('sem imagem, o card usa a imagem do Auê; com imagem, usa a do grupo', () => {
    expect(html).toContain('content="https://aue.web.app/og-image.png"');
    expect(html).not.toContain('class="capa"');
    const com = montarPaginaDoGrupo({ ...GRUPO, imagemUrl: 'https://x.supabase.co/storage/v1/object/public/b/a.png' }, ORIGEM);
    expect(com).toContain('class="capa" src="https://x.supabase.co/storage/v1/object/public/b/a.png"');
  });

  it('não inventa número: nada de membros nem de grupo ativo', () => {
    expect(html).not.toMatch(/\d+\s*(membros|participantes)/i);
    expect(html).toContain('não sabe quantos membros');
  });

  it('texto de usuário nunca vira HTML', () => {
    const mau = montarPaginaDoGrupo(
      { ...GRUPO, nome: '<script>alert(1)</script>', descricao: '"><img src=x onerror=alert(1)>' },
      ORIGEM,
    );
    expect(mau).not.toContain('<script>alert(1)</script>');
    expect(mau).not.toContain('<img src=x');
    expect(mau).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
  });

  it('TikTok abre o perfil em vez de entrar no grupo', () => {
    const tt = montarPaginaDoGrupo({ ...GRUPO, plataforma: 'tiktok', link: 'https://www.tiktok.com/@zoeira' }, ORIGEM);
    expect(tt).toContain('>Abrir o perfil</a>');
  });
});

describe('resumoDaDescricao', () => {
  it('mantém o texto curto como está e corta o longo sem quebrar palavra', () => {
    expect(resumoDaDescricao('curto  e\nlimpo')).toBe('curto e limpo');
    const longo = 'palavra '.repeat(60);
    const r = resumoDaDescricao(longo);
    expect(r.length).toBeLessThanOrEqual(155);
    expect(r.endsWith('…')).toBe(true);
    expect(r).not.toMatch(/palav…$/);
  });
});

describe('hashDaLista', () => {
  it('não depende da ordem e muda quando qualquer campo visível muda', async () => {
    const b: GrupoParaPagina = { ...GRUPO, slug: 'b', nome: 'B' };
    expect(await hashDaLista([GRUPO, b])).toBe(await hashDaLista([b, GRUPO]));
    expect(await hashDaLista([GRUPO])).not.toBe(await hashDaLista([{ ...GRUPO, descricao: 'outra' }]));
    expect(await hashDaLista([GRUPO])).not.toBe(await hashDaLista([]));
  });
});

describe('sitemap e lista estática', () => {
  it('acrescenta uma entrada por grupo antes de fechar o urlset', () => {
    const base = '<urlset>\n  <url><loc>https://aue.web.app/</loc></url>\n</urlset>';
    const r = acrescentarAoSitemap(base, [GRUPO], ORIGEM);
    expect(r).toContain('<loc>https://aue.web.app/g/gym-arrotos/</loc>');
    expect(r.trimEnd().endsWith('</urlset>')).toBe(true);
    expect(acrescentarAoSitemap(base, [], ORIGEM)).toBe(base);
  });

  it('a lista do noscript aponta para a página de cada grupo', () => {
    expect(montarListaEstatica([GRUPO])).toContain('<a href="/g/gym-arrotos/">GYM Arrotos</a> (WhatsApp)');
  });

  it('urlDoGrupo e escaparHtml', () => {
    expect(urlDoGrupo(ORIGEM, 'x')).toBe('https://aue.web.app/g/x/');
    expect(escaparHtml(`&<>"'`)).toBe('&amp;&lt;&gt;&quot;&#39;');
  });
});
