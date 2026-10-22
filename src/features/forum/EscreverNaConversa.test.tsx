// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { esquecerRascunhosDaSessao } from '../../nucleo/forum/rascunho';
import { chaveDoRascunhoDeResposta } from '../../portas/armazenamento';
import type {
  MotivoDeEscrita,
  PortaDeForum,
  RespostaCriada,
  RespostaDoForum,
  ResultadoDaEscrita,
  TopicoDoForum,
} from '../../portas/forum';
import { limparListasVistas } from './hooks';
import {
  Rotas,
  ambienteFalso,
  armazenamentoFalso,
  comunidade,
  comunidadeFalsa,
  contaFalsa,
  forumFalso,
  resposta,
  sondas,
  topico,
} from './dublesParaTeste';

beforeEach(() => {
  limparListasVistas();
  esquecerRascunhosDaSessao();
});
afterEach(cleanup);

const ID = '11111111-1111-4111-8111-111111111111';
const ROTA = `/c/reuniao-da-firma/t/${ID}`;
const CONTA = { temSessao: true, anonima: false, podeParticiparSocialmente: true } as const;
const NOVA = 'r-nova';

const ok = <T,>(valor: T): ResultadoDaEscrita<T> => ({ ok: true, valor });
const falha = (motivo: MotivoDeEscrita): ResultadoDaEscrita<never> => ({ ok: false, motivo });
const criada = (parcial: Partial<RespostaCriada> = {}): RespostaCriada => ({
  id: NOVA,
  topicoId: ID,
  paiId: null,
  nivel: 0,
  criadoEm: '2026-10-19T15:00:00.123456+00:00',
  ...parcial,
});

interface Cenario {
  topico?: Partial<TopicoDoForum>;
  respostas?: RespostaDoForum[];
  conta?: Parameters<typeof contaFalsa>[0];
  souMembro?: boolean;
  slugsDaConta?: string[];
  forum?: Partial<PortaDeForum>;
  porta?: ReturnType<typeof comunidadeFalsa>;
  armazenamento?: ReturnType<typeof armazenamentoFalso>;
  ambiente?: ReturnType<typeof ambienteFalso>;
}

function abrir(c: Cenario = {}) {
  // O "servidor" da prova: o que o cliente lê de volta é isto, não o que ele digitou.
  const estado = { topico: topico({ id: ID, ...c.topico }), respostas: c.respostas ?? [] };
  const forum = forumFalso({
    obterTopico: vi.fn(async () => ({ ok: true as const, valor: estado.topico })),
    listarRespostasDoTopico: vi.fn(async () => ({ ok: true as const, valor: { itens: estado.respostas, proximo: null } })),
    obterComunidadeDoForum: vi.fn(async () => ({ ok: true as const, valor: comunidade({ souMembro: c.souMembro ?? true }) })),
    ...c.forum,
  });
  const armazenamento = c.armazenamento ?? armazenamentoFalso();
  const ambiente = c.ambiente ?? ambienteFalso();
  const porta = c.porta ?? comunidadeFalsa(c.slugsDaConta ?? (c.souMembro === false ? [] : ['reuniao-da-firma']));
  render(
    <Rotas
      entrada={ROTA}
      m={{ forum, conta: contaFalsa(c.conta ?? CONTA), comunidade: porta, armazenamento, ambiente }}
    />,
  );
  return { forum, estado, armazenamento, ambiente, porta };
}

const campo = (nome: string | RegExp = 'Sua resposta') => screen.getByLabelText(nome) as HTMLTextAreaElement;
const digitar = (texto: string, nome?: string | RegExp) => fireEvent.change(campo(nome), { target: { value: texto } });
const enviar = (nome?: string | RegExp) => fireEvent.submit(campo(nome).closest('form')!);
const esperarConversa = () => screen.findByRole('heading', { level: 1, name: 'Conversa em Na reunião da firma' });
const statusDaCasca = () => document.querySelector('.forum-shell > [role="status"]')!.textContent;
const toastVisivel = () => document.querySelector('.forum-toast')?.textContent;
const menuDoTopico = () => screen.getByRole('button', { name: 'Ações do tópico' });
const escolher = (botao: HTMLElement, item: string) => {
  fireEvent.click(botao);
  fireEvent.click(screen.getByRole('menuitem', { name: item }));
};

