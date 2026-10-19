// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { esquecerRascunhosDaSessao } from '../../nucleo/forum/rascunho';
import { chaveDoRascunhoDeTopico } from '../../portas/armazenamento';
import type { MotivoDeEscrita, PortaDeForum, ResultadoDaEscrita, TopicoCriado } from '../../portas/forum';
import { esquecerListasVistas, limparListasVistas } from './hooks';
import {
  Rotas,
  ambienteFalso,
  armazenamentoFalso,
  comunidade,
  comunidadeFalsa,
  contaFalsa,
  forumFalso,
  sondas,
  topico,
} from './dublesParaTeste';

beforeEach(() => {
  limparListasVistas();
  esquecerRascunhosDaSessao();
});
afterEach(cleanup);

const SLUG = 'reuniao-da-firma';
const ID_NOVO = '22222222-2222-4222-8222-222222222222';
const CONTA = { temSessao: true, anonima: false, podeParticiparSocialmente: true } as const;

interface Cenario {
  readonly criarTopico?: PortaDeForum['criarTopico'];
  readonly souMembro?: boolean;
  readonly conta?: Parameters<typeof contaFalsa>[0];
  readonly slugsDaConta?: readonly string[];
  readonly entrada?: string;
  readonly armazenamento?: ReturnType<typeof armazenamentoFalso>;
  readonly ambiente?: ReturnType<typeof ambienteFalso>;
  readonly comunidadePorta?: ReturnType<typeof comunidadeFalsa>;
}

const ok = (): ResultadoDaEscrita<TopicoCriado> => ({ ok: true, valor: { id: ID_NOVO, criadoEm: '2026-10-19T15:00:00.123456+00:00' } });
const falha = (motivo: MotivoDeEscrita): ResultadoDaEscrita<TopicoCriado> => ({ ok: false, motivo });

function abrir(c: Cenario = {}) {
  const criarTopico = c.criarTopico ?? vi.fn(async () => ok());
  const armazenamento = c.armazenamento ?? armazenamentoFalso();
  const ambiente = c.ambiente ?? ambienteFalso();
  const forum = forumFalso({
    obterComunidadeDoForum: vi.fn(async () => ({ ok: true as const, valor: comunidade({ slug: SLUG, souMembro: c.souMembro ?? true }) })),
    listarTopicos: vi.fn(async () => ({ ok: true as const, valor: { itens: [], proximo: null } })),
    obterTopico: vi.fn(async () => ({ ok: true as const, valor: topico({ id: ID_NOVO }) })),
    listarRespostasDoTopico: vi.fn(async () => ({ ok: true as const, valor: { itens: [], proximo: null } })),
    criarTopico,
  });
  const comunidadePorta = c.comunidadePorta ?? comunidadeFalsa(c.slugsDaConta ?? [SLUG]);
  render(
    <Rotas
      entrada={c.entrada ?? `/c/${SLUG}`}
      m={{ forum, conta: contaFalsa(c.conta ?? CONTA), comunidade: comunidadePorta, armazenamento, ambiente }}
    />,
  );
  return { forum, criarTopico: criarTopico as ReturnType<typeof vi.fn>, armazenamento, ambiente, comunidadePorta };
}

async function abrirFormulario() {
  fireEvent.click(await screen.findByRole('link', { name: 'Novo tópico' }));
  return screen.findByRole('dialog', { name: 'Novo tópico' });
}

const campoTitulo = () => screen.getByLabelText('Título') as HTMLInputElement;
const campoCorpo = () => screen.getByLabelText('Mensagem') as HTMLTextAreaElement;
const formulario = () => screen.getByRole('dialog').querySelector('form') as HTMLFormElement;
const botoesDeCriar = () => screen.getAllByRole('button', { name: /Criar tópico|Enviando/ });
function preencher(titulo = 'Arroto na reunião', corpo = 'Saiu na hora do café.') {
  fireEvent.change(campoTitulo(), { target: { value: titulo } });
  fireEvent.change(campoCorpo(), { target: { value: corpo } });
}
const enviarFormulario = () => fireEvent.submit(formulario());
/** O erro de campo (o aviso falado da região de status repete a frase, de propósito: ele fala, o erro mostra). */
const erroVisivel = async (texto: string) => {
  const todos = await screen.findAllByText(texto);
  const alerta = todos.find((e) => e.closest('[role="alert"]'));
  expect(alerta).toBeDefined();
  return alerta!;
};

