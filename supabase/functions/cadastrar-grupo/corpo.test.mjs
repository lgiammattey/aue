import assert from 'node:assert/strict';
import test from 'node:test';
import { lerFormulario, MAX_CORPO } from './corpo.ts';

function requisicao(corpo, headers = {}) {
  return new Request('http://localhost', { method: 'POST', body: corpo, duplex: 'half', headers });
}

test('lê multipart preservando maiúsculas no delimitador', async () => {
  const corpo = '--GrupoABC\r\nContent-Disposition: form-data; name="nome"\r\n\r\nMeu grupo\r\n--GrupoABC--\r\n';
  const dados = await lerFormulario(requisicao(corpo, { 'content-type': 'multipart/form-data; boundary=GrupoABC' }));
  assert.equal(dados.get('nome'), 'Meu grupo');
});

test('recusa o tamanho declarado antes de ler', async () => {
  const req = requisicao('a', { 'content-length': String(MAX_CORPO + 1) });
  assert.equal(await lerFormulario(req), null);
  assert.equal(req.bodyUsed, false);
});

test('mede o corpo sem depender do tamanho declarado e cancela antes do parse', async () => {
  let cancelou = false;
  const fluxo = new ReadableStream({
    start(c) { c.enqueue(new Uint8Array(MAX_CORPO)); c.enqueue(new Uint8Array(1)); },
    cancel() { cancelou = true; },
  });
  assert.equal(await lerFormulario(requisicao(fluxo)), null);
  assert.equal(cancelou, true);
});

test('formulário inválido falha na leitura', async () => {
  await assert.rejects(lerFormulario(requisicao('abc', { 'content-type': 'multipart/form-data' })));
});
