import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../db/supabase';
import { criarContaWeb } from '../../plataforma/web/conta';
import { SENHA_MINIMA, type PortaDeConta } from '../../portas/conta';

interface TelaRedefinirSenhaProps {
  portaConta?: PortaDeConta;
  /** Teste: pula a espera pelo evento de recuperação do link. */
  linkValidoDeCara?: boolean;
}

/**
 * Destino do link "esqueci minha senha". O Supabase abre esta rota com uma
 * sessão de recuperação; sem ela, trocar a senha não é permitido e a tela diz.
 */
export const TelaRedefinirSenha: React.FC<TelaRedefinirSenhaProps> = ({ portaConta, linkValidoDeCara }) => {
  const navigate = useNavigate();
  const [conta] = useState<PortaDeConta>(() => portaConta ?? criarContaWeb());
  const [pronto, setPronto] = useState(Boolean(linkValidoDeCara));
  const [venceu, setVenceu] = useState(false);
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [feito, setFeito] = useState(false);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (linkValidoDeCara) return;
    const { data } = supabase.auth.onAuthStateChange((evento) => {
      if (evento === 'PASSWORD_RECOVERY') setPronto(true);
    });
    const espera = setTimeout(() => setVenceu(true), 4000);
    return () => {
      data.subscription.unsubscribe();
      clearTimeout(espera);
    };
  }, [linkValidoDeCara]);

  const salvar = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    if (senha.length < SENHA_MINIMA) {
      setErro(`Senha com no mínimo ${SENHA_MINIMA} caracteres.`);
      return;
    }
    setEnviando(true);
    const r = await conta.redefinirSenha(senha);
    setEnviando(false);
    if (!r.ok) {
      setErro(r.motivo === 'senhaFraca' ? 'Essa senha é fraca demais. Tenta outra.' : 'Não deu para trocar agora. Pede outro link.');
      return;
    }
    setFeito(true);
    setTimeout(() => navigate('/'), 1500);
  };

  return (
    <main
      style={{
        minHeight: '100svh',
        background: 'var(--bg, #000)',
        color: 'var(--fg, #fff)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        boxSizing: 'border-box',
      }}
    >
      <div style={{ width: '100%', maxWidth: 420, display: 'grid', gap: 16 }}>
        <h1 style={{ fontFamily: 'var(--font-display, "Anton", sans-serif)', fontWeight: 400, fontSize: 32, margin: 0, textTransform: 'uppercase' }}>
          Nova senha
        </h1>

        {feito && <p role="status">Senha trocada. Te levando de volta pro jogo.</p>}

        {!feito && !pronto && !venceu && <p role="status">Conferindo o link…</p>}

        {!feito && !pronto && venceu && (
          <p role="alert">
            Esse link não vale mais ou já foi usado. <Link to="/login" style={{ color: 'inherit' }}>Pede outro na tela de entrar</Link>.
          </p>
        )}

        {!feito && pronto && (
          <form onSubmit={salvar} style={{ display: 'grid', gap: 12 }}>
            <input
              type="password"
              autoComplete="new-password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="Nova senha"
              aria-label="Nova senha"
              style={{ height: 48, borderRadius: 12, border: '1px solid var(--border-strong, #3a3a3c)', background: 'var(--bg, #000)', color: 'var(--fg, #fff)', padding: '0 14px', fontSize: 16 }}
            />
            {erro && <span role="alert" style={{ color: 'var(--danger, #ef4444)', fontSize: 14 }}>{erro}</span>}
            <button
              type="submit"
              disabled={enviando}
              style={{ height: 52, border: 0, borderRadius: 16, background: 'var(--accent, #c6ff00)', color: 'var(--accent-on, #000)', fontWeight: 700, fontSize: 16, cursor: 'pointer' }}
            >
              {enviando ? 'Salvando…' : 'Salvar senha'}
            </button>
          </form>
        )}
      </div>
    </main>
  );
};
