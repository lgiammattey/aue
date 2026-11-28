import { useCallback, useState, useSyncExternalStore } from 'react';
import { observarFalhaDePublicidade, observarPublicidadeAdsterra, publicidadeAdsterraPermitida } from '../../plataforma/web/adsterra';

export function usePublicidadeAdsterra(): boolean {
  return useSyncExternalStore(observarPublicidadeAdsterra, publicidadeAdsterraPermitida, () => false);
}

export function useFrameDePublicidade() {
  const permitida = usePublicidadeAdsterra();
  const [falhou, atualizarFalha] = useState(false);
  const observarFrame = useCallback((frame: HTMLIFrameElement | null) => (
    frame ? observarFalhaDePublicidade(frame, () => atualizarFalha(true)) : undefined
  ), []);
  return { ativo: permitida && !falhou, observarFrame };
}
