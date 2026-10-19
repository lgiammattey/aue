/**
 * Como o fórum escreve o que o servidor mandou: tempo, plural, monograma, meta.
 * Puro: nenhum DOM, nenhuma rede. Os textos são os do `docs/design/forum-comunidades.md`
 * (6.10, 3.5 e 7.2).
 *
 * Aqui só se FORMATA. Nada é somado, estimado ou arredondado: número que entra é
 * o número que sai.
 */

const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'] as const;

const MINUTO = 60_000;
const HORA = 60 * MINUTO;
const DIA = 24 * HORA;

/**
 * "agora", "há 5 min", "há 3 h", "há 2 d", "12 out", "12 out 2025".
 * `iso` só serve para exibir; o cursor de paginação nunca passa por aqui.
 * Data ilegível devolve texto vazio em vez de inventar um tempo.
 */
export function tempoRelativo(iso: string, agoraMs: number): string {
  const instante = Date.parse(iso);
  if (Number.isNaN(instante)) return '';
  const diferenca = Math.max(0, agoraMs - instante);
  if (diferenca < MINUTO) return 'agora';
  if (diferenca < HORA) return `há ${Math.floor(diferenca / MINUTO)} min`;
  if (diferenca < DIA) return `há ${Math.floor(diferenca / HORA)} h`;
  if (diferenca < 7 * DIA) return `há ${Math.floor(diferenca / DIA)} d`;
  const data = new Date(instante);
  const base = `${data.getDate()} ${MESES[data.getMonth()]}`;
  return data.getFullYear() === new Date(agoraMs).getFullYear() ? base : `${base} ${data.getFullYear()}`;
}

/** "19/10/2026 14:32", para o `title` do `<time>`. */
export function horarioCompleto(iso: string): string {
  const instante = Date.parse(iso);
  if (Number.isNaN(instante)) return '';
  const d = new Date(instante);
  const dois = (n: number) => String(n).padStart(2, '0');
  return `${dois(d.getDate())}/${dois(d.getMonth() + 1)}/${d.getFullYear()} ${dois(d.getHours())}:${dois(d.getMinutes())}`;
}

/** Milhar com ponto, nunca abreviado ("1,2 mil" não existe). Zero aparece como zero. */
export function numeroPtBr(n: number): string {
  return n.toLocaleString('pt-BR');
}

export function textoDeTopicos(n: number): string {
  if (n === 0) return 'Nenhum tópico ainda';
  return n === 1 ? '1 tópico' : `${numeroPtBr(n)} tópicos`;
}

export function textoDeMembros(n: number): string {
  if (n === 0) return 'Nenhum membro ainda';
  return n === 1 ? '1 membro' : `${numeroPtBr(n)} membros`;
}

export function textoDeRespostas(n: number): string {
  if (n === 0) return 'Sem respostas';
  return n === 1 ? '1 resposta' : `${numeroPtBr(n)} respostas`;
}

const PALAVRAS_QUE_NAO_CONTAM = new Set(['a', 'o', 'e', 'da', 'de', 'do', 'na', 'no', 'em', 'um', 'uma']);

/**
 * Duas letras para o quadrado da comunidade: inicial das duas primeiras palavras,
 * ignorando artigos e sinais. Uma palavra só: as duas primeiras letras.
 * `Refri & Cia` vira RC; `Na reunião da firma` vira RF; `Eu arroto, e daí?` vira EA.
 */
export function monograma(nome: string): string {
  const palavras = nome
    .split(/[^\p{L}\p{N}]+/u)
    .filter((p) => p.length > 0 && !PALAVRAS_QUE_NAO_CONTAM.has(p.toLowerCase()));
  if (palavras.length === 0) return '?';
  const letras = (texto: string) => Array.from(texto);
  if (palavras.length === 1) return letras(palavras[0]).slice(0, 2).join('').toUpperCase();
  return (letras(palavras[0])[0] + letras(palavras[1])[0]).toUpperCase();
}

/** Três ou mais quebras seguidas viram duas, só na exibição. */
export function normalizarQuebras(texto: string): string {
  return texto.replace(/\r\n?/g, '\n').replace(/\n{3,}/g, '\n\n');
}

export interface DadosDaMetaDeTopico {
  readonly autorNome: string;
  readonly respostasTotal: number;
  readonly criadoEm: string;
  readonly ultimaAtividadeEm: string;
}

/**
 * "Ana Souza · 8 respostas · atividade há 3 h" ou "Ana Souza · Sem respostas · há 3 d".
 * Os marcadores Fixado e Fechado são desenhados à parte (com ícone e texto).
 */
