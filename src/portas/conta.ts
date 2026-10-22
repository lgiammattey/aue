/**
 * A porta da conta (cadastro, entrada e saída).
 *
 * A identidade do Auê nasce anônima. Cadastrar com e-mail e senha **promove**
 * essa mesma identidade — o histórico fica — em vez de abrir uma segunda conta.
 */

export interface EstadoDaConta {
  /** Há alguém logado, anônimo ou não. */
  readonly temSessao: boolean;
  /** A sessão ainda é a anônima do aparelho. */
  readonly anonima: boolean;
  /** Só uma conta promovida participa de perfil, Bonde e comunidades. */
  readonly podeParticiparSocialmente?: boolean;
  /** Conta promovida que ainda precisa concluir apelido e @ antes do Bonde. */
  readonly perfilSocialPendente?: boolean;
  readonly email?: string;
  /** Id da conta (uid). O rascunho do fórum é guardado por ele: outra conta no mesmo navegador não o enxerga. */
  readonly id?: string;
}

export type ResultadoDaConta =
  | { readonly ok: true; readonly aviso?: 'confirmeNoEmail' }
  | { readonly ok: false; readonly motivo: 'emailInvalido' }
  | { readonly ok: false; readonly motivo: 'senhaFraca' }
  | { readonly ok: false; readonly motivo: 'emailEmUso' }
  | { readonly ok: false; readonly motivo: 'handleEmUso' }
  | { readonly ok: false; readonly motivo: 'handleInvalido' }
  | { readonly ok: false; readonly motivo: 'credenciaisInvalidas' }
  | { readonly ok: false; readonly motivo: 'identidadeXEmUso' }
  | { readonly ok: false; readonly motivo: 'semServidor' }
  | { readonly ok: false; readonly motivo: 'falhou'; readonly detalhe: string };

export interface PedidoDeCadastro {
  readonly email: string;
  readonly senha: string;
  readonly apelido: string;
  /** O @ escolhido (3 a 20: minúsculas, números e _). Sem ele, o banco gera um. */
  readonly handle?: string;
}

export interface PortaDeConta {
  estado(): Promise<EstadoDaConta>;
  cadastrar(pedido: PedidoDeCadastro): Promise<ResultadoDaConta>;
  entrar(email: string, senha: string): Promise<ResultadoDaConta>;
  /** Entra na conta já associada ao X. */
  entrarComX?(): Promise<ResultadoDaConta>;
  /** Vincula o X à sessão anônima atual, sem trocar o uid dela. */
  criarComX?(): Promise<ResultadoDaConta>;
  /** Manda o link de redefinição. Responde igual exista o e-mail ou não. */
  enviarLinkDeRedefinicao(email: string): Promise<ResultadoDaConta>;
  /** Vale só depois de abrir o link do e-mail. */
  redefinirSenha(novaSenha: string): Promise<ResultadoDaConta>;
  sair(): Promise<boolean>;
}

/** Mesma regra do banco para o @. */
export function handleValido(handle: string): boolean {
  return /^[a-z0-9_]{3,20}$/.test(handle);
}

/** Sugestão de @ a partir do apelido: sem acento, minúsculo, só [a-z0-9_]. */
export function sugerirHandle(apelido: string): string {
  const base = apelido
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/^@/, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 20);
  return base;
}

/** Regras que valem antes de ir ao servidor. A senha mínima espelha a do Supabase Auth. */
export const SENHA_MINIMA = 8;

export function emailParece(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
}
