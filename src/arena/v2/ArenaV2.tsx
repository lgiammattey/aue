import { useCallback, useEffect, useRef, useState, type RefObject, type ReactNode } from 'react';
import type { CapturaPcmV2, FalhaCapturaPcmV2 } from '../../portas/capturaPcmV2';
import type { CapturaDeAudio } from '../../portas/captura';
import type { CompartilhamentoDeAudio } from '../../portas/compartilhamentoDeAudio';
import type { TelemetriaArenaV2 } from '../../portas/telemetriaArenaV2';
import { criarCompartilhamentoDeAudioWeb } from '../../plataforma/web/compartilhamentoDeAudio';
import { criarCapturaWeb } from '../../plataforma/web/captura';
import { criarCapturaPcmV2 } from '../../plataforma/web/capturaPcmV2';
import { wavDaEmissao } from '../../plataforma/web/wavDaEmissao';
import { criarCicloDeVidaWeb } from '../../plataforma/web/cicloDeVida';
import { criarEnderecoLocal, soltarEnderecoLocal } from '../../plataforma/web/enderecoDeAudio';
import { PlayerDeAudio } from './PlayerDeAudio';
import { AdsterraBanner300x250 } from '../../shared/components/AdsterraBanner300x250';
import { AVISO_A_PARTIR_DE_MS, TETO_DE_GRAVACAO_MS, formatarCronometro } from '../../nucleo/gravacao/regras';
import { calcularLaudoExperimental, type LaudoExperimental, type MotivoDeLaudoInconclusivo } from '../../nucleo/julgamento/laudoExperimental';
import { TEXTOS_DA_ARENA, type Idioma, type TextosDaArena } from './textos';
import './arenaV2.css';

interface TentativaDoDuelo { readonly audio: Blob; readonly duracaoMs: number }

type Estado = 'pronto' | 'permissao' | 'calibrando' | 'gravando' | 'finalizando' | 'revisao' | 'erro';

interface Props {
  /** Permite verificar o ciclo sem abrir o microfone nos testes. */
  captura?: CapturaPcmV2;
  capturaSemLaudo?: CapturaDeAudio;
  compartilhamentoDeAudio?: CompartilhamentoDeAudio;
  telemetria?: TelemetriaArenaV2;
  aoUsarTentativa?: (tentativa: TentativaDoDuelo) => void;
  rotuloUsarTentativa?: string;
  aoVoltar?: () => void;
  aoAbrirMeusDesafios?: () => void;
  /** Conteúdo da home; desmontado enquanto a Arena está em uso. */
  conteudoDoRepouso?: ReactNode;
  /** Ranking da Liga exibido dentro do próprio Hero quando em repouso. */
  rankingDoHero?: ReactNode;
  /** Conteúdo opcional que só entra depois da pessoa revisar o resultado. */
  conteudoAposResultado?: ReactNode;
  readonly adversarioHandle?: string | null;
  /** Quando true, renderiza módulo compacto expansível na Home sem duplicar `<main>` nem `<h1>`. */
  readonly modoEmbutido?: boolean;
  /** Aplica a composição aprovada para a M05 sem alterar quem ainda consome a Arena anterior. */
  readonly experienciaM05?: boolean;
  /** Permite publicar explicitamente o áudio gravado no Mural (somente sob ação do usuário). */
  readonly aoPublicarAudio?: (audio: Blob, nota: number | null, duracaoMs: number) => void;
  /** O idioma segue a rota (`/en` fala inglês). Sem a prop, a Arena fala português. */
  readonly idioma?: Idioma;
}

function Player({ audio, player, t }: { audio: Blob; player: RefObject<HTMLAudioElement | null>; t: TextosDaArena }) {
  const [endereco, setEndereco] = useState<string | null>(null);
  useEffect(() => {
    const url = criarEnderecoLocal(audio);
    setEndereco(url);
    return () => soltarEnderecoLocal(url);
  }, [audio]);
  return endereco ? <PlayerDeAudio endereco={endereco} rotulo={t.playerRotulo} textos={t.player} mediaRef={player} /> : null;
}

