// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { PortaDeComunidade } from '../../portas/comunidade';
import type { PortaDeConta } from '../../portas/conta';
import type { PortaDeForum } from '../../portas/forum';
import type { PerfilPublico, PortaDePerfil } from '../../portas/perfil';
import { TelaComunidadeOpenDesign } from './TelaComunidadeOpenDesign';

afterEach(cleanup);

const topico = (id: string, handle: string, titulo: string) => ({
  id,
  comunidade: { id: 'c1', slug: 'eu-arroto-e-dai', nome: 'Eu arroto, e daí?' },
  autor: { id: `u-${handle}`, apelido: handle, handle, avatarUrl: null },
  titulo,
  corpo: titulo,
  status: 'aberto' as const,
  fixado: false,
  criadoEm: '2026-10-19T12:00:00Z',
  editadoEm: null,
  ultimaAtividadeEm: '2026-10-19T12:00:00Z',
  respostasTotal: 0,
  souAutor: handle === 'eu_mesmo',
  audio: null,
});

const montar = (opcoes: { autenticado?: boolean; apagar?: PortaDeForum['apagarTopico']; denunciar?: PortaDeForum['denunciarTopico'] } = {}) => {
  const apagarTopico = opcoes.apagar ?? vi.fn(async () => ({ ok: true as const, valor: true as const }));
  const denunciarTopico = opcoes.denunciar ?? vi.fn(async () => ({ ok: true as const, valor: true as const }));
  const forum = {
    listarComunidadesDoForum: vi.fn(async () => ({ ok: true as const, valor: [] })),
    obterComunidadeDoForum: vi.fn(async (slug: string) => ({
      ok: true as const,
      valor: { id: 'c1', slug, nome: 'Eu arroto, e daí?', descricao: 'd', icone: null, membrosTotal: 3, topicosTotal: 2, ultimaAtividadeEm: null, souMembro: true, possoGerirMidia: false },
    })),
    listarTopicos: vi.fn(async () => ({
      ok: true as const,
      valor: { itens: [topico('t-meu', 'eu_mesmo', 'Meu post'), topico('t-outro', 'outra_pessoa', 'Post de outra pessoa')], proximo: null },
    })),
    explorarTopicos: vi.fn(async () => ({ ok: true as const, valor: { itens: [], proximo: null } })),
    obterTopico: vi.fn(), listarRespostasDoTopico: vi.fn(), listarTopicosDoAutor: vi.fn(), listarRespostasDoAutor: vi.fn(),
    criarTopico: vi.fn(), responderTopico: vi.fn(), editarTopico: vi.fn(), editarResposta: vi.fn(), apagarResposta: vi.fn(), denunciarResposta: vi.fn(),
    apagarTopico, denunciarTopico,
  } as unknown as PortaDeForum;
  const comunidade = {
    listarComunidades: vi.fn(async () => []), listarFeed: vi.fn(async () => []), obterCauso: vi.fn(), postarCauso: vi.fn(),
    alternarReacao: vi.fn(), alternarCurtida: vi.fn(), alternarRepost: vi.fn(), listarRespostas: vi.fn(), adicionarResposta: vi.fn(),
    apagarCauso: vi.fn(), denunciarCauso: vi.fn(), entrarComunidade: vi.fn(async () => true), sairComunidade: vi.fn(async () => true),
    listarMinhasComunidades: vi.fn(async () => []),
  } as unknown as PortaDeComunidade;
  const eu = { id: 'u-eu_mesmo', handle: 'eu_mesmo', apelido: 'Eu', criadoEm: '2026-10-01T00:00:00Z', souEu: true, totalCausos: 1, totalSeguidores: 0, totalSeguindo: 0, euSigo: false, fundador: false, daCasa: false } as PerfilPublico;
  const perfil = { obterMeuPerfil: vi.fn(async () => eu), obterPerfil: vi.fn(async () => eu), obterMeuPerfilParaEdicao: vi.fn(async () => null), listarConexoes: vi.fn(async () => []) } as unknown as PortaDePerfil;
  const autenticado = opcoes.autenticado ?? true;
  const conta = { estado: vi.fn(async () => ({ temSessao: autenticado, anonima: false, perfilSocialPendente: false })) } as unknown as PortaDeConta;
  render(
    <MemoryRouter initialEntries={['/c/eu-arroto-e-dai']}>
      <Routes>
        <Route path="/c/:slug" element={<TelaComunidadeOpenDesign portaForum={forum} portaComunidade={comunidade} portaPerfil={perfil} portaConta={conta} />} />
      </Routes>
    </MemoryRouter>,
  );
  return { apagarTopico, denunciarTopico };
};

