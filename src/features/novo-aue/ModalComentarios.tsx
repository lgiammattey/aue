import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import type { GravacaoLivreDoForum } from '../../portas/forum';
import { detectarLinkDeVideo } from '../../nucleo/midia/embeds';
import type { ItemComentario, ItemDoFeed } from './tipos';
import type { AnexoRascunho } from './ModalCompositor';

interface Props {
  readonly aberto: boolean; readonly post: ItemDoFeed | null; readonly comentarios: readonly ItemComentario[];
  readonly carregando: boolean; readonly enviando: boolean; readonly aoFechar: () => void;
  readonly criarGravacao?: () => GravacaoLivreDoForum;
  readonly aoEnviarComentario: (dados: { conteudo: string; paiId: string | null; anexo: AnexoRascunho | null }) => Promise<boolean>;
}
const LIMITE = 180;
function tempo(iso: string) { const segundos = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000)); return segundos < 60 ? 'agora' : segundos < 3600 ? `${Math.floor(segundos / 60)}m` : `${Math.floor(segundos / 3600)}h`; }

export function ModalComentarios({ aberto, post, comentarios, carregando, enviando, aoFechar, criarGravacao, aoEnviarComentario }: Props) {
  const [texto, setTexto] = useState(''); const [paiId, setPaiId] = useState<string | null>(null); const [anexo, setAnexo] = useState<AnexoRascunho | null>(null);
  const [link, setLink] = useState(''); const [erro, setErro] = useState<string | null>(null); const [gravando, setGravando] = useState(false);
  const gravacao = useRef<GravacaoLivreDoForum | null>(null);
  useEffect(() => () => gravacao.current?.cancelar(), []);
  if (!aberto || !post) return null;
  const escolherImagem = (evento: ChangeEvent<HTMLInputElement>) => { const arquivo = evento.target.files?.[0]; if (!arquivo) return; if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(arquivo.type)) { setErro('Só imagem ou GIF entra aqui.'); return; } setAnexo({ tipo: 'imagem', arquivo }); setErro(null); };
  const adicionarLink = () => { const video = detectarLinkDeVideo(link.trim()); if (!video) { setErro('Cole um link público do YouTube ou TikTok.'); return; } setAnexo({ tipo: 'videoExterno', url: video.urlOriginal }); setLink(''); setErro(null); };
  const alternarGravacao = async () => { if (gravando) { gravacao.current?.parar(); return; } if (!criarGravacao) { setErro('Gravação de áudio indisponível agora.'); return; } const nova = criarGravacao(); gravacao.current = nova; const inicio = await nova.iniciar(); if (!inicio.ok) { setErro(inicio.motivo === 'negado' ? 'Libera o microfone para gravar áudio.' : 'Não deu para iniciar a gravação.'); return; } setGravando(true); const fim = await inicio.conclusao; setGravando(false); if (!fim.ok) { if (fim.motivo !== 'cancelado') setErro('A gravação não deu certo.'); return; } setAnexo({ tipo: 'audio', arquivo: fim.audio.dados, duracaoMs: fim.audio.duracaoMs }); setErro(null); };
  const enviar = async (evento: FormEvent) => { evento.preventDefault(); if (enviando || (!texto.trim() && !anexo)) return; const ok = await aoEnviarComentario({ conteudo: texto.trim(), paiId, anexo }); if (ok) { setTexto(''); setPaiId(null); setAnexo(null); setLink(''); } };
  return <div className="modal open" role="dialog" aria-modal="true" aria-labelledby="modalComentariosTitulo" onClick={(e) => e.target === e.currentTarget && aoFechar()}>
    <div className="dialog" style={{ maxWidth: 600, maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
      <div className="dialog-head"><div><span className="od-composer__eyebrow">r/{post.comunidadeSlug}</span><h2 id="modalComentariosTitulo">Resenha na roda</h2></div><button type="button" className="close" onClick={aoFechar} aria-label="Fechar comentários">✕</button></div>
      <div className="od-comments__original"><strong>{post.autorHandle ? <Link to={`/u/${post.autorHandle}`} onClick={aoFechar} aria-label={`Abrir perfil de ${post.autorNome}`}>{post.autorNome}</Link> : post.autorNome}</strong><p>{post.corpo || post.titulo}</p></div>
      <div className="od-comments__list" aria-label="Lista de comentários">
        {carregando ? <p className="od-muted">Ouvindo a roda…</p> : comentarios.length === 0 ? <p className="od-muted">Nenhum comentário ainda. Puxa o papo.</p> : comentarios.map((c) => <article className="od-comment" key={c.id} style={{ marginLeft: `${Math.min(c.nivel ?? 0, 2) * 18}px` }}>
          <div><strong>{c.autorHandle ? <Link to={`/u/${c.autorHandle}`} onClick={aoFechar} aria-label={`Abrir perfil de ${c.autorNome}`}>{c.autorNome}</Link> : c.autorNome}</strong><span> · {tempo(c.criadoEm)}</span></div>
          {c.conteudo && <p>{c.conteudo}</p>}
          {c.anexo?.tipo === 'imagem' && c.anexo.url && <img src={c.anexo.url} alt="Imagem no comentário" className="post-media-image" />}
          {c.anexo?.tipo === 'audio' && c.anexo.url && <audio controls src={c.anexo.url} />}
          {c.anexo?.tipo === 'videoExterno' && c.anexo.url && detectarLinkDeVideo(c.anexo.url) && <iframe className="post-video" src={detectarLinkDeVideo(c.anexo.url)!.embedUrl} title="Vídeo no comentário" loading="lazy" allowFullScreen />}
          <button type="button" className="tab" onClick={() => setPaiId(c.id)}>Responder a {c.autorNome}</button>
        </article>)}</div>
      <form onSubmit={enviar} className="od-comments__form"><textarea maxLength={LIMITE} value={texto} onChange={(e) => setTexto(e.target.value)} placeholder={paiId ? 'Responder nesta conversa…' : 'Responder para a roda…'} aria-label="Escrever resposta" rows={2} disabled={enviando} />
        <div className="od-composer__meta"><span>{texto.length}/{LIMITE}</span>{paiId && <button type="button" className="tab" onClick={() => setPaiId(null)}>Cancelar resposta</button>}</div>
        <div className="od-composer__tools"><label className="tab">▧ <span>Imagem</span><input type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={escolherImagem} disabled={enviando || gravando || Boolean(anexo)} /></label><button type="button" className="tab" onClick={() => void alternarGravacao()} disabled={enviando || (!gravando && Boolean(anexo))}>{gravando ? '■ Parar' : '◉ Áudio'}</button><input className="od-composer__link" value={link} onChange={(e) => setLink(e.target.value)} placeholder="YouTube ou TikTok" disabled={enviando || gravando || Boolean(anexo)} /><button type="button" className="tab" onClick={adicionarLink} disabled={enviando || gravando || Boolean(anexo) || !link.trim()}>Adicionar</button></div>
        {anexo && <div className="od-composer__attachment"><span>{anexo.tipo === 'imagem' ? 'Imagem/GIF selecionado' : anexo.tipo === 'audio' ? `Áudio de ${Math.ceil(anexo.duracaoMs / 1000)} s` : 'Vídeo externo selecionado'}</span><button type="button" className="tab" onClick={() => setAnexo(null)} disabled={enviando || gravando}>Remover</button></div>}
        {erro && <p className="od-composer__error" role="alert">{erro}</p>}<div className="od-composer__actions"><button type="submit" className="submit" disabled={enviando || gravando || (!texto.trim() && !anexo)}>{enviando ? 'Enviando…' : 'Responder'}</button></div>
      </form>
    </div>
  </div>;
}
