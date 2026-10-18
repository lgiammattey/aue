import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { signInWithGoogle } from '../../db/supabase';

/**
 * TelaLanding Canônica do Auê!
 *
 * Fiel 1:1 ao protótipo `docs/design/prototipo/Landing.dc.html`.
 * Layout Split-screen 50/50 no desktop e empilhado no mobile.
 * Orçamento estrito de `--accent: #c6ff00` (verde elétrico) no dark.
 */
interface TelaLandingProps {
  onEntrarSemConta?: () => void;
  onArrotar?: () => void;
}

export const TelaLanding: React.FC<TelaLandingProps> = ({
  onEntrarSemConta,
  onArrotar,
}) => {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    try {
      const t = localStorage.getItem('bda-theme') as 'dark' | 'light' | null;
      if (t) {
        setTheme(t);
        document.documentElement.setAttribute('data-theme', t);
      }
    } catch {
      // Ignora erro de acesso a storage
    }
  }, []);

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    try {
      localStorage.setItem('bda-theme', next);
      document.documentElement.setAttribute('data-theme', next);
    } catch {
      // Ignora
    }
  };

  const light = theme === 'light';
  const vars: React.CSSProperties = (light
    ? {
        '--bg': '#ffffff',
        '--surface': '#f7f7f8',
        '--surface-2': '#ededf0',
        '--fg': '#000000',
        '--muted': '#666666',
        '--border': '#e5e5e8',
        '--border-strong': '#888888',
        '--ind': '#000000',
        '--accent': '#000000',
        '--accent-on': '#ffffff',
        '--accent-strong': '#24231f',
        '--danger': '#c4161a',
        colorScheme: 'light',
      }
    : {
        '--bg': '#000000',
        '--surface': '#121212',
        '--surface-2': '#1c1c1e',
        '--fg': '#ffffff',
        '--muted': '#8e8e93',
        '--border': '#222222',
        '--border-strong': '#3a3a3c',
        '--ind': '#c6ff00',
        '--accent': '#c6ff00',
        '--accent-on': '#000000',
        '--accent-strong': '#b8f000',
        '--danger': '#ef4444',
        colorScheme: 'dark',
      }) as unknown as React.CSSProperties;

  const handleGoogleLogin = async () => {
    try {
      await signInWithGoogle();
    } catch {
      // Fallback para login regular
      window.location.href = '/login';
    }
  };

  return (
    <div
      style={{
        ...vars,
        width: '100%',
        minHeight: '100vh',
        background: 'var(--bg)',
        color: 'var(--fg)',
        fontFamily: 'var(--font-body, "Archivo", sans-serif)',
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box',
      }}
    >
      {/* Corpo Split Screen */}
      <div
        style={{
          flex: '1 0 auto',
          display: 'flex',
          flexWrap: 'wrap',
          minHeight: 'calc(100vh - 60px)',
          width: '100%',
        }}
      >
        {/* Lado Esquerdo: Wordmark monumental AUÊ! */}
        <div
          style={{
            flex: '1 1 50%',
            minWidth: '320px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '32px',
            boxSizing: 'border-box',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '520px' }}>
            <span
              style={{
                fontFamily: 'var(--font-display, "Anton", sans-serif)',
                fontSize: 'clamp(110px, 22vw, 280px)',
                lineHeight: 0.9,
                textTransform: 'uppercase',
                letterSpacing: '.02em',
                userSelect: 'none',
              }}
            >
              <span
                style={{
                  background: 'var(--accent)',
                  color: 'var(--accent-on)',
                  padding: '0 .12em',
                  borderRadius: '.1em',
                  display: 'inline-block',
                }}
              >
                Auê!
              </span>
            </span>
          </div>
        </div>

        {/* Lado Direito: Formulário e Ações de Entrada */}
        <div
          style={{
            flex: '1 1 50%',
            minWidth: '320px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            padding: '32px 48px',
            boxSizing: 'border-box',
          }}
        >
          <h1
            style={{
              fontFamily: 'var(--font-body, "Archivo", sans-serif)',
              fontWeight: 800,
              fontSize: 'clamp(38px, 5.5vw, 64px)',
              lineHeight: 1.05,
              letterSpacing: '-.02em',
              margin: '0 0 32px',
            }}
          >
            Tá rolando agora
          </h1>

          <h2
            style={{
              fontFamily: 'var(--font-body, "Archivo", sans-serif)',
              fontWeight: 800,
              fontSize: 'clamp(22px, 3vw, 31px)',
              lineHeight: 1.15,
              margin: '0 0 24px',
            }}
          >
            Entra no bonde hoje.
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '320px', width: '100%' }}>
            {/* Continuar com Google */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              style={{
                height: '42px',
                borderRadius: '999px',
                border: 0,
                background: 'var(--fg)',
                color: 'var(--bg)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 600,
                fontSize: '15px',
                cursor: 'pointer',
                textDecoration: 'none',
                boxSizing: 'border-box',
              }}
            >
              Continuar com Google
            </button>

            {/* Divisor "ou" */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: 'var(--muted)',
                fontSize: '14px',
                margin: '4px 0',
              }}
            >
              <span style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
              ou
              <span style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
            </div>

            {/* Criar conta */}
            <Link
              to="/login?mode=up"
              style={{
                height: '42px',
                borderRadius: '999px',
                background: 'var(--accent)',
                color: 'var(--accent-on)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '15px',
                textDecoration: 'none',
                boxSizing: 'border-box',
              }}
            >
              Criar conta
            </Link>

            <span
              style={{
                color: 'var(--muted)',
                fontSize: '12px',
                lineHeight: 1.45,
                marginTop: '4px',
              }}
            >
              Ao se cadastrar, você aceita os Termos e a Política de Privacidade. A piada é com o arroto, nunca com a pessoa.
            </span>
          </div>

          {/* Já tem conta e Convidado */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              maxWidth: '320px',
              width: '100%',
              marginTop: '40px',
            }}
          >
            <span style={{ fontWeight: 700, fontSize: '17px' }}>Já tem uma conta?</span>

            <Link
              to="/login"
              style={{
                height: '42px',
                borderRadius: '999px',
                border: '1px solid var(--border-strong)',
                background: 'transparent',
                color: 'var(--fg)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '15px',
                textDecoration: 'none',
                boxSizing: 'border-box',
              }}
            >
              Entrar
            </Link>

            {/* O escape sagrado do arrotador */}
            <Link
              to="/arena"
              onClick={() => {
                try { localStorage.setItem('aue.visitou', 'true'); } catch {}
                if (onArrotar) onArrotar();
              }}
              style={{
                height: '42px',
                borderRadius: '999px',
                border: '1px solid var(--border-strong)',
                background: 'var(--surface)',
                color: 'var(--fg)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '15px',
                textDecoration: 'none',
                boxSizing: 'border-box',
              }}
            >
              Arrotar sem conta
            </Link>

            <Link
              to="/feed"
              onClick={() => {
                try { localStorage.setItem('aue.visitou', 'true'); } catch {}
                if (onEntrarSemConta) onEntrarSemConta();
              }}
              style={{
                height: '42px',
                borderRadius: '999px',
                border: '1px solid var(--border)',
                background: 'transparent',
                color: 'var(--fg)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 600,
                fontSize: '14px',
                textDecoration: 'none',
                boxSizing: 'border-box',
              }}
            >
              Explorar o feed sem conta
            </Link>
          </div>
        </div>
      </div>

      {/* Rodapé Canônico */}
      <footer
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '8px 20px',
          padding: '16px 24px',
          color: 'var(--muted)',
          fontSize: '13px',
          borderTop: '1px solid var(--border)',
        }}
      >
        <Link to="/como-jogar" style={{ color: 'var(--muted)', textDecoration: 'none' }}>
          Como funciona
        </Link>
        <Link to="/bondes" style={{ color: 'var(--muted)', textDecoration: 'none' }}>
          Comunidades
        </Link>
        <Link to="/termos" style={{ color: 'var(--muted)', textDecoration: 'none' }}>
          Termos
        </Link>
        <Link to="/privacidade" style={{ color: 'var(--muted)', textDecoration: 'none' }}>
          Privacidade
        </Link>
        <button
          type="button"
          onClick={toggleTheme}
          style={{
            border: 0,
            background: 'none',
            color: 'var(--muted)',
            fontSize: '13px',
            cursor: 'pointer',
            padding: 0,
            fontFamily: 'inherit',
          }}
        >
          {light ? 'Tema escuro' : 'Tema claro'}
        </button>
        <span>© 2026 Auê!</span>
      </footer>
    </div>
  );
};
