import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../db/supabase';
import { criarContaWeb } from '../../plataforma/web/conta';
import { SENHA_MINIMA, type PortaDeConta } from '../../portas/conta';
import '../novo-aue/authArena.css';

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
    <main className="auth-arena-reset">
      <div className="auth-shell">
        <header className="auth-header">
          <Link to="/" className="auth-brand" aria-label="Auê, página inicial">AUÊ<span>!</span></Link>
          <nav aria-label="Navegação principal"><Link to="/">Início</Link><Link to="/ranking-de-arrotos">Ranking</Link><Link to="/grupos">Grupos</Link></nav>
        </header>
        <div className="auth-arena__conteudo">
          <div className="auth-arena__manifesto" aria-hidden="true"><p>SEM FRESCURA</p><div>ARROTA.<br />PONTUA.<br />COBRA X1.</div></div>
          <div className="auth-arena__form">
            <h1>Nova senha</h1>
            {feito && <p role="status">Senha trocada. Voltando pro Auê.</p>}
            {!feito && !pronto && !venceu && <p role="status">Conferindo o link…</p>}
            {!feito && !pronto && venceu && (
              <p role="alert">Esse link não vale mais ou já foi usado. <Link to="/login">Pede outro na tela de entrar</Link>.</p>
            )}
            {!feito && pronto && (
              <form onSubmit={salvar}>
                <input type="password" autoComplete="new-password" value={senha} onChange={(e) => setSenha(e.target.value)} placeholder="Nova senha" aria-label="Nova senha" />
                {erro && <span role="alert" className="auth-arena__erro">{erro}</span>}
                <button type="submit" className="auth-arena__submit" disabled={enviando}>{enviando ? 'Salvando…' : 'Salvar senha'}</button>
              </form>
            )}
          </div>
        </div>
      </div>
    </main>
  );
};
