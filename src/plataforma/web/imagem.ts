/**
 * Preparação de imagens que entram no perfil.
 *
 * Este é o único lugar que conhece `createImageBitmap` e canvas. A tela só
 * entrega o arquivo e a posição escolhida no recorte; ela nunca manipula o
 * arquivo original nem sobe uma imagem sem normalizar.
 */
export type DestinoDaImagemDePerfil = 'avatar' | 'capa';

export interface RecorteDaImagem {
  /** Centro horizontal normalizado da imagem, de 0 a 1. */
  readonly centroX: number;
  /** Centro vertical normalizado da imagem, de 0 a 1. */
  readonly centroY: number;
  /** 1 mostra o maior recorte possível; valores maiores aproximam a foto. */
  readonly zoom: number;
}

export type MotivoDaImagemInvalida =
  | 'formatoInvalido'
  | 'grandeDemais'
  | 'dimensoesInsuficientes'
  | 'dimensoesExcedidas'
  | 'recorteInvalido'
  | 'falhou';

export type ResultadoDaImagemPreparada =
  | { readonly ok: true; readonly imagem: Blob; readonly dimensoes: { readonly largura: number; readonly altura: number } }
  | { readonly ok: false; readonly motivo: MotivoDaImagemInvalida };

interface RegraDeImagem {
  readonly larguraMinima: number;
  readonly alturaMinima: number;
  readonly larguraDeSaida: number;
  readonly alturaDeSaida: number;
  readonly limiteDeSaidaBytes: number;
}

const TIPOS_ACEITOS = new Set(['image/jpeg', 'image/png', 'image/webp']);
const LIMITE_DE_ENTRADA_BYTES = 10 * 1024 * 1024;
const MAXIMO_DE_PIXELS_DE_ENTRADA = 24_000_000;

const REGRAS: Record<DestinoDaImagemDePerfil, RegraDeImagem> = {
  avatar: {
    larguraMinima: 320,
    alturaMinima: 320,
    larguraDeSaida: 512,
    alturaDeSaida: 512,
    limiteDeSaidaBytes: 2 * 1024 * 1024,
  },
  capa: {
    larguraMinima: 1200,
    alturaMinima: 400,
    larguraDeSaida: 1500,
    alturaDeSaida: 500,
    limiteDeSaidaBytes: 3 * 1024 * 1024,
  },
};

export const LIMITES_DE_IMAGEM_DE_PERFIL = {
  tiposAceitos: ['image/jpeg', 'image/png', 'image/webp'] as const,
  entradaMaximaBytes: LIMITE_DE_ENTRADA_BYTES,
  maximoDePixelsDeEntrada: MAXIMO_DE_PIXELS_DE_ENTRADA,
  avatar: REGRAS.avatar,
  capa: REGRAS.capa,
} as const;

/** URL temporária para a prévia local, sem mandar o arquivo ao servidor. */
export function criarUrlDePreviewDeImagem(arquivo: Blob): string {
  return URL.createObjectURL(arquivo);
}

/** Libera a prévia quando o modal troca de arquivo ou é fechado. */
export function revokeUrlDePreviewDeImagem(url: string): void {
  URL.revokeObjectURL(url);
}

function recorteValido(recorte: RecorteDaImagem): boolean {
  return Number.isFinite(recorte.centroX)
    && Number.isFinite(recorte.centroY)
    && Number.isFinite(recorte.zoom)
    && recorte.centroX >= 0 && recorte.centroX <= 1
    && recorte.centroY >= 0 && recorte.centroY <= 1
    && recorte.zoom >= 1 && recorte.zoom <= 8;
}

function recorteCentral(): RecorteDaImagem {
  return { centroX: 0.5, centroY: 0.5, zoom: 1 };
}

function calcularOrigem(
  largura: number,
  altura: number,
  regra: RegraDeImagem,
  recorte: RecorteDaImagem,
) {
  const proporcaoDaSaida = regra.larguraDeSaida / regra.alturaDeSaida;
  let larguraBase: number;
  let alturaBase: number;

  if (largura / altura > proporcaoDaSaida) {
    alturaBase = altura;
    larguraBase = altura * proporcaoDaSaida;
  } else {
    larguraBase = largura;
    alturaBase = largura / proporcaoDaSaida;
  }

  const larguraDoCorte = larguraBase / recorte.zoom;
  const alturaDoCorte = alturaBase / recorte.zoom;
  const centroX = largura * recorte.centroX;
  const centroY = altura * recorte.centroY;
  const origemX = Math.min(Math.max(centroX - larguraDoCorte / 2, 0), largura - larguraDoCorte);
  const origemY = Math.min(Math.max(centroY - alturaDoCorte / 2, 0), altura - alturaDoCorte);

  return { origemX, origemY, larguraDoCorte, alturaDoCorte };
}

