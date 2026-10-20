import { memo, useEffect } from 'react';
import { ADSTERRA_CONFIG, anunciosAdsterraHabilitados, carregarNativeBanner } from '../../plataforma/web/adsterra';

interface Props {
  readonly rotulo?: string;
}

export const AdsterraNativeBanner = memo(function AdsterraNativeBanner({
  rotulo = 'Patrocinado',
}: Props) {
  useEffect(() => {
    carregarNativeBanner();
  }, []);

  if (!anunciosAdsterraHabilitados) return null;

  return (
    <aside
      className="card-post adsterra-native-card"
      aria-label="Conteúdo patrocinado"
    >
      <div className="adsterra-native-header">
        <span className="adsterra-native-label">
          {rotulo}
        </span>
      </div>
      <div
        id={ADSTERRA_CONFIG.nativeContainerId}
        data-testid="adsterra-native-container"
        className="adsterra-native-container"
      />
    </aside>
  );
});
