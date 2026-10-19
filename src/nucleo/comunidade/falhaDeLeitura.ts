/**
 * A leitura falhou no servidor. Diferente de "não há nada": quem recebe deve
 * mostrar erro com nova tentativa, nunca uma lista vazia.
 */
export class FalhaDeLeitura extends Error {
  readonly recurso: string;
  readonly causa?: unknown;

  constructor(recurso: string, causa?: unknown) {
    super(`Falha ao ler ${recurso}`);
    this.name = 'FalhaDeLeitura';
    this.recurso = recurso;
    this.causa = causa;
  }
}
