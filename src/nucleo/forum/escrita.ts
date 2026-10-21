/**
 * Escrita no fórum: validação de campo e a tradução do motivo do servidor em
 * frase (cartão 0017, pedaço 2c; spec 6.6 a 6.9). Puro: zero React, zero DOM.
 *
 * A tabela é por motivo tipado da porta (que já veio do HINT do servidor), nunca
 * por texto de mensagem nem por status. Motivo que não está aqui cai na frase
 * honesta de "não deu", nunca em sucesso.
 */
import { caracteresRestantes, contarCaracteres } from '../comunidade/limites';
import type { MotivoDeEscrita } from '../../portas/forum';

// ---------------------------------------------------------------------------
// Campo
// ---------------------------------------------------------------------------

export interface LeituraDoCampo {
  /** Caracteres como o Postgres conta (code points, sem espaço nas pontas). */
  readonly usados: number;
  readonly limite: number;
  /** Quanto ainda cabe; negativo quando passou. */
  readonly restante: number;
  readonly vazio: boolean;
  readonly estourou: boolean;
}

const caracteres = (n: number) => `${n} ${n === 1 ? 'caractere' : 'caracteres'}`;

export function lerCampo(texto: string, limite: number): LeituraDoCampo {
  const usados = contarCaracteres(texto.trim());
  const restante = caracteresRestantes(texto, limite);
  return { usados, limite, restante, vazio: usados === 0, estourou: restante < 0 };
}

/** Erro do campo antes de ir ao servidor: "Falta o título.", "Passou do limite em 10 caracteres.". */
export function erroDoCampo(texto: string, limite: number, faltaDiz: string): string | null {
  const l = lerCampo(texto, limite);
  if (l.vazio) return faltaDiz;
  if (l.estourou) return `Passou do limite em ${caracteres(-l.restante)}.`;
  return null;
}

/** "10 caracteres a mais" quando estourou; `null` caso contrário (spec 6.9). */
export function excessoDoCampo(leitura: LeituraDoCampo): string | null {
  if (!leitura.estourou) return null;
  return `${caracteres(-leitura.restante)} a mais`;
}

/**
 * Frase da região de status, falada só quando cruza um marco (não a cada tecla):
 * "Faltam 20 caracteres" ao chegar em 20 restantes e "Passou do limite em N
 * caracteres" ao estourar. Devolve `null` fora desses momentos.
 */
export function avisoDeContador(anterior: LeituraDoCampo | null, atual: LeituraDoCampo): string | null {
  if (atual.estourou) {
    if (anterior && anterior.estourou && anterior.restante === atual.restante) return null;
    return `Passou do limite em ${caracteres(-atual.restante)}.`;
  }
  const cruzou20 = atual.restante <= 20 && (anterior === null || anterior.restante > 20 || anterior.estourou);
  if (cruzou20 && atual.restante > 0 && atual.usados > 0) return `${atual.restante === 1 ? 'Falta' : 'Faltam'} ${caracteres(atual.restante)}.`;
  return null;
}

// ---------------------------------------------------------------------------
// Erro de envio
// ---------------------------------------------------------------------------

export type OperacaoDeEscrita = 'topico' | 'resposta' | 'edicaoDeTopico' | 'edicaoDeResposta' | 'apagar' | 'denuncia';

/** O que a tela oferece junto da frase. */
export type AcaoDoErro =
  | 'participar'
  | 'entrar'
  | 'verComunidades'
  | 'responderNoTopico'
  | 'topicoFechado'
  | 'topicoIndisponivel'
  /** Falha ambígua: pode ter gravado. A tela manda conferir, não reenvia sozinha. */
  | 'conferir';

export type OndeMostrar = 'titulo' | 'corpo' | 'geral';

export interface ErroDeEnvio {
  readonly texto: string;
  readonly onde: OndeMostrar;
  readonly acao: AcaoDoErro | null;
  /** O servidor pode ter gravado: nunca reenviar sozinho. */
  readonly ambiguo: boolean;
}

const erro = (texto: string, onde: OndeMostrar = 'geral', acao: AcaoDoErro | null = null, ambiguo = false): ErroDeEnvio => ({
  texto,
  onde,
  acao,
  ambiguo,
});

export const TEXTO_SEM_CONFIRMACAO =
  'Não deu pra confirmar o envio. Seu texto continua aqui. Antes de tentar de novo, confere se já apareceu.';
