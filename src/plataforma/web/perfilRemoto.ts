import { configuracaoAusente, supabase } from '../../db/supabase';
import { garantirSessao } from '../../shared/auth/sessaoAnonima';
import type {
  DadosDoPerfil,
  PerfilPublico,
  PortaDePerfil,
  ResultadoDaEdicao,
} from '../../portas/perfil';

/** Linha de `obter_perfil_publico` (20261018000004). */
interface LinhaDePerfil {
  id: string;
  handle: string;
  apelido: string | null;
  url_do_avatar: string | null;
  bio: string | null;
  cidade: string | null;
  titulo: string | null;
  e_fundador: boolean;
  criado_em: string;
  total_causos: number;
  melhor_nota: number | null;
  total_seguidores: number;
  total_seguindo: number;
  eu_sigo: boolean;
  sou_eu: boolean;
}

export function traduzirPerfil(l: LinhaDePerfil): PerfilPublico {
  return {
    id: l.id,
    handle: l.handle,
    apelido: l.apelido?.trim() || 'Arrotador',
    avatarUrl: l.url_do_avatar ?? undefined,
    bio: l.bio ?? undefined,
    cidade: l.cidade ?? undefined,
    titulo: l.titulo ?? undefined,
    fundador: Boolean(l.e_fundador),
    criadoEm: l.criado_em,
    totalCausos: Number(l.total_causos),
    melhorNota: l.melhor_nota === null ? undefined : Number(l.melhor_nota),
    totalSeguidores: Number(l.total_seguidores),
    totalSeguindo: Number(l.total_seguindo),
    euSigo: Boolean(l.eu_sigo),
    souEu: Boolean(l.sou_eu),
  };
}

/** Adaptador web da porta de perfil. */
export function criarPerfilRemoto(): PortaDePerfil {
  async function porHandle(handle: string): Promise<PerfilPublico | null> {
    const { data, error } = await supabase.rpc('obter_perfil_publico', { p_handle: handle });
    if (error) throw error;
    const linha = ((data ?? []) as LinhaDePerfil[])[0];
    return linha ? traduzirPerfil(linha) : null;
  }

  return {
    async obterPerfil(handle: string): Promise<PerfilPublico | null> {
      if (configuracaoAusente) return null;
      try {
        await garantirSessao();
        return await porHandle(handle);
      } catch (erro) {
        console.error('Falha ao ler o perfil', erro);
        return null;
      }
    },

    async obterMeuPerfil(): Promise<PerfilPublico | null> {
      if (configuracaoAusente) return null;
      try {
        const sessao = await garantirSessao();
        if (!sessao?.user?.id) return null;
        const { data, error } = await supabase
          .from('perfis')
          .select('handle')
          .eq('id', sessao.user.id)
          .single();
        if (error || !data?.handle) return null;
        return await porHandle(data.handle as string);
      } catch (erro) {
        console.error('Falha ao ler o meu perfil', erro);
        return null;
      }
    },

    async alternarSeguir(perfilId: string) {
      if (configuracaoAusente) return { ok: false, seguindo: false };
      try {
        const sessao = await garantirSessao();
        if (!sessao?.user?.id) return { ok: false, seguindo: false };
        const { data, error } = await supabase.rpc('alternar_seguir', { p_usuario_alvo_id: perfilId });
        if (error) throw error;
        return { ok: true, seguindo: Boolean(data) };
      } catch (erro) {
        console.error('Falha ao seguir', erro);
        return { ok: false, seguindo: false };
      }
    },

    async atualizarMeuPerfil(dados: DadosDoPerfil): Promise<ResultadoDaEdicao> {
      if (configuracaoAusente) return { ok: false, motivo: 'semRede' };
      try {
        const sessao = await garantirSessao();
        if (!sessao?.user?.id) return { ok: false, motivo: 'semConta' };
        const { error } = await supabase.rpc('atualizar_meu_perfil', {
          p_apelido: dados.apelido ?? null,
          p_handle: dados.handle ?? null,
          p_bio: dados.bio ?? null,
          p_cidade: dados.cidade ?? null,
        });
        if (error) {
          if ((error as { code?: string }).code === '23505') return { ok: false, motivo: 'handleEmUso' };
          return { ok: false, motivo: 'invalido', detalhe: error.message };
        }
        const meu = await this.obterMeuPerfil();
        return meu ? { ok: true, perfil: meu } : { ok: false, motivo: 'semRede' };
      } catch (erro) {
        console.error('Falha ao salvar o perfil', erro);
        return { ok: false, motivo: 'semRede' };
      }
    },
  };
}
