import { beforeEach, describe, expect, it, vi } from 'vitest';

const rpc = vi.fn();
const getSession = vi.fn();

vi.mock('../../db/supabase', () => ({
  configuracaoAusente: false,
  supabase: {
    rpc: (...a: unknown[]) => rpc(...a),
    auth: { getSession: (...a: unknown[]) => getSession(...a) },
  },
}));

import { criarForumWeb } from './forum';

vi.stubEnv('VITE_SUPABASE_URL', 'https://projeto-real.supabase.co');
vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'chave-real-de-teste');

const ID_A = '11111111-1111-4111-8111-111111111111';
const ID_B = '22222222-2222-4222-8222-222222222222';
const ID_C = '33333333-3333-4333-8333-333333333333';

const COM = { comunidade_id: 'c1', comunidade_slug: 'bonde-geral', comunidade_nome: 'Bonde Geral' };
const AUTOR = { autor_id: 'u1', apelido: 'Zeca', handle: 'zeca', url_do_avatar: null };

const linhaDeTopico = (o: Record<string, unknown> = {}) => ({
  id: ID_A,
  ...COM,
  ...AUTOR,
  titulo: 'Quem arrota mais alto?',
  corpo: 'Texto do tópico',
  status: 'aberto',
  fixado: false,
  criado_em: '2026-10-19T12:00:00.123456+00:00',
  editado_em: null,
  ultima_atividade_em: '2026-10-19T13:00:00.654321+00:00',
  respostas_total: 3,
  resultado_id: null,
  nota: null,
  duracao: null,
  subtipo_de_origem: null,
  caminho_do_audio: null,
  caminho_do_audio_da_casa: null,
  sou_autor: false,
  ...o,
});

const linhaDeResposta = (o: Record<string, unknown> = {}) => ({
  id: ID_A,
  topico_id: ID_B,
  pai_id: null,
  nivel: 0,
  ...AUTOR,
  corpo: 'Resposta',
  status: 'visivel',
  criado_em: '2026-10-19T12:00:00.000001+00:00',
  editado_em: null,
  sou_autor: false,
  ...o,
});

const linhaDoExplorar = (o: Record<string, unknown> = {}) => ({
  id: ID_A,
  ...COM,
  ...AUTOR,
  titulo: 'T',
  status: 'aberto',
  fixado: false,
  criado_em: '2026-10-19T12:00:00.111111+00:00',
  ultima_atividade_em: '2026-10-19T13:00:00.222222+00:00',
  respostas_total: 0,
  ...o,
});

const erroDoServidor = (code: string, hint: string | null, message = 'm') => ({
  data: null,
  error: { code, hint, message, details: null },
});

function comoMembro() {
  getSession.mockResolvedValue({ data: { session: { user: { id: 'u1', is_anonymous: false } } }, error: null });
}

beforeEach(() => {
  rpc.mockReset();
  getSession.mockReset();
  vi.spyOn(console, 'error').mockImplementation(() => {});
  comoMembro();
});

describe('sem servidor', () => {
  it('offline, não finge: toda operação diz semServidor e nada é chamado', async () => {
    const f = criarForumWeb({ forcarOffline: true });
    expect(await f.listarComunidadesDoForum()).toEqual({ ok: false, motivo: 'semServidor' });
    expect(await f.obterTopico(ID_A)).toEqual({ ok: false, motivo: 'semServidor' });
    expect(await f.listarRespostasDoTopico(ID_A)).toEqual({ ok: false, motivo: 'semServidor' });
    expect(await f.criarTopico({ comunidadeSlug: 'x', titulo: 't', corpo: 'c' })).toEqual({
      ok: false,
      motivo: 'semServidor',
    });
    expect(rpc).not.toHaveBeenCalled();
    expect(getSession).not.toHaveBeenCalled();
  });
});

