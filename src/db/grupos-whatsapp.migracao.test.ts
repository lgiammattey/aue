import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const raiz = fileURLToPath(new URL('../..', import.meta.url));
const arquivo = '20261022001000_migrar_grupos_whatsapp_para_comunidade.sql';
const sql = readFileSync(`${raiz}/supabase/migrations/${arquivo}`, 'utf8');

describe('migração dos grupos oficiais de WhatsApp', () => {
  it('cria a comunidade e um tópico fixado pela estrutura real do fórum', () => {
    expect(sql).toContain("'Grupos WhatsApp'");
    expect(sql).toContain("'grupos-whatsapp'");
    expect(sql).toContain('INSERT INTO public.topicos');
    expect(sql).toContain("'Links dos grupos oficiais de WhatsApp'");
    expect(sql).toMatch(/'comunidade',[\s\S]*?true/);
  });

  it('monta o tópico pelos três convites oficiais já guardados no banco', () => {
    expect(sql).toContain('FROM public.grupos_externos ge');
    expect(sql).toContain("ge.nome || E'\\n' || ge.link_do_convite");
    expect(sql).toContain('AND ge.e_oficial');
    expect(sql).toContain(') = 3');
    expect(sql).not.toContain('chat.whatsapp.com/');

    for (const slug of [
      'arroto-e-peido-dos-profissionais',
      'grupo-do-peido-e-arroto',
      'gym-arrotos',
    ]) expect(sql).toContain(`'${slug}'`);

    expect(sql).toContain('UPDATE public.grupos_externos');
    expect(sql).toContain('SET esta_escondido = true');
  });

  it('não duplica o tópico ou a administração quando for reexecutada', () => {
    expect(sql).toContain('ON CONFLICT DO NOTHING');
    expect(sql).toContain('ON CONFLICT (group_id, user_id) DO UPDATE SET role = \'admin\'');
    expect(sql).toContain('AND NOT EXISTS (');
  });
});
