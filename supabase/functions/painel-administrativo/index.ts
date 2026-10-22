import "@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "@supabase/server";
import { normalizarMetricasDaAdsterra, urlDasEstatisticasDaAdsterra } from "./metricas.ts";

const ORIGENS_PERMITIDAS = new Set([
  "https://aue.web.app",
  "https://aue.vercel.app",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5175",
]);

function cabecalhosCors(origem: string | null): HeadersInit {
  return {
    "Access-Control-Allow-Origin": origem && ORIGENS_PERMITIDAS.has(origem) ? origem : "https://aue.web.app",
    "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
    "Cache-Control": "no-store",
  };
}

function resposta(status: number, corpo: Record<string, unknown>, origem: string | null): Response {
  return new Response(JSON.stringify(corpo), {
    status,
    headers: { ...cabecalhosCors(origem), "Content-Type": "application/json; charset=utf-8" },
  });
}

const funcaoProtegida = withSupabase({ auth: "user" }, async (requisicao, contexto) => {
  const origem = requisicao.headers.get("origin");
  const { data: eAdministrador, error: erroDaPermissao } = await contexto.supabase.rpc("aue_e_administrador");
  if (erroDaPermissao || eAdministrador !== true) {
    return resposta(403, { ok: false, mensagem: "Acesso indisponível." }, origem);
  }

  const chave = Deno.env.get("ADSTERRA_API_KEY");
  if (!chave) {
    console.error("painel-administrativo: segredo ADSTERRA_API_KEY ausente");
    return resposta(503, { ok: false, mensagem: "Métricas de monetização indisponíveis." }, origem);
  }

  const fim = new Date().toISOString().slice(0, 10);
  const inicio = new Date(Date.now() - 29 * 86_400_000).toISOString().slice(0, 10);

  let respostaDaAdsterra: Response;
  try {
    respostaDaAdsterra = await fetch(
      urlDasEstatisticasDaAdsterra(inicio, fim),
      { headers: { "X-API-Key": chave, Accept: "application/json" } },
    );
  } catch (erro) {
    console.error("painel-administrativo: falha de rede na Adsterra", erro);
    return resposta(502, { ok: false, mensagem: "Métricas de monetização indisponíveis." }, origem);
  }

  if (!respostaDaAdsterra.ok) {
    console.error("painel-administrativo: resposta Adsterra", respostaDaAdsterra.status);
    return resposta(502, { ok: false, mensagem: "Métricas de monetização indisponíveis." }, origem);
  }

  let bruto: unknown;
  try {
    bruto = await respostaDaAdsterra.json();
  } catch (erro) {
    console.error("painel-administrativo: resposta inválida da Adsterra", erro);
    return resposta(502, { ok: false, mensagem: "Métricas de monetização indisponíveis." }, origem);
  }

  let metricas;
  try {
    metricas = normalizarMetricasDaAdsterra(bruto);
  } catch (erro) {
    console.error("painel-administrativo: métricas Adsterra inválidas", erro);
    return resposta(502, { ok: false, mensagem: "Métricas de monetização indisponíveis." }, origem);
  }

  return resposta(200, {
    ok: true,
    monetizacao: {
      inicio,
      fim,
      total_impressoes: metricas.totalImpressoes,
      total_cliques: metricas.totalCliques,
      receita_total: metricas.receitaTotal,
      cpm_medio: metricas.cpmMedio,
    },
  }, origem);
});

export default {
  fetch: async (requisicao: Request): Promise<Response> => {
    const origem = requisicao.headers.get("origin");
    if (requisicao.method === "OPTIONS") return new Response(null, { status: 204, headers: cabecalhosCors(origem) });
    if (requisicao.method !== "POST") return resposta(405, { ok: false, mensagem: "Método indisponível." }, origem);
    return funcaoProtegida(requisicao);
  },
};