describe('o que cada papel vê no fim da conversa (spec 5 e 9.5)', () => {
  it('membro com tópico aberto: composer com contador 0/180, "Enviar" verde e a frase de abertura', async () => {
    abrir();
    await esperarConversa();
    expect(campo().placeholder).toBe('Escreve sua resposta');
    expect(screen.getByText('0/180')).toBeDefined();
    expect(screen.getByRole('button', { name: 'Enviar' })).toBeDefined();
    expect(await screen.findByText('Ninguém respondeu ainda. Manda a primeira.')).toBeDefined();
    expect(campo().getAttribute('maxlength')).toBeNull();
  });

  it('visitante: convite com Criar conta e Já tenho conta (voltando ao tópico), sem composer', async () => {
    abrir({ conta: { temSessao: false, anonima: false } });
    await esperarConversa();
    expect(screen.queryByLabelText('Sua resposta')).toBeNull();
    const criar = await screen.findByRole('link', { name: 'Criar conta' });
    expect(decodeURIComponent(criar.getAttribute('href')!)).toBe(`/login?modo=cadastro&volta=${ROTA}`);
    expect(screen.getByRole('link', { name: 'Já tenho conta' })).toBeDefined();
    expect(screen.getByText('Ninguém respondeu ainda.')).toBeDefined();
  });

  it('conta sem promoção também vê o convite, nunca um composer que falha', async () => {
    abrir({ conta: { temSessao: true, anonima: false, podeParticiparSocialmente: false } });
    await esperarConversa();
    expect(await screen.findByRole('link', { name: 'Criar conta' })).toBeDefined();
    expect(screen.queryByLabelText('Sua resposta')).toBeNull();
  });

  it('conta que não participa: "Entre na comunidade para responder." e Participar; entrou, o composer aparece com o foco', async () => {
    const { porta } = abrir({ souMembro: false });
    await esperarConversa();
    expect(await screen.findByText('Entre na comunidade para responder.')).toBeDefined();
    expect(screen.queryByLabelText('Sua resposta')).toBeNull();
    fireEvent.click(screen.getAllByRole('button', { name: 'Participar' })[0]);
    await waitFor(() => expect(porta.entrarComunidade).toHaveBeenCalledWith('reuniao-da-firma'));
    const caixa = await screen.findByLabelText('Sua resposta');
    await waitFor(() => expect(document.activeElement).toBe(caixa));
    expect(screen.queryByText('Entre na comunidade para responder.')).toBeNull();
  });

  it('tópico fechado: nenhum composer, nenhum Responder; a faixa de fechado explica', async () => {
    abrir({ topico: { status: 'fechado' } });
    await esperarConversa();
    expect(screen.getByText(/Este tópico está fechado/)).toBeDefined();
    expect(screen.queryByLabelText('Sua resposta')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Responder' })).toBeNull();
    expect(screen.queryByRole('link', { name: 'Criar conta' })).toBeNull();
  });

  it('não se sabe quem é: sem composer, sem convite de visitante, sem Responder', async () => {
    abrir({ conta: 'quebrada' });
    await esperarConversa();
    expect(screen.queryByLabelText('Sua resposta')).toBeNull();
    expect(screen.queryByRole('link', { name: 'Criar conta' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Responder' })).toBeNull();
  });

  it('oferece imagem e link; sem ponte de plataforma, gravação fica indisponível', async () => {
    abrir();
    await esperarConversa();
    expect(screen.queryByText(/Arrotar para responder/)).toBeNull();
    expect(document.querySelector('input[type="file"]')).not.toBeNull();
    expect(screen.getByRole('button', { name: 'Gravar áudio' }).hasAttribute('disabled')).toBe(true);
  });

  it('um verde só no composer: "Enviar" é o único botão de acento (sem nota no tópico)', async () => {
    abrir({ respostas: [resposta({ id: 'r1' })] });
    await screen.findByText('texto r1');
    fireEvent.click(screen.getByRole('button', { name: 'Responder a Bia Lima' }));
    await screen.findByLabelText('Sua resposta a Bia Lima');
    expect(document.querySelectorAll('.forum-botao--acento').length).toBe(1);
  });
});

describe('responder o tópico', () => {
  it('manda só tópico e texto aparado (sem autor, nota, contagem, pai nem áudio), depois lê tudo do servidor e foca a resposta', async () => {
    const responder = vi.fn(async () => ok(criada()));
    const { forum, estado } = abrir({ forum: { responderTopico: responder } });
    await esperarConversa();
    await screen.findByText('Ninguém respondeu ainda. Manda a primeira.');
    digitar('  Boa, foi isso mesmo.  ');
    // o servidor passa a ter a resposta; só depois do ok o cliente lê
    estado.respostas = [resposta({ id: NOVA, corpo: 'Boa, foi isso mesmo.', autor: { id: 'a1', apelido: 'Ana Souza', handle: 'ana', avatarUrl: null }, souAutor: true })];
    estado.topico = { ...estado.topico, respostasTotal: 1 };
    enviar();
    await screen.findByText('Boa, foi isso mesmo.');
    expect(responder).toHaveBeenCalledTimes(1);
    expect(responder).toHaveBeenCalledWith({ topicoId: ID, corpo: 'Boa, foi isso mesmo.' });
    expect(forum.obterTopico).toHaveBeenCalledTimes(2);
    expect(await screen.findByRole('heading', { level: 2, name: '1 resposta' })).toBeDefined();
    expect(campo().value).toBe('');
    const li = screen.getByText('Boa, foi isso mesmo.').closest('li')!;
    await waitFor(() => expect(document.activeElement).toBe(li));
    expect(statusDaCasca()).toBe('Resposta enviada.');
  });

  it('a conversa mostrada depois é a do servidor: o que o cliente digitou e o servidor não tem não aparece', async () => {
    const { estado } = abrir({ forum: { responderTopico: vi.fn(async () => ok(criada())) } });
    await esperarConversa();
    digitar('texto que o servidor não guardou');
    estado.respostas = [resposta({ id: 'r9', corpo: 'texto do servidor' })];
    enviar();
    await screen.findByText('texto do servidor');
    expect(screen.queryByText('texto que o servidor não guardou')).toBeNull();
  });

  it('sem otimismo: enquanto o servidor não respondeu, nada de resposta na tela e o texto fica no campo', async () => {
    let soltar!: (r: ResultadoDaEscrita<RespostaCriada>) => void;
    const responder = vi.fn(() => new Promise<ResultadoDaEscrita<RespostaCriada>>((r) => (soltar = r)));
    abrir({ forum: { responderTopico: responder } });
    await esperarConversa();
    digitar('minha resposta');
    enviar();
    expect(screen.getByRole('button', { name: 'Enviando…' }).getAttribute('aria-busy')).toBe('true');
    expect(campo().readOnly).toBe(true);
    expect(campo().value).toBe('minha resposta');
    expect(screen.queryByRole('heading', { level: 2, name: /1 resposta/ })).toBeNull();
    await act(async () => soltar(ok(criada())));
    await waitFor(() => expect(campo().value).toBe(''));
  });

  it('duplo toque: uma resposta só, também com o ok e a releitura ainda no ar', async () => {
    let soltar!: (r: ResultadoDaEscrita<RespostaCriada>) => void;
    const responder = vi.fn(() => new Promise<ResultadoDaEscrita<RespostaCriada>>((r) => (soltar = r)));
    abrir({ forum: { responderTopico: responder } });
    await esperarConversa();
    digitar('uma vez só');
    const form = campo().closest('form')!;
    fireEvent.submit(form);
    fireEvent.submit(form);
    fireEvent.click(screen.getByRole('button', { name: 'Enviando…' }));
    await act(async () => {
      soltar(ok(criada()));
      await new Promise((r) => setTimeout(r, 0));
      fireEvent.submit(form);
    });
    await waitFor(() => expect(campo().value).toBe(''));
    expect(responder).toHaveBeenCalledTimes(1);
  });

  it('contador por code point: 180 emojis cabem, 181 bloqueiam com "Passou do limite" e nada vai ao servidor', async () => {
    const responder = vi.fn(async () => ok(criada()));
    abrir({ forum: { responderTopico: responder } });
    await esperarConversa();
    digitar('💨'.repeat(180));
    expect(screen.getByText('180/180')).toBeDefined();
    digitar('💨'.repeat(181));
    expect(screen.getByText('181/180')).toBeDefined();
    enviar();
    const erro = (await screen.findAllByText('Passou do limite em 1 caractere.')).find((e) => e.closest('[role="alert"]'));
    expect(erro).toBeDefined();
    expect(responder).not.toHaveBeenCalled();
    expect(document.activeElement).toBe(campo());
  });

  it('vazio: pede resposta ou anexo e mantém o foco no campo, sem ir ao servidor', async () => {
    const responder = vi.fn(async () => ok(criada()));
    abrir({ forum: { responderTopico: responder } });
    await esperarConversa();
    enviar();
    expect(await screen.findByText('Falta a resposta ou um anexo.')).toBeDefined();
    expect(responder).not.toHaveBeenCalled();
  });

  it('rascunho: guardado por tópico (e sem pai), volta ao reabrir, some só no sucesso', async () => {
    const armazenamento = armazenamentoFalso();
    abrir({ armazenamento, forum: { responderTopico: vi.fn(async () => ok(criada())) } });
    await esperarConversa();
    digitar('rascunho aqui');
    const chave = chaveDoRascunhoDeResposta('conta-a', ID, null);
    expect(JSON.parse(armazenamento.dados.get(chave)!)).toEqual({ corpo: 'rascunho aqui' });
    cleanup();
    abrir({ armazenamento, forum: { responderTopico: vi.fn(async () => ok(criada())) } });
    await esperarConversa();
    expect(campo().value).toBe('rascunho aqui');
    enviar();
    await waitFor(() => expect(armazenamento.dados.has(chave)).toBe(false));
  });

  it('rascunho preservado em qualquer falha', async () => {
    const armazenamento = armazenamentoFalso();
    abrir({ armazenamento, forum: { responderTopico: vi.fn(async () => falha('falhou')) } });
    await esperarConversa();
    digitar('não pode sumir');
    enviar();
    await screen.findByText('Não deu para enviar. Seu texto continua aqui, tenta de novo.');
    expect(campo().value).toBe('não pode sumir');
    expect(armazenamento.dados.has(chaveDoRascunhoDeResposta('conta-a', ID, null))).toBe(true);
  });

  it('armazenamento barrado: nada lança e o texto vive na sessão', async () => {
    const armazenamento = armazenamentoFalso({ barrado: true });
    abrir({ armazenamento });
    await esperarConversa();
    expect(() => digitar('na memória')).not.toThrow();
    cleanup();
    abrir({ armazenamento });
    await esperarConversa();
    expect(campo().value).toBe('na memória');
  });

  it('sem internet: não chama e diz "Sem internet. Seu texto continua aqui."', async () => {
    const responder = vi.fn(async () => ok(criada()));
    abrir({ ambiente: ambienteFalso({ online: false }), forum: { responderTopico: responder } });
    await esperarConversa();
    digitar('oi');
    enviar();
    expect(await screen.findByText('Sem internet. Seu texto continua aqui.')).toBeDefined();
    expect(responder).not.toHaveBeenCalled();
  });

  it('resposta enviada mas a releitura falhou: diz a verdade, mostra "Atualizar a conversa" e não reenvia', async () => {
    const responder = vi.fn(async () => ok(criada()));
    const listar = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, valor: { itens: [], proximo: null } })
      .mockResolvedValueOnce({ ok: false, motivo: 'falhou' })
      .mockResolvedValue({ ok: true, valor: { itens: [resposta({ id: 'r9', corpo: 'já está lá' })], proximo: null } });
    abrir({ forum: { responderTopico: responder, listarRespostasDoTopico: listar } });
    await esperarConversa();
    digitar('oi');
    enviar();
    expect((await screen.findByText('Sua resposta foi enviada, mas não deu pra atualizar a conversa.')).closest('[role="alert"]')).not.toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Atualizar a conversa' }));
    await screen.findByText('já está lá');
    expect(responder).toHaveBeenCalledTimes(1);
    expect(screen.queryByText(/não deu pra atualizar/)).toBeNull();
  });
});

describe('responder: cada motivo do servidor (spec 6.6)', () => {
  const simples: ReadonlyArray<readonly [MotivoDeEscrita, string]> = [
    ['respostaInvalida', 'A resposta precisa ter de 1 a 1000 caracteres.'],
    ['corpoInvalido', 'A resposta precisa ter de 1 a 1000 caracteres.'],
    ['precisaEntrar', 'Sua sessão acabou ou essa conta não pode participar. Entra de novo, seu texto fica aqui.'],
    ['semConfirmacao', 'Não deu pra confirmar o envio. Seu texto continua aqui. Antes de tentar de novo, confere se já apareceu.'],
    ['falhou', 'Não deu para enviar. Seu texto continua aqui, tenta de novo.'],
    ['semServidor', 'Não deu para enviar. Seu texto continua aqui, tenta de novo.'],
    ['topicoFechado', 'Esse tópico foi fechado. Não aceita mais respostas.'],
    ['topicoNaoEncontrado', 'Esse tópico não está mais disponível.'],
    ['naoEMembro', 'Entre na comunidade antes de participar.'],
    ['comunidadeInexistente', 'Essa comunidade não existe mais.'],
    ['audioSemConsentimento', 'Não deu para enviar. Seu texto continua aqui, tenta de novo.'],
  ];

  it.each(simples)('%s: frase certa, texto e rascunho intactos', async (motivo, frase) => {
    const armazenamento = armazenamentoFalso();
    // fechado e sumido fazem a tela reler o tópico; devolvem o mesmo para o composer seguir à mostra
    abrir({ armazenamento, forum: { responderTopico: vi.fn(async () => falha(motivo)) } });
    await esperarConversa();
    digitar('meu texto');
    enviar();
    expect((await screen.findAllByText(frase)).length).toBeGreaterThan(0);
    expect(campo().value).toBe('meu texto');
    expect(armazenamento.dados.has(chaveDoRascunhoDeResposta('conta-a', ID, null))).toBe(true);
  });

  it('42501 sem HINT: link Entrar volta para este tópico', async () => {
    abrir({ forum: { responderTopico: vi.fn(async () => falha('precisaEntrar')) } });
    await esperarConversa();
    digitar('x');
    enviar();
    const link = await screen.findByRole('link', { name: 'Entrar' });
    expect(link.getAttribute('href')).toBe(`/login?volta=${encodeURIComponent(ROTA)}`);
  });

  it('topico_fechado: a tela relê o tópico; fechado, o composer vira a faixa e o texto fica guardado', async () => {
    const armazenamento = armazenamentoFalso();
    const { estado } = abrir({ armazenamento, forum: { responderTopico: vi.fn(async () => falha('topicoFechado')) } });
    await esperarConversa();
    digitar('guardado');
    estado.topico = { ...estado.topico, status: 'fechado' };
    enviar();
    await screen.findByText(/Este tópico está fechado/);
    await waitFor(() => expect(screen.queryByLabelText('Sua resposta')).toBeNull());
    expect(JSON.parse(armazenamento.dados.get(chaveDoRascunhoDeResposta('conta-a', ID, null))!)).toEqual({ corpo: 'guardado' });
  });

  it('topico_nao_encontrado: a tela relê e vira "Esse tópico não está disponível."', async () => {
    const { estado } = abrir({ forum: { responderTopico: vi.fn(async () => falha('topicoNaoEncontrado')) } });
    await esperarConversa();
    digitar('x');
    estado.topico = null as unknown as TopicoDoForum;
    enviar();
    expect(await screen.findByText('Esse tópico não está disponível.')).toBeDefined();
  });

  it('nao_e_membro: Participar ao lado; entrou, o aviso some, o texto segue e reenvia', async () => {
    const responder = vi.fn<PortaDeForum['responderTopico']>().mockResolvedValueOnce(falha('naoEMembro')).mockResolvedValueOnce(ok(criada()));
    const { porta } = abrir({ forum: { responderTopico: responder } });
    await esperarConversa();
    digitar('meu texto');
    enviar();
    await screen.findByText('Entre na comunidade antes de participar.');
    fireEvent.click(screen.getAllByRole('button', { name: 'Participar' })[0]);
    await waitFor(() => expect(porta.entrarComunidade).toHaveBeenCalled());
    await waitFor(() => expect(screen.queryByText('Entre na comunidade antes de participar.')).toBeNull());
    expect(campo().value).toBe('meu texto');
    enviar();
    await waitFor(() => expect(responder).toHaveBeenCalledTimes(2));
  });

  it('falha ambígua: nunca reenvia sozinha; "Conferir a conversa" lê de novo; "Descartar texto" limpa', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    try {
      const responder = vi.fn(async () => falha('semConfirmacao'));
      const { forum } = abrir({ forum: { responderTopico: responder } });
      await esperarConversa();
      digitar('talvez gravou');
      enviar();
      await screen.findByText(/Não deu pra confirmar o envio/);
      await act(async () => {
        await vi.advanceTimersByTimeAsync(60_000);
      });
      expect(responder).toHaveBeenCalledTimes(1);
      const antes = (forum.listarRespostasDoTopico as ReturnType<typeof vi.fn>).mock.calls.length;
      fireEvent.click(screen.getByRole('button', { name: 'Conferir a conversa' }));
      await waitFor(() => expect((forum.listarRespostasDoTopico as ReturnType<typeof vi.fn>).mock.calls.length).toBeGreaterThan(antes));
      expect(responder).toHaveBeenCalledTimes(1);
      expect(campo().value).toBe('talvez gravou');
      fireEvent.click(screen.getByRole('button', { name: 'Descartar texto' }));
      expect(campo().value).toBe('');
    } finally {
      vi.useRealTimers();
    }
  });

  it('exceção da porta é ambígua, nunca sucesso', async () => {
    abrir({
      forum: {
        responderTopico: vi.fn(async () => {
          throw new Error('rede');
        }),
      },
    });
    await esperarConversa();
    digitar('x');
    enviar();
    expect(await screen.findByText(/Não deu pra confirmar o envio/)).toBeDefined();
    expect(campo().value).toBe('x');
  });
});

describe('responder uma resposta (aninhamento travado no nível 2)', () => {
  const arvore = () => [
    resposta({ id: 'r1', corpo: 'primeira' }),
    resposta({ id: 'r2', paiId: 'r1', nivel: 1, corpo: 'filha', autor: { id: 'a3', apelido: 'Caio', handle: 'caio', avatarUrl: null } }),
    resposta({ id: 'r3', paiId: 'r2', nivel: 2, corpo: 'neta', autor: { id: 'a4', apelido: 'Duda', handle: 'duda', avatarUrl: null } }),
  ];

  it('abre o composer logo abaixo daquela resposta, com "Respondendo a @handle" e foco; só um aberto por vez', async () => {
    abrir({ respostas: arvore() });
    await screen.findByText('primeira');
    fireEvent.click(screen.getByRole('button', { name: 'Responder a Bia Lima' }));
    const campoInline = await screen.findByLabelText('Sua resposta a Bia Lima');
    expect(document.activeElement).toBe(campoInline);
    expect(screen.getByText('Respondendo a @bia')).toBeDefined();
    expect(campoInline.closest('li')!.textContent).toContain('primeira');
    fireEvent.click(screen.getByRole('button', { name: 'Responder a Caio' }));
    await screen.findByLabelText('Sua resposta a Caio');
    expect(screen.queryByLabelText('Sua resposta a Bia Lima')).toBeNull();
  });

  it('envia com o pai certo; responder uma de nível 2 manda o pai dela (o servidor mantém o nível 2)', async () => {
    const responder = vi.fn(async () => ok(criada({ paiId: 'r3', nivel: 2 })));
    const { estado } = abrir({ respostas: arvore(), forum: { responderTopico: responder } });
    await screen.findByText('neta');
    fireEvent.click(screen.getByRole('button', { name: 'Responder a Duda' }));
    digitar('de volta', 'Sua resposta a Duda');
    estado.respostas = [...estado.respostas, resposta({ id: NOVA, paiId: 'r3', nivel: 2, corpo: 'de volta', souAutor: true })];
    enviar('Sua resposta a Duda');
    await screen.findByText('de volta');
    expect(responder).toHaveBeenCalledWith({ topicoId: ID, corpo: 'de volta', paiId: 'r3' });
    const nova = screen.getByText('de volta').closest('li')!;
    expect(nova.getAttribute('data-nivel')).toBe('2');
    expect(within(nova).getByText('Respondendo a @duda')).toBeDefined();
    expect(screen.queryByLabelText('Sua resposta a Duda')).toBeNull();
    await waitFor(() => expect(document.activeElement).toBe(nova));
  });

  it('Esc e Cancelar fecham, devolvem o foco ao "Responder" e guardam o rascunho; abrir de novo traz o texto', async () => {
    const armazenamento = armazenamentoFalso();
    abrir({ respostas: arvore(), armazenamento });
    await screen.findByText('primeira');
    const botao = screen.getByRole('button', { name: 'Responder a Bia Lima' });
    fireEvent.click(botao);
    digitar('rascunho do pai', 'Sua resposta a Bia Lima');
    fireEvent.keyDown(campo('Sua resposta a Bia Lima'), { key: 'Escape' });
    expect(screen.queryByLabelText('Sua resposta a Bia Lima')).toBeNull();
    expect(document.activeElement).toBe(botao);
    expect(JSON.parse(armazenamento.dados.get(chaveDoRascunhoDeResposta('conta-a', ID, 'r1'))!)).toEqual({ corpo: 'rascunho do pai' });
    fireEvent.click(botao);
    expect(campo('Sua resposta a Bia Lima').value).toBe('rascunho do pai');
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(document.activeElement).toBe(botao);
    expect(armazenamento.dados.has(chaveDoRascunhoDeResposta('conta-a', ID, 'r1'))).toBe(true);
  });

  it('o rascunho de uma resposta não vaza para o composer principal nem para outra resposta', async () => {
    abrir({ respostas: arvore() });
    await screen.findByText('primeira');
    fireEvent.click(screen.getByRole('button', { name: 'Responder a Bia Lima' }));
    digitar('só da Bia', 'Sua resposta a Bia Lima');
    expect(campo('Sua resposta').value).toBe('');
    fireEvent.click(screen.getByRole('button', { name: 'Responder a Caio' }));
    expect(campo('Sua resposta a Caio').value).toBe('');
  });

  it('pai_invalido: "Responder no tópico" move o texto para o composer principal e foca ele', async () => {
    const responder = vi.fn(async () => falha('paiInvalido'));
    abrir({ respostas: arvore(), forum: { responderTopico: responder } });
    await screen.findByText('primeira');
    fireEvent.click(screen.getByRole('button', { name: 'Responder a Bia Lima' }));
    digitar('queria responder ali', 'Sua resposta a Bia Lima');
    enviar('Sua resposta a Bia Lima');
    await screen.findByText('A resposta que você queria responder não está mais aqui. Responde direto no tópico.');
    fireEvent.click(screen.getByRole('button', { name: 'Responder no tópico' }));
    expect(screen.queryByLabelText('Sua resposta a Bia Lima')).toBeNull();
    expect(campo('Sua resposta').value).toBe('queria responder ali');
    await waitFor(() => expect(document.activeElement).toBe(campo('Sua resposta')));
  });

  it('casca e tópico fechado não têm "Responder"; visitante também não', async () => {
    abrir({ respostas: [resposta({ id: 'c1', status: 'removido', corpo: null, autor: null }), resposta({ id: 'r1' })] });
    await screen.findByText('Resposta removida.');
    expect(screen.getAllByRole('button', { name: /^Responder a/ })).toHaveLength(1);
    cleanup();
    abrir({ respostas: [resposta({ id: 'r1' })], topico: { status: 'fechado' } });
    await screen.findByText('texto r1');
    expect(screen.queryByRole('button', { name: /^Responder a/ })).toBeNull();
    cleanup();
    abrir({ respostas: [resposta({ id: 'r1' })], conta: { temSessao: false, anonima: false } });
    await screen.findByText('texto r1');
    expect(screen.queryByRole('button', { name: /^Responder a/ })).toBeNull();
  });

  it('o "Responder" do cabeçalho leva ao composer; sem poder responder, leva ao convite', async () => {
    abrir();
    await esperarConversa();
    fireEvent.click(screen.getByRole('button', { name: 'Responder' }));
    await waitFor(() => expect(document.activeElement).toBe(campo()));
    cleanup();
    abrir({ conta: { temSessao: false, anonima: false } });
    await esperarConversa();
    fireEvent.click(screen.getByRole('button', { name: 'Responder' }));
    await waitFor(() => expect((document.activeElement as HTMLElement).textContent).toContain('Quer responder?'));
  });
});

describe('menu de ações (APG)', () => {
  it('abre com foco no primeiro item, setas, Home e End percorrem, Esc fecha e devolve o foco ao botão', async () => {
    abrir({ topico: { souAutor: true } });
    await esperarConversa();
    const botao = menuDoTopico();
    expect(botao.getAttribute('aria-haspopup')).toBe('menu');
    expect(botao.getAttribute('aria-expanded')).toBe('false');
    fireEvent.click(botao);
    expect(botao.getAttribute('aria-expanded')).toBe('true');
    const itens = screen.getAllByRole('menuitem');
    expect(itens.map((i) => i.textContent)).toEqual(['Editar', 'Apagar']);
    expect(document.activeElement).toBe(itens[0]);
    const lista = screen.getByRole('menu');
    fireEvent.keyDown(itens[0], { key: 'ArrowDown' });
    expect(document.activeElement).toBe(itens[1]);
    fireEvent.keyDown(itens[1], { key: 'ArrowDown' });
    expect(document.activeElement).toBe(itens[0]);
    fireEvent.keyDown(itens[0], { key: 'End' });
    expect(document.activeElement).toBe(itens[1]);
    fireEvent.keyDown(itens[1], { key: 'Home' });
    expect(document.activeElement).toBe(itens[0]);
    fireEvent.keyDown(lista, { key: 'Escape' });
    expect(screen.queryByRole('menu')).toBeNull();
    expect(document.activeElement).toBe(botao);
  });

  it('toque no fundo fecha; botão tem alvo de 44px na folha de estilo (classe) e rótulo próprio', async () => {
    abrir({ topico: { souAutor: true } });
    await esperarConversa();
    fireEvent.click(menuDoTopico());
    fireEvent.click(document.querySelector('.forum-menu__fundo')!);
    expect(screen.queryByRole('menu')).toBeNull();
  });

  it('por papel: autor vê Editar e Apagar; outra conta vê Denunciar; visitante não vê menu; autor de tópico fechado não edita', async () => {
    abrir({ topico: { souAutor: true, status: 'fechado' } });
    await esperarConversa();
    fireEvent.click(menuDoTopico());
    expect(screen.getAllByRole('menuitem').map((i) => i.textContent)).toEqual(['Apagar']);
    cleanup();
    abrir();
    await esperarConversa();
    fireEvent.click(menuDoTopico());
    expect(screen.getAllByRole('menuitem').map((i) => i.textContent)).toEqual(['Denunciar']);
    cleanup();
    abrir({ conta: { temSessao: false, anonima: false } });
    await esperarConversa();
    expect(screen.queryByRole('button', { name: 'Ações do tópico' })).toBeNull();
  });

  it('o menu da resposta segue sou_autor: própria = Editar e Apagar, dos outros = Denunciar, casca = nada', async () => {
    abrir({
      respostas: [
        resposta({ id: 'r1', souAutor: true, corpo: 'minha' }),
        resposta({ id: 'r2', corpo: 'dela', autor: { id: 'a5', apelido: 'Eva', handle: 'eva', avatarUrl: null } }),
        resposta({ id: 'r3', status: 'oculto', corpo: null, autor: null }),
      ],
    });
    await screen.findByText('minha');
    fireEvent.click(screen.getByRole('button', { name: 'Ações da resposta de Bia Lima' }));
    expect(screen.getAllByRole('menuitem').map((i) => i.textContent)).toEqual(['Editar', 'Apagar']);
    fireEvent.keyDown(screen.getByRole('menu'), { key: 'Escape' });
    fireEvent.click(screen.getByRole('button', { name: 'Ações da resposta de Eva' }));
    expect(screen.getAllByRole('menuitem').map((i) => i.textContent)).toEqual(['Denunciar']);
    expect(screen.getAllByRole('button', { name: /^Ações da resposta/ })).toHaveLength(2);
  });
});

describe('editar a própria resposta', () => {
  const minha = () => [resposta({ id: 'r1', souAutor: true, corpo: 'texto antigo' })];

  it('edita no lugar: campo preenchido, Salvar manda só o texto novo, relê do servidor, foco na resposta', async () => {
    const editar = vi.fn(async () => ok({ id: 'r1', corpo: 'texto novo', editadoEm: '2026-10-19T15:10:00.123456+00:00' }));
    const { estado } = abrir({ respostas: minha(), forum: { editarResposta: editar } });
    await screen.findByText('texto antigo');
    escolher(screen.getByRole('button', { name: 'Ações da resposta de Bia Lima' }), 'Editar');
    const c = campo('Editar resposta');
    expect(c.value).toBe('texto antigo');
    expect(document.activeElement).toBe(c);
    digitar('  texto novo  ', 'Editar resposta');
    estado.respostas = [resposta({ id: 'r1', souAutor: true, corpo: 'texto novo', editadoEm: '2026-10-19T15:10:00Z' })];
    enviar('Editar resposta');
    await screen.findByText('texto novo');
    expect(editar).toHaveBeenCalledWith({ respostaId: 'r1', corpo: 'texto novo' });
    expect(screen.queryByLabelText('Editar resposta')).toBeNull();
    expect(screen.getByText('editado')).toBeDefined();
    await waitFor(() => expect(document.activeElement).toBe(screen.getByText('texto novo').closest('li')));
  });

  it('sem mudança: "Você não mudou nada." e nada vai ao servidor', async () => {
    const editar = vi.fn();
    abrir({ respostas: minha(), forum: { editarResposta: editar } });
    await screen.findByText('texto antigo');
    escolher(screen.getByRole('button', { name: 'Ações da resposta de Bia Lima' }), 'Editar');
    enviar('Editar resposta');
    expect(await screen.findByText('Você não mudou nada.')).toBeDefined();
    expect(editar).not.toHaveBeenCalled();
  });

  it('falha mantém o campo e o texto; Cancelar volta ao botão do menu', async () => {
    abrir({ respostas: minha(), forum: { editarResposta: vi.fn(async () => falha('naoEAutor')) } });
    await screen.findByText('texto antigo');
    const menu = screen.getByRole('button', { name: 'Ações da resposta de Bia Lima' });
    escolher(menu, 'Editar');
    digitar('mudei', 'Editar resposta');
    enviar('Editar resposta');
    expect(await screen.findByText('Só quem escreveu pode mexer nisso.')).toBeDefined();
    expect(campo('Editar resposta').value).toBe('mudei');
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(screen.getByText('texto antigo')).toBeDefined();
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Ações da resposta de Bia Lima' }));
    void menu;
  });

  it('falha ambígua ao editar manda conferir', async () => {
    abrir({ respostas: minha(), forum: { editarResposta: vi.fn(async () => falha('semConfirmacao')) } });
    await screen.findByText('texto antigo');
    escolher(screen.getByRole('button', { name: 'Ações da resposta de Bia Lima' }), 'Editar');
    digitar('mudei', 'Editar resposta');
    enviar('Editar resposta');
    expect(await screen.findByText(/Não deu pra confirmar o envio/)).toBeDefined();
  });
});

describe('apagar a própria resposta', () => {
  const duas = () => [
    resposta({ id: 'r1', souAutor: true, corpo: 'apagar esta' }),
    resposta({ id: 'r2', corpo: 'a seguinte', autor: { id: 'a5', apelido: 'Eva', handle: 'eva', avatarUrl: null } }),
  ];

  it('confirma com foco em Cancelar; só some depois do ok, relê e foca a próxima; toast', async () => {
    const apagar = vi.fn(async () => ok(true as const));
    const { estado } = abrir({ respostas: duas(), forum: { apagarResposta: apagar } });
    await screen.findByText('apagar esta');
    escolher(screen.getByRole('button', { name: 'Ações da resposta de Bia Lima' }), 'Apagar');
    const d = await screen.findByRole('dialog', { name: 'Apagar esta resposta?' });
    expect(within(d).getByText('Se tiver respostas embaixo dela, elas continuam e a sua vira Resposta removida.')).toBeDefined();
    expect(document.activeElement).toBe(within(d).getByRole('button', { name: 'Cancelar' }));
    expect(screen.getByText('apagar esta')).toBeDefined();
    estado.respostas = [duas()[1]];
    fireEvent.click(within(d).getByRole('button', { name: 'Apagar resposta' }));
    await waitFor(() => expect(screen.queryByText('apagar esta')).toBeNull());
    expect(apagar).toHaveBeenCalledWith('r1');
    await waitFor(() => expect(document.activeElement).toBe(screen.getByText('a seguinte').closest('li')));
    expect(toastVisivel()).toBe('Resposta apagada.');
  });

  it('última da conversa: o foco vai para o composer', async () => {
    const { estado } = abrir({ respostas: [duas()[0]], forum: { apagarResposta: vi.fn(async () => ok(true as const)) } });
    await screen.findByText('apagar esta');
    escolher(screen.getByRole('button', { name: 'Ações da resposta de Bia Lima' }), 'Apagar');
    estado.respostas = [];
    fireEvent.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'Apagar resposta' }));
    await waitFor(() => expect(document.activeElement).toBe(campo()));
  });

  it('Cancelar e Esc não chamam o servidor e devolvem o foco ao menu', async () => {
    const apagar = vi.fn();
    abrir({ respostas: duas(), forum: { apagarResposta: apagar } });
    await screen.findByText('apagar esta');
    const menu = screen.getByRole('button', { name: 'Ações da resposta de Bia Lima' });
    escolher(menu, 'Apagar');
    fireEvent.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'Cancelar' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    await waitFor(() => expect(document.activeElement).toBe(menu));
    escolher(menu, 'Apagar');
    fireEvent(await screen.findByRole('dialog'), new Event('cancel', { cancelable: true }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(apagar).not.toHaveBeenCalled();
    expect(screen.getByText('apagar esta')).toBeDefined();
  });

  it('falha: frase dentro do dialog, a resposta continua na tela, dá pra tentar de novo; duplo toque chama uma vez', async () => {
    let soltar!: (r: ResultadoDaEscrita<true>) => void;
    const apagar = vi
      .fn<PortaDeForum['apagarResposta']>()
      .mockImplementationOnce(() => new Promise((r) => (soltar = r)))
      .mockResolvedValueOnce(ok(true as const));
    abrir({ respostas: duas(), forum: { apagarResposta: apagar } });
    await screen.findByText('apagar esta');
    escolher(screen.getByRole('button', { name: 'Ações da resposta de Bia Lima' }), 'Apagar');
    const d = await screen.findByRole('dialog');
    const confirmar = within(d).getByRole('button', { name: 'Apagar resposta' });
    fireEvent.click(confirmar);
    fireEvent.click(within(d).getByRole('button', { name: 'Apagando…' }));
    expect(apagar).toHaveBeenCalledTimes(1);
    await act(async () => soltar(falha('semConfirmacao')));
    expect(await within(d).findByText('Não deu pra apagar. Tenta de novo.')).toBeDefined();
    expect(screen.getByText('apagar esta')).toBeDefined();
    fireEvent.click(within(d).getByRole('button', { name: 'Apagar resposta' }));
    await waitFor(() => expect(apagar).toHaveBeenCalledTimes(2));
  });
});

