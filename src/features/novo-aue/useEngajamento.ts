import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { CausoPostado, PortaDeComunidade } from '../../portas/comunidade';
import type { PortaDeForum, ReacaoDoTopico } from '../../portas/forum';
import type { EngajamentoDoPost, ItemDoFeed } from './tipos';

const ZERO: EngajamentoDoPost = { like: 0, fogo: 0, nojo: 0, trofeu: 0, minhas: [] };

/** Causo já traz contagens e as marcas da conta; aqui só se traduz. */
export function engajamentoDoCauso(c: CausoPostado): EngajamentoDoPost {
  const minhas: ReacaoDoTopico[] = [];
  if (c.curtidoPorMim) minhas.push('like');
  if (c.minhaReacao) minhas.push(c.minhaReacao);
  return { like: c.curtidas, fogo: c.reacoes.fogo, nojo: c.reacoes.nojo, trofeu: c.reacoes.trofeu, minhas };
}

/**
 * O causo da porta de comunidade como item do card. Um mapeamento só para as
 * telas que listam causos (Seguindo e perfil): nada de copiar o bloco.
 */
export function causoParaItemDoFeed(causo: CausoPostado): ItemDoFeed {
  return {
    id: `causo-${causo.id}`,
    tipo: 'causo',
    comunidadeSlug: causo.comunidadeSlug || 'eu-arroto-e-dai',
    titulo: causo.conteudo.slice(0, 65) + (causo.conteudo.length > 65 ? '…' : ''),
    corpo: causo.conteudo,
    autorNome: causo.autorNome,
    autorHandle: causo.autorHandle,
    // Sem data não se inventa uma: o card omite o tempo.
    criadoEm: causo.criadoEm,
    respostasTotal: causo.totalComentarios || 0,
    temAudio: causo.temAudio,
    enderecoDoAudio: causo.enderecoDoAudio,
    nota: causo.nota,
    duracaoSegundos: causo.duracaoSegundos,
    videoUrl: causo.videoUrl,
    engajamento: engajamentoDoCauso(causo),
  };
}

const idLimpo = (post: ItemDoFeed) => post.id.replace(/^(topico|causo)-/, '');
const chaveDeSalvo = (post: ItemDoFeed) => `${post.tipo}:${idLimpo(post)}`;

interface Opcoes {
  readonly forum: PortaDeForum;
  readonly comunidadePort: PortaDeComunidade;
  readonly estaAutenticado: boolean;
  /** Visitante: explica e leva para entrar. */
  readonly aoPedirEntrada: (mensagem: string) => void;
  readonly exibirToast: (mensagem: string) => void;
  /** Tudo o que está na tela; tópicos novos têm as contagens buscadas uma vez. */
  readonly itens: readonly ItemDoFeed[];
}

/**
 * Curtir, reagir e salvar em qualquer card, para tópico e causo.
 * Nada é contado na tela por conta própria: depois de cada ação a contagem é lida
 * de novo no servidor, e falha mostra o motivo sem mexer no que já estava.
 */
