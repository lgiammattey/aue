import { createClient } from 'npm:@supabase/supabase-js@2.112.2';
import { criarHandler } from './handler.mjs';

const url = Deno.env.get('SUPABASE_URL') ?? '';
const service = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const segredo = Deno.env.get('AUE_NOTAS_WORKER_SECRET') ?? '';
const admin = createClient(url, service, { auth: { persistSession: false, autoRefreshToken: false } });
async function rpc(nome: string, args: Record<string, unknown>) {
  const { data, error } = await admin.rpc(nome, args);
  if (error) throw new Error('falha de banco');
  return data;
}
Deno.serve(criarHandler({
  segredo,
  async reivindicar(limit: number) {
    const itens = await rpc('reivindicar_audios_para_nota', { p_limite: limit });
    // O cliente não precisa conhecer caminhos privados.
    return itens.map(({ tipo, id, etag, mime, token }: Record<string, unknown>) => ({ tipo, id, etag, mime, token }));
  },
  async obter(tipo: string, id: string, token: string) {
    const rows = await rpc('obter_audio_da_fila', { p_tipo: tipo, p_id: id, p_token: token });
    return rows?.[0] ?? null;
  },
  async baixar(bucket: string, caminho: string, etag: string) {
    if (!['anexos_do_forum', 'arrotos_de_perfil', 'audio_da_casa', 'audio_records'].includes(bucket)) return null;
    const path = caminho.split('/').map(encodeURIComponent).join('/');
    const resposta = await fetch(`${url}/storage/v1/object/authenticated/${bucket}/${path}`, {
      headers: { apikey: service, Authorization: `Bearer ${service}` },
      redirect: 'error',
    });
    if (!resposta.ok || resposta.headers.get('etag') !== etag) return null;
    const tamanho = Number(resposta.headers.get('content-length') || 0);
    if (tamanho > 12_582_912) return null;
    if (!resposta.body) return null;
    const leitor = resposta.body.getReader();
    const blocos: ArrayBuffer[] = [];
    let total = 0;
    while (true) {
      const parte = await leitor.read();
      if (parte.done) break;
      total += parte.value.byteLength;
      if (total > 12_582_912) { await leitor.cancel(); return null; }
      // O leitor pode entregar uma view sobre um buffer compartilhado. Copiar
      // exatamente o trecho recebido mantém o Blob independente e compatível
      // com o BlobPart aceito pelo runtime Deno.
      const copia = new Uint8Array(parte.value.byteLength);
      copia.set(parte.value);
      blocos.push(copia.buffer);
    }
    return new Blob(blocos);
  },
  async concluir(v: { tipo: string, id: string, etag: string, token: string, estado: string, nota?: number }) {
    return await rpc('concluir_nota_do_audio', { p_tipo: v.tipo, p_id: v.id, p_etag: v.etag, p_token: v.token, p_estado: v.estado, p_nota: v.nota ?? null });
  },
}));
