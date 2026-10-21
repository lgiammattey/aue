// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import type { CursorDoForum, PortaDeForum, RespostaDoForum, TopicoDoForum } from '../../portas/forum';
import { limparListasVistas } from './hooks';
import { Rotas, ambienteFalso, comunidade, forumFalso, resposta, sondas, topico } from './dublesParaTeste';

beforeEach(limparListasVistas);
afterEach(cleanup);

const ID = '11111111-1111-4111-8111-111111111111';
const ROTA = `/c/reuniao-da-firma/t/${ID}`;

const paginaR = (itens: RespostaDoForum[], proximo: CursorDoForum | null = null) => ({
  ok: true as const,
  valor: { itens, proximo },
});

function forumDo(t: TopicoDoForum | null, respostas: PortaDeForum['listarRespostasDoTopico'] = vi.fn(async () => paginaR([]))) {
  return forumFalso({
    obterTopico: vi.fn(async () => ({ ok: true as const, valor: t })),
    listarRespostasDoTopico: respostas,
    obterComunidadeDoForum: vi.fn(async () => ({ ok: true as const, valor: comunidade() })),
  });
}

function abrir(forum: PortaDeForum, entrada = ROTA, extra = {}) {
  render(<Rotas entrada={entrada} m={{ forum, ...extra }} />);
}

