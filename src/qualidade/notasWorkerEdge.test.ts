import { describe, expect, it, vi } from 'vitest';
import { criarHandler } from '../../supabase/functions/notas-worker/handler.mjs';

const segredo = 'x'.repeat(40);
const id = '10000000-0000-4000-8000-000000000001';
const token = '10000000-0000-4000-8000-000000000002';
function requisicao(body: unknown, key = segredo) {
  return new Request('https://example.test/', { method: 'POST', headers: { 'x-aue-worker-secret': key, 'content-type': 'application/json' }, body: JSON.stringify(body) });
}
describe('gateway privado do avaliador', () => {
  it('nega segredo incorreto e não acessa o banco', async () => {
    const reivindicar = vi.fn();
    const handler = criarHandler({ segredo, reivindicar, obter: vi.fn(), baixar: vi.fn(), concluir: vi.fn() });
    expect((await handler(requisicao({ acao: 'reivindicar', limite: 1 }, 'errado'))).status).toBe(401);
    expect(reivindicar).not.toHaveBeenCalled();
  });
  it('restringe o acesso ao áudio à concessão e valida notas', async () => {
    const obter = vi.fn().mockResolvedValue({ bucket: 'privado', caminho: 'nome', etag: 'v1', mime: 'audio/webm' });
    const baixar = vi.fn().mockResolvedValue(new Blob(['teste']));
    const concluir = vi.fn().mockResolvedValue(true);
    const handler = criarHandler({ segredo, reivindicar: vi.fn(), obter, baixar, concluir });
    const audio = await handler(requisicao({ acao: 'audio', tipo: 'topico', id, token }));
    expect(audio.status).toBe(200); expect(audio.headers.get('etag')).toBe('v1'); expect(await audio.text()).toBe('teste');
    expect((await handler(requisicao({ acao: 'concluir', tipo: 'topico', id, token, etag: 'v1', estado: 'medido', nota: 101 }))).status).toBe(400);
    expect(concluir).not.toHaveBeenCalled();
    expect(await (await handler(requisicao({ acao: 'concluir', tipo: 'topico', id, token, etag: 'v1', estado: 'medido', nota: 75 }))).json()).toEqual({ ok: true });
    obter.mockResolvedValue(null);
    expect((await handler(requisicao({ acao: 'audio', tipo: 'topico', id, token }))).status).toBe(404);
  });
});
