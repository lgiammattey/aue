import { test, mock } from 'node:test';
import assert from 'node:assert/strict';
import { criarGateway, loteTemFalha, processarLote } from './processar.mjs';
import { criarHandler } from '../../supabase/functions/notas-worker/handler.mjs';

const item = { tipo: 'topico', id: '11111111-1111-4111-8111-111111111111', token: '22222222-2222-4222-8222-222222222222', etag: '"0123456789abcdef0123456789abcdef"' };
const audio = { bytes: Buffer.from('audio'), mime: 'audio/webm', etag: item.etag };
const gateway = (outras = {}) => ({ reivindicar: mock.fn(async () => [item]), audio: mock.fn(async () => audio), concluir: mock.fn(async () => true), ...outras });

test('registra somente a nota da análise', async () => {
  const g = gateway();
  const totais = await processarLote({ gateway: g, analisar: async () => ({ estado: 'analisado', nota_acustica_retrospectiva: 72.6 }) });
  assert.deepEqual(g.concluir.mock.calls[0].arguments, [item, 'medido', 73]);
  assert.deepEqual(totais, { recebidos: 1, medidos: 1, rejeitados: 0, erros: 0, alterados: 0 });
});
test('não pontua bytes de outra versão', async () => {
  const analisar = mock.fn();
  const g = gateway({ audio: async () => ({ ...audio, etag: '"outro"' }) });
  await processarLote({ gateway: g, analisar });
  assert.equal(analisar.mock.callCount(), 0);
  assert.deepEqual(g.concluir.mock.calls[0].arguments, [item, 'erro', null]);
});
test('distingue rejeição, falha e nota inválida', async () => {
  const g = gateway();
  await processarLote({ gateway: g, analisar: async () => ({ estado: 'nao-e-arroto' }) });
  assert.deepEqual(g.concluir.mock.calls[0].arguments, [item, 'rejeitado', null]);
  await processarLote({ gateway: g, analisar: async () => ({ estado: 'analisado', nota_acustica_retrospectiva: 101 }) });
  assert.deepEqual(g.concluir.mock.calls[1].arguments, [item, 'erro', null]);
});
test('rejeita item inválido antes de buscar áudio', async () => {
  const g = gateway({ reivindicar: async () => [{ ...item, tipo: 'privado' }] });
  await assert.rejects(processarLote({ gateway: g, analisar: async () => null }), /inválido/);
  assert.equal(g.audio.mock.callCount(), 0);
});
test('não conta como sucesso nota recusada no servidor', async () => {
  const g = gateway({ concluir: async () => false });
  const totais = await processarLote({ gateway: g, analisar: async () => ({ estado: 'analisado', nota_acustica_retrospectiva: 50 }) });
  assert.equal(totais.alterados, 1);
  assert.equal(totais.medidos, 0);
});
test('sinaliza falhas e concessões não confirmadas, sem tratar rejeição como erro', () => {
  assert.equal(loteTemFalha({ erros: 0, alterados: 0, rejeitados: 1 }), false);
  assert.equal(loteTemFalha({ erros: 1, alterados: 0 }), true);
  assert.equal(loteTemFalha({ erros: 0, alterados: 1 }), true);
});
test('continua o lote depois de uma falha e preserva a outra nota', async () => {
  const outro = { ...item, id: '33333333-3333-4333-8333-333333333333' };
  const g = gateway({ reivindicar: async () => [item, outro], audio: async (atual) => {
    if (atual.id === item.id) throw new Error('Falha temporária');
    return audio;
  } });
  const totais = await processarLote({ gateway: g, analisar: async () => ({ estado: 'analisado', nota_acustica_retrospectiva: 66 }) });
  assert.deepEqual(g.concluir.mock.calls[0].arguments, [item, 'erro', null]);
  assert.deepEqual(g.concluir.mock.calls[1].arguments, [outro, 'medido', 66]);
  assert.equal(totais.medidos, 1);
  assert.equal(loteTemFalha(totais), true);
});
test('envia segredo apenas ao gateway fixo e não segue redirecionamento', async () => {
  const fetchImpl = mock.fn(async () => new Response('[]', { status: 200 }));
  const g = criarGateway({ url: 'https://exemplo.supabase.co', chave: 'segredo', anonKey: 'publica', fetchImpl });
  await g.reivindicar(1);
  assert.equal(fetchImpl.mock.calls[0].arguments[0], 'https://exemplo.supabase.co/functions/v1/notas-worker');
  assert.equal(fetchImpl.mock.calls[0].arguments[1].redirect, 'error');
  assert.equal(fetchImpl.mock.calls[0].arguments[1].headers['x-aue-worker-secret'], 'segredo');
  assert.throws(() => criarGateway({ url: 'http://exemplo.supabase.co', chave: 'x', anonKey: 'y' }));
});
test('integra worker e gateway com concessão e bytes válidos', async () => {
  const segredo = 's'.repeat(48);
  const concluir = mock.fn(async () => true);
  const handler = criarHandler({ segredo, reivindicar: async () => [item],
    obter: async (tipo, id, token) => tipo === item.tipo && id === item.id && token === item.token
      ? { bucket: 'privado', caminho: 'nao-exposto', etag: item.etag, mime: 'audio/webm' } : null,
    baixar: async (_bucket, _caminho, etag) => etag === item.etag ? new Blob([audio.bytes]) : null,
    concluir });
  const fetchImpl = (url, opcoes) => handler(new Request(url, opcoes));
  const g = criarGateway({ url: 'https://exemplo.supabase.co', chave: segredo, anonKey: 'publica', fetchImpl });
  const totais = await processarLote({ gateway: g, limite: 1, analisar: async (a) => {
    assert.deepEqual(a.bytes, audio.bytes);
    return { estado: 'analisado', nota_acustica_retrospectiva: 57 };
  } });
  assert.equal(totais.medidos, 1);
  assert.equal(concluir.mock.calls[0].arguments[0].nota, 57);
  const intruso = criarGateway({ url: 'https://exemplo.supabase.co', chave: 'x'.repeat(48), anonKey: 'publica', fetchImpl });
  await assert.rejects(intruso.reivindicar(1), /401/);
});
