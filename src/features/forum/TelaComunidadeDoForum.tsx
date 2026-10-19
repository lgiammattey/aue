import { useEffect, useRef } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
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
import { useDependenciasDoForum } from './contexto';
import { useLeitura, useListaPaginada, useOnline } from './hooks';
import { ListaDeTopicos } from './ListaDeTopicos';
import { metaDoCabecalho } from './metaDoCabecalho';
import { ordemDaUrl } from './ordem';
import { usePapel } from './papel';
import { AsideDeRegras, RegrasEmDetalhes } from './RegrasDaCasa';
import { NoAside, TopoDaTela, useTituloDoDocumento } from './ShellDoForum';

const TAMANHO_DA_PAGINA = 30;

function Cabecalho({ comunidade, souMembro }: { readonly comunidade: ComunidadeDoForum; readonly souMembro: boolean }) {
  const h1 = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    h1.current?.focus({ preventScroll: true });
  }, [comunidade.slug]);

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
      {souMembro && <p className="forum-meta forum-meta--forte">Você participa</p>}
      <RegrasEmDetalhes />
    </section>
  );
}

function TopicosDaComunidade({ comunidade }: { readonly comunidade: ComunidadeDoForum }) {
  const { forum, ambiente } = useDependenciasDoForum();
  const online = useOnline(ambiente);
  const [params, setParams] = useSearchParams();
  const ordem = ordemDaUrl(params.get('ordem'));
  const slug = comunidade.slug;

  const lista = useListaPaginada<DadosDaLinhaDeTopico, CursorDeTopicos>({
    chave: `${slug}|${ordem}`,
    chaveDeMemoria: `c:${slug}|${ordem}`,
    substantivo: 'tópicos',
    // A lista não usa corpo nem caminho de áudio: não entram no estado (spec 2.4, item 2).
    carregarPagina: async (cursor) => {
      const r = await forum.listarTopicos(slug, { ordem, limite: TAMANHO_DA_PAGINA, cursor });
      if (!r.ok) return r;
      return {
        ok: true,
        valor: {
          proximo: r.valor.proximo,
          itens: r.valor.itens.map(
            (t): DadosDaLinhaDeTopico => ({
              id: t.id,
              titulo: t.titulo,
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
          <EstadoVazio
            titulo="Nenhum tópico ainda."
            linha="Ninguém abriu assunto por aqui ainda."
          />
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
  const papel = usePapel();
  const online = useOnline(ambiente);

  const { estado, recarregar } = useLeitura(() => forum.obterComunidadeDoForum(slug), `comunidade:${slug}`);
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

  const souMembro = comunidade.souMembro || (papel.tipo === 'conta' && papel.slugsDeMembro.has(comunidade.slug));

  return (
    <>
      <TopoDaTela titulo={comunidade.nome} voltar={voltar} />
      <NoAside>
        <AsideDeRegras />
      </NoAside>
      <Cabecalho comunidade={comunidade} souMembro={souMembro} />
      <TopicosDaComunidade comunidade={comunidade} />
    </>
  );
}
