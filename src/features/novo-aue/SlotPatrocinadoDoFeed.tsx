import { useCallback, useState } from 'react';
import { ADSTERRA_CONFIG, anunciosAdsterraHabilitados } from '../../plataforma/web/adsterra';
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
          fontSize: '11px',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          color: 'var(--aue-accent, #c6ff00)',
          fontWeight: 700,
        }}
      >
        Parceiro da Tropa
      </span>
      <h2 style={{ marginTop: 4, fontFamily: "var(--font-display, 'Anton', sans-serif)", fontSize: 18, letterSpacing: '-0.02em' }}>
        Combustível Oficial 🍺
      </h2>
      <p style={{ fontSize: 13, color: 'var(--aue-muted)', margin: '6px 0 12px', lineHeight: 1.45 }}>
        Mantenha o gás e a pressão em dia. Acesse ofertas parceiras e apoie o Auê!
      </p>
      <a
        href={ADSTERRA_CONFIG.smartlinkUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="join"
        style={{
          display: 'inline-block',
          textAlign: 'center',
          textDecoration: 'none',
          width: '100%',
          boxSizing: 'border-box',
        }}
      >
        Conferir ofertas parceiras ↗
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
 * Quando a Adsterra está habilitada, ela ocupa diretamente os slots do feed (banner nativo)
 * e da lateral direita (smartlink de ofertas parceiras).
 * Sem Adsterra, prioriza o AdSense caso configurado, caindo na vitrine da casa se vazio.
 */
export function SlotPatrocinado({ posicionamento }: { readonly posicionamento: PosicionamentoDoSlot }) {
  if (anunciosAdsterraHabilitados) {
    if (posicionamento === 'feed') {
      return <AdsterraNativeBanner />;
    }
    return <PainelLateralAdsterra />;
  }

  return <SlotAdSenseOuVitrine posicionamento={posicionamento} />;
}

export function SlotPatrocinadoDoFeed() {
  return <SlotPatrocinado posicionamento="feed" />;
}
