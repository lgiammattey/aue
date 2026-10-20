/* oxlint-disable react/only-export-components -- arquivo de dublês: exporta funções e o componente de montagem juntos */
/**
 * Dublês das portas do fórum, só para os testes de tela. Nada aqui chega ao
 * navegador de verdade: quem monta a página de produção usa os adaptadores.
 */
import { MemoryRouter, Routes, useLocation, useNavigate } from 'react-router-dom';
import { vi } from 'vitest';
import type { AmbienteDoForum, TemaDoForum } from '../../portas/ambienteDoForum';
import type { ArmazenamentoLocal } from '../../portas/armazenamento';
import type { PortaDeComunidade } from '../../portas/comunidade';
import type { EstadoDaConta, PortaDeConta } from '../../portas/conta';
import type {
  ComunidadeDoForum,
  PortaDeForum,
  RespostaDoForum,
  TopicoDoExplorar,
  TopicoDoForum,
} from '../../portas/forum';
import { ForumProvider, type DependenciasDoForum } from './contexto';
import { rotasDoForum } from './rotas';

export const AGORA = new Date(2026, 9, 19, 15, 0, 0).getTime();

export function comunidade(parcial: Partial<ComunidadeDoForum> = {}): ComunidadeDoForum {
  const slug = parcial.slug ?? 'reuniao-da-firma';
  return {
    id: `id-${slug}`,
    slug,
    nome: 'Na reunião da firma',
    descricao: 'A culpa jogada no ar condicionado.',
    icone: null,
    membrosTotal: 34,
    topicosTotal: 12,
    ultimaAtividadeEm: new Date(AGORA - 2 * 3_600_000).toISOString(),
    souMembro: false,
    ...parcial,
  };
}

export function topico(parcial: Partial<TopicoDoForum> = {}): TopicoDoForum {
  const comunidadeRef = parcial.comunidade ?? { id: 'id-reuniao-da-firma', slug: 'reuniao-da-firma', nome: 'Na reunião da firma' };
  return {
    id: '11111111-1111-4111-8111-111111111111',
    comunidade: comunidadeRef,
    autor: { id: 'a1', apelido: 'Ana Souza', handle: 'ana', avatarUrl: null },
    titulo: 'Arroto na reunião de segunda',
    corpo: 'Saiu na hora do café.',
    status: 'aberto',
    fixado: false,
    criadoEm: new Date(AGORA - 3 * 86_400_000).toISOString(),
    editadoEm: null,
    ultimaAtividadeEm: new Date(AGORA - 3 * 3_600_000).toISOString(),
    respostasTotal: 0,
    souAutor: false,
    audio: null,
    ...parcial,
  };
}

export function resposta(parcial: Partial<RespostaDoForum> & { id: string }): RespostaDoForum {
  return {
    topicoId: '11111111-1111-4111-8111-111111111111',
    paiId: null,
    nivel: 0,
    autor: { id: 'a2', apelido: 'Bia Lima', handle: 'bia', avatarUrl: null },
    corpo: `texto ${parcial.id}`,
    status: 'visivel',
    criadoEm: new Date(AGORA - 2 * 3_600_000).toISOString(),
    editadoEm: null,
    souAutor: false,
    ...parcial,
  };
}

export function itemDoExplorar(parcial: Partial<TopicoDoExplorar> & { id: string }): TopicoDoExplorar {
  return {
    comunidade: { id: 'id-cerveja', slug: 'cerveja-gelada', nome: 'Cerveja Gelada' },
    autor: { id: 'a1', apelido: 'Ana Souza', handle: 'ana', avatarUrl: null },
    titulo: `Tópico ${parcial.id}`,
    status: 'aberto',
    fixado: false,
    criadoEm: new Date(AGORA - 3 * 86_400_000).toISOString(),
    ultimaAtividadeEm: new Date(AGORA - 3 * 3_600_000).toISOString(),
    respostasTotal: 8,
    ...parcial,
    // O contrato de explorar ainda não tipa `corpo`; a tela o trata como
    // opcional enquanto o adaptador novo é integrado.
    corpo: `Post ${parcial.id}`,
  } as TopicoDoExplorar;
}

/** Porta do fórum que falha alto se a tela chamar o que o teste não previu. */
export function forumFalso(partes: Partial<PortaDeForum> = {}): PortaDeForum {
  const naoPrevisto = (nome: string) => vi.fn(async () => {
    throw new Error(`Chamada não prevista: ${nome}`);
  });
  return {
    listarComunidadesDoForum: naoPrevisto('listarComunidadesDoForum'),
    obterComunidadeDoForum: naoPrevisto('obterComunidadeDoForum'),
    listarTopicos: naoPrevisto('listarTopicos'),
    obterTopico: naoPrevisto('obterTopico'),
    listarRespostasDoTopico: naoPrevisto('listarRespostasDoTopico'),
    explorarTopicos: naoPrevisto('explorarTopicos'),
    listarTopicosDoAutor: naoPrevisto('listarTopicosDoAutor'),
    listarRespostasDoAutor: naoPrevisto('listarRespostasDoAutor'),
    criarTopico: naoPrevisto('criarTopico'),
    responderTopico: naoPrevisto('responderTopico'),
    editarTopico: naoPrevisto('editarTopico'),
    editarResposta: naoPrevisto('editarResposta'),
    apagarTopico: naoPrevisto('apagarTopico'),
    apagarResposta: naoPrevisto('apagarResposta'),
    denunciarTopico: naoPrevisto('denunciarTopico'),
    denunciarResposta: naoPrevisto('denunciarResposta'),
    ...partes,
  } as PortaDeForum;
}

