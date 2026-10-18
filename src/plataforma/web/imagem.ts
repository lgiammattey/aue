/**
 * Reduz uma foto para o avatar: quadrado de `lado` px, recortado no centro,
 * JPEG. Vive em `plataforma/web` porque usa canvas e `createImageBitmap`.
 *
 * Devolve `null` quando o aparelho não consegue (sem canvas, imagem quebrada):
 * quem chama diz que não deu, em vez de subir o original gigante.
 */
export async function reduzirParaAvatar(arquivo: Blob, lado = 256): Promise<Blob | null> {
  try {
    const bitmap = await createImageBitmap(arquivo);
    const corte = Math.min(bitmap.width, bitmap.height);
    const x = (bitmap.width - corte) / 2;
    const y = (bitmap.height - corte) / 2;

    const canvas = document.createElement('canvas');
    canvas.width = lado;
    canvas.height = lado;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(bitmap, x, y, corte, corte, 0, 0, lado, lado);
    bitmap.close?.();

    return await new Promise<Blob | null>((resolver) => canvas.toBlob((b) => resolver(b), 'image/jpeg', 0.85));
  } catch {
    return null;
  }
}
