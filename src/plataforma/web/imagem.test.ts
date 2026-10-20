import { afterEach, describe, expect, it, vi } from 'vitest';
import { criarUrlDePreviewDeImagem, prepararImagemDePerfil, revokeUrlDePreviewDeImagem } from './imagem';

const bitmap = (largura: number, altura: number) => ({
  width: largura,
  height: altura,
  close: vi.fn(),
}) as unknown as ImageBitmap;

function prepararCanvas(tamanhoDoBlob = 1_024) {
  const drawImage = vi.fn();
  const canvas = {
    width: 0,
    height: 0,
    getContext: vi.fn(() => ({ drawImage })),
    toBlob: vi.fn((callback: BlobCallback) => callback(new Blob([new Uint8Array(tamanhoDoBlob)], { type: 'image/jpeg' }))),
  };
  vi.stubGlobal('document', { createElement: vi.fn(() => canvas) });
  return drawImage;
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('prepararImagemDePerfil', () => {
  it('barra tipo não permitido antes de pedir decodificação ao navegador', async () => {
    const criarBitmap = vi.fn();
    vi.stubGlobal('createImageBitmap', criarBitmap);

    await expect(prepararImagemDePerfil(new Blob(['x'], { type: 'image/gif' }), 'avatar'))
      .resolves.toEqual({ ok: false, motivo: 'formatoInvalido' });
    expect(criarBitmap).not.toHaveBeenCalled();
  });

  it('barra arquivo maior que 10 MB antes de pedir decodificação ao navegador', async () => {
    const criarBitmap = vi.fn();
    vi.stubGlobal('createImageBitmap', criarBitmap);
    const arquivo = new Blob([new Uint8Array(10 * 1024 * 1024 + 1)], { type: 'image/jpeg' });

    await expect(prepararImagemDePerfil(arquivo, 'avatar')).resolves.toEqual({ ok: false, motivo: 'grandeDemais' });
    expect(criarBitmap).not.toHaveBeenCalled();
  });

  it('não deixa avatar menor que 320 por 320 seguir para o canvas', async () => {
    vi.stubGlobal('createImageBitmap', vi.fn(async () => bitmap(319, 800)));

    await expect(prepararImagemDePerfil(new Blob(['x'], { type: 'image/png' }), 'avatar'))
      .resolves.toEqual({ ok: false, motivo: 'dimensoesInsuficientes' });
  });

  it('barra imagem com mais de 24 MP antes de desenhar', async () => {
    vi.stubGlobal('createImageBitmap', vi.fn(async () => bitmap(6_000, 4_001)));
    const drawImage = prepararCanvas();

    await expect(prepararImagemDePerfil(new Blob(['x'], { type: 'image/webp' }), 'capa'))
      .resolves.toEqual({ ok: false, motivo: 'dimensoesExcedidas' });
    expect(drawImage).not.toHaveBeenCalled();
  });

  it('recorta avatar na região escolhida e normaliza a saída para JPEG 512 quadrado', async () => {
    vi.stubGlobal('createImageBitmap', vi.fn(async () => bitmap(1_600, 800)));
    const drawImage = prepararCanvas();

    const resultado = await prepararImagemDePerfil(
      new Blob(['x'], { type: 'image/jpeg' }),
      'avatar',
      { centroX: 0.75, centroY: 0.5, zoom: 2 },
    );

    expect(resultado.ok).toBe(true);
    if (resultado.ok) {
      expect(resultado.imagem.type).toBe('image/jpeg');
      expect(resultado.dimensoes).toEqual({ largura: 512, altura: 512 });
    }
    expect(drawImage).toHaveBeenCalledWith(expect.anything(), 1_000, 200, 400, 400, 0, 0, 512, 512);
  });

  it('normaliza capa para JPEG 1500 por 500', async () => {
    vi.stubGlobal('createImageBitmap', vi.fn(async () => bitmap(1_200, 800)));
    prepararCanvas();

    await expect(prepararImagemDePerfil(new Blob(['x'], { type: 'image/png' }), 'capa')).resolves.toMatchObject({
      ok: true,
      dimensoes: { largura: 1500, altura: 500 },
      imagem: expect.objectContaining({ type: 'image/jpeg' }),
    });
  });

  it('não aceita uma região de recorte impossível', async () => {
    const criarBitmap = vi.fn();
    vi.stubGlobal('createImageBitmap', criarBitmap);

    await expect(prepararImagemDePerfil(
      new Blob(['x'], { type: 'image/jpeg' }),
      'avatar',
      { centroX: 1.1, centroY: 0.5, zoom: 1 },
    )).resolves.toEqual({ ok: false, motivo: 'recorteInvalido' });
    expect(criarBitmap).not.toHaveBeenCalled();
  });
});

describe('prévia local', () => {
  it('encapsula a URL temporária e a libera quando a tela terminar com ela', () => {
    const criar = vi.fn(() => 'blob:previsao');
    const revogar = vi.fn();
    vi.stubGlobal('URL', { createObjectURL: criar, revokeObjectURL: revogar });
    const arquivo = new Blob(['x'], { type: 'image/jpeg' });

    expect(criarUrlDePreviewDeImagem(arquivo)).toBe('blob:previsao');
    revokeUrlDePreviewDeImagem('blob:previsao');
    expect(criar).toHaveBeenCalledWith(arquivo);
    expect(revogar).toHaveBeenCalledWith('blob:previsao');
  });
});
