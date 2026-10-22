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
  readonly acessosDePaginas: number;
  readonly abriuArena: number;
  readonly iniciouArroto: number;
  readonly recebeuNota: number;
  readonly compartilhou: number;
  readonly criouX1: number;
  readonly respondeuX1: number;
  readonly pediuRevanche: number;
  readonly topicosPublicados: number;
  readonly respostasPublicadas: number;
}

/** Uma fatia agregada: não há caminho, slug, sessão ou pessoa. */
export interface AcessoPorPaginaDoPainel {
  readonly pagina: string;
  readonly acessos: number;
}

export interface ResumoAdministrativo {
  readonly inicio: string;
  readonly fim: string;
  /** Total completo, inclusive contas anteriores ao acompanhamento. */
  readonly totalContasDeEmailAtual: number;
  /** Identidades anônimas existentes agora; não é uma lista de pessoas. */
  readonly contasAnonimasAtuais: number;
  /** Conta real que entrou ou publicou/respondeu durante o período selecionado. */
  readonly contasAtivasNoPeriodo: number;
  /** Só promoções registradas desde acompanhamentoDeCadastrosIniciadoEm. */
  readonly cadastrosNoPeriodo: number;
  readonly acompanhamentoDeCadastrosIniciadoEm: string | null;
  readonly perfisConcluidosNoPeriodo: number;
  readonly perfisPendentesAtuais: number;
  readonly topicosPublicadosNoPeriodo: number;
  readonly respostasPublicadasNoPeriodo: number;
  readonly comunidadesAtivasNoPeriodo: number;
  /** Uma abertura por categoria de página dentro de cada sessão, não pessoas únicas. */
  readonly acessosDePaginasNoPeriodo: number;
  /** Marca de início honesta: tráfego anterior a ela não é reconstituído. */
  readonly acompanhamentoDeAcessosIniciadoEm: string | null;
  readonly eventos: EventosDoPainel;
  readonly acessosPorPagina: readonly AcessoPorPaginaDoPainel[];
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
