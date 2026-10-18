/**
 * Páginas estáticas dos grupos externos (ADR 0004).
 *
 * Funções puras: recebem a lista, devolvem texto. Quem lê o Supabase e quem
 * escreve o disco é `scripts/gerar-paginas-de-grupos.ts`.
 *
 * A página é só uma vitrine. Não calcula nada, não escreve nada e não promete
 * nada que o Auê não saiba: sem contagem de membros, sem "ativo agora".
 */

export interface GrupoParaPagina {
  readonly slug: string;
  readonly nome: string;
  readonly descricao: string;
  readonly plataforma: 'whatsapp' | 'telegram' | 'tiktok';
  readonly link: string;
  /** Endereço público da imagem, ou `null`. */
  readonly imagemUrl: string | null;
}

const ROTULO: Readonly<Record<GrupoParaPagina['plataforma'], string>> = {
  whatsapp: 'WhatsApp',
  telegram: 'Telegram',
  tiktok: 'TikTok',
};

const BOTAO: Readonly<Record<GrupoParaPagina['plataforma'], string>> = {
  whatsapp: 'Entrar no grupo',
  telegram: 'Entrar no grupo',
  tiktok: 'Abrir o perfil',
};

export function escaparHtml(texto: string): string {
  return texto
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function urlDoGrupo(origem: string, slug: string): string {
  return `${origem}/g/${slug}/`;
}

/** Trecho curto para `description` e `og:description`: uma linha, sem cortar palavra no meio. */
export function resumoDaDescricao(descricao: string, limite = 155): string {
  const linha = descricao.replace(/\s+/g, ' ').trim();
  if (linha.length <= limite) return linha;
  const corte = linha.slice(0, limite - 1);
  const ultimoEspaco = corte.lastIndexOf(' ');
  return `${(ultimoEspaco > 80 ? corte.slice(0, ultimoEspaco) : corte).trimEnd()}…`;
}

/**
 * A identidade da lista inteira. Muda quando muda qualquer coisa que aparece
 * nas páginas, e só então. Serve para o agendamento saber se vale republicar.
 */
export async function hashDaLista(grupos: readonly GrupoParaPagina[]): Promise<string> {
  const linhas = [...grupos]
    .sort((a, b) => a.slug.localeCompare(b.slug))
    .map((g) => JSON.stringify([g.slug, g.nome, g.descricao, g.plataforma, g.link, g.imagemUrl]));
  const bytes = new TextEncoder().encode(linhas.join('\n'));
  const resumo = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(resumo))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export function montarPaginaDoGrupo(grupo: GrupoParaPagina, origem: string): string {
  const url = urlDoGrupo(origem, grupo.slug);
  const titulo = `${grupo.nome} — grupo de ${ROTULO[grupo.plataforma]} no Auê!`;
  const resumo = resumoDaDescricao(grupo.descricao);
  const imagem = grupo.imagemUrl ?? `${origem}/og-image.png`;
  const t = escaparHtml(titulo);
  const r = escaparHtml(resumo);

  return `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${t}</title>
    <meta name="description" content="${r}" />
    <meta name="robots" content="index, follow" />
    <link rel="canonical" href="${escaparHtml(url)}" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <meta name="theme-color" content="#0a0a08" />

    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="Auê" />
    <meta property="og:locale" content="pt_BR" />
    <meta property="og:url" content="${escaparHtml(url)}" />
    <meta property="og:title" content="${t}" />
    <meta property="og:description" content="${r}" />
    <meta property="og:image" content="${escaparHtml(imagem)}" />
    <meta name="twitter:card" content="summary" />
    <meta name="twitter:title" content="${t}" />
    <meta name="twitter:description" content="${r}" />
    <meta name="twitter:image" content="${escaparHtml(imagem)}" />

    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Anton&family=Archivo:wght@400;600;700&display=swap"
      rel="stylesheet"
    />
    <style>
      :root { --bg:#0a0a08; --fg:#f4f4ee; --muted:#a3a39a; --surface:#14140f; --border:#26261f; }
      @media (prefers-color-scheme: light) {
        :root { --bg:#f6f5ee; --fg:#14140f; --muted:#5d5d52; --surface:#ffffff; --border:#dcdbd0; }
      }
      * { box-sizing: border-box; }
      body { margin:0; background:var(--bg); color:var(--fg); font-family:Archivo,system-ui,sans-serif; line-height:1.5; }
      main { max-width:640px; margin:0 auto; padding:24px 16px calc(48px + env(safe-area-inset-bottom)); }
      a.marca { font-family:Anton,Impact,sans-serif; font-size:24px; color:var(--fg); text-decoration:none; }
      h1 { font-family:Anton,Impact,sans-serif; font-weight:400; font-size:40px; line-height:1.1; margin:24px 0 8px; overflow-wrap:anywhere; }
      .etiqueta { display:inline-block; font:12px ui-monospace,monospace; text-transform:uppercase; color:var(--muted); background:var(--surface); border:1px solid var(--border); padding:2px 8px; border-radius:6px; }
      img.capa { display:block; width:96px; height:96px; object-fit:cover; border-radius:20px; margin-top:16px; background:var(--surface); }
      p.texto { white-space:pre-line; overflow-wrap:anywhere; font-size:17px; margin:20px 0; }
      a.botao { display:flex; align-items:center; justify-content:center; min-height:48px; border-radius:999px; background:var(--fg); color:var(--bg); font-weight:700; text-decoration:none; }
      nav { display:flex; gap:20px; flex-wrap:wrap; margin-top:24px; }
      nav a { display:inline-flex; align-items:center; min-height:44px; color:var(--muted); }
      p.aviso { color:var(--muted); font-size:14px; margin-top:24px; }
    </style>
  </head>
  <body>
    <main>
      <a class="marca" href="/" aria-label="Auê! início">AUÊ!</a>
      <h1>${escaparHtml(grupo.nome)}</h1>
      <span class="etiqueta">${ROTULO[grupo.plataforma]}</span>
${grupo.imagemUrl ? `      <img class="capa" src="${escaparHtml(grupo.imagemUrl)}" alt="" width="96" height="96" />\n` : ''}      <p class="texto">${escaparHtml(grupo.descricao)}</p>
      <a class="botao" href="${escaparHtml(grupo.link)}" target="_blank" rel="nofollow ugc noopener noreferrer">${BOTAO[grupo.plataforma]}</a>
      <p class="aviso">O Auê só abre o convite. Ele não sabe quantos membros o grupo tem nem se o convite ainda vale.</p>
      <nav aria-label="Navegação">
        <a href="/grupos">Ver todos os grupos</a>
        <a href="/">Jogar o Auê</a>
      </nav>
    </main>
  </body>
</html>
`;
}

/** Itens da lista que vai dentro do `<noscript>` de `/grupos`. */
export function montarListaEstatica(grupos: readonly GrupoParaPagina[]): string {
  return grupos
    .map(
      (g) =>
        `        <li><a href="/g/${escaparHtml(g.slug)}/">${escaparHtml(g.nome)}</a> (${ROTULO[g.plataforma]})</li>`,
    )
    .join('\n');
}

/** Acrescenta as páginas dos grupos ao sitemap já existente. */
export function acrescentarAoSitemap(sitemap: string, grupos: readonly GrupoParaPagina[], origem: string): string {
  if (grupos.length === 0) return sitemap;
  const hoje = new Date().toISOString().slice(0, 10);
  const entradas = grupos
    .map(
      (g) => `  <url>
    <loc>${escaparHtml(urlDoGrupo(origem, g.slug))}</loc>
    <lastmod>${hoje}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.5</priority>
  </url>`,
    )
    .join('\n');
  return sitemap.replace('</urlset>', `${entradas}\n</urlset>`);
}

export const MARCADOR_DA_LISTA = '<!--GRUPOS_ESTATICOS-->';
