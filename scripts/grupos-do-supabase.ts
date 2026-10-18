import type { GrupoParaPagina } from '../src/nucleo/grupos/paginaEstatica.ts';

interface Linha {
  slug: string;
  nome: string;
  descricao: string | null;
  tipo_de_plataforma: GrupoParaPagina['plataforma'];
  link_do_convite: string;
  caminho_da_imagem: string | null;
}

/** As credenciais do build, ou `null` quando não há nada de verdade para ler. */
export function credenciaisDoBuild(): { url: string; chave: string } | null {
  const url = process.env.VITE_SUPABASE_URL ?? '';
  const chave = process.env.VITE_SUPABASE_ANON_KEY ?? '';
  if (!url || !chave) return null;
  if (url.includes('exemplo.supabase.co') || url.includes('aue-dev.supabase.co')) return null;
  if (chave.includes('chave-ficticia') || chave.includes('chave-ausente')) return null;
  return { url: url.replace(/\/$/, ''), chave };
}

/**
 * Lê os grupos visíveis com a chave pública, a mesma do navegador, passando
 * pela RLS. `null` quando a leitura falhou: quem chama decide o que fazer.
 */
export async function lerGruposVisiveis(url: string, chave: string): Promise<GrupoParaPagina[] | null> {
  try {
    const resposta = await fetch(
      `${url}/rest/v1/grupos_externos?select=slug,nome,descricao,tipo_de_plataforma,link_do_convite,caminho_da_imagem&esta_escondido=eq.false&order=criado_em.asc&limit=1000`,
      { headers: { apikey: chave, Authorization: `Bearer ${chave}` }, signal: AbortSignal.timeout(15000) },
    );
    if (!resposta.ok) {
      console.warn(`grupos: o Supabase respondeu ${resposta.status}`);
      return null;
    }
    const linhas = (await resposta.json()) as Linha[];
    return linhas.map((l) => ({
      slug: l.slug,
      nome: l.nome,
      descricao: l.descricao ?? '',
      plataforma: l.tipo_de_plataforma,
      link: l.link_do_convite,
      imagemUrl: l.caminho_da_imagem ? `${url}/storage/v1/object/public/imagens_de_grupos/${l.caminho_da_imagem}` : null,
    }));
  } catch (erro) {
    console.warn('grupos: não consegui ler o Supabase', erro);
    return null;
  }
}
