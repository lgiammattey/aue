// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import type { CursorDoForum, PaginaDoForum, PortaDeForum, RespostaDoAutor, ResultadoDaLeitura, TopicoDoAutor } from '../../portas/forum';
import { AbasDoPerfil } from './AbasDoPerfil';
import { ForumProvider } from './contexto';
import { limparListasVistas } from './hooks';
import { rotasDoForum } from './rotas';
import { Sonda, comunidade, comunidadeFalsa, contaFalsa, dependencias, forumFalso, resposta, sondas, topico } from './dublesParaTeste';

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

// ---------------------------------------------------------------------------
// Cada escrita esquece a lista do perfil: o Voltar refaz a leitura.
// ---------------------------------------------------------------------------

const ID_RESP = 'r1';
const ROTA_TOPICO = `/c/reuniao-da-firma/t/${ID}`;
const respostaMinha = (corpo: string) => resposta({ id: ID_RESP, souAutor: true, corpo });
const minhaResposta = (): RespostaDoAutor => ({
  id: ID_RESP,
  topicoId: ID,
  topicoTitulo: 'Arroto na reunião de segunda',
  comunidade: ref,
  paiId: null,
  nivel: 0,
  corpo: 'texto antigo',
  criadoEm: '2026-10-19T12:00:00.123456+00:00',
  editadoEm: null,
});
const certo = <T,>(valor: T) => ({ ok: true as const, valor });

function abrirNoPerfil(aba: 'topicos' | 'respostas', extra: Partial<PortaDeForum> = {}) {
  const estado = { topico: topico({ id: ID, souAutor: true }), respostas: [respostaMinha('texto antigo')] };
  const doAutor = vi.fn(async () => certo({ itens: [meu()], proximo: null }));
  const respDoAutor = vi.fn(async () => certo({ itens: [minhaResposta()], proximo: null }));
  const forum = forumFalso({
    listarTopicosDoAutor: doAutor,
    listarRespostasDoAutor: respDoAutor,
    obterTopico: vi.fn(async () => certo(estado.topico)),
    listarRespostasDoTopico: vi.fn(async () => certo({ itens: estado.respostas, proximo: null })),
    obterComunidadeDoForum: vi.fn(async () => certo(comunidade({ slug: 'reuniao-da-firma', souMembro: true }))),
    listarTopicos: vi.fn(async () => certo({ itens: [], proximo: null })),
    ...extra,
  });
  const deps = dependencias({
    forum,
    conta: contaFalsa({ temSessao: true, anonima: false, podeParticiparSocialmente: true }),
    comunidade: comunidadeFalsa(['reuniao-da-firma']),
  });
  render(
    <MemoryRouter initialEntries={[`/u/ana?aba=${aba}`]}>
      <ForumProvider dependencias={deps}>
        <Sonda />
        <Routes>
          {rotasDoForum()}
          <Route path="/u/:handle" element={<AbasDoPerfil handle="ana" souEu dependencias={deps} />} />
        </Routes>
      </ForumProvider>
    </MemoryRouter>,
  );
  return { forum, estado, leituraDoPerfil: aba === 'topicos' ? doAutor : respDoAutor };
}

async function voltarAoPerfil() {
  for (let i = 0; i < 6 && !sondas.caminho.startsWith('/u/ana'); i += 1) await act(async () => sondas.navegar!(-1));
  expect(sondas.caminho.startsWith('/u/ana')).toBe(true);
}
const menu = (nome: string, item: string) => {
  fireEvent.click(screen.getByRole('button', { name: nome }));
  fireEvent.click(screen.getByRole('menuitem', { name: item }));
};
const conversa = () => screen.findByRole('heading', { level: 1, name: 'Arroto na reunião de segunda' });
const novaLeitura = (forum: PortaDeForum) => forum.listarRespostasDoTopico as ReturnType<typeof vi.fn>;

