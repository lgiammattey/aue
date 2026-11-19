// Somente servidor. Nunca enviar SUPABASE_SERVICE_ROLE_KEY ao navegador.
import { createClient } from 'npm:@supabase/supabase-js@2.112.2';
import { criarHandler } from './handler.mjs';

const url = Deno.env.get('SUPABASE_URL') || '';
const anon = Deno.env.get('SUPABASE_ANON_KEY') || '';
const segredo = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const origens = (Deno.env.get('DUELO_ORIGENS_PERMITIDAS') || '').split(',').map(s => s.trim()).filter(Boolean);
const admin = createClient(url, segredo, { auth: { persistSession: false, autoRefreshToken: false } });

function cliente(authorization: string) {
  return createClient(url, anon, { global: { headers: { Authorization: authorization } }, auth: { persistSession: false, autoRefreshToken: false } });
}
const handler = criarHandler({
  origens,
  async autenticar(authorization: string) {
    if (!url || !anon || !segredo || !origens.length) return null;
    const usuario = cliente(authorization);
    const { data, error } = await usuario.auth.getUser(authorization.slice(7));
    if (error || !data.user) return null;
    const sessao = await usuario.rpc('aue_v2_sessao_ativa');
    return !sessao.error && sessao.data === true ? { authorization, uid: data.user.id } : null;
  },
  async autorizar(sessao: { authorization: string }, dueloId: string, lado: 'criador' | 'desafiante') {
    const { data, error } = await cliente(sessao.authorization).rpc('aue_v2_recuperar_duelo', { p_duelo_id: dueloId });
    return !error && data?.estado === 'revelado' && data?.bucket === 'duelos_v2' ? data?.[lado]?.caminho ?? null : null;
  },
  async autorizarModeracao(sessao: { authorization: string }, denunciaId: string) {
    const { data, error } = await cliente(sessao.authorization).rpc('aue_v2_audio_para_moderacao', { p_denuncia_id: denunciaId });
    return !error && data?.estado === 'disponivel' && data?.bucket === 'duelos_v2' ? data.caminho ?? null : null;
  },
  async baixar(path: string) {
    const { data, error } = await admin.storage.from('duelos_v2').download(path);
    return error ? null : data;
  },
});
Deno.serve(handler);