describe('cursor com microssegundo', () => {
  it('listarTopicos: o cursor é o texto cru da última linha e volta idêntico na página seguinte', async () => {
    const pagina1 = [
      linhaDeTopico({ id: ID_A, ultima_atividade_em: '2026-10-19T13:00:00.654321+00:00', fixado: true }),
      linhaDeTopico({ id: ID_B, ultima_atividade_em: '2026-10-19T13:00:00.654320+00:00', fixado: false }),
    ];
    rpc.mockResolvedValueOnce({ data: pagina1, error: null });
    const f = criarForumWeb();
    const r1 = await f.listarTopicos('bonde-geral', { limite: 2 });
    expect(r1.ok).toBe(true);
    if (!r1.ok) return;
    expect(r1.valor.proximo).toEqual({ valor: '2026-10-19T13:00:00.654320+00:00', id: ID_B, fixado: false });

    rpc.mockResolvedValueOnce({ data: [linhaDeTopico({ id: ID_C })], error: null });
    const r2 = await f.listarTopicos('bonde-geral', { limite: 2, cursor: r1.valor.proximo });
    expect(rpc).toHaveBeenLastCalledWith('listar_topicos', {
      p_slug: 'bonde-geral',
      p_limite: 2,
      p_ordem: 'atividade',
      p_cursor_valor: '2026-10-19T13:00:00.654320+00:00',
      p_cursor_id: ID_B,
      p_cursor_fixado: false,
    });
    expect(r2.ok && r2.valor.itens.map((t) => t.id)).toEqual([ID_C]);
    // Página menor que o limite: não há próxima.
    expect(r2.ok && r2.valor.proximo).toBeNull();
  });

  it('listarTopicos na ordem recentes usa criado_em como valor do cursor', async () => {
    rpc.mockResolvedValue({ data: [linhaDeTopico({ criado_em: '2026-10-19T12:00:00.000007+00:00' })], error: null });
    const r = await criarForumWeb().listarTopicos('bonde-geral', { ordem: 'recentes', limite: 1 });
    expect(r.ok && r.valor.proximo?.valor).toBe('2026-10-19T12:00:00.000007+00:00');
  });

  it('listarRespostasDoTopico: cursor cronológico por criado_em', async () => {
    rpc.mockResolvedValue({
      data: [linhaDeResposta({ id: ID_A, criado_em: '2026-10-19T12:00:00.000001+00:00' }), linhaDeResposta({ id: ID_C, criado_em: '2026-10-19T12:00:00.000002+00:00' })],
      error: null,
    });
    const r = await criarForumWeb().listarRespostasDoTopico(ID_B, { limite: 2 });
    expect(r.ok && r.valor.proximo).toEqual({ valor: '2026-10-19T12:00:00.000002+00:00', id: ID_C });
    await criarForumWeb().listarRespostasDoTopico(ID_B, { cursor: { valor: '2026-10-19T12:00:00.000002+00:00', id: ID_C } });
    expect(rpc).toHaveBeenLastCalledWith('listar_respostas_do_topico', {
      p_topico_id: ID_B,
      p_limite: 50,
      p_cursor_criado_em: '2026-10-19T12:00:00.000002+00:00',
      p_cursor_id: ID_C,
    });
  });

  it('explorarTopicos: cursor segue a coluna da ordem escolhida', async () => {
    rpc.mockResolvedValue({ data: [linhaDoExplorar()], error: null });
    const f = criarForumWeb();
    const porAtividade = await f.explorarTopicos({ limite: 1 });
    expect(porAtividade.ok && porAtividade.valor.proximo?.valor).toBe('2026-10-19T13:00:00.222222+00:00');
    const recentes = await f.explorarTopicos({ limite: 1, ordem: 'recentes' });
    expect(recentes.ok && recentes.valor.proximo?.valor).toBe('2026-10-19T12:00:00.111111+00:00');
  });

  it('listas do autor: cursor por criado_em, mandado de volta sem conversão', async () => {
    rpc.mockResolvedValue({
      data: [
        {
          id: ID_A, ...COM, titulo: 'T', corpo: 'c', status: 'aberto', fixado: false,
          criado_em: '2026-10-19T12:00:00.999999+00:00', editado_em: null,
          ultima_atividade_em: '2026-10-19T12:00:00.999999+00:00', respostas_total: 0,
        },
      ],
      error: null,
    });
    const f = criarForumWeb();
    const r = await f.listarTopicosDoAutor('zeca', { limite: 1 });
    expect(r.ok && r.valor.proximo).toEqual({ valor: '2026-10-19T12:00:00.999999+00:00', id: ID_A });
    await f.listarTopicosDoAutor('zeca', { cursor: { valor: '2026-10-19T12:00:00.999999+00:00', id: ID_A } });
    expect(rpc).toHaveBeenLastCalledWith('listar_topicos_do_autor', {
      p_handle: 'zeca',
      p_limite: 30,
      p_cursor_criado_em: '2026-10-19T12:00:00.999999+00:00',
      p_cursor_id: ID_A,
    });
  });

  it('o limite pedido nunca passa do máximo do servidor (senão página cheia pareceria curta)', async () => {
    rpc.mockResolvedValue({ data: [], error: null });
    await criarForumWeb().listarTopicos('x', { limite: 500 });
    expect(rpc.mock.calls[0][1].p_limite).toBe(100);
    await criarForumWeb().listarRespostasDoTopico(ID_A, { limite: 500 });
    expect(rpc.mock.calls[1][1].p_limite).toBe(200);
  });
});

