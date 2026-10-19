/**
 * O que as telas do fórum pedem ao aparelho: rede, título da aba, tema, rolagem e
 * relógio. Contrato puro (ADR 0001 §2): `navigator`, `window` e `document` só
 * aparecem no adaptador em `src/plataforma/web/ambienteDoForum.ts`.
 *
 * Cartão 0017, pedaços 2b e 2c.
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

  /**
   * Avisa a rolagem vertical do documento a cada mudança, com o `y` novo. Quem precisa da
   * posição de saída guarda a última recebida: ler na hora de sair é tarde (a página já
   * encolheu e o navegador já ajustou a rolagem).
   */
  aoRolar(ouvinte: (y: number) => void): () => void;
  /** Rola o documento (o fórum rola o documento, não um contêiner). */
  rolarPara(y: number): void;

  /**
   * Avisa quando um campo de texto ganha ou perde o foco. No celular o teclado
   * cobre a barra inferior (spec 4.3 e 4.7): quem recebe `true` esconde a barra.
   * Passar de um campo para outro não pisca (`false` só quando o foco sai de vez).
   */
  aoMudarFocoEmCampo(ouvinte: (emCampo: boolean) => void): () => void;

  /**
   * Deixa o campo de id `idDoCampo` visível no centro da tela depois que o teclado
   * abre (spec 4.7, item 4). A leitura de `visualViewport` fica aqui, não na tela.
   * Nunca lança: sem o campo ou sem a API, não faz nada.
   */
  centralizarCampo(idDoCampo: string): void;

  /** Relógio, para o "há 3 h" não depender de `Date.now()` solto na tela. */
  agora(): number;
}
