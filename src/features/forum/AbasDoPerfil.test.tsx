// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import type {
  CursorDoForum,
  PortaDeForum,
  RespostaDoAutor,
  ResultadoDaLeitura,
  PaginaDoForum,
  TopicoDoAutor,
} from '../../portas/forum';
import { AbasDoPerfil } from './AbasDoPerfil';
import { abaDaUrl } from './ordem';
import { limparListasVistas } from './hooks';
import { AGORA, Sonda, ambienteFalso, dependencias, forumFalso, sondas } from './dublesParaTeste';

beforeEach(limparListasVistas);
afterEach(cleanup);

const comunidadeA = { id: 'c1', slug: 'cerveja-gelada', nome: 'Cerveja Gelada' };

function topicoDoAutor(id: string, parcial: Partial<TopicoDoAutor> = {}): TopicoDoAutor {
  return {
    id,
    comunidade: comunidadeA,
    titulo: `Tópico ${id}`,
    corpo: 'corpo que o perfil não mostra',
    status: 'aberto',
    fixado: false,
    criadoEm: new Date(AGORA - 3 * 86_400_000).toISOString(),
    editadoEm: null,
    ultimaAtividadeEm: new Date(AGORA - 3_600_000).toISOString(),
    respostasTotal: 8,
    ...parcial,
  };
}

function respostaDoAutor(id: string, parcial: Partial<RespostaDoAutor> = {}): RespostaDoAutor {
  return {
    id,
    topicoId: `t-${id}`,
    topicoTitulo: `Arrotos em lugares proibidos ${id}`,
    comunidade: comunidadeA,
    paiId: null,
    nivel: 0,
    corpo: `Já arrotei no banheiro do shopping ${id}`,
    criadoEm: new Date(AGORA - 2 * 86_400_000).toISOString(),
    editadoEm: null,
    ...parcial,
  };
}

type Pagina<T> = ResultadoDaLeitura<PaginaDoForum<CursorDoForum, T>>;
const semNbsp = (el: Element) => (el.textContent ?? '').replace(/\u00a0/g, ' ');
const pagina = <T,>(itens: T[], proximo: CursorDoForum | null = null): Pagina<T> => ({ ok: true, valor: { itens, proximo } });

interface Abertura {
  readonly topicos?: PortaDeForum['listarTopicosDoAutor'];
  readonly respostas?: PortaDeForum['listarRespostasDoAutor'];
  readonly entrada?: string;
  readonly souEu?: boolean;
  readonly online?: boolean;
}

function abrir({ topicos, respostas, entrada = '/u/betao', souEu = false, online = true }: Abertura = {}) {
  const forum = forumFalso({
    listarTopicosDoAutor: topicos ?? vi.fn(async () => pagina([topicoDoAutor('1')])),
    listarRespostasDoAutor: respostas ?? vi.fn(async () => pagina([respostaDoAutor('1')])),
  });
  const ambiente = ambienteFalso({ online });
  render(
    <MemoryRouter initialEntries={[entrada]}>
      <Sonda />
      <Routes>
        <Route
          path="/u/:handle"
          element={<AbasDoPerfil handle="betao" souEu={souEu} dependencias={dependencias({ forum, ambiente })} />}
        />
        <Route path="/c/:slug/t/:id" element={<p>Tópico aberto</p>} />
        <Route path="/c/:slug" element={<p>Comunidade aberta</p>} />
      </Routes>
    </MemoryRouter>,
  );
  return { forum, ambiente };
}

describe('abaDaUrl', () => {
  it('só "respostas" muda a aba; o resto é tópicos', () => {
    expect(abaDaUrl('respostas')).toBe('respostas');
    expect(abaDaUrl('topicos')).toBe('topicos');
    expect(abaDaUrl('curtidos')).toBe('topicos');
    expect(abaDaUrl(null)).toBe('topicos');
  });
});

