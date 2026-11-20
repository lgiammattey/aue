import { readFile, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

const sqlText = (valor) => `'${valor.replaceAll("'", "''")}'`;
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function gerarSql(relatorio) {
  if (!Array.isArray(relatorio.resultados)) throw new Error('Relatório inválido.');
  const itens = relatorio.resultados.filter((i) => i.resultado?.estado === 'analisado');
  if (!itens.length) throw new Error('Nenhum resultado analisado.');
  const vistos = new Set();
  const linhas = itens.map((i) => {
    if (!['topico', 'resposta', 'perfil'].includes(i.tipo) || !uuid.test(i.id) ||
        !['audio_da_casa', 'anexos_do_forum', 'arrotos_de_perfil'].includes(i.bucket) ||
        typeof i.caminho !== 'string' || !i.caminho.length || i.caminho.length > 512 || i.caminho.includes('\0') ||
        typeof i.etag !== 'string' || !/^"[0-9a-f]{32}(?:-[0-9]+)?"$/i.test(i.etag) ||
        !Number.isFinite(i.resultado.nota_acustica_retrospectiva) || i.resultado.nota_acustica_retrospectiva < 0 || i.resultado.nota_acustica_retrospectiva > 100) {
      throw new Error('Item inválido no relatório.');
    }
    const chave = `${i.bucket}\0${i.caminho}`;
    if (vistos.has(chave)) throw new Error('Objeto duplicado no relatório.');
    vistos.add(chave);
    return `(${sqlText(i.tipo)},${sqlText(i.id)}::uuid,${sqlText(i.bucket)},${sqlText(i.caminho)},${sqlText(i.etag)},${Math.round(i.resultado.nota_acustica_retrospectiva)})`;
  });
  return `BEGIN;
CREATE TEMP TABLE lote_nota_retrospectiva (tipo text, id uuid, bucket text, caminho text, etag text, nota numeric) ON COMMIT DROP;
INSERT INTO lote_nota_retrospectiva VALUES\n${linhas.join(',\n')};
DO $validacao$
BEGIN
  IF EXISTS (
    SELECT 1 FROM lote_nota_retrospectiva l
    WHERE NOT EXISTS (SELECT 1 FROM storage.objects o WHERE o.bucket_id=l.bucket AND o.name=l.caminho AND o.metadata->>'eTag'=l.etag)
       OR NOT (
         (l.tipo='topico' AND EXISTS (
           SELECT 1 FROM public.topicos t WHERE t.id=l.id AND t.status IN ('aberto','fechado')
             AND public.aue_e_conta_promovida(t.autor_id)
             AND ((l.bucket='anexos_do_forum' AND t.anexo_tipo='audio' AND t.anexo_caminho=l.caminho)
               OR (l.bucket='audio_da_casa' AND t.anexo_tipo IS DISTINCT FROM 'audio' AND t.resultado_id IS NULL AND t.consentimento_audio_publico AND t.caminho_do_audio_da_casa=l.caminho))))
         OR (l.tipo='resposta' AND l.bucket='anexos_do_forum' AND EXISTS (
           SELECT 1 FROM public.respostas r JOIN public.topicos t ON t.id=r.topico_id
            WHERE r.id=l.id AND r.anexo_tipo='audio' AND r.anexo_caminho=l.caminho AND r.status='visivel'
              AND t.status IN ('aberto','fechado') AND public.aue_e_conta_promovida(r.autor_id) AND public.aue_e_conta_promovida(t.autor_id)))
         OR (l.tipo='perfil' AND l.bucket='arrotos_de_perfil' AND EXISTS (
           SELECT 1 FROM public.arrotos_do_perfil a WHERE a.id=l.id AND a.caminho_do_audio=l.caminho
             AND a.estado='publicado' AND public.aue_e_conta_promovida(a.perfil_id)))
       )
  ) THEN RAISE EXCEPTION 'Lote mudou ou não está mais visível; refaça a análise.'; END IF;
END $validacao$;
INSERT INTO aue_privado.notas_retrospectivas (bucket,caminho,etag,nota,versao)
SELECT bucket,caminho,etag,nota,'retrospectiva-acustica-legado-v1' FROM lote_nota_retrospectiva
ON CONFLICT (bucket,caminho) DO NOTHING;
COMMIT;\n`;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [entrada, saida] = process.argv.slice(2);
  if (!entrada || !saida) throw new Error('Uso: node gerar-sql.mjs relatorio.json lote.sql');
  const sql = gerarSql(JSON.parse(await readFile(entrada, 'utf8')));
  await writeFile(saida, sql, { mode: 0o600, flag: 'wx' });
  console.log('SQL preparado localmente.');
}