describe('editar e apagar o próprio tópico', () => {
  it('editar abre o formulário preenchido ("Editar tópico", "Salvar"), manda só o que mudou e relê o tópico do servidor', async () => {
    const editar = vi.fn(async () => ok({ id: ID, titulo: 'Título novo', corpo: 'Saiu na hora do café.', editadoEm: '2026-10-19T15:00:00.123456+00:00' }));
    const { estado } = abrir({ topico: { souAutor: true }, forum: { editarTopico: editar } });
    await esperarConversa();
    escolher(menuDoTopico(), 'Editar');
    const d = await screen.findByRole('dialog', { name: 'Editar tópico' });
    expect((within(d).getByLabelText('Título') as HTMLInputElement).value).toBe('Arroto na reunião de segunda');
    expect((within(d).getByLabelText('Mensagem') as HTMLTextAreaElement).value).toBe('Saiu na hora do café.');
    expect(within(d).queryByRole('button', { name: 'Descartar rascunho' })).toBeNull();
    fireEvent.change(within(d).getByLabelText('Título'), { target: { value: 'Título novo' } });
    estado.topico = { ...estado.topico, titulo: 'Título novo', editadoEm: '2026-10-19T15:00:00Z' };
    fireEvent.submit(d.querySelector('form')!);
    expect(await screen.findByRole('heading', { level: 1, name: 'Conversa em Na reunião da firma' })).toBeDefined();
    expect(editar).toHaveBeenCalledWith({ topicoId: ID, titulo: 'Título novo' });
    expect(screen.queryByRole('dialog')).toBeNull();
    await waitFor(() => expect(document.activeElement).toBe(menuDoTopico()));
  });

  it('sem mudança, não chama; HINT mantém o formulário e o texto', async () => {
    const editar = vi.fn(async () => falha('tituloInvalido'));
    abrir({ topico: { souAutor: true }, forum: { editarTopico: editar } });
    await esperarConversa();
    escolher(menuDoTopico(), 'Editar');
    const d = await screen.findByRole('dialog', { name: 'Editar tópico' });
    fireEvent.submit(d.querySelector('form')!);
    expect(await within(d).findByText('Você não mudou nada.')).toBeDefined();
    expect(editar).not.toHaveBeenCalled();
    fireEvent.change(within(d).getByLabelText('Título'), { target: { value: 'outro' } });
    fireEvent.submit(d.querySelector('form')!);
    expect(await within(d).findByText('O título precisa ter de 1 a 120 caracteres.')).toBeDefined();
    expect((within(d).getByLabelText('Título') as HTMLInputElement).value).toBe('outro');
  });

  it('apagar: confirma, só depois do ok vai para a comunidade com toast, e a lista da volta não é a velha', async () => {
    const apagar = vi.fn(async () => ok(true as const));
    abrir({ topico: { souAutor: true }, forum: { apagarTopico: apagar, listarTopicos: vi.fn(async () => ({ ok: true as const, valor: { itens: [], proximo: null } })) } });
    await esperarConversa();
    escolher(menuDoTopico(), 'Apagar');
    const d = await screen.findByRole('dialog', { name: 'Apagar este tópico?' });
    expect(within(d).getByText('Ele sai da comunidade e as respostas deixam de aparecer. Não dá pra desfazer.')).toBeDefined();
    expect(sondas.caminho).toBe(ROTA);
    fireEvent.click(within(d).getByRole('button', { name: 'Apagar tópico' }));
    await waitFor(() => expect(sondas.caminho).toBe('/c/reuniao-da-firma'));
    expect(apagar).toHaveBeenCalledWith(ID);
    expect(toastVisivel()).toBe('Tópico apagado.');
  });

  it('apagar com falha fica no tópico e mostra a frase', async () => {
    abrir({ topico: { souAutor: true }, forum: { apagarTopico: vi.fn(async () => falha('falhou')) } });
    await esperarConversa();
    escolher(menuDoTopico(), 'Apagar');
    fireEvent.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'Apagar tópico' }));
    expect(await screen.findByText('Não deu pra apagar. Tenta de novo.')).toBeDefined();
    expect(sondas.caminho).toBe(ROTA);
  });
});