async function jpegDoCanvas(canvas: HTMLCanvasElement, limiteBytes: number): Promise<Blob | null> {
  // A saída tem dimensão fixa; reduzir qualidade é a única variável honesta
  // para respeitar o limite de Storage sem subir o original escondido.
  for (let qualidade = 0.9; qualidade >= 0.45; qualidade -= 0.05) {
    const imagem = await new Promise<Blob | null>((resolver) => canvas.toBlob(resolver, 'image/jpeg', qualidade));
    if (imagem && imagem.size <= limiteBytes) return imagem;
  }
  return null;
}

/**
 * Valida e rasteriza uma imagem do perfil para JPEG no tamanho canônico.
 * O recorte usa centro normalizado (0..1) e zoom (1..8); omitido, usa o
 * centro da imagem para manter compatibilidade com os clientes antigos.
 */
export async function prepararImagemDePerfil(
  arquivo: Blob,
  destino: DestinoDaImagemDePerfil,
  recorte: RecorteDaImagem = recorteCentral(),
): Promise<ResultadoDaImagemPreparada> {
  if (!TIPOS_ACEITOS.has(arquivo.type)) return { ok: false, motivo: 'formatoInvalido' };
  if (arquivo.size < 1 || arquivo.size > LIMITE_DE_ENTRADA_BYTES) return { ok: false, motivo: 'grandeDemais' };
  if (!recorteValido(recorte)) return { ok: false, motivo: 'recorteInvalido' };

  let bitmap: ImageBitmap | null = null;
  try {
    bitmap = await createImageBitmap(arquivo);
    const regra = REGRAS[destino];
    if (bitmap.width < regra.larguraMinima || bitmap.height < regra.alturaMinima) {
      return { ok: false, motivo: 'dimensoesInsuficientes' };
    }
    if (bitmap.width * bitmap.height > MAXIMO_DE_PIXELS_DE_ENTRADA) {
      return { ok: false, motivo: 'dimensoesExcedidas' };
    }

    const canvas = document.createElement('canvas');
    canvas.width = regra.larguraDeSaida;
    canvas.height = regra.alturaDeSaida;
    const contexto = canvas.getContext('2d');
    if (!contexto) return { ok: false, motivo: 'falhou' };

    const origem = calcularOrigem(bitmap.width, bitmap.height, regra, recorte);
    contexto.drawImage(
      bitmap,
      origem.origemX,
      origem.origemY,
      origem.larguraDoCorte,
      origem.alturaDoCorte,
      0,
      0,
      canvas.width,
      canvas.height,
    );
    const imagem = await jpegDoCanvas(canvas, regra.limiteDeSaidaBytes);
    return imagem
      ? { ok: true, imagem, dimensoes: { largura: canvas.width, altura: canvas.height } }
      : { ok: false, motivo: 'grandeDemais' };
  } catch {
    return { ok: false, motivo: 'falhou' };
  } finally {
    bitmap?.close?.();
  }
}

/** Compatibilidade do fluxo antigo de avatar, agora com os limites atuais. */
export async function reduzirParaAvatar(arquivo: Blob, lado = 256): Promise<Blob | null> {
  const resultado = await prepararImagemDePerfil(arquivo, 'avatar');
  if (!resultado.ok) return null;
  if (lado === 512) return resultado.imagem;

  try {
    const bitmap = await createImageBitmap(resultado.imagem);
    const canvas = document.createElement('canvas');
    canvas.width = lado;
    canvas.height = lado;
    const contexto = canvas.getContext('2d');
    if (!contexto) return null;
    contexto.drawImage(bitmap, 0, 0, lado, lado);
    bitmap.close?.();
    return await new Promise<Blob | null>((resolver) => canvas.toBlob(resolver, 'image/jpeg', 0.85));
  } catch {
    return null;
  }
}
