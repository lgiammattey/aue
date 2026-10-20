/**
 * Mantém o foco dentro de um diálogo modal. A leitura de `document` fica na
 * plataforma web; os componentes só encaminham o evento e a raiz do diálogo.
 */
export function manterFocoNoDialogo(evento: KeyboardEvent, dialogo: HTMLElement | null): void {
  if (evento.key !== 'Tab' || !dialogo) return;
  const focaveis = [...dialogo.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), [href], select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])')];
  const primeiro = focaveis[0];
  const ultimo = focaveis.at(-1);
  if (!primeiro || !ultimo) return;
  if (evento.shiftKey && document.activeElement === primeiro) {
    evento.preventDefault();
    ultimo.focus();
  } else if (!evento.shiftKey && document.activeElement === ultimo) {
    evento.preventDefault();
    primeiro.focus();
  }
}
