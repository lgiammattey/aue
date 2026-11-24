import { useEffect, useRef, useState, type RefObject } from 'react';
import { criarOndaDoAudio, type ControleDaOnda } from '../../plataforma/web/ondaDoAudio';
import { TEXTOS_DA_ARENA, type TextosDaArena } from './textos';
import './PlayerDeAudio.css';

interface Props { readonly endereco: string; readonly rotulo: string; readonly mediaRef?: RefObject<HTMLAudioElement | null>; readonly textos?: TextosDaArena['player'] }
export function PlayerDeAudio({ endereco, rotulo, mediaRef, textos = TEXTOS_DA_ARENA.pt.player }: Props) {
  const interno = useRef<HTMLAudioElement>(null);
  const player = mediaRef ?? interno;
  const [pronto, setPronto] = useState(false);
  const [tocando, setTocando] = useState(false);
  const [tempo, setTempo] = useState(0);
  const [duracao, setDuracao] = useState(0);
  const ondaEl = useRef<HTMLDivElement>(null);
  const controle = useRef<ControleDaOnda | null>(null);
  useEffect(() => {
    if (!player.current || !ondaEl.current) return;
    let ativo = true;
    setPronto(false);
    setTempo(0);
    setDuracao(0);
    setTocando(false);
    void criarOndaDoAudio(ondaEl.current, player.current, {
      aoProntificar: (valor) => { if (ativo && Number.isFinite(valor) && valor > 0) { setDuracao(valor); setPronto(true); } },
      aoAtualizar: (valor) => { if (ativo && Number.isFinite(valor)) setTempo(valor); },
      aoMudarReproducao: (valor) => { if (ativo) setTocando(valor); },
      aoFalhar: () => { if (ativo) setPronto(false); },
    }).then((instancia) => {
      if (ativo) controle.current = instancia;
      else instancia.encerrar();
    }).catch(() => { if (ativo) setPronto(false); });
    return () => { ativo = false; controle.current?.encerrar(); controle.current = null; };
  }, [endereco, player]);
  const tempoFormatado = (valor: number) => `${Math.floor(valor / 60)}:${String(Math.floor(valor % 60)).padStart(2, '0')}`;
  return <div className="arena-player" role="region" aria-label={textos.regiao(rotulo)}>
    <audio ref={player} aria-label={rotulo} controls={!pronto} className={pronto ? 'arena-player__audio--oculto' : undefined} preload="metadata" src={endereco} />
    {pronto && <button type="button" className="arena-player__play" aria-label={tocando ? textos.pausar : textos.reproduzir} onClick={() => { void controle.current?.alternar().catch(() => setPronto(false)); }}>
      {tocando ? <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 4h4v16H6zm8 0h4v16h-4z" /></svg> : <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4l13 8-13 8z" /></svg>}
    </button>}
    <div className={`arena-player__faixa${pronto ? '' : ' arena-player__faixa--oculta'}`}>
      <div className="arena-player__onda" ref={ondaEl} aria-hidden="true" />
      {pronto && <input type="range" min="0" max={duracao} step="0.01" value={Math.min(tempo, duracao)} aria-label={textos.posicao} aria-valuetext={textos.tempoDe(tempoFormatado(tempo), tempoFormatado(duracao))} onChange={(evento) => controle.current?.buscar(Number(evento.currentTarget.value))} />}
    </div>
    {pronto && <span className="arena-player__tempo">{tempoFormatado(tempo)} / {tempoFormatado(duracao)}</span>}
  </div>;
}
