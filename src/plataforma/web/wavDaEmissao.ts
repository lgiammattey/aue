/**
 * Codifica somente a emissão recebida do coletor em PCM mono de 16 bits.
 * O ambiente de calibração não entra nesta função nem no arquivo resultante.
 * Sons captados após o início da emissão continuam presentes.
 */
export function wavDaEmissao(emissao: Float32Array, sampleRate: number): Blob {
  const MAXIMO_SEGUNDOS = 10.5;
  if (!Number.isInteger(sampleRate) || sampleRate < 1000 || sampleRate > 192_000 ||
      emissao.length === 0 || emissao.length > Math.ceil(sampleRate * MAXIMO_SEGUNDOS) ||
      !emissao.every(Number.isFinite)) {
    throw new Error('Não foi possível preparar o áudio da tentativa.');
  }

  const bytesAudio = emissao.length * 2;
  const buffer = new ArrayBuffer(44 + bytesAudio);
  const dados = new DataView(buffer);
  function escreverTexto(posicao: number, texto: string) {
    for (let i = 0; i < texto.length; i++) dados.setUint8(posicao + i, texto.charCodeAt(i));
  }
  escreverTexto(0, 'RIFF');
  dados.setUint32(4, 36 + bytesAudio, true);
  escreverTexto(8, 'WAVE');
  escreverTexto(12, 'fmt ');
  dados.setUint32(16, 16, true);
  dados.setUint16(20, 1, true);
  dados.setUint16(22, 1, true);
  dados.setUint32(24, sampleRate, true);
  dados.setUint32(28, sampleRate * 2, true);
  dados.setUint16(32, 2, true);
  dados.setUint16(34, 16, true);
  escreverTexto(36, 'data');
  dados.setUint32(40, bytesAudio, true);
  for (let i = 0; i < emissao.length; i++) {
    const valor = Math.max(-1, Math.min(1, emissao[i]));
    dados.setInt16(44 + i * 2, Math.round(valor < 0 ? valor * 32768 : valor * 32767), true);
  }
  return new Blob([buffer], { type: 'audio/wav' });
}