describe('leituras: HINT decide', () => {
  it.each([
    ['comunidade_inexistente', 'comunidadeInexistente'],
    ['cursor_invalido', 'cursorInvalido'],
    ['ordem_invalida', 'ordemInvalida'],
  ])('HINT %s vira %s', async (hint, motivo) => {
    rpc.mockResolvedValue(erroDoServidor('22023', hint));
    expect(await criarForumWeb().listarTopicos('x')).toEqual({ ok: false, motivo });
  });

  it('o HINT manda, não a classe nem a mensagem', async () => {
    rpc.mockResolvedValue(erroDoServidor('P0001', 'cursor_invalido', 'Comunidade não existe'));
    expect(await criarForumWeb().explorarTopicos()).toEqual({ ok: false, motivo: 'cursorInvalido' });
  });

  it.each([
    ['HINT desconhecido', erroDoServidor('22023', 'hint_que_nao_existe')],
    ['HINT de escrita numa leitura', erroDoServidor('42501', 'nao_e_membro')],
    ['HINT com nome do protótipo', erroDoServidor('22023', 'constructor')],
    ['sem HINT', erroDoServidor('22023', null)],
    ['rede (supabase-js devolve code vazio)', erroDoServidor('', '', 'TypeError: Failed to fetch')],
    ['5xx', erroDoServidor('PGRST000', null)],
  ])('%s é falha genérica, nunca lista vazia', async (_nome, resposta) => {
    rpc.mockResolvedValue(resposta);
    const f = criarForumWeb();
    expect(await f.listarComunidadesDoForum()).toEqual({ ok: false, motivo: 'falhou' });
    expect(await f.listarTopicos('x')).toEqual({ ok: false, motivo: 'falhou' });
    expect(await f.obterTopico(ID_A)).toEqual({ ok: false, motivo: 'falhou' });
    expect(await f.listarRespostasDoTopico(ID_A)).toEqual({ ok: false, motivo: 'falhou' });
    expect(await f.explorarTopicos()).toEqual({ ok: false, motivo: 'falhou' });
    expect(await f.listarTopicosDoAutor('zeca')).toEqual({ ok: false, motivo: 'falhou' });
    expect(await f.listarRespostasDoAutor('zeca')).toEqual({ ok: false, motivo: 'falhou' });
    expect(await f.obterComunidadeDoForum('x')).toEqual({ ok: false, motivo: 'falhou' });
  });

  it('rede que rejeita a promessa vira falhou', async () => {
    rpc.mockRejectedValue(new TypeError('Failed to fetch'));
    expect(await criarForumWeb().listarComunidadesDoForum()).toEqual({ ok: false, motivo: 'falhou' });
  });

  it('tempo esgotado vira falhou', async () => {
    vi.useFakeTimers();
    try {
      rpc.mockReturnValue(new Promise(() => {}));
      const p = criarForumWeb().listarComunidadesDoForum();
      await vi.advanceTimersByTimeAsync(6001);
      expect(await p).toEqual({ ok: false, motivo: 'falhou' });
    } finally {
      vi.useRealTimers();
    }
  });
});

