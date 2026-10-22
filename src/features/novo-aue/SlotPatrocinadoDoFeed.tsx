import { useCallback, useState } from 'react';
import { ADSENSE_CONFIGURADO, AdBanner, type EstadoDoAdSense } from '../../shared/components/AdBanner';
import { VitrineDeApps } from './VitrineDeApps';

const SLOT_DO_FEED = import.meta.env.VITE_ADSENSE_SLOT_FEED as string | undefined;
const SLOT_DA_LATERAL = import.meta.env.VITE_ADSENSE_SLOT_SIDEBAR as string | undefined;

type PosicionamentoDoSlot = 'feed' | 'sidebar';

const slotPorPosicionamento: Record<PosicionamentoDoSlot, string | undefined> = {
  feed: SLOT_DO_FEED,
  sidebar: SLOT_DA_LATERAL,
};

/**
 * A propaganda da casa vive exatamente no mesmo espaço do anúncio externo.
 *
 * Quando o AdSense está configurado ele ocupa o slot. A vitrine só aparece
 * quando não existe configuração ou quando o Google devolve `unfilled`.
 */
export function SlotPatrocinado({ posicionamento }: { readonly posicionamento: PosicionamentoDoSlot }) {
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

export function SlotPatrocinadoDoFeed() {
  return <SlotPatrocinado posicionamento="feed" />;
}
