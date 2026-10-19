// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { limparListasVistas } from './hooks';
import { AGORA, Rotas, ambienteFalso, comunidade, comunidadeFalsa, contaFalsa, forumFalso } from './dublesParaTeste';

beforeEach(limparListasVistas);
afterEach(cleanup);

const horas = (h: number) => new Date(AGORA - h * 3_600_000).toISOString();

const TRES = [
  comunidade({ id: 'c1', slug: 'zeta', nome: 'Zeta', ultimaAtividadeEm: null, topicosTotal: 0, membrosTotal: 1 }),
  comunidade({ id: 'c2', slug: 'cerveja-gelada', nome: 'Cerveja Gelada', ultimaAtividadeEm: horas(5), topicosTotal: 1234, membrosTotal: 48200 }),
  comunidade({ id: 'c3', slug: 'bonde-geral', nome: 'Bonde Geral', ultimaAtividadeEm: horas(1), topicosTotal: 3, membrosTotal: 9 }),
];

function abrir(forum = forumFalso({ listarComunidadesDoForum: vi.fn(async () => ({ ok: true as const, valor: TRES })) }), extra = {}) {
  render(<Rotas entrada="/comunidades" m={{ forum, ...extra }} />);
  return forum;
}

const principal = () => screen.getByRole('main');

