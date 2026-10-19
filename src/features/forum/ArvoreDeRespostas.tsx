import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type Ref,
  type RefObject,
} from 'react';
import { useLocation } from 'react-router-dom';
import {
  montarArvoreDeRespostas,
  nomeDoAutor,
  normalizarQuebras,
  proximaRespostaAposApagar,
  textoDeRespostas,
  type NoDeResposta,
} from '../../nucleo/forum/apresentacao';
import {
  guardarRascunhoDeResposta,
  lerRascunhoDeResposta,
} from '../../nucleo/forum/rascunho';
import { chaveDoRascunhoDeResposta } from '../../portas/armazenamento';
import type { CursorDoForum, RespostaCriada, RespostaDoForum, TopicoDoForum } from '../../portas/forum';
import { BotaoParticipar } from './AcoesDaComunidade';
import { CompositorDeResposta } from './CompositorDeResposta';
import { Avatar, BotaoVerMais, EstadoDeErro, Esqueleto, NomeDoAutor, Tempo } from './componentes';
import { ConviteDeVisitante } from './ConviteDeVisitante';
import { useDependenciasDoForum } from './contexto';
import { DialogoDeConfirmacao } from './DialogoDeConfirmacao';
import { DialogoDeDenuncia } from './DialogoDeDenuncia';
import { useAnunciar } from './encaixes';
import { esquecerListasVistas, useListaPaginada, useOnline } from './hooks';
import { MenuDeAcoes, type ItemDoMenu } from './MenuDeAcoes';
import { usePapel } from './papel';
import { useToast } from './toast';
import { useParticiparDaComunidade } from './useParticiparDaComunidade';

const TAMANHO_DA_PAGINA_DE_RESPOSTAS = 100;

export interface ApiDasRespostas {
  /** "Responder" do cabeçalho: carrega o resto da conversa e leva ao composer (ou ao convite). */
  irParaOCompositor: () => Promise<void>;
}

type Modo = { readonly tipo: 'responder' | 'editar'; readonly id: string } | null;
type Dialogo = {
  readonly tipo: 'apagar' | 'denunciar';
  readonly resposta: RespostaDoForum;
  readonly gatilho: RefObject<HTMLButtonElement | null>;
} | null;

interface ContextoDaConversa {
  readonly podeResponder: boolean;
  readonly ehConta: boolean;
  readonly aberto: boolean;
  readonly modo: Modo;
  readonly foco: { readonly alvo: string; readonly n: number } | null;
  readonly topicoId: string;
  readonly comunidade: { readonly slug: string; readonly nome: string };
  readonly porId: ReadonlyMap<string, RespostaDoForum>;
  readonly abrir: (tipo: 'responder' | 'editar', id: string) => void;
  readonly fechar: () => void;
  readonly pedir: (tipo: 'apagar' | 'denunciar', r: RespostaDoForum, gatilho: RefObject<HTMLButtonElement | null>) => void;
  readonly depoisDeEnviar: (valor: unknown) => Promise<void>;
  readonly depoisDeEditar: (id: string) => Promise<void>;
  readonly moverParaPrincipal: (texto: string) => void;
  readonly conferir: () => Promise<void>;
  readonly estadoDoTopicoMudou: () => void;
}

const Contexto = createContext<ContextoDaConversa | null>(null);
const useConversa = () => {
  const c = useContext(Contexto);
  if (!c) throw new Error('Fora da conversa.');
  return c;
};

// ---------------------------------------------------------------------------
// Composers e edição inline
// ---------------------------------------------------------------------------

function ComposerInline({ resposta, devolverFoco }: { readonly resposta: RespostaDoForum; readonly devolverFoco: () => void }) {
  const c = useConversa();
  const { forum, armazenamento } = useDependenciasDoForum();
  const local = useLocation();
  const chave = chaveDoRascunhoDeResposta(c.topicoId, resposta.id);
  const [texto, setTexto] = useState(() => lerRascunhoDeResposta(armazenamento, chave));
  const mudar = (t: string) => {
    setTexto(t);
    guardarRascunhoDeResposta(armazenamento, chave, t);
  };
  const nome = nomeDoAutor(resposta.autor);
  return (
    <CompositorDeResposta
      rotulo={`Sua resposta a ${nome || 'esta resposta'}`}
      rotuloDoEnvio="Enviar"
      operacao="resposta"
      texto={texto}
      aoMudarTexto={mudar}
      enviar={(corpo) => forum.responderTopico({ topicoId: c.topicoId, corpo, paiId: resposta.id })}
      aoSucesso={c.depoisDeEnviar}
      aoCancelar={() => {
        c.fechar();
        devolverFoco();
      }}
      comunidade={c.comunidade}
      caminhoDeVolta={local.pathname + local.search}
      referencia={resposta.autor?.handle ?? null}
      focarAoMontar
      acento={false}
      aoEstadoDoTopicoMudar={c.estadoDoTopicoMudou}
      aoConferir={() => void c.conferir()}
      aoDescartar={() => mudar('')}
      aoResponderNoTopico={() => {
        const t = texto;
        mudar('');
        c.moverParaPrincipal(t);
      }}
    />
  );
}

