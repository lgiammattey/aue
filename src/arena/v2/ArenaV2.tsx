import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import type { CapturaPcmV2, FalhaCapturaPcmV2 } from '../../portas/capturaPcmV2';
import type { CapturaDeAudio } from '../../portas/captura';
import type { CompartilhamentoDeAudio } from '../../portas/compartilhamentoDeAudio';
import { criarCompartilhamentoDeAudioWeb } from '../../plataforma/web/compartilhamentoDeAudio';
import { criarCapturaWeb } from '../../plataforma/web/captura';
import { criarCapturaPcmV2 } from '../../plataforma/web/capturaPcmV2';
import { wavDaEmissao } from '../../plataforma/web/wavDaEmissao';
import { criarCicloDeVidaWeb } from '../../plataforma/web/cicloDeVida';
import { criarEnderecoLocal, soltarEnderecoLocal } from '../../plataforma/web/enderecoDeAudio';
import { AVISO_A_PARTIR_DE_MS, TETO_DE_GRAVACAO_MS, formatarCronometro } from '../../nucleo/gravacao/regras';
import { calcularLaudoExperimental, type LaudoExperimental, type MotivoDeLaudoInconclusivo } from '../../nucleo/julgamento/laudoExperimental';
import './arenaV2.css';

interface TentativaDoDuelo { readonly audio: Blob; readonly duracaoMs: number }

type Estado = 'pronto' | 'permissao' | 'calibrando' | 'gravando' | 'finalizando' | 'revisao' | 'erro';

interface Props {
  /** Permite verificar o ciclo sem abrir o microfone nos testes. */
  captura?: CapturaPcmV2;
  capturaSemLaudo?: CapturaDeAudio;
  compartilhamentoDeAudio?: CompartilhamentoDeAudio;
  aoUsarTentativa?: (tentativa: TentativaDoDuelo) => void;
  rotuloUsarTentativa?: string;
  aoVoltar?: () => void;
}

function Player({ audio, player }: { audio: Blob; player: RefObject<HTMLAudioElement | null> }) {
  const [endereco, setEndereco] = useState<string | null>(null);
  useEffect(() => {
    const url = criarEnderecoLocal(audio);
    setEndereco(url);
    return () => soltarEnderecoLocal(url);
  }, [audio]);
  return endereco ? <audio ref={player} aria-label="Sua gravação" controls preload="metadata" src={endereco} /> : null;
}

function falaDaFalha(motivo: FalhaCapturaPcmV2): string {
  switch (motivo) {
    case 'permissao_negada': return 'O microfone está bloqueado. Libere o acesso nas configurações do navegador e tente de novo.';
    case 'microfone_indisponivel': return 'Não encontramos um microfone disponível neste navegador ou aparelho.';
    case 'pcm_indisponivel': return 'A medição experimental de áudio não está disponível agora. Tente novamente ou use outro navegador.';
    case 'limite_excedido': return 'A gravação passou do limite. Tente novamente.';
    case 'cancelada': return 'A gravação foi interrompida. Tente novamente.';
    default: return 'Não foi possível concluir a gravação. Tente novamente.';
  }
}

function falaDoLaudoInconclusivo(motivo: MotivoDeLaudoInconclusivo): string {
  switch (motivo) {
    case 'clipping': return 'O áudio saturou e a medição ficou inconclusiva. Afaste um pouco o microfone e tente novamente.';
    case 'ambiente_alto': return 'O ruído do ambiente impediu a medição. Tente novamente em um lugar mais silencioso.';
    case 'ambiente_instavel': return 'O ambiente mudou durante a medição. Fique em silêncio e tente novamente.';
    case 'ambiente_inaudivel':
    case 'ambiente_insuficiente': return 'Não foi possível medir o ambiente. Tente novamente e aguarde a calibração.';
    case 'emissao_insuficiente': return 'Não detectamos som suficiente para medir essa tentativa. Tente novamente.';
    default: return 'Não foi possível medir esta tentativa com confiança. Tente novamente.';
  }
}

