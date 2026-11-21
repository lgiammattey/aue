import { FLAGS } from '../../shared/flags';

/**
 * Integração com a rede de anúncios Adsterra para o Auê.
 *
 * Formatos cadastrados:
 * - Social Bar (bicea.org)
 * - Banner 300x250 (bicea.org)
 * - Native Banner 4:1 (bicea.org)
 * - Smartlink direto (arwf.org)
 *
 * Conforme o ADR 0001, APIs de navegador vivem exclusivamente nesta camada (src/plataforma/).
 */

export const ADSTERRA_CONFIG = {
  nativeBannerScript: 'https://bicea.org/21/b3ef3ea4710efc9bee6fe5deb3576a7d',
  nativeContainerId: 'container-b3ef3ea4710efc9bee6fe5deb3576a7d',
  smartlinkUrl: 'https://arwf.org/4/71e00b8778f0e88e84f8217907e33621',
  socialBarScript: 'https://bicea.org/14/fb6230b2a89aeda4eb455fee6d1e8815',
  banner300x250Key: '228f60177e45ec5b79116ace2c420d5b',
  banner300x250Script: 'https://bicea.org/22/228f60177e45ec5b79116ace2c420d5b',
  banner300x250Width: 300,
  banner300x250Height: 250,
} as const;

/**
 * Placement externo só é ligado com flag explícita de build. A chave de API
 * nunca pertence ao cliente: receita é lida pela Edge Function administrativa.
 */
export const anunciosAdsterraHabilitados = FLAGS.anunciosAdsterra;

/** Injeta o Native Banner só quando a publicação o habilitou explicitamente. */
export function carregarNativeBanner(): HTMLScriptElement | null {
  if (!anunciosAdsterraHabilitados || typeof document === 'undefined') return null;

  const selector = `script[data-aue-adsterra="native"]`;
  const existente = document.querySelector<HTMLScriptElement>(selector);
  if (existente) {
    existente.remove();
  }

  const script = document.createElement('script');
  script.async = true;
  script.setAttribute('data-cfasync', 'false');
  script.src = ADSTERRA_CONFIG.nativeBannerScript;
  script.dataset.aueAdsterra = 'native';
  document.body.appendChild(script);
  return script;
}

/**
 * Garante a injeção única do script do Social Bar quando a publicação habilitou a Adsterra.
 * Evita carregar o script múltiplas vezes caso o componente raiz remonte.
 */
export function carregarSocialBar(): HTMLScriptElement | null {
  if (!anunciosAdsterraHabilitados || typeof document === 'undefined') return null;

  const existente = document.querySelector<HTMLScriptElement>('script[data-aue-adsterra="social-bar"]');
  if (existente) {
    return existente;
  }

  const script = document.createElement('script');
  script.async = true;
  script.setAttribute('data-cfasync', 'false');
  script.src = ADSTERRA_CONFIG.socialBarScript;
  script.dataset.aueAdsterra = 'social-bar';
  document.body.appendChild(script);
  return script;
}

/**
 * Documento isolado para carregar múltiplos banners 300x250 via `atOptions`
 * sem colisão de variável global na mesma página.
 */
export function srcDocBanner300x250(): string {
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="color-scheme" content="dark"><style>html,body{margin:0;padding:0;overflow:hidden;background:#111318;color:#8b92a3;display:flex;justify-content:center;align-items:center;}</style></head><body><script>atOptions={'key':'${ADSTERRA_CONFIG.banner300x250Key}','format':'iframe','height':${ADSTERRA_CONFIG.banner300x250Height},'width':${ADSTERRA_CONFIG.banner300x250Width},'params':{}};</script><script src="${ADSTERRA_CONFIG.banner300x250Script}"></script></body></html>`;
}
