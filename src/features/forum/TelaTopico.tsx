import { useEffect, useRef } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { formatarNota } from '../../shared/formato/nota';
import { normalizarQuebras, nomeDoAutor, textoDeRespostas } from '../../nucleo/forum/apresentacao';
import type { CursorDoForum, RespostaDoForum, TopicoDoForum } from '../../portas/forum';
import {
  Avatar,
  BotaoComoLink,
  BotaoVerMais,
  EstadoDeErro,
  EstadoDeMolde,
  Esqueleto,
  Marcadores,
  Tempo,
} from './componentes';
import { enderecoDaComunidade, enderecoDoTopico } from './enderecos';
import { useDependenciasDoForum } from './contexto';
import { IconeTocar } from './Icones';
import { useLeitura, useListaPaginada, useOnline } from './hooks';
import { montarArvoreDeRespostas, type NoDeResposta } from '../../nucleo/forum/apresentacao';
import { AsideSobreAComunidade } from './RegrasDaCasa';
import { NoAside, TopoDaTela, useAnunciar, useTituloDoDocumento } from './ShellDoForum';

const TAMANHO_DA_PAGINA_DE_RESPOSTAS = 100;

const enderecoDoPerfil = (handle: string) => `/u/${encodeURIComponent(handle)}`;

function formatarDuracao(segundos: number): string {
  const total = Math.max(0, Math.round(segundos));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}

/** Nome do autor, como link para o perfil quando existe @. */
function NomeDoAutor({ autor, forte }: { readonly autor: { apelido: string | null; handle: string | null }; readonly forte?: boolean }) {
  const nome = nomeDoAutor(autor);
  if (!nome) return null;
  const conteudo = <span className={forte ? 'forum-autor__nome' : undefined}>{nome}</span>;
  return autor.handle ? <Link to={enderecoDoPerfil(autor.handle)}>{conteudo}</Link> : conteudo;
}

// ---------------------------------------------------------------------------
// Áudio e nota: só o que o servidor devolveu
// ---------------------------------------------------------------------------

/**
 * Existe áudio quando há caminho; existe nota quando a nota não é nula. Áudio
 * sem nota não ganha selo; nada de forma de onda inventada. Tocar depende do
 * contrato de URL do áudio (#250), que ainda não fechou: o botão fica
 * desabilitado e a tela diz isso, em vez de fingir um player.
 */
function BlocoDeAudio({ topico }: { readonly topico: TopicoDoForum }) {
  const audio = topico.audio;
  if (!audio || (!audio.caminhoDoAudio && !audio.caminhoDoAudioDaCasa)) return null;
  const nome = nomeDoAutor(topico.autor) || 'quem abriu o tópico';
  return (
    <div className="forum-audio">
      <div className="forum-audio__pilula">
        <button type="button" className="forum-audio__tocar" disabled aria-label={`Tocar arroto de ${nome}`}>
          <IconeTocar />
        </button>
        <span className="forum-audio__barra" aria-hidden="true" />
        {audio.duracao !== null && <span className="forum-audio__duracao">{formatarDuracao(audio.duracao)}</span>}
        {audio.nota !== null && <span className="forum-selo-nota">{formatarNota(audio.nota)}</span>}
      </div>
      <p className="forum-audio__aviso">O player ainda não está disponível nesta tela.</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Cabeçalho do tópico
// ---------------------------------------------------------------------------

function CabecalhoDoTopico({ topico, agora }: { readonly topico: TopicoDoForum; readonly agora: number }) {
  const h1 = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    h1.current?.focus({ preventScroll: true });
  }, [topico.id]);
  const corpo = normalizarQuebras(topico.corpo);
  const fechado = topico.status === 'fechado';

  return (
    <article className="forum-topico" aria-labelledby="forum-h1">
      <nav className="forum-migalha" aria-label="Você está em">
        <Link to={enderecoDaComunidade(topico.comunidade.slug)}>{topico.comunidade.nome}</Link>
        <span aria-hidden="true"> › </span>
        <span>Tópico</span>
      </nav>
      <h1 id="forum-h1" className="forum-h1 forum-h1--topico" ref={h1} tabIndex={-1}>
        {topico.titulo}
      </h1>
      <p className="forum-autoria">
        <Avatar nome={nomeDoAutor(topico.autor)} url={topico.autor.avatarUrl} />
        <NomeDoAutor autor={topico.autor} forte />
        {topico.autor.apelido && topico.autor.handle && <span className="forum-muted">@{topico.autor.handle}</span>}
        <Tempo iso={topico.criadoEm} agora={agora} />
        {topico.editadoEm && <span className="forum-muted">editado</span>}
      </p>
      {(topico.fixado || fechado) && (
        <p className="forum-meta">
          <Marcadores fixado={topico.fixado} fechado={fechado} />
        </p>
      )}
      {corpo.trim() !== '' && <p className="forum-corpo">{corpo}</p>}
      <BlocoDeAudio topico={topico} />
      {fechado && (
        <p className="forum-faixa-fechado">
          Este tópico está fechado. Dá pra ler tudo, mas não aceita novas respostas.
        </p>
      )}
    </article>
  );
}

