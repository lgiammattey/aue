// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { PortaDeForum } from '../../portas/forum';
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

const CONTA = { temSessao: true, anonima: false, podeParticiparSocialmente: true } as const;

interface Cenario {
  readonly slug?: string;
  readonly souMembro?: boolean;
  readonly membrosTotal?: number;
  readonly conta?: Parameters<typeof contaFalsa>[0];
  readonly slugsDaConta?: readonly string[];
  readonly porta?: ReturnType<typeof comunidadeFalsa>;
  readonly topicos?: ReturnType<typeof topico>[];
  readonly ambiente?: ReturnType<typeof ambienteFalso>;
  readonly entrada?: string;
}

function abrir(c: Cenario = {}) {
  const slug = c.slug ?? 'reuniao-da-firma';
  const porta = c.porta ?? comunidadeFalsa(c.slugsDaConta ?? []);
  // O servidor "responde" o que a leitura trouxe: cada leitura vê o `membrosTotal` do momento.
  let membros = c.membrosTotal ?? 34;
  const obter = vi.fn(async () => ({
    ok: true as const,
    valor: comunidade({ slug, souMembro: c.souMembro ?? false, membrosTotal: membros }),
  }));
  const forum: PortaDeForum = forumFalso({
    obterComunidadeDoForum: obter,
    listarTopicos: vi.fn(async () => ({ ok: true as const, valor: { itens: c.topicos ?? [], proximo: null } })),
  });
  render(
    <Rotas
      entrada={c.entrada ?? `/c/${slug}`}
      m={{ forum, conta: contaFalsa(c.conta ?? CONTA), comunidade: porta, ambiente: c.ambiente }}
    />,
  );
  return { forum, porta, obter, definirMembros: (n: number) => (membros = n) };
}

