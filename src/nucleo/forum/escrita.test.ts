import { describe, expect, it } from 'vitest';
import type { MotivoDeEscrita } from '../../portas/forum';
import {
  avisoDeContador,
  erroDeEnvio,
  erroDoCampo,
  excessoDoCampo,
  lerCampo,
  TEXTO_RECUSADO,
  TEXTO_SEM_CONFIRMACAO,
  TEXTO_SESSAO_ACABOU,
  type OperacaoDeEscrita,
} from './escrita';

describe('lerCampo: contagem como o Postgres', () => {
  it('conta por code point e ignora espaço nas pontas', () => {
    expect(lerCampo('💨'.repeat(120), 120)).toMatchObject({ usados: 120, restante: 0, estourou: false });
    expect(lerCampo('💨'.repeat(121), 120)).toMatchObject({ usados: 121, restante: -1, estourou: true });
    expect(lerCampo('   oi   ', 120)).toMatchObject({ usados: 2, vazio: false });
    expect(lerCampo('   ', 120).vazio).toBe(true);
  });
});

describe('erroDoCampo', () => {
  it('vazio diz o que falta; estourado diz quanto passou; no limite passa', () => {
    expect(erroDoCampo('', 120, 'Falta o título.')).toBe('Falta o título.');
    expect(erroDoCampo('a'.repeat(130), 120, 'Falta o título.')).toBe('Passou do limite em 10 caracteres.');
    expect(erroDoCampo('a'.repeat(121), 120, 'Falta o título.')).toBe('Passou do limite em 1 caractere.');
    expect(erroDoCampo('a'.repeat(120), 120, 'Falta o título.')).toBeNull();
    expect(erroDoCampo('💨'.repeat(120), 120, 'Falta o título.')).toBeNull();
  });
});

describe('excessoDoCampo e avisoDeContador', () => {
  it('"10 caracteres a mais" só quando estourou', () => {
    expect(excessoDoCampo(lerCampo('a'.repeat(130), 120))).toBe('10 caracteres a mais');
    expect(excessoDoCampo(lerCampo('a'.repeat(121), 120))).toBe('1 caractere a mais');
    expect(excessoDoCampo(lerCampo('a'.repeat(120), 120))).toBeNull();
  });

  it('fala só ao cruzar 20 restantes e ao estourar, não a cada tecla', () => {
    const l = (n: number) => lerCampo('a'.repeat(n), 120);
    expect(avisoDeContador(l(98), l(99))).toBeNull();
    expect(avisoDeContador(l(99), l(100))).toBe('Faltam 20 caracteres.');
    expect(avisoDeContador(l(100), l(101))).toBeNull();
    expect(avisoDeContador(l(119), l(120))).toBeNull();
    expect(avisoDeContador(l(120), l(121))).toBe('Passou do limite em 1 caractere.');
    expect(avisoDeContador(l(121), l(121))).toBeNull();
    expect(avisoDeContador(l(121), l(125))).toBe('Passou do limite em 5 caracteres.');
    // voltou a caber e cruza de novo
    expect(avisoDeContador(l(125), l(110))).toBe('Faltam 10 caracteres.');
  });

  it('abrir com rascunho já perto do limite fala uma vez; campo vazio nunca fala', () => {
    expect(avisoDeContador(null, lerCampo('', 120))).toBeNull();
    expect(avisoDeContador(null, lerCampo('a'.repeat(110), 120))).toBe('Faltam 10 caracteres.');
  });
});

const TODOS: readonly MotivoDeEscrita[] = [
  'semServidor',
  'precisaEntrar',
  'naoEMembro',
  'tituloInvalido',
  'corpoInvalido',
  'respostaInvalida',
  'comunidadeInexistente',
  'topicoFechado',
  'topicoNaoEncontrado',
  'paiInvalido',
  'respostaNaoEncontrada',
  'audioSemConsentimento',
  'naoEAutor',
  'nadaParaEditar',
  'limiteDeFrequencia',
  'falhou',
  'semConfirmacao',
];

