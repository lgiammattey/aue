import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { Link, Outlet, useLocation, useNavigationType } from 'react-router-dom';
import { enderecoDoLoginComVolta } from '../../nucleo/comunidade/caminhoDeVolta';
import type { TemaDoForum } from '../../portas/ambienteDoForum';
import { useDependenciasDoForum, useDependenciasOuPadrao, ForumProvider } from './contexto';
import { useOnline } from './hooks';
import { IconeArena, IconeComunidades, IconeExplorar, IconePerfil, IconeTema, IconeVoltar } from './Icones';
import { ContextoDoPapel, useDescobrirPapel } from './papel';
import './forum.css';

// ---------------------------------------------------------------------------
// Encaixes: a barra do topo e o aside são da casca; o conteúdo de cada um é da tela
// ---------------------------------------------------------------------------

interface Encaixes {
  readonly topo: HTMLElement | null;
  readonly aside: HTMLElement | null;
  readonly anunciar: (mensagem: string) => void;
}

const ContextoDosEncaixes = createContext<Encaixes>({ topo: null, aside: null, anunciar: () => {} });

/** Região de status única da tela: "Carregando tópicos", "Mais 5 tópicos carregados", "A internet voltou." */
export function useAnunciar(): (mensagem: string) => void {
  return useContext(ContextoDosEncaixes).anunciar;
}

interface PropsDoTopo {
  readonly titulo: string;
  /** Telas raiz (Comunidades, Explorar): o título é o H1. Telas aninhadas: o H1 está no conteúdo. */
  readonly voltar?: { readonly para: string; readonly rotulo: string };
}

/** Preenche a barra do topo. */
export function TopoDaTela({ titulo, voltar }: PropsDoTopo) {
  const { topo } = useContext(ContextoDosEncaixes);
  const h1 = useRef<HTMLHeadingElement>(null);
  const raiz = !voltar;

  useEffect(() => {
    if (raiz) h1.current?.focus({ preventScroll: true });
  }, [raiz, titulo]);

  if (!topo) return null;
  return createPortal(
    <>
      <div className="forum-topo__esquerda">
        {voltar && (
          <Link className="forum-topo__voltar" to={voltar.para} aria-label={`Voltar para ${voltar.rotulo}`}>
            <IconeVoltar />
          </Link>
        )}
      </div>
      {raiz ? (
        <h1 className="forum-topo__titulo" ref={h1} tabIndex={-1}>
          {titulo}
        </h1>
      ) : (
        <p className="forum-topo__titulo" aria-hidden="true">
          {titulo}
        </p>
      )}
    </>,
    topo,
  );
}

/** Preenche o aside (só existe em 1000px ou mais). */
export function NoAside({ children }: { readonly children: ReactNode }) {
  const { aside } = useContext(ContextoDosEncaixes);
  return aside ? createPortal(children, aside) : null;
}

/** Título da aba: "{Título} · Auê!". Vazio enquanto não há o que dizer. */
export function useTituloDoDocumento(titulo: string | null): void {
  const { ambiente } = useDependenciasDoForum();
  useEffect(() => {
    if (titulo) ambiente.definirTituloDoDocumento(`${titulo} · Auê!`);
  }, [ambiente, titulo]);
}

// ---------------------------------------------------------------------------
// Navegação: quatro itens, fonte única
// ---------------------------------------------------------------------------

type ItemAtivo = 'comunidades' | 'explorar' | 'arena' | 'perfil' | null;

function itemAtivoDe(caminho: string): ItemAtivo {
  if (caminho === '/comunidades' || caminho.startsWith('/c/')) return 'comunidades';
  if (caminho === '/explorar') return 'explorar';
  return null;
}

