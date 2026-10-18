import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { signInWithGoogle } from '../../db/supabase';
import { FLAGS } from '../../shared/flags';
import { criarContaWeb } from '../../plataforma/web/conta';
import { criarPerfilRemoto } from '../../plataforma/web/perfilRemoto';
import { obterPerfilLocal, salvarPerfilLocal } from '../../plataforma/web/perfil';
import { emailParece, SENHA_MINIMA, type PortaDeConta, type ResultadoDaConta } from '../../portas/conta';

const MENSAGENS: Record<string, string> = {
  emailInvalido: 'E-mail inválido.',
  senhaFraca: `Senha com no mínimo ${SENHA_MINIMA} caracteres.`,
  emailEmUso: 'Este e-mail já está cadastrado. Entra com ele.',
  credenciaisInvalidas: 'E-mail ou senha incorretos.',
  semServidor: 'Sem conexão com o servidor do Auê. Tenta de novo daqui a pouco.',
};

function mensagemDe(r: Extract<ResultadoDaConta, { ok: false }>): string {
  return r.motivo === 'falhou' ? 'Não deu certo agora. Tenta de novo.' : MENSAGENS[r.motivo];
}

interface TelaLoginProps {
  portaConta?: PortaDeConta;
}

export const TelaLogin: React.FC<TelaLoginProps> = ({ portaConta }) => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [conta] = useState<PortaDeConta>(() => portaConta ?? criarContaWeb());
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [mode, setMode] = useState<'in' | 'up'>(params.get('modo') === 'cadastro' ? 'up' : 'in');
  const [esqueci, setEsqueci] = useState(false);
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [nick, setNick] = useState('');
  const [err, setErr] = useState('');
  const [info, setInfo] = useState('');
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

  // Alinha o perfil guardado no aparelho com o do servidor, para o nome certo
  // aparecer no composer logo depois de entrar.
  const sincronizarPerfilLocal = async () => {
    try {
      const meu = await criarPerfilRemoto().obterMeuPerfil();
      if (!meu) return;
      const local = obterPerfilLocal();
      salvarPerfilLocal({ ...local, id: meu.id, nome: meu.apelido, handle: meu.handle });
    } catch {
      // o servidor é a fonte de verdade; o espelho local pode esperar
    }
  };

  const submit = async () => {
    setErr('');
    setInfo('');

    if (esqueci) {
      if (!emailParece(email)) return setErr(MENSAGENS.emailInvalido);
      setCarregando(true);
      const r = await conta.enviarLinkDeRedefinicao(email);
      setCarregando(false);
      if (!r.ok) return setErr(mensagemDe(r));
      return setInfo('Se esse e-mail tiver conta, o link de nova senha já está a caminho. Olha também o spam.');
    }

    if (!emailParece(email)) return setErr(MENSAGENS.emailInvalido);
    if (pass.length < SENHA_MINIMA) return setErr(MENSAGENS.senhaFraca);
    if (mode === 'up' && nick.trim().replace(/^@/, '').length < 2) return setErr('Escolhe um apelido.');

    setCarregando(true);
    try {
      if (mode === 'in') {
        const r = await conta.entrar(email, pass);
        if (!r.ok) return setErr(mensagemDe(r));
        await sincronizarPerfilLocal();
        enter();
        return;
      }

      const r = await conta.cadastrar({ email, senha: pass, apelido: nick.trim().replace(/^@/, '') });
      if (!r.ok) return setErr(mensagemDe(r));
      if (r.aviso === 'confirmeNoEmail') {
        return setInfo(
          `Mandamos um link para ${email.trim()}. Abre e confirma: é isso que prende a conta ao seu e-mail. Seus arrotos e causos continuam seus.`,
        );
      }
      await sincronizarPerfilLocal();
      enter();
    } finally {
      setCarregando(false);
    }
  };

  const handleGoogle = async () => {
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
  const titulo = esqueci ? 'Esqueceu a senha?' : isSignup ? 'Entra pro bonde.' : 'Bora de novo?';
  const cta = esqueci ? 'Mandar o link' : isSignup ? 'Criar conta' : 'Entrar';

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
                setEsqueci(false);
                setErr('');
                setInfo('');
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
                setEsqueci(false);
                setErr('');
                setInfo('');
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

          {FLAGS.loginSocial && (
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
          )}

          {FLAGS.loginSocial && (
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
          )}

          {isSignup && !esqueci && (
            <input
              value={nick}
              onChange={(e) => setNick(e.target.value)}
              placeholder="Apelido (ex: @voce_arrota)"
              aria-label="Apelido"
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
            autoComplete="email"
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

          {!esqueci && (
          <input
            value={pass}
            onChange={(e) => setPass(e.target.value)}
            type="password"
            autoComplete={isSignup ? 'new-password' : 'current-password'}
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
          )}

          {err && (
            <span role="alert" style={{ color: 'var(--danger)', fontSize: 14 }}>
              {err}
            </span>
          )}
          {info && (
            <span role="status" style={{ color: 'var(--fg)', fontSize: 14, lineHeight: 1.4 }}>
              {info}
            </span>
          )}
          {!esqueci && mode === 'in' && (
            <button
              type="button"
              onClick={() => {
                setEsqueci(true);
                setErr('');
                setInfo('');
              }}
              style={{ background: 'none', border: 0, color: 'var(--muted)', textDecoration: 'underline', cursor: 'pointer', minHeight: 44, fontSize: 14, fontFamily: 'inherit' }}
            >
              Esqueci minha senha
            </button>
          )}
          {esqueci && (
            <button
              type="button"
              onClick={() => {
                setEsqueci(false);
                setErr('');
                setInfo('');
              }}
              style={{ background: 'none', border: 0, color: 'var(--muted)', textDecoration: 'underline', cursor: 'pointer', minHeight: 44, fontSize: 14, fontFamily: 'inherit' }}
            >
              Voltar pro login
            </button>
          )}

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
            {carregando ? 'Um instante…' : cta}
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
            . Sem conta, seus causos ficam só neste navegador.
          </span>
        </div>
      </div>
    </div>
  );
};
