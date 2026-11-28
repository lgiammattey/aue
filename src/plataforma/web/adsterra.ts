import { FLAGS } from '../../shared/flags';
import { maioridadeConfirmada } from './maioridade';

export const ADSTERRA_CONFIG = {
  nativeBannerScript: 'https://bicea.org/21/b3ef3ea4710efc9bee6fe5deb3576a7d',
  nativeContainerId: 'container-b3ef3ea4710efc9bee6fe5deb3576a7d',
  banner300x250Key: '228f60177e45ec5b79116ace2c420d5b',
  banner300x250Script: 'https://bicea.org/22/228f60177e45ec5b79116ace2c420d5b',
  banner300x250Width: 300,
  banner300x250Height: 250,
} as const;

export const anunciosAdsterraHabilitados = FLAGS.anunciosAdsterra;
const redeAdsterraHabilitada = anunciosAdsterraHabilitados
  && import.meta.env.PROD
  && import.meta.env.VITE_ADSTERRA_ATIVAR_REDE === '1';

const URL_DA_CONFIGURACAO = import.meta.env.VITE_ADSTERRA_CONFIG_URL?.trim() ?? '';
const PRAZO_CONFIGURACAO_MS = 3_000;
const INTERVALO_CONFIGURACAO_MS = 15_000;
const LARGURA_DESKTOP = '(min-width: 761px)';
const EVENTO_CONFIGURACAO = 'aue:adsterra-configurada';
const EVENTO_MAIORIDADE = 'aue:maioridade-confirmada';
const EVENTO_FRAME_INDISPONIVEL = 'aue:adsterra-indisponivel';
let publicidadeRuntimeAtiva = false;
let monitoramentoAtivo = false;
let consultaEmAndamento: Promise<boolean> | null = null;

function publicarEstadoRuntime(ativa: boolean): boolean {
  if (publicidadeRuntimeAtiva !== ativa) {
    publicidadeRuntimeAtiva = ativa;
    window.dispatchEvent(new Event(EVENTO_CONFIGURACAO));
  }
  return ativa;
}

async function consultarPublicidadeRuntime(): Promise<boolean> {
  const controlador = new AbortController();
  const prazo = window.setTimeout(() => controlador.abort(), PRAZO_CONFIGURACAO_MS);
  try {
    const url = new URL(URL_DA_CONFIGURACAO);
    if (url.protocol !== 'https:' || url.username || url.password) return publicarEstadoRuntime(false);
    const resposta = await fetch(url, {
      cache: 'no-store',
      credentials: 'omit',
      referrerPolicy: 'no-referrer',
      redirect: 'error',
      headers: { accept: 'application/json' },
      signal: controlador.signal,
    });
    const corpo: unknown = resposta.ok ? await resposta.json() : null;
    return publicarEstadoRuntime(typeof corpo === 'object' && corpo !== null
      && (corpo as { adsterra?: unknown }).adsterra === true);
  } catch {
    return publicarEstadoRuntime(false);
  } finally {
    window.clearTimeout(prazo);
  }
}

export function atualizarPublicidadeRuntime(): Promise<boolean> {
  if (!redeAdsterraHabilitada || !URL_DA_CONFIGURACAO || !maioridadeConfirmada()) {
    return Promise.resolve(false);
  }
  consultaEmAndamento ??= consultarPublicidadeRuntime().finally(() => { consultaEmAndamento = null; });
  return consultaEmAndamento;
}

export function publicidadeAdsterraPermitida(): boolean {
  return redeAdsterraHabilitada && publicidadeRuntimeAtiva && maioridadeConfirmada();
}

function monitorarPublicidadeRuntime(): void {
  if (monitoramentoAtivo || !URL_DA_CONFIGURACAO || !maioridadeConfirmada()) return;
  monitoramentoAtivo = true;
  void atualizarPublicidadeRuntime();
  window.addEventListener('focus', () => { void atualizarPublicidadeRuntime(); });
  window.setInterval(() => { void atualizarPublicidadeRuntime(); }, INTERVALO_CONFIGURACAO_MS);
}

export function observarPublicidadeAdsterra(atualizar: () => void): () => void {
  if (!redeAdsterraHabilitada || typeof window === 'undefined') return () => {};
  const mudouMaioridade = () => {
    monitorarPublicidadeRuntime();
    atualizar();
  };
  window.addEventListener(EVENTO_MAIORIDADE, mudouMaioridade);
  window.addEventListener(EVENTO_CONFIGURACAO, atualizar);
  monitorarPublicidadeRuntime();
  return () => {
    window.removeEventListener(EVENTO_MAIORIDADE, mudouMaioridade);
    window.removeEventListener(EVENTO_CONFIGURACAO, atualizar);
  };
}

export function larguraDesktopParaPublicidade(): boolean {
  if (typeof window === 'undefined') return false;
  return typeof window.matchMedia === 'function'
    ? window.matchMedia(LARGURA_DESKTOP).matches
    : window.innerWidth >= 761;
}

export function observarLarguraParaPublicidade(atualizar: () => void): () => void {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return () => {};
  const consulta = window.matchMedia(LARGURA_DESKTOP);
  consulta.addEventListener('change', atualizar);
  return () => consulta.removeEventListener('change', atualizar);
}

export function observarFalhaDePublicidade(frame: HTMLIFrameElement, falhou: () => void): () => void {
  const receber = (evento: MessageEvent<unknown>) => {
    if (evento.source === frame.contentWindow && evento.data === EVENTO_FRAME_INDISPONIVEL) falhou();
  };
  window.addEventListener('message', receber);
  return () => window.removeEventListener('message', receber);
}

const avisarFalhaNoFrame = `parent.postMessage('${EVENTO_FRAME_INDISPONIVEL}', '*')`;

/** Os scripts de anúncios ficam somente dentro de frames isolados. */
export function srcDocNativeBanner(): string {
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="referrer" content="no-referrer"><style>html,body{margin:0;padding:0;overflow:hidden}</style></head><body><div id="${ADSTERRA_CONFIG.nativeContainerId}"></div><script async data-cfasync="false" src="${ADSTERRA_CONFIG.nativeBannerScript}" onerror="${avisarFalhaNoFrame}"></script></body></html>`;
}

export function srcDocBanner300x250(): string {
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="referrer" content="no-referrer"><meta name="color-scheme" content="dark"><style>html,body{margin:0;padding:0;overflow:hidden;background:#111318;color:#8b92a3;display:flex;justify-content:center;align-items:center;}</style></head><body><script>atOptions={'key':'${ADSTERRA_CONFIG.banner300x250Key}','format':'iframe','height':${ADSTERRA_CONFIG.banner300x250Height},'width':${ADSTERRA_CONFIG.banner300x250Width},'params':{}};</script><script src="${ADSTERRA_CONFIG.banner300x250Script}" onerror="${avisarFalhaNoFrame}"></script></body></html>`;
}