/** Primeira versão local: a gravação e o laudo ainda não são publicados. */
export function ArenaV2({ captura: capturaInjetada, capturaSemLaudo: capturaSemLaudoInjetada, compartilhamentoDeAudio: compartilhamentoInjetado, aoUsarTentativa, rotuloUsarTentativa = 'Continuar', aoVoltar }: Props) {
  const [compartilhamento] = useState(() => compartilhamentoInjetado ?? criarCompartilhamentoDeAudioWeb());
  const [compartilhando, setCompartilhando] = useState(false);
  const compartilhamentoAtivo = useRef<number | null>(null);
  const [mensagemCompartilhamento, setMensagemCompartilhamento] = useState('');
  const [captura] = useState(() => capturaInjetada ?? criarCapturaPcmV2());
  const [capturaSemLaudo] = useState(() => capturaSemLaudoInjetada ?? criarCapturaWeb());
  const modo = useRef<'laudo' | 'semLaudo'>('laudo');
  const [estado, setEstado] = useState<Estado>('pronto');
  const estadoRef = useRef<Estado>('pronto');
  const geracao = useRef(0);
  const inicio = useRef(0);
  const finalizarRef = useRef<() => void>(() => {});
  const [decorrido, setDecorrido] = useState(0);
  const [nivel, setNivel] = useState(0);
  const [audio, setAudio] = useState<Blob | null>(null);
  const player = useRef<HTMLAudioElement | null>(null);
  const [laudo, setLaudo] = useState<LaudoExperimental | null>(null);
  const [mensagem, setMensagem] = useState('');
  const [oferecerSemLaudo, setOferecerSemLaudo] = useState(false);
  const [gravadoSemLaudo, setGravadoSemLaudo] = useState(false);

  const mudar = useCallback((proximo: Estado) => {
    estadoRef.current = proximo;
    setEstado(proximo);
  }, []);

  const cancelar = useCallback((interrompido: boolean) => {
    const anterior = estadoRef.current;
    geracao.current += 1;
    captura.cancelar();
    capturaSemLaudo.soltar();
    setNivel(0);
    if (interrompido && (anterior === 'permissao' || anterior === 'calibrando' || anterior === 'gravando' || anterior === 'finalizando')) {
      setMensagem('A gravação foi interrompida. Tente novamente.');
      mudar('erro');
    }
  }, [captura, capturaSemLaudo, mudar]);

  useEffect(() => {
    const ciclo = criarCicloDeVidaWeb();
    ciclo.aoEsconder(() => cancelar(true));
    return () => {
      ciclo.parar();
      geracao.current += 1;
      captura.cancelar();
      capturaSemLaudo.soltar();
    };
  }, [cancelar, captura, capturaSemLaudo]);

  const iniciar = useCallback(async () => {
    if (estadoRef.current !== 'pronto' && estadoRef.current !== 'erro') return;
    const pedido = ++geracao.current;
    modo.current = 'laudo';
    capturaSemLaudo.soltar();
    setOferecerSemLaudo(false);
    setGravadoSemLaudo(false);
    setMensagem('');
    setAudio(null);
    setLaudo(null);
    setDecorrido(0);
    mudar('permissao');
    let calibrada = false;
    try {
      const resposta = await captura.iniciar({
        aoCalibrar: () => {
          if (pedido !== geracao.current) return;
          calibrada = true;
          inicio.current = Date.now();
          mudar('gravando');
        },
        aoLimite: () => {
          if (pedido === geracao.current) finalizarRef.current();
        },
        aoErro: (motivo) => {
          if (pedido !== geracao.current) return;
          geracao.current += 1;
          captura.cancelar();
          setNivel(0);
          setMensagem(falaDaFalha(motivo));
          setOferecerSemLaudo(motivo === 'pcm_indisponivel');
          mudar('erro');
        },
      });
      if (pedido !== geracao.current) return;
      if (!resposta.ok) {
        captura.cancelar();
        setMensagem(falaDaFalha(resposta.motivo));
        setOferecerSemLaudo(resposta.motivo === 'pcm_indisponivel');
        mudar('erro');
        return;
      }
      // O callback pode chegar antes da resolução em implementações futuras.
      if (!calibrada) mudar('calibrando');
    } catch {
      if (pedido !== geracao.current) return;
      captura.cancelar();
      setMensagem('Não foi possível abrir o microfone. Tente novamente.');
      mudar('erro');
    }
  }, [captura, capturaSemLaudo, mudar]);

  const iniciarSemLaudo = useCallback(async () => {
    if (estadoRef.current !== 'erro') return;
    const pedido = ++geracao.current;
    // A captura experimental é encerrada antes de pedir outra fonte.
    captura.cancelar();
    modo.current = 'semLaudo';
    setOferecerSemLaudo(false);
    setMensagem('');
    setAudio(null);
    setLaudo(null);
    setDecorrido(0);
    mudar('permissao');
    try {
      const resposta = await capturaSemLaudo.pedir();
      if (pedido !== geracao.current) return;
      if (!resposta.ok) {
        capturaSemLaudo.soltar();
        setMensagem(resposta.motivo === 'negado'
          ? 'O microfone está bloqueado. Libere o acesso nas configurações do navegador e tente de novo.'
          : 'Não foi possível abrir o microfone. Tente novamente.');
        setOferecerSemLaudo(true);
        mudar('erro');
        return;
      }
      if (!capturaSemLaudo.comecar()) {
        capturaSemLaudo.soltar();
        setMensagem('Não foi possível iniciar a gravação. Tente novamente.');
        setOferecerSemLaudo(true);
        mudar('erro');
        return;
      }
      inicio.current = Date.now();
      setGravadoSemLaudo(true);
      mudar('gravando');
    } catch {
      if (pedido !== geracao.current) return;
      capturaSemLaudo.soltar();
      setMensagem('Não foi possível abrir o microfone. Tente novamente.');
      setOferecerSemLaudo(true);
      mudar('erro');
    }
  }, [captura, capturaSemLaudo, mudar]);

  const finalizar = useCallback(async () => {
    if (estadoRef.current !== 'gravando') return;
    const pedido = geracao.current;
    mudar('finalizando');
    try {
      if (modo.current === 'semLaudo') {
        const resultado = await capturaSemLaudo.parar();
        if (pedido !== geracao.current) return;
        if ('motivo' in resultado || resultado.dados.size === 0) {
          setMensagem('Não foi possível concluir a gravação. Tente novamente.');
          setOferecerSemLaudo(true);
          mudar('erro');
          return;
        }
        setAudio(resultado.dados);
        setLaudo(null);
        mudar('revisao');
        return;
      }
      const resultado = await captura.parar();
      if (pedido !== geracao.current) return;
      if (!resultado.ok || resultado.audio.size === 0) {
        setMensagem(resultado.ok ? 'Não foi possível concluir a gravação. Tente novamente.' : falaDaFalha(resultado.motivo));
        setOferecerSemLaudo(!resultado.ok && resultado.motivo === 'pcm_indisponivel');
        mudar('erro');
        return;
      }
      // O arquivo comprimido também contém a calibração; só a emissão vai para o player.
      const audioDaTentativa = wavDaEmissao(resultado.emissao, resultado.sampleRate);
      setAudio(audioDaTentativa);
      setLaudo(calcularLaudoExperimental(resultado.ambiente, resultado.emissao, resultado.sampleRate));
      mudar('revisao');
    } catch {
      if (pedido !== geracao.current) return;
      captura.cancelar();
      capturaSemLaudo.soltar();
      setMensagem('Não foi possível concluir a gravação. Tente novamente.');
      mudar('erro');
    }
  }, [captura, capturaSemLaudo, mudar]);
  finalizarRef.current = () => { void finalizar(); };

  useEffect(() => {
    if (estado !== 'calibrando') return;
    // Evita prender a tela se o navegador abrir o grafo mas não entregar PCM.
    const timer = setTimeout(() => {
      cancelar(false);
      setMensagem('Não recebemos áudio suficiente para calibrar. Tente novamente.');
      setOferecerSemLaudo(true);
      mudar('erro');
    }, 5000);
    return () => clearTimeout(timer);
  }, [cancelar, estado, mudar]);

  useEffect(() => {
    if (estado !== 'gravando') return;
    const timer = setInterval(() => {
      const ativa = modo.current === 'semLaudo' ? capturaSemLaudo : captura;
      if (!ativa.estaGravando()) {
        cancelar(true);
        return;
      }
      const tempo = Date.now() - inicio.current;
      setDecorrido(tempo);
      setNivel(ativa.nivelAtual());
      if (modo.current === 'semLaudo' && tempo >= TETO_DE_GRAVACAO_MS) finalizarRef.current();
    }, 100);
    return () => clearInterval(timer);
  }, [cancelar, captura, capturaSemLaudo, estado]);

  const compartilharAudio = async () => {
    if (!audio || compartilhamentoAtivo.current !== null) return;
    const atual = geracao.current;
    compartilhamentoAtivo.current = atual; setCompartilhando(true); setMensagemCompartilhamento('');
    try {
      const resultado = await compartilhamento.compartilhar(audio);
      if (atual !== geracao.current) return;
      setMensagemCompartilhamento(resultado === 'aberto' ? 'Opções de compartilhamento abertas.' : resultado === 'cancelado' ? 'Compartilhamento cancelado.' : resultado === 'indisponivel' ? 'Este aparelho não compartilha este arquivo. Você pode baixá-lo.' : 'Não foi possível compartilhar. Tente novamente ou baixe o arquivo.');
    } catch { if (atual === geracao.current) setMensagemCompartilhamento('Não foi possível compartilhar. Tente novamente ou baixe o arquivo.'); }
    finally { if (compartilhamentoAtivo.current === atual) compartilhamentoAtivo.current = null; if (atual === geracao.current) setCompartilhando(false); }
  };

  const baixarAudio = () => {
    if (!audio) return;
    try { setMensagemCompartilhamento(compartilhamento.baixar(audio) ? 'Download solicitado ao navegador.' : 'Não foi possível iniciar o download.'); }
    catch { setMensagemCompartilhamento('Não foi possível iniciar o download.'); }
  };

  const descartar = () => {
    cancelar(false);
    setAudio(null);
    setLaudo(null);
    setMensagem('');
    setMensagemCompartilhamento(''); setCompartilhando(false); compartilhamentoAtivo.current = null;
    setOferecerSemLaudo(false);
    setGravadoSemLaudo(false);
    setDecorrido(0);
    mudar('pronto');
  };

  return (
    <main className="arena-v2">
      <header className="arena-v2__cabecalho">
        <span className="arena-v2__marca">AUÊ<span>!</span></span>
        <nav aria-label="Navegação principal"><a href="/feed">Mural</a><a href="/comunidades">Comunidades</a></nav>
      </header>
      <div className="arena-v2__conteudo">
        <section className="arena-v2__desafio" aria-label="Seu desafio">
          <span>SEU DESAFIO</span><strong>CAPRICHE NO FÔLEGO</strong>
        </section>
        <section className="arena-v2__palco" aria-labelledby="arena-v2-titulo">
          <p className="arena-v2__identificador">ARENA DE ARROTOS <span>·</span> AO SEU COMANDO</p>
          <h1 id="arena-v2-titulo">O PALCO É <em>SEU.</em></h1>
          <p className="arena-v2__instrucao">Um toque. Um arroto. Uma atuação para a história.</p>
          {estado !== 'revisao' && (
            <button type="button" className="arena-v2__gatilho" disabled={estado === 'finalizando'} onClick={estado === 'permissao' || estado === 'calibrando' ? descartar : estado === 'gravando' ? () => void finalizar() : () => void iniciar()}>
              <span className="arena-v2__circulo" aria-hidden="true">{estado === 'gravando' || estado === 'calibrando' || estado === 'permissao' ? <svg viewBox="0 0 24 24"><rect x="6" y="6" width="12" height="12" rx="1" fill="currentColor" /></svg> : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="9" y="2" width="6" height="12" rx="3" /><path d="M5 11a7 7 0 0 0 14 0M12 18v4m-4 0h8" /></svg>}</span>
              <span>{estado === 'gravando' ? 'Finalizar gravação' : estado === 'calibrando' ? 'Cancelar gravação' : estado === 'permissao' ? 'Cancelar pedido' : estado === 'finalizando' ? 'Finalizando' : estado === 'erro' ? 'Tentar novamente' : 'Gravar meu arroto'}</span>
            </button>
          )}
          {estado === 'gravando' && <div className="arena-v2__medidor"><span>GRAVANDO</span><time>{formatarCronometro(decorrido)}</time><div className="arena-v2__onda" aria-hidden="true"><span style={{ transform: `scaleX(${Math.max(0.04, nivel)})` }} /></div>{decorrido >= AVISO_A_PARTIR_DE_MS && <p>Tempo quase esgotado.</p>}</div>}
          {estado === 'revisao' && audio && <div className="arena-v2__revisao"><h2>SUA GRAVAÇÃO</h2><p>Ouça sua tentativa. Você decide se quer compartilhar; ela não foi publicada no Auê.{!gravadoSemLaudo && ' A calibração não está neste áudio.'}</p><Player audio={audio} player={player} />
            {laudo?.estado === 'medido' ? <section className="arena-v2__laudo" aria-label="Laudo experimental"><h3>LAUDO EXPERIMENTAL</h3><dl><div><dt>Duração detectada</dt><dd>{laudo.duracaoAtivaSegundos.toFixed(2).replace('.', ',')} s</dd></div><div><dt>Potência relativa</dt><dd>{laudo.potenciaRelativa}/100</dd></div><div><dt>Frequência</dt><dd>Indisponível</dd></div></dl><p>Leitura experimental: aparelho e ambiente alteram os resultados. Potência não é volume físico.</p></section> : <p role="status">{gravadoSemLaudo ? 'Esta gravação não tem laudo nem nota.' : laudo?.estado === 'inconclusivo' ? falaDoLaudoInconclusivo(laudo.motivo) : 'Não foi possível medir esta tentativa.'}</p>}
            <button type="button" className="arena-v2__secundario" disabled={compartilhando} onClick={() => void compartilharAudio()}>{compartilhando ? 'Abrindo compartilhamento…' : 'Compartilhar áudio'}</button>
            <button type="button" className="arena-v2__secundario" onClick={baixarAudio}>Baixar áudio</button>
            {mensagemCompartilhamento && <p role="status">{mensagemCompartilhamento}</p>}
            {aoUsarTentativa && laudo?.estado === 'medido' && <button type="button" className="arena-v2__secundario" onClick={() => { if (player.current && !player.current.paused) player.current.pause(); aoUsarTentativa({ audio, duracaoMs: Math.round(laudo.duracaoAtivaSegundos * 1000) }); }}>{rotuloUsarTentativa}</button>}
            <button type="button" className="arena-v2__secundario" onClick={descartar}>Descartar e gravar outra</button></div>}
          {aoVoltar && <button type="button" className="arena-v2__secundario" onClick={() => { descartar(); aoVoltar(); }}>Voltar</button>}
          {mensagem && <p role="alert" className="arena-v2__erro">{mensagem}</p>}
          {estado === 'erro' && oferecerSemLaudo && <button type="button" className="arena-v2__secundario" onClick={() => void iniciarSemLaudo()}>Gravar sem laudo</button>}
          {(estado === 'pronto' || estado === 'erro') && <p className="arena-v2__privacidade">Sem cadastro. O microfone só liga quando você tocar. Com medição experimental, o áudio para ouvir começa após a calibração.</p>}
          {estado === 'permissao' && <p role="status">Aguardando permissão do microfone.</p>}
          {estado === 'calibrando' && <p role="status">Calibrando o ambiente. Um instante de silêncio.</p>}
          {estado === 'finalizando' && <p role="status">Preparando sua gravação.</p>}
        </section>
      </div>
      <footer className="arena-v2__rodape"><a href="/como-jogar">Como jogar</a><a href="/privacidade">Privacidade</a><a href="/termos">Termos</a></footer>
    </main>
  );
}
