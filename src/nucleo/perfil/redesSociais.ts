/**
 * Redes sociais do perfil: o que a pessoa digita e o link que o perfil mostra.
 *
 * O banco guarda só o @ (sem URL). O formulário aceita o @ ou o link do perfil
 * e normaliza para o @; o link mostrado sempre é montado aqui, nunca por
 * concatenação solta, para um valor ruim não virar link quebrado.
 */
export type RedeSocial = 'instagram' | 'tiktok' | 'youtube' | 'twitter';

interface Regra {
  /** O que vale como @ nessa rede. */
  readonly arroba: RegExp;
  /** Hosts aceitos quando a pessoa cola o link do perfil. */
  readonly hosts: readonly string[];
  readonly montar: (arroba: string) => string;
  readonly nome: string;
}

const REGRAS: Readonly<Record<RedeSocial, Regra>> = {
  instagram: {
    arroba: /^[A-Za-z0-9._]{1,30}$/,
    hosts: ['instagram.com'],
    montar: (a) => `https://instagram.com/${a}`,
    nome: 'Instagram',
  },
  tiktok: {
    arroba: /^[A-Za-z0-9._]{1,24}$/,
    hosts: ['tiktok.com'],
    montar: (a) => `https://www.tiktok.com/@${a}`,
    nome: 'TikTok',
  },
  youtube: {
    arroba: /^[A-Za-z0-9._-]{1,50}$/,
    hosts: ['youtube.com'],
    montar: (a) => `https://www.youtube.com/@${a}`,
    nome: 'YouTube',
  },
  twitter: {
    arroba: /^[A-Za-z0-9_]{1,15}$/,
    hosts: ['x.com', 'twitter.com'],
    montar: (a) => `https://x.com/${a}`,
    nome: 'X / Twitter',
  },
};

export type ResultadoDaRede =
  | { readonly ok: true; readonly valor: string | null }
  | { readonly ok: false; readonly mensagem: string };

function arrobaDoLink(rede: RedeSocial, texto: string): string | null {
  try {
    const url = new URL(/^https?:\/\//i.test(texto) ? texto : `https://${texto}`);
    const host = url.hostname.toLowerCase().replace(/^(www|m|mobile)\./, '');
    if (!REGRAS[rede].hosts.includes(host)) return null;
    const primeiro = url.pathname.split('/').filter(Boolean)[0] ?? '';
    return decodeURIComponent(primeiro).replace(/^@/, '');
  } catch {
    return null;
  }
}

const PARECE_LINK = /^(https?:\/\/|www\.|[a-z0-9-]+\.[a-z]{2,}\/)/i;

/** Vazio vira `null` (apagar). Aceita `@nome`, `nome` ou o link do perfil da própria rede. */
export function normalizarRede(rede: RedeSocial, entrada: string): ResultadoDaRede {
  const texto = entrada.trim();
  if (texto === '') return { ok: true, valor: null };
  const regra = REGRAS[rede];
  const candidato = PARECE_LINK.test(texto) ? arrobaDoLink(rede, texto) : texto.replace(/^@/, '');
  if (candidato && regra.arroba.test(candidato)) return { ok: true, valor: candidato };
  return { ok: false, mensagem: `${regra.nome}: use só o @ ou o link do seu perfil.` };
}

/** Link do perfil na rede, ou `null` quando o valor guardado não é um @ válido (nunca monta link quebrado). */
export function linkDaRede(rede: RedeSocial, guardado: string | null | undefined): string | null {
  if (!guardado) return null;
  const resultado = normalizarRede(rede, guardado);
  return resultado.ok && resultado.valor ? REGRAS[rede].montar(resultado.valor) : null;
}
