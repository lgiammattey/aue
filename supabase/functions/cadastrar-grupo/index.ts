/**
 * cadastrar-grupo — cadastro de grupo externo (WhatsApp, Telegram, TikTok).
 *
 * POST multipart/form-data: nome, descricao, plataforma, link, imagem (opcional).
 *
 * POR QUE EXISTE: a tabela `grupos_externos` não aceita escrita de ninguém pelo
 * cliente. Visitante sem conta também cadastra, e deixar a tabela pública aberta
 * a insert seria deixar qualquer um gravar link de golpe numa página que o
 * Google lê. Esta função é o único caminho de escrita.
 *
 * O QUE ELA FAZ: valida (regras.ts), confere o limite de envios por origem,
 * detecta o tipo da imagem pelos bytes, grava o grupo e, se vier imagem, guarda
 * no bucket `imagens_de_grupos`.
 *
 * O QUE ELA NÃO FAZ: não confere se o convite funciona, não conta membros, não
 * edita grupo existente. Falha nunca vira sucesso: se a imagem não subir, a
 * resposta diz `imagemSalva: false`.
 *
 * Esta função fala JSON. Não serve HTML (o gateway do Supabase não deixa;
 * ver ADR 0003 §10.2 e ADR 0004).
 */
import { createClient } from 'npm:@supabase/supabase-js@2';
import { lerFormulario } from './corpo.ts';
import { detectarImagem, gerarSlug, LIMITES, TIPO_MIME, validarCadastro } from './regras.ts';

const TENTATIVAS_DE_SLUG = 6;

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function resposta(status: number, corpo: Record<string, unknown>): Response {
  return new Response(JSON.stringify(corpo), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json; charset=utf-8' },
  });
}

function erro(status: number, mensagem: string, campo?: string): Response {
  return resposta(status, { ok: false, mensagem, ...(campo ? { campo } : {}) });
}

async function embaralhar(valor: string, sal: string): Promise<string> {
  const bytes = new TextEncoder().encode(`${sal}:${valor}`);
  const hash = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

function origemDaRequisicao(req: Request): string {
  // Na entrada hospedada, o gateway define o IP. Sem ele, os cadastros
  // dividem a mesma cota de origem até o gateway voltar a informá-lo.
  return req.headers.get('cf-connecting-ip')?.trim() || 'desconhecida';
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });
  if (req.method !== 'POST') return erro(405, 'Esse endereço só aceita POST.');

  const url = Deno.env.get('SUPABASE_URL');
  const chaveDeServico = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !chaveDeServico) {
    console.error('cadastrar-grupo: ambiente sem SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY');
    return erro(500, 'O cadastro está fora do ar agora. Tenta de novo daqui a pouco.');
  }

  let form: FormData;
  try {
    const recebido = await lerFormulario(req);
    if (!recebido) return erro(413, 'A imagem passa de 1 MB. Escolha uma menor.', 'imagem');
    form = recebido;
  } catch {
    return erro(400, 'Não consegui ler o envio. Manda o formulário de novo.');
  }

  const validado = validarCadastro({
    nome: form.get('nome'),
    descricao: form.get('descricao'),
    plataforma: form.get('plataforma'),
    link: form.get('link'),
  });
  if (!validado.ok) return erro(422, validado.mensagem, validado.campo);
  const { grupo } = validado;

  // Imagem (opcional): confere tamanho e tipo pelos bytes antes de qualquer gravação.
  let imagem: { bytes: Uint8Array; tipo: 'jpg' | 'png' | 'webp' } | null = null;
  const arquivo = form.get('imagem');
  if (arquivo instanceof File && arquivo.size > 0) {
    if (arquivo.size > LIMITES.imagemBytesMax) {
      return erro(413, 'A imagem passa de 1 MB. Escolha uma menor.', 'imagem');
    }
    const bytes = new Uint8Array(await arquivo.arrayBuffer());
    const tipo = detectarImagem(bytes);
    if (!tipo) return erro(422, 'A imagem precisa ser JPG, PNG ou WebP.', 'imagem');
    imagem = { bytes, tipo };
  }

  const servidor = createClient(url, chaveDeServico, { auth: { persistSession: false } });

  // Limite de envios por origem e no total. A origem é guardada embaralhada.
  const origemHash = await embaralhar(origemDaRequisicao(req), chaveDeServico);

  // Se veio de alguém logado, guarda quem foi. Visitante fica sem autor.
  let criadoPor: string | null = null;
  const portador = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  if (portador) {
    const { data } = await servidor.auth.getUser(portador);
    if (data.user) {
      const { data: perfil } = await servidor.from('perfis').select('id').eq('id', data.user.id).maybeSingle();
      criadoPor = perfil?.id ?? null;
    }
  }

  // Grava. Slug repetido ganha sufixo; link repetido é recusado.
  const slugBase = gerarSlug(grupo.nome);
  let gravado: { id: string; slug: string } | null = null;
  for (let i = 0; i < TENTATIVAS_DE_SLUG && !gravado; i++) {
    const slug = i === 0 ? slugBase : `${slugBase.slice(0, 55)}-${i + 1}`;
    const { data, error } = await servidor
      .rpc('cadastrar_grupo_com_limite', {
        p_origem_hash: origemHash,
        p_slug: slug,
        p_nome: grupo.nome,
        p_descricao: grupo.descricao,
        p_plataforma: grupo.plataforma,
        p_link: grupo.link,
        p_criado_por: criadoPor,
      })
      .single<{ id: string; slug: string }>();

    if (error?.code === 'P1001') {
      return erro(429, 'Você já cadastrou grupos demais por agora. Tenta de novo daqui a uma hora.');
    }
    if (error?.code === 'P1002') {
      return erro(429, 'Chegou cadastro demais de uma vez. Tenta de novo daqui a pouco.');
    }
    if (!error) {
      gravado = data;
      break;
    }
    if (error.code === '23505') {
      if (error.message.includes('grupos_externos_link_unico')) {
        return erro(409, 'Esse grupo já está cadastrado.', 'link');
      }
      if (error.message.includes('grupos_externos_slug_unico')) continue;
    }
    console.error('cadastrar-grupo: falha ao gravar o grupo', error.code);
    return erro(500, 'Não consegui salvar o grupo. Tenta de novo daqui a pouco.');
  }
  if (!gravado) return erro(409, 'Já existe um grupo com esse nome. Muda um pouco o nome e tenta de novo.', 'nome');

  // Imagem depois do grupo: se falhar, o grupo fica e a resposta conta a verdade.
  let imagemSalva = false;
  if (imagem) {
    const caminho = `${gravado.slug}/${crypto.randomUUID()}.${imagem.tipo}`;
    const subida = await servidor.storage
      .from('imagens_de_grupos')
      .upload(caminho, imagem.bytes, { contentType: TIPO_MIME[imagem.tipo], upsert: false });
    if (subida.error) {
      console.error('cadastrar-grupo: falha ao subir a imagem', subida.error);
    } else {
      const { error: erroDoCaminho } = await servidor
        .from('grupos_externos')
        .update({ caminho_da_imagem: caminho })
        .eq('id', gravado.id);
      if (erroDoCaminho) {
        console.error('cadastrar-grupo: imagem subiu mas o caminho não foi gravado', erroDoCaminho);
        await servidor.storage.from('imagens_de_grupos').remove([caminho]);
      } else {
        imagemSalva = true;
      }
    }
  }

  return resposta(201, {
    ok: true,
    grupo: { id: gravado.id, slug: gravado.slug, nome: grupo.nome },
    imagemSalva: imagem ? imagemSalva : null,
  });
});
