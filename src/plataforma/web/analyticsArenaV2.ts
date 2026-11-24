import type { EventoArenaV2, TelemetriaArenaV2 } from '../../portas/telemetriaArenaV2';
import type { PaginaMonitorada } from '../../nucleo/telemetria/paginas';
import type { EventoDeTelemetria } from '../../portas/telemetria';
import { telemetriaBloqueada } from './exclusaoTelemetria';
import { URL_CANONICA_DA_HOME } from '../../shared/enderecoPublico';

const ID_MEDICAO = 'G-43GWYNCCMD';
const LOCAL_CANONICO = URL_CANONICA_DA_HOME;
/** O domínio novo e o antigo servem o mesmo site. A medição vale nos dois. */
const HOSTS_COM_MEDICAO: ReadonlySet<string> = new Set(['arrotaaue.com.br', 'aue.web.app']);
const EVENTOS: readonly EventoArenaV2[] = [
  'abriu_arena_v2',
  'iniciou_gravacao',
  'concluiu_gravacao',
  'laudo_disponivel',
  'laudo_indisponivel',
  'abriu_compartilhamento_audio',
  'solicitou_download_audio',
  'confirmou_maioridade',
  'ouviu_arroto',
  'clicou_anuncio',
];
const CATEGORIAS: readonly PaginaMonitorada[] = ['feed', 'comunidades', 'comunidade', 'topico', 'explorar', 'arena', 'perfil', 'entrada', 'publica'];
const ROTAS_SEGURAS = new Set([
  '/',
  '/en',
  '/arena',
  '/feed',
  '/como-arrotar',
  '/como-jogar',
  '/tipos-de-arroto',
  '/ranking-de-arrotos',
  '/grupos',
  '/login',
  '/privacidade',
  '/termos',
]);

type JanelaAnalytics = Window & { dataLayer?: unknown[]; gtag?: (...args: unknown[]) => void; [key: `ga-disable-${string}`]: boolean | undefined };
let configurada = false;

function segura(): boolean {
  return (
    typeof window !== 'undefined'
    && HOSTS_COM_MEDICAO.has(window.location.hostname)
    && !telemetriaBloqueada()
    && ROTAS_SEGURAS.has(window.location.pathname)
    && !window.location.search
    && !window.location.hash
  );
}

function pronta(): JanelaAnalytics | null {
  if (typeof window === 'undefined' || typeof document === 'undefined') return null;
  const w = window as unknown as JanelaAnalytics;
  if (!segura()) { w[`ga-disable-${ID_MEDICAO}`] = true; return null; }
  w[`ga-disable-${ID_MEDICAO}`] = false;
  if (!configurada) {
    try {
      w.dataLayer = w.dataLayer ?? [];
      w.gtag = function (..._args: unknown[]) { w.dataLayer?.push(arguments); };
      w.gtag('js', new Date());
      w.gtag('config', ID_MEDICAO, { send_page_view: false, page_location: LOCAL_CANONICO, page_referrer: '', allow_google_signals: false, allow_ad_personalization_signals: false });
      const script = document.createElement('script');
      script.async = true;
      script.setAttribute('referrerpolicy', 'no-referrer');
      script.src = `https://www.googletagmanager.com/gtag/js?id=${ID_MEDICAO}`;
      document.head.appendChild(script);
      configurada = true;
    } catch { return null; }
  }
  return w;
}

/**
 * Best effort. Nenhum caminho real, token, áudio ou medição entra nos parâmetros.
 * Em inglês o evento leva `idioma: 'en'`, para separar a Arena de `/en` da de `/`.
 * Em português nada muda nos parâmetros que já existem.
 */
export function criarAnalyticsArenaV2(idioma: 'pt' | 'en'): TelemetriaArenaV2 {
  const extra = idioma === 'en' ? { idioma } : {};
  return {
    registrar(evento) {
      if (!EVENTOS.includes(evento)) return;
      try { pronta()?.gtag?.('event', evento, { send_to: ID_MEDICAO, page_location: LOCAL_CANONICO, page_referrer: '', ...extra }); } catch { /* Não interromper a Arena. */ }
    },
  };
}

export const analyticsArenaV2: TelemetriaArenaV2 = criarAnalyticsArenaV2('pt');
export const analyticsArenaV2Em: TelemetriaArenaV2 = criarAnalyticsArenaV2('en');

/**
 * Espelha no GA4 os eventos de funil que já vão para `eventos_de_telemetria`.
 * Só o nome do evento atravessa: nada de código de batalha, sessão, origem ou
 * caminho. `visitou_pagina` fica de fora porque `registrarPaginaAnalytics` já
 * manda o `page_view`. Rotas com código no endereço (`/x1/:code`) não estão em
 * `ROTAS_SEGURAS`, então nelas nada é enviado.
 */
const EVENTOS_DE_FUNIL: readonly EventoDeTelemetria[] = [
  'abriu_arena', 'iniciou_arroto', 'recebeu_nota', 'tentou_novamente', 'compartilhou',
  'criou_x1', 'abriu_x1', 'respondeu_x1', 'pediu_revanche', 'concluiu_roda',
];
export function registrarEventoDeFunilNoAnalytics(evento: EventoDeTelemetria): void {
  if (!EVENTOS_DE_FUNIL.includes(evento)) return;
  try { pronta()?.gtag?.('event', evento, { send_to: ID_MEDICAO, page_location: LOCAL_CANONICO, page_referrer: '' }); } catch { /* A jornada não depende do GA4. */ }
}

/** Também desativa a coleta ao navegar para fora das rotas públicas ou abrir URL sensível. */
export function registrarPaginaAnalytics(pagina: PaginaMonitorada | null): void {
  try {
    if (!segura()) { pronta(); return; }
    if (!pagina || !CATEGORIAS.includes(pagina)) return;
    pronta()?.gtag?.('event', 'page_view', { send_to: ID_MEDICAO, page_location: LOCAL_CANONICO, page_referrer: '', pagina });
  } catch { /* A navegação não depende da telemetria. */ }
}