describe('abas do perfil: semântica e URL', () => {
  it('são duas abas (Tópicos e Respostas), padrão WAI-ARIA, com a de tópicos aberta', async () => {
    abrir();
    const lista = screen.getByRole('tablist', { name: 'Atividade de @betao' });
    const abas = within(lista).getAllByRole('tab');
    expect(abas.map((a) => a.textContent)).toEqual(['Tópicos', 'Respostas']);
    expect(abas[0].getAttribute('aria-selected')).toBe('true');
    expect(abas[1].getAttribute('aria-selected')).toBe('false');
    expect(abas[0].tabIndex).toBe(0);
    expect(abas[1].tabIndex).toBe(-1);
    const painel = screen.getByRole('tabpanel');
    expect(painel.getAttribute('aria-labelledby')).toBe(abas[0].id);
    expect(abas[0].getAttribute('aria-controls')).toBe(painel.id);
    await screen.findByRole('link', { name: 'Tópico 1' });
    expect(screen.queryByRole('tab', { name: /curtidos|resenhas|com áudio/i })).toBeNull();
  });

  it('clicar em Respostas põe ?aba=respostas na URL, sem empurrar histórico, e preserva os outros parâmetros', async () => {
    const { forum } = abrir({ entrada: '/u/betao?x=1' });
    await screen.findByRole('link', { name: 'Tópico 1' });
    fireEvent.click(screen.getByRole('tab', { name: 'Respostas' }));
    await screen.findByRole('link', { name: /Em: Arrotos em lugares proibidos 1/ });
    expect(sondas.caminho).toBe('/u/betao?x=1&aba=respostas');
    expect(screen.getByRole('tab', { name: 'Respostas' }).getAttribute('aria-selected')).toBe('true');
    expect(forum.listarRespostasDoAutor).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('tab', { name: 'Tópicos' }));
    await screen.findByRole('link', { name: 'Tópico 1' });
    expect(sondas.caminho).toBe('/u/betao?x=1');
    // replace: o histórico tem só a entrada original.
    await act(async () => sondas.navegar!(-1));
    expect(sondas.caminho).toBe('/u/betao?x=1');
  });

  it('abre direto na aba da URL e nem chama a leitura da outra', async () => {
    const { forum } = abrir({ entrada: '/u/betao?aba=respostas' });
    await screen.findByRole('link', { name: /Em: Arrotos/ });
    expect(screen.getByRole('tab', { name: 'Respostas' }).getAttribute('aria-selected')).toBe('true');
    expect(forum.listarTopicosDoAutor).not.toHaveBeenCalled();
  });

  it('setas, Home e End movem o foco e abrem a aba', async () => {
    abrir();
    await screen.findByRole('link', { name: 'Tópico 1' });
    const topicos = screen.getByRole('tab', { name: 'Tópicos' });
    const respostas = screen.getByRole('tab', { name: 'Respostas' });
    topicos.focus();

    fireEvent.keyDown(topicos, { key: 'ArrowRight' });
    await screen.findByRole('link', { name: /Em: Arrotos/ });
    expect(document.activeElement).toBe(respostas);
    expect(respostas.getAttribute('aria-selected')).toBe('true');
    expect(respostas.tabIndex).toBe(0);
    expect(topicos.tabIndex).toBe(-1);

    // Dá a volta: seta para a direita na última volta à primeira.
    fireEvent.keyDown(respostas, { key: 'ArrowRight' });
    await screen.findByRole('link', { name: 'Tópico 1' });
    expect(document.activeElement).toBe(topicos);

    fireEvent.keyDown(topicos, { key: 'ArrowLeft' });
    await screen.findByRole('link', { name: /Em: Arrotos/ });
    expect(document.activeElement).toBe(respostas);

    fireEvent.keyDown(respostas, { key: 'Home' });
    await screen.findByRole('link', { name: 'Tópico 1' });
    expect(document.activeElement).toBe(topicos);

    fireEvent.keyDown(topicos, { key: 'End' });
    await screen.findByRole('link', { name: /Em: Arrotos/ });
    expect(document.activeElement).toBe(respostas);
  });

  it('o Voltar do navegador, vindo de um tópico aberto pela aba Respostas, cai na mesma aba e na mesma lista', async () => {
    const respostas = vi.fn(async () => pagina([respostaDoAutor('1')]));
    abrir({ entrada: '/u/betao?aba=respostas', respostas });
    fireEvent.click(await screen.findByRole('link', { name: /Em: Arrotos/ }));
    await screen.findByText('Tópico aberto');
    expect(sondas.caminho).toBe('/c/cerveja-gelada/t/t-1');

    await act(async () => sondas.navegar!(-1));
    expect(await screen.findByRole('link', { name: /Em: Arrotos/ })).toBeDefined();
    expect(sondas.caminho).toBe('/u/betao?aba=respostas');
    expect(screen.getByRole('tab', { name: 'Respostas' }).getAttribute('aria-selected')).toBe('true');
    // A lista já vista volta na hora, sem pedir ao servidor de novo.
    expect(respostas).toHaveBeenCalledTimes(1);
  });
});

