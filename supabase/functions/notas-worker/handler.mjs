const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const tipos = new Set(['topico', 'resposta', 'perfil']);
const json = (status, data) => new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });

// Digest de tamanho fixo evita comparação dependente do prefixo.
async function igual(a, b) {
  const encoder = new TextEncoder();
  const [x, y] = await Promise.all([crypto.subtle.digest('SHA-256', encoder.encode(a)), crypto.subtle.digest('SHA-256', encoder.encode(b))]);
  const aa = new Uint8Array(x), bb = new Uint8Array(y);
  let diff = 0;
  for (let i = 0; i < aa.length; i++) diff |= aa[i] ^ bb[i];
  return diff === 0;
}
export function criarHandler({ segredo, reivindicar, obter, baixar, concluir }) {
  return async (req) => {
    if (req.method !== 'POST') return json(405, { erro: 'método inválido' });
    const recebido = req.headers.get('x-aue-worker-secret') || '';
    if (!segredo || segredo.length < 32 || recebido.length > 256 || !await igual(recebido, segredo)) return json(401, { erro: 'não autorizado' });
    try {
      if (Number(req.headers.get('content-length') || 0) > 4096) return json(413, { erro: 'requisição grande' });
      const texto = await req.text();
      if (texto.length > 4096) return json(413, { erro: 'requisição grande' });
      const v = JSON.parse(texto);
      if (!v || typeof v !== 'object') return json(400, { erro: 'requisição inválida' });
      if (v.acao === 'reivindicar') {
        if (!Number.isInteger(v.limite) || v.limite < 1 || v.limite > 20) return json(400, { erro: 'limite inválido' });
        return json(200, await reivindicar(v.limite));
      }
      if (!tipos.has(v.tipo) || !uuid.test(v.id || '') || !uuid.test(v.token || '')) return json(400, { erro: 'identificação inválida' });
      if (v.acao === 'audio') {
        const ref = await obter(v.tipo, v.id, v.token);
        if (!ref) return json(404, { erro: 'áudio indisponível' });
        const blob = await baixar(ref.bucket, ref.caminho, ref.etag);
        if (!blob) return json(404, { erro: 'áudio indisponível' });
        return new Response(blob, { status: 200, headers: { 'content-type': ref.mime || 'application/octet-stream', 'etag': ref.etag, 'cache-control': 'no-store' } });
      }
      if (v.acao === 'concluir') {
        if (typeof v.etag !== 'string' || v.etag.length < 1 || v.etag.length > 256 || !['medido','rejeitado','erro'].includes(v.estado)
          || (v.estado === 'medido' ? !Number.isInteger(v.nota) || v.nota < 0 || v.nota > 100 : v.nota != null)) return json(400, { erro: 'resultado inválido' });
        return json(200, { ok: await concluir(v) });
      }
      return json(400, { erro: 'ação inválida' });
    } catch {
      return json(500, { erro: 'serviço indisponível' });
    }
  };
}
