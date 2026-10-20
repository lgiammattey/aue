import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const caminho = fileURLToPath(new URL('../../supabase/migrations/20261020090000_painel_administrativo_do_luiz.sql', import.meta.url));
const caminhoDaCorrecao = fileURLToPath(new URL('../../supabase/migrations/20261020163445_liberar_helper_administrador_autenticado.sql', import.meta.url));
const caminhoDaPromocao = fileURLToPath(new URL('../../supabase/migrations/20261020163954_registrar_promocao_de_conta.sql', import.meta.url));
const sql = () => readFileSync(caminho, 'utf8').replace(/\s+/g, ' ');
const sqlDaCorrecao = () => readFileSync(caminhoDaCorrecao, 'utf8').replace(/\s+/g, ' ');
const sqlDaPromocao = () => readFileSync(caminhoDaPromocao, 'utf8').replace(/\s+/g, ' ');

describe('painel administrativo: autorização e privacidade', () => {
  it('autoriza Luiz somente no banco e nunca pelo bundle', () => {
    expect(sql()).toMatch(/INSERT INTO public\.administradores_do_aue \(usuario_id\) SELECT u\.id FROM auth\.users u WHERE lower\(btrim\(u\.email\)\) = 'luizgiammattey@icloud\.com'/i);
    expect(sql()).not.toMatch(/current_setting\('request\.headers'/i);
  });

  it('fecha a tabela de administradores e exige a checagem antes do resumo', () => {
    expect(sql()).toMatch(/ALTER TABLE public\.administradores_do_aue ENABLE ROW LEVEL SECURITY/i);
    expect(sql()).toMatch(/REVOKE ALL ON TABLE public\.administradores_do_aue FROM PUBLIC, anon, authenticated/i);
    expect(sql()).toMatch(/IF NOT public\.aue_e_administrador\(\) THEN RAISE EXCEPTION 'Acesso administrativo negado'/i);
  });

  it('fixa search_path, concede apenas EXECUTE ao autenticado e não abre telemetria', () => {
    expect(sql()).toMatch(/FUNCTION public\.painel_administrativo_resumo[\s\S]*?SECURITY DEFINER[\s\S]*?SET search_path = public, pg_temp/i);
    expect(sql()).toMatch(/REVOKE ALL ON FUNCTION public\.painel_administrativo_resumo\(date, date, integer\) FROM PUBLIC, anon/i);
    expect(sql()).toMatch(/GRANT EXECUTE ON FUNCTION public\.painel_administrativo_resumo\(date, date, integer\) TO authenticated/i);
    expect(sql()).not.toMatch(/GRANT SELECT ON public\.eventos_de_telemetria/i);
    expect(sql()).not.toMatch(/CREATE POLICY[\s\S]*eventos_de_telemetria/i);
  });

  it('não devolve e-mail, UUID, sessão, áudio ou evento individual', () => {
    const retorno = sql().slice(sql().indexOf('RETURN jsonb_build_object'));
    for (const proibido of ['email', 'usuario_id', 'sessao_id', 'caminho_do_audio', 'batalha_codigo']) {
      expect(retorno).not.toContain(`'${proibido}'`);
    }
  });

  it('fecha períodos e baldes diários no horário de São Paulo', () => {
    expect(sql()).toMatch(/now\(\) AT TIME ZONE 'America\/Sao_Paulo'/i);
    expect(sql()).toMatch(/v_inicio::timestamp AT TIME ZONE 'America\/Sao_Paulo'/i);
    expect(sql()).toMatch(/v_fim \+ 1\)::timestamp AT TIME ZONE 'America\/Sao_Paulo'/i);
    expect(sql()).toMatch(/generate_series\(0, v_fim - v_inicio\)/i);
  });

  it('tira contas da casa das contagens e da lista de pessoas', () => {
    const exclusoes = sql().match(/NOT EXISTS \(SELECT 1 FROM public\.contas_da_casa c WHERE c\.usuario_id = u\.id\)/gi) ?? [];
    expect(exclusoes).toHaveLength(4);
  });

  it('reabre somente a execução do helper para a RPC sob sessão autenticada', () => {
    expect(sqlDaCorrecao()).toMatch(/GRANT EXECUTE ON FUNCTION public\.aue_e_administrador\(\) TO authenticated/i);
    expect(sqlDaCorrecao()).not.toMatch(/GRANT (SELECT|INSERT|UPDATE|DELETE)/i);
    expect(sqlDaCorrecao()).not.toMatch(/administradores_do_aue TO authenticated/i);
  });

  it('registra a promoção futura sem inventar datas históricas', () => {
    expect(sqlDaPromocao()).toMatch(/CREATE TABLE public\.contas_promovidas/i);
    expect(sqlDaPromocao()).toMatch(/AFTER INSERT OR UPDATE OF email ON auth\.users/i);
    expect(sqlDaPromocao()).toMatch(/CREATE TRIGGER zz_registrar_promocao_de_conta/i);
    expect(sqlDaPromocao()).not.toMatch(/INSERT INTO public\.contas_promovidas\s*\(usuario_id\)\s*SELECT/i);
  });

  it('separa total atual de contas e acompanhamento iniciado nesta versão', () => {
    expect(sqlDaPromocao()).toContain("'total_contas_de_email_atual'");
    expect(sqlDaPromocao()).toContain("'cadastros_acompanhados_no_periodo'");
    expect(sqlDaPromocao()).toContain("'acompanhamento_de_cadastros_iniciado_em'");
    expect(sqlDaPromocao()).toMatch(/NOT EXISTS \(SELECT 1 FROM public\.contas_da_casa c WHERE c\.usuario_id =/i);
  });
});
