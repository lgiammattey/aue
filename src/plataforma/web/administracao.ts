import { configuracaoAusente, supabase } from '../../db/supabase';
import type {
  EventosDiariosDoPainel,
  MonetizacaoAdministrativa,
  PessoaDoPainel,
  PortaDeAdministracao,
  ResumoAdministrativo,
} from '../../portas/administracao';

interface RespostaDoBanco {
  periodo?: { inicio?: string; fim?: string };
  resumo?: {
    total_contas_de_email_atual?: number;
    cadastros_acompanhados_no_periodo?: number;
    acompanhamento_de_cadastros_iniciado_em?: string | null;
    perfis_concluidos_no_periodo?: number;
    perfis_pendentes_atuais?: number;
    eventos?: Record<string, number>;
  };
  eventos_por_dia?: Array<{
    data?: string;
    abriu_arena?: number;
    iniciou_arroto?: number;
    recebeu_nota?: number;
    compartilhou?: number;
    criou_x1?: number;
    respondeu_x1?: number;
    pediu_revanche?: number;
  }>;
  pessoas?: Array<{
    apelido?: string | null;
    handle?: string | null;
    criado_em?: string;
    perfil_social_concluido_em?: string | null;
    estado?: 'ficha_pendente' | 'perfil_pronto';
  }>;
}

interface RespostaDaMonetizacao {
  ok?: boolean;
  monetizacao?: {
    inicio?: string;
    fim?: string;
    total_impressoes?: number;
    total_cliques?: number;
    receita_total?: number;
    cpm_medio?: number;
  };
}

function numero(valor: unknown): number {
  return typeof valor === 'number' && Number.isFinite(valor) ? valor : 0;
}

function transformarDias(linhas: RespostaDoBanco['eventos_por_dia']): readonly EventosDiariosDoPainel[] {
  return (linhas ?? []).flatMap((linha) => {
    if (!linha?.data) return [];
    return [{
      data: linha.data,
      abriuArena: numero(linha.abriu_arena),
      iniciouArroto: numero(linha.iniciou_arroto),
      recebeuNota: numero(linha.recebeu_nota),
      compartilhou: numero(linha.compartilhou),
      criouX1: numero(linha.criou_x1),
      respondeuX1: numero(linha.respondeu_x1),
      pediuRevanche: numero(linha.pediu_revanche),
    }];
  });
}

function transformarPessoas(linhas: RespostaDoBanco['pessoas']): readonly PessoaDoPainel[] {
  return (linhas ?? []).flatMap((linha) => {
    if (!linha?.criado_em || (linha.estado !== 'ficha_pendente' && linha.estado !== 'perfil_pronto')) return [];
    return [{
      apelido: linha.apelido ?? null,
      handle: linha.handle ?? null,
      criadoEm: linha.criado_em,
      perfilSocialConcluidoEm: linha.perfil_social_concluido_em ?? null,
      estado: linha.estado,
    }];
  });
}

/** Adaptador web: só chama a RPC agregada; não lê tabelas administrativas. */
export function criarAdministracaoWeb(): PortaDeAdministracao {
  return {
    async obterResumo(inicio?: string, fim?: string): Promise<ResumoAdministrativo> {
      if (configuracaoAusente) throw new Error('Servidor do Auê não configurado.');
      const { data, error } = await supabase.rpc('painel_administrativo_resumo', {
        p_inicio: inicio ?? null,
        p_fim: fim ?? null,
      });
      if (error) throw error;

      const resposta = (data ?? {}) as RespostaDoBanco;
      if (!resposta.periodo?.inicio || !resposta.periodo.fim || !resposta.resumo) {
        throw new Error('Resposta administrativa inválida.');
      }

      return {
        inicio: resposta.periodo.inicio,
        fim: resposta.periodo.fim,
        totalContasDeEmailAtual: numero(resposta.resumo.total_contas_de_email_atual),
        cadastrosNoPeriodo: numero(resposta.resumo.cadastros_acompanhados_no_periodo),
        acompanhamentoDeCadastrosIniciadoEm: resposta.resumo.acompanhamento_de_cadastros_iniciado_em ?? null,
        perfisConcluidosNoPeriodo: numero(resposta.resumo.perfis_concluidos_no_periodo),
        perfisPendentesAtuais: numero(resposta.resumo.perfis_pendentes_atuais),
        eventos: resposta.resumo.eventos ?? {},
        eventosPorDia: transformarDias(resposta.eventos_por_dia),
        pessoas: transformarPessoas(resposta.pessoas),
      };
    },
    async obterMonetizacao(): Promise<MonetizacaoAdministrativa> {
      if (configuracaoAusente) throw new Error('Servidor do Auê não configurado.');
      const { data, error } = await supabase.functions.invoke('painel-administrativo');
      if (error) throw error;

      const resposta = (data ?? {}) as RespostaDaMonetizacao;
      const monetizacao = resposta.ok === true ? resposta.monetizacao : null;
      if (!monetizacao?.inicio || !monetizacao.fim) {
        throw new Error('Métricas de monetização indisponíveis.');
      }

      return {
        inicio: monetizacao.inicio,
        fim: monetizacao.fim,
        totalImpressoes: numero(monetizacao.total_impressoes),
        totalCliques: numero(monetizacao.total_cliques),
        receitaTotal: numero(monetizacao.receita_total),
        cpmMedio: numero(monetizacao.cpm_medio),
      };
    },
  };
}
