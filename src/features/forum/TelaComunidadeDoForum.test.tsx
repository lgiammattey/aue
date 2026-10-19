// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import type { CursorDeTopicos, PortaDeForum, TopicoDoForum } from '../../portas/forum';
import { limparListasVistas } from './hooks';
import {
  Rotas,
  ambienteFalso,
  comunidade,
  comunidadeFalsa,
  contaFalsa,
  forumFalso,
  sondas,
  topico,
} from './dublesParaTeste';

beforeEach(limparListasVistas);
afterEach(cleanup);

const T = (n: number, extra: Partial<TopicoDoForum> = {}) =>
  topico({ id: `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`, titulo: `Tópico ${n}`, ...extra });

function forumDa(comunidadeDoServidor: ReturnType<typeof comunidade> | null, listar: PortaDeForum['listarTopicos']) {
  return forumFalso({
    obterComunidadeDoForum: vi.fn(async () => ({ ok: true as const, valor: comunidadeDoServidor })),
    listarTopicos: listar,
  });
}

const pagina = (itens: TopicoDoForum[], proximo: CursorDeTopicos | null = null) => ({
  ok: true as const,
  valor: { itens, proximo },
});

function abrir(forum: PortaDeForum, entrada = '/c/reuniao-da-firma', extra = {}) {
  render(<Rotas entrada={entrada} m={{ forum, ...extra }} />);
}

