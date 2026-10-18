import { configuracaoAusente, supabase } from '../../db/supabase';
import { garantirSessao } from '../../shared/auth/sessaoAnonima';
import type {
  GrupoExterno,
  PedidoDeCadastroDeGrupo,
  PortaDeGrupos,
  ResultadoDoCadastroDeGrupo,
} from '../../portas/grupos';

const TEMPO_DA_LEITURA_MS = 6000;
const TEMPO_DO_CADASTRO_MS = 20000;
const BUCKET_DAS_IMAGENS = 'imagens_de_grupos';

interface LinhaDoGrupo {
  id: string;
  slug: string;
  nome: string;
  descricao: string | null;
  tipo_de_plataforma: GrupoExterno['plataforma'];
  link_do_convite: string;
  caminho_da_imagem: string | null;
  e_oficial: boolean;
}

function servidorConfigurado(): boolean {
  if (configuracaoAusente) return false;
  const url = import.meta.env.VITE_SUPABASE_URL || '';
  const chave = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
  if (url.includes('aue-dev.supabase.co') || url.includes('exemplo.supabase.co')) return false;
  if (chave.includes('chave-ficticia') || chave.includes('chave-ausente')) return false;
  return true;
}

function comTempo<T>(promessa: PromiseLike<T>, ms: number, rotulo: string): Promise<T> {
  let relogio: ReturnType<typeof setTimeout>;
  const limite = new Promise<never>((_, rejeitar) => {
    relogio = setTimeout(() => rejeitar(new Error(`Tempo esgotado: ${rotulo}`)), ms);
  });
  return Promise.race([Promise.resolve(promessa), limite]).finally(() => clearTimeout(relogio));
}

function traduzirLinha(l: LinhaDoGrupo): GrupoExterno {
  return {
    id: l.id,
    slug: l.slug,
    nome: l.nome,
    descricao: l.descricao ?? '',
    plataforma: l.tipo_de_plataforma,
    linkDoConvite: l.link_do_convite,
    imagemUrl: l.caminho_da_imagem
      ? supabase.storage.from(BUCKET_DAS_IMAGENS).getPublicUrl(l.caminho_da_imagem).data.publicUrl
      : null,
    oficial: l.e_oficial,
  };
}

const CAMPOS = ['nome', 'descricao', 'plataforma', 'link', 'imagem'] as const;

/** A função responde JSON `{ ok, mensagem, campo }`, também nos erros. */
async function lerErroDaFuncao(erro: unknown): Promise<ResultadoDoCadastroDeGrupo> {
  const contexto = (erro as { context?: unknown } | null)?.context;
  if (contexto instanceof Response) {
    try {
      const corpo = (await contexto.json()) as { mensagem?: string; campo?: string };
      const mensagem = corpo.mensagem ?? 'Não consegui cadastrar o grupo. Tenta de novo.';
      const campo = CAMPOS.find((c) => c === corpo.campo);
      if (contexto.status === 409) return { ok: false, motivo: 'repetido', mensagem, campo };
      if (contexto.status === 429) return { ok: false, motivo: 'limite', mensagem };
      if (contexto.status === 413 || contexto.status === 422) return { ok: false, motivo: 'invalido', mensagem, campo };
      return { ok: false, motivo: 'falhou', mensagem };
    } catch {
      // corpo que não é JSON cai no genérico abaixo
    }
  }
  return { ok: false, motivo: 'falhou', mensagem: 'Não consegui cadastrar o grupo. Tenta de novo.' };
}

export function criarGruposWeb(opcoes: { forcarOffline?: boolean } = {}): PortaDeGrupos {
  const usaServidor = (): boolean => !opcoes.forcarOffline && servidorConfigurado();

  return {
    async listarGrupos() {
      if (!usaServidor()) return { ok: false, motivo: 'semServidor' };
      try {
        const { data, error } = await comTempo(
          supabase
            .from('grupos_externos')
            .select('id, slug, nome, descricao, tipo_de_plataforma, link_do_convite, caminho_da_imagem, e_oficial')
            .order('e_oficial', { ascending: false })
            .order('criado_em', { ascending: false })
            .limit(100),
          TEMPO_DA_LEITURA_MS,
          'grupos',
        );
        if (error) throw error;
        return { ok: true, grupos: ((data ?? []) as LinhaDoGrupo[]).map(traduzirLinha) };
      } catch (erro) {
        console.error('Falha ao ler os grupos', erro);
        return { ok: false, motivo: 'falhou' };
      }
    },

    async cadastrarGrupo(pedido: PedidoDeCadastroDeGrupo) {
      if (!usaServidor()) {
        return {
          ok: false,
          motivo: 'semServidor',
          mensagem: 'O cadastro de grupos precisa do servidor do Auê, que não está configurado aqui.',
        };
      }
      try {
        // Quem já tem sessão vai identificado; visitante vai sem autor.
        await garantirSessao();
        const corpo = new FormData();
        corpo.set('nome', pedido.nome);
        corpo.set('descricao', pedido.descricao);
        corpo.set('plataforma', pedido.plataforma);
        corpo.set('link', pedido.link);
        if (pedido.imagem) corpo.set('imagem', pedido.imagem);

        const { data, error } = await comTempo(
          supabase.functions.invoke('cadastrar-grupo', { body: corpo }),
          TEMPO_DO_CADASTRO_MS,
          'cadastro de grupo',
        );
        if (error) return await lerErroDaFuncao(error);

        const resposta = data as { ok?: boolean; grupo?: { slug: string }; imagemSalva?: boolean | null } | null;
        if (!resposta?.ok || !resposta.grupo) {
          return { ok: false, motivo: 'falhou', mensagem: 'Não consegui cadastrar o grupo. Tenta de novo.' };
        }
        return { ok: true, slug: resposta.grupo.slug, imagemSalva: resposta.imagemSalva ?? null };
      } catch (erro) {
        console.error('Falha ao cadastrar o grupo', erro);
        return { ok: false, motivo: 'falhou', mensagem: 'Não consegui cadastrar o grupo. Tenta de novo.' };
      }
    },

    async denunciarGrupo(grupoId: string, motivo: string) {
      if (!usaServidor()) return 'semServidor';
      try {
        const sessao = await garantirSessao();
        if (!sessao?.user?.id) return 'falhou';
        const { error } = await comTempo(
          supabase.from('denuncias_de_grupos').insert({
            grupo_id: grupoId,
            usuario_id: sessao.user.id,
            motivo: motivo.trim().length >= 3 ? motivo.trim() : 'Conteúdo impróprio',
          }),
          TEMPO_DO_CADASTRO_MS,
          'denúncia de grupo',
        );
        // 23505: já denunciei este grupo. Conta como feito, a tela não repete.
        if (error && error.code !== '23505') throw error;
        return 'registrada';
      } catch (erro) {
        console.error('Falha ao denunciar o grupo', erro);
        return 'falhou';
      }
    },
  };
}
