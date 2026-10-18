import React from 'react';
import { Link } from 'react-router-dom';

export const TelaVersoesWebapp: React.FC = () => {
  const mk = (title: string, src: string, w: number, h: number, k: number) => ({
    title,
    src,
    size: `${w} × ${h}`,
    box: {
      width: w * k,
      height: h * k,
      border: '1px solid var(--border, #2a2a22)',
      borderRadius: 12,
      overflow: 'hidden',
      background: 'var(--bg, #0a0a08)',
    },
    frame: {
      width: w,
      height: h,
      border: 0,
      transform: `scale(${k})`,
      transformOrigin: '0 0',
    },
  });

  const frames = [
    mk('Desktop · Feed', '/feed', 1280, 800, 0.9),
    mk('Desktop · Arena', '/arena', 1280, 800, 0.9),
    mk('Tablet · Feed', '/feed', 820, 900, 0.8),
    mk('Celular · Feed', '/feed', 390, 844, 0.8),
    mk('Celular · Arena', '/arena', 390, 844, 0.8),
  ];

  return (
    <div
      style={{
        width: '100%',
        minHeight: '100vh',
        background: 'var(--bg, #000000)',
        color: 'var(--fg, #ffffff)',
        fontFamily: 'var(--font-body, "Archivo", sans-serif)',
        padding: '40px 32px',
        boxSizing: 'border-box',
      }}
    >
      <div style={{ maxWidth: 1280, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 40 }}>
        <div>
          <span
            style={{
              fontFamily: 'var(--font-display, "Anton", sans-serif)',
              fontSize: 36,
              textTransform: 'uppercase',
            }}
          >
            Bonde do Arroto · Webapp
          </span>
          <p style={{ color: 'var(--muted, #9e9c8d)', fontSize: 16, margin: '8px 0 0' }}>
            Mesmo app, três larguras. Desktop em 3 colunas, tablet com menu em ícones, celular com barra inferior.
          </p>
          <div style={{ display: 'flex', gap: 16, marginTop: 12, fontSize: 15 }}>
            <Link to="/landing" style={{ color: 'var(--fg, #ffffff)' }}>
              Landing
            </Link>
            <Link to="/login" style={{ color: 'var(--fg, #ffffff)' }}>
              Login
            </Link>
          </div>
        </div>

        {frames.map((f) => (
          <section key={f.title} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', gap: 16, alignItems: 'baseline' }}>
              <b style={{ fontSize: 18 }}>{f.title}</b>
              <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: 12, color: 'var(--muted, #9e9c8d)' }}>
                {f.size}
              </span>
              <a href={f.src} style={{ color: 'var(--fg, #ffffff)', fontSize: 14 }}>
                Abrir
              </a>
            </div>
            <div style={f.box}>
              <iframe src={f.src} style={f.frame} title={f.title} />
            </div>
          </section>
        ))}
      </div>
    </div>
  );
};
