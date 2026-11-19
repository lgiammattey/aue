// Ensaio manual em duas fases; apenas aue-staging e dados sintéticos próprios.
// Aguardar "CACHE PRONTO" antes de aplicar policy/função no staging, depois Enter.
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { once } from 'node:events';
import { createClient } from '@supabase/supabase-js';
const ref = 'rrkkmzamjntplgxktkyc', url = `https://${ref}.supabase.co`, bucket = 'duelos_v2';
const { AUE_STAGING_TEST, AUE_STAGING_ANON_KEY: anon, AUE_STAGING_SERVICE_KEY: service, SUPABASE_ACCESS_TOKEN: management } = process.env;
const edgeReady = process.env.AUE_EDGE_READY === 'sim';
if (AUE_STAGING_TEST !== 'sim' || !anon || !service || !management) throw Error('Faltam confirmação e credenciais do staging.');
const options = { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } };
const admin = createClient(url, service, options), users = [], recordings = [], duels = [];
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const check = (r, name) => { if (r.error) throw Error(`${name}: HTTP ${r.error.status ?? r.error.statusCode ?? 'sem status'}`); return r.data; };
const rpc = async (c, name, p = {}) => check(await c.rpc(name, p), name);
function wav() {
  const sampleCount = 800, data = new Uint8Array(44 + sampleCount * 2), view = new DataView(data.buffer);
  const tag = (offset, value) => [...value].forEach((c, i) => { data[offset + i] = c.charCodeAt(0); });
  tag(0, 'RIFF'); view.setUint32(4, data.length - 8, true); tag(8, 'WAVE'); tag(12, 'fmt ');
  view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, 1, true);
  view.setUint32(24, 8000, true); view.setUint32(28, 16000, true); view.setUint16(32, 2, true);
  view.setUint16(34, 16, true); tag(36, 'data'); view.setUint32(40, sampleCount * 2, true);
  for (let i = 0; i < sampleCount; i++) view.setInt16(44 + i * 2, Math.round(4000 * Math.sin(i * Math.PI / 10)), true);
  return data;
}
const audio = wav();
async function createUser() { const client = createClient(url, anon, options); const data = check(await client.auth.signInAnonymously(), 'criar sessão'); assert.match(data.user.id, uuid); const person = { id: data.user.id, client }; users.push(person); return person; }
async function recording(person, duration) {
  const rec = await rpc(person.client, 'aue_v2_preparar_gravacao'); assert.match(rec.id, uuid); assert.equal(rec.caminho, `${person.id}/${rec.id}.wav`); recordings.push({ ...rec, person });
  check(await person.client.storage.from(bucket).upload(rec.caminho, audio, { contentType: 'audio/wav', upsert: false }), 'upload');
  await rpc(person.client, 'aue_v2_confirmar_gravacao', { p_id: rec.id, p_duracao_ms: duration, p_versao_regua: 'experimental-2' }); return rec;
}
async function sql(query) { const r = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, { method: 'POST', headers: { Authorization: `Bearer ${management}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ query }) }); if (!r.ok) throw Error(`SQL HTTP ${r.status}`); return r.json(); }
const ids = (items) => items.length ? items.map((id) => { assert.match(id, uuid); return `'${id}'::uuid`; }).join(',') : 'NULL';
async function cleanup() {
  const errors = [];
  for (const rec of recordings) try { assert.equal(rec.caminho, `${rec.person.id}/${rec.id}.wav`); check(await admin.storage.from(bucket).remove([rec.caminho]), 'remover objeto'); const r = await admin.storage.from(bucket).download(rec.caminho); if (!r.error || ![400, 404].includes(Number(r.error.status ?? r.error.statusCode))) throw Error('remoção não confirmada'); } catch (e) { errors.push(`arquivo ${rec.id}: ${e.message}`); }
  if (!errors.length && users.length) try {
    const people = ids(users.map((u) => u.id)), recs = ids(recordings.map((r) => r.id));
    const ownDuels = `SELECT id FROM aue_privado.duelos_v2 WHERE criador_id IN (${people}) AND gravacao_criador_id IN (${recs})`;
    await sql(`BEGIN;
DELETE FROM aue_privado.decisoes_moderacao_v2 WHERE denuncia_id IN (SELECT id FROM aue_privado.denuncias_v2 WHERE duelo_id IN (${ownDuels}) AND denunciante_id IN (${people}));
DELETE FROM aue_privado.denuncias_v2 WHERE duelo_id IN (${ownDuels}) AND denunciante_id IN (${people});
DELETE FROM aue_privado.duelos_v2 WHERE id IN (${ownDuels});
DELETE FROM aue_privado.gravacoes_v2 WHERE id IN (${recs}) AND usuario_id IN (${people});
COMMIT;`);
    for (const person of users) check(await admin.auth.admin.deleteUser(person.id), 'excluir conta sintética');
  } catch (e) { errors.push(e.message); }
  if (errors.length) { console.error('Limpeza incompleta:', JSON.stringify({ users: users.map((u) => u.id), recordings: recordings.map((r) => r.id), duels })); throw Error(errors.join('; ')); }
}
async function request(person, resource, body) {
  const session = check(await person.client.auth.getSession(), 'sessão').session;
  const res = await fetch(`${url}/functions/v1/duelo-audio-v2`, { method: 'POST', headers: { apikey: anon, Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const bytes = new Uint8Array(await res.arrayBuffer()), size = bytes.byteLength;
  console.log(resource, JSON.stringify({ status: res.status, size, cache: res.headers.get('cache-control'), cdn: res.headers.get('cf-cache-status') }));
  return { status: res.status, size, bytes, cache: res.headers.get('cache-control') };
}
async function raw(person, path, suffix = '') {
  const session = check(await person.client.auth.getSession(), 'sessão').session;
  const res = await fetch(`${url}/storage/v1/object/${bucket}/${path}${suffix}`, { headers: { apikey: anon, Authorization: `Bearer ${session.access_token}` } });
  const size = (await res.arrayBuffer()).byteLength;
  console.log('Storage direto', JSON.stringify({ status: res.status, size, cache: res.headers.get('cache-control'), cdn: res.headers.get('cf-cache-status') })); return res.status;
}
let failure; const issues = [];
const expect = (condition, label) => { if (!condition) { issues.push(label); console.error('FALHOU:', label); } };
try {
  const creator = await createUser(), challenger = await createUser(), stranger = await createUser(), moderator = await createUser();
  const a = await recording(creator, 2000), b = await recording(challenger, 3000);
  const invite = randomBytes(32).toString('hex');
  const duel = await rpc(creator.client, 'aue_v2_criar_duelo', { p_gravacao_id: a.id, p_token: invite }); assert.match(duel.id, uuid); duels.push(duel.id);
  assert.equal((await rpc(challenger.client, 'aue_v2_responder_duelo', { p_token: invite, p_gravacao_id: b.id })).estado, 'respondido');
  if (!edgeReady) {
    assert.equal(await raw(challenger, a.caminho), 200);
    assert.equal(await raw(challenger, a.caminho), 200);
    console.log('CACHE PRONTO. Moderador sintético:', moderator.id, 'Aguardando provisionamento; pressione Enter.');
    await once(process.stdin, 'data'); process.stdin.pause();
  }
  const direct = await raw(challenger, a.caminho);
  expect(direct !== 200, 'GET previamente cacheado ainda entrega áudio após fechamento da policy');
  expect((await raw(challenger, a.caminho, `?teste=${randomBytes(8).toString('hex')}`)) !== 200, 'GET direto novo foi permitido');
  expect((await raw(stranger, a.caminho)) !== 200, 'terceiro acessou GET direto');
  const requestA = { dueloId: duel.id, lado: 'criador' }, requestB = { dueloId: duel.id, lado: 'desafiante' };
  const before = await request(challenger, 'Participante antes da denúncia', requestA);
  expect(before.status === 200 && before.size === audio.length && before.bytes.every((byte, i) => byte === audio[i]) && before.cache?.includes('no-store'), 'função não entregou áudio privado íntegro e sem cache ao participante');
  if (before.status === 200) {
    const { chromium } = await import('@playwright/test');
    const browser = await chromium.launch({ headless: true });
    try {
      const page = await browser.newPage();
      const decoded = await page.evaluate(async (values) => {
        const context = new AudioContext();
        try { const buffer = await context.decodeAudioData(new Uint8Array(values).buffer); return { channels: buffer.numberOfChannels, duration: buffer.duration }; }
        finally { await context.close(); }
      }, Array.from(before.bytes));
      expect(decoded.channels === 1 && decoded.duration > 0, 'navegador não decodificou o áudio');
      console.log('Chromium decodificou WAV sintético:', JSON.stringify(decoded));
    } finally { await browser.close(); }
  }
  const session = check(await challenger.client.auth.getSession(), 'capturar sessão').session;
  const restoredClient = createClient(url, anon, options);
  check(await restoredClient.auth.setSession({ access_token: session.access_token, refresh_token: session.refresh_token }), 'restaurar sessão');
  const restored = await rpc(restoredClient, 'aue_v2_recuperar_duelo', { p_duelo_id: duel.id });
  expect(restored.estado === 'revelado', 'nova instância com sessão recuperada não encontrou resultado');
  expect((await request({ client: restoredClient }, 'Áudio após recuperar sessão', requestA)).status === 200, 'áudio não recuperado na nova instância');
  expect((await request(stranger, 'Terceiro', requestA)).status === 404, 'função liberou áudio para terceiro');
  expect((await request(creator, 'Criador antes da exclusão', requestB)).status === 200, 'criador não acessou resposta');
  assert.equal((await rpc(challenger.client, 'aue_v2_denunciar_por_duelo', { p_duelo_id: duel.id, p_alvo: 'criador', p_motivo: 'outro' })).estado, 'registrada');
  expect((await request(challenger, 'Participante após denúncia', requestA)).status === 404, 'função entregou áudio denunciado');
  const reports = await sql(`SELECT id::text FROM aue_privado.denuncias_v2 WHERE duelo_id='${duel.id}'::uuid AND denunciante_id='${challenger.id}'::uuid`);
  assert.equal(reports.length, 1); const reportId = reports[0].id; assert.match(reportId, uuid);
  expect((await request(stranger, 'Moderação sem permissão', { denunciaId: reportId })).status === 404, 'terceiro acessou denúncia');
  if (!edgeReady) expect((await request(moderator, 'Moderação autorizada', { denunciaId: reportId })).status === 200, 'moderador sintético não acessou denúncia');
  else expect((await request(moderator, 'Moderação sem privilégio', { denunciaId: reportId })).status === 404, 'sessão sem privilégio acessou denúncia');
  assert.equal((await rpc(challenger.client, 'aue_v2_solicitar_exclusao', { p_id: b.id })).estado, 'remocao_pendente');
  expect((await request(creator, 'Participante após exclusão', requestB)).status === 404, 'função entregou áudio após exclusão');
  if (issues.length) throw Error(`${issues.length} cenário(s) falharam: ${issues.join('; ')}`);
  console.log('Todos os cenários HTTP da função passaram.');
} catch (e) { failure = e; }
try { await cleanup(); console.log('Limpeza dos dados sintéticos concluída.'); } catch (e) { failure = failure ? new AggregateError([failure, e], 'Teste e limpeza falharam') : e; }
if (failure) { let output = failure.stack ?? String(failure); for (const secret of [anon, service, management]) output = output.replaceAll(secret, '[credencial omitida]'); console.error(output); process.exitCode = 1; }