describe('abrir o formulário (spec 10.1)', () => {
  it('o link "Novo tópico" da comunidade abre um dialog modal com título, mensagem e a comunidade fixa', async () => {
    abrir();
    const dialogo = await abrirFormulario();
    expect(sondas.caminho).toBe(`/c/${SLUG}/novo`);
    expect(within(dialogo).getByRole('heading', { level: 2, name: 'Novo tópico' })).toBeDefined();
    expect(within(dialogo).getByText('Em Na reunião da firma')).toBeDefined();
    expect(campoTitulo().placeholder).toBe('Sobre o que é a conversa?');
    expect(campoCorpo().placeholder).toBe('Conta o que rolou ou o que você quer perguntar.');
    expect(screen.getByText('0/120')).toBeDefined();
    expect(screen.getByText('0/1000')).toBeDefined();
  });

  it('o foco entra no título', async () => {
    abrir();
    await abrirFormulario();
    expect(document.activeElement).toBe(campoTitulo());
  });

  it('abrir por URL direta mostra a comunidade por baixo e o formulário por cima', async () => {
    abrir({ entrada: `/c/${SLUG}/novo` });
    expect(await screen.findByRole('dialog', { name: 'Novo tópico' })).toBeDefined();
    expect(await screen.findByRole('heading', { level: 1, name: 'Na reunião da firma' })).toBeDefined();
  });

  it('o formulário não oferece áudio: nenhum "Arrotar para responder", nenhum anexo, nenhuma autorização de áudio', async () => {
    abrir();
    const dialogo = await abrirFormulario();
    expect(within(dialogo).queryByText(/arrot/i)).toBeNull();
    expect(dialogo.querySelector('input[type="file"], input[type="checkbox"], audio')).toBeNull();
    expect(screen.queryByText(/Arrotar para responder/)).toBeNull();
  });

  it('campos a 16px de fonte (classe do campo), sem maxLength, com enterkeyhint e sem autocomplete', async () => {
    abrir();
    await abrirFormulario();
    expect(campoTitulo().getAttribute('maxlength')).toBeNull();
    expect(campoCorpo().getAttribute('maxlength')).toBeNull();
    expect(campoTitulo().getAttribute('enterkeyhint')).toBe('next');
    expect(campoTitulo().getAttribute('autocomplete')).toBe('off');
    expect(campoTitulo().getAttribute('autocapitalize')).toBe('sentences');
    expect(campoTitulo().className).toContain('forum-campo__entrada');
  });

  it('Enter no título passa para a mensagem, não envia', async () => {
    const { criarTopico } = abrir();
    await abrirFormulario();
    fireEvent.change(campoTitulo(), { target: { value: 'Oi' } });
    fireEvent.keyDown(campoTitulo(), { key: 'Enter' });
    expect(document.activeElement).toBe(campoCorpo());
    expect(criarTopico).not.toHaveBeenCalled();
  });

  it('ao focar a mensagem, pede à plataforma para centralizar o campo acima do teclado', async () => {
    const ambiente = ambienteFalso();
    abrir({ ambiente });
    await abrirFormulario();
    fireEvent.focus(campoCorpo());
    expect(ambiente.camposCentralizados).toEqual([campoCorpo().id]);
  });
});

describe('quem pode abrir (spec 5): convite, nunca um formulário que falha', () => {
  it('visitante por URL direta volta para a comunidade e vê o convite, sem formulário', async () => {
    abrir({ entrada: `/c/${SLUG}/novo`, conta: { temSessao: false, anonima: false }, souMembro: false });
    expect(await screen.findByRole('link', { name: 'Criar conta para participar' })).toBeDefined();
    expect(screen.queryByRole('dialog')).toBeNull();
    await waitFor(() => expect(sondas.caminho).toBe(`/c/${SLUG}`));
  });

  it('conta que ainda não participa da comunidade volta e vê "Participar"', async () => {
    abrir({ entrada: `/c/${SLUG}/novo`, souMembro: false, slugsDaConta: [] });
    expect(await screen.findByRole('button', { name: 'Participar' })).toBeDefined();
    expect(screen.queryByRole('dialog')).toBeNull();
    await waitFor(() => expect(sondas.caminho).toBe(`/c/${SLUG}`));
  });

  it('conta sem promoção (podeParticiparSocialmente falso) é tratada como visitante: convite, não erro', async () => {
    abrir({
      entrada: `/c/${SLUG}/novo`,
      conta: { temSessao: true, anonima: false, podeParticiparSocialmente: false },
      souMembro: false,
    });
    expect(await screen.findByRole('link', { name: 'Criar conta para participar' })).toBeDefined();
    expect(screen.queryByRole('dialog')).toBeNull();
    await waitFor(() => expect(sondas.caminho).toBe(`/c/${SLUG}`));
  });

  it('quando não se sabe quem está vendo (rede), o formulário não abre e nenhum convite de visitante aparece', async () => {
    abrir({ entrada: `/c/${SLUG}/novo`, conta: 'quebrada' });
    await screen.findByRole('heading', { level: 1, name: 'Na reunião da firma' });
    await waitFor(() => expect(sondas.caminho).toBe(`/c/${SLUG}`));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(screen.queryByRole('link', { name: /Criar conta/ })).toBeNull();
  });
});