describe('aba Tópicos', () => {
  it('lê pela porta com o @ do cabeçalho e 30 por página, e cada item aponta para o contexto', async () => {
    const topicos = vi.fn(async () =>
      pagina([
        topicoDoAutor('1'),
        topicoDoAutor('2', { comunidade: { id: 'c2', slug: 'refri', nome: 'Refri & Cia' }, respostasTotal: 0 }),
      ]),
    );
    abrir({ topicos });
    const titulo = await screen.findByRole('link', { name: 'Tópico 1' });
    expect(topicos).toHaveBeenCalledWith('betao', { limite: 30, cursor: null });
    expect(titulo.getAttribute('href')).toBe('/c/cerveja-gelada/t/1');
    const linha = titulo.closest('li')!;
    expect(within(linha).getByRole('link', { name: 'Cerveja Gelada' }).getAttribute('href')).toBe('/c/cerveja-gelada');
    expect(semNbsp(linha)).toContain('Cerveja Gelada · 8 respostas · há 3 d');
    // Sem trecho do corpo.
    expect(linha.textContent).not.toContain('corpo que o perfil não mostra');

    const outra = screen.getByRole('link', { name: 'Tópico 2' }).closest('li')!;
    expect(semNbsp(outra)).toContain('Refri & Cia · Sem respostas · há 3 d');
    expect(within(outra).getByRole('link', { name: 'Refri & Cia' }).getAttribute('href')).toBe('/c/refri');
    expect(screen.getByRole('tabpanel').getAttribute('aria-busy')).toBeNull();
  });

  it('contador é o do servidor: 1 vira "1 resposta", 1234 vira "1.234 respostas", nada é somado', async () => {
    abrir({
      topicos: vi.fn(async () => pagina([topicoDoAutor('1', { respostasTotal: 1 }), topicoDoAutor('2', { respostasTotal: 1234 })])),
    });
    const um = (await screen.findByRole('link', { name: 'Tópico 1' })).closest('li')!;
    expect(um.textContent).toContain('1 resposta ·');
    expect(screen.getByRole('link', { name: 'Tópico 2' }).closest('li')!.textContent).toContain('1.234 respostas');
  });

  it('tópico fechado mostra o marcador; aberto não', async () => {
    abrir({ topicos: vi.fn(async () => pagina([topicoDoAutor('1', { status: 'fechado' }), topicoDoAutor('2')])) });
    const fechado = (await screen.findByRole('link', { name: 'Tópico 1' })).closest('li')!;
    expect(fechado.textContent).toContain('Fechado');
    expect(screen.getByRole('link', { name: 'Tópico 2' }).closest('li')!.textContent).not.toContain('Fechado');
  });

  it('título do usuário é texto, nunca HTML', async () => {
    abrir({ topicos: vi.fn(async () => pagina([topicoDoAutor('1', { titulo: '<img src=x onerror=alert(1)> <b>negrito</b>' })])) });
    const link = await screen.findByRole('link', { name: /negrito/ });
    expect(link.textContent).toBe('<img src=x onerror=alert(1)> <b>negrito</b>');
    expect(link.querySelector('img, b')).toBeNull();
  });

  it('carregando: esqueleto com status "Carregando tópicos" e container ocupado', async () => {
    let soltar: (p: Pagina<TopicoDoAutor>) => void = () => undefined;
    const demora = new Promise<Pagina<TopicoDoAutor>>((r) => {
      soltar = r;
    });
    abrir({ topicos: vi.fn(() => demora) });
    expect(document.querySelector('.forum-esqueleto')?.getAttribute('aria-busy')).toBe('true');
    expect(screen.getByRole('status').textContent).toBe('Carregando tópicos');
    expect(screen.queryByText(/ainda não abriu/)).toBeNull();
    await act(async () => soltar(pagina([topicoDoAutor('1')])));
    await screen.findByRole('link', { name: 'Tópico 1' });
    expect(document.querySelector('.forum-esqueleto')).toBeNull();
  });
});

