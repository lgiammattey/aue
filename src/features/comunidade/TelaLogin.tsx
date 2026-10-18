import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { configuracaoAusente, signInWithGoogle, supabase, updateProfile } from '../../db/supabase';
import { obterPerfilLocal, salvarPerfilLocal } from '../../plataforma/web/perfil';

export const TelaLogin: React.FC = () => {
  const navigate = useNavigate();
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [mode, setMode] = useState<'in' | 'up'>('in');
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [nick, setNick] = useState('');
  const [err, setErr] = useState('');
  const [carregando, setCarregando] = useState(false);

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

  const submit = async () => {
    setErr('');
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

    if (configuracaoAusente) {
      // Ambiente local sem supabase configurado: salva perfil local e prossegue
      const perfil = obterPerfilLocal();
      if (mode === 'up' && nick.trim()) {
        perfil.nome = nick.trim();
        perfil.handle = nick.trim().replace(/^@/, '').toLowerCase().replace(/\s+/g, '_');
        salvarPerfilLocal(perfil);
      }
      enter();
      return;
    }

    setCarregando(true);
    try {
      if (mode === 'in') {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: pass,
        });
        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            setErr('E-mail ou senha incorretos.');
          } else {
            setErr(error.message);
          }
          return;
        }
        if (data.user) {
          const p = obterPerfilLocal();
          p.id = data.user.id;
          salvarPerfilLocal(p);
          enter();
        }
      } else {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password: pass,
          options: {
            data: {
              apelido: nick.trim(),
            },
          },
        });
        if (error) {
          if (error.message.includes('already registered')) {
            setErr('Este e-mail já está cadastrado.');
          } else {
            setErr(error.message);
          }
          return;
        }
        if (data.user) {
          const perfil = obterPerfilLocal();
          perfil.id = data.user.id;
          perfil.nome = nick.trim();
          perfil.handle = nick.trim().replace(/^@/, '').toLowerCase().replace(/\s+/g, '_');
          salvarPerfilLocal(perfil);

          try {
            await updateProfile(data.user.id, { apelido: nick.trim() });
          } catch {
            // segue mesmo com erro no banco
          }
          enter();
        }
      }
    } catch (e: any) {
      setErr('Falha de conexão com o servidor. Tente de novo.');
    } finally {
      setCarregando(false);
    }
  };

  const handleGoogle = async () => {
    if (configuracaoAusente) {
      enter();
      return;
    }
    try {
      await signInWithGoogle();
    } catch {
      setErr('Não foi possível conectar com o Google.');
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
        '--accent': '#c6ff00',
        '--accent-on': '#000000',
        '--accent-strong': '#b8f000',
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
            textDecoration: 'none',
            fontFamily: 'var(--font-display, "Anton", sans-serif)',
            fontSize: 34,
            lineHeight: 1,
            background: 'var(--accent)',
            color: 'var(--accent-on)',
            padding: '6px 14px',
            borderRadius: 10,
            alignSelf: 'center',
            display: 'inline-block',
            letterSpacing: '.02em',
          }}
        >
          Auê!
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
              aria-label="Aba Entrar"
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
              aria-label="Aba Criar conta"
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
            onClick={handleGoogle}
            type="button"
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
            type="button"
            disabled={carregando}
            style={{
              height: 56,
              border: 0,
              borderRadius: 18,
              background: carregando ? 'var(--muted)' : 'var(--accent)',
              color: 'var(--accent-on)',
              fontWeight: 700,
              fontSize: 17,
              cursor: carregando ? 'not-allowed' : 'pointer',
            }}
          >
            {carregando ? 'Entrando...' : cta}
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center', textAlign: 'center' }}>
          <span style={{ color: 'var(--muted)', fontSize: 14, maxWidth: '34ch', lineHeight: 1.45 }}>
            Não quer conta agora?{' '}
            <Link
              to="/arena"
              style={{
                color: 'var(--fg)',
                fontWeight: 600,
                textDecoration: 'underline',
              }}
            >
              Arrota como convidado
            </Link>
            . Pra postar e salvar o placar, precisa de conta.
          </span>
        </div>
      </div>
    </div>
  );
};
