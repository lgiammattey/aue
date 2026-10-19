import { useCallback, useId, useRef, useState, type FormEvent, type RefObject } from 'react';
import { Link, Navigate, useLocation, useNavigate, useOutletContext } from 'react-router-dom';
import { enderecoDoLoginComVolta } from '../../nucleo/comunidade/caminhoDeVolta';
import { LIMITE_TEXTO_TOPICO, LIMITE_TITULO_TOPICO } from '../../nucleo/comunidade/limites';
import { erroDeEnvio, erroDoCampo, TEXTO_SEM_INTERNET, type ErroDeEnvio } from '../../nucleo/forum/escrita';
import {
  apagarRascunho,
  guardarRascunhoDeTopico,
  lerRascunhoDeTopico,
} from '../../nucleo/forum/rascunho';
import { chaveDoRascunhoDeTopico } from '../../portas/armazenamento';
import type { ComunidadeDoForum } from '../../portas/forum';
import { BotaoParticipar } from './AcoesDaComunidade';
import { CampoComContador } from './CampoComContador';
import { Monograma } from './componentes';
import { useDependenciasDoForum } from './contexto';
import { DialogoDoForum } from './DialogoDoForum';
import { useAnunciar } from './encaixes';
import { enderecoDaComunidade, enderecoDoTopico } from './enderecos';
import { esquecerListasVistas, useOnline } from './hooks';
import { usePapel } from './papel';
import { useToast } from './toast';
import { useEnvio } from './useEnvio';
import { useParticiparDaComunidade } from './useParticiparDaComunidade';

/** O que `TelaComunidadeDoForum` entrega às rotas filhas (`<Outlet context>`). */
export interface ContextoDaComunidade {
  readonly comunidade: ComunidadeDoForum;
  readonly souMembro: boolean;
  /** O link "Novo tópico": quem fecha o dialog devolve o foco a ele. */
  readonly gatilho: RefObject<HTMLAnchorElement | null>;
  /** Lê a lista de tópicos de novo (depois de uma falha ambígua, "Conferir"). */
  readonly conferirLista: () => void;
  /** Lê o cabeçalho de novo, sem piscar (números do servidor). */
  readonly atualizarComunidade: () => void;
  /** Foco no H1 da comunidade: para onde o dialog volta se o gatilho não existe (abriu por URL direta). */
  readonly focarTitulo: () => void;
}

/**
 * Rota `/c/:slug/novo` (spec 10). Filha de `/c/:slug`: a lista fica por baixo e o
 * dialog abre por cima. Visitante, conta que não participa e quem ainda não
 * se sabe quem é nunca abrem o formulário: voltam para a comunidade, onde está
 * o convite certo.
 */
export function TelaNovoTopico() {
  const contexto = useOutletContext<ContextoDaComunidade | undefined>();
  const papel = usePapel();
  if (!contexto) return null;
  if (papel.tipo === 'carregando') return null;
  // Visitante, conta sem participação e "não deu para saber quem é": o formulário não abre.
  // A comunidade mostra a ação certa (convite, "Participar") ou nada, nunca um botão que falha.
  if (papel.tipo !== 'conta' || !contexto.souMembro) {
    return <Navigate to={enderecoDaComunidade(contexto.comunidade.slug)} replace />;
  }
  return <FormularioDeNovoTopico key={contexto.comunidade.slug} contexto={contexto} contaId={papel.contaId} />;
}

