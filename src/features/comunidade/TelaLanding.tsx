import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

export const TelaLanding: React.FC = () => {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    try {
      const t = localStorage.getItem('bda-theme') as 'dark' | 'light' | null;
      if (t) setTheme(t);
    } catch {
      // Ignora erro de acesso a storage
    }
  }, []);

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    try {
      localStorage.setItem('bda-theme', next);
    } catch {
      // Ignora
    }
  };

  const light = theme === 'light';
  const vars: React.CSSProperties = (light
    ? {
        '--bg': '#f5f3ea',
        '--surface': '#ebe9de',
        '--surface-2': '#dedcd0',
        '--fg': '#0a0a08',
        '--muted': '#6b6957',
        '--border': '#d6d4c6',
        '--accent': 'var(--cor-acento, #e63946)',
        '--accent-on': '#ffffff',
        '--accent-strong': '#d62839',
        colorScheme: 'light',
      }
    : {
        '--bg': '#0a0a08',
        '--surface': '#141410',
        '--surface-2': '#1e1e18',
        '--fg': '#f5f3ea',
        '--muted': '#9e9c8d',
        '--border': '#2a2a22',
        '--accent': 'var(--cor-acento, #e63946)',
        '--accent-on': '#ffffff',
        '--accent-strong': '#ff4d5e',
        colorScheme: 'dark',
      }) as any as React.CSSProperties;

  const steps = [
    { n: '01', t: 'Arrota', d: 'Aperta o botão, solta o gás. Até 15 segundos de áudio.' },
    { n: '02', t: 'Recebe a nota', d: 'De 0 a 100, com força, fôlego e grave. Sem dó.' },
    { n: '03', t: 'Chama pro X1', d: 'Manda o link pro infeliz. Quem arrotar mais forte leva o round.' },
  ];

  const bondes = [
    { ini: 'BG', name: 'Bonde Geral', desc: 'A praça central.', n: '48,2 mil' },
    { ini: 'CG', name: 'Cerveja Gelada', desc: 'Long neck, chope e lata.', n: '12,9 mil' },
    { ini: 'HA', name: 'Histórias de Arroto', desc: 'Casos, vexames e lendas.', n: '21,7 mil' },
    { ini: 'RC', name: 'Refri & Cia', desc: 'Gás de refrigerante. Grave é lei.', n: '9,4 mil' },
  ];

  const shares = [
    { t: 'Card 9:16', d: 'Nota, fala e link do X1 prontos pra Stories e WhatsApp.' },
    { t: 'Vídeo pro TikTok', d: 'O arroto vira vídeo vertical com a nota estourando na tela.' },
    { t: 'Link de X1', d: 'Quem recebe abre, arrota e o placar aparece pros dois.' },
  ];

  const themeIconPath = light
    ? 'M21 13A9 9 0 1111 3a7 7 0 0010 10z'
    : 'M12 17a5 5 0 100-10 5 5 0 000 10zM12 1v3M12 20v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M1 12h3M20 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1';

  return (
    <div
      style={{
        ...vars,
        width: '100%',
        background: 'var(--bg)',
        color: 'var(--fg)',
        fontFamily: 'var(--font-body, "Archivo", sans-serif)',
        minHeight: '100vh',
      }}
    >
      <div style={{ maxWidth: 1120, margin: '0 auto', padding: '0 24px', boxSizing: 'border-box' }}>
        {/* Topo / Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            height: 72,
            borderBottom: '1px solid var(--border)',
            gap: 16,
          }}
        >
          <Link
            to="/"
            style={{
              fontFamily: 'var(--font-display, "Anton", sans-serif)',
              fontSize: 24,
              letterSpacing: '.02em',
              color: 'var(--fg)',
              textDecoration: 'none',
            }}
          >
            BONDE DO ARROTO
          </Link>
          <nav
            style={{
              display: 'flex',
              gap: 28,
              fontSize: 15,
            }}
          >
            <a href="#como" style={{ color: 'var(--muted)', textDecoration: 'none' }}>
              Como funciona
            </a>
            <a href="#bondes" style={{ color: 'var(--muted)', textDecoration: 'none' }}>
              Bondes
            </a>
            <a href="#compartilhe" style={{ color: 'var(--muted)', textDecoration: 'none' }}>
              Compartilhe
            </a>
          </nav>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              onClick={toggleTheme}
              aria-label="Alternar tema"
              style={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                border: '1px solid var(--border)',
                background: 'none',
                color: 'var(--fg)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d={themeIconPath} />
              </svg>
            </button>
            <Link
              to="/login"
              style={{
                color: 'var(--fg)',
                height: 40,
                padding: '0 18px',
                borderRadius: 999,
                border: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                fontWeight: 600,
                fontSize: 15,
                textDecoration: 'none',
              }}
            >
              Entrar
            </Link>
          </div>
        </div>

        {/* Hero Section */}
        <section style={{ padding: '80px 0 72px' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: 56,
              alignItems: 'center',
            }}
          >
            <div>
              <span
                style={{
                  fontFamily: 'ui-monospace, monospace',
                  fontSize: 12,
                  letterSpacing: '.14em',
                  textTransform: 'uppercase',
                  color: 'var(--muted)',
                }}
              >
                A rede social do arroto
              </span>
              <h1
                style={{
                  fontFamily: 'var(--font-display, "Anton", sans-serif)',
                  fontWeight: 400,
                  fontSize: 'clamp(46px, 8vw, 88px)',
                  lineHeight: 1,
                  textTransform: 'uppercase',
                  margin: '16px 0 24px',
                }}
              >
                Arrota.
                <br />
                Conta o caso.
                <br />
                Chama pro{' '}
                <span
                  style={{
                    background: 'var(--accent)',
                    color: 'var(--accent-on)',
                    padding: '0 14px',
                    borderRadius: 12,
                    display: 'inline-block',
                  }}
                >
                  X1.
                </span>
              </h1>
              <p
                style={{
                  color: 'var(--muted)',
                  fontSize: 18,
                  lineHeight: 1.5,
                  maxWidth: '46ch',
                  margin: '0 0 32px',
                }}
              >
                Posta áudio, conta história, entra num bonde e desafia quem duvida. Tudo vira card pra mandar no zap e vídeo pro TikTok.
              </p>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <Link
                  to="/"
                  style={{
                    height: 56,
                    padding: '0 28px',
                    borderRadius: 18,
                    background: 'var(--accent)',
                    color: 'var(--accent-on)',
                    display: 'flex',
                    alignItems: 'center',
                    fontWeight: 700,
                    fontSize: 17,
                    textDecoration: 'none',
                  }}
                >
                  Entrar no bonde
                </Link>
                <Link
                  to="/arena"
                  style={{
                    color: 'var(--fg)',
                    height: 56,
                    padding: '0 28px',
                    borderRadius: 18,
                    border: '1px solid var(--border)',
                    display: 'flex',
                    alignItems: 'center',
                    fontWeight: 600,
                    fontSize: 17,
                    textDecoration: 'none',
                  }}
                >
                  Arrotar agora, sem conta
                </Link>
              </div>
            </div>

            {/* Card Vertical 9:16 Preview */}
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <div
                style={{
                  width: 260,
                  aspectRatio: '9/16',
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 32,
                  padding: 20,
                  boxSizing: 'border-box',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: '0 12px 36px rgba(0,0,0,0.25)',
                }}
              >
                <span
                  style={{
                    fontFamily: 'var(--font-display, "Anton", sans-serif)',
                    fontSize: 14,
                    color: 'var(--muted)',
                    letterSpacing: '.04em',
                  }}
                >
                  BONDE DO ARROTO
                </span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <span style={{ fontSize: 13, color: 'var(--muted)' }}>@danigas · Cerveja Gelada</span>
                  <span
                    style={{
                      fontFamily: 'var(--font-display, "Anton", sans-serif)',
                      fontSize: 96,
                      lineHeight: 1,
                      background: 'var(--accent)',
                      color: 'var(--accent-on)',
                      alignSelf: 'flex-start',
                      padding: '4px 16px',
                      borderRadius: 16,
                    }}
                  >
                    94
                  </span>
                  <span
                    style={{
                      fontFamily: 'var(--font-display, "Anton", sans-serif)',
                      fontSize: 28,
                      lineHeight: 1.1,
                      textTransform: 'uppercase',
                    }}
                  >
                    Tá maluco. Bate esse.
                  </span>
                </div>
                <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: 11, color: 'var(--muted)' }}>
                  bondedoarroto.app/x1/k4x9
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Seção Como Funciona */}
        <section id="como" style={{ padding: '64px 0', borderTop: '1px solid var(--border)' }}>
          <span
            style={{
              fontFamily: 'ui-monospace, monospace',
              fontSize: 12,
              letterSpacing: '.14em',
              textTransform: 'uppercase',
              color: 'var(--muted)',
            }}
          >
            Como funciona
          </span>
          <h2
            style={{
              fontFamily: 'var(--font-display, "Anton", sans-serif)',
              fontWeight: 400,
              fontSize: 'clamp(32px, 5vw, 52px)',
              textTransform: 'uppercase',
              margin: '12px 0 40px',
              lineHeight: 1.05,
            }}
          >
            Três passos. Nenhum é simples.
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 32 }}>
            {steps.map((s) => (
              <div
                key={s.n}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                  borderTop: '1px solid var(--fg)',
                  paddingTop: 16,
                }}
              >
                <span
                  style={{
                    fontFamily: 'var(--font-display, "Anton", sans-serif)',
                    fontSize: 40,
                    color: 'var(--muted)',
                  }}
                >
                  {s.n}
                </span>
                <b style={{ fontSize: 22 }}>{s.t}</b>
                <span style={{ color: 'var(--muted)', fontSize: 16, lineHeight: 1.5 }}>{s.d}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Seção Comunidades / Bondes */}
        <section id="bondes" style={{ padding: '64px 0', borderTop: '1px solid var(--border)' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: 56,
              alignItems: 'start',
            }}
          >
            <div>
              <span
                style={{
                  fontFamily: 'ui-monospace, monospace',
                  fontSize: 12,
                  letterSpacing: '.14em',
                  textTransform: 'uppercase',
                  color: 'var(--muted)',
                }}
              >
                Comunidades
              </span>
              <h2
                style={{
                  fontFamily: 'var(--font-display, "Anton", sans-serif)',
                  fontWeight: 400,
                  fontSize: 'clamp(32px, 5vw, 52px)',
                  textTransform: 'uppercase',
                  margin: '12px 0 16px',
                  lineHeight: 1.05,
                }}
              >
                Acha seu bonde.
              </h2>
              <p style={{ color: 'var(--muted)', fontSize: 17, lineHeight: 1.5, maxWidth: '40ch', margin: 0 }}>
                Cada bonde tem seu tipo de gás, suas lendas e seu ranking.
              </p>
            </div>
            <div style={{ border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
              {bondes.map((b) => (
                <div
                  key={b.name}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 16,
                    padding: '16px 20px',
                    borderBottom: '1px solid var(--border)',
                  }}
                >
                  <span
                    style={{
                      width: 48,
                      height: 48,
                      flex: 'none',
                      borderRadius: 12,
                      background: 'var(--surface-2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontFamily: 'var(--font-display, "Anton", sans-serif)',
                      fontSize: 20,
                    }}
                  >
                    {b.ini}
                  </span>
                  <span style={{ flex: 1, lineHeight: 1.35 }}>
                    <b style={{ fontSize: 17 }}>{b.name}</b>
                    <br />
                    <span style={{ color: 'var(--muted)', fontSize: 14 }}>{b.desc}</span>
                  </span>
                  <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: 12, color: 'var(--muted)' }}>
                    {b.n}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Seção Compartilhe */}
        <section id="compartilhe" style={{ padding: '64px 0', borderTop: '1px solid var(--border)' }}>
          <span
            style={{
              fontFamily: 'ui-monospace, monospace',
              fontSize: 12,
              letterSpacing: '.14em',
              textTransform: 'uppercase',
              color: 'var(--muted)',
            }}
          >
            Compartilhe
          </span>
          <h2
            style={{
              fontFamily: 'var(--font-display, "Anton", sans-serif)',
              fontWeight: 400,
              fontSize: 'clamp(32px, 5vw, 52px)',
              textTransform: 'uppercase',
              margin: '12px 0 40px',
              lineHeight: 1.05,
            }}
          >
            Todo arroto vira desafio.
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
            {shares.map((s) => (
              <div
                key={s.t}
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 16,
                  padding: 24,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                  minHeight: 180,
                  justifyContent: 'flex-end',
                }}
              >
                <b style={{ fontSize: 20 }}>{s.t}</b>
                <span style={{ color: 'var(--muted)', fontSize: 15, lineHeight: 1.5 }}>{s.d}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Seção Revanche CTA */}
        <section
          style={{
            padding: '80px 0',
            borderTop: '1px solid var(--border)',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 24,
          }}
        >
          <h2
            style={{
              fontFamily: 'var(--font-display, "Anton", sans-serif)',
              fontWeight: 400,
              fontSize: 'clamp(40px, 7vw, 72px)',
              textTransform: 'uppercase',
              margin: 0,
              lineHeight: 1.02,
            }}
          >
            Perdeu? Revanche.
          </h2>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
            <Link
              to="/"
              style={{
                height: 56,
                padding: '0 28px',
                borderRadius: 18,
                background: 'var(--accent)',
                color: 'var(--accent-on)',
                display: 'flex',
                alignItems: 'center',
                fontWeight: 700,
                fontSize: 17,
                textDecoration: 'none',
              }}
            >
              Abrir o app
            </Link>
            <Link
              to="/login"
              style={{
                color: 'var(--fg)',
                height: 56,
                padding: '0 28px',
                borderRadius: 18,
                border: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                fontWeight: 600,
                fontSize: 17,
                textDecoration: 'none',
              }}
            >
              Criar conta
            </Link>
          </div>
        </section>

        {/* Rodapé */}
        <footer
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12,
            padding: '24px 0 40px',
            borderTop: '1px solid var(--border)',
            color: 'var(--muted)',
            fontSize: 14,
          }}
        >
          <span style={{ fontFamily: 'var(--font-display, "Anton", sans-serif)', fontSize: 16, color: 'var(--fg)' }}>
            BONDE DO ARROTO
          </span>
          <span>A piada é com o arroto, nunca com a pessoa.</span>
        </footer>
      </div>
    </div>
  );
};