describe('denunciar', () => {
  it('tópico: motivo opcional, sucesso fecha, devolve o foco ao menu e avisa sem prometer que o conteúdo some', async () => {
    const denunciar = vi.fn(async () => ok(true as const));
    abrir({ forum: { denunciarTopico: denunciar } });
    await esperarConversa();
    escolher(menuDoTopico(), 'Denunciar');
    const d = await screen.findByRole('dialog', { name: 'Denunciar tópico' });
    expect(within(d).getByLabelText('O que está errado? (opcional)')).toBeDefined();
    expect(within(d).queryByText(/some|escond|3 /i)).toBeNull();
    fireEvent.change(within(d).getByLabelText(/O que está errado/), { target: { value: '  spam  ' } });
    fireEvent.click(within(d).getByRole('button', { name: 'Denunciar' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(denunciar).toHaveBeenCalledWith(ID, 'spam');
    expect(toastVisivel()).toBe('Denúncia enviada. Valeu.');
    await waitFor(() => expect(document.activeElement).toBe(menuDoTopico()));
  });

  it('sem motivo também vale (o servidor põe o padrão)', async () => {
    const denunciar = vi.fn(async () => ok(true as const));
    abrir({ forum: { denunciarTopico: denunciar } });
    await esperarConversa();
    escolher(menuDoTopico(), 'Denunciar');
    fireEvent.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'Denunciar' }));
    await waitFor(() => expect(denunciar).toHaveBeenCalledWith(ID, ''));
  });

  it('resposta: manda o id da resposta', async () => {
    const denunciar = vi.fn(async () => ok(true as const));
    abrir({ respostas: [resposta({ id: 'r1' })], forum: { denunciarResposta: denunciar } });
    await screen.findByText('texto r1');
    escolher(screen.getByRole('button', { name: 'Ações da resposta de Bia Lima' }), 'Denunciar');
    const d = await screen.findByRole('dialog', { name: 'Denunciar resposta' });
    fireEvent.click(within(d).getByRole('button', { name: 'Denunciar' }));
    await waitFor(() => expect(denunciar).toHaveBeenCalledWith('r1', ''));
  });

  it('falha nunca diz "denunciado": frase honesta, dialog aberto, motivo intacto, e duplo toque chama uma vez', async () => {
    let soltar!: (r: ResultadoDaEscrita<true>) => void;
    const denunciar = vi.fn(() => new Promise<ResultadoDaEscrita<true>>((r) => (soltar = r)));
    abrir({ forum: { denunciarTopico: denunciar } });
    await esperarConversa();
    escolher(menuDoTopico(), 'Denunciar');
    const d = await screen.findByRole('dialog');
    fireEvent.change(within(d).getByLabelText(/O que está errado/), { target: { value: 'motivo' } });
    const form = d.querySelector('form')!;
    fireEvent.submit(form);
    fireEvent.submit(form);
    expect(denunciar).toHaveBeenCalledTimes(1);
    await act(async () => soltar(falha('semConfirmacao')));
    expect(await within(d).findByText('Não deu pra enviar a denúncia. Tenta de novo.')).toBeDefined();
    expect(screen.queryByText(/Denúncia enviada/)).toBeNull();
    expect((within(d).getByLabelText(/O que está errado/) as HTMLTextAreaElement).value).toBe('motivo');
  });

  it('motivo com mais de 500 caracteres (code points) é bloqueado na tela', async () => {
    const denunciar = vi.fn();
    abrir({ forum: { denunciarTopico: denunciar } });
    await esperarConversa();
    escolher(menuDoTopico(), 'Denunciar');
    const d = await screen.findByRole('dialog');
    fireEvent.change(within(d).getByLabelText(/O que está errado/), { target: { value: '💨'.repeat(501) } });
    fireEvent.submit(d.querySelector('form')!);
    expect((await within(d).findAllByText('Passou do limite em 1 caractere.')).length).toBeGreaterThan(0);
    expect(denunciar).not.toHaveBeenCalled();
  });

  it('sessão caída ao denunciar: frase da sessão com link Entrar', async () => {
    abrir({ forum: { denunciarTopico: vi.fn(async () => falha('precisaEntrar')) } });
    await esperarConversa();
    escolher(menuDoTopico(), 'Denunciar');
    const d = await screen.findByRole('dialog');
    fireEvent.submit(d.querySelector('form')!);
    expect(await within(d).findByRole('link', { name: 'Entrar' })).toBeDefined();
  });
});

