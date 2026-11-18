import type { EventoArenaV2, TelemetriaArenaV2 } from '../../portas/telemetriaArenaV2';
import type { PaginaMonitorada } from '../../nucleo/telemetria/paginas';
import { telemetriaBloqueada } from './exclusaoTelemetria';

const ID_MEDICAO = 'G-43GWYNCCMD';
const LOCAL_CANONICO = 'https://aue.web.app/';
const EVENTOS: readonly EventoArenaV2[] = ['abriu_arena_v2', 'iniciou_gravacao', 'concluiu_gravacao', 'laudo_disponivel', 'laudo_indisponivel', 'abriu_compartilhamento_audio', 'solicitou_download_audio'];
const CATEGORIAS: readonly PaginaMonitorada[] = ['feed', 'comunidades', 'comunidade', 'topico', 'explorar', 'arena', 'perfil', 'entrada', 'publica'];
type JanelaAnalytics = Window & { dataLayer?: unknown[]; gtag?: (...args: unknown[]) => void; [key: `ga-disable-${string}`]: boolean | undefined };
let configurada = false;

function segura(): boolean {
  return typeof window !== 'undefined' && window.location.hostname === 'aue.web.app' && !telemetriaBloqueada() && (window.location.pathname === '/' || window.location.pathname === '/arena') && !window.location.search && !window.location.hash;
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

/** Best effort. Nenhum caminho real, token, áudio ou medição entra nos parâmetros. */
export const analyticsArenaV2: TelemetriaArenaV2 = {
  registrar(evento) {
    if (!EVENTOS.includes(evento)) return;
    try { pronta()?.gtag?.('event', evento, { send_to: ID_MEDICAO, page_location: LOCAL_CANONICO, page_referrer: '' }); } catch { /* Não interromper a Arena. */ }
  },
};

/** Também desativa a coleta ao navegar para fora da Arena ou abrir URL sensível. */
export function registrarPaginaAnalytics(pagina: PaginaMonitorada | null): void {
  try {
    if (!segura()) { pronta(); return; }
    if (!pagina || !CATEGORIAS.includes(pagina)) return;
    pronta()?.gtag?.('event', 'page_view', { send_to: ID_MEDICAO, page_location: LOCAL_CANONICO, page_referrer: '', pagina });
  } catch { /* A navegação não depende da telemetria. */ }
}
