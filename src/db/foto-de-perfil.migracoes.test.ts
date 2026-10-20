import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const raiz = fileURLToPath(new URL('../..', import.meta.url));
const sql = readFileSync(`${raiz}/supabase/migrations/20261020201000_foto_de_perfil_so_conta_promovida.sql`, 'utf8')
  .split('\n').filter((l) => !l.trimStart().startsWith('--')).join('\n').replace(/\s+/g, ' ');

describe('foto de perfil (migration 20261020201000)', () => {
  it('só conta promovida grava no bucket avatars, e só na própria pasta', () => {
    for (const cmd of ['INSERT', 'UPDATE']) {
      const bloco = sql.match(new RegExp(`CREATE POLICY avatars_\\w+ ON storage\\.objects FOR ${cmd}.*?\\);(?= CREATE| DROP|$)`, 'i'))?.[0] ?? '';
      expect(bloco, cmd).toMatch(/aue_e_conta_promovida\(auth\.uid\(\)\)/);
      expect(bloco, cmd).toMatch(/foldername\(name\)\)\[1\] = auth\.uid\(\)::text/);
    }
  });

  it('permite apagar a própria foto', () => {
    expect(sql).toMatch(/CREATE POLICY avatars_remover_propria ON storage\.objects FOR DELETE/i);
  });

  it('o RPC só aceita URL da própria pasta do bucket avatars', () => {
    expect(sql).toContain('/storage/v1/object/public/avatars/');
    expect(sql).toContain("position('/avatars/' || auth.uid()::text || '/' IN p_url_do_avatar) = 0");
    const re = new RegExp(/\^https:\/\/\[a-z0-9\]\+\\\.supabase\\\.co\/storage\/v1\/object\/public\/avatars\/\[0-9a-f-\]\{36\}\/avatar\\\.jpg\(\\\?v=\[0-9\]\+\)\?\$/.source);
    expect(re.test(sql.match(/p_url_do_avatar !~ '([^']+)'/)![0].replace("p_url_do_avatar !~ '", '').replace(/'$/, ''))).toBe(true);
  });

  it('continua exigindo conta promovida e não escapa ponto duas vezes', () => {
    expect(sql).toContain('aue_exigir_conta_promovida()');
    expect(sql).not.toContain('\\\\');
  });
});