describe('aside do desktop: a ação da pessoa na comunidade', () => {
  it('membro: "Você participa · Sair da comunidade"; Sair chama o servidor e vira Participar (contorno, sem verde extra)', async () => {
    const { porta } = abrir();
    await esperarConversa();
    const aside = await screen.findByRole('complementary', { name: 'Sobre a comunidade' });
    expect(await within(aside).findByText('Você participa')).toBeDefined();
    fireEvent.click(within(aside).getByRole('button', { name: 'Sair da comunidade' }));
    await waitFor(() => expect(porta.sairComunidade).toHaveBeenCalledWith('reuniao-da-firma'));
    expect(await within(aside).findByRole('button', { name: 'Participar' })).toBeDefined();
    expect(aside.querySelector('.forum-botao--acento')).toBeNull();
  });

  it('visitante não ganha ação no aside (o convite está no fim da conversa)', async () => {
    abrir({ conta: { temSessao: false, anonima: false } });
    await esperarConversa();
    const aside = await screen.findByRole('complementary', { name: 'Sobre a comunidade' });
    expect(within(aside).queryByRole('button')).toBeNull();
  });
});

describe('enviando, nada fecha (B2)', () => {
  it('composer inline: Cancelar desabilitado e Esc ignorado até a resposta chegar; depois da falha volta ao normal', async () => {
    let soltar!: (r: ResultadoDaEscrita<RespostaCriada>) => void;
    const responder = vi.fn(() => new Promise<ResultadoDaEscrita<RespostaCriada>>((r) => (soltar = r)));
    abrir({ respostas: [resposta({ id: 'r1' })], forum: { responderTopico: responder } });
    await screen.findByText('texto r1');
    fireEvent.click(screen.getByRole('button', { name: 'Responder a Bia Lima' }));
    digitar('oi', 'Sua resposta a Bia Lima');
    enviar('Sua resposta a Bia Lima');
    expect((screen.getByRole('button', { name: 'Cancelar' }) as HTMLButtonElement).disabled).toBe(true);
    fireEvent.keyDown(campo('Sua resposta a Bia Lima'), { key: 'Escape' });
    expect(screen.getByLabelText('Sua resposta a Bia Lima')).toBeDefined();
    await act(async () => soltar(falha('falhou')));
    await screen.findByText('Não deu para enviar. Seu texto continua aqui, tenta de novo.');
    expect((screen.getByRole('button', { name: 'Cancelar' }) as HTMLButtonElement).disabled).toBe(false);
    fireEvent.keyDown(campo('Sua resposta a Bia Lima'), { key: 'Escape' });
    expect(screen.queryByLabelText('Sua resposta a Bia Lima')).toBeNull();
  });

  it('edição inline: mesma regra', async () => {
    let soltar!: (r: ResultadoDaEscrita<{ id: string; corpo: string; editadoEm: string }>) => void;
    const editar = vi.fn(() => new Promise<ResultadoDaEscrita<{ id: string; corpo: string; editadoEm: string }>>((r) => (soltar = r)));
    abrir({ respostas: [resposta({ id: 'r1', souAutor: true, corpo: 'antigo' })], forum: { editarResposta: editar } });
    await screen.findByText('antigo');
    escolher(screen.getByRole('button', { name: 'Ações da resposta de Bia Lima' }), 'Editar');
    digitar('novo', 'Editar resposta');
    enviar('Editar resposta');
    expect((screen.getByRole('button', { name: 'Cancelar' }) as HTMLButtonElement).disabled).toBe(true);
    fireEvent.keyDown(campo('Editar resposta'), { key: 'Escape' });
    expect(screen.getByLabelText('Editar resposta')).toBeDefined();
    await act(async () => soltar(falha('falhou')));
    await waitFor(() => expect((screen.getByRole('button', { name: 'Cancelar' }) as HTMLButtonElement).disabled).toBe(false));
  });

  it('dialog de apagar: Cancelar desabilitado e Esc ignorado enquanto apaga', async () => {
    let soltar!: (r: ResultadoDaEscrita<true>) => void;
    const apagar = vi.fn(() => new Promise<ResultadoDaEscrita<true>>((r) => (soltar = r)));
    abrir({ respostas: [resposta({ id: 'r1', souAutor: true })], forum: { apagarResposta: apagar } });
    await screen.findByText('texto r1');
    escolher(screen.getByRole('button', { name: 'Ações da resposta de Bia Lima' }), 'Apagar');
    const d = await screen.findByRole('dialog');
    fireEvent.click(within(d).getByRole('button', { name: 'Apagar resposta' }));
    expect((within(d).getByRole('button', { name: 'Cancelar' }) as HTMLButtonElement).disabled).toBe(true);
    const cancel = new Event('cancel', { cancelable: true });
    fireEvent(d, cancel);
    expect(cancel.defaultPrevented).toBe(true);
    expect(screen.getByRole('dialog')).toBeDefined();
    await act(async () => soltar(falha('falhou')));
    expect(await within(d).findByText('Não deu pra apagar. Tenta de novo.')).toBeDefined();
    expect((within(d).getByRole('button', { name: 'Cancelar' }) as HTMLButtonElement).disabled).toBe(false);
  });

  it('dialog de denúncia e de edição do tópico: idem', async () => {
    let soltar!: (r: ResultadoDaEscrita<true>) => void;
    const denunciar = vi.fn(() => new Promise<ResultadoDaEscrita<true>>((r) => (soltar = r)));
    abrir({ forum: { denunciarTopico: denunciar } });
    await esperarConversa();
    escolher(menuDoTopico(), 'Denunciar');
    const d = await screen.findByRole('dialog');
    fireEvent.submit(d.querySelector('form')!);
    expect((within(d).getByRole('button', { name: 'Cancelar' }) as HTMLButtonElement).disabled).toBe(true);
    const cancel = new Event('cancel', { cancelable: true });
    fireEvent(d, cancel);
    expect(screen.getByRole('dialog')).toBeDefined();
    await act(async () => soltar(falha('falhou')));
    await within(d).findByText('Não deu pra enviar a denúncia. Tenta de novo.');
  });

  it('formulário de editar tópico: Cancelar desabilitado (celular e desktop) e Esc ignorado enquanto salva', async () => {
    let soltar!: (r: ResultadoDaEscrita<{ id: string; titulo: string; corpo: string; editadoEm: string }>) => void;
    const editar = vi.fn(() => new Promise<ResultadoDaEscrita<{ id: string; titulo: string; corpo: string; editadoEm: string }>>((r) => (soltar = r)));
    abrir({ topico: { souAutor: true }, forum: { editarTopico: editar } });
    await esperarConversa();
    escolher(menuDoTopico(), 'Editar');
    const d = await screen.findByRole('dialog', { name: 'Editar tópico' });
    fireEvent.change(within(d).getByLabelText('Título'), { target: { value: 'outro' } });
    fireEvent.submit(d.querySelector('form')!);
    for (const b of within(d).getAllByRole('button', { name: 'Cancelar' })) expect((b as HTMLButtonElement).disabled).toBe(true);
    const cancel = new Event('cancel', { cancelable: true });
    fireEvent(d, cancel);
    expect(screen.getByRole('dialog')).toBeDefined();
    await act(async () => soltar(falha('falhou')));
    await within(d).findByText('Não deu para enviar. Seu texto continua aqui, tenta de novo.');
  });
});

