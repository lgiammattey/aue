import { LIMITES } from './regras.ts';

// Inclui cabeçalhos e delimitadores do multipart.
export const MAX_CORPO = LIMITES.imagemBytesMax + 64 * 1024;

export async function lerFormulario(req: Request): Promise<FormData | null> {
  if (Number(req.headers.get('content-length')) > MAX_CORPO) return null;
  if (!req.body) throw new Error('corpo ausente');
  const leitor = req.body.getReader();
  let bytes = new Uint8Array(0);
  let tamanho = 0;
  try {
    while (true) {
      const { done, value } = await leitor.read();
      if (done) break;
      const proximoTamanho = tamanho + value.byteLength;
      if (proximoTamanho > MAX_CORPO) {
        await leitor.cancel();
        return null;
      }
      if (proximoTamanho > bytes.length) {
        const capacidade = Math.min(MAX_CORPO, Math.max(8192, bytes.length * 2, proximoTamanho));
        const novoBuffer = new Uint8Array(capacidade);
        novoBuffer.set(bytes.subarray(0, tamanho));
        bytes = novoBuffer;
      }
      bytes.set(value, tamanho);
      tamanho = proximoTamanho;
    }
  } finally {
    leitor.releaseLock();
  }
  return new Response(bytes.subarray(0, tamanho), {
    headers: { 'Content-Type': req.headers.get('content-type') ?? '' },
  }).formData();
}
