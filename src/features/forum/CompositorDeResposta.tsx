import { useEffect, useId, useRef, useState, type KeyboardEvent, type RefObject } from 'react';
import { Link } from 'react-router-dom';
import { enderecoDoLoginComVolta } from '../../nucleo/comunidade/caminhoDeVolta';
import { LIMITE_RESPOSTA } from '../../nucleo/comunidade/limites';
import {
  erroDeEnvio,
  erroDoCampo,
  TEXTO_SEM_INTERNET,
  type ErroDeEnvio,
  type OperacaoDeEscrita,
} from '../../nucleo/forum/escrita';
import type { AnexoParaPublicar, ResultadoDaEscrita } from '../../portas/forum';
import { BotaoParticipar } from './AcoesDaComunidade';
import { CampoComContador } from './CampoComContador';
import { useDependenciasDoForum } from './contexto';
import { useAnunciar } from './encaixes';
import { useOnline } from './hooks';
import { useEnvio } from './useEnvio';
import { useParticiparDaComunidade } from './useParticiparDaComunidade';
import { AcessoriosDoComposer, type MidiaDoForum } from './MidiaDoForum';
import { LIMITE_DE_TEXTO_DA_PUBLICACAO } from './MidiaDoForum';

export type ResultadoDaConferencia = 'jaEsta' | 'naoEsta' | 'falhou';

interface Props {
  /** Nome acessível do campo ("Sua resposta", "Sua resposta a Bia Lima", "Editar resposta"). */
  readonly rotulo: string;
  /** "Enviar" ou "Salvar". */
  readonly rotuloDoEnvio: string;
  readonly operacao: Extract<OperacaoDeEscrita, 'resposta' | 'edicaoDeResposta'>;
  readonly texto: string;
  readonly aoMudarTexto: (novo: string) => void;
  /** Texto original (edição): igual a ele é "Você não mudou nada.", sem ir ao servidor. */
  readonly textoOriginal?: string;
  readonly enviar: (corpo: string, anexo: AnexoParaPublicar | null) => Promise<ResultadoDaEscrita<unknown>>;
  /** Só roda depois do `ok`. Devolve uma promessa quando ainda há o que ler do servidor: a trava só solta no fim. */
  readonly aoSucesso: (valor: unknown) => void | Promise<void>;
  /** Cancelar e Esc (só composer inline). Sem isso, não há "Cancelar". */
  readonly aoCancelar?: () => void;
  readonly comunidade: { readonly slug: string; readonly nome: string };
  readonly caminhoDeVolta: string;
  /** "Respondendo a @bia", acima do campo. */
  readonly referencia?: string | null;
  /** O campo ganha o foco ao montar (composer inline). */
  readonly focarAoMontar?: boolean;
  /** Verde só no composer principal: o inline usa o botão escuro (um verde por estado). */
  readonly acento?: boolean;
  readonly campoRef?: RefObject<HTMLInputElement | HTMLTextAreaElement | null>;
  /** O servidor disse que o estado do tópico mudou (fechado, sumiu): a tela relê. O texto fica guardado. */
  readonly aoEstadoDoTopicoMudar?: (acao: 'topicoFechado' | 'topicoIndisponivel') => void;
  /** Falha ambígua: relê a conversa e diz se uma resposta igual do próprio autor já está lá. */
  readonly aoConferir?: (texto: string) => Promise<ResultadoDaConferencia>;
  /** Falha ambígua: joga o texto fora (a pessoa viu que já apareceu). */
  readonly aoDescartar?: () => void;
  /** `pai_invalido`: move o texto para o composer principal. */
  readonly aoResponderNoTopico?: () => void;
  readonly aoMudarParticipacao?: () => void;
  /** Edição não troca mídia: a RPC atual só altera o texto. */
  readonly aceitarAnexos?: boolean;
  /** Ponte opcional para o gravador da plataforma; a UI nunca toca em MediaRecorder. */
  readonly aoGravarAudio?: () => Promise<{ readonly arquivo: Blob; readonly duracaoMs: number } | null>;
}

