/** Handles escritos no corpo de uma publicação. O banco confirma quem existe. */
export function extrairHandlesMencionados(texto: string): readonly string[] {
  const encontrados = texto.toLowerCase().matchAll(/(?:^|[^a-z0-9_])@([a-z0-9_]{3,20})/g);
  return [...new Set([...encontrados].map((resultado) => resultado[1]))];
}