describe('/c/:slug/t/:id: a conversa', () => {
  it('mostra um H1 contextual, autoria, mensagem inicial inteira e a contagem de respostas do servidor', async () => {
    const longo = `${'a'.repeat(400)}\n\n\n\n${'b'.repeat(900)}`;
    const t = topico({ titulo: 'Título do tópico', corpo: longo, respostasTotal: 8, editadoEm: '2026-10-19T14:00:00Z' });
    abrir(forumDo(t, vi.fn(async () => paginaR([resposta({ id: 'r1' }), resposta({ id: 'r2' })]))));

    expect(await screen.findByRole('heading', { level: 1, name: 'Conversa em Na reunião da firma' })).toBeDefined();
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    const artigo = screen.getByRole('article');
    expect(within(artigo).getByText('Ana Souza')).toBeDefined();
    expect(within(artigo).getByText('@ana')).toBeDefined();
    expect(within(artigo).getByText('editado')).toBeDefined();
    const corpo = artigo.querySelector('.forum-corpo')!.textContent!;
    expect(corpo).toBe(`${'a'.repeat(400)}\n\n${'b'.repeat(900)}`);
    // 8 vem do servidor mesmo que a página tenha 2 itens: nenhuma soma no cliente
    expect(await screen.findByRole('heading', { level: 2, name: '8 respostas' })).toBeDefined();
    expect(screen.getByText('Mais antigas primeiro')).toBeDefined();
  });

  it('título da aba contextual e o link do autor leva ao perfil', async () => {
    const ambiente = ambienteFalso();
    abrir(forumDo(topico({ titulo: 'Papo reto' })), ROTA, { ambiente });
    await screen.findByRole('heading', { level: 1, name: 'Conversa em Na reunião da firma' });
    expect(ambiente.titulo).toBe('Conversa em Na reunião da firma · Auê!');
    expect(screen.getAllByRole('link', { name: 'Ana Souza' })[0].getAttribute('href')).toBe('/u/ana');
  });

  it('visitante: nada de composer, Editar, Apagar, Denunciar, Enviar nem Arrotar para responder; vê o convite', async () => {
    abrir(forumDo(topico({ souAutor: true }), vi.fn(async () => paginaR([resposta({ id: 'r1', souAutor: true })]))));
    await screen.findByText('texto r1');
    expect(screen.queryByRole('textbox')).toBeNull();
    expect(screen.queryByRole('button', { name: /enviar|editar|apagar|denunciar|arrotar|participar|responder a/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /ações/i })).toBeNull();
    expect(screen.getByText('Quer responder? Crie sua conta ou entre. Ler e ouvir continua liberado.')).toBeDefined();
  });

  it('id que não é tópico: "não está disponível" com volta para a comunidade, e não chama as respostas', async () => {
    const respostas = vi.fn(async () => paginaR([]));
    abrir(forumDo(null, respostas), '/c/reuniao-da-firma/t/lixo');
    expect(await screen.findByText('Esse tópico não está disponível.')).toBeDefined();
    expect(screen.getByText('Ele pode ter sido apagado, estar oculto, ou o endereço está errado.')).toBeDefined();
    expect(within(screen.getByRole('main')).getByRole('link', { name: 'Voltar para a comunidade' }).getAttribute('href')).toBe('/c/reuniao-da-firma');
    expect(respostas).not.toHaveBeenCalled();
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('falha ao abrir o tópico é erro, não "indisponível", e tem Tentar de novo', async () => {
    const obter = vi
      .fn()
      .mockResolvedValueOnce({ ok: false, motivo: 'falhou' })
      .mockResolvedValueOnce({ ok: true, valor: topico({ titulo: 'Voltou' }) });
    abrir(forumFalso({ obterTopico: obter, listarRespostasDoTopico: vi.fn(async () => paginaR([])), obterComunidadeDoForum: vi.fn(async () => ({ ok: true as const, valor: comunidade() })) }));
    const alerta = await screen.findByRole('alert');
    expect(alerta.textContent).toContain('Deu ruim pra carregar o tópico.');
    expect(screen.queryByText('Esse tópico não está disponível.')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Tentar de novo' }));
    expect(await screen.findByRole('heading', { level: 1, name: 'Conversa em Na reunião da firma' })).toBeDefined();
  });

  it('sem internet, o erro de abrir o tópico diz "Sem internet."', async () => {
    abrir(forumFalso({ obterTopico: vi.fn(async () => ({ ok: false as const, motivo: 'falhou' as const })) }), ROTA, {
      ambiente: ambienteFalso({ online: false }),
    });
    expect((await screen.findByRole('alert')).textContent).toContain('Sem internet.');
  });

  it('slug da URL diferente do slug do tópico: corrige a URL (replace) e nunca mostra sob outra comunidade', async () => {
    const t = topico({ titulo: 'Do lugar certo' });
    abrir(forumDo(t), `/c/outra-comunidade/t/${ID}`);
    expect(await screen.findByRole('heading', { level: 1, name: 'Conversa em Na reunião da firma' })).toBeDefined();
    expect(sondas.caminho).toBe(ROTA);
  });

  it('tópico fechado mostra a faixa honesta', async () => {
    abrir(forumDo(topico({ status: 'fechado' })));
    expect(await screen.findByText('Este tópico está fechado. Dá pra ler tudo, mas não aceita novas respostas.')).toBeDefined();
    expect(screen.getByText('Fechado')).toBeDefined();
  });

  it('texto de usuário é texto: título, corpo e resposta com HTML não viram elementos', async () => {
    const t = topico({ titulo: '<b>negrito</b>', corpo: '<img src=x onerror=alert(1)>' });
    abrir(forumDo(t, vi.fn(async () => paginaR([resposta({ id: 'r1', corpo: '<script>alert(1)</script>' })]))));
    await screen.findByText('<script>alert(1)</script>');
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Conversa em Na reunião da firma');
    expect(document.querySelector('main img, main script, main b')).toBeNull();
  });

  it('avatar com endereço que não é http(s) cai nas letras e não entra na página', async () => {
    const t = topico({ autor: { id: 'a', apelido: 'Ana Souza', handle: 'ana', avatarUrl: 'javascript:alert(1)' } });
    abrir(forumDo(t));
    await screen.findByRole('article');
    expect(document.querySelector('img')).toBeNull();
    expect(screen.getByRole('article').textContent).toContain('AN');
  });
});

describe('áudio e nota: só o que o servidor devolveu', () => {
  const audio = (nota: number | null, extra = {}) => ({
    resultadoId: 'res-1',
    nota,
    duracao: 7,
    subtipoDeOrigem: null,
    caminhoDoAudio: 'a/b.webm',
    caminhoDoAudioDaCasa: null,
    ...extra,
  });

  it('sem áudio, o bloco inteiro não existe', async () => {
    abrir(forumDo(topico({ audio: null })));
    await screen.findByRole('article');
    expect(screen.queryByRole('button', { name: /tocar/i })).toBeNull();
    expect(document.querySelector('.forum-selo-nota')).toBeNull();
  });

  it('com áudio e nota: duração e selo com vírgula, sem botão nem player (URL do áudio ainda não decidida, #250)', async () => {
    abrir(forumDo(topico({ audio: audio(87.4) })));
    await screen.findByRole('article');
    expect(screen.getByText('0:07')).toBeDefined();
    expect(screen.getByText('87,4')).toBeDefined();
    expect(screen.queryByRole('button', { name: /tocar/i })).toBeNull();
    expect(screen.queryByText(/player/i)).toBeNull();
  });

  it('áudio sem nota mostra só a duração, sem selo, e nunca inventa nota', async () => {
    abrir(forumDo(topico({ audio: audio(null) })));
    await screen.findByRole('article');
    expect(screen.getByText('0:07')).toBeDefined();
    expect(screen.queryByRole('button', { name: /Tocar arroto/ })).toBeNull();
    expect(document.querySelector('.forum-selo-nota')).toBeNull();
  });

  it('áudio da casa sem nota também não ganha selo', async () => {
    abrir(forumDo(topico({ audio: audio(null, { caminhoDoAudio: null, caminhoDoAudioDaCasa: 'casa/x.mp3', resultadoId: null }) })));
    await screen.findByRole('article');
    expect(screen.queryByRole('button', { name: /Tocar arroto/ })).toBeNull();
    expect(document.querySelector('.forum-selo-nota')).toBeNull();
  });

  it('nota sem caminho de áudio não desenha player', async () => {
    abrir(forumDo(topico({ audio: audio(80, { caminhoDoAudio: null }) })));
    await screen.findByRole('article');
    expect(document.querySelector('.forum-audio')).toBeNull();
  });
});

describe('respostas encadeadas', () => {
  it('link direto busca só a resposta e seus ancestrais, abre o ramo e destaca o alvo', async () => {
    const alvo = '33333333-3333-4333-8333-333333333333';
    const pai = resposta({ id: '22222222-2222-4222-8222-222222222222', corpo: 'pai que não estava na primeira página' });
    const filha = resposta({ id: alvo, paiId: pai.id, nivel: 1, corpo: 'fala compartilhada' });
    const contexto = vi.fn(async () => ({ ok: true as const, valor: [pai, filha] }));
    const forum = forumDo(
      topico({ respostasTotal: 300 }),
      vi.fn(async () => paginaR([resposta({ id: 'r1' })])),
    );
    abrir({ ...forum, obterContextoDaResposta: contexto }, `${ROTA}?resposta=${alvo}`);

    expect(await screen.findByText('fala compartilhada')).toBeDefined();
    expect(contexto).toHaveBeenCalledWith(ID, alvo);
    expect(screen.getByText('fala compartilhada').closest('.forum-resposta')?.className).toContain('forum-resposta--em-destaque');
    expect(screen.getByText('pai que não estava na primeira página')).toBeDefined();
  });

  it('link de resposta indisponível não finge que abriu', async () => {
    const alvo = '33333333-3333-4333-8333-333333333333';
    const contexto = vi.fn(async () => ({ ok: true as const, valor: [] }));
    const forum = forumDo(topico(), vi.fn(async () => paginaR([])));
    abrir({ ...forum, obterContextoDaResposta: contexto }, `${ROTA}?resposta=${alvo}`);

    expect(await screen.findByText('Essa resposta não está disponível.')).toBeDefined();
    expect(screen.queryByText('Resposta aberta na conversa.')).toBeNull();
  });

  it('ao remover ou trocar o link, limpa o ramo e o destaque anteriores antes de abrir o próximo', async () => {
    const primeiro = '33333333-3333-4333-8333-333333333333';
    const segundo = '44444444-4444-4444-8444-444444444444';
    const respostaInicial = resposta({ id: primeiro, corpo: 'ramo do primeiro link' });
    const respostaSeguinte = resposta({ id: segundo, corpo: 'ramo do segundo link' });
    const contexto = vi.fn(async (_topicoId: string, respostaId: string) => ({
      ok: true as const,
      valor: respostaId === primeiro ? [respostaInicial] : [respostaSeguinte],
    }));
    const forum = forumDo(topico(), vi.fn(async () => paginaR([resposta({ id: 'r1' })])));
    abrir({ ...forum, obterContextoDaResposta: contexto }, `${ROTA}?resposta=${primeiro}`);
    expect(await screen.findByText('ramo do primeiro link')).toBeDefined();

    await act(async () => sondas.navegar?.(ROTA));
    await waitFor(() => expect(screen.queryByText('ramo do primeiro link')).toBeNull());
    expect(document.querySelector('.forum-resposta--em-destaque')).toBeNull();

    await act(async () => sondas.navegar?.(`${ROTA}?resposta=${segundo}`));
    expect(await screen.findByText('ramo do segundo link')).toBeDefined();
    expect(screen.queryByText('ramo do primeiro link')).toBeNull();
    expect(screen.getByText('ramo do segundo link').closest('.forum-resposta')?.className).toContain('forum-resposta--em-destaque');
    expect(contexto).toHaveBeenLastCalledWith(ID, segundo);
  });

  it('põe cada resposta sob o pai certo, em listas aninhadas, sem cortar o texto', async () => {
    const texto = 'x'.repeat(480);
    const lista = [
      resposta({ id: 'a', corpo: texto }),
      resposta({ id: 'a1', paiId: 'a', nivel: 1 }),
      resposta({ id: 'a1x', paiId: 'a1', nivel: 2, autor: { id: 'z', apelido: 'Caio', handle: 'caio', avatarUrl: null } }),
      resposta({ id: 'a1xy', paiId: 'a1x', nivel: 2 }),
      resposta({ id: 'b' }),
    ];
    abrir(forumDo(topico({ respostasTotal: 5 }), vi.fn(async () => paginaR(lista))));
    await screen.findByText(texto);

    const raiz = document.querySelector('main ul.forum-respostas')!;
    const topLevel = Array.from(raiz.children).map((li) => li.querySelector('.forum-resposta__corpo')!.textContent);
    expect(topLevel).toEqual([texto, 'texto b']);

    const a = raiz.children[0];
    const filhaDeA = a.querySelector(':scope > ul > li')!;
    expect(filhaDeA.querySelector(':scope > .forum-resposta__corpo')!.textContent).toBe('texto a1');
    const neta = filhaDeA.querySelector(':scope > ul > li')!;
    expect(neta.getAttribute('data-nivel')).toBe('2');
    expect(neta.querySelector(':scope > .forum-resposta__corpo')!.textContent).toBe('texto a1x');
    const bisneta = neta.querySelector(':scope > ul > li')!;
    expect(bisneta.querySelector(':scope > .forum-resposta__corpo')!.textContent).toBe('texto a1xy');
    expect(bisneta.querySelector('.forum-resposta__referencia')!.textContent).toBe('Respondendo a @caio');
    // nível 1 respondendo nível 0 não leva referência
    expect(filhaDeA.querySelector(':scope > .forum-resposta__referencia')).toBeNull();
  });

  it('casca de resposta apagada ou oculta mantém as filhas e diz o que houve', async () => {
    const lista = [
      resposta({ id: 'a', status: 'removido', autor: null, corpo: null }),
      resposta({ id: 'a1', paiId: 'a', nivel: 1 }),
      resposta({ id: 'b', status: 'oculto', autor: null, corpo: null }),
    ];
    abrir(forumDo(topico({ respostasTotal: 1 }), vi.fn(async () => paginaR(lista))));
    expect(await screen.findByText('Resposta removida.')).toBeDefined();
    expect(screen.getByText('Resposta oculta.')).toBeDefined();
    expect(screen.getByText('texto a1')).toBeDefined();
  });

  it('sem respostas: mensagem curta, sem convite nem composer', async () => {
    abrir(forumDo(topico({ respostasTotal: 0 })));
    expect(await screen.findByText('Ninguém respondeu ainda.')).toBeDefined();
    expect(screen.getByRole('heading', { level: 2, name: 'Sem respostas' })).toBeDefined();
  });

  it('falha ao carregar as respostas: o cabeçalho fica e só a área das respostas erra, com retry', async () => {
    const respostas = vi
      .fn()
      .mockResolvedValueOnce({ ok: false, motivo: 'falhou' })
      .mockResolvedValueOnce(paginaR([resposta({ id: 'r1' })]));
    abrir(forumDo(topico({ titulo: 'Fica no ar', respostasTotal: 1 }), respostas));
    const alerta = await screen.findByRole('alert');
    expect(alerta.textContent).toContain('Deu ruim pra carregar as respostas.');
    expect(screen.getByRole('heading', { level: 1, name: 'Conversa em Na reunião da firma' })).toBeDefined();
    expect(screen.queryByText('Ninguém respondeu ainda.')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Tentar de novo' }));
    expect(await screen.findByText('texto r1')).toBeDefined();
  });

  it('"Ver mais respostas" manda o cursor como veio, junta por id e foca a primeira nova', async () => {
    const CURSOR: CursorDoForum = { valor: '2026-10-19T12:00:00.654321+00:00', id: 'r2' };
    const respostas = vi
      .fn()
      .mockResolvedValueOnce(paginaR([resposta({ id: 'r1' }), resposta({ id: 'r2' })], CURSOR))
      .mockResolvedValueOnce(paginaR([resposta({ id: 'r2' }), resposta({ id: 'r3' })], null));
    abrir(forumDo(topico({ respostasTotal: 3 }), respostas));
    await screen.findByText('texto r2');
    fireEvent.click(screen.getByRole('button', { name: 'Ver mais respostas' }));
    await screen.findByText('texto r3');
    expect(respostas.mock.calls[1][1]).toEqual({ limite: 100, cursor: CURSOR });
    expect(respostas.mock.calls[1][1].cursor).toBe(CURSOR);
    expect(screen.getAllByText(/^texto r\d$/).map((e) => e.textContent)).toEqual(['texto r1', 'texto r2', 'texto r3']);
    await waitFor(() => expect(document.activeElement?.textContent).toContain('texto r3'));
    expect(screen.queryByRole('button', { name: /ver mais/i })).toBeNull();
  });

  it('falha no "Ver mais respostas" mantém as que já estão na tela', async () => {
    const CURSOR: CursorDoForum = { valor: 'v', id: 'r1' };
    const respostas = vi
      .fn()
      .mockResolvedValueOnce(paginaR([resposta({ id: 'r1' })], CURSOR))
      .mockResolvedValueOnce({ ok: false, motivo: 'falhou' });
    abrir(forumDo(topico({ respostasTotal: 2 }), respostas));
    await screen.findByText('texto r1');
    fireEvent.click(screen.getByRole('button', { name: 'Ver mais respostas' }));
    expect(await screen.findByRole('button', { name: 'Não deu pra carregar mais. Tentar de novo' })).toBeDefined();
    expect(screen.getByText('texto r1')).toBeDefined();
  });

  it('o aside do desktop traz a comunidade e as regras, e a falha dele não derruba a conversa', async () => {
    const forum = forumFalso({
      obterTopico: vi.fn(async () => ({ ok: true as const, valor: topico() })),
      listarRespostasDoTopico: vi.fn(async () => paginaR([])),
      obterComunidadeDoForum: vi.fn(async () => ({ ok: false as const, motivo: 'falhou' as const })),
    });
    abrir(forum);
    await screen.findByRole('article');
    const aside = await screen.findByRole('complementary', { name: 'Sobre a comunidade' });
    expect(within(aside).getByRole('link', { name: 'Na reunião da firma' }).getAttribute('href')).toBe('/c/reuniao-da-firma');
    expect(within(aside).getByText('Sem spam de link.')).toBeDefined();
  });
});