function Navegacao({ ativo, papelEhVisitante }: { readonly ativo: ItemAtivo; readonly papelEhVisitante: boolean }) {
  const itens = [
    { id: 'comunidades', rotulo: 'Comunidades', para: '/comunidades', Icone: IconeComunidades },
    { id: 'explorar', rotulo: 'Explorar', para: '/explorar', Icone: IconeExplorar },
    { id: 'arena', rotulo: 'Arena', para: '/arena', Icone: IconeArena },
    {
      id: 'perfil',
      rotulo: 'Perfil',
      // Visitante que toca em Perfil entra e volta para ele.
      para: papelEhVisitante ? enderecoDoLoginComVolta('/perfil', 'entrar') : '/perfil',
      Icone: IconePerfil,
    },
  ] as const;

  return (
    <nav className="forum-nav" aria-label="Principal">
      <ul>
        {itens.map(({ id, rotulo, para, Icone }) => {
          const atual = ativo === id;
          return (
            <li key={id}>
              <Link
                to={para}
                className="forum-nav__item"
                aria-current={atual ? 'page' : undefined}
                title={rotulo}
              >
                <Icone traco={atual ? 2.4 : 1.8} />
                <span className="forum-nav__rotulo">{rotulo}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function BotaoDeTema({ tema, aoAlternar, classe }: { tema: TemaDoForum; aoAlternar: () => void; classe: string }) {
  const rotulo = tema === 'claro' ? 'Tema escuro' : 'Tema claro';
  return (
    <button type="button" className={classe} onClick={aoAlternar} aria-label={rotulo} title={rotulo}>
      <IconeTema />
      <span className="forum-tema__rotulo">{rotulo}</span>
    </button>
  );
}

// ---------------------------------------------------------------------------
// A casca
// ---------------------------------------------------------------------------

function Casca({ children }: { readonly children: ReactNode }) {
  const { conta, comunidade, ambiente } = useDependenciasDoForum();
  const papel = useDescobrirPapel(conta, comunidade);
  const online = useOnline(ambiente);
  const local = useLocation();
  const tipoDeNavegacao = useNavigationType();

  const [tema, setTema] = useState<TemaDoForum>(() => ambiente.temaEscolhido() ?? 'claro');
  useLayoutEffect(() => {
    ambiente.aplicarTema(tema, false);
  }, [ambiente, tema]);
  const alternarTema = useCallback(() => {
    const novo: TemaDoForum = tema === 'claro' ? 'escuro' : 'claro';
    ambiente.aplicarTema(novo, true);
    setTema(novo);
  }, [ambiente, tema]);

  const [topo, setTopo] = useState<HTMLElement | null>(null);
  const [aside, setAside] = useState<HTMLElement | null>(null);

  const [anuncio, setAnuncio] = useState<{ texto: string; n: number }>({ texto: '', n: 0 });
  const anunciar = useCallback((texto: string) => setAnuncio((a) => ({ texto, n: a.n + 1 })), []);

  // Voltou a internet: avisa uma vez. A faixa some sozinha.
  const estavaOnline = useRef(online);
  useEffect(() => {
    if (online && !estavaOnline.current) anunciar('A internet voltou.');
    estavaOnline.current = online;
  }, [online, anunciar]);

  // Navegar para uma tela nova começa no topo; voltar (POP) deixa a lista restaurar a rolagem.
  useLayoutEffect(() => {
    if (tipoDeNavegacao !== 'POP') ambiente.rolarPara(0);
  }, [local.key, tipoDeNavegacao, ambiente]);

  const principal = useRef<HTMLElement>(null);
  const visitante = papel.tipo === 'visitante';
  const enderecoDeEntrar = enderecoDoLoginComVolta(local.pathname + local.search, 'entrar');

  return (
    <ContextoDoPapel.Provider value={papel}>
      <ContextoDosEncaixes.Provider value={{ topo, aside, anunciar }}>
        <div className="forum-shell" data-forum-tema={tema}>
          <a
            className="forum-pular"
            href="#conteudo"
            onClick={(e) => {
              e.preventDefault();
              principal.current?.focus();
            }}
          >
            Pular para o conteúdo
          </a>

          <div className="forum-lateral">
            <Link className="forum-marca" to="/" aria-label="Auê!, página inicial">
              <span className="forum-marca__cheia">AUÊ!</span>
              <span className="forum-marca__curta" aria-hidden="true">
                A!
              </span>
            </Link>
            <Navegacao ativo={itemAtivoDe(local.pathname)} papelEhVisitante={visitante} />
            <div className="forum-lateral__rodape">
              <BotaoDeTema tema={tema} aoAlternar={alternarTema} classe="forum-tema forum-tema--lateral" />
              {visitante && (
                <Link className="forum-entrar forum-entrar--cheio" to={enderecoDeEntrar}>
                  Entrar
                </Link>
              )}
            </div>
          </div>

          <div className="forum-centro">
            <header className="forum-topo">
              <div className="forum-topo__miolo" ref={setTopo} />
              <div className="forum-topo__direita">
                <BotaoDeTema tema={tema} aoAlternar={alternarTema} classe="forum-tema forum-tema--topo" />
                {visitante && (
                  <Link className="forum-entrar forum-entrar--texto" to={enderecoDeEntrar}>
                    Entrar
                  </Link>
                )}
              </div>
            </header>

            {!online && (
              <p className="forum-faixa-offline">
                Sem internet. Dá pra ler o que já abriu, mas não dá pra enviar nem carregar mais.
              </p>
            )}

            <main id="conteudo" className="forum-principal" tabIndex={-1} ref={principal}>
              {children}
            </main>
          </div>

          <aside className="forum-aside" aria-label="Sobre a comunidade" ref={setAside} />

          <div className="forum-sr" role="status" aria-live="polite">
            <span key={anuncio.n}>{anuncio.texto}</span>
          </div>
        </div>
      </ContextoDosEncaixes.Provider>
    </ContextoDoPapel.Provider>
  );
}

/**
 * Elemento de rota das telas do fórum: cria as portas de verdade se ninguém deu
 * outras (os testes dão), monta a casca e deixa a tela no `<Outlet />`.
 */
export function LayoutDoForum() {
  const dependencias = useDependenciasOuPadrao();
  return (
    <ForumProvider dependencias={dependencias}>
      <Casca>
        <Outlet />
      </Casca>
    </ForumProvider>
  );
}

