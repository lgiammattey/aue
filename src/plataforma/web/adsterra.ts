import { FLAGS } from '../../shared/flags';

/**
 * Integração com a rede de anúncios Adsterra para o Auê.
 *
 * Formatos cadastrados:
 * - Social Bar (bicea.org)
 * - Native Banner 4:1 (bicea.org)
 * - Smartlink direto (arwf.org)
 *
 * Conforme o ADR 0001, APIs de navegador vivem exclusivamente nesta camada (src/plataforma/).
 */

export const ADSTERRA_CONFIG = {
  nativeBannerScript: 'https://bicea.org/21/b3ef3ea4710efc9bee6fe5deb3576a7d',
  nativeContainerId: 'container-b3ef3ea4710efc9bee6fe5deb3576a7d',
  smartlinkUrl: 'https://arwf.org/4/71e00b8778f0e88e84f8217907e33621',
} as const;

/**
 * Placement externo só é ligado com flag explícita de build. A chave de API
 * nunca pertence ao cliente: receita é lida pela Edge Function administrativa.
 */
export const anunciosAdsterraHabilitados = FLAGS.anunciosAdsterra;

/**
 * Garante a injeção do script do Social Bar no <head> ou <body> do documento.
 * Evita carregar o script múltiplas vezes caso o componente remonte.
 */
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
