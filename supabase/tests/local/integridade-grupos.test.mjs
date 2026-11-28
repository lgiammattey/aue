import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { mkdtemp, mkdir, copyFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, before, test } from 'node:test';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';

const executar = promisify(execFile);
const local = fileURLToPath(new URL('.', import.meta.url));
const banco = 'aue_m02_' + randomUUID().replaceAll('-', '');
const psql = process.env.PSQL || 'psql';
const temporario = await mkdtemp(join(tmpdir(), 'aue-runner-'));
const hash = 'a'.repeat(64);
const outro = 'b'.repeat(64);

function sql(comando, db = banco) {
  return executar(psql, ['-XAtq', '-v', 'ON_ERROR_STOP=1', '-d', db, '-c', comando])
    .then(({ stdout }) => stdout.trim());
}

before(async () => {
  assert.ok(process.env.PGHOST?.startsWith('/') && !process.env.PGHOSTADDR && !process.env.PGSERVICE,
    'use o socket Unix de um PostgreSQL descartável');
  await executar('bash', [join(local, 'rodar.sh'), banco, '--somente-migracoes']);
});

after(async () => {
  if (process.env.PGHOST?.startsWith('/') && !process.env.PGHOSTADDR && !process.env.PGSERVICE) {
    await sql('DROP DATABASE IF EXISTS ' + banco, 'postgres');
    await sql('DROP DATABASE IF EXISTS ' + banco + '_erro', 'postgres');
  }
  await rm(temporario, { recursive: true, force: true });
});

async function cadastrar(origem, nome) {
  // Identificadores sintéticos definidos exclusivamente pelos testes abaixo.
  await sql(`SET ROLE service_role;
    SELECT * FROM public.cadastrar_grupo_com_limite(
      '${origem}', '${nome}', '${nome}', 'Grupo de teste local', 'telegram', 'https://t.me/${nome}', null)`);
}

async function concorrencia(origem, prefixo, quantidade, aceitos, limite) {
  const resultados = await Promise.allSettled(Array.from({ length: quantidade },
    (_, i) => cadastrar(origem, prefixo + i)));
  assert.equal(resultados.filter(r => r.status === 'fulfilled').length, aceitos);
  for (const resultado of resultados.filter(r => r.status === 'rejected')) {
    assert.match(resultado.reason.stderr, limite);
  }
}

test('o runner para na primeira migration inválida', async () => {
  const pasta = join(temporario, 'supabase/tests/local');
  const migrations = join(temporario, 'supabase/migrations');
  await mkdir(pasta, { recursive: true });
  await mkdir(migrations);
  for (const nome of ['rodar.sh', 'stubs.sql']) await copyFile(join(local, nome), join(pasta, nome));
  await writeFile(join(migrations, '001_invalida.sql'), 'SELECT coluna_inexistente;');
  await writeFile(join(migrations, '002_seguinte.sql'), 'CREATE TABLE executou_depois (id int);');
  await assert.rejects(executar('bash', [join(pasta, 'rodar.sh'), banco + '_erro']), e => {
    assert.match(e.stderr, /001_invalida.sql/);
    assert.doesNotMatch(e.stdout, /migrações aplicadas/);
    return e.code !== 0;
  });
  assert.equal(await sql("SELECT to_regclass('executou_depois') IS NULL", banco + '_erro'), 't');
});

test('só a função de serviço cadastra e cobra uma vaga por grupo confirmado', async () => {
  const assinatura = 'public.cadastrar_grupo_com_limite(text,text,text,text,text,text,uuid)';
  assert.equal(await sql(`SELECT bool_and(NOT has_function_privilege(papel, '${assinatura}', 'execute'))
    FROM unnest(ARRAY['anon','authenticated']) papel`), 't');
  await assert.rejects(cadastrar(hash, 'x'), /grupos_externos_link_da_plataforma/);
  assert.equal(await sql('SELECT count(*) FROM public.envios_de_grupos'), '0');

  await concorrencia(hash, 'grupo', 8, 3, /limite da origem/);
  assert.equal(await sql("SELECT count(*) FROM public.grupos_externos WHERE slug LIKE 'grupo%' AND NOT e_oficial"), '3');
  assert.equal(await sql('SELECT count(*) FROM public.envios_de_grupos'), '3');

  await sql(`INSERT INTO public.envios_de_grupos(origem_hash) SELECT md5(n::text) FROM generate_series(1,96) n`);
  await concorrencia(outro, 'global', 5, 1, /limite total/);
  assert.equal(await sql('SELECT count(*) FROM public.envios_de_grupos'), '100');
  await sql("UPDATE public.envios_de_grupos SET criado_em = now() - interval '61 minutes'");
  await cadastrar(hash, 'expirado');

  // Falha no contador precisa abortar a transação toda.
  await sql("ALTER TABLE public.envios_de_grupos ADD CHECK (origem_hash <> repeat('c',64))");
  await assert.rejects(cadastrar('c'.repeat(64), 'falhou'), /envios_de_grupos/);
  assert.equal(await sql("SELECT count(*) FROM public.grupos_externos WHERE slug = 'falhou'"), '0');
});