describe('aba Respostas', () => {
  it('mostra "Em: título", o corpo e "Comunidade · tempo", com link para o tópico (sem âncora)', async () => {
    const respostas = vi.fn(async () => pagina([respostaDoAutor('1')]));
    abrir({ entrada: '/u/betao?aba=respostas', respostas });
    const link = await screen.findByRole('link', { name: 'Em: Arrotos em lugares proibidos 1' });
    expect(respostas).toHaveBeenCalledWith('betao', { limite: 30, cursor: null });
    expect(link.getAttribute('href')).toBe('/c/cerveja-gelada/t/t-1');
    const linha = link.closest('li')!;
    expect(linha.textContent).toContain('Já arrotei no banheiro do shopping 1');
    expect(semNbsp(linha)).toContain('Cerveja Gelada · há 2 d');
    expect(within(linha).getByRole('link', { name: 'Cerveja Gelada' }).getAttribute('href')).toBe('/c/cerveja-gelada');
  });

  it('corpo da resposta é texto, nunca HTML', async () => {
    abrir({
      entrada: '/u/betao?aba=respostas',
      respostas: vi.fn(async () => pagina([respostaDoAutor('1', { corpo: '<script>alert(1)</script><b>forte</b>' })])),
    });
    const linha = (await screen.findByRole('link', { name: /Em: / })).closest('li')!;
    expect(linha.querySelector('p.forum-linha__corpo')!.textContent).toBe('<script>alert(1)</script><b>forte</b>');
    expect(linha.querySelector('script, b')).toBeNull();
  });
});

