/**
 * Contrato do painel administrativo. A tela recebe agregados e uma lista
 * mínima de pessoas; e-mail, UUID, sessão, áudio e eventos individuais nunca
 * atravessam esta porta.
 */

export interface PessoaDoPainel {
  readonly apelido: string | null;
  readonly handle: string | null;
  readonly criadoEm: string;
  readonly perfilSocialConcluidoEm: string | null;
  readonly estado: 'ficha_pendente' | 'perfil_pronto';
}

export interface EventosDoPainel {
  readonly [evento: string]: number;
}

export interface EventosDiariosDoPainel {
  readonly data: string;
  readonly abriuArena: number;
  readonly iniciouArroto: number;
  readonly recebeuNota: number;
  readonly compartilhou: number;
  readonly criouX1: number;
  readonly respondeuX1: number;
  readonly pediuRevanche: number;
}

export interface ResumoAdministrativo {
  readonly inicio: string;
  readonly fim: string;
  /** Total completo, inclusive contas anteriores ao acompanhamento. */
  readonly totalContasDeEmailAtual: number;
  /** Só promoções registradas desde acompanhamentoDeCadastrosIniciadoEm. */
  readonly cadastrosNoPeriodo: number;
  readonly acompanhamentoDeCadastrosIniciadoEm: string | null;
  readonly perfisConcluidosNoPeriodo: number;
  readonly perfisPendentesAtuais: number;
  readonly eventos: EventosDoPainel;
  readonly eventosPorDia: readonly EventosDiariosDoPainel[];
  readonly pessoas: readonly PessoaDoPainel[];
}

/** Dados de receita apenas para o painel autorizado; nunca incluem a chave do fornecedor. */
export interface MonetizacaoAdministrativa {
  readonly inicio: string;
  readonly fim: string;
  readonly totalImpressoes: number;
  readonly totalCliques: number;
  readonly receitaTotal: number;
  readonly cpmMedio: number;
}

export interface PortaDeAdministracao {
  /** Lê o resumo protegido no servidor. Acesso negado e falha de rede lançam. */
  obterResumo(inicio?: string, fim?: string): Promise<ResumoAdministrativo>;
  /** Consulta a função administrativa protegida; indisponibilidade não vira zero. */
  obterMonetizacao(): Promise<MonetizacaoAdministrativa>;
}
