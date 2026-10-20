import { useCallback, useEffect, useRef, useState } from 'react';
import { Outlet, useParams, useSearchParams } from 'react-router-dom';
import type { RefObject } from 'react';
import type { ComunidadeDoForum, CursorDeTopicos } from '../../portas/forum';
import { nomeDoAutor } from '../../nucleo/forum/apresentacao';
import {
  AlternarOrdem,
  BotaoComoLink,
  EstadoDeErro,
  EstadoDeMolde,
  EstadoVazio,
  Esqueleto,
  Monograma,
  type DadosDaLinhaDeTopico,
} from './componentes';
import { AcoesDaComunidade } from './AcoesDaComunidade';
import { useDependenciasDoForum } from './contexto';
import { useLeitura, useListaPaginada, useOnline } from './hooks';
import { ListaDeTopicos } from './ListaDeTopicos';
import { metaDoCabecalho } from './metaDoCabecalho';
import { ordemDaUrl } from './ordem';
import { usePapel, useSouMembro } from './papel';
import { AsideDeRegras, RegrasEmDetalhes } from './RegrasDaCasa';
import { NoAside, TopoDaTela } from './ShellDoForum';
import type { ContextoDaComunidade } from './TelaNovoTopico';
import { useTituloDoDocumento } from './encaixes';

const TAMANHO_DA_PAGINA = 30;

/** Spec 8.4: o vazio aponta para a ação que a pessoa tem de verdade, sem repetir o botão. */
function linhaDoVazio(papel: 'carregando' | 'visitante' | 'conta' | 'desconhecido', souMembro: boolean): string {
  if (souMembro) return 'Abre o primeiro. O botão Novo tópico está aí em cima.';
  if (papel === 'visitante') return 'Cria sua conta pra abrir o primeiro.';
  if (papel === 'conta') return 'Participa da comunidade pra abrir o primeiro.';
  return 'Ninguém abriu assunto por aqui ainda.';
}

function Cabecalho({
  comunidade,
  souMembro,
  h1,
  gatilho,
  aoMudarParticipacao,
}: {
  readonly comunidade: ComunidadeDoForum;
  readonly souMembro: boolean;
  readonly h1: RefObject<HTMLHeadingElement | null>;
  readonly gatilho: RefObject<HTMLAnchorElement | null>;
  readonly aoMudarParticipacao: () => void;
}) {
  useEffect(() => {
    h1.current?.focus({ preventScroll: true });
  }, [comunidade.slug, h1]);

  return (
    <section className="forum-cabecalho" aria-labelledby="forum-h1">
      <div className="forum-cabecalho__linha">
        <Monograma nome={comunidade.nome} tamanho="cabecalho" />
        <h1 id="forum-h1" className="forum-h1" ref={h1} tabIndex={-1}>
          {comunidade.nome}
        </h1>
      </div>
      {comunidade.descricao && <p className="forum-cabecalho__descricao">{comunidade.descricao}</p>}
      <p className="forum-meta">{metaDoCabecalho(comunidade)}</p>
      <AcoesDaComunidade
        comunidade={comunidade}
        souMembro={souMembro}
        gatilho={gatilho}
        aoMudarParticipacao={aoMudarParticipacao}
      />
      <RegrasEmDetalhes />
    </section>
  );
}

