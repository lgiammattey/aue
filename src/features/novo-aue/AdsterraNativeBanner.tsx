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
      style={{
        margin: '16px 0',
        padding: '14px',
        borderRadius: '12px',
        border: '1px solid var(--aue-line, rgba(255, 255, 255, 0.08))',
        background: 'var(--aue-surface, rgba(255, 255, 255, 0.02))',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '10px',
        }}
      >
        <span
          style={{
            fontSize: '11px',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: 'var(--aue-subtle, #777)',
            fontWeight: 600,
          }}
        >
          {rotulo}
        </span>
      </div>
      <div
        id={ADSTERRA_CONFIG.nativeContainerId}
        data-testid="adsterra-native-container"
        style={{
          minHeight: '80px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          overflow: 'hidden',
        }}
      />
    </aside>
  );
});