describe('leituras: resposta malformada nunca vira lista', () => {
  it.each([
    ['data nulo', { data: null, error: null }],
    ['data objeto', { data: {}, error: null }],
    ['linha que não é objeto', { data: ['x'], error: null }],
    ['sem id', { data: [linhaDeTopico({ id: undefined })], error: null }],
    ['status desconhecido', { data: [linhaDeTopico({ status: 'oculto' })], error: null }],
    ['contador como texto', { data: [linhaDeTopico({ respostas_total: '3' })], error: null }],
    ['contador negativo', { data: [linhaDeTopico({ respostas_total: -1 })], error: null }],
    ['fixado ausente', { data: [linhaDeTopico({ fixado: null })], error: null }],
  ])('%s', async (_nome, resposta) => {
    rpc.mockResolvedValue(resposta);
    expect(await criarForumWeb().listarTopicos('x')).toEqual({ ok: false, motivo: 'falhou' });
  });

  it('uma linha ruim derruba a página inteira (não esconde item)', async () => {
    rpc.mockResolvedValue({ data: [linhaDeTopico(), linhaDeTopico({ id: undefined })], error: null });
    expect(await criarForumWeb().listarTopicos('x')).toEqual({ ok: false, motivo: 'falhou' });
  });

  it('resposta visível sem autor é malformada; casca sem autor é válida', async () => {
    rpc.mockResolvedValue({ data: [linhaDeResposta({ autor_id: null })], error: null });
    expect(await criarForumWeb().listarRespostasDoTopico(ID_B)).toEqual({ ok: false, motivo: 'falhou' });

    rpc.mockResolvedValue({
      data: [
        linhaDeResposta({
          autor_id: null, apelido: null, handle: null, url_do_avatar: null, corpo: null,
          status: 'removido', editado_em: null,
        }),
      ],
      error: null,
    });
    const r = await criarForumWeb().listarRespostasDoTopico(ID_B);
    expect(r.ok && r.valor.itens[0]).toMatchObject({ autor: null, corpo: null, status: 'removido' });
  });
});