const cartao = async (texto: string) => (await screen.findByText(texto)).closest('article') as HTMLElement;
const abrirMenu = (c: HTMLElement) => fireEvent.click(within(c).getByRole('button', { name: 'Mais ações' }));

describe('denunciar e apagar post na tela canônica', () => {
  it('post de outra pessoa: só Denunciar; envia o motivo, avisa e o post continua lá', async () => {
    const { denunciarTopico } = montar();
    const c = await cartao('Post de outra pessoa');
    abrirMenu(c);
    expect(screen.queryByRole('menuitem', { name: 'Apagar' })).toBeNull();
    fireEvent.click(screen.getByRole('menuitem', { name: 'Denunciar' }));
    fireEvent.change(screen.getByLabelText('Motivo da denúncia'), { target: { value: 'spam' } });
    fireEvent.click(screen.getByRole('button', { name: 'Enviar denúncia' }));
    await waitFor(() => expect(denunciarTopico).toHaveBeenCalledWith('t-outro', 'spam'));
    expect(await screen.findByText('Denúncia enviada. Obrigado por avisar.')).toBeTruthy();
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(screen.getByText('Post de outra pessoa')).toBeTruthy();
  });

  it('post próprio: só Apagar; confirma, o servidor responde e o card sai da tela', async () => {
    const { apagarTopico } = montar();
    const c = await cartao('Meu post');
    abrirMenu(c);
    expect(screen.queryByRole('menuitem', { name: 'Denunciar' })).toBeNull();
    fireEvent.click(screen.getByRole('menuitem', { name: 'Apagar' }));
    expect(apagarTopico).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Apagar' }));
    await waitFor(() => expect(apagarTopico).toHaveBeenCalledWith('t-meu'));
    expect(await screen.findByText('Post apagado.')).toBeTruthy();
    await waitFor(() => expect(screen.queryByText('Meu post')).toBeNull());
    expect(screen.getByText('Post de outra pessoa')).toBeTruthy();
  });

  it('falha ao apagar NÃO tira o post e mostra o motivo no diálogo', async () => {
    montar({ apagar: vi.fn(async () => ({ ok: false as const, motivo: 'semConfirmacao' as const })) });
    const c = await cartao('Meu post');
    abrirMenu(c);
    fireEvent.click(screen.getByRole('menuitem', { name: 'Apagar' }));
    fireEvent.click(screen.getByRole('button', { name: 'Apagar' }));
    expect((await screen.findByRole('alert')).textContent).toBe('Não deu pra apagar. Tenta de novo.');
    expect(screen.getByRole('dialog')).toBeTruthy();
    expect(screen.queryByText('Post apagado.')).toBeNull();
    expect(screen.getByText('Meu post')).toBeTruthy();
  });

  it('falha ao denunciar nunca diz "denunciado"', async () => {
    montar({ denunciar: vi.fn(async () => ({ ok: false as const, motivo: 'semConfirmacao' as const })) });
    const c = await cartao('Post de outra pessoa');
    abrirMenu(c);
    fireEvent.click(screen.getByRole('menuitem', { name: 'Denunciar' }));
    fireEvent.click(screen.getByRole('button', { name: 'Enviar denúncia' }));
    expect((await screen.findByRole('alert')).textContent).toBe('Não deu pra enviar a denúncia. Tenta de novo.');
    expect(screen.queryByText('Denúncia enviada. Obrigado por avisar.')).toBeNull();
  });

  it('cancelar não chama o servidor', async () => {
    const { apagarTopico, denunciarTopico } = montar();
    const c = await cartao('Meu post');
    abrirMenu(c);
    fireEvent.click(screen.getByRole('menuitem', { name: 'Apagar' }));
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(apagarTopico).not.toHaveBeenCalled();
    expect(denunciarTopico).not.toHaveBeenCalled();
  });

  it('visitante que tenta denunciar é levado a entrar, sem diálogo e sem chamada', async () => {
    const { denunciarTopico } = montar({ autenticado: false });
    const c = await cartao('Post de outra pessoa');
    abrirMenu(c);
    fireEvent.click(screen.getByRole('menuitem', { name: 'Denunciar' }));
    expect(await screen.findByText('Entre na sua conta para denunciar.')).toBeTruthy();
    expect(screen.queryByRole('dialog', { name: 'Denunciar post' })).toBeNull();
    expect(denunciarTopico).not.toHaveBeenCalled();
  });
});

