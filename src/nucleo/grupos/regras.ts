/**
 * Regras do cadastro de grupo externo. Puras: sem rede, sem Deno, sem navegador.
 *
 * ESTE ARQUIVO EXISTE EM DOIS LUGARES, BYTE A BYTE:
 *   supabase/functions/cadastrar-grupo/regras.ts   (a função, que decide)
 *   src/nucleo/grupos/regras.ts                    (o formulário, que avisa cedo)
 * A função publicada não enxerga `src/`, então a cópia é deliberada. O teste
 * `src/nucleo/grupos/regras.paridade.test.ts` reprova se as duas divergirem.
 * Edite um, copie para o outro.
 *
 * Os padrões de link repetem os CHECKs de `grupos_externos`
 * (supabase/migrations/20261018000006). O banco tem a palavra final; aqui só se
 * evita ida ao servidor à toa e se dá mensagem que a pessoa entende.
 */

export type Plataforma = 'whatsapp' | 'telegram' | 'tiktok';

export const PLATAFORMAS: readonly Plataforma[] = ['whatsapp', 'telegram', 'tiktok'];

export const LIMITES = {
  nomeMin: 3,
  nomeMax: 60,
  descricaoMin: 10,
  descricaoMax: 600,
  imagemBytesMax: 1_048_576,
} as const;

export const PADRAO_DO_LINK: Readonly<Record<Plataforma, RegExp>> = {
  whatsapp: /^https:\/\/chat\.whatsapp\.com\/[A-Za-z0-9]{10,40}$/,
  telegram: /^https:\/\/t\.me\/(\+[A-Za-z0-9_-]{5,64}|joinchat\/[A-Za-z0-9_-]{5,64}|[A-Za-z][A-Za-z0-9_]{4,31})$/,
  tiktok: /^https:\/\/(www\.)?tiktok\.com\/@[A-Za-z0-9._]{2,24}\/?$/,
};

export interface EntradaBruta {
  readonly nome: unknown;
  readonly descricao: unknown;
  readonly plataforma: unknown;
  readonly link: unknown;
}

export interface GrupoValido {
  readonly nome: string;
  readonly descricao: string;
  readonly plataforma: Plataforma;
  readonly link: string;
}

export type ResultadoDaValidacao =
  | { readonly ok: true; readonly grupo: GrupoValido }
  | { readonly ok: false; readonly campo: keyof EntradaBruta; readonly mensagem: string };

function texto(valor: unknown): string {
  return typeof valor === 'string' ? valor.replace(/\s+/g, ' ').trim() : '';
}

/**
 * Tira o que o WhatsApp e o TikTok penduram no link (`?mode=...`, `#...`) e que
 * não muda o destino. Não mexe em mais nada: se o resto não bate, o link é
 * recusado, não consertado.
 */
export function limparLink(bruto: unknown): string {
  const t = typeof bruto === 'string' ? bruto.trim() : '';
  const corte = t.search(/[?#]/);
  return corte === -1 ? t : t.slice(0, corte);
}

export function validarCadastro(entrada: EntradaBruta): ResultadoDaValidacao {
  const nome = texto(entrada.nome);
  if (nome.length < LIMITES.nomeMin || nome.length > LIMITES.nomeMax) {
    return { ok: false, campo: 'nome', mensagem: `O nome precisa ter de ${LIMITES.nomeMin} a ${LIMITES.nomeMax} letras.` };
  }

  const descricao = texto(entrada.descricao);
  if (descricao.length < LIMITES.descricaoMin || descricao.length > LIMITES.descricaoMax) {
    return {
      ok: false,
      campo: 'descricao',
      mensagem: `A descrição precisa ter de ${LIMITES.descricaoMin} a ${LIMITES.descricaoMax} letras.`,
    };
  }

  const plataforma = entrada.plataforma;
  if (typeof plataforma !== 'string' || !PLATAFORMAS.includes(plataforma as Plataforma)) {
    return { ok: false, campo: 'plataforma', mensagem: 'Escolha WhatsApp, Telegram ou TikTok.' };
  }

  const link = limparLink(entrada.link);
  if (!PADRAO_DO_LINK[plataforma as Plataforma].test(link)) {
    return { ok: false, campo: 'link', mensagem: mensagemDoLink(plataforma as Plataforma) };
  }

  return { ok: true, grupo: { nome, descricao, plataforma: plataforma as Plataforma, link } };
}

function mensagemDoLink(plataforma: Plataforma): string {
  switch (plataforma) {
    case 'whatsapp':
      return 'Esse link não é de convite do WhatsApp. Ele começa com https://chat.whatsapp.com/.';
    case 'telegram':
      return 'Esse link não é do Telegram. Ele começa com https://t.me/.';
    case 'tiktok':
      return 'Esse link não é de perfil do TikTok. Ele tem o formato https://www.tiktok.com/@nome.';
  }
}

/** Nome vira endereço: sem acento, minúsculo, hífen no lugar do resto. */
export function gerarSlug(nome: string): string {
  const base = nome
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
    .replace(/-+$/g, '');
  return base.length >= 3 ? base : `grupo-${base || 'novo'}`.slice(0, 60);
}

export type TipoDeImagem = 'jpg' | 'png' | 'webp';

/**
 * Descobre o tipo pelos primeiros bytes, não pelo que o arquivo diz ser. Um
 * `.png` que é outra coisa não passa.
 */
export function detectarImagem(bytes: Uint8Array): TipoDeImagem | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'jpg';
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47 &&
    bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a
  ) {
    return 'png';
  }
  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
    bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50
  ) {
    return 'webp';
  }
  return null;
}

export const TIPO_MIME: Readonly<Record<TipoDeImagem, string>> = {
  jpg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
};
