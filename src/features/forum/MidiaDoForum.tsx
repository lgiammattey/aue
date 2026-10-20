/* oxlint-disable react/only-export-components -- contrato visual e componentes ficam juntos para a integração da porta de mídia. */
import { useEffect, useId, useState, type ChangeEvent } from 'react';
import { detectarLinkDeVideo } from '../../nucleo/midia/embeds';
import type { AnexoDoForum } from '../../portas/forum';
import { useDependenciasDoForum } from './contexto';

export const LIMITE_DE_TEXTO_DA_PUBLICACAO = 180;
export const DURACAO_MAXIMA_DO_AUDIO_LIVRE = 60;

export type MidiaDoForum =
  | { readonly tipo: 'imagem'; readonly url: string; readonly descricao: string }
  | { readonly tipo: 'audio'; readonly url: string; readonly duracaoEmSegundos: number }
  | { readonly tipo: 'video-externo'; readonly origem: 'youtube' | 'tiktok'; readonly urlDeEmbed: string; readonly urlOriginal: string };

/**
 * Traduz somente URLs públicas dos provedores suportados para URLs de embed.
 * O iframe nunca recebe uma URL arbitrária digitada por alguém.
 */
export function videoDoForum(url: string): Extract<MidiaDoForum, { tipo: 'video-externo' }> | null {
  const canonico = detectarLinkDeVideo(url.trim());
  if (!canonico) return null;
  return {
    tipo: 'video-externo',
    origem: canonico.tipo,
    urlOriginal: canonico.urlOriginal,
    urlDeEmbed: canonico.embedUrl,
  };
}

export function CartaoDeMidia({ midia }: { readonly midia: MidiaDoForum }) {
  const [aberto, setAberto] = useState(false);
  const [falhou, setFalhou] = useState(false);
  const titulo = midia.tipo === 'video-externo' ? `Vídeo do ${midia.origem === 'youtube' ? 'YouTube' : 'TikTok'}` : null;

  if (midia.tipo === 'imagem') {
    return <figure className="forum-midia forum-midia--imagem"><img src={midia.url} alt={midia.descricao} loading="lazy" /></figure>;
  }
  if (midia.tipo === 'audio') {
    return <div className="forum-midia forum-midia--audio"><audio controls preload="metadata" src={midia.url}>Seu navegador não conseguiu tocar este áudio.</audio><span>{formatarDuracao(midia.duracaoEmSegundos)}</span></div>;
  }
  return (
    <section className="forum-midia forum-midia--video" aria-label={titulo ?? undefined}>
      {aberto && !falhou ? (
        <iframe
          title={titulo ?? 'Vídeo'}
          src={midia.urlDeEmbed}
          sandbox="allow-scripts allow-same-origin allow-presentation allow-popups"
          referrerPolicy="strict-origin-when-cross-origin"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          allowFullScreen
          onError={() => setFalhou(true)}
        />
      ) : (
        <div className="forum-midia__video-capa">
          <p>{falhou ? 'Esse vídeo não pôde ser carregado dentro do Auê.' : `${titulo} · toca aqui sem sair do Auê.`}</p>
          {!falhou && <button type="button" className="forum-botao forum-botao--contorno" onClick={() => setAberto(true)}>Assistir aqui</button>}
        </div>
      )}
      {falhou && <p className="forum-midia__indisponivel" role="status">Esse vídeo está indisponível no Auê.</p>}
    </section>
  );
}

/** Card só aparece depois da leitura autorizada da porta; URL privada nunca vai ao JSX sem assinatura. */
export function AnexoPublicadoDoForum({ alvo, alvoId }: { readonly alvo: 'topico' | 'resposta'; readonly alvoId: string }) {
  const { forum } = useDependenciasDoForum();
  const [anexo, setAnexo] = useState<AnexoDoForum | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [erro, setErro] = useState(false);
  useEffect(() => {
    let vivo = true;
    setAnexo(null); setUrl(null); setErro(false);
    // Adaptador antigo não sabe sequer se existe anexo: não inventa um card de erro em todo post.
    if (!forum.listarAnexosDoForum) return () => { vivo = false; };
    void forum.listarAnexosDoForum(alvo === 'topico' ? { topicoIds: [alvoId] } : { respostaIds: [alvoId] }).then(async (resultado) => {
      if (!vivo) return;
      if (!resultado.ok) { setErro(true); return; }
      const encontrado = resultado.valor.find((item) => item.alvo === alvo && item.alvoId === alvoId) ?? null;
      setAnexo(encontrado);
      if (encontrado && encontrado.tipo !== 'videoExterno' && encontrado.caminho) {
        if (!forum.assinarAnexoDoForum) { setErro(true); return; }
        const assinado = await forum.assinarAnexoDoForum(encontrado.caminho);
        if (!vivo) return;
        if (assinado.ok) setUrl(assinado.valor); else setErro(true);
      }
    });
    return () => { vivo = false; };
  }, [forum, alvo, alvoId]);
  if (!anexo && !erro) return null;
  if (erro) return <p className="forum-midia__indisponivel" role="status">O anexo deste post não está disponível agora.</p>;
  if (!anexo) return null;
  if (anexo.tipo === 'videoExterno') {
    const midia = videoDoForum(anexo.urlVideo);
    return midia ? <CartaoDeMidia midia={midia} /> : <p className="forum-midia__indisponivel">Este vídeo não está disponível.</p>;
  }
  if (!url) return <p className="forum-midia__indisponivel" role="status">Carregando anexo…</p>;
  return anexo.tipo === 'imagem'
    ? <CartaoDeMidia midia={{ tipo: 'imagem', url, descricao: 'Imagem anexada ao post' }} />
    : <CartaoDeMidia midia={{ tipo: 'audio', url, duracaoEmSegundos: Math.round((anexo.duracaoMs ?? 0) / 1000) }} />;
}

