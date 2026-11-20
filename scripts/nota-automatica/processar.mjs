// Núcleo do worker. Apenas o processo de confiança fala com o gateway; o
// navegador recebe somente os bytes do áudio, nunca a chave de acesso.
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ETAG = /^"[0-9a-f]{32}(?:-[0-9]+)?"$/i;
const MAX_BYTES = 13 * 1024 * 1024;
const tipos = new Set(['topico', 'resposta', 'perfil']);

/** Falhas transitórias e concessões não confirmadas precisam aparecer no CI. */
export function loteTemFalha(totais) {
  return totais.erros > 0 || totais.alterados > 0;
}

export function itemValido(item) {
  return item && tipos.has(item.tipo) && UUID.test(item.id) && UUID.test(item.token)
    && typeof item.etag === 'string' && ETAG.test(item.etag);
}

export async function processarLote({ gateway, analisar, limite = 10 }) {
  const lista = await gateway.reivindicar(limite);
  if (!Array.isArray(lista) || lista.length > limite || lista.some((item) => !itemValido(item))) {
    throw new Error('Gateway devolveu lote inválido.');
  }
  const totais = { recebidos: lista.length, medidos: 0, rejeitados: 0, erros: 0, alterados: 0 };
  for (const item of lista) {
    let estado = 'erro';
    let nota = null;
    try {
      const audio = await gateway.audio(item);
      if (audio.etag !== item.etag || !Buffer.isBuffer(audio.bytes)
          || audio.bytes.length === 0 || audio.bytes.length > MAX_BYTES) throw new Error('Áudio indisponível ou alterado.');
      const resultado = await analisar(audio);
      if (resultado?.estado === 'analisado' && Number.isFinite(resultado.nota_acustica_retrospectiva)
          && resultado.nota_acustica_retrospectiva >= 0 && resultado.nota_acustica_retrospectiva <= 100) {
        estado = 'medido';
        nota = Math.round(resultado.nota_acustica_retrospectiva);
      } else if (resultado?.estado === 'nao-e-arroto') {
        estado = 'rejeitado';
      }
    } catch {
      // Erro é distinto de rejeição. O banco decide quando retentar.
    }
    try {
      const aceito = await gateway.concluir(item, estado, nota);
      if (!aceito) totais.alterados++;
      else if (estado === 'medido') totais.medidos++;
      else if (estado === 'rejeitado') totais.rejeitados++;
      else totais.erros++;
    } catch {
      // O lease expira no banco e permite nova tentativa; não inventar sucesso.
      totais.erros++;
    }
  }
  return totais;
}

export function criarGateway({ url, chave, anonKey, fetchImpl = fetch }) {
  const base = new URL(url);
  if (base.protocol !== 'https:' || base.username || base.password || base.pathname !== '/' || base.search || base.hash) {
    throw new Error('URL do projeto inválida.');
  }
  if (!chave || !anonKey) throw new Error('Credencial do worker ausente.');
  const endpoint = new URL('/functions/v1/notas-worker', base).href;
  async function chamar(dados) {
    const resposta = await fetchImpl(endpoint, {
      method: 'POST', headers: { 'content-type': 'application/json', apikey: anonKey, 'x-aue-worker-secret': chave },
      body: JSON.stringify(dados), signal: AbortSignal.timeout(30000), redirect: 'error',
    });
    if (!resposta.ok) throw new Error(`Gateway falhou (HTTP ${resposta.status}).`);
    return resposta;
  }
  return {
    async reivindicar(limite) { return (await chamar({ acao: 'reivindicar', limite })).json(); },
    async audio(item) {
      const resposta = await chamar({ acao: 'audio', tipo: item.tipo, id: item.id, token: item.token });
      const tamanho = Number(resposta.headers.get('content-length'));
      if (Number.isFinite(tamanho) && tamanho > MAX_BYTES) throw new Error('Áudio maior que o limite.');
      if (!resposta.body) throw new Error('Áudio vazio.');
      const partes = [];
      let lidos = 0;
      for await (const parte of resposta.body) {
        lidos += parte.length;
        if (lidos > MAX_BYTES) {
          await resposta.body.cancel().catch(() => {});
          throw new Error('Áudio maior que o limite.');
        }
        partes.push(Buffer.from(parte));
      }
      const bytes = Buffer.concat(partes, lidos);
      return { bytes, etag: resposta.headers.get('etag'), mime: resposta.headers.get('content-type') || 'application/octet-stream' };
    },
    async concluir(item, estado, nota) {
      const resposta = await (await chamar({ acao: 'concluir', tipo: item.tipo, id: item.id, etag: item.etag, token: item.token, estado, nota })).json();
      return resposta === true || resposta?.ok === true;
    },
  };
}
