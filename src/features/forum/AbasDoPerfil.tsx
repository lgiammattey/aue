import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { textoDeRespostas } from '../../nucleo/forum/apresentacao';
import type { CursorDoForum, RespostaDoAutor, TopicoDoAutor } from '../../portas/forum';
import { BotaoComoLink, BotaoVerMais, EstadoDeErro, EstadoVazio, Esqueleto, Marcadores, Tempo } from './componentes';
import { ForumProvider, useDependenciasDoForum, useDependenciasOuPadrao, type DependenciasDoForum } from './contexto';
import { ContextoDosEncaixes, useAnunciar, type Encaixes } from './encaixes';
import { enderecoDaComunidade, enderecoDoTopico } from './enderecos';
import { useListaPaginada, useOnline, type ListaPaginada } from './hooks';
import { abaDaUrl, type IdDaAbaDoPerfil } from './ordem';
import './forum.css';

/**
 * Perfil, abas "Tópicos" e "Respostas" (cartão 0017, pedaço 2d; spec 12).
 *
 * Vive dentro do perfil antigo (`TelaPerfil`), que segue dono do cabeçalho e do
 * layout: aqui só entram as abas e o que elas listam. As leituras vão pela porta do
 * fórum. Quem diz que o perfil não existe é o cabeçalho (a lista vazia não prova nada),
 * por isso este componente só é montado com um perfil carregado.
 */

type IdDaAba = IdDaAbaDoPerfil;

const ABAS: readonly { readonly id: IdDaAba; readonly rotulo: string }[] = [
  { id: 'topicos', rotulo: 'Tópicos' },
  { id: 'respostas', rotulo: 'Respostas' },
];

const TAMANHO_DA_PAGINA = 30;

export interface PropsDasAbasDoPerfil {
  /** O @ que o servidor devolveu no cabeçalho (sem o "@"). */
  readonly handle: string;
  /** Muda só o texto dos estados vazios. */
  readonly souEu: boolean;
  /** Portas dubladas, só nos testes. Sem isso, as de verdade. */
  readonly dependencias?: DependenciasDoForum;
}

export function AbasDoPerfil({ dependencias, ...resto }: PropsDasAbasDoPerfil) {
  if (dependencias) {
    return (
      <ForumProvider dependencias={dependencias}>
        <Abas {...resto} />
      </ForumProvider>
    );
  }
  return <ComPortasDeVerdade {...resto} />;
}

function ComPortasDeVerdade(props: Omit<PropsDasAbasDoPerfil, 'dependencias'>) {
  const dependencias = useDependenciasOuPadrao();
  return (
    <ForumProvider dependencias={dependencias}>
      <Abas {...props} />
    </ForumProvider>
  );
}

function Abas({ handle, souEu }: Omit<PropsDasAbasDoPerfil, 'dependencias'>) {
  const { ambiente } = useDependenciasDoForum();
  const online = useOnline(ambiente);
  const [params, setParams] = useSearchParams();
  const ativa = abaDaUrl(params.get('aba'));
  const botoes = useRef<Partial<Record<IdDaAba, HTMLButtonElement | null>>>({});

  const [anuncio, setAnuncio] = useState<{ texto: string; n: number }>({ texto: '', n: 0 });
  const anunciar = useCallback((texto: string) => setAnuncio((a) => ({ texto, n: a.n + 1 })), []);
  const encaixes = useMemo<Encaixes>(
    () => ({ topo: null, aside: null, anunciar, definirRaiz: () => {} }),
    [anunciar],
  );

  // Voltou a internet: avisa uma vez (a faixa some sozinha).
  const estavaOnline = useRef(online);
  useEffect(() => {
    if (online && !estavaOnline.current) anunciar('A internet voltou.');
    estavaOnline.current = online;
  }, [online, anunciar]);

  // A aba vai para a URL, sem empurrar histórico: o Voltar de quem abriu um tópico a partir
  // daqui cai na mesma aba, e trocar de aba não gasta o Voltar. Os outros parâmetros ficam.
  const trocar = useCallback(
    (id: IdDaAba) => {
      setParams(
        (atuais) => {
          const novos = new URLSearchParams(atuais);
          if (id === 'respostas') novos.set('aba', 'respostas');
          else novos.delete('aba');
          return novos;
        },
        { replace: true },
      );
    },
    [setParams],
  );

  // Padrão WAI-ARIA de abas: setas, Home e End movem o foco e abrem a aba (são só duas, a troca é leve).
  const aoTeclar = (e: KeyboardEvent<HTMLButtonElement>, indice: number) => {
    let destino = -1;
    if (e.key === 'ArrowRight') destino = (indice + 1) % ABAS.length;
    else if (e.key === 'ArrowLeft') destino = (indice - 1 + ABAS.length) % ABAS.length;
    else if (e.key === 'Home') destino = 0;
    else if (e.key === 'End') destino = ABAS.length - 1;
    if (destino < 0) return;
    e.preventDefault();
    const proxima = ABAS[destino];
    trocar(proxima.id);
    botoes.current[proxima.id]?.focus();
  };

  return (
    <ContextoDosEncaixes.Provider value={encaixes}>
      <section className="forum-embutido forum-perfil" aria-label="Atividade no fórum">
        <div className="forum-abas" role="tablist" aria-label={`Atividade de @${handle}`}>
          {ABAS.map((aba, i) => {
            const selecionada = aba.id === ativa;
            return (
              <button
                key={aba.id}
                ref={(el) => {
                  botoes.current[aba.id] = el;
                }}
                type="button"
                role="tab"
                id={`aba-${aba.id}`}
                aria-selected={selecionada}
                aria-controls="painel-do-perfil"
                tabIndex={selecionada ? 0 : -1}
                className="forum-aba"
                onClick={() => trocar(aba.id)}
                onKeyDown={(e) => aoTeclar(e, i)}
              >
                <span className="forum-aba__rotulo">{aba.rotulo}</span>
              </button>
            );
          })}
        </div>

        {!online && (
          <p className="forum-faixa-offline">
            Sem internet. Dá pra ler o que já abriu, mas não dá pra enviar nem carregar mais.
          </p>
        )}

        <div id="painel-do-perfil" role="tabpanel" aria-labelledby={`aba-${ativa}`} tabIndex={0} className="forum-painel">
          {ativa === 'topicos' ? (
            <TopicosDoAutor key="topicos" handle={handle} souEu={souEu} online={online} />
          ) : (
            <RespostasDoAutor key="respostas" handle={handle} souEu={souEu} online={online} />
          )}
        </div>

        <div className="forum-sr" role="status" aria-live="polite">
          <span key={anuncio.n}>{anuncio.texto}</span>
        </div>
      </section>
    </ContextoDosEncaixes.Provider>
  );
}

