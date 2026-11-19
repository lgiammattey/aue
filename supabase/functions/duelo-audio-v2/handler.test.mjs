import { test } from 'node:test';
import assert from 'node:assert/strict';
import { criarHandler } from './handler.mjs';
const id = '00000000-0000-0000-0000-000000000001';
const path = `${id}/${id}.wav`;
const req = () => new Request('https://edge.example/duelo-audio', { method: 'POST', headers: { origin: 'https://aue.web.app', authorization: 'Bearer x.y.z', 'content-type': 'application/json' }, body: JSON.stringify({ dueloId: id, lado: 'criador' }) });
const setup = () => {
  const chamadas = [];
  const servicos = { origens: ['https://aue.web.app'], autenticar: async () => { chamadas.push('sessao'); return { uid: 'participante' }; }, autorizar: async () => { chamadas.push('regra'); return path; }, baixar: async () => { chamadas.push('audio'); return new Blob([new Uint8Array(44)]); } };
  return { chamadas, servicos };
};
test('revalida sessão e permissão antes e depois do download, sem cache', async () => {
  const { chamadas, servicos } = setup(); const r = await criarHandler(servicos)(req());
  assert.equal(r.status, 200); assert.equal(r.headers.get('cache-control'), 'private, no-store, max-age=0');
  assert.equal((await r.arrayBuffer()).byteLength, 44); assert.deepEqual(chamadas, ['sessao', 'regra', 'audio', 'sessao', 'regra']);
});
test('não retorna áudio se o acesso cair enquanto é carregado', async () => {
  const { servicos } = setup(); let n = 0; servicos.autorizar = async () => ++n === 1 ? path : null;
  const r = await criarHandler(servicos)(req()); assert.equal(r.status, 404); assert.equal((await r.text()), '');
});
test('não consulta o áudio sem sessão ou sem autorização', async () => {
  const { servicos, chamadas } = setup(); servicos.autenticar = async () => null;
  assert.equal((await criarHandler(servicos)(req())).status, 401); assert.deepEqual(chamadas, []);
  servicos.autenticar = async () => ({}); servicos.autorizar = async () => null;
  assert.equal((await criarHandler(servicos)(req())).status, 404); assert.deepEqual(chamadas, []);
});
test('erro de infraestrutura não entrega áudio nem detalhes', async () => {
  const { servicos } = setup(); servicos.baixar = async () => { throw new Error('segredo'); };
  const r = await criarHandler(servicos)(req()); assert.equal(r.status, 503); assert.equal(await r.text(), ''); assert.match(r.headers.get('cache-control'), /no-store/);
});
test('bloqueia origem desconhecida e não aceita token no corpo ou URL', async () => {
  const { servicos } = setup(); const h = criarHandler(servicos);
  assert.equal((await h(new Request('https://edge.example/', { method: 'POST', headers: { origin: 'https://mal.example' } }))).status, 403);
  assert.equal((await h(new Request('https://edge.example/', { method: 'POST', headers: { authorization: 'Bearer x.y.z', 'content-type': 'application/json' }, body: JSON.stringify({ dueloId: id, lado: 'criador', token: 'secreto' }) }))).status, 400);
});

test('moderação exige autorização específica e a revalida após buscar o áudio', async () => {
  const { servicos, chamadas } = setup();
  servicos.autorizarModeracao = async () => { chamadas.push('moderacao'); return path; };
  const pedido = () => new Request('https://edge.example/duelo-audio', { method: 'POST', headers: { authorization: 'Bearer x.y.z', 'content-type': 'application/json' }, body: JSON.stringify({ denunciaId: id }) });
  let r = await criarHandler(servicos)(pedido());
  assert.equal(r.status, 200); assert.deepEqual(chamadas, ['sessao', 'moderacao', 'audio', 'sessao', 'moderacao']);
  chamadas.length = 0; servicos.autorizarModeracao = async () => null;
  r = await criarHandler(servicos)(pedido()); assert.equal(r.status, 404); assert.deepEqual(chamadas, ['sessao']);
});

test('exclusão durante a revisão interrompe a resposta de áudio', async () => {
  const { servicos } = setup(); let n = 0;
  servicos.autorizarModeracao = async () => ++n === 1 ? path : null;
  const pedido = new Request('https://edge.example/duelo-audio', { method: 'POST', headers: { authorization: 'Bearer x.y.z', 'content-type': 'application/json' }, body: JSON.stringify({ denunciaId: id }) });
  const r = await criarHandler(servicos)(pedido); assert.equal(r.status, 404); assert.equal(await r.text(), '');
});