describe('duplo toque ao editar', () => {
  it('editar resposta: uma chamada só', async () => {
    let soltar!: (r: ResultadoDaEscrita<{ id: string; corpo: string; editadoEm: string }>) => void;
    const editar = vi.fn(() => new Promise<ResultadoDaEscrita<{ id: string; corpo: string; editadoEm: string }>>((r) => (soltar = r)));
    abrir({ respostas: [resposta({ id: 'r1', souAutor: true, corpo: 'antigo' })], forum: { editarResposta: editar } });
    await screen.findByText('antigo');
    escolher(screen.getByRole('button', { name: 'Ações da resposta de Bia Lima' }), 'Editar');
    digitar('novo', 'Editar resposta');
    const form = campo('Editar resposta').closest('form')!;
    fireEvent.submit(form);
    fireEvent.submit(form);
    fireEvent.click(screen.getByRole('button', { name: 'Enviando…' }));
    expect(editar).toHaveBeenCalledTimes(1);
    await act(async () => soltar(ok({ id: 'r1', corpo: 'novo', editadoEm: '2026-10-19T15:10:00Z' })));
  });

  it('editar tópico: uma chamada só', async () => {
    let soltar!: (r: ResultadoDaEscrita<{ id: string; titulo: string; corpo: string; editadoEm: string }>) => void;
    const editar = vi.fn(() => new Promise<ResultadoDaEscrita<{ id: string; titulo: string; corpo: string; editadoEm: string }>>((r) => (soltar = r)));
    abrir({ topico: { souAutor: true }, forum: { editarTopico: editar } });
    await esperarConversa();
    escolher(menuDoTopico(), 'Editar');
    const d = await screen.findByRole('dialog', { name: 'Editar tópico' });
    fireEvent.change(within(d).getByLabelText('Título'), { target: { value: 'novo título' } });
    const form = d.querySelector('form')!;
    fireEvent.submit(form);
    fireEvent.submit(form);
    expect(editar).toHaveBeenCalledTimes(1);
    await act(async () => soltar(ok({ id: ID, titulo: 'novo título', corpo: 'Saiu na hora do café.', editadoEm: '2026-10-19T15:10:00Z' })));
  });
});

