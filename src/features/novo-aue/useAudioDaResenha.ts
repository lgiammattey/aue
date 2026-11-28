import { useEffect, useRef, useState } from 'react';
import { analyticsArenaV2 } from '../../plataforma/web/analyticsArenaV2';
import { criarReproducaoDaResenha } from '../../plataforma/web/reproducaoDaResenha';

type FonteDeAudio = string | (() => Promise<string | null>);

export function useAudioDaResenha() {
  const [reproducao] = useState(criarReproducaoDaResenha);
  const [audioTocandoId, setAudioTocandoId] = useState<string | null>(null);
  const [audioSelecionadoId, setAudioSelecionadoId] = useState<string | null>(null);
  const [tempoAtualDoAudio, setTempoAtualDoAudio] = useState(0);
  const [duracaoDoAudio, setDuracaoDoAudio] = useState<number | null>(null);
  const [falhaNoAudio, setFalhaNoAudio] = useState(false);
  const pedidoAtual = useRef(0);
  const midiaAtual = useRef(0);
  const tentandoTocar = useRef(false);

  useEffect(() => () => {
    pedidoAtual.current += 1;
    midiaAtual.current += 1;
    tentandoTocar.current = false;
    reproducao.descartar();
  }, [reproducao]);

  async function alternarAudio(fonte?: FonteDeAudio, identificador?: string) {
    if (!fonte) return;
    const pedido = ++pedidoAtual.current;
    const id = identificador ?? (typeof fonte === 'string' ? fonte : null);
    setFalhaNoAudio(false);
    if (id && audioTocandoId === id) {
      reproducao.pausar();
      setAudioTocandoId(null);
      tentandoTocar.current = false;
      return;
    }

    tentandoTocar.current = true;
    try {
      if (!id || audioSelecionadoId !== id || falhaNoAudio) {
        const url = typeof fonte === 'string' ? fonte : await fonte();
        if (pedido !== pedidoAtual.current) return;
        if (!url) throw new Error('Áudio indisponível.');
        const midia = ++midiaAtual.current;
        setAudioTocandoId(null);
        setAudioSelecionadoId(id ?? url);
        setTempoAtualDoAudio(0);
        setDuracaoDoAudio(null);
        reproducao.carregar(url, {
          duracao: (valor) => { if (midia === midiaAtual.current) setDuracaoDoAudio(valor); },
          tempo: (valor) => { if (midia === midiaAtual.current) setTempoAtualDoAudio(valor); },
          terminou: () => {
            if (midia !== midiaAtual.current) return;
            setAudioTocandoId(null);
            setTempoAtualDoAudio(0);
          },
          falhou: () => {
            if (midia !== midiaAtual.current) return;
            setAudioTocandoId(null);
            setFalhaNoAudio(true);
          },
        });
        await reproducao.tocar(() => setAudioTocandoId(null));
        if (pedido === pedidoAtual.current) setAudioTocandoId(id ?? url);
      } else {
        await reproducao.tocar(() => setAudioTocandoId(null));
        if (pedido === pedidoAtual.current) setAudioTocandoId(id);
      }
      if (pedido === pedidoAtual.current) analyticsArenaV2.registrar('ouviu_arroto');
    } catch {
      if (pedido === pedidoAtual.current) {
        setAudioTocandoId(null);
        setFalhaNoAudio(true);
      }
    } finally {
      if (pedido === pedidoAtual.current) tentandoTocar.current = false;
    }
  }

  return { alternarAudio, audioSelecionadoId, audioTocandoId, tempoAtualDoAudio, duracaoDoAudio, falhaNoAudio, tentandoTocar };
}