export function useEngajamento({ forum, comunidadePort, estaAutenticado, aoPedirEntrada, exibirToast, itens }: Opcoes) {
  const [engajamento, setEngajamento] = useState<Readonly<Record<string, EngajamentoDoPost>>>({});
  const [salvos, setSalvos] = useState<ReadonlySet<string>>(new Set());
  const jaPedidos = useRef(new Set<string>());
  const ocupados = useRef(new Set<string>());

  const idsDeTopicos = useMemo(
    () => [...new Set(itens.filter((i) => i.tipo === 'topico').map(idLimpo))].sort().join(','),
    [itens],
  );

  useEffect(() => {
    const contar = forum.contarReacoesDosTopicos;
    if (!contar || !idsDeTopicos) return;
    const novos = idsDeTopicos.split(',').filter((id) => !jaPedidos.current.has(id));
    if (novos.length === 0) return;
    novos.forEach((id) => jaPedidos.current.add(id));
    let ativo = true;
    for (let i = 0; i < novos.length; i += 100) {
      const lote = novos.slice(i, i + 100);
      contar.call(forum, lote).then(
        (r) => {
          if (!ativo) return;
          if (!r.ok) {
            lote.forEach((id) => jaPedidos.current.delete(id));
            return;
          }
          setEngajamento((atual) => {
            const proximo = { ...atual };
            for (const id of lote) {
              const c = r.valor[id];
              proximo[`topico-${id}`] = c ? { ...c.total, minhas: c.minhas } : ZERO;
            }
            return proximo;
          });
        },
        () => lote.forEach((id) => jaPedidos.current.delete(id)),
      );
    }
    return () => {
      ativo = false;
    };
  }, [forum, idsDeTopicos]);

  useEffect(() => {
    if (!estaAutenticado || !forum.listarIdsSalvos) {
      setSalvos(new Set());
      return;
    }
    let ativo = true;
    void forum.listarIdsSalvos().then((r) => {
      if (ativo && r.ok) setSalvos(new Set(r.valor.map((x) => `${x.tipo}:${x.id}`)));
    }).catch(() => undefined);
    return () => {
      ativo = false;
    };
  }, [estaAutenticado, forum]);

  const reagir = useCallback(async (post: ItemDoFeed, tipo: ReacaoDoTopico) => {
    if (!estaAutenticado) {
      aoPedirEntrada('Entre na sua conta para reagir.');
      return;
    }
    const trava = `r:${post.id}`;
    if (ocupados.current.has(trava)) return;
    ocupados.current.add(trava);
    const id = idLimpo(post);
    try {
      if (post.tipo === 'topico') {
        const r = await forum.alternarReacaoDoTopico?.(id, tipo);
        if (!r?.ok) {
          exibirToast(
            r?.motivo === 'precisaEntrar'
              ? 'Entre com sua conta para reagir.'
              : r?.motivo === 'limiteDeFrequencia'
                ? 'Muita reação de uma vez. Tenta daqui a pouco.'
                : 'Não deu para registrar sua reação agora.',
          );
          return;
        }
        const c = await forum.contarReacoesDosTopicos?.([id]);
        if (c?.ok) {
          const dado = c.valor[id];
          setEngajamento((atual) => ({ ...atual, [post.id]: dado ? { ...dado.total, minhas: dado.minhas } : ZERO }));
        }
      } else {
        const r = tipo === 'like'
          ? await comunidadePort.alternarCurtida(id)
          : await comunidadePort.alternarReacao(id, tipo);
        if (!r.ok) {
          exibirToast('Não deu para registrar sua reação agora.');
          return;
        }
        const atualizado = await comunidadePort.obterCauso(id);
        if (atualizado) setEngajamento((atual) => ({ ...atual, [post.id]: engajamentoDoCauso(atualizado) }));
      }
    } catch {
      exibirToast('Não deu para registrar sua reação agora.');
    } finally {
      ocupados.current.delete(trava);
    }
  }, [estaAutenticado, aoPedirEntrada, exibirToast, forum, comunidadePort]);

  const alternarSalvo = useCallback(async (post: ItemDoFeed) => {
    if (!estaAutenticado) {
      aoPedirEntrada('Entre na sua conta para salvar.');
      return;
    }
    const alternar = forum.alternarSalvo;
    if (!alternar) return;
    const chave = chaveDeSalvo(post);
    const trava = `s:${chave}`;
    if (ocupados.current.has(trava)) return;
    ocupados.current.add(trava);
    try {
      const r = await alternar.call(forum, post.tipo, idLimpo(post));
      if (!r.ok) {
        exibirToast(r.motivo === 'topicoNaoEncontrado'
          ? 'Esse post não está mais disponível.'
          : r.motivo === 'limiteDeFrequencia'
            ? 'Muita coisa de uma vez. Tenta daqui a pouco.'
          : r.motivo === 'precisaEntrar'
            ? 'Entre com sua conta para salvar.'
            : 'Não deu para salvar agora.');
        return;
      }
      setSalvos((atual) => {
        const proximo = new Set(atual);
        if (r.valor) proximo.add(chave);
        else proximo.delete(chave);
        return proximo;
      });
      exibirToast(r.valor ? 'Salvo.' : 'Removido dos salvos.');
    } catch {
      exibirToast('Não deu para salvar agora.');
    } finally {
      ocupados.current.delete(trava);
    }
  }, [estaAutenticado, aoPedirEntrada, exibirToast, forum]);

  /** Tudo o que o card precisa. Só liga o botão que tem o que chamar. */
  const propsDeEngajamento = (post: ItemDoFeed) => {
    // Sem contagem do servidor e sem `post.engajamento`, nada é entregue: o card
    // não mostra "0" antes de a contagem chegar.
    const atual = engajamento[post.id] ?? post.engajamento;
    const podeReagir = post.tipo === 'causo' || Boolean(forum.alternarReacaoDoTopico);
    return {
      reacoes: atual,
      minhas: atual?.minhas,
      salvo: salvos.has(chaveDeSalvo(post)),
      aoCurtir: podeReagir ? () => void reagir(post, 'like') : undefined,
      aoReagir: podeReagir ? (tipo: 'fogo' | 'nojo' | 'trofeu') => void reagir(post, tipo) : undefined,
      aoAlternarSalvar: forum.alternarSalvo ? () => void alternarSalvo(post) : undefined,
    };
  };

  return { propsDeEngajamento };
}