describe('leituras: o que chega à tela', () => {
  it('lista vazia de verdade é ok com zero itens', async () => {
    rpc.mockResolvedValue({ data: [], error: null });
    const r = await criarForumWeb().listarTopicos('x');
    expect(r).toEqual({ ok: true, valor: { itens: [], proximo: null } });
  });

  it('contadores e flags saem como o servidor mandou', async () => {
    rpc.mockResolvedValue({
      data: [
        {
          id: ID_A, slug: 'bonde-geral', nome: 'Bonde Geral', descricao: null, icone: null,
          membros_total: 0, topicos_total: 0, ultima_atividade_em: null, sou_membro: false,
        },
      ],
      error: null,
    });
    const r = await criarForumWeb().listarComunidadesDoForum();
    expect(r).toEqual({
      ok: true,
      valor: [
        {
          id: ID_A, slug: 'bonde-geral', nome: 'Bonde Geral', descricao: '', icone: null,
          membrosTotal: 0, topicosTotal: 0, ultimaAtividadeEm: null, souMembro: false,
        },
      ],
    });
  });

  it('slug inexistente: obterComunidadeDoForum e obterTopico devolvem ok com null', async () => {
    rpc.mockResolvedValue({ data: [], error: null });
    const f = criarForumWeb();
    expect(await f.obterComunidadeDoForum('nao-existe')).toEqual({ ok: true, valor: null });
    expect(await f.obterTopico(ID_A)).toEqual({ ok: true, valor: null });
  });

  it('id de tópico que nem é UUID é "não achei" sem ir ao servidor', async () => {
    expect(await criarForumWeb().obterTopico('reuniao-da-firma')).toEqual({ ok: true, valor: null });
    expect(await criarForumWeb().listarRespostasDoTopico('x')).toEqual({ ok: true, valor: { itens: [], proximo: null } });
    expect(rpc).not.toHaveBeenCalled();
  });

  it('nota e áudio só existem quando o servidor mandou', async () => {
    rpc.mockResolvedValue({ data: [linhaDeTopico()], error: null });
    const sem = await criarForumWeb().obterTopico(ID_A);
    expect(sem.ok && sem.valor?.audio).toBeNull();

    rpc.mockResolvedValue({
      data: [linhaDeTopico({ resultado_id: ID_C, nota: 87.5, duracao: 3.2, caminho_do_audio: 'u/x.m4a', sou_autor: true })],
      error: null,
    });
    const com = await criarForumWeb().obterTopico(ID_A);
    expect(com.ok && com.valor?.audio).toMatchObject({ resultadoId: ID_C, nota: 87.5, caminhoDoAudio: 'u/x.m4a' });
    expect(com.ok && com.valor?.souAutor).toBe(true);
  });

  it('listarTopicos manda ordem e cursor nulos quando não há cursor', async () => {
    rpc.mockResolvedValue({ data: [], error: null });
    await criarForumWeb().listarTopicos('bonde-geral');
    expect(rpc).toHaveBeenCalledWith('listar_topicos', {
      p_slug: 'bonde-geral',
      p_limite: 30,
      p_ordem: 'atividade',
      p_cursor_valor: null,
      p_cursor_id: null,
      p_cursor_fixado: false,
    });
  });

  it('visitante lê sem consultar sessão', async () => {
    getSession.mockResolvedValue({ data: { session: null }, error: null });
    rpc.mockResolvedValue({ data: [], error: null });
    const r = await criarForumWeb().explorarTopicos();
    expect(r.ok).toBe(true);
    expect(getSession).not.toHaveBeenCalled();
  });
});

describe('escritas: visitante', () => {
  const chamadas = (f: ReturnType<typeof criarForumWeb>) => [
    f.criarTopico({ comunidadeSlug: 'x', titulo: 't', corpo: 'c' }),
    f.responderTopico({ topicoId: ID_A, corpo: 'c' }),
    f.editarTopico({ topicoId: ID_A, titulo: 't' }),
    f.editarResposta({ respostaId: ID_A, corpo: 'c' }),
    f.apagarTopico(ID_A),
    f.apagarResposta(ID_A),
    f.denunciarTopico(ID_A, 'golpe'),
    f.denunciarResposta(ID_A, 'golpe'),
  ];

  it.each([
    ['sem sessão', { data: { session: null }, error: null }],
    ['sessão anônima', { data: { session: { user: { id: 'a', is_anonymous: true } } }, error: null }],
  ])('%s: toda escrita diz precisaEntrar e nem chama o servidor', async (_n, sessao) => {
    getSession.mockResolvedValue(sessao);
    const r = await Promise.all(chamadas(criarForumWeb()));
    for (const x of r) expect(x).toEqual({ ok: false, motivo: 'precisaEntrar' });
    expect(rpc).not.toHaveBeenCalled();
  });

  it('42501 sem HINT (conta sem promoção, sessão caída) também é precisaEntrar', async () => {
    rpc.mockResolvedValue(erroDoServidor('42501', null, 'Ação social exige conta promovida'));
    expect(await criarForumWeb().criarTopico({ comunidadeSlug: 'x', titulo: 't', corpo: 'c' })).toEqual({
      ok: false,
      motivo: 'precisaEntrar',
    });
  });

  it('não conseguir ler a sessão não vira sucesso nem convite: falhou, sem chamar a RPC', async () => {
    getSession.mockRejectedValue(new Error('storage'));
    expect(await criarForumWeb().apagarTopico(ID_A)).toEqual({ ok: false, motivo: 'falhou' });
    expect(rpc).not.toHaveBeenCalled();
  });
});

