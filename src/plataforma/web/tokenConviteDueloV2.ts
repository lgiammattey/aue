/** O segredo fica no fragmento do navegador, que não é enviado no pedido HTTP. */
export function lerTokenConviteDueloV2(): string | null {
  const parametros = new URLSearchParams(window.location.hash.slice(1));
  const valores = parametros.getAll('t');
  return valores.length === 1 && /^[0-9a-f]{64}$/.test(valores[0]) ? valores[0] : null;
}