describe('/c/:slug: comunidade e lista de tópicos', () => {
  it('mostra o cabeçalho com os números do servidor e só os tópicos DESTA comunidade', async () => {
    const listar = vi.fn(async () => pagina([T(1, { respostasTotal: 8 }), T(2, { fixado: true, status: 'fechado' })]));
    abrir(forumDa(comunidade({ topicosTotal: 12, membrosTotal: 34 }), listar));

    expect(await screen.findByRole('heading', { level: 1, name: 'Na reunião da firma' })).toBeDefined();
    expect(screen.getByText('A culpa jogada no ar condicionado.')).toBeDefined();
    expect(screen.getByText('12 tópicos · 34 membros')).toBeDefined();
    expect(await screen.findByRole('link', { name: 'Tópico 1' })).toBeDefined();
    expect(listar).toHaveBeenCalledWith('reuniao-da-firma', expect.objectContaining({ ordem: 'atividade', limite: 30, cursor: null }));

    const linha1 = screen.getByRole('link', { name: 'Tópico 1' });
    expect(linha1.getAttribute('href')).toBe('/c/reuniao-da-firma/t/00000000-0000-4000-8000-000000000001');
    expect(linha1.closest('li')!.textContent).toContain('Ana Souza · 8 respostas · atividade há 3 h');
    const linha2 = screen.getByRole('link', { name: 'Tópico 2' }).closest('li')!;
    expect(linha2.textContent).toContain('Fixado');
    expect(linha2.textContent).toContain('Fechado');
    expect(linha2.textContent).toContain('Sem respostas · há 3 d');
  });

  it('o título da aba é "{Comunidade} · Auê!" e o foco vai ao H1', async () => {
    const ambiente = ambienteFalso();
    abrir(forumDa(comunidade(), vi.fn(async () => pagina([T(1)]))), '/c/reuniao-da-firma', { ambiente });
    const h1 = await screen.findByRole('heading', { level: 1 });
    expect(ambiente.titulo).toBe('Na reunião da firma · Auê!');
    await waitFor(() => expect(document.activeElement).toBe(h1));
  });

  it('slug que o servidor não conhece: "não existe", sem lista e sem chamar listarTopicos', async () => {
    const listar = vi.fn(async () => pagina([T(1)]));
    abrir(forumDa(null, listar), '/c/slug-inexistente');
    expect(await screen.findByText('Essa comunidade não existe.')).toBeDefined();
    expect(screen.getByText('Confere o endereço ou procura outra turma.')).toBeDefined();
    expect(screen.getByRole('link', { name: 'Ver comunidades' }).getAttribute('href')).toBe('/comunidades');
    expect(listar).not.toHaveBeenCalled();
    expect(screen.queryByText('Nenhum tópico ainda.')).toBeNull();
    expect(screen.queryByRole('link', { name: 'Tópico 1' })).toBeNull();
  });

  it('o slug da URL é o que vai ao servidor, sem cair em outra comunidade', async () => {
    const obter = vi.fn(async () => ({ ok: true as const, valor: null }));
    abrir(forumFalso({ obterComunidadeDoForum: obter }), '/c/reuniao-da-firma-2');
    await screen.findByText('Essa comunidade não existe.');
    expect(obter).toHaveBeenCalledWith('reuniao-da-firma-2');
  });

  it('falha ao ler a comunidade é erro de tela com Tentar de novo (não "não existe")', async () => {
    const obter = vi
      .fn()
      .mockResolvedValueOnce({ ok: false, motivo: 'falhou' })
      .mockResolvedValueOnce({ ok: true, valor: comunidade() });
    abrir(forumFalso({ obterComunidadeDoForum: obter, listarTopicos: vi.fn(async () => pagina([T(1)])) }));
    const alerta = await screen.findByRole('alert');
    expect(alerta.textContent).toContain('Deu ruim pra carregar a comunidade.');
    expect(screen.queryByText('Essa comunidade não existe.')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Tentar de novo' }));
    expect(await screen.findByRole('link', { name: 'Tópico 1' })).toBeDefined();
  });

  it('comunidade sem tópico: estado vazio, sem botão de escrita, sem erro', async () => {
    abrir(forumDa(comunidade({ topicosTotal: 0 }), vi.fn(async () => pagina([]))));
    expect(await screen.findByText('Nenhum tópico ainda.')).toBeDefined();
    expect(screen.queryByRole('alert')).toBeNull();
    expect(screen.queryByRole('button', { name: /novo tópico|participar|entrar na/i })).toBeNull();
  });

  it('erro na lista NUNCA vira "ninguém postou": o cabeçalho fica e só a área da lista erra, com retry', async () => {
    const listar = vi
      .fn()
      .mockResolvedValueOnce({ ok: false, motivo: 'falhou' })
      .mockResolvedValueOnce(pagina([T(1)]));
    abrir(forumDa(comunidade(), listar));
    const alerta = await screen.findByRole('alert');
    expect(alerta.textContent).toContain('Deu ruim pra carregar os tópicos.');
    expect(screen.getByRole('heading', { level: 1, name: 'Na reunião da firma' })).toBeDefined();
    expect(screen.queryByText('Nenhum tópico ainda.')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Tentar de novo' }));
    expect(await screen.findByRole('link', { name: 'Tópico 1' })).toBeDefined();
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it.each(['cursorInvalido', 'ordemInvalida', 'semServidor', 'comunidadeInexistente'] as const)(
    'motivo %s na lista também é erro, nunca vazio',
    async (motivo) => {
      abrir(forumDa(comunidade(), vi.fn(async () => ({ ok: false as const, motivo }))));
      expect((await screen.findByRole('alert')).textContent).toContain('Deu ruim pra carregar os tópicos.');
      expect(screen.queryByText('Nenhum tópico ainda.')).toBeNull();
    },
  );

  it('sem internet, o erro da lista diz isso', async () => {
    abrir(
      forumDa(comunidade(), vi.fn(async () => ({ ok: false as const, motivo: 'falhou' as const }))),
      '/c/reuniao-da-firma',
      { ambiente: ambienteFalso({ online: false }) },
    );
    expect((await screen.findByRole('alert')).textContent).toContain('Sem internet.');
  });

  it('o corpo do tópico não entra na linha da lista', async () => {
    abrir(forumDa(comunidade(), vi.fn(async () => pagina([T(1, { corpo: 'SEGREDO DO CORPO' })]))));
    await screen.findByRole('link', { name: 'Tópico 1' });
    expect(screen.queryByText(/SEGREDO DO CORPO/)).toBeNull();
  });

  it('texto do usuário é texto, nunca HTML', async () => {
    abrir(forumDa(comunidade(), vi.fn(async () => pagina([T(1, { titulo: '<img src=x onerror=alert(1)> oi' })]))));
    const link = await screen.findByRole('link', { name: /oi/ });
    expect(link.textContent).toBe('<img src=x onerror=alert(1)> oi');
    expect(document.querySelector('main img')).toBeNull();
  });

  it('membro vê "Você participa" (e nunca um botão); o bonde-geral conta como dela para conta promovida', async () => {
    abrir(forumDa(comunidade({ slug: 'bonde-geral', nome: 'Bonde Geral', souMembro: false }), vi.fn(async () => pagina([T(1)]))), '/c/bonde-geral', {
      conta: contaFalsa({ temSessao: true, anonima: false }),
      comunidade: comunidadeFalsa(['bonde-geral']),
    });
    await screen.findByRole('link', { name: 'Tópico 1' });
    await screen.findByText('Você participa');
    expect(screen.queryByRole('button', { name: /participar|entrar|sair/i })).toBeNull();
  });

  it('visitante e não-membro não veem "Você participa"', async () => {
    abrir(forumDa(comunidade(), vi.fn(async () => pagina([T(1)]))));
    await screen.findByRole('link', { name: 'Tópico 1' });
    expect(screen.queryByText('Você participa')).toBeNull();
  });

  it('regras da casa existem no miolo e no aside, rotuladas como da casa', async () => {
    abrir(forumDa(comunidade(), vi.fn(async () => pagina([T(1)]))));
    await screen.findByRole('link', { name: 'Tópico 1' });
    expect(screen.getAllByText('A piada é com o arroto, nunca com a pessoa.').length).toBe(2);
    expect(screen.getAllByText(/Regras da casa/).length).toBeGreaterThanOrEqual(2);
  });
});

describe('ordenação pela URL', () => {
  it('padrão é atividade recente; ?ordem=novos vai ao servidor como recentes e marca o botão', async () => {
    const listar = vi.fn(async () => pagina([T(1)]));
    abrir(forumDa(comunidade(), listar), '/c/reuniao-da-firma?ordem=novos');
    await screen.findByRole('link', { name: 'Tópico 1' });
    expect(listar).toHaveBeenCalledWith('reuniao-da-firma', expect.objectContaining({ ordem: 'recentes' }));
    expect(screen.getByRole('button', { name: 'Novos' }).getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByRole('button', { name: 'Atividade recente' }).getAttribute('aria-pressed')).toBe('false');
  });

  it('valor estranho na URL cai em atividade', async () => {
    const listar = vi.fn(async () => pagina([T(1)]));
    abrir(forumDa(comunidade(), listar), '/c/reuniao-da-firma?ordem=qualquer');
    await screen.findByRole('link', { name: 'Tópico 1' });
    expect(listar).toHaveBeenCalledWith('reuniao-da-firma', expect.objectContaining({ ordem: 'atividade' }));
  });

  it('trocar a ordem recarrega do começo, põe na URL e leva o foco ao primeiro item', async () => {
    const listar = vi.fn(async (_slug: string, op?: { ordem?: string }) =>
      pagina(op?.ordem === 'recentes' ? [T(9)] : [T(1)]),
    );
    abrir(forumDa(comunidade(), listar as PortaDeForum['listarTopicos']));
    await screen.findByRole('link', { name: 'Tópico 1' });
    fireEvent.click(screen.getByRole('button', { name: 'Novos' }));
    const novo = await screen.findByRole('link', { name: 'Tópico 9' });
    expect(screen.queryByRole('link', { name: 'Tópico 1' })).toBeNull();
    expect(sondas.caminho).toBe('/c/reuniao-da-firma?ordem=novos');
    await waitFor(() => expect(document.activeElement).toBe(novo));
    fireEvent.click(screen.getByRole('button', { name: 'Atividade recente' }));
    await screen.findByRole('link', { name: 'Tópico 1' });
    expect(sondas.caminho).toBe('/c/reuniao-da-firma');
  });
});

describe('"Ver mais tópicos" por cursor', () => {
  const CURSOR: CursorDeTopicos = { valor: '2026-10-19T14:32:10.123456+00:00', id: '00000000-0000-4000-8000-000000000002', fixado: false };

  it('manda ao servidor o cursor EXATAMENTE como veio (microssegundo), junta por id e some quando acaba', async () => {
    const listar = vi
      .fn()
      .mockResolvedValueOnce(pagina([T(1), T(2)], CURSOR))
      // o servidor repete o 2 (alguém abriu tópico novo no meio da leitura) e traz o 3
      .mockResolvedValueOnce(pagina([T(2), T(3)], null));
    abrir(forumDa(comunidade(), listar));
    await screen.findByRole('link', { name: 'Tópico 1' });

    fireEvent.click(screen.getByRole('button', { name: 'Ver mais tópicos' }));
    await screen.findByRole('link', { name: 'Tópico 3' });

    expect(listar).toHaveBeenNthCalledWith(2, 'reuniao-da-firma', expect.objectContaining({ cursor: CURSOR }));
    expect(listar.mock.calls[1][1].cursor).toBe(CURSOR);
    expect(listar.mock.calls[1][1].cursor.valor).toBe('2026-10-19T14:32:10.123456+00:00');

    const titulos = screen.getAllByRole('link', { name: /^Tópico \d$/ }).map((l) => l.textContent);
    expect(titulos).toEqual(['Tópico 1', 'Tópico 2', 'Tópico 3']);
    expect(screen.queryByRole('button', { name: /ver mais/i })).toBeNull();
    await waitFor(() => expect(within(screen.getByRole('status')).getByText('Mais 1 tópicos carregados')).toBeDefined());
  });

  it('o foco vai ao primeiro item NOVO', async () => {
    const listar = vi
      .fn()
      .mockResolvedValueOnce(pagina([T(1)], CURSOR))
      .mockResolvedValueOnce(pagina([T(2), T(3)], null));
    abrir(forumDa(comunidade(), listar));
    await screen.findByRole('link', { name: 'Tópico 1' });
    fireEvent.click(screen.getByRole('button', { name: 'Ver mais tópicos' }));
    const novo = await screen.findByRole('link', { name: 'Tópico 2' });
    await waitFor(() => expect(document.activeElement).toBe(novo));
  });

  it('"Carregando…" desabilita o botão e o segundo toque é ignorado', async () => {
    let resolver!: (v: unknown) => void;
    const listar = vi
      .fn()
      .mockResolvedValueOnce(pagina([T(1)], CURSOR))
      .mockImplementationOnce(() => new Promise((r) => (resolver = r)));
    abrir(forumDa(comunidade(), listar as PortaDeForum['listarTopicos']));
    await screen.findByRole('link', { name: 'Tópico 1' });
    const botao = screen.getByRole('button', { name: 'Ver mais tópicos' });
    fireEvent.click(botao);
    fireEvent.click(botao);
    const ocupado = await screen.findByRole('button', { name: 'Carregando…' });
    expect((ocupado as HTMLButtonElement).disabled).toBe(true);
    expect(ocupado.getAttribute('aria-busy')).toBe('true');
    expect(listar).toHaveBeenCalledTimes(2);
    await act(async () => resolver(pagina([T(2)], null)));
    expect(await screen.findByRole('link', { name: 'Tópico 2' })).toBeDefined();
  });

  it('falha no "Ver mais" mantém os itens e oferece tentar de novo no próprio botão', async () => {
    const listar = vi
      .fn()
      .mockResolvedValueOnce(pagina([T(1)], CURSOR))
      .mockResolvedValueOnce({ ok: false, motivo: 'falhou' })
      .mockResolvedValueOnce(pagina([T(2)], null));
    abrir(forumDa(comunidade(), listar));
    await screen.findByRole('link', { name: 'Tópico 1' });
    fireEvent.click(screen.getByRole('button', { name: 'Ver mais tópicos' }));
    const falhou = await screen.findByRole('button', { name: 'Não deu pra carregar mais. Tentar de novo' });
    expect(screen.getByRole('link', { name: 'Tópico 1' })).toBeDefined();
    expect(screen.queryByRole('alert')).toBeNull();
    fireEvent.click(falhou);
    expect(await screen.findByRole('link', { name: 'Tópico 2' })).toBeDefined();
    expect(listar.mock.calls[2][1].cursor).toBe(CURSOR);
  });

  it('página menor que o limite (proximo nulo) não mostra botão nem frase de fim', async () => {
    abrir(forumDa(comunidade(), vi.fn(async () => pagina([T(1)], null))));
    await screen.findByRole('link', { name: 'Tópico 1' });
    expect(screen.queryByRole('button', { name: /ver mais/i })).toBeNull();
  });
});

describe('voltar da conversa para a lista (#234)', () => {
  it('restaura a lista já carregada, a ordem e a rolagem, sem refazer as chamadas', async () => {
    const CURSOR: CursorDeTopicos = { valor: '2026-10-19T14:32:10.123456+00:00', id: 'x', fixado: false };
    const listar = vi
      .fn()
      .mockResolvedValueOnce(pagina([T(1)], CURSOR))
      .mockResolvedValueOnce(pagina([T(2)], null));
    const ambiente = ambienteFalso();
    abrir(forumDa(comunidade(), listar), '/c/reuniao-da-firma?ordem=novos', { ambiente });
    await screen.findByRole('link', { name: 'Tópico 1' });
    fireEvent.click(screen.getByRole('button', { name: 'Ver mais tópicos' }));
    await screen.findByRole('link', { name: 'Tópico 2' });
    ambiente.rolarAte(640);
    // Na saída o documento encolhe e a posição do navegador cai para 0 sem evento:
    // ler a rolagem só no cleanup guardaria 0 em vez dos 640 que o evento já viu.
    ambiente.encolherDocumento();
    expect(ambiente.y).toBe(0);

    // abre a conversa (a leitura do tópico falha de propósito: só interessa sair da lista)
    await act(async () => {
      sondas.navegar!('/c/reuniao-da-firma/t/00000000-0000-4000-8000-000000000002');
    });
    expect(screen.queryByRole('link', { name: 'Tópico 1' })).toBeNull();
    ambiente.rolagens.length = 0;
    await act(async () => {
      sondas.navegar!(-1);
    });
    expect(await screen.findByRole('link', { name: 'Tópico 1' })).toBeDefined();
    expect(screen.getByRole('link', { name: 'Tópico 2' })).toBeDefined();
    expect(sondas.caminho).toBe('/c/reuniao-da-firma?ordem=novos');
    expect(screen.getByRole('button', { name: 'Novos' }).getAttribute('aria-pressed')).toBe('true');
    expect(listar).toHaveBeenCalledTimes(2);
    expect(ambiente.rolagens).toContain(640);
  });
});

describe('deep link e URL que manda', () => {
  it('duas comunidades, dois endereços, duas listas', async () => {
    const forum = forumFalso({
      obterComunidadeDoForum: vi.fn(async (slug: string) => ({
        ok: true as const,
        valor: comunidade({ slug, nome: slug === 'a' ? 'Turma A' : 'Turma B' }),
      })),
      listarTopicos: vi.fn(async (slug: string) => pagina([T(slug === 'a' ? 1 : 2, { titulo: `Só da ${slug}` })])),
    });
    abrir(forum, '/c/a');
    expect(await screen.findByRole('link', { name: 'Só da a' })).toBeDefined();
    expect(screen.queryByRole('link', { name: 'Só da b' })).toBeNull();
    cleanup();
    abrir(forum, '/c/b');
    expect(await screen.findByRole('link', { name: 'Só da b' })).toBeDefined();
    expect(screen.queryByRole('link', { name: 'Só da a' })).toBeNull();
  });
});