describe('visitante: convite no lugar da ação', () => {
  it('vê "Criar conta para participar" e "Já tenho conta", ambos levando de volta à comunidade; nenhum botão que falha', async () => {
    abrir({ conta: { temSessao: false, anonima: false } });
    const criar = await screen.findByRole('link', { name: 'Criar conta para participar' });
    expect(criar.getAttribute('href')).toBe(`/login?modo=cadastro&volta=${encodeURIComponent('/c/reuniao-da-firma')}`);
    const entrar = screen.getByRole('link', { name: 'Já tenho conta' });
    expect(entrar.getAttribute('href')).toBe(`/login?volta=${encodeURIComponent('/c/reuniao-da-firma')}`);
    expect(screen.queryByRole('button', { name: /Participar|Novo tópico|Sair/ })).toBeNull();
    expect(screen.queryByRole('link', { name: 'Novo tópico' })).toBeNull();
  });

  it('o convite guarda a ordem escolhida na volta', async () => {
    abrir({ conta: { temSessao: false, anonima: false }, entrada: '/c/reuniao-da-firma?ordem=novos' });
    const criar = await screen.findByRole('link', { name: 'Criar conta para participar' });
    expect(decodeURIComponent(criar.getAttribute('href')!)).toContain('volta=/c/reuniao-da-firma?ordem=novos');
  });

  it('sessão de convidado (anônima) é visitante', async () => {
    abrir({ conta: { temSessao: true, anonima: true } });
    expect(await screen.findByRole('link', { name: 'Criar conta para participar' })).toBeDefined();
  });

  it('conta sem promoção (podeParticiparSocialmente falso) vê o convite, não um erro', async () => {
    abrir({ conta: { temSessao: true, anonima: false, podeParticiparSocialmente: false } });
    expect(await screen.findByRole('link', { name: 'Criar conta para participar' })).toBeDefined();
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('só um verde por estado: o convite é o único botão de acento', async () => {
    abrir({ conta: { temSessao: false, anonima: false } });
    await screen.findByRole('link', { name: 'Criar conta para participar' });
    expect(document.querySelectorAll('.forum-botao--acento').length).toBe(1);
  });

  it('não se sabe quem é (a conta não respondeu): nenhum convite de visitante e nenhuma ação', async () => {
    abrir({ conta: 'quebrada' });
    await screen.findByRole('heading', { level: 1, name: 'Na reunião da firma' });
    expect(screen.queryByRole('link', { name: /Criar conta/ })).toBeNull();
    expect(screen.queryByRole('button', { name: /Participar/ })).toBeNull();
    expect(screen.queryByRole('link', { name: 'Novo tópico' })).toBeNull();
  });
});

describe('conta que ainda não participa: "Participar"', () => {
  it('mostra o botão e nenhum "Novo tópico"; um verde só', async () => {
    abrir();
    expect(await screen.findByRole('button', { name: 'Participar' })).toBeDefined();
    expect(screen.queryByRole('link', { name: 'Novo tópico' })).toBeNull();
    expect(screen.queryByText('Você participa')).toBeNull();
    expect(document.querySelectorAll('.forum-botao--acento').length).toBe(1);
  });

  it('só vira "Novo tópico" DEPOIS de o servidor dizer true, com o foco no botão novo e o status falado', async () => {
    let responder!: (ok: boolean) => void;
    const porta = comunidadeFalsa([], { entrarComunidade: () => new Promise<boolean>((r) => (responder = r)) });
    abrir({ porta });
    fireEvent.click(await screen.findByRole('button', { name: 'Participar' }));
    // Sem otimismo: enquanto o servidor não respondeu, nada mudou.
    expect(screen.getByRole('button', { name: 'Entrando…' }).getAttribute('aria-disabled')).toBe('true');
    expect(screen.queryByRole('link', { name: 'Novo tópico' })).toBeNull();
    expect(screen.queryByText('Você participa')).toBeNull();

    await act(async () => responder(true));
    const novo = await screen.findByRole('link', { name: 'Novo tópico' });
    expect(porta.entrarComunidade).toHaveBeenCalledWith('reuniao-da-firma');
    expect(screen.getByText('Você participa')).toBeDefined();
    expect(screen.getByRole('button', { name: 'Sair da comunidade' })).toBeDefined();
    await waitFor(() => expect(document.activeElement).toBe(novo));
    expect(screen.getByRole('status').textContent).toBe('Você entrou em Na reunião da firma.');
  });

  it('o número de membros vem do servidor (lê de novo), não é somado no cliente', async () => {
    const porta = comunidadeFalsa([]);
    const { obter, definirMembros } = abrir({ porta, membrosTotal: 34 });
    expect(await screen.findByText('12 tópicos · 34 membros')).toBeDefined();
    definirMembros(35);
    fireEvent.click(screen.getByRole('button', { name: 'Participar' }));
    expect(await screen.findByText('12 tópicos · 35 membros')).toBeDefined();
    expect(obter.mock.calls.length).toBeGreaterThanOrEqual(2);
  });

  it('a leitura de atualização não derruba a tela para "carregando" (a lista e o cabeçalho ficam)', async () => {
    abrir({ topicos: [topico({ id: '11111111-1111-4111-8111-111111111111', titulo: 'Fica na tela' })] });
    await screen.findByRole('link', { name: 'Fica na tela' });
    fireEvent.click(screen.getByRole('button', { name: 'Participar' }));
    await screen.findByRole('link', { name: 'Novo tópico' });
    expect(screen.queryByText('Carregando comunidade')).toBeNull();
    expect(screen.getByRole('link', { name: 'Fica na tela' })).toBeDefined();
  });

  it('falha ao entrar: frase honesta, continua "Participar", nada de membro', async () => {
    const porta = comunidadeFalsa([], { entrarComunidade: async () => false });
    abrir({ porta });
    fireEvent.click(await screen.findByRole('button', { name: 'Participar' }));
    const alerta = await screen.findByRole('alert');
    expect(alerta.textContent).toBe('Não deu pra entrar agora. Tenta de novo.');
    expect(screen.getByRole('button', { name: 'Participar' })).toBeDefined();
    expect(screen.queryByRole('link', { name: 'Novo tópico' })).toBeNull();
    expect(screen.queryByText('Você participa')).toBeNull();
  });

  it('exceção da porta também é falha (não sucesso)', async () => {
    const porta = comunidadeFalsa([], {
      entrarComunidade: async () => {
        throw new Error('rede');
      },
    });
    abrir({ porta });
    fireEvent.click(await screen.findByRole('button', { name: 'Participar' }));
    expect((await screen.findByRole('alert')).textContent).toContain('Não deu pra entrar agora');
    expect(screen.queryByText('Você participa')).toBeNull();
  });

  it('duplo toque chama o servidor uma vez só', async () => {
    let responder!: (ok: boolean) => void;
    const porta = comunidadeFalsa([], { entrarComunidade: () => new Promise<boolean>((r) => (responder = r)) });
    abrir({ porta });
    const botao = await screen.findByRole('button', { name: 'Participar' });
    fireEvent.click(botao);
    fireEvent.click(botao);
    fireEvent.click(screen.getByRole('button', { name: 'Entrando…' }));
    expect(porta.entrarComunidade).toHaveBeenCalledTimes(1);
    await act(async () => responder(true));
    await screen.findByRole('link', { name: 'Novo tópico' });
    expect(porta.entrarComunidade).toHaveBeenCalledTimes(1);
  });

  it('tentar de novo depois da falha chama outra vez e funciona', async () => {
    const entrar = vi.fn<(slug: string) => Promise<boolean>>().mockResolvedValueOnce(false).mockResolvedValueOnce(true);
    abrir({ porta: comunidadeFalsa([], { entrarComunidade: entrar }) });
    fireEvent.click(await screen.findByRole('button', { name: 'Participar' }));
    await screen.findByRole('alert');
    fireEvent.click(screen.getByRole('button', { name: 'Participar' }));
    await screen.findByRole('link', { name: 'Novo tópico' });
    expect(entrar).toHaveBeenCalledTimes(2);
    expect(screen.queryByRole('alert')).toBeNull();
  });
});

describe('membro: "Novo tópico" e "Você participa · Sair da comunidade"', () => {
  it('o link "Novo tópico" é um link de verdade para /c/:slug/novo; um verde só', async () => {
    abrir({ souMembro: true, slugsDaConta: ['reuniao-da-firma'] });
    const novo = await screen.findByRole('link', { name: 'Novo tópico' });
    expect(novo.getAttribute('href')).toBe('/c/reuniao-da-firma/novo');
    expect(screen.getByText('Você participa')).toBeDefined();
    expect(document.querySelectorAll('.forum-botao--acento').length).toBe(1);
  });

  it('o link preserva a ordem escolhida (?ordem=novos)', async () => {
    abrir({ souMembro: true, slugsDaConta: ['reuniao-da-firma'], entrada: '/c/reuniao-da-firma?ordem=novos' });
    const novo = await screen.findByRole('link', { name: 'Novo tópico' });
    expect(novo.getAttribute('href')).toBe('/c/reuniao-da-firma/novo?ordem=novos');
  });

  it('Sair: sem confirmação, só muda depois do true, vira "Participar" com o foco nele e avisa "Você saiu de …"', async () => {
    let responder!: (ok: boolean) => void;
    const porta = comunidadeFalsa(['reuniao-da-firma'], { sairComunidade: () => new Promise<boolean>((r) => (responder = r)) });
    abrir({ porta, souMembro: true });
    fireEvent.click(await screen.findByRole('button', { name: 'Sair da comunidade' }));
    expect(screen.getByRole('button', { name: 'Saindo…' }).getAttribute('aria-disabled')).toBe('true');
    expect(screen.getByRole('link', { name: 'Novo tópico' })).toBeDefined(); // ainda membro
    expect(screen.queryByRole('dialog')).toBeNull(); // sem confirmação

    await act(async () => responder(true));
    const participar = await screen.findByRole('button', { name: 'Participar' });
    expect(porta.sairComunidade).toHaveBeenCalledWith('reuniao-da-firma');
    expect(screen.queryByRole('link', { name: 'Novo tópico' })).toBeNull();
    expect(screen.queryByText('Você participa')).toBeNull();
    await waitFor(() => expect(document.activeElement).toBe(participar));
    expect(screen.getByRole('status').textContent).toBe('Você saiu de Na reunião da firma.');
  });

  it('sair vale mesmo com a lista inicial de comunidades velha (a ação da sessão manda)', async () => {
    abrir({ porta: comunidadeFalsa(['reuniao-da-firma']), souMembro: true });
    fireEvent.click(await screen.findByRole('button', { name: 'Sair da comunidade' }));
    expect(await screen.findByRole('button', { name: 'Participar' })).toBeDefined();
  });

  it('falha ao sair: frase honesta e continua membro', async () => {
    abrir({ porta: comunidadeFalsa(['reuniao-da-firma'], { sairComunidade: async () => false }), souMembro: true });
    fireEvent.click(await screen.findByRole('button', { name: 'Sair da comunidade' }));
    expect((await screen.findByRole('alert')).textContent).toBe('Não deu pra sair agora. Tenta de novo.');
    expect(screen.getByRole('link', { name: 'Novo tópico' })).toBeDefined();
    expect(screen.getByText('Você participa')).toBeDefined();
  });

  it('duplo toque em Sair chama o servidor uma vez só', async () => {
    let responder!: (ok: boolean) => void;
    const porta = comunidadeFalsa(['reuniao-da-firma'], { sairComunidade: () => new Promise<boolean>((r) => (responder = r)) });
    abrir({ porta, souMembro: true });
    const botao = await screen.findByRole('button', { name: 'Sair da comunidade' });
    fireEvent.click(botao);
    fireEvent.click(screen.getByRole('button', { name: 'Saindo…' }));
    expect(porta.sairComunidade).toHaveBeenCalledTimes(1);
    await act(async () => responder(true));
    await screen.findByRole('button', { name: 'Participar' });
    expect(porta.sairComunidade).toHaveBeenCalledTimes(1);
  });

  it('sair e entrar de novo: volta a "Novo tópico"', async () => {
    abrir({ porta: comunidadeFalsa(['reuniao-da-firma']), souMembro: true });
    fireEvent.click(await screen.findByRole('button', { name: 'Sair da comunidade' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Participar' }));
    expect(await screen.findByRole('link', { name: 'Novo tópico' })).toBeDefined();
  });
});

describe('Bonde Geral: conta promovida já é membro e não tem botão para sair', () => {
  it('vê "Você participa" e "Novo tópico", nenhum "Participar" nem "Sair da comunidade"', async () => {
    abrir({ slug: 'bonde-geral', souMembro: false, slugsDaConta: ['bonde-geral'] });
    expect(await screen.findByRole('link', { name: 'Novo tópico' })).toBeDefined();
    expect(screen.getByText('Você participa')).toBeDefined();
    expect(screen.queryByRole('button', { name: /Participar|Sair/ })).toBeNull();
  });
});

describe('textos do vazio por papel (spec 8.4)', () => {
  it('membro: aponta para o botão de cima', async () => {
    abrir({ souMembro: true, slugsDaConta: ['reuniao-da-firma'] });
    expect(await screen.findByText('Abre o primeiro. O botão Novo tópico está aí em cima.')).toBeDefined();
  });
  it('conta que não participa: pede para participar', async () => {
    abrir();
    expect(await screen.findByText('Participa da comunidade pra abrir o primeiro.')).toBeDefined();
  });
  it('visitante: pede para criar a conta, sem repetir o botão', async () => {
    abrir({ conta: { temSessao: false, anonima: false } });
    expect(await screen.findByText('Cria sua conta pra abrir o primeiro.')).toBeDefined();
    expect(screen.getAllByRole('link', { name: /Criar conta/ }).length).toBe(1);
  });
});

describe('teclado do celular (spec 4.3 e 4.7)', () => {
  it('a casca marca "teclado aberto" quando um campo ganha o foco e desmarca quando sai', async () => {
    const ambiente = ambienteFalso();
    abrir({ ambiente });
    await screen.findByRole('heading', { level: 1, name: 'Na reunião da firma' });
    const casca = document.querySelector('.forum-shell')!;
    expect(casca.hasAttribute('data-teclado')).toBe(false);
    act(() => ambiente.focarCampo(true));
    expect(casca.getAttribute('data-teclado')).toBe('aberto');
    act(() => ambiente.focarCampo(false));
    // a saída espera um instante (R6): a barra não volta por cima do botão tocado antes do clique
    expect(casca.getAttribute('data-teclado')).toBe('aberto');
    await waitFor(() => expect(casca.hasAttribute('data-teclado')).toBe(false));
  });
});

describe('R6: tocar no botão não perde o clique para a barra inferior', () => {
  it('sair do campo e voltar a um campo em seguida não pisca a barra; só some depois do atraso', async () => {
    const ambiente = ambienteFalso();
    abrir({ ambiente });
    await screen.findByRole('heading', { level: 1, name: 'Na reunião da firma' });
    const casca = document.querySelector('.forum-shell')!;
    act(() => ambiente.focarCampo(true));
    act(() => ambiente.focarCampo(false));
    act(() => ambiente.focarCampo(true));
    await new Promise((r) => setTimeout(r, 300));
    expect(casca.getAttribute('data-teclado')).toBe('aberto');
  });
});

describe('o diretório respeita o que a pessoa fez na sessão', () => {
  it('sair numa comunidade a tira de "Suas comunidades" mesmo com a lista inicial velha', async () => {
    const porta = comunidadeFalsa(['reuniao-da-firma']);
    const forum = forumFalso({
      obterComunidadeDoForum: vi.fn(async () => ({ ok: true as const, valor: comunidade({ souMembro: true }) })),
      listarTopicos: vi.fn(async () => ({ ok: true as const, valor: { itens: [], proximo: null } })),
      listarComunidadesDoForum: vi.fn(async () => ({
        ok: true as const,
        valor: [comunidade({ souMembro: true }), comunidade({ slug: 'outra', nome: 'Outra turma', souMembro: false })],
      })),
    });
    render(<Rotas entrada="/c/reuniao-da-firma" m={{ forum, conta: contaFalsa(CONTA), comunidade: porta }} />);
    fireEvent.click(await screen.findByRole('button', { name: 'Sair da comunidade' }));
    await screen.findByRole('button', { name: 'Participar' });
    act(() => void sondas.navegar!('/comunidades'));
    const suas = await screen.findByRole('heading', { level: 2, name: 'Suas comunidades' });
    expect(suas).toBeDefined();
    expect(await screen.findByText('Você ainda não participa de nenhuma comunidade. Escolhe uma turma aqui embaixo.')).toBeDefined();
  });
});