// ---------------------------------------------------------------------------
// Respostas
// ---------------------------------------------------------------------------

function ItemDeResposta({
  no,
  porId,
  agora,
  idParaFocar,
}: {
  readonly no: NoDeResposta<RespostaDoForum>;
  readonly porId: ReadonlyMap<string, RespostaDoForum>;
  readonly agora: number;
  readonly idParaFocar: string | null;
}) {
  const r = no.resposta;
  const li = useRef<HTMLLIElement>(null);
  useEffect(() => {
    if (idParaFocar === r.id) li.current?.focus();
  }, [idParaFocar, r.id]);

  const casca = r.status !== 'visivel' || r.corpo === null;
  const pai = r.paiId ? porId.get(r.paiId) : undefined;
  const handleDoPai = pai?.autor?.handle ?? null;
  const respondeNivelDois = r.nivel === 2 && pai?.nivel === 2 && handleDoPai;

  return (
    <li className="forum-resposta" data-nivel={r.nivel} ref={li} tabIndex={-1}>
      {casca ? (
        <p className="forum-resposta__casca">
          {r.status === 'oculto' ? 'Resposta oculta.' : r.status === 'removido' ? 'Resposta removida.' : 'Resposta indisponível.'}
        </p>
      ) : (
        <>
          <p className="forum-resposta__autoria">
            {r.autor && <Avatar nome={nomeDoAutor(r.autor)} url={r.autor.avatarUrl} pequeno={r.nivel === 2} />}
            {r.autor && <NomeDoAutor autor={r.autor} forte />}
            {r.autor?.apelido && r.autor.handle && <span className="forum-muted">@{r.autor.handle}</span>}
            <Tempo iso={r.criadoEm} agora={agora} />
            {r.editadoEm && <span className="forum-muted">editado</span>}
          </p>
          {respondeNivelDois && <p className="forum-resposta__referencia">Respondendo a @{handleDoPai}</p>}
          <p className="forum-resposta__corpo">{normalizarQuebras(r.corpo ?? '')}</p>
        </>
      )}
      {no.filhas.length > 0 && (
        <ul className="forum-respostas forum-respostas--filhas">
          {no.filhas.map((filha) => (
            <ItemDeResposta key={filha.resposta.id} no={filha} porId={porId} agora={agora} idParaFocar={idParaFocar} />
          ))}
        </ul>
      )}
    </li>
  );
}