/**
 * O composer de resposta (spec 9.5): principal no fim da conversa e inline sob uma
 * resposta. Texto controlado por quem usa (o rascunho é de quem usa). Nunca fixo na
 * tela: no iPhone o teclado o cobriria. O texto só sai do campo depois do `ok`.
 */
export function CompositorDeResposta({
  rotulo,
  rotuloDoEnvio,
  operacao,
  texto,
  aoMudarTexto,
  textoOriginal,
  enviar: enviarCorpo,
  aoSucesso,
  aoCancelar,
  comunidade,
  caminhoDeVolta,
  referencia,
  focarAoMontar,
  acento = true,
  campoRef,
  aoEstadoDoTopicoMudar,
  aoConferir,
  aoDescartar,
  aoResponderNoTopico,
  aoMudarParticipacao,
  aceitarAnexos = operacao === 'resposta',
  aoGravarAudio,
}: Props) {
  const { ambiente, forum } = useDependenciasDoForum();
  const anunciar = useAnunciar();
  const online = useOnline(ambiente);
  const { enviando, enviar, liberar } = useEnvio();
  const participar = useParticiparDaComunidade(comunidade, aoMudarParticipacao);
  const id = useId();
  const interno = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);
  const campo = campoRef ?? interno;
  const [erroLocalDoCampo, setErroDoCampo] = useState<string | null>(null);
  const [erroDoServidor, setErroDoServidor] = useState<ErroDeEnvio | null>(null);
  // Depois de "Conferir": a resposta já está lá (não reenviar) ou não achamos (a pessoa decide).
  const [conferencia, setConferencia] = useState<'jaEsta' | 'naoEsta' | null>(null);
  const [conferindo, setConferindo] = useState(false);
  const [midia, setMidia] = useState<MidiaDoForum | null>(null);
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [audio, setAudio] = useState<{ readonly arquivo: Blob; readonly duracaoMs: number } | null>(null);
  const gravacao = useRef<ReturnType<NonNullable<typeof forum.criarGravacaoLivreDoForum>> | null>(null);
  const [gravando, setGravando] = useState(false);

  useEffect(() => {
    if (!focarAoMontar) return;
    campo.current?.focus();
    ambiente.centralizarCampo(`${id}-campo`);
  }, [focarAoMontar, campo, ambiente, id]);

  async function aoEnviar(e: { preventDefault: () => void }) {
    e.preventDefault();
    if (enviando) return;
    const limiteDoComposer = operacao === 'resposta' ? LIMITE_DE_TEXTO_DA_PUBLICACAO : LIMITE_RESPOSTA;
    const erroLocal = texto.trim() === ''
      ? (midia ? null : 'Falta a resposta ou um anexo.')
      : erroDoCampo(texto, limiteDoComposer, 'Falta a resposta.');
    setErroDoCampo(erroLocal);
    if (erroLocal) return void campo.current?.focus();
    if (textoOriginal !== undefined && texto.trim() === textoOriginal.trim()) {
      setErroDoServidor(erroDeEnvio('nadaParaEditar', operacao));
      return;
    }
    if (!online) {
      setErroDoServidor({ texto: TEXTO_SEM_INTERNET, onde: 'geral', acao: null, ambiguo: false });
      return;
    }
    setErroDoServidor(null);

    let anexo: AnexoParaPublicar | null = null;
    if (aceitarAnexos && (arquivo || audio)) {
      if (!forum.enviarAnexoDoForum) {
        setErroDoServidor({ texto: 'Anexo indisponível agora. Seu texto continua aqui.', onde: 'geral', acao: null, ambiguo: false });
        return;
      }
      const enviado = await forum.enviarAnexoDoForum(arquivo ? { tipo: 'imagem', arquivo } : { tipo: 'audio', arquivo: audio!.arquivo, duracaoMs: audio!.duracaoMs });
      if (!enviado.ok) {
        setErroDoServidor({ texto: 'Não deu pra enviar a imagem. Tenta de novo.', onde: 'geral', acao: null, ambiguo: enviado.motivo === 'semConfirmacao' });
        return;
      }
      anexo = enviado.valor;
    } else if (aceitarAnexos && midia?.tipo === 'video-externo') {
      anexo = { tipo: 'videoExterno', url: midia.urlOriginal };
    }
    const r = await enviar(() => enviarCorpo(texto.trim(), anexo), { travarSeOk: true });
    if (r === null) return;
    if (r.ok) {
      // O `ok` é do servidor: só agora o texto sai do campo.
      aoMudarTexto('');
      setMidia(null);
      setArquivo(null);
      setAudio(null);
      try {
        await aoSucesso(r.valor);
      } finally {
        liberar();
      }
      return;
    }
    const erro = erroDeEnvio(r.motivo, operacao);
    setErroDoServidor(erro);
    if (erro.onde === 'corpo') campo.current?.focus();
    if (erro.acao === 'topicoFechado' || erro.acao === 'topicoIndisponivel') aoEstadoDoTopicoMudar?.(erro.acao);
  }

  const aoTeclar = (e: KeyboardEvent<HTMLFormElement>) => {
    if (e.key === 'Escape' && aoCancelar) {
      e.preventDefault();
      e.stopPropagation();
      // Enviando, fechar esconderia o resultado: Esc é ignorado até a resposta chegar.
      if (!enviando) aoCancelar();
    }
  };

  const erroNoCampo = erroLocalDoCampo ?? (erroDoServidor?.onde === 'corpo' ? erroDoServidor.texto : null);
  const erroGeral = erroDoServidor && erroDoServidor.onde !== 'corpo' ? erroDoServidor : null;
  async function conferir() {
    if (!aoConferir || conferindo) return;
    setConferindo(true);
    const r = await aoConferir(texto);
    setConferindo(false);
    if (r === 'falhou') return;
    setConferencia(r);
  }

  const rotuloAtual = enviando ? 'Enviando…' : rotuloDoEnvio;
  const gravarAudio = async () => {
    if (gravando) {
      gravacao.current?.parar();
      return;
    }
    const executar = aoGravarAudio ?? (async () => {
      if (!forum.criarGravacaoLivreDoForum) {
        setErroDoServidor({ texto: 'Gravação indisponível agora.', onde: 'geral', acao: null, ambiguo: false });
        return null;
      }
      const nova = forum.criarGravacaoLivreDoForum();
      gravacao.current = nova;
      const inicio = await nova.iniciar();
      if (!inicio.ok) {
        const mensagem = inicio.motivo === 'negado' ? 'Libera o microfone para gravar áudio.' : inicio.motivo === 'inseguro' ? 'Para gravar áudio, abra o Auê em localhost ou HTTPS.' : inicio.motivo === 'indisponivel' ? 'Não achei um microfone disponível.' : 'Não deu pra iniciar a gravação.';
        setErroDoServidor({ texto: mensagem, onde: 'geral', acao: null, ambiguo: false });
        return null;
      }
      setGravando(true);
      const fim = await inicio.conclusao;
      setGravando(false);
      if (!fim.ok) {
        if (fim.motivo !== 'cancelado') setErroDoServidor({ texto: 'A gravação não deu certo. Tenta de novo.', onde: 'geral', acao: null, ambiguo: false });
        return null;
      }
      return { arquivo: fim.audio.dados, duracaoMs: fim.audio.duracaoMs };
    });
    const gravado = await executar();
    if (!gravado) return;
    setArquivo(null); setAudio(gravado);
    setMidia({ tipo: 'audio', url: '', duracaoEmSegundos: Math.round(gravado.duracaoMs / 1000) });
  };

  useEffect(() => () => gravacao.current?.cancelar(), []);

  return (
    <form className="forum-compositor" onSubmit={aoEnviar} onKeyDown={aoTeclar} noValidate>
      {referencia && <p className="forum-compositor__referencia">Respondendo a @{referencia}</p>}
      <CampoComContador
        id={`${id}-campo`}
        rotulo={rotulo}
        rotuloOculto
        tipo="area"
        linhas={2}
        linhasMaximas={8}
        meio={
          <>
          {erroGeral && (
            <div className="forum-form__alerta" role="alert">
              <p>{conferencia === 'jaEsta' ? 'Sua resposta já está na conversa.' : erroGeral.texto}</p>
              {erroGeral.acao === 'participar' && (
                <BotaoParticipar
                  pendente={participar.pendente === 'entrar'}
                  aoClicar={() => {
                    void participar.entrar().then((ok) => {
                      if (!ok) return;
                      setErroDoServidor(null);
                      anunciar(`Você entrou em ${comunidade.nome}. Pode enviar de novo.`);
                    });
                  }}
                  acento={false}
                />
              )}
              {erroGeral.acao === 'entrar' && (
                <Link className="forum-botao forum-botao--contorno" to={enderecoDoLoginComVolta(caminhoDeVolta, 'entrar')}>
                  Entrar
                </Link>
              )}
              {erroGeral.acao === 'responderNoTopico' && aoResponderNoTopico && (
                <button type="button" className="forum-botao forum-botao--contorno" onClick={aoResponderNoTopico}>
                  Responder no tópico
                </button>
              )}
              {erroGeral.acao === 'conferir' && (
                <div className="forum-form__alerta-acoes">
                  {aoConferir && conferencia !== 'jaEsta' && (
                    <button
                      type="button"
                      className="forum-botao forum-botao--contorno"
                      onClick={() => void conferir()}
                      aria-disabled={conferindo || undefined}
                    >
                      {conferindo ? 'Conferindo…' : 'Conferir a conversa'}
                    </button>
                  )}
                  {aoDescartar && (
                    <button type="button" className="forum-botao-texto" onClick={aoDescartar}>
                      Descartar texto
                    </button>
                  )}
                </div>
              )}
              {participar.erro && <p className="forum-campo__erro">{participar.erro}</p>}
            </div>
          )}
            {conferencia === 'naoEsta' && (
              <p className="forum-compositor__aviso" role="status">
                Conversa atualizada. Se sua resposta já está aí, descarta o texto.
              </p>
            )}
          </>
        }
        valor={texto}
        aoMudar={(novo) => {
          setConferencia(null);
          aoMudarTexto(novo);
          if (erroLocalDoCampo) setErroDoCampo(null);
          if (erroDoServidor && erroDoServidor.acao !== 'participar') setErroDoServidor(null);
        }}
        limite={operacao === 'resposta' ? LIMITE_DE_TEXTO_DA_PUBLICACAO : LIMITE_RESPOSTA}
        placeholder="Escreve sua resposta"
        erro={erroNoCampo}
        somenteLeitura={enviando}
        campoRef={campo}
        aoFocar={() => ambiente.centralizarCampo(`${id}-campo`)}
      />
      {aceitarAnexos && <AcessoriosDoComposer
        anexo={midia}
        bloqueado={enviando}
        gravando={gravando}
        aoMudarAnexo={(novo) => {
          setMidia(novo);
          setArquivo(null); setAudio(null);
        }}
        aoEscolherImagem={(novoArquivo) => {
          setArquivo(novoArquivo); setAudio(null);
          setMidia({ tipo: 'imagem', url: '', descricao: novoArquivo.name });
        }}
        aoPedirGravacao={forum.criarGravacaoLivreDoForum || aoGravarAudio ? () => { void gravarAudio(); } : undefined}
      />}
      {aceitarAnexos && arquivo && <p className="forum-compositor__aviso" role="status">Imagem pronta para enviar: {arquivo.name}</p>}
      {aceitarAnexos && audio && <p className="forum-compositor__aviso" role="status">Áudio de até um minuto pronto para enviar.</p>}
      {gravando && <p className="forum-compositor__aviso" role="status">Gravando áudio. Toque no microfone para parar.</p>}
      <div
        className="forum-compositor__acoes"
        // Tocar num botão não tira o foco do campo: sem blur, a barra inferior não volta por cima do botão antes do clique.
        onMouseDown={(e) => e.preventDefault()}
      >
        {aoCancelar && (
          <button type="button" className="forum-botao forum-botao--contorno" onClick={aoCancelar} disabled={enviando}>
            Cancelar
          </button>
        )}
        {conferencia !== 'jaEsta' && (
          <button
            type="submit"
            className={`forum-botao ${acento ? 'forum-botao--acento' : 'forum-botao--escuro'}`}
            aria-busy={enviando || undefined}
          >
            {rotuloAtual}
          </button>
        )}
      </div>
    </form>
  );
}