function FormularioDeNovoTopico({ contexto, contaId }: { readonly contexto: ContextoDaComunidade; readonly contaId: string }) {
  const { comunidade, gatilho } = contexto;
  const { forum, ambiente, armazenamento } = useDependenciasDoForum();
  const navegar = useNavigate();
  const local = useLocation();
  const anunciar = useAnunciar();
  const toast = useToast();
  const online = useOnline(ambiente);
  const { enviando, enviar } = useEnvio();
  const participar = useParticiparDaComunidade(comunidade, contexto.atualizarComunidade);

  const slug = comunidade.slug;
  const chave = chaveDoRascunhoDeTopico(contaId, slug);
  const idBase = useId();
  const idDoTitulo = `${idBase}-titulo`;
  const idDoCorpo = `${idBase}-corpo`;
  const idDoDialogo = `${idBase}-h`;

  const [rascunho, setRascunho] = useState(() => lerRascunhoDeTopico(armazenamento, chave) ?? { titulo: '', corpo: '' });
  const [errosDoCampo, setErrosDoCampo] = useState<{ titulo: string | null; corpo: string | null }>({
    titulo: null,
    corpo: null,
  });
  const [erroDoServidor, setErroDoServidor] = useState<ErroDeEnvio | null>(null);
  const tituloRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);
  const corpoRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);

  // Quem chegou pela lista volta pelo histórico; quem caiu aqui por URL direta vai para a comunidade.
  const veioDaLista = (local.state as { daLista?: boolean } | null)?.daLista === true;
  const fechar = useCallback(() => {
    // O texto já está guardado a cada tecla: fechar nunca apaga (spec 6.8).
    if (veioDaLista) navegar(-1);
    else navegar(enderecoDaComunidade(slug), { replace: true });
  }, [navegar, slug, veioDaLista]);

  const devolverFoco = useCallback(() => {
    if (gatilho.current) gatilho.current.focus({ preventScroll: true });
    else contexto.focarTitulo();
  }, [gatilho, contexto]);

  const mudar = (parcial: Partial<{ titulo: string; corpo: string }>) => {
    const novo = { ...rascunho, ...parcial };
    setRascunho(novo);
    guardarRascunhoDeTopico(armazenamento, chave, novo);
    if (parcial.titulo !== undefined && errosDoCampo.titulo) setErrosDoCampo((e) => ({ ...e, titulo: null }));
    if (parcial.corpo !== undefined && errosDoCampo.corpo) setErrosDoCampo((e) => ({ ...e, corpo: null }));
    if (erroDoServidor && erroDoServidor.acao !== 'participar') setErroDoServidor(null);
  };

  const descartar = () => {
    apagarRascunho(armazenamento, chave);
    setRascunho({ titulo: '', corpo: '' });
    setErrosDoCampo({ titulo: null, corpo: null });
    setErroDoServidor(null);
    tituloRef.current?.focus();
  };

  async function aoEnviar(e: FormEvent) {
    e.preventDefault();
    if (enviando) return;
    const titulo = erroDoCampo(rascunho.titulo, LIMITE_TITULO_TOPICO, 'Falta o título.');
    const corpo = erroDoCampo(rascunho.corpo, LIMITE_TEXTO_TOPICO, 'Falta a mensagem.');
    setErrosDoCampo({ titulo, corpo });
    if (titulo) return void tituloRef.current?.focus();
    if (corpo) return void corpoRef.current?.focus();
    if (!online) {
      setErroDoServidor({ texto: TEXTO_SEM_INTERNET, onde: 'geral', acao: null, ambiguo: false });
      return;
    }
    setErroDoServidor(null);

    const r = await enviar(
      () => forum.criarTopico({ comunidadeSlug: slug, titulo: rascunho.titulo.trim(), corpo: rascunho.corpo.trim() }),
      { travarSeOk: true },
    );
    if (r === null) return;
    if (r.ok) {
      apagarRascunho(armazenamento, chave);
      // A volta do navegador não pode mostrar a lista velha, sem este tópico.
      esquecerListasVistas(`c:${slug}|`);
      esquecerListasVistas('explorar|');
      toast('Tópico criado.');
      navegar(enderecoDoTopico(slug, r.valor.id), { replace: true });
      return;
    }
    const erro = erroDeEnvio(r.motivo, 'topico');
    setErroDoServidor(erro);
    if (erro.onde === 'titulo') tituloRef.current?.focus();
    else if (erro.onde === 'corpo') corpoRef.current?.focus();
  }

  const conferir = () => {
    esquecerListasVistas(`c:${slug}|`);
    anunciar('Conferindo os tópicos da comunidade.');
    fechar();
    contexto.conferirLista();
  };

  const temTexto = rascunho.titulo !== '' || rascunho.corpo !== '';
  const erroGeral = erroDoServidor && erroDoServidor.onde === 'geral' ? erroDoServidor : null;
  const erroNoTitulo = errosDoCampo.titulo ?? (erroDoServidor?.onde === 'titulo' ? erroDoServidor.texto : null);
  const erroNoCorpo = errosDoCampo.corpo ?? (erroDoServidor?.onde === 'corpo' ? erroDoServidor.texto : null);
  const rotuloDoEnvio = enviando ? 'Enviando…' : 'Criar tópico';
  const volta = local.pathname + local.search;

  return (
    <DialogoDoForum
      idDoTitulo={idDoDialogo}
      classe="forum-dialogo--formulario"
      aoCancelar={fechar}
      bloqueado={enviando}
      focoInicial={tituloRef}
      aoFechar={devolverFoco}
    >
      <form className="forum-form" onSubmit={aoEnviar} noValidate>
        <div className="forum-form__cabecalho">
          <button type="button" className="forum-botao-texto forum-form__so-celular" onClick={fechar} disabled={enviando}>
            Cancelar
          </button>
          <h2 id={idDoDialogo} className="forum-form__titulo">
            Novo tópico
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
                <Link className="forum-botao forum-botao--contorno" to={enderecoDoLoginComVolta(volta, 'entrar')}>
                  Entrar
                </Link>
              )}
              {erroGeral.acao === 'verComunidades' && (
                <Link className="forum-botao forum-botao--contorno" to="/comunidades">
                  Ver comunidades
                </Link>
              )}
              {erroGeral.acao === 'conferir' && (
                <button type="button" className="forum-botao forum-botao--contorno" onClick={conferir}>
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
            valor={rascunho.titulo}
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
            valor={rascunho.corpo}
            aoMudar={(corpo) => mudar({ corpo })}
            limite={LIMITE_TEXTO_TOPICO}
            placeholder="Conta o que rolou ou o que você quer perguntar."
            erro={erroNoCorpo}
            somenteLeitura={enviando}
            campoRef={corpoRef}
            aoFocar={() => ambiente.centralizarCampo(idDoCorpo)}
          />

          {temTexto && (
            <button type="button" className="forum-botao-texto" onClick={descartar} disabled={enviando}>
              Descartar rascunho
            </button>
          )}
        </div>

        <div className="forum-form__rodape forum-form__so-desktop">
          <button type="button" className="forum-botao forum-botao--contorno" onClick={fechar} disabled={enviando}>
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
