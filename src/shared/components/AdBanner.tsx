import React, { useEffect, useRef } from 'react';

const CLIENTE_ADSENSE = import.meta.env.VITE_ADSENSE_CLIENT as string | undefined;
const URL_ADSENSE = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js';

interface AdBannerProps {
  /** Assinante não vê anúncio. Precisa ser passado — o default é o caso comum, não o seguro. */
  isPremium?: boolean;
  /** Id do bloco criado no painel do AdSense. Sem ele, nada é servido. */
  adSlot?: string;
  /** Estado observado do bloco. Permite preencher só os slots que o Google recusou. */
  aoMudarEstado?: (estado: EstadoDoAdSense) => void;
}

export type EstadoDoAdSense = 'aguardando' | 'preenchido' | 'vazio';

/** Há cliente do Google disponível nesta build; ainda depende do id do slot. */
export const ADSENSE_CONFIGURADO = Boolean(CLIENTE_ADSENSE);

/**
 * Bloco de anúncio pronto para produção, inerte até a liberação do Google.
 *
 * COMO SE COMPORTA HOJE (sem conta aprovada):
 *   - não carrega script nenhum do Google;
 *   - não renderiza nada para o usuário final;
 *   - mostra um marcador do lugar APENAS em desenvolvimento, para a colocação
 *     ficar visível a quem mexe na tela.
 *
 * QUANDO A CONTA SAIR: preencher `VITE_ADSENSE_CLIENT` e
 * `VITE_ADSENSE_SLOT_RESULT` no ambiente e publicar. Nenhuma mudança de código.
 *
 * Antes, o script vinha fixo no `index.html` com `client=ca-pub-XXXXXXXXXXXXXXXX`
 * — requisição a terceiro em toda visita, com um id que nunca foi válido.
 */
function garantirScriptAdSense(cliente: string) {
  if (document.querySelector(`script[data-aue-adsense="${cliente}"]`)) return;

  const script = document.createElement('script');
  script.async = true;
  script.crossOrigin = 'anonymous';
  script.src = `${URL_ADSENSE}?client=${encodeURIComponent(cliente)}`;
  script.dataset.aueAdsense = cliente;
  document.head.appendChild(script);
}

export const AdBanner: React.FC<AdBannerProps> = ({ isPremium = false, adSlot, aoMudarEstado }) => {
  const configurado = Boolean(CLIENTE_ADSENSE && adSlot);
  const jaEmpurrado = useRef(false);
  const elementoDoAnuncio = useRef<HTMLModElement | null>(null);

  useEffect(() => {
    if (isPremium || !configurado || jaEmpurrado.current) return;

    garantirScriptAdSense(CLIENTE_ADSENSE as string);

    try {
      // `adsbygoogle` é criado pelo script; empurrar antes dele chegar é o uso
      // previsto pela própria API (a fila é drenada no carregamento).
      const fila = ((window as unknown as { adsbygoogle?: unknown[] }).adsbygoogle ??= []);
      fila.push({});
      jaEmpurrado.current = true;
    } catch (err) {
      console.error('Falha ao registrar bloco AdSense', err);
    }
  }, [configurado, isPremium]);

  useEffect(() => {
    if (isPremium || !configurado) return undefined;

    aoMudarEstado?.('aguardando');
    const elemento = elementoDoAnuncio.current;
    if (!elemento) return undefined;

    const informarEstado = () => {
      const status = elemento.getAttribute('data-ad-status');
      if (status === 'filled') aoMudarEstado?.('preenchido');
      if (status === 'unfilled') aoMudarEstado?.('vazio');
    };

    informarEstado();
    const observador = new MutationObserver(informarEstado);
    observador.observe(elemento, { attributes: true, attributeFilter: ['data-ad-status'] });
    return () => observador.disconnect();
  }, [aoMudarEstado, configurado, isPremium]);

  // Assinante nunca vê anúncio — é o que a tela de perfil promete
  // ("Sem anúncios, arrotos ilimitados e favoritos").
  if (isPremium) return null;

  if (!configurado) {
    // Em produção o espaço simplesmente não existe: nada de caixa tracejada
    // dizendo "não configurado" para o usuário no lançamento.
    if (!import.meta.env.DEV) return null;

    return (
      <div className="ad-slot" role="presentation" aria-hidden="true">
        <span className="ad-slot-label">Anúncio</span>
        <span className="ad-slot-note">
          Colocação reservada — invisível em produção até VITE_ADSENSE_CLIENT e o slot serem preenchidos
        </span>
      </div>
    );
  }

  return (
    <ins
      className="adsbygoogle"
      ref={elementoDoAnuncio}
      style={{ display: 'block', margin: '16px 0', minHeight: 100 }}
      data-ad-client={CLIENTE_ADSENSE}
      data-ad-slot={adSlot}
      data-ad-format="auto"
      data-full-width-responsive="true"
      aria-label="Anúncio"
    />
  );
};
