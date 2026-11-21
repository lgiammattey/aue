import React, { useState } from 'react';
import { Link } from 'react-router-dom';

import '../../shared/publico/tema-claro.css';
import './TelaLogin.css';
import { useEntrarNaConta } from './useEntrarNaConta';
import { emailParece, type PortaDeConta } from '../../portas/conta';

/**
 * O `/login`, no cartão estilo Google de `docs/design/prototipo/Login.dc.html`.
 *
 * Só entra quem já tem conta. Criar conta, convite e Google não existem aqui:
 * o convite ainda não tem backend, e o botão que não funciona fica desabilitado
 * em vez de fingir. A entrada é em dois passos (e-mail, depois senha).
 */
interface TelaLoginProps {
  portaConta?: PortaDeConta;
}

type Passo = 'email' | 'senha' | 'esqueci';

const TITULOS: Record<Passo, string> = {
  email: 'Fazer login',
  senha: 'Olá',
  esqueci: 'Esqueceu a senha?',
};

export const TelaLogin: React.FC<TelaLoginProps> = ({ portaConta }) => {
  const { erro, info, carregando, entrar, mandarLinkDeSenha, limpar, setErro } = useEntrarNaConta(portaConta);
  const [passo, setPasso] = useState<Passo>('email');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [mostrar, setMostrar] = useState(false);

  const voltarAoEmail = () => {
    setPasso('email');
    setSenha('');
    limpar();
  };

  const avancar = () => {
    if (carregando) return;
    if (passo === 'email') {
      if (!emailParece(email)) return setErro('E-mail inválido.');
      limpar();
      setPasso('senha');
      return;
    }
    if (passo === 'esqueci') {
      void mandarLinkDeSenha(email);
      return;
    }
    void entrar(email, senha);
  };

  const enviar = (e: React.FormEvent) => {
    e.preventDefault();
    avancar();
  };

  return (
    <div className="publico-site login">
      <div className="login-centro">
        <div className="login-cartao">
          <Link className="publico-marca" to="/" aria-label="Auê! início">
            auê<span>!</span>
          </Link>
          <h1>{TITULOS[passo]}</h1>
          {passo === 'senha' ? (
            <button type="button" className="login-chip" onClick={voltarAoEmail} aria-label={`Trocar o e-mail ${email}`}>
              <span aria-hidden="true">{(email[0] || 'V').toUpperCase()}</span>
              {email}
            </button>
          ) : (
            <p className="login-sub">
              {passo === 'esqueci' ? 'Mandamos um link pro seu e-mail.' : 'Ir para o Auê!'}
            </p>
          )}

          <form className="login-form" onSubmit={enviar} noValidate>
            {passo !== 'senha' && (
              <input
                className="publico-campo"
                type="email"
                placeholder="E-mail"
                aria-label="E-mail"
                autoComplete="username"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  limpar();
                }}
              />
            )}
            {passo === 'senha' && (
              <>
                <input
                  className="publico-campo"
                  type={mostrar ? 'text' : 'password'}
                  placeholder="Digite sua senha"
                  aria-label="Senha"
                  autoComplete="current-password"
                  value={senha}
                  onChange={(e) => {
                    setSenha(e.target.value);
                    limpar();
                  }}
                />
                <label className="login-mostrar">
                  <input type="checkbox" checked={mostrar} onChange={() => setMostrar((v) => !v)} />
                  Mostrar senha
                </label>
              </>
            )}
            {erro && (
              <p className="publico-erro" role="alert">
                {erro}
              </p>
            )}
            {info && (
              <p className="publico-aviso" role="status">
                {info}
              </p>
            )}
            {passo === 'senha' && (
              <button
                type="button"
                className="login-link"
                onClick={() => {
                  setPasso('esqueci');
                  limpar();
                }}
              >
                Esqueceu a senha?
              </button>
            )}
            {passo === 'esqueci' && (
              <button type="button" className="login-link" onClick={voltarAoEmail}>
                Voltar pra entrada
              </button>
            )}
            <button type="submit" hidden aria-hidden="true" tabIndex={-1} />
          </form>

          {passo === 'email' && (
            <p className="login-convidado">
              Ainda sem conta? Por enquanto,{' '}
              <Link to="/comunidade">ouça as comunidades</Link> ou{' '}
              <Link to="/arena">arrote como convidado</Link>.
            </p>
          )}

          <div className="login-acoes">
            <button
              type="button"
              className="publico-pilula publico-pilula-escura"
              onClick={avancar}
              disabled={carregando}
            >
              {passo === 'email' ? 'Avançar' : passo === 'esqueci' ? 'Mandar o link' : 'Entrar'}
            </button>
          </div>
        </div>
      </div>

      <footer className="login-rodape">
        <Link to="/privacidade">Privacidade</Link>
        <Link to="/termos">Termos</Link>
      </footer>
    </div>
  );
};
