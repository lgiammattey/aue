import { configuracaoAusente, supabase } from '../../db/supabase';
import { garantirSessao } from '../../shared/auth/sessaoAnonima';
import { reduzirParaAvatar } from './imagem';
import type {
  Conexao,
  DadosDoPerfil,
  PerfilPublico,
  PortaDePerfil,
  ResultadoDaEdicao,
  ResultadoDaFoto,
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
  instagram: string | null;
  tiktok: string | null;
  youtube: string | null;
  twitter: string | null;
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
    instagram: l.instagram ?? undefined,
    tiktok: l.tiktok ?? undefined,
    youtube: l.youtube ?? undefined,
    twitter: l.twitter ?? undefined,
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
          p_instagram: dados.instagram ?? null,
          p_tiktok: dados.tiktok ?? null,
          p_youtube: dados.youtube ?? null,
          p_twitter: dados.twitter ?? null,
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

    async enviarFoto(imagem: Blob): Promise<ResultadoDaFoto> {
      if (configuracaoAusente) return { ok: false, motivo: 'falhou' };
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(imagem.type)) {
        return { ok: false, motivo: 'formatoInvalido' };
      }
      if (imagem.size > 15 * 1024 * 1024) return { ok: false, motivo: 'grandeDemais' };
      try {
        const sessao = await garantirSessao();
        const uid = sessao?.user?.id;
        if (!uid) return { ok: false, motivo: 'semConta' };

        const reduzida = await reduzirParaAvatar(imagem);
        if (!reduzida) return { ok: false, motivo: 'falhou' };

        const caminho = `${uid}/avatar.jpg`;
        const { error: erroDoUpload } = await supabase.storage
          .from('avatars')
          .upload(caminho, reduzida, { upsert: true, contentType: 'image/jpeg' });
        if (erroDoUpload) throw erroDoUpload;

        // O nome é fixo; o `?v=` quebra o cache do navegador e da CDN.
        const { data } = supabase.storage.from('avatars').getPublicUrl(caminho);
        const url = `${data.publicUrl}?v=${Date.now()}`;

        const { error } = await supabase.rpc('atualizar_meu_perfil', { p_url_do_avatar: url });
        if (error) throw error;

        const meu = await this.obterMeuPerfil();
        return meu ? { ok: true, perfil: meu } : { ok: false, motivo: 'falhou' };
      } catch (erro) {
        console.error('Falha ao trocar a foto', erro);
        return { ok: false, motivo: 'falhou' };
      }
    },

    async removerFoto(): Promise<ResultadoDaFoto> {
      if (configuracaoAusente) return { ok: false, motivo: 'falhou' };
      try {
        const sessao = await garantirSessao();
        const uid = sessao?.user?.id;
        if (!uid) return { ok: false, motivo: 'semConta' };
        const { error } = await supabase.rpc('atualizar_meu_perfil', { p_remover_avatar: true });
        if (error) throw error;
        // O arquivo some do bucket também; se não sair, a foto já não aparece.
        await supabase.storage.from('avatars').remove([`${uid}/avatar.jpg`]);
        const meu = await this.obterMeuPerfil();
        return meu ? { ok: true, perfil: meu } : { ok: false, motivo: 'falhou' };
      } catch (erro) {
        console.error('Falha ao remover a foto', erro);
        return { ok: false, motivo: 'falhou' };
      }
    },

    async listarConexoes(handle: string, tipo: 'seguidores' | 'seguindo'): Promise<readonly Conexao[]> {
      if (configuracaoAusente) return [];
      try {
        await garantirSessao();
        const { data, error } = await supabase.rpc('listar_conexoes_do_perfil', {
          p_handle: handle,
          p_tipo: tipo,
          p_limite: 100,
        });
        if (error) throw error;
        return ((data ?? []) as Array<{
          id: string;
          handle: string;
          apelido: string | null;
          url_do_avatar: string | null;
          eu_sigo: boolean;
        }>).map((c) => ({
          id: c.id,
          handle: c.handle,
          apelido: c.apelido?.trim() || 'Arrotador',
          avatarUrl: c.url_do_avatar ?? undefined,
          euSigo: Boolean(c.eu_sigo),
        }));
      } catch (erro) {
        console.error('Falha ao listar conexões', erro);
        return [];
      }
    },
  };
}