function TopicosDaComunidade({
  comunidade,
  versao,
  souMembro,
}: {
  readonly comunidade: ComunidadeDoForum;
  /** Sobe quando a pessoa pede para conferir a lista (falha ambígua ao criar): a lista recomeça do servidor. */
  readonly versao: number;
  readonly souMembro: boolean;
}) {
  const papel = usePapel();
  const { forum, ambiente } = useDependenciasDoForum();
  const online = useOnline(ambiente);
  const [params, setParams] = useSearchParams();
  const ordem = ordemDaUrl(params.get('ordem'));
  const slug = comunidade.slug;

  const lista = useListaPaginada<DadosDaLinhaDeTopico, CursorDeTopicos>({
    chave: `${slug}|${ordem}|${versao}`,
    chaveDeMemoria: `c:${slug}|${ordem}`,
    substantivo: 'tópicos',
    // A lista não usa corpo nem caminho de áudio: não entram no estado (spec 2.4, item 2).
    carregarPagina: async (cursor) => {
      const r = await forum.listarTopicos(slug, { ordem, limite: TAMANHO_DA_PAGINA, cursor });
      if (!r.ok) return r;
      const listarPrevias = forum.listarPreviaRespostasDosTopicos;
      // A prévia pertence à página, não ao card: uma chamada em lote evita N+1.
      // Adaptadores anteriores à porta continuam mostrando o feed, só sem prévias.
      const previasPorTopico = new Map<string, readonly { readonly id: string; readonly corpo: string | null }[]>();
      if (listarPrevias && r.valor.itens.length > 0) {
        const ids = [...new Set(r.valor.itens.map((topico) => topico.id))];
        const previas = await listarPrevias(ids);
        if (!previas.ok) return previas;
        for (const topicoId of ids) {
          previasPorTopico.set(
            topicoId,
            previas.valor
              .filter((previa) => previa.topicoId === topicoId)
              .slice(0, 2)
              .map(({ resposta }) => ({ id: resposta.id, corpo: resposta.corpo })),
          );
        }
      }
      return {
        ok: true,
        valor: {
          proximo: r.valor.proximo,
          itens: r.valor.itens.map(
            (t): DadosDaLinhaDeTopico => ({
              id: t.id,
              titulo: t.titulo,
              corpo: t.corpo,
              ...(previasPorTopico.has(t.id) ? { previasDeRespostas: previasPorTopico.get(t.id) } : {}),
              fixado: t.fixado,
              status: t.status,
              criadoEm: t.criadoEm,
              ultimaAtividadeEm: t.ultimaAtividadeEm,
              respostasTotal: t.respostasTotal,
              comunidade: { slug: t.comunidade.slug, nome: t.comunidade.nome },
              autorNome: nomeDoAutor(t.autor),
            }),
          ),
        },
      };
    },
  });

  return (
    <>
      <AlternarOrdem
        ordem={ordem}
        aoMudar={(nova) => setParams(nova === 'recentes' ? { ordem: 'novos' } : {}, { replace: true })}
      />
      <ListaDeTopicos
        lista={lista}
        tituloDoErro="Deu ruim pra carregar os tópicos."
        offline={!online}
        agora={ambiente.agora()}
        vazio={
          <EstadoVazio titulo="Nenhum tópico ainda." linha={linhaDoVazio(papel.tipo, souMembro)} />
        }
      />
    </>
  );
}

/**
 * Tela 2 (spec 8): a comunidade e os tópicos DELA. A URL manda: slug que o
 * servidor não conhece é "não existe", nunca o mural de outra comunidade, e
 * isso se decide por `obterComunidadeDoForum` ANTES de listar tópicos (a lista
 * de slug desconhecido volta `ok` e vazia, igual a uma comunidade sem tópico).
 */
export function TelaComunidadeDoForum() {
  const { slug = '' } = useParams<{ slug: string }>();
  const { forum, ambiente } = useDependenciasDoForum();
  const online = useOnline(ambiente);

  const { estado, recarregar, atualizar } = useLeitura(() => forum.obterComunidadeDoForum(slug), `comunidade:${slug}`);
  const [versaoDaLista, setVersaoDaLista] = useState(0);
  const gatilho = useRef<HTMLAnchorElement>(null);
  const h1 = useRef<HTMLHeadingElement>(null);
  const conferirLista = useCallback(() => setVersaoDaLista((v) => v + 1), []);
  const atualizarComunidade = useCallback(() => void atualizar(), [atualizar]);
  const focarTitulo = useCallback(() => h1.current?.focus({ preventScroll: true }), []);
  const souMembro = useSouMembro(slug, estado.fase === 'pronto' && estado.valor ? estado.valor.souMembro : false);
  const nome = estado.fase === 'pronto' && estado.valor ? estado.valor.nome : null;
  useTituloDoDocumento(nome ?? 'Comunidade');

  const voltar = { para: '/comunidades', rotulo: 'Comunidades' };

  if (estado.fase === 'carregando') {
    return (
      <>
        <TopoDaTela titulo="Comunidade" voltar={voltar} />
        <Esqueleto forma="cabecalho" anuncio="Carregando comunidade" />
      </>
    );
  }
  if (estado.fase === 'erro') {
    return (
      <>
        <TopoDaTela titulo="Comunidade" voltar={voltar} />
        <EstadoDeErro tela titulo="Deu ruim pra carregar a comunidade." offline={!online} aoTentar={recarregar} />
      </>
    );
  }
  const comunidade = estado.valor;
  if (comunidade === null) {
    return (
      <>
        <TopoDaTela titulo="Comunidade" voltar={voltar} />
        <EstadoDeMolde
          tela
          titulo="Essa comunidade não existe."
          linha="Confere o endereço ou procura outra turma."
          acao={<BotaoComoLink para="/comunidades">Ver comunidades</BotaoComoLink>}
        />
      </>
    );
  }

  const contexto: ContextoDaComunidade = {
    comunidade,
    souMembro,
    gatilho,
    conferirLista,
    atualizarComunidade,
    focarTitulo,
  };

  return (
    <>
      <TopoDaTela titulo={comunidade.nome} voltar={voltar} />
      <NoAside>
        <AsideDeRegras />
      </NoAside>
      <Cabecalho
        comunidade={comunidade}
        souMembro={souMembro}
        h1={h1}
        gatilho={gatilho}
        aoMudarParticipacao={atualizarComunidade}
      />
      <TopicosDaComunidade comunidade={comunidade} versao={versaoDaLista} souMembro={souMembro} />
      <Outlet context={contexto} />
    </>
  );
}
