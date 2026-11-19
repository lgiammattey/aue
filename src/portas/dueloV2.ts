/** Contrato do duelo experimental. O servidor decide acesso e resultado. */
export type FalhaDueloV2 = 'sem_sessao' | 'entrada_invalida' | 'falha_rede' | 'resposta_invalida' | 'envio_falhou' | 'resultado_indisponivel' | 'criacao_incerta' | 'cancelada';
export type ResultadoDueloV2<T> = { readonly ok: true; readonly valor: T } | { readonly ok: false; readonly motivo: FalhaDueloV2; readonly tentativaId?: string };
export type EstadoCancelamentoV2 = 'cancelada_local' | 'preparacao_incerta' | 'removida' | 'remocao_pendente' | 'remocao_nao_verificada' | 'bloqueio_nao_confirmado';
export interface EnvioGravacaoV2 {
  readonly resultado: Promise<ResultadoDueloV2<{ readonly id: string }>>;
  /** Pode ser chamado imediatamente; pendência não equivale a exclusão confirmada. */
  cancelar(): Promise<ResultadoDueloV2<EstadoCancelamentoV2>>;
}
export type EstadoConviteV2 = 'aguardando_resposta' | 'respondido' | 'indisponivel';
export type EstadoRespostaV2 = 'respondido' | 'ocupado' | 'indisponivel' | 'criador';
export type ConviteProprioV2 = { readonly estado: 'indisponivel' } | { readonly estado: 'aguardando_resposta' | 'respondido' | 'revogado' | 'expirado' | 'conflito'; readonly id: string; readonly versao: number; readonly prazo: string };
export interface MeuDueloV2 { readonly id: string; readonly gravacaoPropriaId: string; readonly lado: 'criador' | 'desafiante'; readonly estado: 'aguardando_resposta' | 'respondido' | 'revogado' | 'expirado' | 'indisponivel'; readonly versao: number; readonly prazo: string }
export type RecuperacaoV2 = ConviteProprioV2 | { readonly estado: 'revelado'; readonly resultado: RevelacaoV2 };
export interface RevelacaoV2 {
  readonly ladoSessao?: 'criador' | 'desafiante';
  readonly criador: { readonly duracaoMs: number };
  readonly desafiante: { readonly duracaoMs: number };
  readonly resultadoProvisorio: 'criador' | 'desafiante' | 'empate';
  readonly versaoRegua: 'experimental-2';
  readonly origemMedicao: 'cliente_nao_verificada';
}
export interface DueloV2 {
  iniciarEnvioGravacao(audio: Blob, duracaoMs: number): EnvioGravacaoV2;
  /** Só confirma depois do upload privado. Erro deixa o áudio local com a tela. */
  enviarGravacao(audio: Blob, duracaoMs: number): Promise<ResultadoDueloV2<{ readonly id: string }>>;
  /** Retry da mesma tentativa durante a sessão da página; ID não contém caminho. */
  retomarEnvio(tentativaId: string): Promise<ResultadoDueloV2<{ readonly id: string }>>;
  /** Solta a referência local e pede exclusão; bloqueio remoto pode não ser confirmado se offline. */
  descartarTentativa(tentativaId: string): Promise<ResultadoDueloV2<'removida' | 'remocao_pendente' | 'remocao_nao_verificada' | 'bloqueio_nao_confirmado'>>;
  /** Mantido só em memória: reutilizar o mesmo token numa tentativa repetida. */
  novoToken(): ResultadoDueloV2<string>;
  /** Uma falha de rede pode ter criado o duelo; repetir com o mesmo token. */
  criar(gravacaoId: string, token: string): Promise<ResultadoDueloV2<ConviteProprioV2>>;
  reemitir(gravacaoId: string, tokenNovo: string, versaoEsperada: number): Promise<ResultadoDueloV2<ConviteProprioV2>>;
  revogar(gravacaoId: string, versaoEsperada: number): Promise<ResultadoDueloV2<ConviteProprioV2>>;
  recuperar(dueloId: string): Promise<ResultadoDueloV2<RecuperacaoV2>>;
  listarMeusDuelos(deslocamento: number): Promise<ResultadoDueloV2<{ readonly itens: readonly MeuDueloV2[]; readonly temMais: boolean }>>;
  baixarAudioRecuperado(dueloId: string, lado: 'criador' | 'desafiante'): Promise<ResultadoDueloV2<Blob>>;
  abrir(token: string): Promise<ResultadoDueloV2<EstadoConviteV2>>;
  responder(token: string, gravacaoId: string): Promise<ResultadoDueloV2<EstadoRespostaV2>>;
  revelar(token: string): Promise<ResultadoDueloV2<RevelacaoV2>>;
  /** Não confirma remoção enquanto o servidor não verificar a ausência do objeto. */
  removerGravacao(id: string): Promise<ResultadoDueloV2<'removida' | 'remocao_pendente' | 'remocao_nao_verificada'>>;
  listarExclusoesPendentes(): Promise<ResultadoDueloV2<readonly string[]>>;
  denunciar(token: string, alvo: 'criador' | 'desafiante', motivo: 'ofensivo' | 'outro'): Promise<ResultadoDueloV2<'registrada' | 'ja_analisada' | 'indisponivel'>>;
  denunciarPorDuelo(dueloId: string, alvo: 'criador' | 'desafiante', motivo: 'ofensivo' | 'outro'): Promise<ResultadoDueloV2<'registrada' | 'ja_analisada' | 'indisponivel'>>;
  /** Revalida a revelação antes de baixar; não entrega URLs assinadas. */
  baixarAudio(token: string, lado: 'criador' | 'desafiante'): Promise<ResultadoDueloV2<Blob>>;
}