function falaDaFalha(t: TextosDaArena, motivo: FalhaCapturaPcmV2): string {
  switch (motivo) {
    case 'permissao_negada': return t.falha.permissaoNegada;
    case 'microfone_indisponivel': return t.falha.microfoneIndisponivel;
    case 'pcm_indisponivel': return t.falha.pcmIndisponivel;
    case 'limite_excedido': return t.falha.limiteExcedido;
    case 'cancelada': return t.falha.cancelada;
    default: return t.falha.padrao;
  }
}

function falaDoLaudoInconclusivo(t: TextosDaArena, motivo: MotivoDeLaudoInconclusivo): string {
  switch (motivo) {
    case 'clipping': return t.inconclusivo.clipping;
    case 'ambiente_alto': return t.inconclusivo.ambienteAlto;
    case 'ambiente_instavel': return t.inconclusivo.ambienteInstavel;
    case 'ambiente_inaudivel':
    case 'ambiente_insuficiente': return t.inconclusivo.ambienteNaoMedido;
    case 'emissao_insuficiente': return t.inconclusivo.emissaoInsuficiente;
    default: return t.inconclusivo.padrao;
  }
}

/** Primeira versão local: a gravação e o laudo ainda não são publicados. */
export function ArenaV2({
  captura: capturaInjetada,
  capturaSemLaudo: capturaSemLaudoInjetada,
  compartilhamentoDeAudio: compartilhamentoInjetado,
  telemetria,
  aoUsarTentativa,
  rotuloUsarTentativa = 'Continuar',
  aoVoltar,
  aoAbrirMeusDesafios,
  conteudoDoRepouso,
  rankingDoHero,
  conteudoAposResultado,
  adversarioHandle,
  modoEmbutido = false,
  experienciaM05 = false,
  aoPublicarAudio,
  idioma = 'pt',
}: Props) {
  const t = TEXTOS_DA_ARENA[idioma];
  const adversarioLimpo = adversarioHandle?.trim().replace(/^@/, '') ?? '';
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
  const [duracaoMsDaGravacao, setDuracaoMsDaGravacao] = useState(0);
  const player = useRef<HTMLAudioElement | null>(null);
  const [laudo, setLaudo] = useState<LaudoExperimental | null>(null);
  const [mensagem, setMensagem] = useState('');
  const [oferecerSemLaudo, setOferecerSemLaudo] = useState(false);
  const [gravadoSemLaudo, setGravadoSemLaudo] = useState(false);
  const aberturaRegistrada = useRef(false);
  useEffect(() => { if (!aberturaRegistrada.current) { aberturaRegistrada.current = true; telemetria?.registrar('abriu_arena_v2'); } }, [telemetria]);

  useEffect(() => {
    if (estado === 'erro') telemetria?.registrar('falhou_gravacao');
  }, [estado, telemetria]);

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
      setMensagem(t.interrompida);
      mudar('erro');
    }
  }, [captura, capturaSemLaudo, mudar, t]);

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
          if (pedido !== geracao.current || calibrada) return;
          calibrada = true;
          inicio.current = Date.now();
          mudar('gravando');
          telemetria?.registrar('iniciou_gravacao');
        },
        aoLimite: () => {
          if (pedido === geracao.current) finalizarRef.current();
        },
        aoErro: (motivo) => {
          if (pedido !== geracao.current) return;
          geracao.current += 1;
          captura.cancelar();
          setNivel(0);
          setMensagem(falaDaFalha(t, motivo));
          setOferecerSemLaudo(motivo === 'pcm_indisponivel');
          mudar('erro');
        },
      });
      if (pedido !== geracao.current) return;
      if (!resposta.ok) {
        captura.cancelar();
        setMensagem(falaDaFalha(t, resposta.motivo));
        setOferecerSemLaudo(resposta.motivo === 'pcm_indisponivel');
        mudar('erro');
        return;
      }
      // O callback pode chegar antes da resolução em implementações futuras.
      if (!calibrada) mudar('calibrando');
    } catch {
      if (pedido !== geracao.current) return;
      captura.cancelar();
      setMensagem(t.naoAbriuMicrofone);
      mudar('erro');
    }
  }, [captura, capturaSemLaudo, mudar, t, telemetria]);

  const iniciarSemLaudo = useCallback(async () => {
    if (estadoRef.current !== 'erro') return;
    const pedido = ++geracao.current;
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
        setMensagem(resposta.motivo === 'negado' ? t.falha.permissaoNegada : t.naoAbriuMicrofone);
        setOferecerSemLaudo(true);
        mudar('erro');
        return;
      }
      if (!capturaSemLaudo.comecar()) {
        capturaSemLaudo.soltar();
        setMensagem(t.naoIniciouGravacao);
        setOferecerSemLaudo(true);
        mudar('erro');
        return;
      }
      inicio.current = Date.now();
      setGravadoSemLaudo(true);
      mudar('gravando');
      telemetria?.registrar('iniciou_gravacao');
    } catch {
      if (pedido !== geracao.current) return;
      capturaSemLaudo.soltar();
      setMensagem(t.naoAbriuMicrofone);
      setOferecerSemLaudo(true);
      mudar('erro');
    }
  }, [captura, capturaSemLaudo, mudar, t, telemetria]);

  const finalizar = useCallback(async () => {
    if (estadoRef.current !== 'gravando') return;
    const pedido = geracao.current;
    mudar('finalizando');
    try {
      if (modo.current === 'semLaudo') {
        const resultado = await capturaSemLaudo.parar();
        if (pedido !== geracao.current) return;
        if ('motivo' in resultado || resultado.dados.size === 0) {
          setMensagem(t.naoConcluiuGravacao);
          setOferecerSemLaudo(true);
          mudar('erro');
          return;
        }
        setAudio(resultado.dados);
        setDuracaoMsDaGravacao(resultado.duracaoMs);
        setLaudo(null);
        mudar('revisao');
        telemetria?.registrar('concluiu_gravacao');
        telemetria?.registrar('laudo_indisponivel');
        return;
      }
      const resultado = await captura.parar();
      if (pedido !== geracao.current) return;
      if (!resultado.ok || resultado.audio.size === 0) {
        setMensagem(resultado.ok ? t.naoConcluiuGravacao : falaDaFalha(t, resultado.motivo));
        setOferecerSemLaudo(!resultado.ok && resultado.motivo === 'pcm_indisponivel');
        mudar('erro');
        return;
      }
      const audioDaTentativa = wavDaEmissao(resultado.emissao, resultado.sampleRate);
      setAudio(audioDaTentativa);
      setDuracaoMsDaGravacao(Math.round((resultado.emissao.length / resultado.sampleRate) * 1000));
      const laudoCalculado = calcularLaudoExperimental(resultado.ambiente, resultado.emissao, resultado.sampleRate);
      setLaudo(laudoCalculado);
      mudar('revisao');
      telemetria?.registrar('concluiu_gravacao');
      telemetria?.registrar(laudoCalculado.estado === 'medido' ? 'laudo_disponivel' : 'laudo_indisponivel');
    } catch {
      if (pedido !== geracao.current) return;
      captura.cancelar();
      capturaSemLaudo.soltar();
      setMensagem(t.naoConcluiuGravacao);
      mudar('erro');
    }
  }, [captura, capturaSemLaudo, mudar, t, telemetria]);
  finalizarRef.current = () => { void finalizar(); };

  useEffect(() => {
    if (estado !== 'calibrando') return;
    const timer = setTimeout(() => {
      cancelar(false);
      setMensagem(t.calibracaoSemAudio);
      setOferecerSemLaudo(true);
      mudar('erro');
    }, 5000);
    return () => clearTimeout(timer);
  }, [cancelar, estado, mudar, t]);

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
      if (resultado === 'aberto') telemetria?.registrar('abriu_compartilhamento_audio');
      setMensagemCompartilhamento(resultado === 'aberto' ? t.compartilhamento.aberto : resultado === 'cancelado' ? t.compartilhamento.cancelado : resultado === 'indisponivel' ? t.compartilhamento.indisponivel : t.compartilhamento.falhou);
    } catch { if (atual === geracao.current) setMensagemCompartilhamento(t.compartilhamento.falhou); }
    finally { if (compartilhamentoAtivo.current === atual) compartilhamentoAtivo.current = null; if (atual === geracao.current) setCompartilhando(false); }
  };

  const baixarAudio = () => {
    if (!audio) return;
    try { const solicitado = compartilhamento.baixar(audio); if (solicitado) telemetria?.registrar('solicitou_download_audio'); setMensagemCompartilhamento(solicitado ? t.download.solicitado : t.download.falhou); }
    catch { setMensagemCompartilhamento(t.download.falhou); }
  };

  const descartar = () => {
    cancelar(false);
    setAudio(null);
    setDuracaoMsDaGravacao(0);
    setLaudo(null);
    setMensagem('');
    setMensagemCompartilhamento(''); setCompartilhando(false); compartilhamentoAtivo.current = null;
    setOferecerSemLaudo(false);
    setGravadoSemLaudo(false);
    setDecorrido(0);
    mudar('pronto');
  };

  const Titulo = modoEmbutido || experienciaM05 ? 'h2' : 'h1';
  const tituloTexto = estado === 'revisao'
    ? t.titulo.revisao
    : estado === 'gravando'
      ? t.titulo.gravando
      : t.titulo.pronto;

  const rotuloGatilho = estado === 'gravando'
    ? t.gatilho.gravando
    : estado === 'calibrando'
      ? t.gatilho.calibrando
      : estado === 'permissao'
        ? t.gatilho.permissao
        : estado === 'finalizando'
          ? t.gatilho.finalizando
          : estado === 'erro'
            ? t.gatilho.erro
            : t.gatilho.pronto;

  const palco = (
    <section className="arena-v2__palco" aria-labelledby="arena-v2-titulo">
      <div className="arena-v2__cabecalho-modulo">
        <p className="arena-v2__identificador">
          <span className="arena-v2__pulso" aria-hidden="true" />
          {t.identificador}
        </p>
        {modoEmbutido && (
          <div className="arena-v2__atalhos-modulo">
            {aoAbrirMeusDesafios && (estado === 'pronto' || estado === 'erro') && (
              <button type="button" className="arena-v2__link-tatico" onClick={aoAbrirMeusDesafios}>
                {t.meusDesafios}
              </button>
            )}
            {t.telaCheia && (
              <a className="arena-v2__link-tatico" href="/arena">
                {t.telaCheia}
              </a>
            )}
          </div>
        )}
      </div>

      <div className={`arena-v2__linha-topo${modoEmbutido && estado === 'pronto' ? ' is-compacta' : ''}`}>
        <div className="arena-v2__chamada">
          <Titulo id="arena-v2-titulo">{tituloTexto}</Titulo>
          {(estado === 'pronto' || estado === 'erro') && (adversarioLimpo || !modoEmbutido) && (
            <p className="arena-v2__instrucao">
              {adversarioLimpo ? t.instrucaoX1(adversarioLimpo) : t.instrucao}
            </p>
          )}
        </div>

        {estado !== 'revisao' && (
          <button
            type="button"
            className="arena-v2__gatilho"
            disabled={estado === 'finalizando'}
            onClick={estado === 'permissao' || estado === 'calibrando'
              ? descartar
              : estado === 'gravando'
                ? () => void finalizar()
                : () => void iniciar()}
          >
            <span className="arena-v2__circulo" aria-hidden="true">
              {estado === 'gravando' || estado === 'calibrando' || estado === 'permissao' ? (
                <svg viewBox="0 0 24 24"><rect x="6" y="6" width="12" height="12" rx="1" fill="currentColor" /></svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                  <rect x="9" y="2" width="6" height="12" rx="3" />
                  <path d="M5 11a7 7 0 0 0 14 0M12 18v4m-4 0h8" />
                </svg>
              )}
            </span>
            <span>{rotuloGatilho}</span>
          </button>
        )}
      </div>

      {estado === 'gravando' && (
        <div className="arena-v2__medidor">
          <span>{t.gravandoRotulo}</span>
          <time>{formatarCronometro(decorrido)}</time>
          <div className="arena-v2__onda" aria-hidden="true" style={{ opacity: 0.45 + Math.min(1, Math.max(0, nivel)) * 0.55 }} />
          {decorrido >= AVISO_A_PARTIR_DE_MS && <p>{t.tempoQuaseEsgotado}</p>}
        </div>
      )}

      {estado === 'revisao' && audio && (
        <div className="arena-v2__revisao">
          <div className="arena-v2__revisao-cabeca">
            <h3>{t.revisao.titulo}</h3>
            <p>
              {t.revisao.texto}
              {!gravadoSemLaudo && t.revisao.calibracaoAusente}
            </p>
          </div>
          <Player audio={audio} player={player} t={t} />

          {laudo?.estado === 'medido' ? (
            <section className="arena-v2__laudo" aria-label={t.laudo.aria}>
              <h3>{t.laudo.titulo}</h3>
              <dl>
                <div className="arena-v2__nota">
                  <dt>{t.laudo.nota}</dt>
                  <dd>
                    <span className="audio-com-nota__nota" role="img" aria-label={t.laudo.notaAria(laudo.nota)}>
                      {laudo.nota}
                    </span>
                    <span>/100</span>
                  </dd>
                </div>
                <div className="arena-v2__duracao">
                  <dt>{t.laudo.duracao}</dt>
                  <dd>{t.laudo.duracaoValor(laudo.duracaoAtivaSegundos)}</dd>
                </div>
                <div>
                  <dt>{t.laudo.potencia}</dt>
                  <dd>{laudo.potenciaRelativa}/100</dd>
                </div>
                <div>
                  <dt>{t.laudo.frequencia}</dt>
                  <dd>{t.laudo.indisponivel}</dd>
                </div>
              </dl>
              <p>{t.laudo.aviso}</p>
            </section>
          ) : (
            <p className="arena-v2__status-texto" role="status">
              {gravadoSemLaudo
                ? t.laudo.semLaudo
                : laudo?.estado === 'inconclusivo'
                  ? falaDoLaudoInconclusivo(t, laudo.motivo)
                  : t.laudo.naoMedida}
            </p>
          )}

          {aoUsarTentativa && (
            <>
              <button
                type="button"
                className="arena-v2__desafiar"
                disabled={laudo?.estado !== 'medido'}
                onClick={() => {
                  if (laudo?.estado !== 'medido') return;
                  if (player.current && !player.current.paused) player.current.pause();
                  aoUsarTentativa({ audio, duracaoMs: Math.round(laudo.duracaoAtivaSegundos * 1000) });
                }}
              >
                {rotuloUsarTentativa}
              </button>
              {laudo?.estado !== 'medido' && (
                <p className="arena-v2__duelo-aviso">{t.continuarDesafio}</p>
              )}
            </>
          )}

          <div className="arena-v2__acoes-revisao">
            {aoPublicarAudio && (
              <button
                type="button"
                className="arena-v2__secundario arena-v2__secundario--destaque"
                onClick={() => {
                  if (player.current && !player.current.paused) player.current.pause();
                  aoPublicarAudio(audio, laudo?.estado === 'medido' ? laudo.nota : null, duracaoMsDaGravacao);
                }}
              >
                {t.publicarNoMural}
              </button>
            )}
            <button type="button" className="arena-v2__secundario" disabled={compartilhando} onClick={() => void compartilharAudio()}>
              {compartilhando ? t.compartilhando : t.compartilhar}
            </button>
            <button type="button" className="arena-v2__secundario" onClick={baixarAudio}>
              {t.baixar}
            </button>
            <button type="button" className="arena-v2__secundario" onClick={descartar}>
              {t.descartar}
            </button>
          </div>
          {mensagemCompartilhamento && <p className="arena-v2__status-texto" role="status">{mensagemCompartilhamento}</p>}
          {!modoEmbutido && !experienciaM05 && <AdsterraBanner300x250 />}
          {conteudoAposResultado}
        </div>
      )}

      {aoVoltar && (
        <button type="button" className="arena-v2__secundario" onClick={() => { descartar(); aoVoltar(); }}>
          {t.voltar}
        </button>
      )}
      {mensagem && <p role="alert" className="arena-v2__erro">{mensagem}</p>}
      {estado === 'erro' && oferecerSemLaudo && (
        <button type="button" className="arena-v2__secundario" onClick={() => void iniciarSemLaudo()}>
          {t.gravarSemLaudo}
        </button>
      )}
      {estado === 'pronto' && aoUsarTentativa && !modoEmbutido && (
        <p className="arena-v2__duelo-dica">
          {t.dicaDuelo(rotuloUsarTentativa === 'Criar desafio')}
        </p>
      )}
      {(estado === 'pronto' || estado === 'erro') && (
        <p className="arena-v2__privacidade">
          {modoEmbutido ? t.privacidade.embutida : t.privacidade.completa}
        </p>
      )}
      {estado === 'permissao' && <p className="arena-v2__status-texto" role="status">{t.status.permissao}</p>}
      {estado === 'calibrando' && <p className="arena-v2__status-texto" role="status">{t.status.calibrando}</p>}
      {estado === 'finalizando' && <p className="arena-v2__status-texto" role="status">{t.status.finalizando}</p>}
      {estado === 'pronto' && rankingDoHero}
    </section>
  );

  if (modoEmbutido) {
    return (
      <section className={`arena-v2 arena-v2--embutida arena-v2--${estado}`} aria-label={t.arenaAria}>
        {palco}
      </section>
    );
  }

  return (
    <main className={`arena-v2 arena-v2--${estado}${experienciaM05 ? ' arena-v2--m05' : ''}`}>
      <header className="arena-v2__cabecalho">
        <div className="arena-v2__identidade">
          <a href="/" className="arena-v2__marca">AUÊ<span>!</span></a>
          <span className="arena-v2__beta">{t.beta}</span>
        </div>
        <nav aria-label={t.cabecalho.navegacaoAria}>
          {t.cabecalho.itens.map((item) => <a key={item.href} href={item.href}>{item.rotulo}</a>)}
          {aoAbrirMeusDesafios && (estado === 'pronto' || estado === 'erro') && (
            <button type="button" onClick={aoAbrirMeusDesafios}>{t.meusDesafios}</button>
          )}
        </nav>
      </header>
      <div className="arena-v2__conteudo">
        {experienciaM05 && (
          <header className="arena-v2__cabecalho-m05">
            <p>O CLUBE DO ARROTO</p>
            <h1>Arrotar</h1>
          </header>
        )}
        <section className="arena-v2__desafio" aria-label={t.cabecalho.seuDesafioAria}>
          <span>{t.cabecalho.modoArena}</span>
          <strong>{adversarioLimpo ? t.cabecalho.contra(adversarioLimpo.toUpperCase()) : t.cabecalho.puxaOAr}</strong>
        </section>
        {palco}
        {estado === 'pronto' && conteudoDoRepouso}
      </div>
      <footer className="arena-v2__rodape">
        {t.rodape.map((item) => <a key={item.href} href={item.href}>{item.rotulo}</a>)}
      </footer>
    </main>
  );
}
