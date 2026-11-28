import { useCallback, useState } from 'react';
import { anunciosAdsterraHabilitados } from '../../plataforma/web/adsterra';
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
 * Quando a Adsterra está habilitada, intercala o Native Banner e o Banner
 * 300x250 isolado. Smartlinks e barras flutuantes não são formatos permitidos.
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
      return <AdsterraBanner300x250 />;
    }
    if (indiceDoSlot === 0) {
      return <AdsterraNativeBanner />;
    }
    return <AdsterraBanner300x250 />;
  }

  return <SlotAdSenseOuVitrine posicionamento={posicionamento} />;
}

export function SlotPatrocinadoDoFeed({ indiceDoSlot = 0 }: { readonly indiceDoSlot?: number }) {
  return <SlotPatrocinado posicionamento="feed" indiceDoSlot={indiceDoSlot} />;
}