describe('erroDeEnvio: tabela 6.6, por motivo tipado', () => {
  it.each<[MotivoDeEscrita, OperacaoDeEscrita, string, string, string | null]>([
    ['tituloInvalido', 'topico', 'O título precisa ter de 1 a 120 caracteres.', 'titulo', null],
    ['corpoInvalido', 'topico', 'A mensagem precisa ter de 1 a 2000 caracteres.', 'corpo', null],
    ['corpoInvalido', 'edicaoDeTopico', 'A mensagem precisa ter de 1 a 2000 caracteres.', 'corpo', null],
    ['corpoInvalido', 'resposta', 'A resposta precisa ter de 1 a 1000 caracteres.', 'corpo', null],
    ['respostaInvalida', 'resposta', 'A resposta precisa ter de 1 a 1000 caracteres.', 'corpo', null],
    ['comunidadeInexistente', 'topico', 'Essa comunidade não existe mais.', 'geral', 'verComunidades'],
    ['naoEMembro', 'topico', 'Entre na comunidade antes de participar.', 'geral', 'participar'],
    ['naoEMembro', 'resposta', 'Entre na comunidade antes de participar.', 'geral', 'participar'],
    ['topicoFechado', 'resposta', 'Esse tópico foi fechado. Não aceita mais respostas.', 'geral', 'topicoFechado'],
    ['topicoNaoEncontrado', 'resposta', 'Esse tópico não está mais disponível.', 'geral', 'topicoIndisponivel'],
    [
      'paiInvalido',
      'resposta',
      'A resposta que você queria responder não está mais aqui. Responde direto no tópico.',
      'geral',
      'responderNoTopico',
    ],
    ['respostaNaoEncontrada', 'edicaoDeResposta', 'Essa resposta não está mais disponível.', 'geral', null],
    ['naoEAutor', 'edicaoDeTopico', 'Só quem escreveu pode mexer nisso.', 'geral', null],
    ['nadaParaEditar', 'edicaoDeTopico', 'Você não mudou nada.', 'geral', null],
    ['limiteDeFrequencia', 'resposta', 'Muita coisa de uma vez. Seu texto continua aqui, tenta daqui a pouco.', 'geral', null],
    ['limiteDeFrequencia', 'topico', 'Muita coisa de uma vez. Seu texto continua aqui, tenta daqui a pouco.', 'geral', null],
    ['precisaEntrar', 'topico', TEXTO_SESSAO_ACABOU, 'geral', 'entrar'],
  ])('%s em %s', (motivo, operacao, texto, onde, acao) => {
    expect(erroDeEnvio(motivo, operacao)).toMatchObject({ texto, onde, acao, ambiguo: false });
  });

  it('semConfirmacao em criar, responder e editar: pode ter gravado, manda conferir e marca como ambíguo', () => {
    for (const op of ['topico', 'resposta', 'edicaoDeTopico', 'edicaoDeResposta'] as const) {
      expect(erroDeEnvio('semConfirmacao', op)).toEqual({
        texto: TEXTO_SEM_CONFIRMACAO,
        onde: 'geral',
        acao: 'conferir',
        ambiguo: true,
      });
    }
    expect(TEXTO_SEM_CONFIRMACAO).toBe(
      'Não deu pra confirmar o envio. Seu texto continua aqui. Antes de tentar de novo, confere se já apareceu.',
    );
  });

  it('falhou, semServidor e áudio: recusado, sabemos que não gravou (nunca ambíguo)', () => {
    for (const m of ['falhou', 'semServidor', 'audioSemConsentimento'] as const) {
      expect(erroDeEnvio(m, 'topico')).toEqual({ texto: TEXTO_RECUSADO, onde: 'geral', acao: null, ambiguo: false });
    }
  });

  it('apagar e denunciar têm frase própria, em falha e em falha ambígua', () => {
    for (const m of ['falhou', 'semConfirmacao', 'semServidor'] as const) {
      expect(erroDeEnvio(m, 'apagar').texto).toBe('Não deu pra apagar. Tenta de novo.');
      expect(erroDeEnvio(m, 'denuncia').texto).toBe('Não deu pra enviar a denúncia. Tenta de novo.');
    }
  });

  it('todo motivo da porta tem frase, e só semConfirmacao pede para conferir', () => {
    for (const m of TODOS) {
      const e = erroDeEnvio(m, 'topico');
      expect(e.texto.length).toBeGreaterThan(10);
      expect(e.ambiguo).toBe(m === 'semConfirmacao');
    }
  });

  it('nenhuma frase promete sucesso nem usa emoji', () => {
    for (const m of TODOS) {
      for (const op of ['topico', 'resposta', 'apagar', 'denuncia'] as const) {
        const { texto } = erroDeEnvio(m, op);
        expect(texto).not.toMatch(/enviado|criado|denunciado|apagado com sucesso/i);
        expect(texto).not.toMatch(/\p{Extended_Pictographic}/u);
      }
    }
  });
});
