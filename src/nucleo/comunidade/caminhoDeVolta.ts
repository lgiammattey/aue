/**
 * Para onde voltar depois de entrar na conta.
 *
 * Quem abre um link de conversa sem conta e é mandado ao login precisa cair de
 * volta no mesmo lugar. O destino viaja na URL (`/login?volta=...`), então ele
 * vem de fora e não é confiável: só vale caminho interno do próprio site.
 * Qualquer coisa que possa levar a outro domínio vira `null`.
 */

const TAMANHO_MAXIMO = 500;

export function caminhoDeVoltaSeguro(bruto: string | null | undefined): string | null {
  if (!bruto || bruto.length > TAMANHO_MAXIMO) return null;
  // Tem que começar com uma única barra: "//x.com" e "/\x.com" saem do site.
  if (!bruto.startsWith('/') || bruto.startsWith('//') || bruto.startsWith('/\\')) return null;
  // Sem barra invertida nem caractere de controle em qualquer posição.
  for (const letra of bruto) {
    const codigo = letra.charCodeAt(0);
    if (letra === '\\' || codigo < 0x20 || codigo === 0x7f) return null;
  }
  // Não volta para as telas de entrada: viraria um laço.
  if (/^\/login(?:[/?#]|$)/.test(bruto)) return null;
  return bruto;
}

/** `/login?modo=cadastro&volta=<onde a pessoa estava>`. */
export function enderecoDoLoginComVolta(caminhoAtual: string, modo: 'cadastro' | 'entrar' = 'cadastro'): string {
  const volta = caminhoDeVoltaSeguro(caminhoAtual);
  const parametros = new URLSearchParams();
  if (modo === 'cadastro') parametros.set('modo', 'cadastro');
  if (volta) parametros.set('volta', volta);
  const consulta = parametros.toString();
  return consulta ? `/login?${consulta}` : '/login';
}
