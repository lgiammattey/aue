import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

export const TelaLogin: React.FC = () => {
  const navigate = useNavigate();
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [mode, setMode] = useState<'in' | 'up'>('in');
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [nick, setNick] = useState('');
  const [err, setErr] = useState('');

  useEffect(() => {
    try {
      const t = localStorage.getItem('bda-theme') as 'dark' | 'light' | null;
      if (t) setTheme(t);
    } catch {
      // Ignora erro
    }
  }, []);

  const enter = () => {
    navigate('/');
  };

  const submit = () => {
    if (!email.includes('@')) {
      setErr('E-mail inválido.');
      return;
    }
    if (pass.length < 6) {
      setErr('Senha com no mínimo 6 caracteres.');
      return;
    }
    if (mode === 'up' && !nick.trim()) {
      setErr('Escolhe um apelido.');
      return;
    }
    enter();
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
        '--danger': '#ef4444',
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
        '--danger': '#ef4444',
        colorScheme: 'dark',
      }) as any as React.CSSProperties;

  const isSignup = mode === 'up';
  const titulo = isSignup ? 'Entra pro bonde.' : 'Bora de novo?';
  const cta = isSignup ? 'Criar conta' : 'Entrar';

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
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        boxSizing: 'border-box',
      }}
    >
      <div style={{ width: '100%', maxWidth: 420, display: 'flex', flexDirection: 'column', gap: 24 }}>
        <Link
          to="/landing"
          style={{
            color: 'var(--fg)',
            fontFamily: 'var(--font-display, "Anton", sans-serif)',
            fontSize: 24,
            textDecoration: 'none',
            textAlign: 'center',
            letterSpacing: '.02em',
          }}
        >
          BONDE DO ARROTO
        </Link>

        <div
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 24,
            padding: 24,
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
            boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
          }}
        >
          {/* Abas Entrar / Criar Conta */}
          <div style={{ display: 'flex', borderBottom: '1px solid var(--border)' }}>
            <button
              onClick={() => {
                setMode('in');
                setErr('');
              }}
              style={{
                flex: 1,
                height: 44,
                background: 'none',
                border: 0,
                borderBottom: mode === 'in' ? '3px solid var(--accent)' : '3px solid transparent',
                color: mode === 'in' ? 'var(--fg)' : 'var(--muted)',
                fontWeight: mode === 'in' ? 700 : 500,
                fontSize: 15,
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              Entrar
            </button>
            <button
              onClick={() => {
                setMode('up');
                setErr('');
              }}
              style={{
                flex: 1,
                height: 44,
                background: 'none',
                border: 0,
                borderBottom: mode === 'up' ? '3px solid var(--accent)' : '3px solid transparent',
                color: mode === 'up' ? 'var(--fg)' : 'var(--muted)',
                fontWeight: mode === 'up' ? 700 : 500,
                fontSize: 15,
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              Criar conta
            </button>
          </div>

          <h1
            style={{
              fontFamily: 'var(--font-display, "Anton", sans-serif)',
              fontWeight: 400,
              fontSize: 32,
              margin: '4px 0 0',
              textTransform: 'uppercase',
              lineHeight: 1.1,
            }}
          >
            {titulo}
          </h1>

          <button
            onClick={enter}
            style={{
              height: 48,
              borderRadius: 999,
              border: '1px solid var(--border)',
              background: 'var(--bg)',
              color: 'var(--fg)',
              fontWeight: 600,
              fontSize: 15,
              cursor: 'pointer',
            }}
          >
            Continuar com Google
          </button>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              color: 'var(--muted)',
              fontSize: 13,
            }}
          >
            <span style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            ou
            <span style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          </div>

          {isSignup && (
            <input
              value={nick}
              onChange={(e) => setNick(e.target.value)}
              placeholder="Apelido (ex: @voce_arrota)"
              style={{
                height: 48,
                borderRadius: 12,
                border: '1px solid var(--border)',
                background: 'var(--bg)',
                color: 'var(--fg)',
                padding: '0 14px',
                fontSize: 15,
                fontFamily: 'inherit',
                outline: 'none',
              }}
            />
          )}

          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            placeholder="E-mail"
            style={{
              height: 48,
              borderRadius: 12,
              border: '1px solid var(--border)',
              background: 'var(--bg)',
              color: 'var(--fg)',
              padding: '0 14px',
              fontSize: 15,
              fontFamily: 'inherit',
              outline: 'none',
            }}
          />

          <input
            value={pass}
            onChange={(e) => setPass(e.target.value)}
            type="password"
            placeholder="Senha"
            style={{
              height: 48,
              borderRadius: 12,
              border: '1px solid var(--border)',
              background: 'var(--bg)',
              color: 'var(--fg)',
              padding: '0 14px',
              fontSize: 15,
              fontFamily: 'inherit',
              outline: 'none',
            }}
          />

          {err && <span style={{ color: 'var(--danger)', fontSize: 14 }}>{err}</span>}

          <button
            onClick={submit}
            style={{
              height: 56,
              border: 0,
              borderRadius: 18,
              background: 'var(--accent)',
              color: 'var(--accent-on)',
              fontWeight: 700,
              fontSize: 17,
              cursor: 'pointer',
            }}
          >
            {cta}
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center', textAlign: 'center' }}>
          <Link
            to="/arena"
            style={{
              color: 'var(--fg)',
              fontWeight: 600,
              fontSize: 16,
              textDecoration: 'none',
            }}
          >
            Pular por enquanto
          </Link>
          <span style={{ color: 'var(--muted)', fontSize: 14, maxWidth: '34ch' }}>
            Sem conta você arrota na Arena e vê o feed. Pra postar, entrar em bonde e salvar o placar, precisa de conta.
          </span>
        </div>
      </div>
    </div>
  );
};
