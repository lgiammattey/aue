/**
 * A trava de projeto: o backfill só escreve num Supabase que a pessoa nomeou
 * duas vezes (`--projeto` e `AUE_CONFIRMA_PROJETO`) e que bate com a URL.
 */

export interface EntradaDaConfirmacao {
  readonly projeto: string | undefined;
  readonly confirma: string | undefined;
  readonly url: string | undefined;
  readonly chave: string | undefined;
}

export type ResultadoDaConfirmacao =
  | { readonly ok: true; readonly url: string; readonly chave: string; readonly projeto: string }
  | { readonly ok: false; readonly motivo: string };

export function confirmarProjeto(e: EntradaDaConfirmacao): ResultadoDaConfirmacao {
  if (!e.projeto) return { ok: false, motivo: 'faltou --projeto <ref do projeto Supabase>' };
  if (!/^[a-z0-9]{10,30}$/.test(e.projeto)) return { ok: false, motivo: '--projeto não parece um ref do Supabase' };
  if (e.confirma !== e.projeto) {
    return { ok: false, motivo: 'AUE_CONFIRMA_PROJETO precisa ser igual ao --projeto (confirmação dupla)' };
  }
  if (!e.url) return { ok: false, motivo: 'faltou AUE_SUPABASE_URL' };
  let host: string;
  try {
    host = new URL(e.url).host;
  } catch {
    return { ok: false, motivo: 'AUE_SUPABASE_URL não é uma URL' };
  }
  if (host !== `${e.projeto}.supabase.co`) {
    return { ok: false, motivo: `AUE_SUPABASE_URL (${host}) não é o projeto ${e.projeto}` };
  }
  if (!e.chave) return { ok: false, motivo: 'faltou AUE_SERVICE_ROLE_KEY' };
  return { ok: true, url: `https://${host}`, chave: e.chave, projeto: e.projeto };
}
