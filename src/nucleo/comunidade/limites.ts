/**
 * Limites de texto das conversas. Mesma conta do banco.
 *
 * Valem os números das RPCs (`publicar_causo`: 1 a 1000; `criar_comentario`:
 * 1 a 500) e a contagem do Postgres: `char_length` conta caracteres (code
 * points), não unidades UTF-16. Um emoji conta 1 lá; `string.length` do
 * JavaScript contaria 2. Contar do jeito errado deixa a tela aceitar o que o
 * servidor recusa, ou recusar o que ele aceitaria.
 */

export const LIMITE_CAUSO = 1000;
export const LIMITE_COMENTARIO = 500;

/** Fórum de comunidades (RPCs `criar_topico`, `responder_topico`, `denunciar_*`; ADR 0010). */
export const LIMITE_TITULO_TOPICO = 120;
export const LIMITE_TEXTO_TOPICO = 2000;
export const LIMITE_RESPOSTA = 1000;
export const LIMITE_MOTIVO_DE_DENUNCIA = 500;

/** Caracteres como o `char_length` do Postgres conta. */
export function contarCaracteres(texto: string): number {
  let total = 0;
  for (const _ of texto) total += 1;
  return total;
}

/** Quanto ainda cabe; negativo quando passou. Espaços nas pontas não contam (o servidor faz `btrim`). */
export function caracteresRestantes(texto: string, limite: number): number {
  return limite - contarCaracteres(texto.trim());
}

export function cabeNoLimite(texto: string, limite: number): boolean {
  return caracteresRestantes(texto, limite) >= 0;
}
