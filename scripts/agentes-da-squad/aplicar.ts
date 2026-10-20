/**
 * Cadastra as contas oficiais da squad sem expor senha ou chave de serviço.
 *
 * Uso:
 *   AUE_SUPABASE_URL=... AUE_SERVICE_ROLE_KEY=... AUE_CONFIRMA_PROJETO=... \
 *     npm run squad:contas -- --aplicar --projeto <ref>
 */
import { randomBytes } from 'node:crypto';

import { confirmarProjeto } from '../elenco-burpzilla/confirmacao.ts';
import { idDaConta } from '../../src/nucleo/elenco/montagem.ts';

const DOMINIO_INTERNO = 'contas-da-casa.invalid';
const AGENTES = [
  { handle: 'tiago_aue', apelido: 'Tiago', bio: 'Braço direito do Luiz e guardião do produto.' },
  { handle: 'iury_aue', apelido: 'Iury', bio: 'Capitão da oficina e guardião do ritmo do Auê.' },
  { handle: 'rian_aue', apelido: 'Rian', bio: 'Diretor de experiência e guardião das telas do Auê.' },
  { handle: 'kayky_aue', apelido: 'Kayky', bio: 'Engenheiro de telas, Arena e frontend do Auê.' },
  { handle: 'lucas_aue', apelido: 'Lucas', bio: 'Engenheiro de áudio, inteligência e backend do Auê.' },
  { handle: 'camillo_aue', apelido: 'Camillo', bio: 'Engenheiro de plataforma, performance e arquitetura.' },
  { handle: 'rodrigo_aue', apelido: 'Rodrigo', bio: 'Cuida da descoberta e da visibilidade do Auê.' },
  { handle: 'marcelo_aue', apelido: 'Marcelo', bio: 'Qualidade, caça-bugs e confiabilidade do Auê.' },
] as const;

interface Conexao { readonly url: string; readonly chave: string; }

function argumento(argv: readonly string[], nome: string): string | undefined {
  const indice = argv.indexOf(nome);
  return indice >= 0 ? argv[indice + 1] : undefined;
}

async function chamar(c: Conexao, caminho: string, init: RequestInit = {}, aceitar: readonly number[] = []): Promise<Response> {
  const resposta = await fetch(`${c.url}${caminho}`, {
    ...init,
    headers: { apikey: c.chave, Authorization: `Bearer ${c.chave}`, ...init.headers },
    signal: AbortSignal.timeout(20_000),
  });
  if (!resposta.ok && !aceitar.includes(resposta.status)) {
    throw new Error(`${init.method ?? 'GET'} ${caminho} respondeu ${resposta.status}: ${(await resposta.text()).slice(0, 400)}`);
  }
  return resposta;
}

async function garantirUsuario(c: Conexao, agente: (typeof AGENTES)[number]): Promise<'criado' | 'existia'> {
  const id = idDaConta(agente.handle);
  const email = `${agente.handle}@${DOMINIO_INTERNO}`;
  const existente = await chamar(c, `/auth/v1/admin/users/${id}`, {}, [404]);
  if (existente.status === 200) {
    const usuario = await existente.json() as { email?: string };
    if (usuario.email !== email) throw new Error(`O id de @${agente.handle} já pertence a outro e-mail.`);
    return 'existia';
  }

  const resposta = await chamar(c, '/auth/v1/admin/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id,
      email,
      password: randomBytes(32).toString('base64url'),
      email_confirm: true,
      user_metadata: { name: agente.apelido },
    }),
  });
  const usuario = await resposta.json() as { id?: string };
  if (usuario.id !== id) throw new Error(`Auth devolveu um id inesperado para @${agente.handle}.`);
  return 'criado';
}

async function registrarAgente(c: Conexao, agente: (typeof AGENTES)[number]): Promise<void> {
  const resposta = await chamar(c, '/rest/v1/rpc/registrar_agente_da_squad', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      p_usuario_id: idDaConta(agente.handle), p_apelido: agente.apelido,
      p_handle: agente.handle, p_bio: agente.bio,
    }),
  });
  await resposta.text();
}

async function validar(c: Conexao): Promise<void> {
  const ids = AGENTES.map((a) => idDaConta(a.handle)).join(',');
  const resposta = await chamar(c, `/rest/v1/perfis?select=id,handle,apelido,perfil_social_concluido_em,e_fundador&id=in.(${ids})`);
  const perfis = await resposta.json() as Array<{ id: string; handle: string; apelido: string; perfil_social_concluido_em: string | null; e_fundador: boolean }>;
  if (perfis.length !== AGENTES.length) throw new Error('A validação não encontrou os oito perfis da squad.');
  for (const agente of AGENTES) {
    const perfil = perfis.find((p) => p.id === idDaConta(agente.handle));
    if (!perfil || perfil.handle !== agente.handle || perfil.apelido !== agente.apelido || !perfil.perfil_social_concluido_em || perfil.e_fundador) {
      throw new Error(`O perfil de @${agente.handle} não ficou como combinado.`);
    }
  }

  const contasResposta = await chamar(c, `/rest/v1/contas_da_casa?select=usuario_id,papel&usuario_id=in.(${ids})`);
  const contas = await contasResposta.json() as Array<{ usuario_id: string; papel: string }>;
  if (contas.length !== AGENTES.length || contas.some((conta) => conta.papel !== 'agente')) {
    throw new Error('A validação não encontrou as oito contas da squad como agentes oficiais.');
  }

  const membrosResposta = await chamar(c, `/rest/v1/membros_grupo?select=user_id,grupos!inner(slug)&user_id=in.(${ids})&grupos.slug=eq.bonde-geral`);
  const membros = await membrosResposta.json() as Array<{ user_id: string }>;
  if (membros.length !== AGENTES.length) throw new Error('A validação não encontrou a squad inteira no Bonde Geral.');
}

async function principal(): Promise<void> {
  const argv = process.argv.slice(2);
  if (!argv.includes('--aplicar')) {
    console.log(`DRY-RUN: ${AGENTES.map((a) => `@${a.handle}`).join(', ')}. Use --aplicar para gravar.`);
    return;
  }
  const confirmado = confirmarProjeto({
    projeto: argumento(argv, '--projeto'),
    confirma: process.env.AUE_CONFIRMA_PROJETO,
    url: process.env.AUE_SUPABASE_URL,
    chave: process.env.AUE_SERVICE_ROLE_KEY,
  });
  if (!confirmado.ok) throw new Error(`Recusado: ${confirmado.motivo}.`);
  const conexao = { url: confirmado.url, chave: confirmado.chave };
  for (const agente of AGENTES) {
    const estado = await garantirUsuario(conexao, agente);
    await registrarAgente(conexao, agente);
    console.log(`@${agente.handle}: ${estado}`);
  }
  await validar(conexao);
  console.log('Squad cadastrada e validada: 8 perfis sociais oficiais.');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  principal().catch((erro: unknown) => {
    console.error(erro instanceof Error ? erro.message : 'Falha ao cadastrar a squad.');
    process.exit(1);
  });
}
