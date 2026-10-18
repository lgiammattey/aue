import { describe, expect, it } from 'vitest';

import { confirmarProjeto } from '../../../scripts/elenco-burpzilla/confirmacao';
import { ROTEIRO } from '../../../scripts/elenco-burpzilla/dados';
import { executarBackfill, executarDesfazer } from '../../../scripts/elenco-burpzilla/execucao';
import type { PortaDoDesfazer, PortaDoServidor } from '../../../scripts/elenco-burpzilla/execucao';
import { SORTEIO } from '../../../scripts/elenco-burpzilla/sorteio.gerado';
import { montarElenco } from './montagem';
import type { ComentarioMontado, ContaMontada, PostMontado } from './tipos';

/** Um servidor em memória que se comporta como as funções do SQL (id fixo, ON CONFLICT DO NOTHING). */
function criarServidorFalso() {
  const usuarios = new Map<string, ContaMontada>();
  const contasDaCasa = new Set<string>();
  const posts = new Map<string, PostMontado>();
  const comentarios = new Map<string, ComentarioMontado>();
  const audios = new Map<string, Uint8Array>();
  const chamadas: string[] = [];
  let falharEm: string | null = null;

  const passo = (nome: string) => {
    chamadas.push(nome);
    if (falharEm === nome) throw new Error(`falha simulada em ${nome}`);
  };

  const porta: PortaDoServidor & PortaDoDesfazer = {
    async garantirUsuario(c) {
      passo(`usuario:${c.handle}`);
      if (usuarios.has(c.id)) return 'existia';
      usuarios.set(c.id, c);
      return 'criado';
    },
    async registrarConta(c) {
      passo(`conta:${c.handle}`);
      contasDaCasa.add(c.id);
    },
    async enviarAudio(caminho, bytes) {
      passo(`audio:${caminho}`);
      audios.set(caminho, bytes);
    },
    async publicarPost(p) {
      passo(`post:${p.chave}`);
      if (!contasDaCasa.has(p.autorId)) throw new Error('só conta da casa publica');
      if (p.caminhoDoAudio && !audios.has(p.caminhoDoAudio)) throw new Error('post sem o áudio no bucket');
      if (posts.has(p.id)) return false;
      posts.set(p.id, p);
      return true;
    },
    async comentar(c) {
      passo(`comentario:${c.chave}`);
      if (!contasDaCasa.has(c.autorId)) throw new Error('só conta da casa comenta');
      if (!posts.has(c.postId)) throw new Error('post não existe');
      if (comentarios.has(c.id)) return false;
      comentarios.set(c.id, c);
      return true;
    },
    async removerComentarios(ids) {
      ids.forEach((id) => comentarios.delete(id));
    },
    async removerPosts(ids) {
      ids.forEach((id) => posts.delete(id));
    },
    async removerAudios(caminhos) {
      caminhos.forEach((c) => audios.delete(c));
    },
    async removerUsuarios(ids) {
      ids.forEach((id) => {
        usuarios.delete(id);
        contasDaCasa.delete(id);
      });
    },
  };

  return {
    porta,
    usuarios,
    posts,
    comentarios,
    audios,
    chamadas,
    falharEm: (nome: string | null) => {
      falharEm = nome;
    },
  };
}

// O roteiro real ainda tem áudio pendente; o backfill, em si, não olha isso (quem olha é podeAplicar).
const elenco = montarElenco(ROTEIRO, SORTEIO);
const lerAudio = () => new Uint8Array([1, 2, 3]);