export interface AcessoriosDoComposerProps {
  readonly anexo: MidiaDoForum | null;
  readonly aoMudarAnexo: (anexo: MidiaDoForum | null) => void;
  /** A plataforma controla permissão, MediaRecorder, limite de 60 s e URL do resultado. */
  readonly aoPedirGravacao?: () => void;
  /** Upload fica fora da UI. Sem esta porta, a imagem é explicitamente só uma seleção pendente. */
  readonly aoEscolherImagem?: (arquivo: File) => void;
  readonly bloqueado?: boolean;
  readonly gravando?: boolean;
}

export function AcessoriosDoComposer({ anexo, aoMudarAnexo, aoPedirGravacao, aoEscolherImagem, bloqueado = false, gravando = false }: AcessoriosDoComposerProps) {
  const id = useId();
  const [link, setLink] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const escolherImagem = (evento: ChangeEvent<HTMLInputElement>) => {
    const arquivo = evento.target.files?.[0];
    if (!arquivo) return;
    if (!arquivo.type.startsWith('image/')) {
      setErro('Só imagem ou GIF entra aqui.');
      return;
    }
    if (!aoEscolherImagem) {
      setErro('Anexo de imagem ainda não está disponível para envio.');
      return;
    }
    aoEscolherImagem(arquivo);
    setErro(null);
  };
  const adicionarLink = () => {
    const video = videoDoForum(link);
    if (!video) {
      setErro('Cole um link público do YouTube ou TikTok.');
      return;
    }
    aoMudarAnexo(video);
    setLink('');
    setErro(null);
  };
  return (
    <div className="forum-acessorios" aria-label="Anexar ao post">
      <div className="forum-acessorios__botoes">
        <label className="forum-acessorios__botao" htmlFor={id} title="Imagem ou GIF">
          <span aria-hidden="true">▧</span><span className="sr-only">Imagem ou GIF</span>
        </label>
        <input id={id} className="forum-acessorios__arquivo" type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={escolherImagem} disabled={bloqueado || gravando || anexo !== null} />
        <button type="button" className="forum-acessorios__botao" disabled={bloqueado || (!gravando && (anexo !== null || !aoPedirGravacao))} onClick={aoPedirGravacao} title={gravando ? 'Parar gravação' : aoPedirGravacao ? 'Gravar áudio de até 1 minuto' : 'Gravação será habilitada quando o áudio estiver conectado'}>
          <span aria-hidden="true">◉</span><span className="sr-only">{gravando ? 'Parar gravação' : 'Gravar áudio'}</span>
        </button>
        <div className="forum-acessorios__link">
          <label className="sr-only" htmlFor={`${id}-link`}>Link do YouTube ou TikTok</label>
          <input id={`${id}-link`} value={link} onChange={(e) => setLink(e.target.value)} placeholder="Link YouTube ou TikTok" disabled={bloqueado || gravando || anexo !== null} />
          <button type="button" className="forum-botao-texto" onClick={adicionarLink} disabled={bloqueado || gravando || anexo !== null || link.trim() === ''}>Adicionar link</button>
        </div>
      </div>
      {anexo && <div className="forum-acessorios__selecionado"><span>1 anexo: {anexo.tipo === 'video-externo' ? tituloDoVideo(anexo) : anexo.tipo}</span><button type="button" className="forum-botao-texto" onClick={() => aoMudarAnexo(null)} disabled={bloqueado}>Remover</button></div>}
      {!aoPedirGravacao && <p className="forum-acessorios__aviso">Gravação de áudio será liberada quando o gravador estiver conectado.</p>}
      {erro && <p className="forum-campo__erro" role="alert">{erro}</p>}
    </div>
  );
}

function tituloDoVideo(video: Extract<MidiaDoForum, { tipo: 'video-externo' }>) { return video.origem === 'youtube' ? 'vídeo do YouTube' : 'vídeo do TikTok'; }
function formatarDuracao(segundos: number) { return `${Math.floor(segundos / 60)}:${String(Math.max(0, Math.floor(segundos % 60))).padStart(2, '0')}`; }
