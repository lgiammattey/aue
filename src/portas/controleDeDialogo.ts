/**
 * Coordena o que um diálogo precisa pedir ao ambiente, sem conhecer DOM.
 *
 * Abrir um diálogo não pode deixar o documento continuar rolando por trás nem
 * fazer a pessoa voltar para outro ponto da leitura ao fechá-lo. A UI só pede
 * o bloqueio; como a rolagem é capturada e restaurada é trabalho da plataforma.
 */
export interface ControleDeDialogo {
  /**
   * Captura a rolagem corrente e bloqueia o documento.
   *
   * A função devolvida é idempotente. Bloqueios simultâneos coexistem: só o
   * último a ser desfeito restaura a posição que existia antes do primeiro.
   */
  bloquearRolagemDoDocumento(): () => void;

  /**
   * Depois de um campo receber foco, mantém-no à vista quando o teclado mudar
   * o viewport. Devolve o cleanup para a UI desfazer a espera ao fechar ou
   * trocar de campo.
   */
  manterCampoVisivelAoAbrirTeclado(idDoCampo: string): () => void;
}