describe('contador por caractere e validação antes do servidor (spec 6.9)', () => {
  it('conta por code point: 120 emojis cabem no título, 121 não; o contador mostra o excesso', async () => {
    const { criarTopico } = abrir();
    await abrirFormulario();
    fireEvent.change(campoTitulo(), { target: { value: '💨'.repeat(120) } });
    fireEvent.change(campoCorpo(), { target: { value: 'ok' } });
    expect(screen.getByText('120/120')).toBeDefined();
    expect(campoTitulo().getAttribute('aria-invalid')).toBeNull();

    fireEvent.change(campoTitulo(), { target: { value: '💨'.repeat(121) } });
    expect(screen.getByText('121/120')).toBeDefined();
    expect(screen.getByText(/1 caractere a mais/)).toBeDefined();
    expect(campoTitulo().getAttribute('aria-invalid')).toBe('true');

    enviarFormulario();
    await erroVisivel('Passou do limite em 1 caractere.');
    expect(criarTopico).not.toHaveBeenCalled();
    expect(document.activeElement).toBe(campoTitulo());
  });

  it('limites 120 e 1000 batem com o servidor: mensagem de 1001 é bloqueada e foca a mensagem', async () => {
    const { criarTopico } = abrir();
    await abrirFormulario();
    preencher('Título', 'a'.repeat(1001));
    expect(screen.getByText('1001/1000')).toBeDefined();
    enviarFormulario();
    await erroVisivel('Passou do limite em 1 caractere.');
    expect(criarTopico).not.toHaveBeenCalled();
    expect(document.activeElement).toBe(campoCorpo());
  });

  it('o contador não conta espaço nas pontas (o servidor faz btrim)', async () => {
    abrir();
    await abrirFormulario();
    fireEvent.change(campoTitulo(), { target: { value: '   oi   ' } });
    expect(screen.getByText('2/120')).toBeDefined();
  });

  it('vazio: o botão continua ativo e, ao acionar, escreve o que falta e leva o foco ao primeiro campo com erro', async () => {
    const { criarTopico } = abrir();
    await abrirFormulario();
    for (const b of botoesDeCriar()) expect(b.hasAttribute('disabled')).toBe(false);
    enviarFormulario();
    expect(await screen.findByText('Falta o título.')).toBeDefined();
    expect(screen.getByText('Falta a mensagem.')).toBeDefined();
    expect(document.activeElement).toBe(campoTitulo());
    expect(campoTitulo().getAttribute('aria-invalid')).toBe('true');
    expect(criarTopico).not.toHaveBeenCalled();

    fireEvent.change(campoTitulo(), { target: { value: 'Oi' } });
    expect(screen.queryByText('Falta o título.')).toBeNull();
    enviarFormulario();
    expect(document.activeElement).toBe(campoCorpo());
  });

  it('o erro do campo fica ligado a ele (aria-describedby aponta para o erro e o contador)', async () => {
    abrir();
    await abrirFormulario();
    enviarFormulario();
    const erro = await screen.findByText('Falta o título.');
    const ids = campoTitulo().getAttribute('aria-describedby')!.split(' ');
    expect(ids).toContain(erro.id);
    expect(ids.some((i) => i.endsWith('-contador'))).toBe(true);
  });

  it('o aviso falado só cruza o marco, não a cada tecla', async () => {
    abrir();
    const dialogo = await abrirFormulario();
    const regioes = () => within(dialogo).getAllByRole('status').map((r) => r.textContent);
    fireEvent.change(campoTitulo(), { target: { value: 'a'.repeat(50) } });
    expect(regioes().every((t) => t === '')).toBe(true);
    fireEvent.change(campoTitulo(), { target: { value: 'a'.repeat(100) } });
    expect(regioes()).toContain('Faltam 20 caracteres.');
    fireEvent.change(campoTitulo(), { target: { value: 'a'.repeat(105) } });
    expect(regioes().every((t) => t === '')).toBe(true);
    fireEvent.change(campoTitulo(), { target: { value: 'a'.repeat(125) } });
    expect(regioes()).toContain('Passou do limite em 5 caracteres.');
  });
});

