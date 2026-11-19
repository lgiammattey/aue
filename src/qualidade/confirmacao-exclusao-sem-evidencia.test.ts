import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
import { expect, it } from 'vitest';

// A ausência do objeto no catálogo simulado não comprova resposta do Storage.
it('cliente não confirma exclusão sem evidência registrada pelo serviço', async () => {
  const db = new PGlite();
  try {
    await db.exec(`
      CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role;
      CREATE SCHEMA auth; CREATE SCHEMA aue_privado; CREATE SCHEMA storage;
      CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$
        SELECT nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
      CREATE TABLE aue_privado.gravacoes_v2(id uuid PRIMARY KEY, usuario_id uuid, caminho text,
        exclusao_solicitada_em timestamptz, removida_em timestamptz, usuario_excluido boolean DEFAULT false,
        estado text, duracao_ms integer, versao_regua text, confirmado_em timestamptz);
      CREATE TABLE aue_privado.contas_em_exclusao_v2(usuario_id uuid PRIMARY KEY);
      CREATE TABLE aue_privado.duelos_v2(criador_id uuid, criador_excluido boolean, desafiante_id uuid, desafiante_excluido boolean);
      CREATE TABLE aue_privado.denuncias_v2(denunciante_id uuid, denunciante_excluido boolean, moderador_id uuid, moderador_excluido boolean);
      CREATE TABLE aue_privado.decisoes_moderacao_v2(moderador_id uuid, moderador_excluido boolean);
      CREATE TABLE storage.objects(bucket_id text,name text);
      INSERT INTO aue_privado.contas_em_exclusao_v2 VALUES ('00000000-0000-0000-0000-000000000001');
      INSERT INTO aue_privado.gravacoes_v2(id,usuario_id,caminho,exclusao_solicitada_em,removida_em) VALUES
        ('10000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000001','a',now(),NULL),
        ('10000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000002','b',now(),NULL),
        ('10000000-0000-0000-0000-000000000003','00000000-0000-0000-0000-000000000001','c',NULL,NULL);
    `);
    await db.exec(await readFile('supabase/migrations/20261118223816_impedir_confirmacao_cliente_sem_evidencia.sql', 'utf8'));
    const consultar = (id: string) => db.query<{ valor: { estado: string } }>('SELECT public.aue_v2_confirmar_exclusao($1) AS valor', [id]);
    await db.exec("SELECT set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000001',false); SET ROLE authenticated");
    expect((await consultar('10000000-0000-0000-0000-000000000001')).rows[0].valor.estado).toBe('remocao_pendente');
    await expect(consultar('10000000-0000-0000-0000-000000000002')).rejects.toThrow('Gravação indisponível');
    await expect(consultar('10000000-0000-0000-0000-000000000003')).rejects.toThrow('Gravação indisponível');
    await expect(db.query("SELECT public.aue_v2_registrar_remocao_operacional('00000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001')")).rejects.toThrow(/permission denied/i);
    await db.exec('RESET ROLE');
    expect((await db.query<{ removida: boolean }>("SELECT removida_em IS NOT NULL AS removida FROM aue_privado.gravacoes_v2 WHERE id='10000000-0000-0000-0000-000000000001'")).rows[0].removida).toBe(false);
    await db.exec("UPDATE aue_privado.gravacoes_v2 SET removida_em=now() WHERE id='10000000-0000-0000-0000-000000000001'; SET ROLE service_role");
    const anonimizar = () => db.query<{ valor: { estado: string } }>("SELECT public.aue_v2_anonimizar_conta('00000000-0000-0000-0000-000000000001') AS valor");
    expect((await anonimizar()).rows[0].valor.estado).toBe('remocao_pendente');
    const inventario = await db.query<{ valor: {id:string}[] }>("SELECT public.aue_v2_inventario_exclusao_conta('00000000-0000-0000-0000-000000000001',NULL) AS valor");
    expect(inventario.rows[0].valor.some(item => item.id === '10000000-0000-0000-0000-000000000001')).toBe(true);
    await db.exec('RESET ROLE');
    await db.exec("INSERT INTO storage.objects VALUES ('duelos_v2','a'); SET ROLE service_role");
    const registrar = () => db.query<{ valor: { estado: string } }>("SELECT public.aue_v2_registrar_remocao_operacional('00000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001') AS valor");
    expect((await registrar()).rows[0].valor.estado).toBe('remocao_pendente');
    await db.exec("RESET ROLE; DELETE FROM storage.objects; SET ROLE service_role");
    expect((await registrar()).rows[0].valor.estado).toBe('removida');
    expect((await registrar()).rows[0].valor.estado).toBe('removida');
    await db.exec("RESET ROLE; INSERT INTO storage.objects VALUES ('duelos_v2','a'); SET ROLE authenticated");
    expect((await consultar('10000000-0000-0000-0000-000000000001')).rows[0].valor.estado).toBe('remocao_pendente');
    await db.exec('RESET ROLE; SET ROLE service_role');
    const novamente = await db.query<{ valor: {id:string}[] }>("SELECT public.aue_v2_inventario_exclusao_conta('00000000-0000-0000-0000-000000000001',NULL) AS valor");
    expect(novamente.rows[0].valor.some(item => item.id === '10000000-0000-0000-0000-000000000001')).toBe(true);
    await db.exec('RESET ROLE; DELETE FROM storage.objects; SET ROLE service_role');
    expect((await registrar()).rows[0].valor.estado).toBe('removida');
    await db.exec('RESET ROLE; SET ROLE authenticated');
    expect((await consultar('10000000-0000-0000-0000-000000000001')).rows[0].valor.estado).toBe('removida_pelo_servico');
    await db.exec('RESET ROLE; SET ROLE service_role');
    // A outra tentativa da conta continua sem confirmação e mantém a operação bloqueada.
    expect((await anonimizar()).rows[0].valor.estado).toBe('remocao_pendente');
    await db.exec("RESET ROLE; UPDATE aue_privado.gravacoes_v2 SET exclusao_solicitada_em=now() WHERE id='10000000-0000-0000-0000-000000000003'; SET ROLE service_role");
    await db.query("SELECT public.aue_v2_registrar_remocao_operacional('00000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000003')");
    expect((await anonimizar()).rows[0].valor.estado).toBe('anonimizada');
    await db.exec('RESET ROLE');
    const outro = await db.query<{ usuario_id: string; caminho: string }>("SELECT usuario_id,caminho FROM aue_privado.gravacoes_v2 WHERE id='10000000-0000-0000-0000-000000000002'");
    expect(outro.rows[0]).toEqual({ usuario_id: '00000000-0000-0000-0000-000000000002', caminho: 'b' });
    await db.exec('RESET ROLE; SET ROLE anon');
    await expect(consultar('10000000-0000-0000-0000-000000000001')).rejects.toThrow(/permission denied/i);
  } finally { await db.close(); }
}, 30_000);