describe('cada escrita esquece a lista do perfil', () => {
  it('editar o tópico', async () => {
    const editar = vi.fn(async () => certo({ id: ID, titulo: 'Título novo', corpo: 'x', editadoEm: '2026-10-19T15:00:00.123456+00:00' }));
    const { estado, leituraDoPerfil } = abrirNoPerfil('topicos', { editarTopico: editar as never });
    await screen.findByRole('link', { name: 'Meu tópico' });
    await act(async () => sondas.navegar!(ROTA_TOPICO));
    await conversa();
    menu('Ações do tópico', 'Editar');
    const d = await screen.findByRole('dialog', { name: 'Editar tópico' });
    fireEvent.change(within(d).getByLabelText('Título'), { target: { value: 'Título novo' } });
    estado.topico = { ...estado.topico, titulo: 'Título novo' };
    fireEvent.submit(d.querySelector('form')!);
    await screen.findByRole('heading', { level: 1, name: 'Título novo' });
    await voltarAoPerfil();
    await waitFor(() => expect(leituraDoPerfil).toHaveBeenCalledTimes(2));
  });

  it('criar tópico', async () => {
    const criar = vi.fn(async () => certo({ id: ID, criadoEm: '2026-10-19T15:00:00.123456+00:00' }));
    const { leituraDoPerfil } = abrirNoPerfil('topicos', { criarTopico: criar as never });
    await screen.findByRole('link', { name: 'Meu tópico' });
    await act(async () => sondas.navegar!('/c/reuniao-da-firma/novo'));
    const d = await screen.findByRole('dialog');
    fireEvent.change(within(d).getByLabelText('Título'), { target: { value: 'Novo' } });
    fireEvent.change(within(d).getByLabelText('Mensagem'), { target: { value: 'Corpo' } });
    fireEvent.submit(d.querySelector('form')!);
    await waitFor(() => expect(criar).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(sondas.caminho).toContain('/t/'));
    await voltarAoPerfil();
    await waitFor(() => expect(leituraDoPerfil).toHaveBeenCalledTimes(2));
  });

  it('conferir os tópicos depois de falha ambígua ao criar', async () => {
    const criar = vi.fn(async () => ({ ok: false as const, motivo: 'semConfirmacao' as const }));
    const { leituraDoPerfil, forum } = abrirNoPerfil('topicos', { criarTopico: criar as never });
    await screen.findByRole('link', { name: 'Meu tópico' });
    await act(async () => sondas.navegar!('/c/reuniao-da-firma/novo'));
    const d = await screen.findByRole('dialog');
    fireEvent.change(within(d).getByLabelText('Título'), { target: { value: 'Novo' } });
    fireEvent.change(within(d).getByLabelText('Mensagem'), { target: { value: 'Corpo' } });
    fireEvent.submit(d.querySelector('form')!);
    fireEvent.click(await screen.findByRole('button', { name: 'Conferir os tópicos' }));
    await waitFor(() => expect((forum.listarTopicos as ReturnType<typeof vi.fn>).mock.calls.length).toBeGreaterThan(0));
    await voltarAoPerfil();
    await waitFor(() => expect(leituraDoPerfil).toHaveBeenCalledTimes(2));
  });

  it('enviar resposta', async () => {
    const responder = vi.fn(async () => certo({ id: 'nova', topicoId: ID, paiId: null, nivel: 0, criadoEm: '2026-10-19T15:00:00.123456+00:00' }));
    const { leituraDoPerfil, forum } = abrirNoPerfil('respostas', { responderTopico: responder as never });
    await screen.findByRole('link', { name: /Em: / });
    await act(async () => sondas.navegar!(ROTA_TOPICO));
    await conversa();
    const campo = await screen.findByLabelText('Sua resposta');
    fireEvent.change(campo, { target: { value: 'oi' } });
    const antes = novaLeitura(forum).mock.calls.length;
    fireEvent.submit(campo.closest('form')!);
    await waitFor(() => expect(novaLeitura(forum).mock.calls.length).toBeGreaterThan(antes));
    await voltarAoPerfil();
    await waitFor(() => expect(leituraDoPerfil).toHaveBeenCalledTimes(2));
  });

  it('editar resposta', async () => {
    const editar = vi.fn(async () => certo({ id: ID_RESP, corpo: 'texto novo', editadoEm: '2026-10-19T15:10:00.123456+00:00' }));
    const { leituraDoPerfil, estado } = abrirNoPerfil('respostas', { editarResposta: editar as never });
    await screen.findByRole('link', { name: /Em: / });
    await act(async () => sondas.navegar!(ROTA_TOPICO));
    await conversa();
    await screen.findByText('texto antigo');
    menu('Ações da resposta de Bia Lima', 'Editar');
    const c = screen.getByLabelText('Editar resposta');
    fireEvent.change(c, { target: { value: 'texto novo' } });
    estado.respostas = [respostaMinha('texto novo')];
    fireEvent.submit(c.closest('form')!);
    await screen.findByText('texto novo');
    await voltarAoPerfil();
    await waitFor(() => expect(leituraDoPerfil).toHaveBeenCalledTimes(2));
  });

  it('conferir a conversa depois de falha ambígua ao editar resposta (a edição já estava lá)', async () => {
    const editar = vi.fn(async () => ({ ok: false as const, motivo: 'semConfirmacao' as const }));
    const { leituraDoPerfil, estado } = abrirNoPerfil('respostas', { editarResposta: editar as never });
    await screen.findByRole('link', { name: /Em: / });
    await act(async () => sondas.navegar!(ROTA_TOPICO));
    await conversa();
    await screen.findByText('texto antigo');
    menu('Ações da resposta de Bia Lima', 'Editar');
    const c = screen.getByLabelText('Editar resposta');
    fireEvent.change(c, { target: { value: 'texto novo' } });
    fireEvent.submit(c.closest('form')!);
    await screen.findByText(/Não deu pra confirmar o envio/);
    estado.respostas = [respostaMinha('texto novo')];
    fireEvent.click(screen.getByRole('button', { name: 'Conferir a conversa' }));
    await screen.findByText('texto novo');
    await voltarAoPerfil();
    await waitFor(() => expect(leituraDoPerfil).toHaveBeenCalledTimes(2));
  });

  it('apagar resposta', async () => {
    const apagar = vi.fn(async () => certo(true as const));
    const { leituraDoPerfil, estado } = abrirNoPerfil('respostas', { apagarResposta: apagar as never });
    await screen.findByRole('link', { name: /Em: / });
    await act(async () => sondas.navegar!(ROTA_TOPICO));
    await conversa();
    await screen.findByText('texto antigo');
    menu('Ações da resposta de Bia Lima', 'Apagar');
    estado.respostas = [];
    fireEvent.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'Apagar resposta' }));
    await waitFor(() => expect(apagar).toHaveBeenCalledWith(ID_RESP));
    await waitFor(() => expect(screen.queryByText('texto antigo')).toBeNull());
    await voltarAoPerfil();
    await waitFor(() => expect(leituraDoPerfil).toHaveBeenCalledTimes(2));
  });

  it('a lista de respostas também é por handle: outro handle lê de novo', async () => {
    const respostas = vi.fn(async (handle: string) => certo({ itens: [{ ...minhaResposta(), id: `r-${handle}`, topicoTitulo: `Tópico de ${handle}` }], proximo: null }));
    const forum = forumFalso({ listarRespostasDoAutor: respostas as never });
    const deps = dependencias({ forum });
    const ui = (h: string) => (
      <MemoryRouter initialEntries={['/u/x?aba=respostas']}>
        <Routes>
          <Route path="/u/:handle" element={<AbasDoPerfil handle={h} souEu={false} dependencias={deps} />} />
        </Routes>
      </MemoryRouter>
    );
    const r = render(ui('ana'));
    await screen.findByRole('link', { name: 'Em: Tópico de ana' });
    r.rerender(ui('bia'));
    await screen.findByRole('link', { name: 'Em: Tópico de bia' });
    expect(screen.queryByRole('link', { name: 'Em: Tópico de ana' })).toBeNull();
    expect(respostas).toHaveBeenCalledTimes(2);
  });
});