export function contaFalsa(estado: Partial<EstadoDaConta> | 'quebrada'): PortaDeConta {
  return {
    estado: vi.fn(async () => {
      if (estado === 'quebrada') throw new Error('rede');
      return { temSessao: false, anonima: false, ...(estado.temSessao ? { id: 'conta-a' } : {}), ...estado };
    }),
  } as unknown as PortaDeConta;
}

export function comunidadeFalsa(
  slugs: readonly string[] = [],
  partes: { entrarComunidade?: (slug: string) => Promise<boolean>; sairComunidade?: (slug: string) => Promise<boolean> } = {},
): PortaDeComunidade {
  return {
    listarMinhasComunidades: vi.fn(async () => slugs),
    entrarComunidade: vi.fn(partes.entrarComunidade ?? (async () => true)),
    sairComunidade: vi.fn(partes.sairComunidade ?? (async () => true)),
  } as unknown as PortaDeComunidade;
}

/** Armazenamento em memória, com opção de barrar (Safari em aba privada): nunca lança. */
export interface ArmazenamentoDeTeste extends ArmazenamentoLocal {
  readonly dados: Map<string, string>;
}
export function armazenamentoFalso(opcoes: { barrado?: boolean } = {}): ArmazenamentoDeTeste {
  const dados = new Map<string, string>();
  return {
    dados,
    ler: (chave) => (opcoes.barrado ? null : (dados.get(chave) ?? null)),
    gravar: (chave, valor) => {
      if (opcoes.barrado) return false;
      dados.set(chave, valor);
      return true;
    },
    apagar: (chave) => {
      if (!opcoes.barrado) dados.delete(chave);
    },
  };
}

export interface AmbienteDeTeste extends AmbienteDoForum {
  mudarConectividade(online: boolean): void;
  readonly rolagens: number[];
  /** A pessoa rolou até `y`: atualiza a posição e dispara o evento de rolagem. */
  rolarAte(y: number): void;
  /** O documento encolhe (a lista sai da tela): o navegador puxa a posição para 0 sem esperar evento. */
  encolherDocumento(): void;
  titulo: string;
  tema: TemaDoForum | null;
  y: number;
  /** Um campo de texto ganhou ou perdeu o foco (o teclado abre ou fecha). */
  focarCampo(emCampo: boolean): void;
  readonly camposCentralizados: string[];
}

export function ambienteFalso(opcoes: { online?: boolean } = {}): AmbienteDeTeste {
  let online = opcoes.online ?? true;
  const ouvintes = new Set<(o: boolean) => void>();
  const ouvintesDeRolagem = new Set<(y: number) => void>();
  const ouvintesDeFoco = new Set<(emCampo: boolean) => void>();
  const a: AmbienteDeTeste = {
    estaOnline: () => online,
    aoMudarConectividade(ouvinte) {
      ouvintes.add(ouvinte);
      return () => ouvintes.delete(ouvinte);
    },
    mudarConectividade(novo) {
      online = novo;
      ouvintes.forEach((o) => o(novo));
    },
    definirTituloDoDocumento(t) {
      a.titulo = t;
    },
    temaEscolhido: () => null,
    aplicarTema(tema) {
      a.tema = tema;
    },
    aoRolar(ouvinte) {
      ouvintesDeRolagem.add(ouvinte);
      return () => ouvintesDeRolagem.delete(ouvinte);
    },
    rolarAte(y) {
      a.y = y;
      ouvintesDeRolagem.forEach((o) => o(y));
    },
    encolherDocumento() {
      a.y = 0;
    },
    rolarPara(y) {
      a.rolagens.push(y);
      a.y = y;
      ouvintesDeRolagem.forEach((o) => o(y));
    },
    aoMudarFocoEmCampo(ouvinte) {
      ouvintesDeFoco.add(ouvinte);
      return () => ouvintesDeFoco.delete(ouvinte);
    },
    focarCampo(emCampo) {
      ouvintesDeFoco.forEach((o) => o(emCampo));
    },
    centralizarCampo(id) {
      a.camposCentralizados.push(id);
    },
    camposCentralizados: [],
    agora: () => AGORA,
    rolagens: [],
    titulo: '',
    tema: null,
    y: 0,
  };
  return a;
}

export interface Montagem {
  readonly forum: PortaDeForum;
  readonly conta?: PortaDeConta;
  readonly comunidade?: PortaDeComunidade;
  readonly ambiente?: AmbienteDeTeste;
  readonly armazenamento?: ArmazenamentoLocal;
}

export function dependencias(m: Montagem): DependenciasDoForum & { ambiente: AmbienteDeTeste } {
  return {
    forum: m.forum,
    conta: m.conta ?? contaFalsa({ temSessao: false }),
    comunidade: m.comunidade ?? comunidadeFalsa(),
    ambiente: m.ambiente ?? ambienteFalso(),
    armazenamento: m.armazenamento ?? armazenamentoFalso(),
  };
}

/** Mostra a rota atual e entrega o `navigate`, para os testes andarem pelo histórico. */
export const sondas: { navegar: ReturnType<typeof useNavigate> | null; caminho: string } = {
  navegar: null,
  caminho: '',
};

function Sonda() {
  const local = useLocation();
  sondas.navegar = useNavigate();
  sondas.caminho = local.pathname + local.search;
  return null;
}

export function Rotas({ m, entrada }: { readonly m: Montagem; readonly entrada: string }) {
  return (
    <MemoryRouter initialEntries={[entrada]}>
      <ForumProvider dependencias={dependencias(m)}>
        <Sonda />
        <Routes>{rotasDoForum()}</Routes>
      </ForumProvider>
    </MemoryRouter>
  );
}
