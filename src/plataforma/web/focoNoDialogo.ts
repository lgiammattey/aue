/**
 * Mantém o foco dentro de um diálogo modal. A leitura de `document` fica na
 * plataforma web; os componentes só encaminham o evento e a raiz do diálogo.
 *
 * O foco no próprio contêiner (onde os diálogos abrem) ou fora da lista de
 * focáveis conta como borda: Tab vai ao primeiro, Shift+Tab ao último. Lista
 * vazia segura o foco no contêiner, assim o Esc sempre chega ao diálogo.
 */
export function manterFocoNoDialogo(evento: KeyboardEvent, dialogo: HTMLElement | null): void {
  if (evento.key !== 'Tab' || !dialogo) return;
  const focaveis = [...dialogo.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), [href], select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])')];
  const primeiro = focaveis[0];
  const ultimo = focaveis.at(-1);
  if (!primeiro || !ultimo) {
    evento.preventDefault();
    dialogo.focus();
    return;
  }
  const ativo = document.activeElement;
  const dentro = ativo !== dialogo && dialogo.contains(ativo);
  if (evento.shiftKey && (!dentro || ativo === primeiro)) {
    evento.preventDefault();
    ultimo.focus();
  } else if (!evento.shiftKey && (!dentro || ativo === ultimo)) {
    evento.preventDefault();
    primeiro.focus();
  }
}