describe('editar tópico migrado e topico_fechado na edição', () => {
  it('tópico sem mensagem: dá para editar só o título (o corpo não vai)', async () => {
    const editar = vi.fn(async () => ok({ id: ID, titulo: 'só título', corpo: '', editadoEm: '2026-10-19T15:10:00Z' }));
    abrir({ topico: { souAutor: true, corpo: '' }, forum: { editarTopico: editar } });
    await esperarConversa();
    escolher(menuDoTopico(), 'Editar');
    const d = await screen.findByRole('dialog', { name: 'Editar tópico' });
    fireEvent.change(within(d).getByLabelText('Título'), { target: { value: 'só título' } });
    fireEvent.submit(d.querySelector('form')!);
    await waitFor(() => expect(editar).toHaveBeenCalledWith({ topicoId: ID, titulo: 'só título' }));
    expect(within(d).queryByText('Falta a mensagem.')).toBeNull();
  });

  it('topico_fechado ao editar: frase de edição (não "respostas") e o tópico é relido', async () => {
    const { forum } = abrir({ topico: { souAutor: true }, forum: { editarTopico: vi.fn(async () => falha('topicoFechado')) } });
    await esperarConversa();
    escolher(menuDoTopico(), 'Editar');
    const d = await screen.findByRole('dialog', { name: 'Editar tópico' });
    fireEvent.change(within(d).getByLabelText('Título'), { target: { value: 'x' } });
    const antes = (forum.obterTopico as ReturnType<typeof vi.fn>).mock.calls.length;
    fireEvent.submit(d.querySelector('form')!);
    expect(await within(d).findByText('Esse tópico foi fechado. Não dá mais pra editar.')).toBeDefined();
    expect(within(d).queryByText(/aceita mais respostas/)).toBeNull();
    await waitFor(() => expect((forum.obterTopico as ReturnType<typeof vi.fn>).mock.calls.length).toBeGreaterThan(antes));
  });
});