describe('escritas: um caso por HINT', () => {
  it.each([
    ['titulo_invalido', '22023', 'tituloInvalido'],
    ['corpo_invalido', '22023', 'corpoInvalido'],
    ['resposta_invalida', '22023', 'respostaInvalida'],
    ['comunidade_inexistente', '22023', 'comunidadeInexistente'],
    ['nao_e_membro', '42501', 'naoEMembro'],
    ['topico_fechado', 'P0001', 'topicoFechado'],
    ['topico_nao_encontrado', '22023', 'topicoNaoEncontrado'],
    ['pai_invalido', '22023', 'paiInvalido'],
    ['resposta_nao_encontrada', '22023', 'respostaNaoEncontrada'],
    ['audio_sem_consentimento', '42501', 'audioSemConsentimento'],
    ['nao_e_autor', '42501', 'naoEAutor'],
    ['nada_para_editar', '22023', 'nadaParaEditar'],
  ])('HINT %s (%s) vira %s', async (hint, code, motivo) => {
    rpc.mockResolvedValue(erroDoServidor(code, hint, 'texto qualquer que não conta'));
    expect(await criarForumWeb().responderTopico({ topicoId: ID_A, corpo: 'c' })).toEqual({ ok: false, motivo });
  });

  it('cursor_invalido e ordem_invalida não são HINT de escrita: falha genérica', async () => {
    rpc.mockResolvedValue(erroDoServidor('22023', 'cursor_invalido'));
    expect(await criarForumWeb().apagarTopico(ID_A)).toEqual({ ok: false, motivo: 'falhou' });
  });

  it('HINT desconhecido com recusa do Postgres é falhou (sabemos que não gravou)', async () => {
    rpc.mockResolvedValue(erroDoServidor('22023', 'hint_novo'));
    expect(await criarForumWeb().apagarTopico(ID_A)).toEqual({ ok: false, motivo: 'falhou' });
  });

  it('42501 com HINT desconhecido não vira precisaEntrar', async () => {
    rpc.mockResolvedValue(erroDoServidor('42501', 'hint_novo'));
    expect(await criarForumWeb().apagarTopico(ID_A)).toEqual({ ok: false, motivo: 'falhou' });
  });
});

describe('escritas: rede e resposta estranha são ambíguas', () => {
  it.each([
    ['rede (code vazio)', erroDoServidor('', '', 'TypeError: Failed to fetch')],
    ['5xx', erroDoServidor('PGRST000', null)],
    ['timeout do banco', erroDoServidor('57014', null)],
  ])('%s: semConfirmacao', async (_n, resposta) => {
    rpc.mockResolvedValue(resposta);
    expect(await criarForumWeb().criarTopico({ comunidadeSlug: 'x', titulo: 't', corpo: 'c' })).toEqual({
      ok: false,
      motivo: 'semConfirmacao',
    });
  });

  it('promessa rejeitada: semConfirmacao', async () => {
    rpc.mockRejectedValue(new TypeError('Failed to fetch'));
    expect(await criarForumWeb().responderTopico({ topicoId: ID_A, corpo: 'c' })).toEqual({
      ok: false,
      motivo: 'semConfirmacao',
    });
  });

  it('tempo esgotado: semConfirmacao', async () => {
    vi.useFakeTimers();
    try {
      rpc.mockReturnValue(new Promise(() => {}));
      const p = criarForumWeb().responderTopico({ topicoId: ID_A, corpo: 'c' });
      await vi.advanceTimersByTimeAsync(20001);
      expect(await p).toEqual({ ok: false, motivo: 'semConfirmacao' });
    } finally {
      vi.useRealTimers();
    }
  });

  it.each([
    ['criar sem linha', (f: ReturnType<typeof criarForumWeb>) => f.criarTopico({ comunidadeSlug: 'x', titulo: 't', corpo: 'c' }), null],
    ['responder sem id', (f: ReturnType<typeof criarForumWeb>) => f.responderTopico({ topicoId: ID_A, corpo: 'c' }), { nivel: 0 }],
    ['apagar com false', (f: ReturnType<typeof criarForumWeb>) => f.apagarTopico(ID_A), false],
    ['denunciar com null', (f: ReturnType<typeof criarForumWeb>) => f.denunciarResposta(ID_A, 'golpe'), null],
  ])('sucesso HTTP com corpo malformado (%s) não vira ok', async (_n, chamar, data) => {
    rpc.mockResolvedValue({ data, error: null });
    expect(await chamar(criarForumWeb())).toEqual({ ok: false, motivo: 'semConfirmacao' });
  });
});

