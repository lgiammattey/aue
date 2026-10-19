/**
 * O que as telas do fórum pedem ao aparelho: rede, título da aba, tema, rolagem e
 * relógio. Contrato puro (ADR 0001 §2): `navigator`, `window` e `document` só
 * aparecem no adaptador em `src/plataforma/web/ambienteDoForum.ts`.
 *
 * Cartão 0017, pedaço 2b.
 */

export type TemaDoForum = 'claro' | 'escuro';

export interface AmbienteDoForum {
  /**
   * Pista, não garantia: `navigator.onLine` mente para cima (rede sem internet).
   * `false` quer dizer que o aparelho sabe que está sem rede.
   */
  estaOnline(): boolean;

  /** Avisa quando a conectividade muda. Devolve quem desfaz a inscrição. */
  aoMudarConectividade(ouvinte: (online: boolean) => void): () => void;

  /** Título da aba: "{Comunidade} · Auê!". */
  definirTituloDoDocumento(titulo: string): void;

  /** O tema que a pessoa escolheu, ou `null` se nunca escolheu (o fórum abre claro). */
  temaEscolhido(): TemaDoForum | null;

  /**
   * Aplica o tema na página. `guardar` só é verdadeiro quando a pessoa
   * escolheu: o padrão claro não vira "escolha" sem ninguém ter escolhido.
   */
  aplicarTema(tema: TemaDoForum, guardar: boolean): void;

  /** Rolagem vertical do documento (o fórum rola o documento, não um contêiner). */
  rolagemAtual(): number;
  rolarPara(y: number): void;

  /** Relógio, para o "há 3 h" não depender de `Date.now()` solto na tela. */
  agora(): number;
}
