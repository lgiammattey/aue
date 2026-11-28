const CHAVE_MAIORIDADE = 'aue.maioridade.v1';

/** Lê a confirmação de maioridade guardada no aparelho. */
export function maioridadeConfirmada(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.localStorage.getItem(CHAVE_MAIORIDADE) === '1';
  } catch {
    return false;
  }
}

/** Grava no aparelho que a pessoa confirmou ter 18 anos ou mais. */
export function confirmarMaioridade(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(CHAVE_MAIORIDADE, '1');
    window.dispatchEvent(new Event('aue:maioridade-confirmada'));
  } catch {
    /* Ignora falha de storage em modo privado restrito. */
  }
}