describe('escritas: sucesso e o que vai ao servidor', () => {
  it('criarTopico manda só slug, título e corpo, sem autor, nota, áudio nem contagem', async () => {
    rpc.mockResolvedValue({ data: { id: ID_A, criado_em: '2026-10-19T12:00:00.123456+00:00', autor_id: 'x' }, error: null });
    const r = await criarForumWeb().criarTopico({ comunidadeSlug: 'bonde-geral', titulo: 'Oi', corpo: 'Texto' });
    expect(r).toEqual({ ok: true, valor: { id: ID_A, criadoEm: '2026-10-19T12:00:00.123456+00:00' } });
    expect(rpc).toHaveBeenCalledWith('criar_topico', { p_slug: 'bonde-geral', p_titulo: 'Oi', p_corpo: 'Texto' });
  });

  it('responderTopico manda o pai quando há e null quando não há', async () => {
    rpc.mockResolvedValue({
      data: { id: ID_C, topico_id: ID_A, pai_id: ID_B, nivel: 1, criado_em: '2026-10-19T12:00:00.5+00:00' },
      error: null,
    });
    const f = criarForumWeb();
    const r = await f.responderTopico({ topicoId: ID_A, corpo: 'c', paiId: ID_B });
    expect(r).toEqual({
      ok: true,
      valor: { id: ID_C, topicoId: ID_A, paiId: ID_B, nivel: 1, criadoEm: '2026-10-19T12:00:00.5+00:00' },
    });
    expect(rpc).toHaveBeenLastCalledWith('responder_topico', { p_topico_id: ID_A, p_corpo: 'c', p_pai_id: ID_B });
    await f.responderTopico({ topicoId: ID_A, corpo: 'c' });
    expect(rpc).toHaveBeenLastCalledWith('responder_topico', { p_topico_id: ID_A, p_corpo: 'c', p_pai_id: null });
  });

  it('editarTopico manda null no campo que não mudou', async () => {
    rpc.mockResolvedValue({
      data: { id: ID_A, titulo: 'Novo', corpo: 'Texto', editado_em: '2026-10-19T14:00:00.000001+00:00' },
      error: null,
    });
    const r = await criarForumWeb().editarTopico({ topicoId: ID_A, titulo: 'Novo' });
    expect(r.ok && r.valor.editadoEm).toBe('2026-10-19T14:00:00.000001+00:00');
    expect(rpc).toHaveBeenCalledWith('editar_topico', { p_topico_id: ID_A, p_titulo: 'Novo', p_corpo: null });
  });

  it('editarResposta, apagar e denunciar', async () => {
    const f = criarForumWeb();
    rpc.mockResolvedValueOnce({ data: { id: ID_A, corpo: 'novo', editado_em: '2026-10-19T14:00:00+00:00' }, error: null });
    expect(await f.editarResposta({ respostaId: ID_A, corpo: 'novo' })).toEqual({
      ok: true,
      valor: { id: ID_A, corpo: 'novo', editadoEm: '2026-10-19T14:00:00+00:00' },
    });
    rpc.mockResolvedValue({ data: true, error: null });
    expect(await f.apagarTopico(ID_A)).toEqual({ ok: true, valor: true });
    expect(await f.apagarResposta(ID_A)).toEqual({ ok: true, valor: true });
    expect(await f.denunciarTopico(ID_A, 'golpe')).toEqual({ ok: true, valor: true });
    expect(await f.denunciarResposta(ID_A, 'golpe')).toEqual({ ok: true, valor: true });
    expect(rpc).toHaveBeenLastCalledWith('denunciar_resposta', { p_resposta_id: ID_A, p_motivo: 'golpe' });
  });
});