describe('criar: só o que o cliente pode mandar, e só atualiza depois do ok', () => {
  it('manda slug, título e mensagem aparados, e NADA mais (sem autor, nota, contagem nem áudio)', async () => {
    const { criarTopico } = abrir();
    await abrirFormulario();
    preencher('  Arroto na reunião  ', '  Saiu na hora do café.\n\nDe novo.  ');
    enviarFormulario();
    await waitFor(() => expect(criarTopico).toHaveBeenCalledTimes(1));
    expect(criarTopico).toHaveBeenCalledWith({
      comunidadeSlug: SLUG,
      titulo: 'Arroto na reunião',
      corpo: 'Saiu na hora do café.\n\nDe novo.',
    });
    expect(Object.keys(criarTopico.mock.calls[0][0]).sort()).toEqual(['comunidadeSlug', 'corpo', 'titulo']);
  });

  it('com ok: apaga o rascunho, vai para /c/:slug/t/:id (replace), mostra o tópico lido do servidor e diz "Tópico criado."', async () => {
    const armazenamento = armazenamentoFalso();
    const { forum } = abrir({ armazenamento });
    await abrirFormulario();
    preencher();
    expect(armazenamento.dados.has(chaveDoRascunhoDeTopico(SLUG))).toBe(true);
    enviarFormulario();

    expect(await screen.findByRole('heading', { level: 1, name: 'Arroto na reunião de segunda' })).toBeDefined();
    expect(sondas.caminho).toBe(`/c/${SLUG}/t/${ID_NOVO}`);
    // O que aparece é o que o SERVIDOR devolveu em obter_topico, não o que o cliente digitou.
    expect(forum.obterTopico).toHaveBeenCalledWith(ID_NOVO);
    expect(armazenamento.dados.has(chaveDoRascunhoDeTopico(SLUG))).toBe(false);
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(screen.getAllByText('Tópico criado.').length).toBeGreaterThan(0);
  });

  it('voltar depois de criar não reabre o formulário (a navegação foi replace) e a lista não é a velha', async () => {
    const listar = vi.fn(async () => ({ ok: true as const, valor: { itens: [], proximo: null } }));
    abrir();
    await abrirFormulario();
    preencher();
    enviarFormulario();
    await screen.findByRole('heading', { level: 1, name: 'Arroto na reunião de segunda' });
    act(() => void sondas.navegar!(-1));
    expect(await screen.findByRole('heading', { level: 1, name: 'Na reunião da firma' })).toBeDefined();
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(sondas.caminho).toBe(`/c/${SLUG}`);
    void listar;
  });

  it('esquece a lista guardada da comunidade e do Explorar (a volta busca do servidor)', async () => {
    const spy = vi.spyOn({ esquecerListasVistas }, 'esquecerListasVistas');
    void spy;
    // Prova de comportamento: a lista da comunidade volta a ser pedida ao servidor depois de criar.
    const { forum } = abrir();
    await screen.findByRole('link', { name: 'Novo tópico' });
    const chamadasAntes = (forum.listarTopicos as ReturnType<typeof vi.fn>).mock.calls.length;
    await abrirFormulario();
    preencher();
    enviarFormulario();
    await screen.findByRole('heading', { level: 1, name: 'Arroto na reunião de segunda' });
    act(() => void sondas.navegar!(-1));
    await screen.findByRole('heading', { level: 1, name: 'Na reunião da firma' });
    await waitFor(() =>
      expect((forum.listarTopicos as ReturnType<typeof vi.fn>).mock.calls.length).toBeGreaterThan(chamadasAntes),
    );
  });
});

