import { configuracaoAusente, supabase } from '../../db/supabase';
import { garantirSessao } from '../../shared/auth/sessaoAnonima';
import type {
  AudioDeArquivoDoPerfil,
  ArrotoDoPerfil,
  PortaDeArrotosDoPerfil,
  RascunhoDeArrotoDoPerfil,
  ResultadoDoPreparoDeArquivoDeAudio,
  ResultadoDaPublicacaoDeArroto,
  ResultadoDoPreparoDeArroto,
} from '../../portas/arrotosDoPerfil';

const BUCKET_DE_ARROTOS_DO_PERFIL = 'arrotos_de_perfil';
const TIPOS_DE_AUDIO = ['audio/webm', 'audio/mp4', 'audio/ogg', 'audio/mpeg'];
const LIMITE_DO_AUDIO = 12 * 1024 * 1024;
const DURACAO_MAXIMA = 90;
const DURACAO_MAXIMA_DO_ARQUIVO_MS = 30_000;
const SEGUNDOS_DA_URL_ASSINADA = 60;

function normalizarMimeDoAudio(mime: string): string {
  return mime.trim().toLowerCase().split(';', 1)[0] ?? '';
}

function normalizarAudioParaEnvio(audio: Blob): Blob | null {
  const mime = normalizarMimeDoAudio(audio.type);
  if (!TIPOS_DE_AUDIO.includes(mime)) return null;
  return audio.type === mime ? audio : new Blob([audio], { type: mime });
}

/**
 * Lê a duração do próprio arquivo por metadados. Não há fallback por tamanho:
 * um arquivo cuja duração não pode ser aberta não é seguro para publicar.
 */
function lerDuracaoDoArquivo(arquivo: Blob): Promise<number | null> {
  if (typeof Audio === 'undefined' || typeof URL === 'undefined' || !URL.createObjectURL) {
    return Promise.resolve(null);
  }

  return new Promise((resolver) => {
    const url = URL.createObjectURL(arquivo);
    const audio = new Audio();
    let encerrado = false;
    const finalizar = (duracao: number | null) => {
      if (encerrado) return;
      encerrado = true;
      globalThis.clearTimeout(tempoLimite);
      audio.removeAttribute('src');
      audio.load();
      URL.revokeObjectURL(url);
      resolver(duracao);
    };
    const tempoLimite = globalThis.setTimeout(() => finalizar(null), 8_000);

    audio.preload = 'metadata';
    audio.onloadedmetadata = () => finalizar(Number.isFinite(audio.duration) && audio.duration > 0 ? audio.duration : null);
    audio.onerror = () => finalizar(null);
    audio.src = url;
  });
}

interface LinhaDeArroto {
  id: string;
  perfil_id: string;
  autor_id: string;
  autor_handle: string;
  autor_apelido: string;
  caminho_do_audio: string;
  duracao_segundos: number;
  criado_em: string;
  meu: boolean;
  posso_ocultar: boolean;
}

function traduzirArroto(linha: LinhaDeArroto): ArrotoDoPerfil {
  return {
    id: linha.id,
    perfilId: linha.perfil_id,
    autorId: linha.autor_id,
    autorHandle: linha.autor_handle,
    autorApelido: linha.autor_apelido,
    duracaoSegundos: Number(linha.duracao_segundos),
    criadoEm: linha.criado_em,
    meu: Boolean(linha.meu),
    possoOcultar: Boolean(linha.posso_ocultar),
    enderecoDoAudio: async () => {
      const { data, error } = await supabase.storage
        .from(BUCKET_DE_ARROTOS_DO_PERFIL)
        .createSignedUrl(linha.caminho_do_audio, SEGUNDOS_DA_URL_ASSINADA);
      if (error || !data?.signedUrl) return null;
      return data.signedUrl;
    },
  };
}