describe('"Ver mais" por cursor', () => {
  // Microssegundo de verdade: se passar por Date, vira .123 e a página seguinte repete ou pula item.
  const cursor1: CursorDoForum = { valor: '2026-10-19T12:00:00.123456+00:00', id: '2' };
  const cursor2: CursorDoForum = { valor: '2026-10-18T09:30:00.000001+00:00', id: '4' };

  it('manda o cursor do servidor de volta como veio e junta por id, sem repetir', async () => {
    const topicos = vi
      .fn<PortaDeForum['listarTopicosDoAutor']>()
      .mockResolvedValueOnce(pagina([topicoDoAutor('1'), topicoDoAutor('2')], cursor1))
      // O servidor devolve o 2 de novo (alguém abriu tópico no meio): a linha existente fica onde está.
      .mockResolvedValueOnce(pagina([topicoDoAutor('2'), topicoDoAutor('3'), topicoDoAutor('4')], cursor2))
      .mockResolvedValueOnce(pagina([topicoDoAutor('5')]));
    abrir({ topicos });
    await screen.findByRole('link', { name: 'Tópico 1' });

    fireEvent.click(screen.getByRole('button', { name: 'Ver mais tópicos' }));
    await screen.findByRole('link', { name: 'Tópico 3' });
    expect(topicos).toHaveBeenNthCalledWith(2, 'betao', { limite: 30, cursor: cursor1 });
    expect((topicos.mock.calls[1][1] as { cursor: CursorDoForum }).cursor.valor).toBe('2026-10-19T12:00:00.123456+00:00');
    expect(screen.getAllByRole('link', { name: /^Tópico \d$/ }).map((l) => l.textContent)).toEqual([
      'Tópico 1',
      'Tópico 2',
      'Tópico 3',
      'Tópico 4',
    ]);
    // O foco vai ao primeiro item novo e o status diz quantos chegaram.
    expect(document.activeElement).toBe(screen.getByRole('link', { name: 'Tópico 3' }));
    await waitFor(() => expect(screen.getByRole('status').textContent).toBe('Mais 2 tópicos carregados'));

    fireEvent.click(screen.getByRole('button', { name: 'Ver mais tópicos' }));
    await screen.findByRole('link', { name: 'Tópico 5' });
    expect(topicos).toHaveBeenNthCalledWith(3, 'betao', { limite: 30, cursor: cursor2 });
    // Página que veio menor: sem botão e sem frase de "fim".
    expect(screen.queryByRole('button', { name: /ver mais/i })).toBeNull();
    expect(screen.queryByText(/fim|acabou|só isso/i)).toBeNull();
  });

  it('nas respostas também: cursor intacto e botão "Ver mais respostas"', async () => {
    const respostas = vi
      .fn<PortaDeForum['listarRespostasDoAutor']>()
      .mockResolvedValueOnce(pagina([respostaDoAutor('1')], cursor1))
      .mockResolvedValueOnce(pagina([respostaDoAutor('2')]));
    abrir({ entrada: '/u/betao?aba=respostas', respostas });
    await screen.findByRole('link', { name: /Em: .* 1$/ });
    fireEvent.click(screen.getByRole('button', { name: 'Ver mais respostas' }));
    await screen.findByRole('link', { name: /Em: .* 2$/ });
    expect(respostas).toHaveBeenNthCalledWith(2, 'betao', { limite: 30, cursor: cursor1 });
    await waitFor(() => expect(screen.getByRole('status').textContent).toBe('Mais 1 respostas carregados'));
  });

  it('durante a busca o botão fica "Carregando…" e desabilitado; clique duplo pede uma vez só', async () => {
    let soltar: (p: Pagina<TopicoDoAutor>) => void = () => undefined;
    const topicos = vi
      .fn<PortaDeForum['listarTopicosDoAutor']>()
      .mockResolvedValueOnce(pagina([topicoDoAutor('1')], cursor1))
      .mockImplementationOnce(
        () =>
          new Promise((r) => {
            soltar = r;
          }),
      );
    abrir({ topicos });
    fireEvent.click(await screen.findByRole('button', { name: 'Ver mais tópicos' }));
    const botao = await screen.findByRole('button', { name: 'Carregando…' });
    expect((botao as HTMLButtonElement).disabled).toBe(true);
    expect(botao.getAttribute('aria-busy')).toBe('true');
    fireEvent.click(botao);
    expect(topicos).toHaveBeenCalledTimes(2);
    await act(async () => soltar(pagina([topicoDoAutor('2')])));
    await screen.findByRole('link', { name: 'Tópico 2' });
  });

  it('falha no "Ver mais" mantém o que está na tela, avisa no botão e deixa tentar de novo com o mesmo cursor', async () => {
    const topicos = vi
      .fn<PortaDeForum['listarTopicosDoAutor']>()
      .mockResolvedValueOnce(pagina([topicoDoAutor('1')], cursor1))
      .mockResolvedValueOnce({ ok: false, motivo: 'falhou' })
      .mockResolvedValueOnce(pagina([topicoDoAutor('2')]));
    abrir({ topicos });
    fireEvent.click(await screen.findByRole('button', { name: 'Ver mais tópicos' }));
    const botao = await screen.findByRole('button', { name: 'Não deu pra carregar mais. Tentar de novo' });
    expect(screen.getByRole('link', { name: 'Tópico 1' })).toBeDefined();
    expect(screen.queryByRole('alert')).toBeNull();
    fireEvent.click(botao);
    await screen.findByRole('link', { name: 'Tópico 2' });
    expect(topicos).toHaveBeenNthCalledWith(3, 'betao', { limite: 30, cursor: cursor1 });
    expect(screen.getByRole('link', { name: 'Tópico 1' })).toBeDefined();
  });
});