// ---------------------------------------------------------------------------
// Listas
// ---------------------------------------------------------------------------

function TopicosDoAutor({ handle, souEu, online }: { handle: string; souEu: boolean; online: boolean }) {
  const { forum, ambiente } = useDependenciasDoForum();
  const lista = useListaPaginada<TopicoDoAutor, CursorDoForum>({
    chave: `perfil-topicos|${handle}`,
    chaveDeMemoria: `perfil-topicos|${handle}`,
    substantivo: 'tópicos',
    carregarPagina: (cursor) => forum.listarTopicosDoAutor(handle, { limite: TAMANHO_DA_PAGINA, cursor }),
  });
  const agora = ambiente.agora();
  return (
    <CorpoDaLista
      lista={lista}
      online={online}
      carregando="Carregando tópicos"
      tituloDoErro="Deu ruim pra carregar."
      rotuloVerMais="Ver mais tópicos"
      vazio={
        souEu ? (
          <EstadoVazio
            titulo="Você ainda não abriu nenhum tópico."
            linha="Entra numa comunidade e começa uma conversa."
            acao={<BotaoComoLink para="/comunidades">Ver comunidades</BotaoComoLink>}
          />
        ) : (
          <EstadoVazio titulo={`@${handle} ainda não abriu nenhum tópico.`} />
        )
      }
      linha={(t, focar) => <LinhaDoTopicoDoAutor key={t.id} topico={t} focar={focar} agora={agora} />}
    />
  );
}

function RespostasDoAutor({ handle, souEu, online }: { handle: string; souEu: boolean; online: boolean }) {
  const { forum, ambiente } = useDependenciasDoForum();
  const lista = useListaPaginada<RespostaDoAutor, CursorDoForum>({
    chave: `perfil-respostas|${handle}`,
    chaveDeMemoria: `perfil-respostas|${handle}`,
    substantivo: 'respostas',
    carregarPagina: (cursor) => forum.listarRespostasDoAutor(handle, { limite: TAMANHO_DA_PAGINA, cursor }),
  });
  const agora = ambiente.agora();
  return (
    <CorpoDaLista
      lista={lista}
      online={online}
      carregando="Carregando respostas"
      tituloDoErro="Deu ruim pra carregar."
      rotuloVerMais="Ver mais respostas"
      vazio={
        souEu ? (
          <EstadoVazio
            titulo="Você ainda não respondeu em nenhum tópico."
            linha="Abre um tópico e entra na conversa."
            acao={<BotaoComoLink para="/comunidades">Ver comunidades</BotaoComoLink>}
          />
        ) : (
          <EstadoVazio titulo={`@${handle} ainda não respondeu em nenhum tópico.`} />
        )
      }
      linha={(r, focar) => <LinhaDeResposta key={r.id} resposta={r} focar={focar} agora={agora} />}
    />
  );
}

