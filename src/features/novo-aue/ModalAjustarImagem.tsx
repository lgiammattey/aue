import { useEffect, useRef, useState } from 'react';
import { manterFocoNoDialogo } from '../../plataforma/web/focoNoDialogo';
import './ModalAjustarImagem.css';
export type TipoDeImagemAjustavel='foto'|'capa'; export type EstadoDoAjusteDeImagem='preparando'|'pronto'|'erro'|'enviando'; export interface RecorteVisual{readonly centroX:number;readonly centroY:number;readonly zoom:number}
interface G{readonly larguraDaJanela:number;readonly alturaDaJanela:number;readonly larguraDaImagem:number;readonly alturaDaImagem:number}
const clamp=(n:number,min=0,max=1)=>Math.max(min,Math.min(max,n));
/** Mantém os centros nos mesmos limites que o canvas aplica ao recorte. */
export function limitarRecorteAoQuadro(r:RecorteVisual,g:G):RecorteVisual{
  const proporcao=g.larguraDaJanela/g.alturaDaJanela;
  const base=g.larguraDaImagem/g.alturaDaImagem>proporcao
    ? { largura:g.alturaDaImagem*proporcao,altura:g.alturaDaImagem }
    : { largura:g.larguraDaImagem,altura:g.larguraDaImagem/proporcao };
  const corte={largura:base.largura/r.zoom,altura:base.altura/r.zoom};
  return {...r,centroX:clamp(r.centroX,corte.largura/(2*g.larguraDaImagem),1-corte.largura/(2*g.larguraDaImagem)),centroY:clamp(r.centroY,corte.altura/(2*g.alturaDaImagem),1-corte.altura/(2*g.alturaDaImagem))};
}
export function recorteDepoisDoArrasto(r:RecorteVisual,dx:number,dy:number,g:G):RecorteVisual{const s=Math.max(g.larguraDaJanela/g.larguraDaImagem,g.alturaDaJanela/g.alturaDaImagem)*r.zoom;return limitarRecorteAoQuadro({...r,centroX:r.centroX-dx/(g.larguraDaImagem*s),centroY:r.centroY-dy/(g.alturaDaImagem*s)},g)}
interface P{aberto:boolean;tipo:TipoDeImagemAjustavel;previewUrl:string|null;estado:EstadoDoAjusteDeImagem;erro?:string|null;recorte:RecorteVisual;aoFechar():void;aoSalvar():void;aoTrocarArquivo():void;aoAlterarRecorte(r:RecorteVisual):void}
export function ModalAjustarImagem(p:P) {
  const dialog = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const last = useRef<{ x: number; y: number } | null>(null);
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);
  const ready = p.estado === 'pronto';
  const locked = p.estado === 'preparando' || p.estado === 'enviando';
  const cover = p.tipo === 'capa';
  useEffect(() => { if (p.aberto) dialog.current?.focus(); }, [p.aberto]);
  if (!p.aberto) return null;
  const geometry = (): G | null => {
    const box = stage.current?.getBoundingClientRect();
    return box && size ? { larguraDaJanela: box.width, alturaDaJanela: box.height, larguraDaImagem: size.w, alturaDaImagem: size.h } : null;
  };
  const drag = (dx: number, dy: number) => {
    const g = geometry();
    if (g) p.aoAlterarRecorte(recorteDepoisDoArrasto(p.recorte, dx, dy, g));
  };
  const alterarRecorte = (proximo: RecorteVisual) => {
    const atual = geometry();
    p.aoAlterarRecorte(atual ? limitarRecorteAoQuadro(proximo, atual) : proximo);
  };
  const limits = cover
    ? 'JPG, PNG ou WebP · até 10 MB · mínimo 1200 × 400 · até 24 MP · saída 1500 × 500 (até 3 MB)'
    : 'JPG, PNG ou WebP · até 10 MB · mínimo 320 × 320 · até 24 MP · saída 512 × 512 (até 2 MB)';
  const g = geometry();
  const scale = g ? Math.max(g.larguraDaJanela / g.larguraDaImagem, g.alturaDaJanela / g.alturaDaImagem) * p.recorte.zoom : 1;
  const visual = g ? { width: g.larguraDaImagem * scale, height: g.alturaDaImagem * scale, transform: `translate(${g.larguraDaJanela / 2 - g.larguraDaImagem * scale * p.recorte.centroX}px, ${g.alturaDaJanela / 2 - g.alturaDaImagem * scale * p.recorte.centroY}px)` } : undefined;
  return <div className="od-image-crop" role="presentation">
    <div ref={dialog} className="od-image-crop__dialog" role="dialog" aria-modal="true" aria-labelledby="imageCropTitle" tabIndex={-1} onKeyDown={(e) => { if (e.key === 'Escape' && !locked) p.aoFechar(); manterFocoNoDialogo(e.nativeEvent, dialog.current); }}>
      <header className="od-image-crop__head">
        <button type="button" className="od-image-crop__close" disabled={locked} onClick={p.aoFechar} aria-label="Fechar ajuste de imagem">×</button>
        <h2 id="imageCropTitle">Ajustar {cover ? 'capa' : 'foto'}</h2>
        <button type="button" className="od-image-crop__save" disabled={!ready || !size} onClick={p.aoSalvar}>{p.estado === 'enviando' ? 'Salvando…' : 'Salvar'}</button>
      </header>
      <section className="od-image-crop__content">
        <div ref={stage} className={`od-image-crop__stage${cover ? ' od-image-crop__stage--cover' : ''}`} onPointerDown={(e) => { if (ready) { last.current = { x: e.clientX, y: e.clientY }; e.currentTarget.setPointerCapture(e.pointerId); } }} onPointerMove={(e) => { if (last.current) { drag(e.clientX - last.current.x, e.clientY - last.current.y); last.current = { x: e.clientX, y: e.clientY }; } }} onPointerUp={() => { last.current = null; }}>
          {p.previewUrl ? <img className="od-image-crop__image" style={visual} src={p.previewUrl} alt="" onLoad={(e) => setSize({ w: e.currentTarget.naturalWidth, h: e.currentTarget.naturalHeight })} /> : <p>Preparando imagem…</p>}
        </div>
        {p.erro && <p className="od-image-crop__error" role="alert">{p.erro} <button type="button" onClick={p.aoTrocarArquivo}>Escolher outro arquivo</button></p>}
        <label>Zoom <input aria-label="Zoom" type="range" min="100" max="220" value={p.recorte.zoom * 100} disabled={!ready} onChange={(e) => alterarRecorte({ ...p.recorte, zoom: Number(e.target.value) / 100 })} /></label>
        <div className="od-image-crop__move" aria-label="Mover enquadramento">
          <button type="button" disabled={!ready} onClick={() => alterarRecorte({ ...p.recorte, centroY: p.recorte.centroY - .04 })} aria-label="Mover para cima">↑</button>
          <button type="button" disabled={!ready} onClick={() => alterarRecorte({ ...p.recorte, centroX: p.recorte.centroX - .04 })} aria-label="Mover para a esquerda">←</button>
          <button type="button" disabled={!ready} onClick={() => alterarRecorte({ ...p.recorte, centroY: p.recorte.centroY + .04 })} aria-label="Mover para baixo">↓</button>
          <button type="button" disabled={!ready} onClick={() => alterarRecorte({ ...p.recorte, centroX: p.recorte.centroX + .04 })} aria-label="Mover para a direita">→</button>
        </div>
      </section>
      <footer className="od-image-crop__foot"><button type="button" onClick={p.aoTrocarArquivo} disabled={locked}>Trocar arquivo</button><p>{limits}</p></footer>
    </div>
  </div>;
}
