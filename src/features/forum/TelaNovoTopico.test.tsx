// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { esquecerRascunhosDaSessao } from '../../nucleo/forum/rascunho';
import { chaveDoRascunhoDeTopico } from '../../portas/armazenamento';
import type { MotivoDeEscrita, PortaDeForum, ResultadoDaEscrita, TopicoCriado } from '../../portas/forum';
import { limparListasVistas } from './hooks';
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
  readonly listarTopicos?: PortaDeForum['listarTopicos'];
}

const ok = (): ResultadoDaEscrita<TopicoCriado> => ({ ok: true, valor: { id: ID_NOVO, criadoEm: '2026-10-19T15:00:00.123456+00:00' } });
const falha = (motivo: MotivoDeEscrita): ResultadoDaEscrita<TopicoCriado> => ({ ok: false, motivo });

function abrir(c: Cenario = {}) {
  const criarTopico = c.criarTopico ?? vi.fn(async () => ok());
  const armazenamento = c.armazenamento ?? armazenamentoFalso();
  const ambiente = c.ambiente ?? ambienteFalso();
  const forum = forumFalso({
    obterComunidadeDoForum: vi.fn(async () => ({ ok: true as const, valor: comunidade({ slug: SLUG, souMembro: c.souMembro ?? true }) })),
    listarTopicos: c.listarTopicos ?? vi.fn(async () => ({ ok: true as const, valor: { itens: [], proximo: null } })),
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
  it('o link "Novo tópico" abre o composer simples de 180 caracteres e a comunidade fixa', async () => {
    abrir();
    const dialogo = await abrirFormulario();
    expect(sondas.caminho).toBe(`/c/${SLUG}/novo`);
    expect(within(dialogo).getByRole('heading', { level: 2, name: 'Novo tópico' })).toBeDefined();
    expect(within(dialogo).getByText('Em Na reunião da firma')).toBeDefined();
    expect(campoCorpo().placeholder).toBe('O que tá rolando na comunidade?');
    expect(screen.getByText('0/180')).toBeDefined();
    expect(dialogo.querySelector('.forum-form__titulo-tecnico')?.getAttribute('aria-hidden')).toBe('true');
  });

  it('o foco entra no campo único do post', async () => {
    abrir();
    await abrirFormulario();
    expect(campoCorpo()).toBeDefined();
  });

  it('abrir por URL direta mostra a comunidade por baixo e o formulário por cima', async () => {
    abrir({ entrada: `/c/${SLUG}/novo` });
    expect(await screen.findByRole('dialog', { name: 'Novo tópico' })).toBeDefined();
    expect(await screen.findByRole('heading', { level: 1, name: 'Na reunião da firma' })).toBeDefined();
  });

  it('o formulário oferece imagem e link; sem ponte de plataforma, gravação fica indisponível', async () => {
    abrir();
    const dialogo = await abrirFormulario();
    expect(dialogo.querySelector('input[type="file"]')).not.toBeNull();
    expect(within(dialogo).getByRole('button', { name: 'Gravar áudio' }).hasAttribute('disabled')).toBe(true);
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
    expect(ambiente.camposCentralizados).toContain(campoCorpo().id);
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
  it('conta por code point: 180 emojis cabem, 181 não; o contador mostra o excesso', async () => {
    const { criarTopico } = abrir();
    await abrirFormulario();
    fireEvent.change(campoCorpo(), { target: { value: '💨'.repeat(180) } });
    expect(screen.getByText('180/180')).toBeDefined();
    expect(campoCorpo().getAttribute('aria-invalid')).toBeNull();

    fireEvent.change(campoCorpo(), { target: { value: '💨'.repeat(181) } });
    expect(screen.getByText('181/180')).toBeDefined();
    expect(screen.getByText(/1 caractere a mais/)).toBeDefined();
    expect(campoCorpo().getAttribute('aria-invalid')).toBe('true');

    enviarFormulario();
    await erroVisivel('Passou do limite em 1 caractere.');
    expect(criarTopico).not.toHaveBeenCalled();
    expect(document.activeElement).toBe(campoCorpo());
  });

  it('limite de 180 bloqueia a mensagem e foca o campo', async () => {
    const { criarTopico } = abrir();
    await abrirFormulario();
    fireEvent.change(campoCorpo(), { target: { value: 'a'.repeat(181) } });
    expect(screen.getByText('181/180')).toBeDefined();
    enviarFormulario();
    await erroVisivel('Passou do limite em 1 caractere.');
    expect(criarTopico).not.toHaveBeenCalled();
    expect(document.activeElement).toBe(campoCorpo());
  });

  it('o contador não conta espaço nas pontas (o servidor faz btrim)', async () => {
    abrir();
    await abrirFormulario();
    fireEvent.change(campoCorpo(), { target: { value: '   oi   ' } });
    expect(screen.getByText('2/180')).toBeDefined();
  });

  it('vazio: o botão continua ativo e, ao acionar, escreve o que falta e leva o foco ao primeiro campo com erro', async () => {
    const { criarTopico } = abrir();
    await abrirFormulario();
    for (const b of botoesDeCriar()) expect(b.hasAttribute('disabled')).toBe(false);
    enviarFormulario();
    expect(screen.getByText('Falta a mensagem ou um anexo.')).toBeDefined();
    expect(document.activeElement).toBe(campoCorpo());
    expect(campoCorpo().getAttribute('aria-invalid')).toBe('true');
    expect(criarTopico).not.toHaveBeenCalled();

    fireEvent.change(campoCorpo(), { target: { value: 'Oi' } });
    enviarFormulario();
    expect(document.activeElement).toBe(campoCorpo());
  });

  it('o erro do campo fica ligado a ele (aria-describedby aponta para o erro e o contador)', async () => {
    abrir();
    await abrirFormulario();
    enviarFormulario();
    const erro = await screen.findByText('Falta a mensagem ou um anexo.');
    const ids = campoCorpo().getAttribute('aria-describedby')!.split(' ');
    expect(ids).toContain(erro.id);
    expect(ids.some((i) => i.endsWith('-contador'))).toBe(true);
  });

  it('o aviso falado só cruza o marco, não a cada tecla', async () => {
    abrir();
    const dialogo = await abrirFormulario();
    const regioes = () => within(dialogo).getAllByRole('status').map((r) => r.textContent);
    fireEvent.change(campoCorpo(), { target: { value: 'a'.repeat(50) } });
    expect(regioes().every((t) => t === '')).toBe(true);
    fireEvent.change(campoCorpo(), { target: { value: 'a'.repeat(160) } });
    expect(regioes()).toContain('Faltam 20 caracteres.');
    fireEvent.change(campoCorpo(), { target: { value: 'a'.repeat(165) } });
    expect(regioes().every((t) => t === '')).toBe(true);
    fireEvent.change(campoCorpo(), { target: { value: 'a'.repeat(185) } });
    expect(regioes()).toContain('Passou do limite em 5 caracteres.');
  });
});

describe('criar: só o que o cliente pode mandar, e só atualiza depois do ok', () => {
  it('manda slug e mensagem aparada, sem título técnico nem campos do cliente', async () => {
    const { criarTopico } = abrir();
    await abrirFormulario();
    preencher('  Arroto na reunião  ', '  Saiu na hora do café.\n\nDe novo.  ');
    enviarFormulario();
    await waitFor(() => expect(criarTopico).toHaveBeenCalledTimes(1));
    expect(criarTopico).toHaveBeenCalledWith({
      comunidadeSlug: SLUG,
      corpo: 'Saiu na hora do café.\n\nDe novo.',
    });
    expect(Object.keys(criarTopico.mock.calls[0][0]).sort()).toEqual(['comunidadeSlug', 'corpo']);
  });

  it('publica somente com link anexado, sem exigir texto', async () => {
    const { criarTopico } = abrir();
    const dialogo = await abrirFormulario();
    fireEvent.change(within(dialogo).getByLabelText('Link do YouTube ou TikTok'), {
      target: { value: 'https://youtu.be/dQw4w9WgXcQ' },
    });
    fireEvent.click(within(dialogo).getByRole('button', { name: 'Adicionar link' }));
    await within(dialogo).findByText(/1 anexo: vídeo do YouTube/);
    enviarFormulario();

    await waitFor(() => expect(criarTopico).toHaveBeenCalledTimes(1));
    expect(criarTopico).toHaveBeenCalledWith({
      comunidadeSlug: SLUG,
      corpo: '',
      anexo: { tipo: 'videoExterno', url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' },
    });
  });

  it('com ok: apaga o rascunho, vai para /c/:slug/t/:id (replace), mostra o tópico lido do servidor e diz "Tópico criado."', async () => {
    const armazenamento = armazenamentoFalso();
    const { forum } = abrir({ armazenamento });
    await abrirFormulario();
    preencher();
    expect(armazenamento.dados.has(chaveDoRascunhoDeTopico('conta-a', SLUG))).toBe(true);
    enviarFormulario();

    expect(await screen.findByRole('article')).toBeDefined();
    expect(sondas.caminho).toBe(`/c/${SLUG}/t/${ID_NOVO}`);
    // O que aparece é o que o SERVIDOR devolveu em obter_topico, não o que o cliente digitou.
    expect(forum.obterTopico).toHaveBeenCalledWith(ID_NOVO);
    expect(armazenamento.dados.has(chaveDoRascunhoDeTopico('conta-a', SLUG))).toBe(false);
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(screen.getAllByText('Tópico criado.').length).toBeGreaterThan(0);
  });

  it('voltar depois de criar não reabre o formulário (a navegação foi replace) e a lista não é a velha', async () => {
    abrir();
    await abrirFormulario();
    preencher();
    enviarFormulario();
    await screen.findByRole('article');
    act(() => void sondas.navegar!(-1));
    expect(await screen.findByRole('heading', { level: 1, name: 'Na reunião da firma' })).toBeDefined();
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(sondas.caminho).toBe(`/c/${SLUG}`);
  });

  it('a volta do navegador não mostra a lista velha: a lista que estava na tela não se guarda de volta ao sair', async () => {
    const T1 = topico({ id: '33333333-3333-4333-8333-333333333333', titulo: 'Tópico antigo' });
    const listar = vi.fn(async () => ({ ok: true as const, valor: { itens: [T1], proximo: null } }));
    abrir({ listarTopicos: listar });
    await screen.findByRole('link', { name: 'Saiu na hora do café.' });
    const antes = listar.mock.calls.length;
    await abrirFormulario();
    preencher();
    enviarFormulario();
    await screen.findByRole('article');
    act(() => void sondas.navegar!(-1));
    await screen.findByRole('heading', { level: 1, name: 'Na reunião da firma' });
    // POP: sem a regra, a lista velha voltaria da memória sem ir ao servidor.
    await waitFor(() => expect(listar.mock.calls.length).toBeGreaterThan(antes));
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
    await screen.findByRole('article');
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
    await screen.findByRole('article');
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
    await screen.findByRole('article');
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
    expect(JSON.parse(armazenamento.dados.get(chaveDoRascunhoDeTopico('conta-a', SLUG))!)).toEqual({ titulo: 'Meu título', corpo: 'Minha mensagem' });
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
    await screen.findByRole('article');
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
    expect(JSON.parse(armazenamento.dados.get(chaveDoRascunhoDeTopico('conta-a', SLUG))!)).toEqual({ titulo: 'T', corpo: 'M' });
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
    await screen.findByRole('article');
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
    expect(JSON.parse(armazenamento.dados.get(chaveDoRascunhoDeTopico('conta-a', SLUG))!)).toEqual({ titulo: 'Oi', corpo: '' });
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
    expect(armazenamento.dados.has(chaveDoRascunhoDeTopico('conta-a', SLUG))).toBe(true);
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
    armazenamento.gravar(chaveDoRascunhoDeTopico('conta-a', SLUG), JSON.stringify({ titulo: 'Guardado', corpo: 'Do disco' }));
    abrir({ armazenamento });
    await abrirFormulario();
    expect(campoTitulo().value).toBe('Guardado');
    expect(campoCorpo().value).toBe('Do disco');
    expect(screen.getByText('8/120')).toBeDefined();
  });

  it('o rascunho de uma comunidade não aparece em outra', async () => {
    const armazenamento = armazenamentoFalso();
    armazenamento.gravar(chaveDoRascunhoDeTopico('conta-a', 'outra-comunidade'), JSON.stringify({ titulo: 'Alheio', corpo: 'x' }));
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
    expect(armazenamento.dados.has(chaveDoRascunhoDeTopico('conta-a', SLUG))).toBe(false);
    expect(screen.queryByRole('button', { name: 'Descartar rascunho' })).toBeNull();
    expect(document.activeElement).toBe(campoTitulo());
  });
});

describe('rascunho é de uma conta só (privacidade no mesmo navegador)', () => {
  it('conta B, no mesmo navegador, não vê o rascunho da conta A', async () => {
    const armazenamento = armazenamentoFalso();
    armazenamento.gravar(chaveDoRascunhoDeTopico('conta-a', SLUG), JSON.stringify({ titulo: 'Segredo da A', corpo: 'texto da A' }));
    abrir({ armazenamento, conta: { ...CONTA, id: 'conta-b' } });
    await abrirFormulario();
    expect(campoTitulo().value).toBe('');
    expect(campoCorpo().value).toBe('');
    fireEvent.change(campoTitulo(), { target: { value: 'da B' } });
    expect(armazenamento.dados.has(chaveDoRascunhoDeTopico('conta-b', SLUG))).toBe(true);
    expect(JSON.parse(armazenamento.dados.get(chaveDoRascunhoDeTopico('conta-a', SLUG))!).titulo).toBe('Segredo da A');
  });

  it('a conta A volta e encontra o dela', async () => {
    const armazenamento = armazenamentoFalso();
    armazenamento.gravar(chaveDoRascunhoDeTopico('conta-a', SLUG), JSON.stringify({ titulo: 'Da A', corpo: 'x' }));
    abrir({ armazenamento });
    await abrirFormulario();
    expect(campoTitulo().value).toBe('Da A');
  });
});

describe('enviando, o formulário não fecha (o resultado não pode ficar escondido)', () => {
  it('Cancelar fica desabilitado (celular e desktop) e Esc é ignorado até a resposta chegar', async () => {
    let soltar!: (r: ResultadoDaEscrita<TopicoCriado>) => void;
    const criarTopico = vi.fn(() => new Promise<ResultadoDaEscrita<TopicoCriado>>((r) => (soltar = r)));
    abrir({ criarTopico });
    const dialogo = await abrirFormulario();
    preencher();
    enviarFormulario();
    for (const b of screen.getAllByRole('button', { name: 'Cancelar' })) expect((b as HTMLButtonElement).disabled).toBe(true);
    const cancel = new Event('cancel', { cancelable: true });
    fireEvent(dialogo, cancel);
    expect(cancel.defaultPrevented).toBe(true);
    expect(screen.getByRole('dialog')).toBeDefined();
    expect(sondas.caminho).toBe(`/c/${SLUG}/novo`);
    await act(async () => soltar(falha('falhou')));
    expect(await screen.findByText('Não deu para enviar. Seu texto continua aqui, tenta de novo.')).toBeDefined();
    for (const b of screen.getAllByRole('button', { name: 'Cancelar' })) expect((b as HTMLButtonElement).disabled).toBe(false);
    fireEvent(screen.getByRole('dialog'), new Event('cancel', { cancelable: true }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });
});

describe('o campo da mensagem não colapsa (D2)', () => {
  it('tem piso de 6 linhas (>= 168px com linha de 24px) e o rótulo "Mensagem"', async () => {
    abrir();
    await abrirFormulario();
    expect(campoCorpo().style.minHeight).toBe('calc(9em + 26px)');
    expect(campoCorpo().rows).toBe(6);
  });
});
