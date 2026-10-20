import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import type { ComunidadeDoForum, GravacaoLivreDoForum } from '../../portas/forum';
import { detectarLinkDeVideo } from '../../nucleo/midia/embeds';

export type AnexoRascunho =
  | { readonly tipo: 'imagem'; readonly arquivo: File }
  | { readonly tipo: 'audio'; readonly arquivo: Blob; readonly duracaoMs: number }
  | { readonly tipo: 'videoExterno'; readonly url: string };

interface Props {
  readonly aberto: boolean;
  readonly comunidades: readonly ComunidadeDoForum[];
  readonly comunidadePadraoSlug?: string;
  readonly aoFechar: () => void;
  readonly criarGravacao?: () => GravacaoLivreDoForum;
  readonly aoPublicar: (dados: { corpo: string; comunidadeSlug: string; anexo: AnexoRascunho | null }) => Promise<boolean>;
}

const LIMITE = 180;

export function ModalCompositor({ aberto, comunidades, comunidadePadraoSlug, aoFechar, criarGravacao, aoPublicar }: Props) {
  const [corpo, setCorpo] = useState('');
  const [comunidadeSlug, setComunidadeSlug] = useState(comunidadePadraoSlug ?? comunidades[0]?.slug ?? '');
  const [anexo, setAnexo] = useState<AnexoRascunho | null>(null);
  const [link, setLink] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [gravando, setGravando] = useState(false);
  const gravacao = useRef<GravacaoLivreDoForum | null>(null);

  useEffect(() => { if (comunidadePadraoSlug) setComunidadeSlug(comunidadePadraoSlug); }, [comunidadePadraoSlug]);
  useEffect(() => () => gravacao.current?.cancelar(), []);
  if (!aberto) return null;

  const escolherImagem = (evento: ChangeEvent<HTMLInputElement>) => {
    const arquivo = evento.target.files?.[0];
    if (!arquivo) return;
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(arquivo.type)) { setErro('Só imagem ou GIF entra aqui.'); return; }
    setAnexo({ tipo: 'imagem', arquivo }); setErro(null);
  };
  const adicionarLink = () => {
    const video = detectarLinkDeVideo(link.trim());
    if (!video) { setErro('Cole um link público do YouTube ou TikTok.'); return; }
    setAnexo({ tipo: 'videoExterno', url: video.urlOriginal }); setLink(''); setErro(null);
  };
  const alternarGravacao = async () => {
    if (gravando) { gravacao.current?.parar(); return; }
    if (!criarGravacao) { setErro('Gravação de áudio indisponível agora.'); return; }
    const nova = criarGravacao(); gravacao.current = nova;
    const inicio = await nova.iniciar();
    if (!inicio.ok) { setErro(inicio.motivo === 'negado' ? 'Libera o microfone para gravar áudio.' : 'Não deu para iniciar a gravação.'); return; }
    setGravando(true);
    const fim = await inicio.conclusao;
    setGravando(false);
    if (!fim.ok) { if (fim.motivo !== 'cancelado') setErro('A gravação não deu certo. Tenta de novo.'); return; }
    setAnexo({ tipo: 'audio', arquivo: fim.audio.dados, duracaoMs: fim.audio.duracaoMs }); setErro(null);
  };
  const enviar = async (evento: FormEvent) => {
    evento.preventDefault();
    if (enviando || (!corpo.trim() && !anexo) || !comunidadeSlug) return;
    setEnviando(true); setErro(null);
    try {
      const publicado = await aoPublicar({ corpo: corpo.trim(), comunidadeSlug, anexo });
      if (!publicado) return;
      setCorpo(''); setAnexo(null); setLink(''); aoFechar();
    } finally { setEnviando(false); }
  };

  return <div className="modal open" role="dialog" aria-modal="true" aria-labelledby="dialogComposerTitle" onClick={(e) => e.target === e.currentTarget && aoFechar()}>
    <div className="dialog"><div className="dialog-head"><h2 id="dialogComposerTitle">Soltar na roda</h2><button type="button" className="close" onClick={aoFechar} aria-label="Fechar modal">✕</button></div>
      <form onSubmit={enviar}>
        {comunidades.length > 0 && <select value={comunidadeSlug} onChange={(e) => setComunidadeSlug(e.target.value)} aria-label="Escolha a roda">{comunidades.map((c) => <option key={c.id} value={c.slug}>r/{c.slug} — {c.nome}</option>)}</select>}
        <textarea maxLength={LIMITE} rows={4} placeholder="O que rolou?" value={corpo} onChange={(e) => setCorpo(e.target.value)} aria-label="Texto da publicação" />
        <div className="od-composer__meta"><span>{corpo.length}/{LIMITE}</span><span>Imagem, GIF, áudio de até 1 min ou vídeo do YouTube/TikTok.</span></div>
        <div className="od-composer__tools" aria-label="Anexar ao post">
          <label className="tab" title="Imagem ou GIF">▧ <span>Imagem</span><input type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={escolherImagem} disabled={enviando || gravando || Boolean(anexo)} /></label>
          <button type="button" className="tab" onClick={() => void alternarGravacao()} disabled={enviando || (!gravando && Boolean(anexo))}>{gravando ? '■ Parar' : '◉ Áudio'}</button>
          <input className="od-composer__link" value={link} onChange={(e) => setLink(e.target.value)} placeholder="Link YouTube ou TikTok" disabled={enviando || gravando || Boolean(anexo)} />
          <button type="button" className="tab" onClick={adicionarLink} disabled={enviando || gravando || Boolean(anexo) || !link.trim()}>Adicionar</button>
        </div>
        {anexo && <div className="od-composer__attachment"><span>{anexo.tipo === 'imagem' ? 'Imagem/GIF selecionado' : anexo.tipo === 'audio' ? `Áudio de ${Math.ceil(anexo.duracaoMs / 1000)} s` : 'Vídeo externo selecionado'}</span><button type="button" className="tab" onClick={() => setAnexo(null)} disabled={enviando || gravando}>Remover</button></div>}
        {erro && <p className="od-composer__error" role="alert">{erro}</p>}
        <div className="od-composer__actions"><button type="button" className="tab" onClick={aoFechar} disabled={enviando || gravando}>Cancelar</button><button type="submit" className="submit" disabled={enviando || gravando || (!corpo.trim() && !anexo)}>{enviando ? 'Publicando…' : 'Publicar'}</button></div>
      </form>
    </div>
  </div>;
}