function Respostas({ topico, agora }: { readonly topico: TopicoDoForum; readonly agora: number }) {
  const { forum, ambiente } = useDependenciasDoForum();
  const online = useOnline(ambiente);
  const anunciar = useAnunciar();
  const id = topico.id;

  const lista = useListaPaginada<RespostaDoForum, CursorDoForum>({
    chave: id,
    substantivo: 'respostas',
    carregarPagina: (cursor) => forum.listarRespostasDoTopico(id, { limite: TAMANHO_DA_PAGINA_DE_RESPOSTAS, cursor }),
  });
  const anuncio = lista.anuncio;
  useEffect(() => {
    if (anuncio) anunciar(anuncio.texto);
  }, [anuncio, anunciar]);

  let corpo;
  if (lista.fase === 'carregando') {
    corpo = <Esqueleto forma="lista" anuncio="Carregando respostas" />;
  } else if (lista.fase === 'erro') {
    corpo = <EstadoDeErro titulo="Deu ruim pra carregar as respostas." offline={!online} aoTentar={lista.recarregar} />;
  } else if (lista.itens.length === 0) {
    corpo = <p className="forum-aviso">Ninguém respondeu ainda.</p>;
  } else {
    const porId = new Map(lista.itens.map((r) => [r.id, r]));
    corpo = (
      <>
        <ul className="forum-respostas">
          {montarArvoreDeRespostas(lista.itens).map((no) => (
            <ItemDeResposta key={no.resposta.id} no={no} porId={porId} agora={agora} idParaFocar={lista.idParaFocar} />
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
    <section className="forum-conversa" aria-labelledby="forum-respostas-titulo">
      <div className="forum-conversa__cabeca">
        <h2 id="forum-respostas-titulo" className="forum-secao">
          {textoDeRespostas(topico.respostasTotal)}
        </h2>
        <span className="forum-muted">Mais antigas primeiro</span>
      </div>
      {corpo}
    </section>
  );
}

/** Aside do desktop: quem é a comunidade. A falha da leitura só tira a descrição. */
function AsideDoTopico({ topico }: { readonly topico: TopicoDoForum }) {
  const { forum } = useDependenciasDoForum();
  const slug = topico.comunidade.slug;
  const { estado } = useLeitura(() => forum.obterComunidadeDoForum(slug), `aside:${slug}`);
  const comunidade = estado.fase === 'pronto' ? estado.valor : null;
  return (
    <NoAside>
      <AsideSobreAComunidade referencia={topico.comunidade} comunidade={comunidade} />
    </NoAside>
  );
}

// ---------------------------------------------------------------------------
// A tela
// ---------------------------------------------------------------------------

/**
 * Tela 3 (spec 9): a conversa. `obter_topico` não distingue ausente, oculto,
 * removido nem id errado: é uma tela só, "não está disponível". O `id` é global;
 * se o slug da URL não for o da comunidade do tópico, a URL é corrigida
 * (`replace`) e o tópico nunca aparece debaixo de outra comunidade.
 */
export function TelaTopico() {
  const { slug = '', id = '' } = useParams<{ slug: string; id: string }>();
  const { forum, ambiente } = useDependenciasDoForum();
  const online = useOnline(ambiente);
  const { estado, recarregar } = useLeitura(() => forum.obterTopico(id), `topico:${id}`);

  const topico = estado.fase === 'pronto' ? estado.valor : null;
  useTituloDoDocumento(topico ? `${topico.titulo} · ${topico.comunidade.nome}` : 'Conversa');

  const voltarParaSlug = { para: enderecoDaComunidade(slug), rotulo: 'a comunidade' };

  if (estado.fase === 'carregando') {
    return (
      <>
        <TopoDaTela titulo="Conversa" voltar={voltarParaSlug} />
        <Esqueleto forma="topico" anuncio="Carregando tópico" />
      </>
    );
  }
  if (estado.fase === 'erro') {
    return (
      <>
        <TopoDaTela titulo="Conversa" voltar={voltarParaSlug} />
        <EstadoDeErro tela titulo="Deu ruim pra carregar o tópico." offline={!online} aoTentar={recarregar} />
      </>
    );
  }
  if (topico === null) {
    return (
      <>
        <TopoDaTela titulo="Conversa" voltar={voltarParaSlug} />
        <EstadoDeMolde
          tela
          titulo="Esse tópico não está disponível."
          linha="Ele pode ter sido apagado, estar oculto, ou o endereço está errado."
          acao={<BotaoComoLink para={enderecoDaComunidade(slug)}>Voltar para a comunidade</BotaoComoLink>}
        />
      </>
    );
  }
  if (topico.comunidade.slug !== slug) {
    return <Navigate to={enderecoDoTopico(topico.comunidade.slug, topico.id)} replace />;
  }

  const agora = ambiente.agora();
  return (
    <>
      <TopoDaTela
        titulo={topico.comunidade.nome}
        voltar={{ para: enderecoDaComunidade(topico.comunidade.slug), rotulo: topico.comunidade.nome }}
      />
      <AsideDoTopico topico={topico} />
      <CabecalhoDoTopico topico={topico} agora={agora} />
      <Respostas topico={topico} agora={agora} />
    </>
  );
}