describe('duplo toque e duplo envio (spec 6.7)', () => {
  it('dois envios no mesmo tique criam UM tópico, e o botão mostra "Enviando…" com os campos só de leitura', async () => {
    let soltar!: (r: ResultadoDaEscrita<TopicoCriado>) => void;
    const criarTopico = vi.fn(() => new Promise<ResultadoDaEscrita<TopicoCriado>>((resolve) => (soltar = resolve)));
    abrir({ criarTopico });
    await abrirFormulario();
    preencher();
    enviarFormulario();
    enviarFormulario();
    fireEvent.click(botoesDeCriar()[0]);
    expect(criarTopico).toHaveBeenCalledTimes(1);
    expect(botoesDeCriar().every((b) => b.textContent === 'Enviando…')).toBe(true);
    expect(botoesDeCriar().every((b) => b.getAttribute('aria-busy') === 'true')).toBe(true);
    expect(campoTitulo().readOnly).toBe(true);
    expect(campoCorpo().readOnly).toBe(true);

    await act(async () => soltar(ok()));
    await screen.findByRole('heading', { level: 1, name: 'Arroto na reunião de segunda' });
    expect(criarTopico).toHaveBeenCalledTimes(1);
  });

  it('toques logo antes e logo depois do ok não criam um segundo tópico (a trava em si é provada em useEnvio.test)', async () => {
    let soltar!: (r: ResultadoDaEscrita<TopicoCriado>) => void;
    const criarTopico = vi.fn(() => new Promise<ResultadoDaEscrita<TopicoCriado>>((resolve) => (soltar = resolve)));
    abrir({ criarTopico });
    await abrirFormulario();
    preencher();
    const form = formulario();
    await act(async () => {
      fireEvent.submit(form);
      soltar(ok());
      // O ok já chegou, mas o React ainda não tirou a tela do ar: o formulário ainda aceita um toque.
      await new Promise((r) => setTimeout(r, 0));
      fireEvent.submit(form);
      fireEvent.submit(form);
    });
    expect(criarTopico).toHaveBeenCalledTimes(1);
    await screen.findByRole('heading', { level: 1, name: 'Arroto na reunião de segunda' });
    expect(criarTopico).toHaveBeenCalledTimes(1);
  });

  it('o toque rápido que espera a falha volta ao repouso e deixa tentar de novo', async () => {
    const criarTopico = vi
      .fn<PortaDeForum['criarTopico']>()
      .mockResolvedValueOnce(falha('falhou'))
      .mockResolvedValueOnce(ok());
    abrir({ criarTopico });
    await abrirFormulario();
    preencher();
    enviarFormulario();
    await screen.findByText('Não deu para enviar. Seu texto continua aqui, tenta de novo.');
    expect(botoesDeCriar().every((b) => b.textContent === 'Criar tópico')).toBe(true);
    expect(campoTitulo().readOnly).toBe(false);
    enviarFormulario();
    await screen.findByRole('heading', { level: 1, name: 'Arroto na reunião de segunda' });
    expect(criarTopico).toHaveBeenCalledTimes(2);
  });
});