/**
 * Carregando, erro (com "Tentar de novo"), vazio (só quando o servidor respondeu e não há
 * nada) e "Ver mais". Falha da primeira página NUNCA cai no vazio.
 */
function CorpoDaLista<T extends { readonly id: string }>({
  lista,
  online,
  carregando,
  tituloDoErro,
  rotuloVerMais,
  vazio,
  linha,
}: {
  readonly lista: ListaPaginada<T, CursorDoForum>;
  readonly online: boolean;
  readonly carregando: string;
  readonly tituloDoErro: string;
  readonly rotuloVerMais: string;
  readonly vazio: ReactNode;
  readonly linha: (item: T, focar: boolean) => ReactNode;
}) {
  const anuncio = lista.anuncio;
  const anunciar = useAnunciar();
  useEffect(() => {
    if (anuncio) anunciar(anuncio.texto);
  }, [anuncio, anunciar]);

  if (lista.fase === 'carregando') return <Esqueleto forma="lista" anuncio={carregando} />;
  if (lista.fase === 'erro') return <EstadoDeErro titulo={tituloDoErro} offline={!online} aoTentar={lista.recarregar} />;
  if (lista.itens.length === 0) return <>{vazio}</>;
  return (
    <>
      <ul className="forum-lista">{lista.itens.map((item) => linha(item, lista.idParaFocar === item.id))}</ul>
      {lista.proximo !== null && (
        <BotaoVerMais
          rotulo={rotuloVerMais}
          carregando={lista.carregandoMais}
          falhou={lista.falhouAoCarregarMais}
          aoClicar={lista.verMais}
        />
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// Linhas
// ---------------------------------------------------------------------------

function useFocarQuando(focar: boolean) {
  const link = useRef<HTMLAnchorElement>(null);
  useEffect(() => {
    if (focar) link.current?.focus();
  }, [focar]);
  return link;
}

/** Link da comunidade na linha de meta: 44px de área tocável sem engordar a linha. */
function LinkDaComunidade({ slug, nome }: { readonly slug: string; readonly nome: string }) {
  return (
    <Link className="forum-perfil-meta__comunidade" to={enderecoDaComunidade(slug)}>
      {nome}
      <span aria-hidden="true">{'\u00a0·'}</span>
    </Link>
  );
}

/** "Título" (link para a conversa) e "Cerveja Gelada · 8 respostas · há 3 d". Sem trecho do corpo. */
function LinhaDoTopicoDoAutor({
  topico,
  focar,
  agora,
}: {
  readonly topico: TopicoDoAutor;
  readonly focar: boolean;
  readonly agora: number;
}) {
  const link = useFocarQuando(focar);
  const fechado = topico.status === 'fechado';
  return (
    <li className="forum-linha">
      <h2 className="forum-linha__titulo">
        <Link ref={link} to={enderecoDoTopico(topico.comunidade.slug, topico.id)}>
          {topico.titulo}
        </Link>
      </h2>
      <p className="forum-linha__meta forum-perfil-meta">
        <LinkDaComunidade slug={topico.comunidade.slug} nome={topico.comunidade.nome} />
        <span className="forum-perfil-meta__resto">
          {' '}
          {textoDeRespostas(topico.respostasTotal)}
          {' · '}
          <Tempo iso={topico.criadoEm} agora={agora} />
          {fechado && (
            <>
              {' · '}
              <Marcadores fixado={false} fechado />
            </>
          )}
        </span>
      </p>
    </li>
  );
}

/**
 * "Em: título do tópico", o corpo da resposta (3 linhas no máximo) e "Comunidade · há 2 d".
 * O link abre o tópico no topo: o banco não entrega âncora de resposta (spec 12.3).
 * O corpo é texto, nunca HTML.
 */
function LinhaDeResposta({
  resposta,
  focar,
  agora,
}: {
  readonly resposta: RespostaDoAutor;
  readonly focar: boolean;
  readonly agora: number;
}) {
  const link = useFocarQuando(focar);
  return (
    <li className="forum-linha forum-linha--resposta">
      <h2 className="forum-linha__titulo forum-linha__titulo--resposta">
        <Link ref={link} to={enderecoDoTopico(resposta.comunidade.slug, resposta.topicoId)}>
          Em: {resposta.topicoTitulo}
        </Link>
      </h2>
      <p className="forum-linha__corpo">{resposta.corpo}</p>
      <p className="forum-linha__meta forum-perfil-meta">
        <LinkDaComunidade slug={resposta.comunidade.slug} nome={resposta.comunidade.nome} />
        <span className="forum-perfil-meta__resto">
          {' '}
          <Tempo iso={resposta.criadoEm} agora={agora} />
        </span>
      </p>
    </li>
  );
}
