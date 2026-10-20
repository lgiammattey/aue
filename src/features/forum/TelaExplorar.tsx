import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { nomeDoAutor } from '../../nucleo/forum/apresentacao';
import type { CursorDoForum } from '../../portas/forum';
import { BuscaDoForum, TAMANHO_MINIMO_DA_BUSCA, tipoDaBuscaNaUrl } from './BuscaDoForum';
import { AlternarOrdem, BotaoComoLink, EstadoVazio, type DadosDaLinhaDeTopico } from './componentes';
import { useDependenciasDoForum } from './contexto';
import { useListaPaginada, useOnline } from './hooks';
import { ListaDeTopicos } from './ListaDeTopicos';
import { ordemDaUrl } from './ordem';
import { TopoDaTela } from './ShellDoForum';
import { useTituloDoDocumento } from './encaixes';

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
  const termo = (params.get('q') ?? '').trim();
  const tipoDaBusca = tipoDaBuscaNaUrl(params.get('tipo'));
  const buscando = termo.length >= TAMANHO_MINIMO_DA_BUSCA && Boolean(forum.buscarNoAue);
  const [rascunho, setRascunho] = useState(params.get('q') ?? '');

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

  const buscar = (evento: React.FormEvent) => {
    evento.preventDefault();
    const novo = rascunho.trim();
    setParams(novo ? { q: novo } : {}, { replace: false });
  };

  return (
    <>
      <TopoDaTela titulo="Explorar" />
      {forum.buscarNoAue && (
        <form role="search" onSubmit={buscar} className="forum-busca">
          <label className="sr-only" htmlFor="busca-do-explorar">Buscar pessoas, rodas e publicações</label>
          <input
            id="busca-do-explorar"
            type="search"
            value={rascunho}
            maxLength={60}
            placeholder="Buscar pessoas, rodas e publicações"
            onChange={(e) => setRascunho(e.target.value)}
          />
          <button type="submit" className="forum-botao forum-botao--contorno">Buscar</button>
          {termo !== '' && termo.length < TAMANHO_MINIMO_DA_BUSCA && (
            <p role="status" className="forum-busca__nota">Digite pelo menos {TAMANHO_MINIMO_DA_BUSCA} letras.</p>
          )}
        </form>
      )}
      {buscando ? (
        <BuscaDoForum
          termo={termo}
          tipo={tipoDaBusca}
          aoMudarTipo={(tipo) => setParams({ q: termo, tipo }, { replace: true })}
        />
      ) : (
        <>
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
      )}
    </>
  );
}
