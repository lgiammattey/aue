import { useCallback, useId, useRef, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { enderecoDoLoginComVolta } from '../../nucleo/comunidade/caminhoDeVolta';
import { LIMITE_TEXTO_TOPICO, LIMITE_TITULO_TOPICO } from '../../nucleo/comunidade/limites';
import { erroDeEnvio, erroDoCampo, TEXTO_SEM_INTERNET, type ErroDeEnvio } from '../../nucleo/forum/escrita';
import type { ResultadoDaEscrita } from '../../portas/forum';
import { BotaoParticipar } from './AcoesDaComunidade';
import { CampoComContador } from './CampoComContador';
import { Monograma } from './componentes';
import { useDependenciasDoForum } from './contexto';
import { DialogoDoForum } from './DialogoDoForum';
import { useAnunciar } from './encaixes';
import { useOnline } from './hooks';
import { useEnvio } from './useEnvio';
import { useParticiparDaComunidade } from './useParticiparDaComunidade';

export interface TextoDoTopico {
  readonly titulo: string;
  readonly corpo: string;
}

interface Props {
  /** `criar`: rascunho guardado, "Criar tópico". `editar`: valores do servidor, "Salvar", sem rascunho. */
  readonly modo: 'criar' | 'editar';
  readonly comunidade: { readonly slug: string; readonly nome: string };
  readonly inicial: TextoDoTopico;
  /** Cada tecla (só no modo criar: o rascunho). */
  readonly aoMudarTexto?: (texto: TextoDoTopico) => void;
  /** "Descartar rascunho" (só no modo criar). */
  readonly aoDescartar?: () => void;
  readonly enviar: (texto: TextoDoTopico) => Promise<ResultadoDaEscrita<unknown>>;
  /** Só roda depois do `ok` do servidor. */
  readonly aoSucesso: (valor: unknown) => void;
  /** Botão Cancelar e Esc. Nunca apaga o rascunho. */
  readonly aoCancelar: () => void;
  /** Depois de fechar: devolve o foco. */
  readonly aoFechar: () => void;
  /** Onde o link "Entrar" volta (a sessão caiu no meio). */
  readonly caminhoDeVolta: string;
  /** Falha ambígua ao criar: fecha, relê a lista e deixa a pessoa conferir. */
  readonly aoConferir?: () => void;
  /** Lê a comunidade de novo depois de entrar (números do servidor). */
  readonly aoMudarParticipacao?: () => void;
  /** O servidor disse que o tópico fechou ou sumiu: a tela relê o tópico. O texto continua no formulário. */
  readonly aoEstadoDoTopicoMudar?: () => void;
}

/**
 * O formulário de tópico (spec 10): criar e editar, no mesmo molde. `<dialog>` modal;
 * no celular é tela cheia, com a ação principal no cabeçalho (o teclado não a cobre).
 * Só fala com o que recebe por props: quem usa decide a RPC e o que fazer no sucesso.
 */
export function FormularioDeTopico({
  modo,
  comunidade,
  inicial,
  aoMudarTexto,
  aoDescartar,
  enviar: enviarTexto,
  aoSucesso,
  aoCancelar,
  aoFechar,
  caminhoDeVolta,
  aoConferir,
  aoMudarParticipacao,
  aoEstadoDoTopicoMudar,
}: Props) {
  const { ambiente } = useDependenciasDoForum();
  const anunciar = useAnunciar();
  const online = useOnline(ambiente);
  const { enviando, enviar } = useEnvio();
  const participar = useParticiparDaComunidade(comunidade, aoMudarParticipacao);

  const idBase = useId();
  const idDoTitulo = `${idBase}-titulo`;
  const idDoCorpo = `${idBase}-corpo`;
  const idDoDialogo = `${idBase}-h`;

  const [texto, setTexto] = useState<TextoDoTopico>(inicial);
  const [errosDoCampo, setErrosDoCampo] = useState<{ titulo: string | null; corpo: string | null }>({
    titulo: null,
    corpo: null,
  });
  const [erroDoServidor, setErroDoServidor] = useState<ErroDeEnvio | null>(null);
  const tituloRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);
  const corpoRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);
  const criando = modo === 'criar';

  const mudar = (parcial: Partial<TextoDoTopico>) => {
    const novo = { ...texto, ...parcial };
    setTexto(novo);
    aoMudarTexto?.(novo);
    if (parcial.titulo !== undefined && errosDoCampo.titulo) setErrosDoCampo((e) => ({ ...e, titulo: null }));
    if (parcial.corpo !== undefined && errosDoCampo.corpo) setErrosDoCampo((e) => ({ ...e, corpo: null }));
    if (erroDoServidor && erroDoServidor.acao !== 'participar') setErroDoServidor(null);
  };

  const descartar = () => {
    aoDescartar?.();
    setTexto({ titulo: '', corpo: '' });
    setErrosDoCampo({ titulo: null, corpo: null });
    setErroDoServidor(null);
    tituloRef.current?.focus();
  };

  async function aoEnviar(e: FormEvent) {
    e.preventDefault();
    if (enviando) return;
    const titulo = erroDoCampo(texto.titulo, LIMITE_TITULO_TOPICO, 'Falta o título.');
    // Tópico migrado pode não ter mensagem: editar só o título vale (o servidor só valida o corpo se ele vier).
    const corpoOpcional = !criando && inicial.corpo.trim() === '' && texto.corpo.trim() === '';
    const corpo = corpoOpcional ? null : erroDoCampo(texto.corpo, LIMITE_TEXTO_TOPICO, 'Falta a mensagem.');
    setErrosDoCampo({ titulo, corpo });
    if (titulo) return void tituloRef.current?.focus();
    if (corpo) return void corpoRef.current?.focus();
    if (!criando && texto.titulo.trim() === inicial.titulo.trim() && texto.corpo.trim() === inicial.corpo.trim()) {
      setErroDoServidor(erroDeEnvio('nadaParaEditar', 'edicaoDeTopico'));
      return;
    }
    if (!online) {
      setErroDoServidor({ texto: TEXTO_SEM_INTERNET, onde: 'geral', acao: null, ambiguo: false });
      return;
    }
    setErroDoServidor(null);

    const r = await enviar(() => enviarTexto({ titulo: texto.titulo.trim(), corpo: texto.corpo.trim() }), {
      travarSeOk: true,
    });
    if (r === null) return;
    if (r.ok) {
      aoSucesso(r.valor);
      return;
    }
    const erro = erroDeEnvio(r.motivo, criando ? 'topico' : 'edicaoDeTopico');
    setErroDoServidor(erro);
    if (erro.onde === 'titulo') tituloRef.current?.focus();
    else if (erro.onde === 'corpo') corpoRef.current?.focus();
    if (erro.acao === 'topicoFechado' || erro.acao === 'topicoIndisponivel') aoEstadoDoTopicoMudar?.();
  }

  const temTexto = texto.titulo !== '' || texto.corpo !== '';
  const erroGeral = erroDoServidor && erroDoServidor.onde === 'geral' ? erroDoServidor : null;
  const erroNoTitulo = errosDoCampo.titulo ?? (erroDoServidor?.onde === 'titulo' ? erroDoServidor.texto : null);
  const erroNoCorpo = errosDoCampo.corpo ?? (erroDoServidor?.onde === 'corpo' ? erroDoServidor.texto : null);
  const rotuloDoEnvio = enviando ? 'Enviando…' : criando ? 'Criar tópico' : 'Salvar';
  const tituloDoDialogo = criando ? 'Novo tópico' : 'Editar tópico';
  const cancelar = useCallback(() => aoCancelar(), [aoCancelar]);

  return (
    <DialogoDoForum
      idDoTitulo={idDoDialogo}
      classe="forum-dialogo--formulario"
      aoCancelar={cancelar}
      bloqueado={enviando}
      focoInicial={tituloRef}
      aoFechar={aoFechar}
    >
      <form className="forum-form" onSubmit={aoEnviar} noValidate>
        <div className="forum-form__cabecalho">
          <button type="button" className="forum-botao-texto forum-form__so-celular" onClick={cancelar} disabled={enviando}>
            Cancelar
          </button>
          <h2 id={idDoDialogo} className="forum-form__titulo">
            {tituloDoDialogo}
          </h2>
          <button
            type="submit"
            className="forum-botao forum-botao--acento forum-botao--pequeno forum-form__so-celular"
            aria-busy={enviando || undefined}
          >
            {rotuloDoEnvio}
          </button>
        </div>

        <div className="forum-form__corpo">
          <p className="forum-form__em">
            <Monograma nome={comunidade.nome} tamanho="mini" />
            <span>Em {comunidade.nome}</span>
          </p>

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
              {erroGeral.acao === 'verComunidades' && (
                <Link className="forum-botao forum-botao--contorno" to="/comunidades">
                  Ver comunidades
                </Link>
              )}
              {erroGeral.acao === 'conferir' && aoConferir && (
                <button type="button" className="forum-botao forum-botao--contorno" onClick={aoConferir}>
                  Conferir os tópicos
                </button>
              )}
              {participar.erro && <p className="forum-campo__erro">{participar.erro}</p>}
            </div>
          )}

          <CampoComContador
            id={idDoTitulo}
            rotulo="Título"
            tipo="linha"
            valor={texto.titulo}
            aoMudar={(titulo) => mudar({ titulo })}
            limite={LIMITE_TITULO_TOPICO}
            placeholder="Sobre o que é a conversa?"
            enterKeyHint="next"
            aoEnter={() => corpoRef.current?.focus()}
            erro={erroNoTitulo}
            somenteLeitura={enviando}
            campoRef={tituloRef}
          />
          <CampoComContador
            id={idDoCorpo}
            rotulo="Mensagem"
            tipo="area"
            linhas={6}
            valor={texto.corpo}
            aoMudar={(corpo) => mudar({ corpo })}
            limite={LIMITE_TEXTO_TOPICO}
            placeholder="Conta o que rolou ou o que você quer perguntar."
            erro={erroNoCorpo}
            somenteLeitura={enviando}
            campoRef={corpoRef}
            aoFocar={() => ambiente.centralizarCampo(idDoCorpo)}
          />

          {criando && temTexto && aoDescartar && (
            <button type="button" className="forum-botao-texto" onClick={descartar} disabled={enviando}>
              Descartar rascunho
            </button>
          )}
        </div>

        <div className="forum-form__rodape forum-form__so-desktop">
          <button type="button" className="forum-botao forum-botao--contorno" onClick={cancelar} disabled={enviando}>
            Cancelar
          </button>
          <button
            type="submit"
            className="forum-botao forum-botao--acento"
            aria-busy={enviando || undefined}
          >
            {rotuloDoEnvio}
          </button>
        </div>
      </form>
    </DialogoDoForum>
  );
}
