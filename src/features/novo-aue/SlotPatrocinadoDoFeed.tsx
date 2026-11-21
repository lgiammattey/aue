import { useCallback, useState } from 'react';
import { ADSTERRA_CONFIG, anunciosAdsterraHabilitados } from '../../plataforma/web/adsterra';
import { analyticsArenaV2 } from '../../plataforma/web/analyticsArenaV2';
import { AdsterraBanner300x250 } from '../../shared/components/AdsterraBanner300x250';
import { ADSENSE_CONFIGURADO, AdBanner, type EstadoDoAdSense } from '../../shared/components/AdBanner';
import { AdsterraNativeBanner } from './AdsterraNativeBanner';
import { VitrineDeApps } from './VitrineDeApps';

const SLOT_DO_FEED = import.meta.env.VITE_ADSENSE_SLOT_FEED as string | undefined;
const SLOT_DA_LATERAL = import.meta.env.VITE_ADSENSE_SLOT_SIDEBAR as string | undefined;

type PosicionamentoDoSlot = 'feed' | 'sidebar';

const slotPorPosicionamento: Record<PosicionamentoDoSlot, string | undefined> = {
  feed: SLOT_DO_FEED,
  sidebar: SLOT_DA_LATERAL,
};

function PainelLateralAdsterra() {
  return (
    <aside className="panel adsterra-smartlink-panel" aria-label="Conteúdo patrocinado">
      <span
        style={{
          fontSize: '10px',
          fontFamily: 'var(--font-mono)',
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          color: 'var(--aue-accent, #ff5500)',
          fontWeight: 700,
        }}
      >
        PATROCINADO
      </span>
      <h2 style={{ marginTop: 4, fontFamily: "var(--font-display, 'Anton', sans-serif)", fontSize: 18, letterSpacing: '-0.02em' }}>
        Banca o servidor 🍺
      </h2>
      <p style={{ fontSize: 13, color: 'var(--aue-muted)', margin: '6px 0 12px', lineHeight: 1.45 }}>
        Dá um clique e ajuda a manter o Auê no ar.
      </p>
      <a
        href={ADSTERRA_CONFIG.smartlinkUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="join"
        onClick={() => analyticsArenaV2.registrar('clicou_anuncio')}
        style={{
          display: 'inline-block',
          textAlign: 'center',
          textDecoration: 'none',
          width: '100%',
          boxSizing: 'border-box',
        }}
      >
        Ver oferta ↗
      </a>
    </aside>
  );
}

function SlotAdSenseOuVitrine({ posicionamento }: { readonly posicionamento: PosicionamentoDoSlot }) {
  const slot = slotPorPosicionamento[posicionamento];
  const [estado, setEstado] = useState<EstadoDoAdSense>(
    ADSENSE_CONFIGURADO && slot ? 'aguardando' : 'vazio',
  );
  const aoMudarEstado = useCallback((proximo: EstadoDoAdSense) => setEstado(proximo), []);

  if (estado === 'vazio') return <VitrineDeApps posicionamento={posicionamento} />;

  return (
    <aside className={`slot-patrocinado slot-patrocinado--${posicionamento}`} aria-label="Anúncio">
      <AdBanner adSlot={slot} aoMudarEstado={aoMudarEstado} />
    </aside>
  );
}

/**
 * A propaganda externa ou da casa ocupa o slot patrocinado.
 *
 * Quando a Adsterra está habilitada, intercala o Native Banner (slot 0), o
 * Banner 300x250 isolado (slots ímpares) e o card de ofertas Smartlink (slots pares e lateral).
 * Sem Adsterra, prioriza o AdSense caso configurado, caindo na vitrine da casa se vazio.
 */
export function SlotPatrocinado({
  posicionamento,
  indiceDoSlot = 0,
}: {
  readonly posicionamento: PosicionamentoDoSlot;
  readonly indiceDoSlot?: number;
}) {
  if (anunciosAdsterraHabilitados) {
    if (posicionamento === 'sidebar') {
      return <PainelLateralAdsterra />;
    }
    if (indiceDoSlot === 0) {
      return <AdsterraNativeBanner />;
    }
    if (indiceDoSlot % 2 === 1) {
      return <AdsterraBanner300x250 />;
    }
    return <PainelLateralAdsterra />;
  }

  return <SlotAdSenseOuVitrine posicionamento={posicionamento} />;
}

export function SlotPatrocinadoDoFeed({ indiceDoSlot = 0 }: { readonly indiceDoSlot?: number }) {
  return <SlotPatrocinado posicionamento="feed" indiceDoSlot={indiceDoSlot} />;
}
