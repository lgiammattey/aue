import type { ComunidadeParaPaginaEstatica } from '../src/nucleo/comunidades/paginaEstatica.ts';

interface LinhaDaComunidade {
  slug: string;
  nome: string;
  descricao: string | null;
}

/**
 * Lê a RPC liberada a visitante. A tabela `grupos` continua fora do build:
 * RLS e os critérios de visibilidade seguem concentrados no servidor.
 */
export async function lerComunidadesPublicas(
  url: string,
  chave: string,
): Promise<ComunidadeParaPaginaEstatica[] | null> {
  try {
    const resposta = await fetch(`${url}/rest/v1/rpc/listar_comunidades_do_forum`, {
      method: 'POST',
      headers: {
        apikey: chave,
        Authorization: `Bearer ${chave}`,
        'Content-Type': 'application/json',
      },
      body: '{}',
      signal: AbortSignal.timeout(15_000),
    });
    if (!resposta.ok) {
      console.warn(`comunidades: o Supabase respondeu ${resposta.status}`);
      return null;
    }

    const linhas = (await resposta.json()) as LinhaDaComunidade[];
    return linhas.map((linha) => ({
      slug: linha.slug,
      nome: linha.nome,
      descricao: linha.descricao ?? '',
    }));
  } catch (erro) {
    console.warn('comunidades: não consegui ler o Supabase', erro);
    return null;
  }
}
