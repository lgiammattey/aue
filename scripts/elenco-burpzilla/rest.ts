/**
 * A porta do servidor sobre fetch puro: PostgREST, Auth admin e Storage.
 *
 * Sem `supabase-js` de propósito: o script usa a chave de serviço, que dá
 * acesso total, e quanto menos camada entre ela e a requisição, mais fácil
 * conferir o que sai. A chave vem de variável de ambiente sem prefixo `VITE_`
 * (o Vite só expõe ao navegador o que começa com `VITE_`) e nunca é impressa.
 */
import { randomBytes } from 'node:crypto';

import type { PortaDoDesfazer, PortaDoServidor } from './execucao.ts';

const TEMPO_DA_REQUISICAO_MS = 20_000;
const BUCKET = 'audio_da_casa';

interface Conexao {
  readonly url: string;
  readonly chave: string;
}

async function chamar(
  c: Conexao,
  caminho: string,
  init: { method: string; headers?: Record<string, string>; body?: string | Blob },
  aceitar: readonly number[] = [],
): Promise<Response> {
  const resposta = await fetch(`${c.url}${caminho}`, {
    ...init,
    headers: { apikey: c.chave, Authorization: `Bearer ${c.chave}`, ...init.headers },
    signal: AbortSignal.timeout(TEMPO_DA_REQUISICAO_MS),
  });
  if (!resposta.ok && !aceitar.includes(resposta.status)) {
    const corpo = (await resposta.text()).slice(0, 400);
    throw new Error(`${init.method} ${caminho} respondeu ${resposta.status}: ${corpo}`);
  }
  return resposta;
}

async function rpc<T>(c: Conexao, nome: string, args: Record<string, unknown>): Promise<T> {
  const r = await chamar(c, `/rest/v1/rpc/${nome}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(args),
  });
  return (await r.json()) as T;
}

export function criarPortaDoServidor(c: Conexao): PortaDoServidor & PortaDoDesfazer {
  const apagarPorId = async (tabela: string, ids: readonly string[]) => {
    if (ids.length === 0) return;
    await chamar(c, `/rest/v1/${tabela}?id=in.(${ids.join(',')})`, { method: 'DELETE' });
  };

  return {
    async garantirUsuario(conta) {
      const existente = await chamar(c, `/auth/v1/admin/users/${conta.id}`, { method: 'GET' }, [404]);
      if (existente.status === 200) return 'existia';

      // Senha aleatória, descartada na hora: ninguém entra nessa conta por senha.
      const senha = randomBytes(32).toString('base64url');
      const criado = await chamar(c, '/auth/v1/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: conta.id,
          email: conta.email,
          password: senha,
          email_confirm: true,
          user_metadata: { name: conta.apelido },
        }),
      });
      const usuario = (await criado.json()) as { id?: string };
      if (usuario.id !== conta.id) {
        throw new Error(
          `O Auth criou o usuário de ${conta.handle} com outro id (${usuario.id}). ` +
            'O id fixo não foi respeitado: apague esse usuário à mão antes de tentar de novo.',
        );
      }
      return 'criado';
    },

    async registrarConta(conta) {
      await rpc(c, 'registrar_conta_da_casa', {
        p_usuario_id: conta.id,
        p_papel: conta.papel,
        p_apelido: conta.apelido,
        p_handle: conta.handle,
        p_bio: conta.bio,
        p_criado_em: conta.criadoEm,
      });
    },

    async enviarAudio(caminho, bytes) {
      await chamar(c, `/storage/v1/object/${BUCKET}/${caminho}`, {
        method: 'POST',
        headers: { 'Content-Type': 'audio/mp4', 'x-upsert': 'true', 'Cache-Control': 'max-age=31536000' },
        body: new Blob([new Uint8Array(bytes)], { type: 'audio/mp4' }),
      });
    },

    async publicarPost(post) {
      return rpc<boolean>(c, 'publicar_da_casa', {
        p_id: post.id,
        p_usuario_id: post.autorId,
        p_topico: post.topico,
        p_conteudo: post.texto,
        p_criado_em: post.criadoEm,
        p_caminho_do_audio: post.caminhoDoAudio,
      });
    },

    async comentar(comentario) {
      return rpc<boolean>(c, 'comentar_da_casa', {
        p_id: comentario.id,
        p_post_id: comentario.postId,
        p_usuario_id: comentario.autorId,
        p_conteudo: comentario.texto,
        p_criado_em: comentario.criadoEm,
      });
    },

    removerComentarios: (ids) => apagarPorId('comentarios', ids),
    removerPosts: (ids) => apagarPorId('posts_comunidade', ids),

    async removerAudios(caminhos) {
      if (caminhos.length === 0) return;
      await chamar(c, `/storage/v1/object/${BUCKET}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prefixes: caminhos }),
      });
    },

    async removerUsuarios(ids) {
      for (const id of ids) await chamar(c, `/auth/v1/admin/users/${id}`, { method: 'DELETE' }, [404]);
    },
  };
}
