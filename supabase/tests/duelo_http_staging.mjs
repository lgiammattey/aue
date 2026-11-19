// Teste destrutivo APENAS para os dados que ele próprio cria no aue-staging.
// Requer: URL/chaves do staging, token da Management API e schema já preparado.
// Não aplica migrations nem cria bucket. Nunca aceita outro projeto.
// Executar manualmente: AUE_STAGING_TEST=sim node supabase/tests/duelo_http_staging.mjs
// Variáveis: AUE_STAGING_ANON_KEY, AUE_STAGING_SERVICE_KEY, SUPABASE_ACCESS_TOKEN.
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

const ref = 'rrkkmzamjntplgxktkyc';
const url = `https://${ref}.supabase.co`;
const bucket = 'duelos_v2';
const { AUE_STAGING_TEST, AUE_STAGING_ANON_KEY: anon, AUE_STAGING_SERVICE_KEY: service, SUPABASE_ACCESS_TOKEN: management } = process.env;
const cacheZero = process.env.AUE_HTTP_CACHE_ZERO === 'sim';
const noStore = process.env.AUE_HTTP_NO_STORE === 'sim';
if (AUE_STAGING_TEST !== 'sim' || !anon || !service || !management) {
  throw new Error('Teste não iniciado: faltam autorização explícita e credenciais do staging.');
}
let observarStorage = false;
const observedFetch = async (...args) => {
  const response = await fetch(...args);
  if (observarStorage && String(args[0] instanceof Request ? args[0].url : args[0]).includes('/storage/v1/object/')) {
    console.log('HTTP áudio autenticado:', JSON.stringify({ status: response.status, cache: response.headers.get('cache-control'), age: response.headers.get('age'), cf: response.headers.get('cf-cache-status') }));
  }
  return response;
};
const options = { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }, global: { fetch: observedFetch } };
const admin = createClient(url, service, options);
const users = [];
const recordings = [];
const duelIds = [];
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const token = () => randomBytes(32).toString('hex');
const audio = new Uint8Array(100); // Conteúdo sintético, não contém voz ou pessoa.
const check = (result, where) => {
  if (result.error) throw new Error(`${where}: HTTP ${result.error.status ?? result.error.statusCode ?? 'sem status'}`);
  return result.data;
};
async function rpc(client, name, args = {}) { return check(await client.rpc(name, args), name); }
async function user() {
  const client = createClient(url, anon, options);
  const data = check(await client.auth.signInAnonymously(), 'criar sessão de teste');
  assert.match(data.user.id, uuid);
  users.push({ id: data.user.id, client });
  return users.at(-1);
}
async function recording(person, duration) {
  const prepared = await rpc(person.client, 'aue_v2_preparar_gravacao');
  assert.match(prepared.id, uuid);
  assert.equal(prepared.bucket, bucket);
  assert.equal(prepared.caminho, `${person.id}/${prepared.id}.wav`);
  // Registrar antes do upload para limpar até em caso de resposta perdida.
  recordings.push({ ...prepared, person });
  check(await person.client.storage.from(bucket).upload(prepared.caminho, audio, { contentType: 'audio/wav', upsert: false, ...(cacheZero ? { cacheControl: '0' } : {}) }), 'upload');
  const confirmed = await rpc(person.client, 'aue_v2_confirmar_gravacao', { p_id: prepared.id, p_duracao_ms: duration, p_versao_regua: 'experimental-2' });
  assert.equal(confirmed.estado, 'confirmada');
  return prepared;
}
async function create(person, recordingId, invite) {
  const duel = await rpc(person.client, 'aue_v2_criar_duelo', { p_gravacao_id: recordingId, p_token: invite });
  assert.match(duel.id, uuid);
  duelIds.push(duel.id);
  assert.equal(duel.estado, 'aguardando_resposta');
  return duel;
}
async function deniedDownload(person, path, recordingId) {
  const result = await person.client.storage.from(bucket).download(path, {}, noStore ? { cache: 'no-store' } : undefined);
  if (recordingId) {
    // Comparar o mesmo endereço com outro contendo nonce, sem expor o endereço.
    const session = check(await person.client.auth.getSession(), 'ler sessão de teste').session;
    const response = await fetch(`${url}/storage/v1/object/${bucket}/${path}?teste=${randomBytes(8).toString('hex')}`, {
      headers: { apikey: anon, Authorization: `Bearer ${session.access_token}`, 'Cache-Control': 'no-cache' },
    });
    console.log('HTTP áudio com nonce:', JSON.stringify({ status: response.status, cache: response.headers.get('cache-control'), age: response.headers.get('age'), cf: response.headers.get('cf-cache-status') }));
    if (!result.error || response.ok) {
      assert.match(recordingId, uuid);
      console.error('Estado SQL de denúncia:', JSON.stringify(await managementSql(`SELECT (oculta_por_denuncia_em IS NOT NULL) AS oculta FROM aue_privado.gravacoes_v2 WHERE id = '${recordingId}'::uuid`)));
    }
    if (response.ok) console.error('Áudio acessível na mesma rota com nonce após denúncia.');
  }
  assert.ok(result.error, 'Áudio privado foi entregue a quem não deveria acessar');
  assert.ok([400, 403, 404].includes(Number(result.error.status ?? result.error.statusCode)), 'Erro de rede não prova proteção do áudio');
}
async function managementSql(query) {
  const result = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
    method: 'POST', headers: { Authorization: `Bearer ${management}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ query }),
  });
  if (!result.ok) throw new Error(`Management API falhou na limpeza (HTTP ${result.status})`);
  return await result.json();
}
const sqlIds = (items) => items.length ? items.map((id) => { assert.match(id, uuid); return `'${id}'::uuid`; }).join(',') : 'NULL';

async function cleanup() {
  const errors = [];
  // O service role atua apenas sobre caminhos devolvidos para estas sessões.
  for (const rec of recordings) {
    try {
      assert.equal(rec.caminho, `${rec.person.id}/${rec.id}.wav`);
      check(await admin.storage.from(bucket).remove([rec.caminho]), 'limpeza do objeto');
      const found = await admin.storage.from(bucket).download(rec.caminho);
      if (!found.error || ![400, 404].includes(Number(found.error.status ?? found.error.statusCode))) throw new Error('remoção do objeto não comprovada');
    } catch (error) { errors.push(`arquivo ${rec.id}: ${error.message}`); }
  }
  // As FKs atuais impedem excluir contas; remover somente IDs gerados nesta execução.
  // Não apagar contas se uma etapa anterior falhar; preservar IDs para reparo manual.
  if (!errors.length && (duelIds.length || recordings.length)) {
    try {
      const duels = sqlIds(duelIds), recs = sqlIds(recordings.map((r) => r.id)), people = sqlIds(users.map((u) => u.id));
      const ownDuels = `SELECT id FROM aue_privado.duelos_v2 WHERE criador_id IN (${people}) AND (id IN (${duels}) OR gravacao_criador_id IN (${recs}))`;
      await managementSql(`BEGIN;
DELETE FROM aue_privado.decisoes_moderacao_v2 WHERE denuncia_id IN (SELECT id FROM aue_privado.denuncias_v2 WHERE duelo_id IN (${ownDuels}) AND denunciante_id IN (${people}));
DELETE FROM aue_privado.denuncias_v2 WHERE duelo_id IN (${ownDuels}) AND denunciante_id IN (${people});
DELETE FROM aue_privado.duelos_v2 WHERE id IN (${ownDuels});
DELETE FROM aue_privado.gravacoes_v2 WHERE id IN (${recs}) AND usuario_id IN (${people});
COMMIT;`);
    } catch (error) { errors.push(`registros: ${error.message}`); }
  }
  if (!errors.length) for (const person of users) {
    try { check(await admin.auth.admin.deleteUser(person.id), 'excluir conta de teste'); }
    catch (error) { errors.push(`conta ${person.id}: ${error.message}`); }
  }
  if (errors.length) {
    console.error('Limpeza incompleta. IDs criados nesta execução:', JSON.stringify({ users: users.map((u) => u.id), recordings: recordings.map((r) => r.id), duels: duelIds }));
    throw new Error(errors.join('; '));
  }
}

let failure;
try {
  // Criação sequencial evita encerrar e limpar enquanto outra criação ainda está em voo.
  const creator = await user(), challenger1 = await user(), challenger2 = await user(), outsider = await user();
  const a = await recording(creator, 2000), b = await recording(challenger1, 3000), c = await recording(challenger2, 4000);
  const invite = token();
  const duel = await create(creator, a.id, invite);
  const opened = await rpc(challenger1.client, 'aue_v2_abrir_duelo', { p_token: invite });
  assert.deepEqual(opened, { estado: 'aguardando_resposta', categoria: 'duracao' });
  await deniedDownload(challenger1, a.caminho);
  await deniedDownload(outsider, a.caminho);
  const signed = await challenger1.client.storage.from(bucket).createSignedUrl(a.caminho, 60);
  assert.ok(signed.error, 'Não deveria conseguir assinar áudio antes de responder');
  assert.ok([400, 403, 404].includes(Number(signed.error.status ?? signed.error.statusCode)), 'Erro de rede não prova bloqueio da assinatura');
  assert.equal((await rpc(challenger1.client, 'aue_v2_revelar_duelo', { p_token: invite })).estado, 'indisponivel');
  assert.equal((await rpc(creator.client, 'aue_v2_recuperar_duelo', { p_duelo_id: duel.id })).estado, 'aguardando_resposta');

  const responses = await Promise.all([
    rpc(challenger1.client, 'aue_v2_responder_duelo', { p_token: invite, p_gravacao_id: b.id }),
    rpc(challenger2.client, 'aue_v2_responder_duelo', { p_token: invite, p_gravacao_id: c.id }),
  ]);
  assert.deepEqual(responses.map((r) => r.estado).sort(), ['ocupado', 'respondido']);
  const winner = responses[0].estado === 'respondido' ? challenger1 : challenger2;
  const loser = winner === challenger1 ? challenger2 : challenger1;
  const winningRecording = winner === challenger1 ? b : c;
  for (const person of [creator, winner]) {
    const restored = await rpc(person.client, 'aue_v2_recuperar_duelo', { p_duelo_id: duel.id });
    assert.equal(restored.estado, 'revelado');
    assert.equal(restored.criador.caminho, a.caminho);
    assert.equal(restored.desafiante.caminho, winningRecording.caminho);
    check(await person.client.storage.from(bucket).download(a.caminho), 'download participante');
    const list = await rpc(person.client, 'aue_v2_listar_meus_duelos', { p_deslocamento: 0 });
    assert.ok(list.itens.some((item) => item.id === duel.id));
    assert.ok(!JSON.stringify(list).includes(invite));
  }
  assert.equal((await rpc(loser.client, 'aue_v2_recuperar_duelo', { p_duelo_id: duel.id })).estado, 'indisponivel');
  await deniedDownload(loser, a.caminho);
  assert.equal((await rpc(outsider.client, 'aue_v2_revelar_duelo', { p_token: invite })).estado, 'indisponivel');

  observarStorage = true;
  check(await winner.client.storage.from(bucket).download(a.caminho, {}, noStore ? { cache: 'no-store' } : undefined), 'download antes da denúncia');
  // Sessão criada depois do HIT autorizado, sem histórico do objeto.
  const stranger = await user();
  await deniedDownload(stranger, a.caminho);
  const report = await rpc(winner.client, 'aue_v2_denunciar_por_duelo', { p_duelo_id: duel.id, p_alvo: 'criador', p_motivo: 'outro' });
  assert.equal(report.estado, 'registrada');
  let immediateFailure;
  try { await deniedDownload(winner, a.caminho, a.id); } catch (error) { immediateFailure = error; }
  await new Promise((resolve) => setTimeout(resolve, 1500));
  try { await deniedDownload(winner, a.caminho, a.id); } catch (error) { immediateFailure ??= error; }
  if (immediateFailure) throw immediateFailure;
  observarStorage = false;
  assert.equal((await rpc(creator.client, 'aue_v2_recuperar_duelo', { p_duelo_id: duel.id })).estado, 'indisponivel');

  const removal = await rpc(winner.client, 'aue_v2_solicitar_exclusao', { p_id: winningRecording.id });
  assert.equal(removal.estado, 'remocao_pendente');
  await deniedDownload(winner, winningRecording.caminho);
  const removed = check(await winner.client.storage.from(bucket).remove([winningRecording.caminho]), 'remoção pelo dono');
  assert.equal(removed.length, 1);
  assert.equal((await rpc(winner.client, 'aue_v2_confirmar_exclusao', { p_id: winningRecording.id })).estado, 'removida');
  const privileged = await admin.storage.from(bucket).download(winningRecording.caminho);
  assert.ok(privileged.error && [400, 404].includes(Number(privileged.error.status ?? privileged.error.statusCode)), 'Remoção física não confirmada');

  const another = await recording(creator, 1500);
  const revokedToken = token();
  const pending = await create(creator, another.id, revokedToken);
  assert.equal((await rpc(creator.client, 'aue_v2_revogar_convite', { p_gravacao_id: another.id, p_versao_esperada: pending.versao })).estado, 'revogado');
  assert.equal((await rpc(challenger1.client, 'aue_v2_abrir_duelo', { p_token: revokedToken })).estado, 'indisponivel');
  const cancelled = await recording(outsider, 1200);
  assert.equal((await rpc(outsider.client, 'aue_v2_solicitar_exclusao', { p_id: cancelled.id })).estado, 'remocao_pendente');
  await deniedDownload(outsider, cancelled.caminho);
  check(await outsider.client.storage.from(bucket).remove([cancelled.caminho]), 'remoção da tentativa cancelada');
  assert.equal((await rpc(outsider.client, 'aue_v2_confirmar_exclusao', { p_id: cancelled.id })).estado, 'removida');
  console.log('Teste HTTP: privacidade, concorrência, recuperação, denúncia, remoção e revogação passaram.');
} catch (error) { failure = error; }
try { await cleanup(); console.log('Limpeza dos dados desta execução concluída.'); }
catch (error) { failure = failure ? new AggregateError([failure, error], 'Teste e limpeza falharam') : error; }
if (failure) {
  let message = failure.stack ?? String(failure);
  for (const secret of [anon, service, management]) message = message.replaceAll(secret, '[credencial omitida]');
  console.error(message);
  process.exitCode = 1;
}
