/**
 * Pergunta ao agendamento: a lista de grupos mudou desde o que está no ar?
 * Escreve `mudou=true|false` em $GITHUB_OUTPUT. Barato de propósito: só duas
 * leituras e um hash, sem build.
 *
 * Mudou = o hash do banco é diferente do `g/lista.json` publicado. Se o
 * arquivo publicado não existe, vale o hash da lista vazia.
 * Leitura do banco falhou: não publica (`false`), porque não dá para saber.
 */
import { appendFileSync } from 'node:fs';

import { ORIGEM_CANONICA } from '../src/shared/enderecoPublico.ts';
import { hashDaLista } from '../src/nucleo/grupos/paginaEstatica.ts';
import { credenciaisDoBuild, lerGruposVisiveis } from './grupos-do-supabase.ts';

function responder(mudou: boolean, motivo: string): never {
  console.log(`grupos: mudou=${mudou} (${motivo})`);
  if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `mudou=${mudou}\n`);
  process.exit(0);
}

const credenciais = credenciaisDoBuild();
if (!credenciais) responder(false, 'sem credencial do Supabase');

const grupos = await lerGruposVisiveis(credenciais.url, credenciais.chave);
if (!grupos) responder(false, 'não consegui ler o banco');

const doBanco = await hashDaLista(grupos);

/**
 * O que está no ar. Antes da primeira publicação o arquivo não existe, e o
 * Firebase responde 200 com o `index.html` da SPA (é o catch-all): isso conta
 * como "nada publicado", não como erro. Erro de verdade é a rede cair.
 */
async function hashPublicado(): Promise<string | null> {
  try {
    const r = await fetch(`${ORIGEM_CANONICA}/g/lista.json`, { signal: AbortSignal.timeout(15000), cache: 'no-store' });
    const vazio = await hashDaLista([]);
    if (!r.ok) return vazio;
    try {
      const hash = (JSON.parse(await r.text()) as { hash?: unknown }).hash;
      return typeof hash === 'string' ? hash : vazio;
    } catch {
      return vazio;
    }
  } catch (erro) {
    console.warn('grupos: não consegui ler a lista publicada', erro);
    return null;
  }
}

const publicado = await hashPublicado();
if (publicado === null) responder(true, 'lista publicada inalcançável, republicar é o lado seguro');

responder(doBanco !== publicado, doBanco === publicado ? 'lista igual à publicada' : 'lista diferente da publicada');