describe('backfill: sequência e idempotência', () => {
  it('a primeira rodada insere tudo; a segunda não insere nada e deixa o banco igual', async () => {
    const s = criarServidorFalso();
    const primeira = await executarBackfill(elenco, s.porta, lerAudio);
    expect(primeira).toMatchObject({
      usuariosCriados: 7,
      postsInseridos: 22,
      comentariosInseridos: 6,
      postsQueJaExistiam: 0,
      comentariosQueJaExistiam: 0,
    });
    const antes = JSON.stringify([...s.posts.entries(), ...s.comentarios.entries(), ...s.usuarios.entries()]);

    const segunda = await executarBackfill(elenco, s.porta, lerAudio);
    expect(segunda).toMatchObject({
      usuariosCriados: 0,
      usuariosQueJaExistiam: 7,
      postsInseridos: 0,
      postsQueJaExistiam: 22,
      comentariosInseridos: 0,
      comentariosQueJaExistiam: 6,
    });
    expect(JSON.stringify([...s.posts.entries(), ...s.comentarios.entries(), ...s.usuarios.entries()])).toBe(antes);
    expect(s.posts.size).toBe(22);
    expect(s.comentarios.size).toBe(6);
  });

  it('contas primeiro, depois posts em ordem de data, comentários por último; áudio antes do post', async () => {
    const s = criarServidorFalso();
    await executarBackfill(elenco, s.porta, lerAudio);
    const ordem = s.chamadas;
    const ultimaConta = Math.max(...ordem.map((c, i) => (c.startsWith('conta:') ? i : -1)));
    const primeiroPost = ordem.findIndex((c) => c.startsWith('post:'));
    const ultimoPost = Math.max(...ordem.map((c, i) => (c.startsWith('post:') ? i : -1)));
    const primeiroComentario = ordem.findIndex((c) => c.startsWith('comentario:'));
    expect(ultimaConta).toBeLessThan(primeiroPost);
    expect(ultimoPost).toBeLessThan(primeiroComentario);
    expect(ordem.filter((c) => c.startsWith('post:'))).toEqual(
      [...elenco.posts].sort((a, b) => a.criadoEm.localeCompare(b.criadoEm)).map((p) => `post:${p.chave}`),
    );
    for (const p of elenco.posts.filter((x) => x.caminhoDoAudio)) {
      expect(ordem.indexOf(`audio:${p.caminhoDoAudio}`)).toBeLessThan(ordem.indexOf(`post:${p.chave}`));
    }
  });

  it('falha no meio para a carga na hora, não vira sucesso, e rodar de novo termina o serviço', async () => {
    const s = criarServidorFalso();
    s.falharEm('post:p09');
    await expect(executarBackfill(elenco, s.porta, lerAudio)).rejects.toThrow(/falha simulada em post:p09/);
    expect(s.chamadas.some((c) => c.startsWith('comentario:'))).toBe(false);
    expect(s.posts.size).toBeLessThan(22);

    s.falharEm(null);
    const retomada = await executarBackfill(elenco, s.porta, lerAudio);
    expect(retomada.postsInseridos + retomada.postsQueJaExistiam).toBe(22);
    expect(s.posts.size).toBe(22);
    expect(s.comentarios.size).toBe(6);
  });

  it('o áudio só vai para quem tem caminho; post de texto não envia nada', async () => {
    const s = criarServidorFalso();
    await executarBackfill(elenco, s.porta, lerAudio);
    expect(s.audios.size).toBe(elenco.posts.filter((p) => p.caminhoDoAudio).length);
  });
});

describe('desfazer', () => {
  it('apaga só o que a carga criou e deixa o que é de outra pessoa', async () => {
    const s = criarServidorFalso();
    await executarBackfill(elenco, s.porta, lerAudio);
    const alheio = { ...elenco.posts[0], id: 'id-de-outra-pessoa', chave: 'x' };
    s.posts.set(alheio.id, alheio);

    await executarDesfazer(elenco, s.porta);
    expect([...s.posts.keys()]).toEqual(['id-de-outra-pessoa']);
    expect(s.comentarios.size).toBe(0);
    expect(s.usuarios.size).toBe(0);
    expect(s.audios.size).toBe(0);
  });
});

describe('trava de projeto', () => {
  const ok = {
    projeto: 'abcdefghijklmnop',
    confirma: 'abcdefghijklmnop',
    url: 'https://abcdefghijklmnop.supabase.co',
    chave: 'segredo',
  };

  it('aceita quando tudo bate', () => {
    expect(confirmarProjeto(ok)).toMatchObject({ ok: true, projeto: 'abcdefghijklmnop' });
  });

  it.each([
    ['sem --projeto', { projeto: undefined }],
    ['sem confirmação no ambiente', { confirma: undefined }],
    ['confirmação diferente', { confirma: 'outroprojeto123' }],
    ['URL de outro projeto', { url: 'https://zzzzzzzzzzzzzzzz.supabase.co' }],
    ['URL que não é Supabase', { url: 'https://abcdefghijklmnop.exemplo.com' }],
    ['sem URL', { url: undefined }],
    ['sem chave', { chave: undefined }],
    ['ref que não parece ref', { projeto: 'x', confirma: 'x' }],
  ])('recusa: %s', (_nome, troca) => {
    expect(confirmarProjeto({ ...ok, ...troca }).ok).toBe(false);
  });

  it('a recusa nunca repete a chave', () => {
    const r = confirmarProjeto({ ...ok, confirma: 'outro', chave: 'SEGREDO-NAO-IMPRIMIR' });
    expect(JSON.stringify(r)).not.toContain('SEGREDO-NAO-IMPRIMIR');
  });
});
