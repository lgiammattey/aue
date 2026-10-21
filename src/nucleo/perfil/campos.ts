/**
 * Regras dos campos do perfil, iguais às do banco (RPC `atualizar_meu_perfil` e CHECKs de `perfis`).
 * A tela valida antes de enviar para dizer o que está errado com as palavras da pessoa;
 * o banco continua sendo quem garante.
 */
export const LIMITES_DO_PERFIL = {
  apelidoMin: 2,
  apelidoMax: 30,
  handleMin: 3,
  handleMax: 20,
  bioMax: 280,
  cidadeMax: 60,
} as const;

/** Mesma lista do RPC. */
export const HANDLES_RESERVADOS: readonly string[] = ['aue', 'admin', 'suporte', 'moderacao', 'oficial', 'perfil', 'feed', 'arena'];

const FORMATO_DO_HANDLE = /^[a-z0-9_]+$/;

export type ResultadoDoCampo = { readonly ok: true } | { readonly ok: false; readonly mensagem: string };

const ok: ResultadoDoCampo = { ok: true };
const erro = (mensagem: string): ResultadoDoCampo => ({ ok: false, mensagem });

export function validarApelido(valor: string): ResultadoDoCampo {
  const n = valor.trim().length;
  if (n < LIMITES_DO_PERFIL.apelidoMin || n > LIMITES_DO_PERFIL.apelidoMax) {
    return erro(`O nome de exibição precisa ter de ${LIMITES_DO_PERFIL.apelidoMin} a ${LIMITES_DO_PERFIL.apelidoMax} caracteres.`);
  }
  return ok;
}

/** Recebe o @ como a pessoa digitou; tira o `@` e põe em minúsculo antes de olhar. */
export function validarHandle(valor: string): ResultadoDoCampo {
  const h = valor.trim().replace(/^@/, '').toLowerCase();
  if (h.length < LIMITES_DO_PERFIL.handleMin || h.length > LIMITES_DO_PERFIL.handleMax || !FORMATO_DO_HANDLE.test(h)) {
    return erro(`O @ precisa ter de ${LIMITES_DO_PERFIL.handleMin} a ${LIMITES_DO_PERFIL.handleMax} letras minúsculas sem acento, números ou _.`);
  }
  if (HANDLES_RESERVADOS.includes(h)) return erro('Esse @ é reservado. Escolhe outro.');
  return ok;
}

export function validarBio(valor: string): ResultadoDoCampo {
  return valor.trim().length > LIMITES_DO_PERFIL.bioMax ? erro(`A bio tem até ${LIMITES_DO_PERFIL.bioMax} caracteres.`) : ok;
}

export function validarCidade(valor: string): ResultadoDoCampo {
  return valor.trim().length > LIMITES_DO_PERFIL.cidadeMax ? erro(`A cidade tem até ${LIMITES_DO_PERFIL.cidadeMax} caracteres.`) : ok;
}

/** Primeira mensagem de erro dos campos, na ordem em que aparecem na tela; `null` se tudo certo. */
export function primeiroErroDoPerfil(campos: {
  readonly apelido?: string;
  readonly handle?: string;
  readonly bio?: string;
  readonly cidade?: string;
}): string | null {
  const resultados: ResultadoDoCampo[] = [];
  if (campos.apelido !== undefined) resultados.push(validarApelido(campos.apelido));
  if (campos.handle !== undefined) resultados.push(validarHandle(campos.handle));
  if (campos.bio !== undefined) resultados.push(validarBio(campos.bio));
  if (campos.cidade !== undefined) resultados.push(validarCidade(campos.cidade));
  const falha = resultados.find((r) => !r.ok);
  return falha && !falha.ok ? falha.mensagem : null;
}