describe('erro nunca vira lista vazia', () => {
  const textoDeVazio = /ainda não (abriu|respondeu)|Você ainda não/;

  it.each([
    ['resultado ok:false (HINT inesperado)', async () => ({ ok: false as const, motivo: 'falhou' as const })],
    ['servidor sem configuração', async () => ({ ok: false as const, motivo: 'semServidor' as const })],
    [
      'promessa rejeitada',
      async (): Promise<never> => {
        throw new Error('rede caiu');
      },
    ],
  ])('aba Tópicos, %s: estado de erro com "Tentar de novo", sem texto de vazio', async (_nome, falha) => {
    const topicos = vi.fn(falha as PortaDeForum['listarTopicosDoAutor']);
    abrir({ topicos });
    const alerta = await screen.findByRole('alert');
    expect(alerta.textContent).toContain('Deu ruim pra carregar.');
    expect(alerta.textContent).toContain('Nada foi perdido. Tenta de novo.');
    expect(screen.getByRole('button', { name: 'Tentar de novo' })).toBeDefined();
    expect(screen.queryByText(textoDeVazio)).toBeNull();
    expect(screen.queryByRole('list')).toBeNull();
  });

  it('aba Respostas: mesma regra', async () => {
    abrir({
      entrada: '/u/betao?aba=respostas',
      respostas: vi.fn(async () => ({ ok: false as const, motivo: 'falhou' as const })),
    });
    const alerta = await screen.findByRole('alert');
    expect(alerta.textContent).toContain('Deu ruim pra carregar.');
    expect(screen.queryByText(textoDeVazio)).toBeNull();
  });

  it('"Tentar de novo" refaz só a leitura que falhou, sem recarregar a página', async () => {
    const topicos = vi
      .fn<PortaDeForum['listarTopicosDoAutor']>()
      .mockResolvedValueOnce({ ok: false, motivo: 'falhou' })
      .mockResolvedValueOnce(pagina([topicoDoAutor('1')]));
    const { forum } = abrir({ topicos });
    fireEvent.click(await screen.findByRole('button', { name: 'Tentar de novo' }));
    await screen.findByRole('link', { name: 'Tópico 1' });
    expect(topicos).toHaveBeenCalledTimes(2);
    expect(forum.listarRespostasDoAutor).not.toHaveBeenCalled();
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('sem internet o erro diz isso, a faixa aparece e, ao voltar, a internet volta anunciada', async () => {
    const { ambiente } = abrir({ online: false, topicos: vi.fn(async () => ({ ok: false as const, motivo: 'falhou' as const })) });
    const alerta = await screen.findByRole('alert');
    expect(alerta.textContent).toContain('Sem internet.');
    expect(alerta.textContent).toContain('Confere a conexão e tenta de novo.');
    expect(screen.getByText(/Dá pra ler o que já abriu/)).toBeDefined();
    act(() => ambiente.mudarConectividade(true));
    await waitFor(() => expect(screen.queryByText(/Dá pra ler o que já abriu/)).toBeNull());
    expect(screen.getByRole('status').textContent).toBe('A internet voltou.');
  });
});

describe('vazio de verdade (o servidor respondeu e não há nada)', () => {
  const vazia = async () => pagina<never>([]);

  it('Tópicos, outra pessoa: só o título, sem botão', async () => {
    abrir({ topicos: vi.fn(vazia) });
    expect(await screen.findByRole('heading', { name: '@betao ainda não abriu nenhum tópico.' })).toBeDefined();
    expect(screen.queryByRole('link', { name: 'Ver comunidades' })).toBeNull();
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('Tópicos, o próprio: título, apoio e "Ver comunidades"', async () => {
    abrir({ topicos: vi.fn(vazia), souEu: true });
    expect(await screen.findByRole('heading', { name: 'Você ainda não abriu nenhum tópico.' })).toBeDefined();
    expect(screen.getByText('Entra numa comunidade e começa uma conversa.')).toBeDefined();
    expect(screen.getByRole('link', { name: 'Ver comunidades' }).getAttribute('href')).toBe('/comunidades');
  });

  it('Respostas, outra pessoa', async () => {
    abrir({ entrada: '/u/betao?aba=respostas', respostas: vi.fn(vazia) });
    expect(await screen.findByRole('heading', { name: '@betao ainda não respondeu em nenhum tópico.' })).toBeDefined();
    expect(screen.queryByRole('link', { name: 'Ver comunidades' })).toBeNull();
  });

  it('Respostas, o próprio', async () => {
    abrir({ entrada: '/u/betao?aba=respostas', respostas: vi.fn(vazia), souEu: true });
    expect(await screen.findByRole('heading', { name: 'Você ainda não respondeu em nenhum tópico.' })).toBeDefined();
    expect(screen.getByText('Abre um tópico e entra na conversa.')).toBeDefined();
    expect(screen.getByRole('link', { name: 'Ver comunidades' }).getAttribute('href')).toBe('/comunidades');
  });
});
