// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import type { CursorDoForum, PaginaDoForum, ResultadoDaLeitura, TopicoDoAutor } from '../../portas/forum';
import { AbasDoPerfil } from './AbasDoPerfil';
import { ForumProvider } from './contexto';
import { limparListasVistas } from './hooks';
import { rotasDoForum } from './rotas';
import { Sonda, comunidade, contaFalsa, dependencias, forumFalso, sondas, topico } from './dublesParaTeste';

beforeEach(limparListasVistas);
afterEach(cleanup);

const ID = '11111111-1111-4111-8111-111111111111';
const ref = { id: 'id-reuniao-da-firma', slug: 'reuniao-da-firma', nome: 'Na reunião da firma' };
const meu = (): TopicoDoAutor => ({
  id: ID,
  comunidade: ref,
  titulo: 'Meu tópico',
  corpo: 'x',
  status: 'aberto',
  fixado: false,
  criadoEm: '2026-10-19T12:00:00.123456+00:00',
  editadoEm: null,
  ultimaAtividadeEm: '2026-10-19T12:00:00.123456+00:00',
  respostasTotal: 0,
});
type Pagina = ResultadoDaLeitura<PaginaDoForum<CursorDoForum, TopicoDoAutor>>;

describe('escrever esquece a lista do perfil (Voltar não mostra a lista velha)', () => {
  it('apagar o próprio tópico e voltar ao perfil: refaz a leitura e não mostra o tópico apagado', async () => {
    let apagado = false;
    const doAutor = vi.fn(async (): Promise<Pagina> => ({ ok: true, valor: { itens: apagado ? [] : [meu()], proximo: null } }));
    const forum = forumFalso({
      listarTopicosDoAutor: doAutor,
      obterTopico: vi.fn(async () => ({ ok: true as const, valor: topico({ id: ID, souAutor: true }) })),
      listarRespostasDoTopico: vi.fn(async () => ({ ok: true as const, valor: { itens: [], proximo: null } })),
      obterComunidadeDoForum: vi.fn(async () => ({ ok: true as const, valor: comunidade({ souMembro: true }) })),
      listarTopicos: vi.fn(async () => ({ ok: true as const, valor: { itens: [], proximo: null } })),
      apagarTopico: vi.fn(async () => {
        apagado = true;
        return { ok: true as const, valor: true as const };
      }),
    });
    const deps = dependencias({
      forum,
      conta: contaFalsa({ temSessao: true, anonima: false, podeParticiparSocialmente: true }),
      comunidade: { listarMinhasComunidades: vi.fn(async () => ['reuniao-da-firma']) } as never,
    });
    render(
      <MemoryRouter initialEntries={['/u/ana']}>
        <ForumProvider dependencias={deps}>
          <Sonda />
          <Routes>
            {rotasDoForum()}
            <Route path="/u/:handle" element={<AbasDoPerfil handle="ana" souEu dependencias={deps} />} />
          </Routes>
        </ForumProvider>
      </MemoryRouter>,
    );
    fireEvent.click(await screen.findByRole('link', { name: 'Meu tópico' }));
    await screen.findByRole('heading', { level: 1, name: 'Arroto na reunião de segunda' });
    fireEvent.click(screen.getByRole('button', { name: 'Ações do tópico' }));
    fireEvent.click(screen.getByRole('menuitem', { name: 'Apagar' }));
    fireEvent.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'Apagar tópico' }));
    await waitFor(() => expect(sondas.caminho).toBe('/c/reuniao-da-firma'));
    for (let i = 0; i < 3 && sondas.caminho !== '/u/ana'; i += 1) await act(async () => sondas.navegar!(-1));
    expect(sondas.caminho).toBe('/u/ana');
    expect(await screen.findByRole('heading', { name: 'Você ainda não abriu nenhum tópico.' })).toBeDefined();
    expect(screen.queryByRole('link', { name: 'Meu tópico' })).toBeNull();
    expect(doAutor).toHaveBeenCalledTimes(2);
  });
});
