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
import type { ResultadoDaEscrita } from '../../portas/forum';
import { BotaoParticipar } from './AcoesDaComunidade';
import { CampoComContador } from './CampoComContador';
import { useDependenciasDoForum } from './contexto';
import { useAnunciar } from './encaixes';
import { useOnline } from './hooks';
import { useEnvio } from './useEnvio';
import { useParticiparDaComunidade } from './useParticiparDaComunidade';

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
  readonly enviar: (corpo: string) => Promise<ResultadoDaEscrita<unknown>>;
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
  readonly aoEstadoDoTopicoMudar?: () => void;
  /** Falha ambígua: relê a conversa para a pessoa conferir. */
  readonly aoConferir?: () => void;
  /** Falha ambígua: joga o texto fora (a pessoa viu que já apareceu). */
  readonly aoDescartar?: () => void;
  /** `pai_invalido`: move o texto para o composer principal. */
  readonly aoResponderNoTopico?: () => void;
  readonly aoMudarParticipacao?: () => void;
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
}: Props) {
  const { ambiente } = useDependenciasDoForum();
  const anunciar = useAnunciar();
  const online = useOnline(ambiente);
  const { enviando, enviar, liberar } = useEnvio();
  const participar = useParticiparDaComunidade(comunidade, aoMudarParticipacao);
  const id = useId();
  const interno = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);
  const campo = campoRef ?? interno;
  const [erroLocalDoCampo, setErroDoCampo] = useState<string | null>(null);
  const [erroDoServidor, setErroDoServidor] = useState<ErroDeEnvio | null>(null);

  useEffect(() => {
    if (!focarAoMontar) return;
    campo.current?.focus();
    ambiente.centralizarCampo(`${id}-campo`);
  }, [focarAoMontar, campo, ambiente, id]);

  async function aoEnviar(e: { preventDefault: () => void }) {
    e.preventDefault();
    if (enviando) return;
    const erroLocal = erroDoCampo(texto, LIMITE_RESPOSTA, 'Falta a resposta.');
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

    const r = await enviar(() => enviarCorpo(texto.trim()), { travarSeOk: true });
    if (r === null) return;
    if (r.ok) {
      // O `ok` é do servidor: só agora o texto sai do campo.
      aoMudarTexto('');
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
    if (erro.acao === 'topicoFechado' || erro.acao === 'topicoIndisponivel') aoEstadoDoTopicoMudar?.();
  }

  const aoTeclar = (e: KeyboardEvent<HTMLFormElement>) => {
    if (e.key === 'Escape' && aoCancelar) {
      e.preventDefault();
      e.stopPropagation();
      aoCancelar();
    }
  };

  const erroNoCampo = erroLocalDoCampo ?? (erroDoServidor?.onde === 'corpo' ? erroDoServidor.texto : null);
  const erroGeral = erroDoServidor && erroDoServidor.onde !== 'corpo' ? erroDoServidor : null;
  const rotuloAtual = enviando ? 'Enviando…' : rotuloDoEnvio;

  return (
    <form className="forum-compositor" onSubmit={aoEnviar} onKeyDown={aoTeclar} noValidate>
      {referencia && <p className="forum-compositor__referencia">Respondendo a @{referencia}</p>}
      {erroGeral && (
        <div className="forum-form__alerta" role="alert">
          <p>{erroGeral.texto}</p>
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
              {aoConferir && (
                <button type="button" className="forum-botao forum-botao--contorno" onClick={aoConferir}>
                  Conferir a conversa
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
      <CampoComContador
        id={`${id}-campo`}
        rotulo={rotulo}
        tipo="area"
        linhas={2}
        linhasMaximas={8}
        valor={texto}
        aoMudar={(novo) => {
          aoMudarTexto(novo);
          if (erroLocalDoCampo) setErroDoCampo(null);
          if (erroDoServidor && erroDoServidor.acao !== 'participar') setErroDoServidor(null);
        }}
        limite={LIMITE_RESPOSTA}
        placeholder="Escreve sua resposta"
        erro={erroNoCampo}
        somenteLeitura={enviando}
        campoRef={campo}
        aoFocar={() => ambiente.centralizarCampo(`${id}-campo`)}
      />
      <div className="forum-compositor__acoes">
        {aoCancelar && (
          <button type="button" className="forum-botao forum-botao--contorno" onClick={aoCancelar}>
            Cancelar
          </button>
        )}
        <button
          type="submit"
          className={`forum-botao ${acento ? 'forum-botao--acento' : 'forum-botao--escuro'}`}
          aria-busy={enviando || undefined}
        >
          {rotuloAtual}
        </button>
      </div>
    </form>
  );
}