describe('denunciar e apagar comentário na tela canônica', () => {
  const resposta = (id: string, handle: string, corpo: string) => ({
    id, topicoId: 't-outro', paiId: null, nivel: 0 as const, corpo, status: 'visivel' as const,
    autor: { id: `u-${handle}`, apelido: handle, handle, avatarUrl: null },
    criadoEm: '2026-10-19T13:00:00Z', editadoEm: null, souAutor: handle === 'eu_mesmo',
  });

  const montarComRespostas = (opcoes: {
    respostas?: unknown;
    apagarResposta?: PortaDeForum['apagarResposta'];
    denunciarResposta?: PortaDeForum['denunciarResposta'];
    listarRespostasDoTopico?: PortaDeForum['listarRespostasDoTopico'];
  } = {}) => {
    const apagarResposta = opcoes.apagarResposta ?? vi.fn(async () => ({ ok: true as const, valor: true as const }));
    const denunciarResposta = opcoes.denunciarResposta ?? vi.fn(async () => ({ ok: true as const, valor: true as const }));
    const listarRespostasDoTopico = opcoes.listarRespostasDoTopico ?? vi.fn(async () => ({
      ok: true as const,
      valor: { itens: [resposta('r-meu', 'eu_mesmo', 'Meu comentário'), resposta('r-outro', 'outra_pessoa', 'Comentário de outra pessoa')], proximo: null },
    }));
    const forum = {
      listarComunidadesDoForum: vi.fn(async () => ({ ok: true as const, valor: [] })),
      obterComunidadeDoForum: vi.fn(async (slug: string) => ({
        ok: true as const,
        valor: { id: 'c1', slug, nome: 'Eu arroto, e daí?', descricao: 'd', icone: null, membrosTotal: 3, topicosTotal: 1, ultimaAtividadeEm: null, souMembro: true, possoGerirMidia: false },
      })),
      listarTopicos: vi.fn(async () => ({ ok: true as const, valor: { itens: [topico('t-outro', 'outra_pessoa', 'Post de outra pessoa')], proximo: null } })),
      explorarTopicos: vi.fn(async () => ({ ok: true as const, valor: { itens: [], proximo: null } })),
      obterTopico: vi.fn(), listarTopicosDoAutor: vi.fn(), listarRespostasDoAutor: vi.fn(),
      criarTopico: vi.fn(), responderTopico: vi.fn(), editarTopico: vi.fn(), editarResposta: vi.fn(), apagarTopico: vi.fn(), denunciarTopico: vi.fn(),
      listarRespostasDoTopico, apagarResposta, denunciarResposta,
    } as unknown as PortaDeForum;
    const comunidade = {
      listarComunidades: vi.fn(async () => []), listarFeed: vi.fn(async () => []), obterCauso: vi.fn(), postarCauso: vi.fn(),
      alternarReacao: vi.fn(), alternarCurtida: vi.fn(), alternarRepost: vi.fn(), listarRespostas: vi.fn(async () => []), adicionarResposta: vi.fn(),
      apagarCauso: vi.fn(), denunciarCauso: vi.fn(), entrarComunidade: vi.fn(async () => true), sairComunidade: vi.fn(async () => true),
      listarMinhasComunidades: vi.fn(async () => []),
    } as unknown as PortaDeComunidade;
    const eu = { id: 'u-eu_mesmo', handle: 'eu_mesmo', apelido: 'Eu', criadoEm: '2026-10-01T00:00:00Z', souEu: true, totalCausos: 1, totalSeguidores: 0, totalSeguindo: 0, euSigo: false, fundador: false, daCasa: false } as PerfilPublico;
    const perfil = { obterMeuPerfil: vi.fn(async () => eu), obterPerfil: vi.fn(async () => eu), obterMeuPerfilParaEdicao: vi.fn(async () => null), listarConexoes: vi.fn(async () => []) } as unknown as PortaDePerfil;
    const conta = { estado: vi.fn(async () => ({ temSessao: true, anonima: false, perfilSocialPendente: false })) } as unknown as PortaDeConta;
    render(
      <MemoryRouter initialEntries={['/c/eu-arroto-e-dai']}>
        <Routes>
          <Route path="/c/:slug" element={<TelaComunidadeOpenDesign portaForum={forum} portaComunidade={comunidade} portaPerfil={perfil} portaConta={conta} />} />
        </Routes>
      </MemoryRouter>,
    );
    return { apagarResposta, denunciarResposta, listarRespostasDoTopico };
  };

  const abrirThread = async () => {
    const c = await cartao('Post de outra pessoa');
    fireEvent.click(within(c).getByRole('button', { name: /comentários/ }));
    return screen.findByText('Meu comentário');
  };
  const itemDe = (texto: string) => screen.getByText(texto).closest('article') as HTMLElement;

  it('comentário de outra pessoa: só Denunciar; o próprio: só Apagar', async () => {
    montarComRespostas();
    await abrirThread();
    fireEvent.click(within(itemDe('Comentário de outra pessoa')).getByRole('button', { name: 'Mais ações' }));
    expect(screen.queryByRole('menuitem', { name: 'Apagar' })).toBeNull();
    expect(screen.getByRole('menuitem', { name: 'Denunciar' })).toBeTruthy();
    fireEvent.keyDown(document, { key: 'Escape' });
    fireEvent.click(within(itemDe('Meu comentário')).getByRole('button', { name: 'Mais ações' }));
    expect(screen.queryByRole('menuitem', { name: 'Denunciar' })).toBeNull();
    expect(screen.getByRole('menuitem', { name: 'Apagar' })).toBeTruthy();
  });

  it('denunciar comentário envia o motivo e avisa; o comentário continua lá', async () => {
    const { denunciarResposta } = montarComRespostas();
    await abrirThread();
    fireEvent.click(within(itemDe('Comentário de outra pessoa')).getByRole('button', { name: 'Mais ações' }));
    fireEvent.click(screen.getByRole('menuitem', { name: 'Denunciar' }));
    expect(screen.getByRole('dialog', { name: 'Denunciar comentário' })).toBeTruthy();
    fireEvent.change(screen.getByLabelText('Motivo da denúncia'), { target: { value: 'ofensivo' } });
    fireEvent.click(screen.getByRole('button', { name: 'Enviar denúncia' }));
    await waitFor(() => expect(denunciarResposta).toHaveBeenCalledWith('r-outro', 'ofensivo'));
    expect(await screen.findByText('Denúncia enviada. Obrigado por avisar.')).toBeTruthy();
    expect(screen.getByText('Comentário de outra pessoa')).toBeTruthy();
  });

  it('apagar o próprio comentário vira marcador: o texto some, o resto da conversa fica', async () => {
    const { apagarResposta } = montarComRespostas();
    await abrirThread();
    fireEvent.click(within(itemDe('Meu comentário')).getByRole('button', { name: 'Mais ações' }));
    fireEvent.click(screen.getByRole('menuitem', { name: 'Apagar' }));
    fireEvent.click(screen.getByRole('button', { name: 'Apagar' }));
    await waitFor(() => expect(apagarResposta).toHaveBeenCalledWith('r-meu'));
    expect(await screen.findByText('Comentário apagado.')).toBeTruthy();
    expect(screen.getByText('Comentário removido.')).toBeTruthy();
    expect(screen.queryByText('Meu comentário')).toBeNull();
    expect(screen.getByText('Comentário de outra pessoa')).toBeTruthy();
  });

  it('falha ao apagar mantém o texto e mostra o motivo', async () => {
    montarComRespostas({ apagarResposta: vi.fn(async () => ({ ok: false as const, motivo: 'semConfirmacao' as const })) });
    await abrirThread();
    fireEvent.click(within(itemDe('Meu comentário')).getByRole('button', { name: 'Mais ações' }));
    fireEvent.click(screen.getByRole('menuitem', { name: 'Apagar' }));
    fireEvent.click(screen.getByRole('button', { name: 'Apagar' }));
    expect((await screen.findByRole('alert')).textContent).toBe('Não deu pra apagar. Tenta de novo.');
    expect(screen.queryByText('Comentário removido.')).toBeNull();
    expect(screen.getByText('Meu comentário')).toBeTruthy();
  });

  it('falha ao carregar os comentários NÃO vira "nenhum comentário" e Tentar de novo refaz', async () => {
    const listar = vi.fn()
      .mockResolvedValueOnce({ ok: false as const, motivo: 'falhou' as const })
      .mockResolvedValueOnce({ ok: true as const, valor: { itens: [resposta('r-outro', 'outra_pessoa', 'Comentário de outra pessoa')], proximo: null } });
    montarComRespostas({ listarRespostasDoTopico: listar });
    const c = await cartao('Post de outra pessoa');
    fireEvent.click(within(c).getByRole('button', { name: /comentários/ }));
    expect((await screen.findByText(/Não deu para carregar os comentários/))).toBeTruthy();
    expect(screen.queryByText(/Nenhum comentário ainda/)).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Tentar de novo' }));
    expect(await screen.findByText('Comentário de outra pessoa')).toBeTruthy();
    expect(listar).toHaveBeenCalledTimes(2);
  });
});