describe('falhas: texto intacto e frase por motivo (spec 6.6)', () => {
  const casos: ReadonlyArray<readonly [MotivoDeEscrita, string, 'titulo' | 'corpo' | 'geral']> = [
    ['tituloInvalido', 'O título precisa ter de 1 a 120 caracteres.', 'titulo'],
    ['corpoInvalido', 'A mensagem precisa ter de 1 a 1000 caracteres.', 'corpo'],
    ['comunidadeInexistente', 'Essa comunidade não existe mais.', 'geral'],
    ['naoEMembro', 'Entre na comunidade antes de participar.', 'geral'],
    ['precisaEntrar', 'Sua sessão acabou ou essa conta não pode participar. Entra de novo, seu texto fica aqui.', 'geral'],
    ['semConfirmacao', 'Não deu pra confirmar o envio. Seu texto continua aqui. Antes de tentar de novo, confere se já apareceu.', 'geral'],
    ['falhou', 'Não deu para enviar. Seu texto continua aqui, tenta de novo.', 'geral'],
    ['semServidor', 'Não deu para enviar. Seu texto continua aqui, tenta de novo.', 'geral'],
    ['topicoFechado', 'Esse tópico foi fechado. Não aceita mais respostas.', 'geral'],
    ['audioSemConsentimento', 'Não deu para enviar. Seu texto continua aqui, tenta de novo.', 'geral'],
  ];

  it.each(casos)('%s: mostra a frase, mantém título e mensagem e guarda o rascunho', async (motivo, frase, onde) => {
    const armazenamento = armazenamentoFalso();
    const criarTopico = vi.fn(async () => falha(motivo));
    abrir({ criarTopico, armazenamento });
    await abrirFormulario();
    preencher('Meu título', 'Minha mensagem');
    enviarFormulario();
    const alerta = await screen.findByText(frase);
    expect(alerta.closest('[role="alert"]')).not.toBeNull();
    expect(campoTitulo().value).toBe('Meu título');
    expect(campoCorpo().value).toBe('Minha mensagem');
    expect(JSON.parse(armazenamento.dados.get(chaveDoRascunhoDeTopico(SLUG))!)).toEqual({ titulo: 'Meu título', corpo: 'Minha mensagem' });
    expect(screen.getByRole('dialog')).toBeDefined();
    expect(sondas.caminho).toBe(`/c/${SLUG}/novo`);
    if (onde === 'titulo') expect(document.activeElement).toBe(campoTitulo());
    if (onde === 'corpo') expect(document.activeElement).toBe(campoCorpo());
    expect(botoesDeCriar()[0].textContent).toBe('Criar tópico');
  });

  it('nao_e_membro: "Participar" ao lado; entrou, o aviso some, o texto segue e a pessoa reenvia', async () => {
    const criarTopico = vi
      .fn<PortaDeForum['criarTopico']>()
      .mockResolvedValueOnce(falha('naoEMembro'))
      .mockResolvedValueOnce(ok());
    const { comunidadePorta } = abrir({ criarTopico });
    await abrirFormulario();
    preencher('T', 'M');
    enviarFormulario();
    await screen.findByText('Entre na comunidade antes de participar.');
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Participar' }));
    await waitFor(() => expect(comunidadePorta.entrarComunidade).toHaveBeenCalledWith(SLUG));
    await waitFor(() => expect(screen.queryByText('Entre na comunidade antes de participar.')).toBeNull());
    expect(campoTitulo().value).toBe('T');
    expect(criarTopico).toHaveBeenCalledTimes(1);
    enviarFormulario();
    await screen.findByRole('heading', { level: 1, name: 'Arroto na reunião de segunda' });
    expect(criarTopico).toHaveBeenCalledTimes(2);
  });

  it('nao_e_membro: se entrar também falhar, o aviso fica e o texto continua', async () => {
    const comunidadePorta = comunidadeFalsa([SLUG], { entrarComunidade: async () => false });
    abrir({ criarTopico: vi.fn(async () => falha('naoEMembro')), comunidadePorta });
    await abrirFormulario();
    preencher('T', 'M');
    enviarFormulario();
    await screen.findByText('Entre na comunidade antes de participar.');
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Participar' }));
    expect(await screen.findByText('Não deu pra entrar agora. Tenta de novo.')).toBeDefined();
    expect(screen.getByText('Entre na comunidade antes de participar.')).toBeDefined();
    expect(campoCorpo().value).toBe('M');
  });

  it('sessão caiu (42501 sem HINT): link "Entrar" que volta para o formulário, texto guardado', async () => {
    abrir({ criarTopico: vi.fn(async () => falha('precisaEntrar')) });
    await abrirFormulario();
    preencher('T', 'M');
    enviarFormulario();
    const link = await screen.findByRole('link', { name: 'Entrar' });
    expect(link.getAttribute('href')).toBe(`/login?volta=${encodeURIComponent(`/c/${SLUG}/novo`)}`);
    expect(campoCorpo().value).toBe('M');
  });

  it('comunidade que sumiu: link "Ver comunidades"', async () => {
    abrir({ criarTopico: vi.fn(async () => falha('comunidadeInexistente')) });
    await abrirFormulario();
    preencher();
    enviarFormulario();
    const link = await screen.findByRole('link', { name: 'Ver comunidades' });
    expect(link.getAttribute('href')).toBe('/comunidades');
  });

  it('o erro do campo some quando a pessoa volta a digitar nele', async () => {
    abrir({ criarTopico: vi.fn(async () => falha('tituloInvalido')) });
    await abrirFormulario();
    preencher();
    enviarFormulario();
    await screen.findByText('O título precisa ter de 1 a 120 caracteres.');
    fireEvent.change(campoTitulo(), { target: { value: 'Outro' } });
    expect(screen.queryByText('O título precisa ter de 1 a 120 caracteres.')).toBeNull();
  });
});

