/** O navegador de confiança analisa os bytes sem receber nenhuma credencial. */
export function criarAnalisador(pagina) {
  return async ({ bytes, mime }) => {
    await pagina.locator('#arquivos').setInputFiles({ name: 'gravacao', mimeType: mime, buffer: bytes });
    await pagina.locator('#iniciar').click();
    await pagina.locator('#baixar:not([disabled])').waitFor({ timeout: 180_000 });
    const relatorio = JSON.parse(await pagina.locator('#resultado').textContent());
    if (!Array.isArray(relatorio) || relatorio.length !== 1) throw new Error('Análise inválida.');
    return relatorio[0];
  };
}
