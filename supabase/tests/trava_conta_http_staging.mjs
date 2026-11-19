// Teste manual de corrida no projeto de staging identificado abaixo.
// Usa exclusivamente usuários/arquivos sintéticos criados nesta execução.
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
const ref = 'rrkkmzamjntplgxktkyc', url = `https://${ref}.supabase.co`, bucket = 'duelos_v2';
const { AUE_STAGING_TEST, AUE_STAGING_ANON_KEY: anon, AUE_STAGING_SERVICE_KEY: service, SUPABASE_ACCESS_TOKEN: management } = process.env;
if (AUE_STAGING_TEST !== 'sim' || !anon || !service || !management) throw Error('Teste não iniciado: faltam confirmação e credenciais do staging.');
const options = { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } };
const admin = createClient(url, service, options), users = [], recordings = [], duelIds = [];
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const checked = (r, label) => { if (r.error) throw Error(`${label}: HTTP ${r.error.status ?? r.error.statusCode ?? 'sem status'}`); return r.data; };
const rpc = async (client, name, params = {}) => checked(await client.rpc(name, params), name);
async function createUser() {
  const client = createClient(url, anon, options);
  const data = checked(await client.auth.signInAnonymously(), 'sessão sintética');
  assert.match(data.user.id, uuid);
  const person = { id: data.user.id, client }; users.push(person); return person;
}
async function prepare(person) {
  const value = await rpc(person.client, 'aue_v2_preparar_gravacao');
  assert.match(value.id, uuid); assert.equal(value.bucket, bucket); assert.equal(value.caminho, `${person.id}/${value.id}.wav`);
  recordings.push({ ...value, person }); return value;
}
async function upload(person, rec) { return person.client.storage.from(bucket).upload(rec.caminho, new Uint8Array(100), { contentType: 'audio/wav', upsert: false }); }
async function lock(person) { const result = await rpc(admin, 'aue_v2_iniciar_exclusao_conta', { p_usuario_id: person.id }); assert.equal(result.estado, 'bloqueada'); }
async function mustDeny(person, operation, params = {}) {
  const result = await person.client.rpc(operation, params);
  assert.ok(result.error && ['42501', 'PGRST301'].includes(result.error.code), `${operation} não bloqueou por autorização`);
}
async function sql(query) {
  const response = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, { method: 'POST', headers: { Authorization: `Bearer ${management}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ query }) });
  if (!response.ok) throw Error(`Limpeza SQL HTTP ${response.status}`);
  return response.json();
}
const ids = (items) => items.length ? items.map((id) => { assert.match(id, uuid); return `'${id}'::uuid`; }).join(',') : 'NULL';
async function cleanup() {
  const errors = [];
  for (const rec of recordings) try {
    assert.equal(rec.caminho, `${rec.person.id}/${rec.id}.wav`);
    checked(await admin.storage.from(bucket).remove([rec.caminho]), 'remover arquivo sintético');
    const after = await admin.storage.from(bucket).download(rec.caminho);
    if (!after.error || ![400, 404].includes(Number(after.error.status ?? after.error.statusCode))) throw Error('remoção não confirmada');
  } catch (e) { errors.push(`arquivo ${rec.id}: ${e.message}`); }
  if (!errors.length && users.length) try {
    const people = ids(users.map((x) => x.id)), recs = ids(recordings.map((x) => x.id));
    const duels = `SELECT id FROM aue_privado.duelos_v2 WHERE criador_id IN (${people}) AND gravacao_criador_id IN (${recs})`;
    await sql(`BEGIN;
DELETE FROM aue_privado.decisoes_moderacao_v2 WHERE denuncia_id IN (SELECT id FROM aue_privado.denuncias_v2 WHERE duelo_id IN (${duels}) AND denunciante_id IN (${people}));
DELETE FROM aue_privado.denuncias_v2 WHERE duelo_id IN (${duels}) AND denunciante_id IN (${people});
DELETE FROM aue_privado.duelos_v2 WHERE id IN (${duels});
DELETE FROM aue_privado.gravacoes_v2 WHERE id IN (${recs}) AND usuario_id IN (${people});
COMMIT;`);
    for (const person of users) checked(await admin.auth.admin.deleteUser(person.id), 'apagar conta sintética');
    // Manter a trava até depois da remoção das contas para não reabrir escrita.
    await sql(`DELETE FROM aue_privado.contas_em_exclusao_v2 WHERE usuario_id IN (${people});`);
  } catch (e) { errors.push(`registros ou contas: ${e.message}`); }
  if (errors.length) {
    console.error('Limpeza incompleta:', JSON.stringify({ users: users.map((u) => u.id), recordings: recordings.map((r) => r.id), duels: duelIds }));
    throw Error(errors.join('; '));
  }
}
let failure;
try {
  const racer = await createUser(), other = await createUser();
  const rec = await prepare(racer);
  // As duas chamadas HTTP em voo disputam a mesma trava transacional.
  const [uploaded, blocked] = await Promise.all([upload(racer, rec), lock(racer)]);
  assert.equal(blocked, undefined);
  if (uploaded.error) assert.ok([400, 403].includes(Number(uploaded.error.status ?? uploaded.error.statusCode)), 'falha de rede não prova bloqueio');
  console.log(`Corrida upload: ${uploaded.error ? 'bloqueio venceu' : 'upload venceu'}; inventário será verificado.`);
  await lock(racer); // retry idempotente
  const inventory = await rpc(admin, 'aue_v2_inventario_exclusao_conta', { p_usuario_id: racer.id, p_apos: null });
  assert.ok(inventory.some((item) => item.id === rec.id && item.caminho === rec.caminho));
  await mustDeny(racer, 'aue_v2_preparar_gravacao');
  await mustDeny(racer, 'aue_v2_confirmar_gravacao', { p_id: rec.id, p_duracao_ms: 1000, p_versao_regua: 'experimental-2' });
  await mustDeny(racer, 'aue_v2_criar_duelo', { p_gravacao_id: rec.id, p_token: randomBytes(32).toString('hex') });
  await mustDeny(racer, 'aue_v2_responder_duelo', { p_gravacao_id: rec.id, p_token: randomBytes(32).toString('hex') });
  await mustDeny(racer, 'aue_v2_reemitir_convite', { p_gravacao_id: rec.id, p_token_novo: randomBytes(32).toString('hex'), p_versao_esperada: 1 });
  await mustDeny(racer, 'aue_v2_denunciar_por_duelo', { p_duelo_id: rec.id, p_alvo: 'criador', p_motivo: 'outro' });
  const retryUpload = await upload(racer, rec);
  assert.ok(retryUpload.error && [400, 403, 409].includes(Number(retryUpload.error.status ?? retryUpload.error.statusCode)), 'upload após bloqueio não foi recusado');
  // Uma identidade independente permanece apta a gravar.
  const independent = await prepare(other);
  checked(await upload(other, independent), 'upload de outra conta');
  assert.equal((await rpc(other.client, 'aue_v2_confirmar_gravacao', { p_id: independent.id, p_duracao_ms: 1000, p_versao_regua: 'experimental-2' })).estado, 'confirmada');
  const raceToken = randomBytes(32).toString('hex');
  const [createResult] = await Promise.all([
    other.client.rpc('aue_v2_criar_duelo', { p_gravacao_id: independent.id, p_token: raceToken }),
    lock(other),
  ]);
  if (createResult.error) assert.equal(createResult.error.code, '42501');
  else { assert.match(createResult.data.id, uuid); duelIds.push(createResult.data.id); assert.equal(createResult.data.estado, 'aguardando_resposta'); }
  console.log(`Corrida criação: ${createResult.error ? 'bloqueio venceu' : 'criação venceu'}; novas tentativas devem ser negadas.`);
  await mustDeny(other, 'aue_v2_criar_duelo', { p_gravacao_id: independent.id, p_token: raceToken });
  const secondInventory = await rpc(admin, 'aue_v2_inventario_exclusao_conta', { p_usuario_id: other.id, p_apos: null });
  assert.ok(secondInventory.some((item) => item.id === independent.id && item.caminho === independent.caminho));
  // Envia o primeiro bloco antes de iniciar o bloqueio e mantém o restante pendente.
  // O cliente comprova início da transmissão, não o estágio interno do servidor.
  const streamingUser = await createUser(), pending = await prepare(streamingUser);
  const session = checked(await streamingUser.client.auth.getSession(), 'sessão de streaming').session;
  let unblock; const gate = new Promise((resolve) => { unblock = resolve; });
  let markStarted; const started = new Promise((resolve) => { markStarted = resolve; });
  async function* body() { yield new Uint8Array(1024); markStarted(); await gate; yield new Uint8Array(1024); }
  const runningUpload = fetch(`${url}/storage/v1/object/${bucket}/${pending.caminho}`, {
    method: 'POST', headers: { apikey: anon, Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'audio/wav', 'x-upsert': 'false' }, body: body(), duplex: 'half', signal: AbortSignal.timeout(30000),
  });
  await started;
  try { await lock(streamingUser); } finally { unblock(); }
  const uploadResponse = await runningUpload;
  console.log('Upload iniciado antes da exclusão:', JSON.stringify({ status: uploadResponse.status }));
  assert.ok([200, 400, 403].includes(uploadResponse.status), 'resposta HTTP inesperada na corrida de upload');
  const streamInventory = await rpc(admin, 'aue_v2_inventario_exclusao_conta', { p_usuario_id: streamingUser.id, p_apos: null });
  assert.ok(streamInventory.some((item) => item.id === pending.id && item.caminho === pending.caminho));
  await mustDeny(streamingUser, 'aue_v2_confirmar_gravacao', { p_id: pending.id, p_duracao_ms: 1000, p_versao_regua: 'experimental-2' });
  const afterLockUpload = await upload(streamingUser, pending);
  assert.ok(afterLockUpload.error && [400, 403, 409].includes(Number(afterLockUpload.error.status ?? afterLockUpload.error.statusCode)), 'upload após trava indevidamente aceito');
  // Controle idêntico, sem bloquear a conta, garante que o servidor aceita o formato.
  const controlUser = await createUser(), control = await prepare(controlUser);
  const controlSession = checked(await controlUser.client.auth.getSession(), 'sessão controle').session;
  async function* controlBody() { yield new Uint8Array(1024); yield new Uint8Array(1024); }
  const controlResponse = await fetch(`${url}/storage/v1/object/${bucket}/${control.caminho}`, {
    method: 'POST', headers: { apikey: anon, Authorization: `Bearer ${controlSession.access_token}`, 'Content-Type': 'audio/wav', 'x-upsert': 'false' }, body: controlBody(), duplex: 'half', signal: AbortSignal.timeout(30000),
  });
  console.log('Upload de controle sem bloqueio:', JSON.stringify({ status: controlResponse.status }));
  assert.ok(controlResponse.ok, 'servidor recusou formato de streaming mesmo sem exclusão; corrida inconclusiva');
  assert.equal((await rpc(controlUser.client, 'aue_v2_confirmar_gravacao', { p_id: control.id, p_duracao_ms: 1000, p_versao_regua: 'experimental-2' })).estado, 'confirmada');
  console.log('Trava de conta: corrida upload/bloqueio, retry, inventário, operações negadas e outra conta passaram.');
} catch (error) { failure = error; }
try { await cleanup(); console.log('Limpeza dos dados sintéticos concluída.'); }
catch (error) { failure = failure ? new AggregateError([failure, error], 'Teste e limpeza falharam') : error; }
if (failure) { let output = failure.stack ?? String(failure); for (const secret of [anon, service, management]) output = output.replaceAll(secret, '[credencial omitida]'); console.error(output); process.exitCode = 1; }
