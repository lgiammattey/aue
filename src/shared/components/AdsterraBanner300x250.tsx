import { memo } from 'react';
import { ADSTERRA_CONFIG, anunciosAdsterraHabilitados, srcDocBanner300x250 } from '../../plataforma/web/adsterra';
import './AdsterraBanner300x250.css';

interface Props {
  readonly rotulo?: string;
}

/** Bloco isolado 300x250 da Adsterra; seguro para aparecer em várias posições na mesma tela. */
export const AdsterraBanner300x250 = memo(function AdsterraBanner300x250({
  rotulo = 'Patrocinado',
}: Props) {
  if (!anunciosAdsterraHabilitados) return null;

  return (
    <aside
      className="card-post adsterra-native-card adsterra-banner-300x250"
      aria-label="Conteúdo patrocinado"
    >
      <div className="adsterra-native-header">
        <span className="adsterra-native-label">{rotulo}</span>
      </div>
      <div
        data-testid="adsterra-banner-300x250"
        className="adsterra-banner-300x250__container"
      >
        <iframe
          title="Publicidade patrocinada"
          width={ADSTERRA_CONFIG.banner300x250Width}
          height={ADSTERRA_CONFIG.banner300x250Height}
          scrolling="no"
          srcDoc={srcDocBanner300x250()}
        />
      </div>
    </aside>
  );
});