function EdicaoInline({ resposta, devolverFoco }: { readonly resposta: RespostaDoForum; readonly devolverFoco: () => void }) {
  const c = useConversa();
  const { forum } = useDependenciasDoForum();
  const local = useLocation();
  const original = resposta.corpo ?? '';
  const [texto, setTexto] = useState(original);
  return (
    <CompositorDeResposta
      rotulo="Editar resposta"
      rotuloDoEnvio="Salvar"
      operacao="edicaoDeResposta"
      texto={texto}
      aoMudarTexto={setTexto}
      textoOriginal={original}
      enviar={(corpo) => forum.editarResposta({ respostaId: resposta.id, corpo })}
      aoSucesso={() => c.depoisDeEditar(resposta.id)}
      aoCancelar={() => {
        c.fechar();
        devolverFoco();
      }}
      comunidade={c.comunidade}
      caminhoDeVolta={local.pathname + local.search}
      focarAoMontar
      acento={false}
      aoEstadoDoTopicoMudar={c.estadoDoTopicoMudou}
      aoConferir={() => void c.conferir()}
    />
  );
}

// ---------------------------------------------------------------------------
// Uma resposta
// ---------------------------------------------------------------------------

function ItemDeResposta({ no, agora }: { readonly no: NoDeResposta<RespostaDoForum>; readonly agora: number }) {
  const c = useConversa();
  const r = no.resposta;
  const li = useRef<HTMLLIElement>(null);
  const botaoResponder = useRef<HTMLButtonElement>(null);
  const botaoMenu = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (c.foco?.alvo === r.id) li.current?.focus();
  }, [c.foco, r.id]);

  const casca = r.status !== 'visivel' || r.corpo === null;
  const nome = nomeDoAutor(r.autor);
  const pai = r.paiId ? c.porId.get(r.paiId) : undefined;
  const handleDoPai = pai?.autor?.handle ?? null;
  const respondeNivelDois = r.nivel === 2 && pai?.nivel === 2 && handleDoPai;
  const respondendoAqui = c.modo?.tipo === 'responder' && c.modo.id === r.id;
  const editandoAqui = c.modo?.tipo === 'editar' && c.modo.id === r.id;

  const itens: ItemDoMenu[] = [];
  if (!casca && c.ehConta) {
    if (r.souAutor && c.aberto) itens.push({ id: 'editar', rotulo: 'Editar', aoEscolher: () => c.abrir('editar', r.id) });
    if (r.souAutor) itens.push({ id: 'apagar', rotulo: 'Apagar', aoEscolher: () => c.pedir('apagar', r, botaoMenu) });
    if (!r.souAutor) itens.push({ id: 'denunciar', rotulo: 'Denunciar', aoEscolher: () => c.pedir('denunciar', r, botaoMenu) });
  }
  const podeResponderAqui = c.podeResponder && !casca && !editandoAqui;

  return (
    <li className="forum-resposta" data-nivel={r.nivel} ref={li} tabIndex={-1}>
      {casca ? (
        <p className="forum-resposta__casca">
          {r.status === 'oculto' ? 'Resposta oculta.' : r.status === 'removido' ? 'Resposta removida.' : 'Resposta indisponível.'}
        </p>
      ) : (
        <>
          <p className="forum-resposta__autoria">
            {r.autor && <Avatar nome={nome} url={r.autor.avatarUrl} pequeno={r.nivel === 2} />}
            {r.autor && <NomeDoAutor autor={r.autor} forte />}
            {r.autor?.apelido && r.autor.handle && <span className="forum-muted">@{r.autor.handle}</span>}
            <Tempo iso={r.criadoEm} agora={agora} />
            {r.editadoEm && <span className="forum-muted">editado</span>}
          </p>
          {respondeNivelDois && <p className="forum-resposta__referencia">Respondendo a @{handleDoPai}</p>}
          {editandoAqui ? (
            <EdicaoInline resposta={r} devolverFoco={() => botaoMenu.current?.focus()} />
          ) : (
            <p className="forum-resposta__corpo">{normalizarQuebras(r.corpo ?? '')}</p>
          )}
          {(podeResponderAqui || itens.length > 0) && (
            <div className="forum-resposta__acoes">
              {podeResponderAqui && (
                <button
                  ref={botaoResponder}
                  type="button"
                  className="forum-botao-texto forum-resposta__responder"
                  aria-label={`Responder a ${nome || 'esta resposta'}`}
                  onClick={() => c.abrir('responder', r.id)}
                >
                  Responder
                </button>
              )}
              <MenuDeAcoes rotulo={`Ações da resposta de ${nome || 'esta pessoa'}`} itens={itens} botaoRef={botaoMenu} />
            </div>
          )}
          {respondendoAqui && <ComposerInline resposta={r} devolverFoco={() => botaoResponder.current?.focus()} />}
        </>
      )}
      {no.filhas.length > 0 && (
        <ul className="forum-respostas forum-respostas--filhas">
          {no.filhas.map((filha) => (
            <ItemDeResposta key={filha.resposta.id} no={filha} agora={agora} />
          ))}
        </ul>
      )}
    </li>
  );
}

