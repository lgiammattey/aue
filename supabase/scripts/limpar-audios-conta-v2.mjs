// Operação em desenvolvimento, restrita ao staging; nunca usar em produção.
// Requer SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, AUE_PROJETO_REF e AUE_USUARIO_ID
// no ambiente seguro do operador. Nunca colocar chaves, IDs ou áudio em logs.
import { createClient } from '@supabase/supabase-js';

const { SUPABASE_URL: url, SUPABASE_SERVICE_ROLE_KEY: key, AUE_PROJETO_REF: ref, AUE_USUARIO_ID: user } = process.env;
if (!url || !key || !ref || !user || ref !== 'rrkkmzamjntplgxktkyc' ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(user) ||
    url !== `https://${ref}.supabase.co`) {
  throw new Error('Configuração ausente ou projeto incompatível');
}
const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
const { error: inicioErro } = await db.rpc('aue_v2_iniciar_exclusao_conta', { p_usuario_id: user });
if (inicioErro) throw new Error('Falhou o bloqueio da conta; nenhuma remoção iniciada');
let cursor = null;
let total = 0;
let pendentes = 0;
for (;;) {
  const { data: itens, error } = await db.rpc('aue_v2_inventario_exclusao_conta', { p_usuario_id: user, p_apos: cursor });
  if (error || !Array.isArray(itens) || itens.length > 100) throw new Error('Inventário indisponível');
  if (!itens.length) break;
  for (const item of itens) {
    if (!item || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(item.id) || item.caminho !== `${user}/${item.id}.wav`) {
      throw new Error('Inventário inconsistente; interrupção sem remoção adicional');
    }
    const { data, error: erroRemocao } = await db.storage.from('duelos_v2').remove([item.caminho]);
    // Resposta vazia ou erro é incerto, mesmo que já tenha sido removido em
    // tentativa anterior. Preservar registro e pedir reconciliação operacional.
    const confirmada = !erroRemocao && Array.isArray(data) && data.some((x) => x.name === item.caminho || x.name === `${item.id}.wav`);
    if (!confirmada) { pendentes++; } else {
      const registrado = await db.rpc('aue_v2_registrar_remocao_operacional', { p_usuario_id: user, p_gravacao_id: item.id });
      if (registrado.error || registrado.data?.estado !== 'removida') pendentes++;
    }
    total++;
  }
  cursor = itens.at(-1).id;
  if (itens.length < 100) break;
}
console.log(JSON.stringify({ gravacoesExaminadas: total, remocoesNaoConfirmadas: pendentes }));
if (pendentes) { process.exitCode = 2; } else {
  const anonimizada = await db.rpc('aue_v2_anonimizar_conta', { p_usuario_id: user });
  if (anonimizada.error || anonimizada.data?.estado !== 'anonimizada') {
    console.log('Anonimização do duelo pendente');
    process.exitCode = 2;
  } else console.log('Referências do duelo anonimizadas');
}
// Não exclui Auth: outros recursos, objetos órfãos e efeitos de cascata devem
// ser reconciliados antes, além da prova de remoção e corridas em staging.
