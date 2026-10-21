/**
 * Quanto cabe acima e abaixo de um elemento na parte visível da tela. A leitura
 * de `window` fica aqui; os componentes só decidem de que lado abrir.
 */
export function espacoEmVolta(elemento: Element): { readonly acima: number; readonly abaixo: number } {
  const caixa = elemento.getBoundingClientRect();
  const altura = window.visualViewport?.height ?? window.innerHeight;
  return { acima: caixa.top, abaixo: altura - caixa.bottom };
}