// ---------------------------------------------------------------------------
// A conversa
// ---------------------------------------------------------------------------

interface Props {
  readonly topico: TopicoDoForum;
  readonly agora: number;
  readonly comunidade: { readonly slug: string; readonly nome: string };
  readonly souMembro: boolean;
  /** Relê o tópico (contador de respostas, status) sem piscar. */
  readonly aoMudarConversa: () => void;
  readonly api?: Ref<ApiDasRespostas>;
}

export function Respostas({ topico, agora, comunidade, souMembro, aoMudarConversa, api }: Props) {
  const { forum, ambiente, armazenamento } = useDependenciasDoForum();
  const online = useOnline(ambiente);
  const anunciar = useAnunciar();
  const toast = useToast();
  const papel = usePapel();
  const local = useLocation();
  const id = topico.id;
  const aberto = topico.status === 'aberto';
  const ehConta = papel.tipo === 'conta';
  const podeResponder = ehConta && souMembro && aberto;

  const lista = useListaPaginada<RespostaDoForum, CursorDoForum>({
    chave: id,
    substantivo: 'respostas',
    carregarPagina: (cursor) => forum.listarRespostasDoTopico(id, { limite: TAMANHO_DA_PAGINA_DE_RESPOSTAS, cursor }),
  });
  const anuncio = lista.anuncio;
  useEffect(() => {
    if (anuncio) anunciar(anuncio.texto);
  }, [anuncio, anunciar]);

  const [modo, setModo] = useState<Modo>(null);
  const [dialogo, setDialogo] = useState<Dialogo>(null);
  const [foco, setFoco] = useState<{ alvo: string; n: number } | null>(null);
  const [avisoDeAtualizacao, setAvisoDeAtualizacao] = useState<string | null>(null);
  const nFoco = useRef(0);
  const pedirFoco = useCallback((alvo: string) => setFoco({ alvo, n: (nFoco.current += 1) }), []);
  const compositorRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);
  const conviteRef = useRef<HTMLDivElement>(null);
  const tituloRef = useRef<HTMLHeadingElement>(null);
  const caminho = local.pathname + local.search;

  const chavePrincipal = chaveDoRascunhoDeResposta(id, null);
  const [textoPrincipal, setTextoPrincipal] = useState(() => lerRascunhoDeResposta(armazenamento, chavePrincipal));
  const mudarTextoPrincipal = useCallback(
    (t: string) => {
      setTextoPrincipal(t);
      guardarRascunhoDeResposta(armazenamento, chavePrincipal, t);
    },
    [armazenamento, chavePrincipal],
  );

  // "Ver mais" e troca de página: o foco vai ao primeiro item novo (spec 6.5).
  const idParaFocar = lista.idParaFocar;
  useEffect(() => {
    if (idParaFocar) pedirFoco(idParaFocar);
  }, [idParaFocar, pedirFoco]);

  // Foco no composer principal (ou no convite, se a pessoa não pode responder).
  useEffect(() => {
    if (foco?.alvo !== 'composer') return;
    (compositorRef.current ?? conviteRef.current ?? tituloRef.current)?.focus();
  }, [foco]);

  const esquecerListas = useCallback(() => {
    esquecerListasVistas(`c:${comunidade.slug}|`);
    esquecerListasVistas('explorar|');
  }, [comunidade.slug]);

  const relerTudo = useCallback(
    async (avisoSeFalhar: string): Promise<boolean> => {
      const ok = await lista.recarregarTudo();
      aoMudarConversa();
      setAvisoDeAtualizacao(ok ? null : avisoSeFalhar);
      return ok;
    },
    [lista, aoMudarConversa],
  );

  const depoisDeEnviar = useCallback(
    async (valor: unknown) => {
      const nova = valor as RespostaCriada;
      setModo(null);
      esquecerListas();
      if (await relerTudo('Sua resposta foi enviada, mas não deu pra atualizar a conversa.')) {
        pedirFoco(nova.id);
        anunciar('Resposta enviada.');
      }
    },
    [esquecerListas, relerTudo, pedirFoco, anunciar],
  );

  const depoisDeEditar = useCallback(
    async (respostaId: string) => {
      setModo(null);
      if (await relerTudo('Sua edição foi salva, mas não deu pra atualizar a conversa.')) {
        pedirFoco(respostaId);
        anunciar('Resposta atualizada.');
      }
    },
    [relerTudo, pedirFoco, anunciar],
  );

  const depoisDeApagar = async (apagada: RespostaDoForum) => {
    const proxima = proximaRespostaAposApagar(montarArvoreDeRespostas(lista.itens), apagada.id);
    setDialogo(null);
    esquecerListas();
    toast('Resposta apagada.');
    if (await relerTudo('A resposta foi apagada, mas não deu pra atualizar a conversa.')) pedirFoco(proxima ?? 'composer');
  };

  const conferir = useCallback(async () => {
    if (await relerTudo('Não deu pra atualizar a conversa. Tenta de novo.')) anunciar('Conversa atualizada.');
  }, [relerTudo, anunciar]);

  const moverParaPrincipal = useCallback(
    (texto: string) => {
      mudarTextoPrincipal(textoPrincipal.trim() ? `${textoPrincipal.trimEnd()}\n\n${texto}` : texto);
      setModo(null);
      pedirFoco('composer');
    },
    [mudarTextoPrincipal, textoPrincipal, pedirFoco],
  );

  useImperativeHandle(
    api,
    () => ({
      irParaOCompositor: async () => {
        if (lista.proximo !== null) {
          anunciar('Carregando respostas');
          await lista.recarregarTudo();
        }
        pedirFoco('composer');
      },
    }),
    [lista, anunciar, pedirFoco],
  );

  const participar = useParticiparDaComunidade(comunidade, aoMudarConversa);
  const [focarCompositor, setFocarCompositor] = useState(false);
  useEffect(() => {
    if (focarCompositor && podeResponder) {
      pedirFoco('composer');
      setFocarCompositor(false);
    }
  }, [focarCompositor, podeResponder, pedirFoco]);

  const porId = new Map(lista.itens.map((r) => [r.id, r]));
  const contexto: ContextoDaConversa = {
    podeResponder,
    ehConta,
    aberto,
    modo,
    foco,
    topicoId: id,
    comunidade,
    porId,
    abrir: (tipo, alvo) => setModo({ tipo, id: alvo }),
    fechar: () => setModo(null),
    pedir: (tipo, resposta, gatilho) => setDialogo({ tipo, resposta, gatilho }),
    depoisDeEnviar,
    depoisDeEditar,
    moverParaPrincipal,
    conferir,
    estadoDoTopicoMudou: aoMudarConversa,
  };

  let corpo;
  if (lista.fase === 'carregando') {
    corpo = <Esqueleto forma="lista" anuncio="Carregando respostas" />;
  } else if (lista.fase === 'erro') {
    corpo = <EstadoDeErro titulo="Deu ruim pra carregar as respostas." offline={!online} aoTentar={lista.recarregar} />;
  } else if (lista.itens.length === 0) {
    corpo = <p className="forum-aviso">{podeResponder ? 'Ninguém respondeu ainda. Manda a primeira.' : 'Ninguém respondeu ainda.'}</p>;
  } else {
    corpo = (
      <>
        <ul className="forum-respostas">
          {montarArvoreDeRespostas(lista.itens).map((no) => (
            <ItemDeResposta key={no.resposta.id} no={no} agora={agora} />
          ))}
        </ul>
        {lista.proximo !== null && (
          <BotaoVerMais
            rotulo="Ver mais respostas"
            carregando={lista.carregandoMais}
            falhou={lista.falhouAoCarregarMais}
            aoClicar={lista.verMais}
          />
        )}
      </>
    );
  }

  return (
    <Contexto.Provider value={contexto}>
      <section className="forum-conversa" aria-labelledby="forum-respostas-titulo">
        <div className="forum-conversa__cabeca">
          <h2 id="forum-respostas-titulo" className="forum-secao" ref={tituloRef} tabIndex={-1}>
            {textoDeRespostas(topico.respostasTotal)}
          </h2>
          <span className="forum-muted">Mais antigas primeiro</span>
        </div>
        {corpo}
        {avisoDeAtualizacao && (
          <div className="forum-form__alerta forum-conversa__aviso" role="alert">
            <p>{avisoDeAtualizacao}</p>
            <button type="button" className="forum-botao forum-botao--contorno" onClick={() => void conferir()}>
              Atualizar a conversa
            </button>
          </div>
        )}
      </section>

      {aberto && papel.tipo === 'visitante' && (
        <div className="forum-faixa-convite" ref={conviteRef} tabIndex={-1}>
          <p>Quer responder? Crie sua conta ou entre. Ler e ouvir continua liberado.</p>
          <ConviteDeVisitante rotuloDeCriar="Criar conta" />
        </div>
      )}
      {aberto && ehConta && !souMembro && (
        <div className="forum-faixa-convite" ref={conviteRef} tabIndex={-1}>
          <p>Entre em {comunidade.nome} para responder.</p>
          <BotaoParticipar
            pendente={participar.pendente === 'entrar'}
            aoClicar={() => {
              void participar.entrar().then((ok) => ok && setFocarCompositor(true));
            }}
          />
          {participar.erro && <p className="forum-campo__erro" role="alert">{participar.erro}</p>}
        </div>
      )}
      {podeResponder && (
        <div className="forum-compositor-area">
          <CompositorDeResposta
            rotulo="Sua resposta"
            rotuloDoEnvio="Enviar"
            operacao="resposta"
            texto={textoPrincipal}
            aoMudarTexto={mudarTextoPrincipal}
            enviar={(corpoDaResposta) => forum.responderTopico({ topicoId: id, corpo: corpoDaResposta })}
            aoSucesso={depoisDeEnviar}
            comunidade={comunidade}
            caminhoDeVolta={caminho}
            campoRef={compositorRef}
            aoEstadoDoTopicoMudar={aoMudarConversa}
            aoConferir={() => void conferir()}
            aoDescartar={() => mudarTextoPrincipal('')}
            aoMudarParticipacao={aoMudarConversa}
          />
        </div>
      )}

      {dialogo?.tipo === 'apagar' && (
        <DialogoDeConfirmacao
          titulo="Apagar esta resposta?"
          corpo="Se tiver respostas embaixo dela, elas continuam e a sua vira Resposta removida."
          rotuloDeConfirmar="Apagar resposta"
          rotuloEmAndamento="Apagando…"
          confirmar={async () => {
            const r = await forum.apagarResposta(dialogo.resposta.id);
            if (!r.ok && r.motivo === 'respostaNaoEncontrada') void relerTudo('Não deu pra atualizar a conversa. Tenta de novo.');
            return r;
          }}
          aoSucesso={() => void depoisDeApagar(dialogo.resposta)}
          aoCancelar={() => setDialogo(null)}
          aoFechar={() => dialogo.gatilho.current?.focus()}
          caminhoDeVolta={caminho}
        />
      )}
      {dialogo?.tipo === 'denunciar' && (
        <DialogoDeDenuncia
          alvo="resposta"
          denunciar={(motivo) => forum.denunciarResposta(dialogo.resposta.id, motivo)}
          aoSucesso={() => {
            setDialogo(null);
            toast('Denúncia enviada. Valeu.');
          }}
          aoCancelar={() => setDialogo(null)}
          aoFechar={() => dialogo.gatilho.current?.focus()}
          caminhoDeVolta={caminho}
        />
      )}
    </Contexto.Provider>
  );
}
