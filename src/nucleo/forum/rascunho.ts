/**
 * Rascunho do fórum (cartão 0017, pedaço 2c; spec 6.8): o texto que a pessoa
 * escreveu e ainda não enviou. Vive na PORTA de armazenamento
 * (`ArmazenamentoLocal`), nunca em `localStorage` direto, e em memória durante
 * a sessão (o armazenamento pode estar barrado, como no Safari em aba privada).
 *
 * Só sai no sucesso do envio ou no "Descartar rascunho" explícito. Fechar o
 * formulário, falhar o envio ou recarregar a página nunca apagam.
 */
import type { ArmazenamentoLocal } from '../../portas/armazenamento';

export interface RascunhoDeTopico {
  readonly titulo: string;
  readonly corpo: string;
}

/** Teto do que se lê do disco: bem acima dos limites do servidor, para não carregar lixo colado. */
const TETO_DE_LEITURA = 6000;

const emMemoria = new Map<string, string>();

/** Para os testes: a memória da sessão começa zerada. */
export function esquecerRascunhosDaSessao(): void {
  emMemoria.clear();
}

function lerTexto(armazenamento: ArmazenamentoLocal, chave: string): string | null {
  if (emMemoria.has(chave)) return emMemoria.get(chave) ?? null;
  return armazenamento.ler(chave);
}

function guardarTexto(armazenamento: ArmazenamentoLocal, chave: string, valor: string): void {
  emMemoria.set(chave, valor);
  armazenamento.gravar(chave, valor);
}

export function apagarRascunho(armazenamento: ArmazenamentoLocal, chave: string): void {
  // Marca a memória como "vazio" (em vez de só tirar) para um disco que não deixa apagar não ressuscitar o texto.
  emMemoria.set(chave, '');
  armazenamento.apagar(chave);
}

export function lerRascunhoDeTopico(armazenamento: ArmazenamentoLocal, chave: string): RascunhoDeTopico | null {
  const bruto = lerTexto(armazenamento, chave);
  if (!bruto || bruto.length > TETO_DE_LEITURA) return null;
  try {
    const dados: unknown = JSON.parse(bruto);
    if (typeof dados !== 'object' || dados === null) return null;
    const { titulo, corpo } = dados as Record<string, unknown>;
    if (typeof titulo !== 'string' || typeof corpo !== 'string') return null;
    if (titulo === '' && corpo === '') return null;
    return { titulo, corpo };
  } catch {
    return null;
  }
}

export function guardarRascunhoDeTopico(
  armazenamento: ArmazenamentoLocal,
  chave: string,
  rascunho: RascunhoDeTopico,
): void {
  if (rascunho.titulo === '' && rascunho.corpo === '') {
    apagarRascunho(armazenamento, chave);
    return;
  }
  guardarTexto(armazenamento, chave, JSON.stringify({ titulo: rascunho.titulo, corpo: rascunho.corpo }));
}

export function lerRascunhoDeResposta(armazenamento: ArmazenamentoLocal, chave: string): string {
  const bruto = lerTexto(armazenamento, chave);
  if (!bruto || bruto.length > TETO_DE_LEITURA) return '';
  try {
    const dados: unknown = JSON.parse(bruto);
    if (typeof dados !== 'object' || dados === null) return '';
    const { corpo } = dados as Record<string, unknown>;
    return typeof corpo === 'string' ? corpo : '';
  } catch {
    return '';
  }
}

export function guardarRascunhoDeResposta(armazenamento: ArmazenamentoLocal, chave: string, corpo: string): void {
  if (corpo === '') {
    apagarRascunho(armazenamento, chave);
    return;
  }
  guardarTexto(armazenamento, chave, JSON.stringify({ corpo }));
}
