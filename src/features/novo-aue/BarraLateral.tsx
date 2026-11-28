import { memo } from 'react';
import { NavegacaoM05 } from '../m05/NavegacaoM05';
import { Link, useNavigate } from 'react-router-dom';

interface Props {
  readonly experienciaM05?: boolean;
  readonly viewAtual: 'feed' | 'seguindo' | 'auth' | 'perfil' | 'comunidade' | 'comunidades' | 'explorar' | 'arena';
  readonly estaAutenticado: boolean;
  readonly aoMudarView: (view: 'feed' | 'seguindo' | 'auth' | 'perfil' | 'comunidade' | 'comunidades' | 'explorar' | 'arena', slug?: string) => void;
  readonly aoAbrirGravadorRapido: () => void;
  readonly aoSair: () => void;
  readonly aoEntrar?: () => void;
}

type IconeDaNavegacao = 'inicio' | 'ranking' | 'grupos' | 'seguindo' | 'perfil';

function IconeDaNavegacao({ tipo }: { readonly tipo: IconeDaNavegacao }) {
  return (
    <span className="ico" aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        {tipo === 'inicio' && (
          <>
            <path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z" />
          </>
        )}
        {tipo === 'ranking' && (
          <>
            <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
            <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
            <path d="M4 22h16" />
            <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
            <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
            <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
          </>
        )}
        {tipo === 'grupos' && (
          <>
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
          </>
        )}
        {tipo === 'seguindo' && (
          <>
            <circle cx="8.5" cy="8" r="3" />
            <circle cx="16.5" cy="9" r="2.5" />
            <path d="M3.5 20v-1a5 5 0 0 1 10 0v1" />
            <path d="M14 16.5a4.5 4.5 0 0 1 6.5 4" />
          </>
        )}
        {tipo === 'perfil' && (
          <>
            <circle cx="12" cy="8" r="3.5" />
            <path d="M4.5 20v-1.5a7.5 7.5 0 0 1 15 0V20" />
          </>
        )}
      </svg>
    </span>
  );
}

/** Sidebar fixa do App Shell desktop/tablet. No mobile o componente é ocultado via CSS (sem Bottom Nav). */
export const BarraLateral = memo(function BarraLateral({
  experienciaM05 = false,
  viewAtual,
  estaAutenticado,
  aoMudarView,
  aoAbrirGravadorRapido,
  aoSair,
  aoEntrar,
}: Props) {
  const navigate = useNavigate();

  const isInicioAtivo = viewAtual === 'feed';
  const isSeguindoAtivo = viewAtual === 'seguindo';
  const isPerfilAtivo = viewAtual === 'perfil';

  return (
    <aside className="sidebar" aria-label="Navegação do Auê">
      <Link
        to="/"
        className="brand"
        aria-label="Auê, página inicial"
        onClick={() => aoMudarView('feed')}
      >
        <span className="brand-full">
          AUÊ<span className="brand-bang">!</span>
        </span>
      </Link>

      {experienciaM05 ? <NavegacaoM05 /> : <nav className="sidebar-desktop-nav" aria-label="Menu principal">
        <button
          className={`nav-item ${isInicioAtivo ? 'active' : ''}`}
          type="button"
          aria-current={isInicioAtivo ? 'page' : undefined}
          onClick={() => {
            aoMudarView('feed');
            navigate('/');
          }}
        >
          <IconeDaNavegacao tipo="inicio" />
          Início
        </button>

        <Link className="nav-item" to="/ranking-de-arrotos">
          <IconeDaNavegacao tipo="ranking" />
          Ranking
        </Link>

        <Link className="nav-item" to="/grupos">
          <IconeDaNavegacao tipo="grupos" />
          Grupos Zap
        </Link>

        <button
          className={`nav-item ${isSeguindoAtivo ? 'active' : ''}`}
          type="button"
          aria-current={isSeguindoAtivo ? 'page' : undefined}
          onClick={() => {
            if (!estaAutenticado) {
              aoEntrar?.();
            } else {
              aoMudarView('seguindo');
              navigate('/seguindo');
            }
          }}
        >
          <IconeDaNavegacao tipo="seguindo" />
          Seguindo
        </button>

        <button
          className={`nav-item ${isPerfilAtivo ? 'active' : ''}`}
          type="button"
          aria-current={isPerfilAtivo ? 'page' : undefined}
          onClick={() => {
            if (!estaAutenticado) {
              aoEntrar?.();
            } else {
              aoMudarView('perfil');
              navigate('/perfil');
            }
          }}
        >
          <IconeDaNavegacao tipo="perfil" />
          Perfil
        </button>

        <button
          className="create-side"
          type="button"
          onClick={aoAbrirGravadorRapido}
        >
          ARROTAR
        </button>
      </nav>}

      <div className="sidebar-footer">
        {estaAutenticado ? (
          <button className="sidebar-account-action sidebar-account-action--leave" type="button" onClick={aoSair}>
            Sair da conta
          </button>
        ) : (
          <button className="sidebar-account-action sidebar-account-action--enter" type="button" onClick={aoEntrar}>
            Entrar
          </button>
        )}
        <div className="sidebar-legal-links">
          <Link to="/como-jogar">Como jogar</Link>
          <Link to="/termos">Termos</Link>
          <Link to="/privacidade">Privacidade</Link>
        </div>
      </div>
    </aside>
  );
});