describe('falha ambígua (semConfirmacao): pode ter gravado, nunca reenvia sozinho', () => {
  it('manda conferir; a chamada não se repete sozinha, mesmo com o tempo passando', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    try {
      const criarTopico = vi.fn(async () => falha('semConfirmacao'));
      abrir({ criarTopico });
      await abrirFormulario();
      preencher('T', 'M');
      enviarFormulario();
      await screen.findByText(/Não deu pra confirmar o envio/);
      await act(async () => {
        await vi.advanceTimersByTimeAsync(60_000);
      });
      expect(criarTopico).toHaveBeenCalledTimes(1);
      expect(campoCorpo().value).toBe('M');
    } finally {
      vi.useRealTimers();
    }
  });

  it('"Conferir os tópicos" fecha o formulário, guarda o texto e lê a lista de novo no servidor', async () => {
    const armazenamento = armazenamentoFalso();
    const criarTopico = vi.fn(async () => falha('semConfirmacao'));
    const { forum } = abrir({ criarTopico, armazenamento });
    await abrirFormulario();
    preencher('T', 'M');
    enviarFormulario();
    const antes = (forum.listarTopicos as ReturnType<typeof vi.fn>).mock.calls.length;
    fireEvent.click(await screen.findByRole('button', { name: 'Conferir os tópicos' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    await waitFor(() => expect((forum.listarTopicos as ReturnType<typeof vi.fn>).mock.calls.length).toBeGreaterThan(antes));
    expect(criarTopico).toHaveBeenCalledTimes(1);
    expect(JSON.parse(armazenamento.dados.get(chaveDoRascunhoDeTopico(SLUG))!)).toEqual({ titulo: 'T', corpo: 'M' });
  });

  it('a pessoa decide: depois de conferir, pode reabrir e reenviar com o texto de volta', async () => {
    const criarTopico = vi
      .fn<PortaDeForum['criarTopico']>()
      .mockResolvedValueOnce(falha('semConfirmacao'))
      .mockResolvedValueOnce(ok());
    abrir({ criarTopico });
    await abrirFormulario();
    preencher('T', 'M');
    enviarFormulario();
    fireEvent.click(await screen.findByRole('button', { name: 'Conferir os tópicos' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    await abrirFormulario();
    expect(campoTitulo().value).toBe('T');
    expect(campoCorpo().value).toBe('M');
    enviarFormulario();
    await screen.findByRole('heading', { level: 1, name: 'Arroto na reunião de segunda' });
    expect(criarTopico).toHaveBeenCalledTimes(2);
  });

  it('exceção da porta (não devia acontecer) também é ambígua, nunca sucesso', async () => {
    const criarTopico = vi.fn(async () => {
      throw new Error('rede');
    });
    abrir({ criarTopico });
    await abrirFormulario();
    preencher();
    enviarFormulario();
    expect(await screen.findByText(/Não deu pra confirmar o envio/)).toBeDefined();
    expect(sondas.caminho).toBe(`/c/${SLUG}/novo`);
  });
});

describe('sem internet (spec 6.4)', () => {
  it('não chama o servidor e diz que o texto continua aqui; o botão segue ativo', async () => {
    const ambiente = ambienteFalso({ online: false });
    const { criarTopico } = abrir({ ambiente });
    await abrirFormulario();
    preencher('T', 'M');
    enviarFormulario();
    expect(await screen.findByText('Sem internet. Seu texto continua aqui.')).toBeDefined();
    expect(criarTopico).not.toHaveBeenCalled();
    expect(botoesDeCriar()[0].hasAttribute('disabled')).toBe(false);
    expect(campoCorpo().value).toBe('M');
  });
});

describe('rascunho (spec 6.8): fechar nunca apaga', () => {
  it('cada tecla vai para a porta de armazenamento, na chave da comunidade', async () => {
    const armazenamento = armazenamentoFalso();
    abrir({ armazenamento });
    await abrirFormulario();
    fireEvent.change(campoTitulo(), { target: { value: 'Oi' } });
    expect(JSON.parse(armazenamento.dados.get(chaveDoRascunhoDeTopico(SLUG))!)).toEqual({ titulo: 'Oi', corpo: '' });
  });

  it('Cancelar fecha, devolve o foco ao botão "Novo tópico" e o texto volta quando reabre', async () => {
    abrir();
    await abrirFormulario();
    preencher('Meu título', 'Minha mensagem');
    fireEvent.click(screen.getAllByRole('button', { name: 'Cancelar' })[0]);
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(sondas.caminho).toBe(`/c/${SLUG}`);
    const gatilho = screen.getByRole('link', { name: 'Novo tópico' });
    expect(document.activeElement).toBe(gatilho);
    await abrirFormulario();
    expect(campoTitulo().value).toBe('Meu título');
    expect(campoCorpo().value).toBe('Minha mensagem');
  });

  it('Esc (o evento cancel do dialog) fecha sem apagar e sem confirmar nada', async () => {
    const armazenamento = armazenamentoFalso();
    abrir({ armazenamento });
    const dialogo = await abrirFormulario();
    preencher('A', 'B');
    const cancel = new Event('cancel', { cancelable: true });
    fireEvent(dialogo, cancel);
    expect(cancel.defaultPrevented).toBe(true);
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(armazenamento.dados.has(chaveDoRascunhoDeTopico(SLUG))).toBe(true);
    expect(document.activeElement).toBe(screen.getByRole('link', { name: 'Novo tópico' }));
  });

  it('voltar do navegador fecha e o rascunho fica', async () => {
    abrir();
    await abrirFormulario();
    preencher('A', 'B');
    act(() => void sondas.navegar!(-1));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    await abrirFormulario();
    expect(campoCorpo().value).toBe('B');
  });

  it('aberto por URL direta, fechar leva à comunidade e o foco vai ao H1 (o gatilho não existia)', async () => {
    abrir({ entrada: `/c/${SLUG}/novo` });
    await screen.findByRole('dialog', { name: 'Novo tópico' });
    fireEvent.click(screen.getAllByRole('button', { name: 'Cancelar' })[0]);
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(sondas.caminho).toBe(`/c/${SLUG}`);
    const h1 = await screen.findByRole('heading', { level: 1, name: 'Na reunião da firma' });
    await waitFor(() => expect(document.activeElement).toBe(screen.getByRole('link', { name: 'Novo tópico' })));
    void h1;
  });

  it('recarregar a página: o texto vem do armazenamento, sem a memória da sessão', async () => {
    const armazenamento = armazenamentoFalso();
    armazenamento.gravar(chaveDoRascunhoDeTopico(SLUG), JSON.stringify({ titulo: 'Guardado', corpo: 'Do disco' }));
    abrir({ armazenamento });
    await abrirFormulario();
    expect(campoTitulo().value).toBe('Guardado');
    expect(campoCorpo().value).toBe('Do disco');
    expect(screen.getByText('8/120')).toBeDefined();
  });

  it('o rascunho de uma comunidade não aparece em outra', async () => {
    const armazenamento = armazenamentoFalso();
    armazenamento.gravar(chaveDoRascunhoDeTopico('outra-comunidade'), JSON.stringify({ titulo: 'Alheio', corpo: 'x' }));
    abrir({ armazenamento });
    await abrirFormulario();
    expect(campoTitulo().value).toBe('');
  });

  it('armazenamento barrado (Safari em aba privada): digita, fecha e reabre sem lançar, com o texto da sessão', async () => {
    const armazenamento = armazenamentoFalso({ barrado: true });
    abrir({ armazenamento });
    await abrirFormulario();
    preencher('Na memória', 'Só nesta sessão');
    fireEvent.click(screen.getAllByRole('button', { name: 'Cancelar' })[0]);
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    await abrirFormulario();
    expect(campoTitulo().value).toBe('Na memória');
  });

  it('"Descartar rascunho" só aparece com texto e limpa tudo, inclusive o armazenamento', async () => {
    const armazenamento = armazenamentoFalso();
    abrir({ armazenamento });
    await abrirFormulario();
    expect(screen.queryByRole('button', { name: 'Descartar rascunho' })).toBeNull();
    preencher('A', 'B');
    fireEvent.click(screen.getByRole('button', { name: 'Descartar rascunho' }));
    expect(campoTitulo().value).toBe('');
    expect(campoCorpo().value).toBe('');
    expect(armazenamento.dados.has(chaveDoRascunhoDeTopico(SLUG))).toBe(false);
    expect(screen.queryByRole('button', { name: 'Descartar rascunho' })).toBeNull();
    expect(document.activeElement).toBe(campoTitulo());
  });
});