export const TEXTO_RECUSADO = 'Não deu para enviar. Seu texto continua aqui, tenta de novo.';
/** O banco recusou antes de gravar: pode tentar de novo depois, sem risco de duplicar. */
export const TEXTO_LIMITE_DE_FREQUENCIA = 'Muita coisa de uma vez. Seu texto continua aqui, tenta daqui a pouco.';
export const TEXTO_SEM_INTERNET = 'Sem internet. Seu texto continua aqui.';
/** Apagar e denunciar não têm texto para guardar: sem o "seu texto continua aqui" (6.3 e 6.4). */
export const TEXTO_SEM_INTERNET_SEM_TEXTO = 'Sem internet. Confere a conexão e tenta de novo.';
export const TEXTO_SESSAO_ACABOU =
  'Sua sessão acabou ou essa conta não pode participar. Entra de novo, seu texto fica aqui.';

/**
 * Tabela 6.6 da spec. `operacao` só importa onde a mesma falha muda de lugar
 * ou de frase (corpo de resposta vs. de tópico; apagar e denunciar têm frase própria).
 */
export function erroDeEnvio(motivo: MotivoDeEscrita, operacao: OperacaoDeEscrita): ErroDeEnvio {
  switch (motivo) {
    case 'tituloInvalido':
      return erro('O título precisa ter de 1 a 120 caracteres.', 'titulo');
    case 'corpoInvalido':
      if (operacao === 'resposta' || operacao === 'edicaoDeResposta') {
        return erro('A resposta precisa ter de 1 a 500 caracteres.', 'corpo');
      }
      return erro('A mensagem precisa ter de 1 a 1000 caracteres.', 'corpo');
    case 'respostaInvalida':
      return erro('A resposta precisa ter de 1 a 500 caracteres.', 'corpo');
    case 'comunidadeInexistente':
      return erro('Essa comunidade não existe mais.', 'geral', 'verComunidades');
    case 'naoEMembro':
      return erro('Entre na comunidade antes de participar.', 'geral', 'participar');
    case 'topicoFechado':
      if (operacao === 'edicaoDeTopico' || operacao === 'edicaoDeResposta') {
        return erro('Esse tópico foi fechado. Não dá mais pra editar.', 'geral', 'topicoFechado');
      }
      return erro('Esse tópico foi fechado. Não aceita mais respostas.', 'geral', 'topicoFechado');
    case 'topicoNaoEncontrado':
      return erro('Esse tópico não está mais disponível.', 'geral', 'topicoIndisponivel');
    case 'paiInvalido':
      return erro(
        'A resposta que você queria responder não está mais aqui. Responde direto no tópico.',
        'geral',
        'responderNoTopico',
      );
    case 'respostaNaoEncontrada':
      return erro('Essa resposta não está mais disponível.');
    case 'naoEAutor':
      return erro('Só quem escreveu pode mexer nisso.');
    case 'nadaParaEditar':
      return erro('Você não mudou nada.');
    case 'limiteDeFrequencia':
      return erro(TEXTO_LIMITE_DE_FREQUENCIA);
    case 'precisaEntrar':
      return erro(TEXTO_SESSAO_ACABOU, 'geral', 'entrar');
    case 'semConfirmacao':
      // Apagar e denunciar podem ser repetidos: denunciar de novo é ignorado pelo servidor; apagar de novo, se a
      // primeira chegou, devolve *_nao_encontrado (a frase de "não deu pra apagar" e o próximo clique resolvem).
      if (operacao === 'apagar') return erro('Não deu pra apagar. Tenta de novo.');
      if (operacao === 'denuncia') return erro('Não deu pra enviar a denúncia. Tenta de novo.');
      return erro(TEXTO_SEM_CONFIRMACAO, 'geral', 'conferir', true);
    case 'audioSemConsentimento':
    case 'semServidor':
    case 'falhou':
      if (operacao === 'apagar') return erro('Não deu pra apagar. Tenta de novo.');
      if (operacao === 'denuncia') return erro('Não deu pra enviar a denúncia. Tenta de novo.');
      return erro(TEXTO_RECUSADO);
    default: {
      // Motivo novo que esta tabela não conhece: honesto, nunca sucesso.
      const _naoPrevisto: never = motivo;
      void _naoPrevisto;
      return erro(TEXTO_RECUSADO);
    }
  }
}