/** Adaptador Supabase para gravações diretas publicadas em perfis autenticados. */
export function criarArrotosDoPerfilRemoto(): PortaDeArrotosDoPerfil {
  return {
    async prepararArquivoDeAudio(arquivo: File): Promise<ResultadoDoPreparoDeArquivoDeAudio> {
      const audio = normalizarAudioParaEnvio(arquivo);
      if (!audio) return { ok: false, motivo: 'formatoInvalido' };
      if (audio.size < 1 || audio.size > LIMITE_DO_AUDIO) return { ok: false, motivo: 'grandeDemais' };

      const duracaoSegundos = await lerDuracaoDoArquivo(audio);
      if (duracaoSegundos === null) return { ok: false, motivo: 'metadadosIndisponiveis' };
      const duracaoMs = Math.round(duracaoSegundos * 1_000);
      if (duracaoMs < 1 || duracaoMs > DURACAO_MAXIMA_DO_ARQUIVO_MS) {
        return { ok: false, motivo: 'duracaoInvalida' };
      }

      const pronto: AudioDeArquivoDoPerfil = { dados: audio, duracaoMs };
      return { ok: true, audio: pronto };
    },

    async prepararArroto(destinoHandle?: string): Promise<ResultadoDoPreparoDeArroto> {
      if (configuracaoAusente) return { ok: false, motivo: 'semRede' };
      try {
        const sessao = await garantirSessao();
        if (!sessao?.user?.id) return { ok: false, motivo: 'semConta' };
        const destino = destinoHandle?.trim().replace(/^@/, '') || null;
        const { data, error } = await supabase.rpc('preparar_arroto_do_perfil', { p_handle_destino: destino });
        if (error) {
          if ((error as { code?: string }).code === '22023') return { ok: false, motivo: 'destinoInexistente' };
          throw error;
        }
        const linha = ((data ?? []) as Array<{
          id: string; caminho_do_audio: string; perfil_destino_id: string; perfil_destino_handle: string; perfil_destino_apelido: string;
        }>)[0];
        if (!linha) throw new Error('O servidor não devolveu o rascunho do arroto.');
        return {
          ok: true,
          rascunho: {
            id: linha.id,
            caminhoDoAudio: linha.caminho_do_audio,
            perfilDestinoId: linha.perfil_destino_id,
            perfilDestinoHandle: linha.perfil_destino_handle,
            perfilDestinoApelido: linha.perfil_destino_apelido,
          },
        };
      } catch (erro) {
        console.error('Falha ao preparar o arroto do perfil', erro);
        return { ok: false, motivo: 'semRede' };
      }
    },

    async publicarArroto(rascunho: RascunhoDeArrotoDoPerfil, audio: Blob, duracaoSegundos: number): Promise<ResultadoDaPublicacaoDeArroto> {
      if (configuracaoAusente) return { ok: false, motivo: 'semRede' };
      const audioNormalizado = normalizarAudioParaEnvio(audio);
      if (!audioNormalizado) return { ok: false, motivo: 'formatoInvalido' };
      if (audioNormalizado.size > LIMITE_DO_AUDIO) return { ok: false, motivo: 'grandeDemais' };
      if (!Number.isFinite(duracaoSegundos) || duracaoSegundos <= 0 || duracaoSegundos > DURACAO_MAXIMA) {
        return { ok: false, motivo: 'duracaoInvalida' };
      }
      try {
        const sessao = await garantirSessao();
        if (!sessao?.user?.id) return { ok: false, motivo: 'semConta' };
        const { error: erroDoUpload } = await supabase.storage
          .from(BUCKET_DE_ARROTOS_DO_PERFIL)
          .upload(rascunho.caminhoDoAudio, audioNormalizado, { upsert: false, contentType: audioNormalizado.type });
        if (erroDoUpload) throw erroDoUpload;
        const { data, error } = await supabase.rpc('publicar_arroto_do_perfil', {
          p_arroto_id: rascunho.id,
          p_duracao_segundos: duracaoSegundos,
        });
        if (error) throw error;
        const linha = ((data ?? []) as LinhaDeArroto[])[0];
        if (!linha) throw new Error('O servidor não confirmou a publicação do arroto.');
        return { ok: true, arroto: traduzirArroto(linha) };
      } catch (erro) {
        console.error('Falha ao publicar o arroto do perfil', erro);
        return { ok: false, motivo: 'falhou' };
      }
    },

    async listarArrotos(handle: string): Promise<readonly ArrotoDoPerfil[]> {
      if (configuracaoAusente) throw new Error('Sem servidor configurado.');
      const { data, error } = await supabase.rpc('listar_arrotos_do_perfil', { p_handle: handle });
      if (error) throw error;
      return ((data ?? []) as LinhaDeArroto[]).map(traduzirArroto);
    },

    async ocultarArroto(id: string): Promise<boolean> {
      if (configuracaoAusente) return false;
      try {
        const sessao = await garantirSessao();
        if (!sessao?.user?.id) return false;
        const { data, error } = await supabase.rpc('ocultar_arroto_do_perfil', { p_arroto_id: id });
        if (error) throw error;
        return Boolean(data);
      } catch (erro) {
        console.error('Falha ao ocultar o arroto do perfil', erro);
        return false;
      }
    },
  };
}
