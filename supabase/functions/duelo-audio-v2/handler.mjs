// Depende da migração de sessão e bloqueio do acesso direto para operar com segurança.
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const caminho = /^[0-9a-f-]{36}\/[0-9a-f-]{36}\.wav$/i;
const limite = 5 * 1024 * 1024;
const fixos = { 'Cache-Control': 'private, no-store, max-age=0', Pragma: 'no-cache', 'X-Content-Type-Options': 'nosniff', Vary: 'Origin' };

// Serviços devem validar JWT e sessão ativa e consultar o banco em cada chamada.
export function criarHandler({ autenticar, autorizar, autorizarModeracao, baixar, origens }) {
  return async function handler(req) {
    const origem = req.headers.get('origin');
    const headers = { ...fixos, ...(origem && origens.includes(origem) ? { 'Access-Control-Allow-Origin': origem } : {}) };
    const resposta = (status, texto = '') => new Response(texto, { status, headers });
    if (origem && !origens.includes(origem)) return resposta(403);
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: { ...headers, 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info', 'Access-Control-Max-Age': '0' } });
    if (req.method !== 'POST') return resposta(405);
    if (new URL(req.url).search) return resposta(400);
    const auth = req.headers.get('authorization');
    if (!auth || !/^Bearer [A-Za-z0-9._-]+$/.test(auth)) return resposta(401);
    if (!(req.headers.get('content-type') || '').toLowerCase().startsWith('application/json')) return resposta(400);
    // Limite protege processamento e evita logs ou URLs contendo segredos.
    if (!req.body) return resposta(400);
    const leitor = req.body.getReader();
    const partes = []; let bytes = 0;
    try {
      while (true) {
        const parte = await leitor.read();
        if (parte.done) break;
        bytes += parte.value.byteLength;
        if (bytes > 512) { await leitor.cancel(); return resposta(413); }
        partes.push(parte.value);
      }
    } catch { return resposta(400); }
    const dados = new Uint8Array(bytes); let posicao = 0;
    for (const parte of partes) { dados.set(parte, posicao); posicao += parte.byteLength; }
    const corpo = new TextDecoder().decode(dados);
    let pedido;
    try { pedido = JSON.parse(corpo); } catch { return resposta(400); }
    const chaves = pedido && typeof pedido === 'object' && !Array.isArray(pedido) ? Object.keys(pedido).sort().join(',') : '';
    const participante = chaves === 'dueloId,lado' && typeof pedido.dueloId === 'string' && uuid.test(pedido.dueloId) && ['criador', 'desafiante'].includes(pedido.lado);
    const moderacao = chaves === 'denunciaId' && typeof pedido.denunciaId === 'string' && uuid.test(pedido.denunciaId);
    if (!participante && !moderacao) return resposta(400);
    try {
      const sessao = await autenticar(auth);
      if (!sessao) return resposta(401);
      const consultar = () => moderacao ? autorizarModeracao(sessao, pedido.denunciaId) : autorizar(sessao, pedido.dueloId, pedido.lado);
      const autorizado = await consultar();
      if (!autorizado || !caminho.test(autorizado)) return resposta(404);
      const audio = await baixar(autorizado);
      if (!(audio instanceof Blob) || audio.size < 44 || audio.size > limite) return resposta(404);
      // Um bloqueio ocorrido durante o download é observado antes de responder.
      if (!await autenticar(auth) || await consultar() !== autorizado) return resposta(404);
      return new Response(audio, { status: 200, headers: { ...headers, 'Content-Type': 'application/octet-stream', 'Content-Disposition': 'inline', 'Content-Length': String(audio.size) } });
    } catch { return resposta(503); }
  };
}