describe('conferir diz o que achou (R1)', () => {
  it('resposta igual do próprio autor já na conversa: "Sua resposta já está na conversa.", só Descartar (sem Enviar)', async () => {
    const responder = vi.fn(async () => falha('semConfirmacao'));
    const { estado } = abrir({ forum: { responderTopico: responder } });
    await esperarConversa();
    digitar('chegou lá');
    enviar();
    await screen.findByText(/Não deu pra confirmar o envio/);
    estado.respostas = [resposta({ id: 'r9', corpo: 'chegou lá', souAutor: true })];
    fireEvent.click(screen.getByRole('button', { name: 'Conferir a conversa' }));
    expect(await screen.findByText('Sua resposta já está na conversa.')).toBeDefined();
    expect(screen.queryByRole('button', { name: 'Enviar' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Conferir a conversa' })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Descartar texto' }));
    expect(campo().value).toBe('');
    expect(responder).toHaveBeenCalledTimes(1);
  });

  it('não achou: status "Conversa atualizada. Se sua resposta já está aí, descarta o texto." e o Enviar continua', async () => {
    abrir({ forum: { responderTopico: vi.fn(async () => falha('semConfirmacao')) } });
    await esperarConversa();
    digitar('talvez');
    enviar();
    await screen.findByText(/Não deu pra confirmar o envio/);
    fireEvent.click(screen.getByRole('button', { name: 'Conferir a conversa' }));
    const msg = await screen.findByText('Conversa atualizada. Se sua resposta já está aí, descarta o texto.');
    expect(msg.getAttribute('role')).toBe('status');
    expect(screen.getByRole('button', { name: 'Enviar' })).toBeDefined();
  });

  it('resposta de OUTRA pessoa com o mesmo texto não conta como a minha', async () => {
    const { estado } = abrir({ forum: { responderTopico: vi.fn(async () => falha('semConfirmacao')) } });
    await esperarConversa();
    digitar('igual');
    enviar();
    await screen.findByText(/Não deu pra confirmar o envio/);
    estado.respostas = [resposta({ id: 'r9', corpo: 'igual', souAutor: false })];
    fireEvent.click(screen.getByRole('button', { name: 'Conferir a conversa' }));
    await screen.findByText('Conversa atualizada. Se sua resposta já está aí, descarta o texto.');
    expect(screen.queryByText('Sua resposta já está na conversa.')).toBeNull();
  });
});

describe('topico_fechado ao enviar (R2): diz por quê, uma vez', () => {
  it('mostra e anuncia "Esse tópico foi fechado. Não aceita mais respostas." quando o tópico relido está fechado', async () => {
    const { estado } = abrir({ forum: { responderTopico: vi.fn(async () => falha('topicoFechado')) } });
    await esperarConversa();
    digitar('tarde');
    estado.topico = { ...estado.topico, status: 'fechado' };
    enviar();
    await waitFor(() => expect(screen.queryByLabelText('Sua resposta')).toBeNull());
    expect(document.querySelectorAll('.forum-faixa-fechado.forum-compositor-area').length).toBe(1);
    expect(screen.getAllByText('Esse tópico foi fechado. Não aceita mais respostas.').length).toBeGreaterThan(0);
    expect(statusDaCasca()).toBe('Esse tópico foi fechado. Não aceita mais respostas.');
  });
});

describe('detalhes do composer (R3, R4, R5)', () => {
  it('R3: o menu e o "Responder" somem enquanto a resposta está em edição e voltam ao cancelar', async () => {
    abrir({ respostas: [resposta({ id: 'r1', souAutor: true, corpo: 'antigo' })] });
    await screen.findByText('antigo');
    escolher(screen.getByRole('button', { name: 'Ações da resposta de Bia Lima' }), 'Editar');
    expect(screen.queryByRole('button', { name: 'Ações da resposta de Bia Lima' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Responder a Bia Lima' })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(screen.getByRole('button', { name: 'Ações da resposta de Bia Lima' })).toBeDefined();
  });

  it('R4: o rótulo do composer é só para leitor de tela (sem rótulo visível), o placeholder fica', async () => {
    abrir({ respostas: [resposta({ id: 'r1' })] });
    await screen.findByText('texto r1');
    expect(campo().labels![0].className).toBe('forum-sr');
    fireEvent.click(screen.getByRole('button', { name: 'Responder a Bia Lima' }));
    expect(campo('Sua resposta a Bia Lima').labels![0].className).toBe('forum-sr');
    expect(campo().placeholder).toBe('Escreve sua resposta');
  });

  it('R5: o alerta de envio fica entre o campo e o contador (não empurra o campo para baixo)', async () => {
    abrir({ forum: { responderTopico: vi.fn(async () => falha('falhou')) } });
    await esperarConversa();
    digitar('oi');
    enviar();
    const alerta = (await screen.findByText('Não deu para enviar. Seu texto continua aqui, tenta de novo.')).closest('[role="alert"]')!;
    const caixa = campo();
    const contador = document.getElementById(caixa.id + '-contador')!;
    expect(caixa.compareDocumentPosition(alerta) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(alerta.compareDocumentPosition(contador) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});

describe('rascunho de resposta é de uma conta só (B1)', () => {
  it('o rascunho do disco aparece mesmo com o papel chegando depois da conversa (recarregar a página)', async () => {
    const armazenamento = armazenamentoFalso();
    armazenamento.gravar(chaveDoRascunhoDeResposta('conta-a', ID, null), JSON.stringify({ corpo: 'do disco' }));
    abrir({ armazenamento });
    await esperarConversa();
    await waitFor(() => expect(campo().value).toBe('do disco'));
  });

  it('a conta B não vê o rascunho da A no mesmo navegador', async () => {
    const armazenamento = armazenamentoFalso();
    armazenamento.gravar(chaveDoRascunhoDeResposta('conta-a', ID, null), JSON.stringify({ corpo: 'segredo da A' }));
    abrir({ armazenamento, conta: { ...CONTA, id: 'conta-b' } });
    await esperarConversa();
    expect(campo().value).toBe('');
    digitar('da B');
    expect(armazenamento.dados.has(chaveDoRascunhoDeResposta('conta-b', ID, null))).toBe(true);
    expect(JSON.parse(armazenamento.dados.get(chaveDoRascunhoDeResposta('conta-a', ID, null))!).corpo).toBe('segredo da A');
  });
});

describe('R6: os botões do composer não tiram o foco do campo', () => {
  it('mousedown em Enviar e Cancelar é cancelado (o campo não perde o foco, a barra não volta antes do clique)', async () => {
    abrir({ respostas: [resposta({ id: 'r1' })] });
    await screen.findByText('texto r1');
    fireEvent.click(screen.getByRole('button', { name: 'Responder a Bia Lima' }));
    await screen.findByLabelText('Sua resposta a Bia Lima');
    for (const nome of ['Enviar', 'Cancelar']) {
      const botoes = screen.getAllByRole('button', { name: nome });
      const botao = botoes[0];
      const ev = new MouseEvent('mousedown', { bubbles: true, cancelable: true });
      botao.dispatchEvent(ev);
      expect(ev.defaultPrevented).toBe(true);
    }
  });
});

describe('R7: faixa de tópico fechado dentro da área do composer', () => {
  it('é uma só faixa de aviso por estado: a da área do composer ganha a classe com padding próprio', async () => {
    const { estado } = abrir({ forum: { responderTopico: vi.fn(async () => falha('topicoFechado')) } });
    await esperarConversa();
    digitar('tarde');
    estado.topico = { ...estado.topico, status: 'fechado' };
    enviar();
    await waitFor(() => expect(document.querySelector('.forum-faixa-fechado.forum-compositor-area')).not.toBeNull());
  });
});