describe('/comunidades: o diretório', () => {
  it('mostra esqueleto e diz que está carregando', async () => {
    const forum = forumFalso({
      listarComunidadesDoForum: vi.fn(() => new Promise<never>(() => {})),
    });
    abrir(forum);
    expect(principal().querySelector('[aria-busy="true"]')).not.toBeNull();
    expect(await screen.findByText('Carregando comunidades')).toBeDefined();
  });

  it('visitante: abertura com Criar conta e uma lista só, da mais viva para a mais parada', async () => {
    abrir();
    expect(await screen.findByRole('heading', { level: 2, name: 'Comunidades' })).toBeDefined();
    expect(screen.getByText('Encontre sua turma. Entre nas comunidades e participe da resenha.')).toBeDefined();
    const criar = within(principal()).getByRole('link', { name: 'Criar conta' });
    expect(criar.getAttribute('href')).toContain('modo=cadastro');
    expect(criar.getAttribute('href')).toContain('volta=%2Fcomunidades');
    expect(screen.queryByText('Suas comunidades')).toBeNull();
    const nomes = screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent);
    expect(nomes).toEqual(['Bonde Geral', 'Cerveja Gelada', 'Zeta']);
  });

  it('cada linha é um link real para /c/:slug e os contadores são os do servidor, sem abreviar', async () => {
    abrir();
    const link = (await screen.findByRole('heading', { name: 'Cerveja Gelada' })).closest('a')!;
    expect(link.getAttribute('href')).toBe('/c/cerveja-gelada');
    expect(link.textContent).toContain('1.234 tópicos · 48.200 membros · atividade há 5 h');
    const zeta = screen.getByRole('heading', { name: 'Zeta' }).closest('a')!;
    expect(zeta.textContent).toContain('Nenhum tópico ainda · 1 membro');
    expect(zeta.textContent).not.toContain('atividade');
  });

  it('não oferece nenhuma ação de escrita', async () => {
    abrir();
    await screen.findByRole('heading', { name: 'Zeta' });
    expect(screen.queryByRole('button', { name: /participar|novo tópico|postar|criar comunidade/i })).toBeNull();
    expect(screen.queryByRole('textbox')).toBeNull();
  });

  it('conta: separa as dela das outras, e o bonde-geral conta como dela', async () => {
    abrir(undefined, {
      conta: contaFalsa({ temSessao: true, anonima: false }),
      comunidade: comunidadeFalsa(['bonde-geral']),
    });
    const suas = await screen.findByRole('heading', { name: 'Suas comunidades' });
    const conhecer = screen.getByRole('heading', { name: 'Para conhecer' });
    const dela = suas.closest('section')!;
    const outras = conhecer.closest('section')!;
    expect(within(dela).getByRole('heading', { name: 'Bonde Geral' })).toBeDefined();
    expect(within(outras).getByRole('heading', { name: 'Cerveja Gelada' })).toBeDefined();
    expect(within(outras).queryByRole('heading', { name: 'Bonde Geral' })).toBeNull();
    expect(screen.queryByRole('link', { name: 'Criar conta' })).toBeNull();
  });

  it('conta que já tem sou_membro do servidor também entra em "Suas"', async () => {
    const forum = forumFalso({
      listarComunidadesDoForum: vi.fn(async () => ({
        ok: true as const,
        valor: [comunidade({ id: 'x', slug: 'x', nome: 'Xis', souMembro: true }), TRES[1]],
      })),
    });
    abrir(forum, { conta: contaFalsa({ temSessao: true, anonima: false }) });
    const suas = (await screen.findByRole('heading', { name: 'Suas comunidades' })).closest('section')!;
    expect(within(suas).getByRole('heading', { name: 'Xis' })).toBeDefined();
  });

  it('conta sem nenhuma comunidade vê a orientação, sem massa fictícia', async () => {
    abrir(undefined, { conta: contaFalsa({ temSessao: true, anonima: false }), comunidade: comunidadeFalsa([]) });
    expect(
      await screen.findByText('Você ainda não participa de nenhuma comunidade. Escolhe uma turma aqui embaixo.'),
    ).toBeDefined();
    expect(screen.getByRole('heading', { name: 'Para conhecer' })).toBeDefined();
  });

  it('sessão de convidado é visitante', async () => {
    abrir(undefined, { conta: contaFalsa({ temSessao: true, anonima: true }) });
    expect(await screen.findByRole('link', { name: 'Criar conta' })).toBeDefined();
  });

  it('não saber quem é a pessoa não mostra convite de visitante nem finge separação', async () => {
    abrir(undefined, { conta: contaFalsa('quebrada') });
    await screen.findByRole('heading', { name: 'Zeta' });
    expect(screen.queryByRole('link', { name: 'Criar conta' })).toBeNull();
    expect(screen.queryByText('Suas comunidades')).toBeNull();
  });

  it('zero comunidades de verdade é um estado vazio com a copy da spec', async () => {
    abrir(forumFalso({ listarComunidadesDoForum: vi.fn(async () => ({ ok: true as const, valor: [] })) }));
    expect(await screen.findByText('Nenhuma comunidade aberta ainda.')).toBeDefined();
    expect(screen.getByText('Volta daqui a pouco.')).toBeDefined();
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('erro NUNCA vira lista vazia: mostra o erro com Tentar de novo, que refaz só a chamada', async () => {
    const listar = vi
      .fn()
      .mockResolvedValueOnce({ ok: false, motivo: 'falhou' })
      .mockResolvedValueOnce({ ok: true, valor: TRES });
    abrir(forumFalso({ listarComunidadesDoForum: listar }));
    const alerta = await screen.findByRole('alert');
    expect(alerta.textContent).toContain('Deu ruim pra carregar as comunidades.');
    expect(alerta.textContent).toContain('Nada foi perdido. Tenta de novo.');
    expect(screen.queryByText('Nenhuma comunidade aberta ainda.')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Tentar de novo' }));
    expect(await screen.findByRole('heading', { name: 'Bonde Geral' })).toBeDefined();
    expect(listar).toHaveBeenCalledTimes(2);
  });

  it('rejeição inesperada da porta também é erro, não vazio', async () => {
    abrir(forumFalso({ listarComunidadesDoForum: vi.fn(async () => { throw new Error('boom'); }) }));
    expect(await screen.findByRole('alert')).toBeDefined();
  });

  it('sem internet: o erro diz "Sem internet." e a faixa aparece; ao voltar, a região de status avisa', async () => {
    const ambiente = ambienteFalso({ online: false });
    abrir(forumFalso({ listarComunidadesDoForum: vi.fn(async () => ({ ok: false as const, motivo: 'falhou' as const })) }), { ambiente });
    const alerta = await screen.findByRole('alert');
    expect(alerta.textContent).toContain('Sem internet.');
    expect(alerta.textContent).toContain('Confere a conexão e tenta de novo.');
    expect(screen.getByText(/Dá pra ler o que já abriu/)).toBeDefined();
    const { act } = await import('@testing-library/react');
    act(() => ambiente.mudarConectividade(true));
    expect(screen.queryByText(/Dá pra ler o que já abriu/)).toBeNull();
    expect(within(screen.getByRole('status')).getByText('A internet voltou.')).toBeDefined();
  });

  it('H1 único é o nome da tela, o título da aba segue a spec e o rodapé leva aos grupos externos', async () => {
    const ambiente = ambienteFalso();
    abrir(undefined, { ambiente });
    await screen.findByRole('heading', { name: 'Zeta' });
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Comunidades');
    expect(ambiente.titulo).toBe('Comunidades · Auê!');
    expect(screen.getByRole('link', { name: 'Ver grupos externos' }).getAttribute('href')).toBe('/grupos');
  });

  it('navegação principal tem os quatro itens e marca Comunidades; nada de Feed nem Postar', async () => {
    abrir();
    await screen.findByRole('heading', { name: 'Zeta' });
    const nav = screen.getByRole('navigation', { name: 'Principal' });
    const nomes = within(nav).getAllByRole('link').map((l) => l.textContent);
    expect(nomes).toEqual(['Comunidades', 'Explorar', 'Arena', 'Perfil']);
    expect(within(nav).getByRole('link', { name: 'Comunidades' }).getAttribute('aria-current')).toBe('page');
    expect(screen.queryByText(/feed|postar/i)).toBeNull();
  });
});
