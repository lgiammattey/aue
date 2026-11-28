import { memo } from 'react';
import { srcDocNativeBanner } from '../../plataforma/web/adsterra';
import { useFrameDePublicidade } from './usePublicidadeAdsterra';

interface Props {
  readonly rotulo?: string;
}

export const AdsterraNativeBanner = memo(function AdsterraNativeBanner({
  rotulo = 'Patrocinado',
}: Props) {
  const { ativo, observarFrame } = useFrameDePublicidade();
  if (!ativo) return null;

  return (
    <aside className="card-post adsterra-native-card" aria-label="Conteúdo patrocinado">
      <div className="adsterra-native-header">
        <span className="adsterra-native-label">{rotulo}</span>
      </div>
      <div data-testid="adsterra-native-container" className="adsterra-native-container">
        <iframe
          ref={observarFrame}
          title={rotulo}
          sandbox="allow-scripts"
          allow="autoplay 'none'; microphone 'none'; camera 'none'"
          referrerPolicy="no-referrer"
          loading="lazy"
          style={{ display: 'block', width: '100%', aspectRatio: '4 / 1', height: 'auto', border: 0 }}
          srcDoc={srcDocNativeBanner()}
        />
      </div>
    </aside>
  );
});
