/**
 * UUID v5 (RFC 4122) com SHA-1 escrito à mão.
 *
 * Existe aqui, e não em `node:crypto`, porque o núcleo é compilado também para
 * o navegador e não importa nada de plataforma. Serve para dar a cada post,
 * comentário e conta da casa um id que sai sempre igual: rodar o backfill duas
 * vezes não duplica nada.
 */

function girar(n: number, b: number): number {
  return ((n << b) | (n >>> (32 - b))) >>> 0;
}

export function sha1(entrada: Uint8Array): Uint8Array {
  const bits = entrada.length * 8;
  const total = (((entrada.length + 8) >> 6) + 1) * 64;
  const bloco = new Uint8Array(total);
  bloco.set(entrada);
  bloco[entrada.length] = 0x80;
  const vista = new DataView(bloco.buffer);
  vista.setUint32(total - 8, Math.floor(bits / 0x100000000), false);
  vista.setUint32(total - 4, bits >>> 0, false);

  let h0 = 0x67452301;
  let h1 = 0xefcdab89;
  let h2 = 0x98badcfe;
  let h3 = 0x10325476;
  let h4 = 0xc3d2e1f0;
  const w = new Uint32Array(80);

  for (let i = 0; i < total; i += 64) {
    for (let t = 0; t < 16; t++) w[t] = vista.getUint32(i + t * 4, false);
    for (let t = 16; t < 80; t++) w[t] = girar(w[t - 3] ^ w[t - 8] ^ w[t - 14] ^ w[t - 16], 1);

    let a = h0;
    let b = h1;
    let c = h2;
    let d = h3;
    let e = h4;
    for (let t = 0; t < 80; t++) {
      let f: number;
      let k: number;
      if (t < 20) {
        f = (b & c) | (~b & d);
        k = 0x5a827999;
      } else if (t < 40) {
        f = b ^ c ^ d;
        k = 0x6ed9eba1;
      } else if (t < 60) {
        f = (b & c) | (b & d) | (c & d);
        k = 0x8f1bbcdc;
      } else {
        f = b ^ c ^ d;
        k = 0xca62c1d6;
      }
      const temp = (girar(a, 5) + (f >>> 0) + e + k + w[t]) >>> 0;
      e = d;
      d = c;
      c = girar(b, 30);
      b = a;
      a = temp;
    }
    h0 = (h0 + a) >>> 0;
    h1 = (h1 + b) >>> 0;
    h2 = (h2 + c) >>> 0;
    h3 = (h3 + d) >>> 0;
    h4 = (h4 + e) >>> 0;
  }

  const saida = new Uint8Array(20);
  const vistaSaida = new DataView(saida.buffer);
  [h0, h1, h2, h3, h4].forEach((h, i) => vistaSaida.setUint32(i * 4, h, false));
  return saida;
}

function uuidParaBytes(uuid: string): Uint8Array {
  const hex = uuid.replace(/-/g, '');
  if (!/^[0-9a-f]{32}$/i.test(hex)) throw new Error(`UUID inválido: "${uuid}"`);
  const bytes = new Uint8Array(16);
  for (let i = 0; i < 16; i++) bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  return bytes;
}

export function uuidV5(nome: string, espaco: string): string {
  const base = uuidParaBytes(espaco);
  const texto = new TextEncoder().encode(nome);
  const junto = new Uint8Array(base.length + texto.length);
  junto.set(base);
  junto.set(texto, base.length);
  const hash = sha1(junto).slice(0, 16);
  hash[6] = (hash[6] & 0x0f) | 0x50;
  hash[8] = (hash[8] & 0x3f) | 0x80;
  const hex = Array.from(hash, (b) => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
