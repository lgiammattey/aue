import { useCallback, useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from 'react';
import { useNavigationType } from 'react-router-dom';
import { juntarPorId } from '../../nucleo/forum/apresentacao';
import type { AmbienteDoForum } from '../../portas/ambienteDoForum';
import type { CursorDoForum, MotivoDeLeitura, PaginaDoForum, ResultadoDaLeitura } from '../../portas/forum';
import { useDependenciasDoForum } from './contexto';

// ---------------------------------------------------------------------------
// Rede
// ---------------------------------------------------------------------------

export function useOnline(ambiente: AmbienteDoForum): boolean {
  return useSyncExternalStore(
    (aoMudar) => ambiente.aoMudarConectividade(aoMudar),
    () => ambiente.estaOnline(),
    () => true,
  );
}

// ---------------------------------------------------------------------------
// Leitura única (cabeçalho da comunidade, tópico)
// ---------------------------------------------------------------------------

export type EstadoDeLeitura<T> =
  | { readonly fase: 'carregando' }
  | { readonly fase: 'pronto'; readonly valor: T }
  | { readonly fase: 'erro'; readonly motivo: MotivoDeLeitura };

/**
 * Uma leitura que acontece de novo quando `chave` muda. Falha é `erro`, nunca
 * "pronto sem nada". `recarregar` refaz só esta chamada, sem recarregar a página.
 */
export function useLeitura<T>(
  carregar: () => Promise<ResultadoDaLeitura<T>>,
  chave: string,
): { estado: EstadoDeLeitura<T>; recarregar: () => void; atualizar: () => Promise<boolean> } {
  const [estado, setEstado] = useState<EstadoDeLeitura<T>>({ fase: 'carregando' });
  const [tentativa, setTentativa] = useState(0);
  const carregarRef = useRef(carregar);
  carregarRef.current = carregar;

  useEffect(() => {
    let ativo = true;
    setEstado({ fase: 'carregando' });
    carregarRef
      .current()
      .then(
        (r): EstadoDeLeitura<T> => (r.ok ? { fase: 'pronto', valor: r.valor } : { fase: 'erro', motivo: r.motivo }),
        (): EstadoDeLeitura<T> => ({ fase: 'erro', motivo: 'falhou' }),
      )
      .then((novo) => {
        if (ativo) setEstado(novo);
      });
    return () => {
      ativo = false;
    };
  }, [chave, tentativa]);

  const recarregar = useCallback(() => setTentativa((t) => t + 1), []);

  /**
   * Lê de novo SEM voltar para "carregando": a tela fica como está até o servidor
   * responder (depois de entrar numa comunidade ou de responder, o número certo vem
   * do servidor). Se a nova leitura falhar, o que estava na tela fica, e quem chamou
   * fica sabendo (`false`). Resposta velha (a chave mudou no meio) é jogada fora.
   */
  const chaveAtual = useRef(chave);
  chaveAtual.current = chave;
  const atualizar = useCallback(async (): Promise<boolean> => {
    const minhaChave = chaveAtual.current;
    let r: ResultadoDaLeitura<T>;
    try {
      r = await carregarRef.current();
    } catch {
      return false;
    }
    if (!r.ok || chaveAtual.current !== minhaChave) return false;
    setEstado({ fase: 'pronto', valor: r.valor });
    return true;
  }, []);

  return { estado, recarregar, atualizar };
}

// ---------------------------------------------------------------------------
// Lista paginada por cursor
// ---------------------------------------------------------------------------

interface Salvo<C, T> {
  itens: readonly T[];
  proximo: C | null;
  rolagem: number;
}

/**
 * Lista já vista, guardada em memória por chave (rota + ordem). Só vale para a
 * volta do navegador (#234): quem chega de novo por um link começa do zero.
 */
const listasVistas = new Map<string, Salvo<unknown, unknown>>();

/** Para os testes e para o "Tentar de novo" de uma lista inteira. */
export function limparListasVistas(): void {
  listasVistas.clear();
}

/**
 * Esquece as listas guardadas cujo nome começa com `prefixo`. Depois de criar um
 * tópico ou uma resposta, a volta do navegador não pode mostrar a lista velha, sem
 * o que a pessoa acabou de escrever: a lista seguinte vem do servidor.
 */
export function esquecerListasVistas(prefixo: string): void {
  for (const chave of [...listasVistas.keys()]) {
    if (chave.startsWith(prefixo)) listasVistas.delete(chave);
  }
}

export type FaseDaLista = 'carregando' | 'pronto' | 'erro';

export interface ListaPaginada<T, C> {
  readonly fase: FaseDaLista;
  readonly itens: readonly T[];
  readonly proximo: C | null;
  /** Por que a primeira página não veio. Só existe na fase `erro`. */
  readonly motivo: MotivoDeLeitura | null;
  readonly carregandoMais: boolean;
  /** "Ver mais" falhou: o que já estava na tela fica. */
  readonly falhouAoCarregarMais: boolean;
  /** Primeiro item que chegou na última página ou troca de ordem. A tela leva o foco a ele. */
  readonly idParaFocar: string | null;
  /** Mensagem para a região de status ("Mais 5 tópicos carregados"). */
  readonly anuncio: { readonly texto: string; readonly n: number } | null;
  readonly verMais: () => void;
  readonly recarregar: () => void;
}

interface Opcoes<T, C extends CursorDoForum> {
  /** Muda quando a lista é outra (slug, ordem). Tudo recomeça. */
  readonly chave: string;
  /** Chave da memória da volta do navegador. Sem ela, a lista não é guardada. */
  readonly chaveDeMemoria?: string;
  readonly carregarPagina: (cursor: C | null) => Promise<ResultadoDaLeitura<PaginaDoForum<C, T>>>;
  /** "tópicos" ou "respostas": só para a frase do status. */
  readonly substantivo: string;
}

/**
 * Primeira página, "Ver mais" por cursor, junção por `id`. Falha da primeira
 * página é `erro` (nunca lista vazia); falha do "Ver mais" mantém os itens.
 * O cursor é entregue ao servidor como veio, sem passar por `Date`.
 */
export function useListaPaginada<T extends { readonly id: string }, C extends CursorDoForum>(
  opcoes: Opcoes<T, C>,
): ListaPaginada<T, C> {
  const { ambiente } = useDependenciasDoForum();
  const tipoDeNavegacao = useNavigationType();
  const { chave, chaveDeMemoria, substantivo } = opcoes;
  const carregarRef = useRef(opcoes.carregarPagina);
  carregarRef.current = opcoes.carregarPagina;

  const [fase, setFase] = useState<FaseDaLista>('carregando');
  const [itens, setItens] = useState<readonly T[]>([]);
  const [proximo, setProximo] = useState<C | null>(null);
  const [motivo, setMotivo] = useState<MotivoDeLeitura | null>(null);
  const [carregandoMais, setCarregandoMais] = useState(false);
  const [falhouAoCarregarMais, setFalhouAoCarregarMais] = useState(false);
  const [idParaFocar, setIdParaFocar] = useState<string | null>(null);
  const [anuncio, setAnuncio] = useState<{ texto: string; n: number } | null>(null);
  const [tentativa, setTentativa] = useState(0);
  // Cada carga ganha um número; resposta de carga velha é jogada fora.
  const geracao = useRef(0);
  const buscandoMais = useRef(false);
  // O foco só vai ao primeiro item quando a lista muda depois de aberta (troca de ordem); na abertura, o foco é do título.
  const jaCarregou = useRef(false);
  const itensRef = useRef<readonly T[]>([]);
  const proximoRef = useRef<C | null>(null);
  itensRef.current = itens;
  proximoRef.current = proximo;

  // A volta do navegador só vale para a lista com que a tela abriu.
  const voltaInicial = useRef<{ chave: string; salvo: Salvo<unknown, unknown> } | null | undefined>(undefined);
  if (voltaInicial.current === undefined) {
    const salvo = tipoDeNavegacao === 'POP' && chaveDeMemoria ? listasVistas.get(chaveDeMemoria) : undefined;
    voltaInicial.current = salvo ? { chave, salvo } : null;
  }

  // Primeira página (e toda vez que a chave ou a tentativa muda).
  useEffect(() => {
    const minha = ++geracao.current;
    buscandoMais.current = false;
    const volta = voltaInicial.current && voltaInicial.current.chave === chave && tentativa === 0 ? voltaInicial.current.salvo : null;
    if (voltaInicial.current && voltaInicial.current.chave !== chave) voltaInicial.current = null;
    setCarregandoMais(false);
    setFalhouAoCarregarMais(false);
    setAnuncio(null);
    if (volta) {
      setItens(volta.itens as readonly T[]);
      setProximo(volta.proximo as C | null);
      setMotivo(null);
      setFase('pronto');
      setIdParaFocar(null);
      jaCarregou.current = true;
      return;
    }
    setFase('carregando');
    setItens([]);
    setProximo(null);
    setMotivo(null);
    carregarRef
      .current(null)
      .catch((): ResultadoDaLeitura<PaginaDoForum<C, T>> => ({ ok: false, motivo: 'falhou' }))
      .then((r) => {
        if (geracao.current !== minha) return;
        if (!r.ok) {
          setMotivo(r.motivo);
          setFase('erro');
          return;
        }
        const { itens: primeira } = juntarPorId<T>([], r.valor.itens);
        setItens(primeira);
        setProximo(r.valor.proximo);
        setIdParaFocar(jaCarregou.current ? (primeira[0]?.id ?? null) : null);
        jaCarregou.current = true;
        setFase('pronto');
      });
  }, [chave, tentativa]);

  // A rolagem vem por evento, enquanto a lista está na tela: na saída o documento já encolheu
  // e o navegador já puxou o scrollY para baixo, então ler ali perde dezenas de pixels.
  const rolagemRef = useRef(0);
  useEffect(() => {
    if (!chaveDeMemoria) return;
    return ambiente.aoRolar((y) => {
      rolagemRef.current = y;
    });
  }, [chaveDeMemoria, ambiente]);

  // Guarda a lista e a última rolagem vista ao sair, para a volta do navegador.
  useLayoutEffect(() => {
    if (!chaveDeMemoria) return;
    return () => {
      if (itensRef.current.length > 0) {
        listasVistas.set(chaveDeMemoria, {
          itens: itensRef.current,
          proximo: proximoRef.current,
          rolagem: rolagemRef.current,
        });
      }
    };
  }, [chaveDeMemoria]);

  // Restaura a rolagem da volta uma vez, antes da pintura.
  const rolagemRestaurada = useRef(false);
  useLayoutEffect(() => {
    if (rolagemRestaurada.current || fase !== 'pronto') return;
    rolagemRestaurada.current = true;
    if (voltaInicial.current && voltaInicial.current.chave === chave) {
      rolagemRef.current = voltaInicial.current.salvo.rolagem;
      ambiente.rolarPara(voltaInicial.current.salvo.rolagem);
    }
  }, [fase, chave, ambiente]);

  const verMais = useCallback(() => {
    const cursor = proximoRef.current;
    if (cursor === null || buscandoMais.current) return;
    buscandoMais.current = true;
    const minha = geracao.current;
    setCarregandoMais(true);
    setFalhouAoCarregarMais(false);
    carregarRef
      .current(cursor)
      .catch((): ResultadoDaLeitura<PaginaDoForum<C, T>> => ({ ok: false, motivo: 'falhou' }))
      .then((r) => {
        if (geracao.current !== minha) return;
        buscandoMais.current = false;
        setCarregandoMais(false);
        if (!r.ok) {
          setFalhouAoCarregarMais(true);
          return;
        }
        const { itens: todos, adicionados } = juntarPorId<T>(itensRef.current, r.valor.itens);
        setItens(todos);
        setProximo(r.valor.proximo);
        setIdParaFocar(adicionados[0]?.id ?? null);
        if (adicionados.length > 0) {
          const texto = `Mais ${adicionados.length.toLocaleString('pt-BR')} ${substantivo} carregados`;
          setAnuncio((anterior) => ({ texto, n: (anterior?.n ?? 0) + 1 }));
        }
      });
  }, [substantivo]);

  const recarregar = useCallback(() => setTentativa((t) => t + 1), []);

  return { fase, itens, proximo, motivo, carregandoMais, falhouAoCarregarMais, idParaFocar, anuncio, verMais, recarregar };
}
