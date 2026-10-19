import { Link, useSearchParams } from 'react-router-dom';
import { nomeDoAutor } from '../../nucleo/forum/apresentacao';
import type { CursorDoForum } from '../../portas/forum';
import { AlternarOrdem, BotaoComoLink, EstadoVazio, type DadosDaLinhaDeTopico } from './componentes';
import { useDependenciasDoForum } from './contexto';
import { useListaPaginada, useOnline } from './hooks';
import { ListaDeTopicos } from './ListaDeTopicos';
import { ordemDaUrl } from './ordem';
import { TopoDaTela, useTituloDoDocumento } from './ShellDoForum';

/**
 * Tela 5 (spec 11): tópicos de todas as comunidades, cada um com a sua à vista.
 * Não é timeline: sem composer, sem "Para você", sem trecho de corpo.
 */
export function TelaExplorar() {
  const { forum, ambiente } = useDependenciasDoForum();
  const online = useOnline(ambiente);
  const [params, setParams] = useSearchParams();
  const ordem = ordemDaUrl(params.get('ordem'));
  useTituloDoDocumento('Explorar');

  const lista = useListaPaginada<DadosDaLinhaDeTopico, CursorDoForum>({
    chave: `explorar|${ordem}`,
    chaveDeMemoria: `explorar|${ordem}`,
    substantivo: 'tópicos',
    carregarPagina: async (cursor) => {
      const r = await forum.explorarTopicos({ ordem, limite: 30, cursor });
      if (!r.ok) return r;
      return {
        ok: true,
        valor: {
          proximo: r.valor.proximo,
          itens: r.valor.itens.map(
            (t): DadosDaLinhaDeTopico => ({
              id: t.id,
              titulo: t.titulo,
              // O Explorar não ordena por fixado: o marcador fica de fora desta lista.
              fixado: false,
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
      <TopoDaTela titulo="Explorar" />
      <p className="forum-apoio">
        Procurando uma turma? <Link to="/comunidades">Ver comunidades</Link>
      </p>
      <AlternarOrdem
        ordem={ordem}
        aoMudar={(nova) => setParams(nova === 'recentes' ? { ordem: 'novos' } : {}, { replace: true })}
      />
      <ListaDeTopicos
        lista={lista}
        comComunidade
        tituloDoErro="Deu ruim pra carregar os tópicos."
        offline={!online}
        agora={ambiente.agora()}
        vazio={
          <EstadoVazio
            titulo="Nada rolando por aí ainda."
            linha="Entra numa comunidade e abre o primeiro tópico."
            acao={<BotaoComoLink para="/comunidades">Ver comunidades</BotaoComoLink>}
          />
        }
      />
    </>
  );
}