export function metaDeTopico(d: DadosDaMetaDeTopico, agoraMs: number): string {
  const partes = [d.autorNome, textoDeRespostas(d.respostasTotal)];
  if (d.respostasTotal > 0) {
    partes.push(`atividade ${tempoRelativo(d.ultimaAtividadeEm, agoraMs)}`.trim());
  } else {
    partes.push(tempoRelativo(d.criadoEm, agoraMs));
  }
  return partes.filter((p) => p.length > 0).join(' · ');
}

/** "12 tópicos · 34 membros · atividade há 2 h". Sem tópico: "Nenhum tópico ainda · 34 membros". */
export function metaDeComunidade(
  d: { readonly topicosTotal: number; readonly membrosTotal: number; readonly ultimaAtividadeEm: string | null },
  agoraMs: number,
): string {
  const partes = [textoDeTopicos(d.topicosTotal), textoDeMembros(d.membrosTotal)];
  if (d.topicosTotal > 0 && d.ultimaAtividadeEm) {
    const tempo = tempoRelativo(d.ultimaAtividadeEm, agoraMs);
    if (tempo) partes.push(`atividade ${tempo}`);
  }
  return partes.join(' · ');
}

/**
 * Mais vivas primeiro; sem tópico por último; empate por nome. É conteúdo vivo
 * primeiro, não ranking. O RPC devolve por nome, então a ordem é do cliente.
 */
export function ordenarComunidades<T extends { readonly nome: string; readonly ultimaAtividadeEm: string | null }>(
  lista: readonly T[],
): T[] {
  const instante = (c: T) => (c.ultimaAtividadeEm ? Date.parse(c.ultimaAtividadeEm) : Number.NaN);
  return [...lista].sort((a, b) => {
    const ia = instante(a);
    const ib = instante(b);
    const temA = !Number.isNaN(ia);
    const temB = !Number.isNaN(ib);
    if (temA && temB && ia !== ib) return ib - ia;
    if (temA !== temB) return temA ? -1 : 1;
    return a.nome.localeCompare(b.nome, 'pt-BR');
  });
}

/** Junta por `id`: o que já estava na tela fica onde estava; só entra o que é novo. */
export function juntarPorId<T extends { readonly id: string }>(
  atuais: readonly T[],
  novos: readonly T[],
): { readonly itens: T[]; readonly adicionados: T[] } {
  const vistos = new Set(atuais.map((i) => i.id));
  const adicionados: T[] = [];
  for (const item of novos) {
    if (vistos.has(item.id)) continue;
    vistos.add(item.id);
    adicionados.push(item);
  }
  return { itens: [...atuais, ...adicionados], adicionados };
}

export interface NoDeResposta<R extends { readonly id: string; readonly paiId: string | null }> {
  readonly resposta: R;
  readonly filhas: NoDeResposta<R>[];
}

/**
 * Árvore por `paiId`, na ordem em que o servidor mandou (cronológica). Resposta
 * cujo pai não está na lista carregada sobe para a raiz em vez de sumir.
 */
export function montarArvoreDeRespostas<R extends { readonly id: string; readonly paiId: string | null }>(
  respostas: readonly R[],
): NoDeResposta<R>[] {
  const nos = new Map<string, NoDeResposta<R>>();
  for (const resposta of respostas) nos.set(resposta.id, { resposta, filhas: [] });
  const raiz: NoDeResposta<R>[] = [];
  for (const resposta of respostas) {
    const no = nos.get(resposta.id)!;
    const pai = resposta.paiId && resposta.paiId !== resposta.id ? nos.get(resposta.paiId) : undefined;
    (pai ? pai.filhas : raiz).push(no);
  }
  return raiz;
}

/**
 * Endereço de imagem que veio do servidor só entra na página se for http(s).
 * `javascript:`, `data:` e o resto viram `null` e a tela cai no monograma.
 */
export function urlDeImagemSegura(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    return u.protocol === 'https:' || u.protocol === 'http:' ? u.toString() : null;
  } catch {
    return null;
  }
}

/** O nome que a tela mostra: apelido; sem apelido, o @; sem nenhum dos dois, nada (nunca inventa). */
export function nomeDoAutor(autor: { readonly apelido: string | null; readonly handle: string | null } | null): string {
  if (!autor) return '';
  const apelido = autor.apelido?.trim();
  if (apelido) return apelido;
  return autor.handle ? `@${autor.handle}` : '';
}
