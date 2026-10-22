import { memo } from 'react';
import { Link, useNavigate } from 'react-router-dom';

interface Props {
  readonly viewAtual: 'feed' | 'seguindo' | 'auth' | 'perfil' | 'comunidade' | 'comunidades' | 'explorar' | 'arena';
  readonly estaAutenticado: boolean;
  readonly aoMudarView: (view: 'feed' | 'seguindo' | 'auth' | 'perfil' | 'comunidade' | 'comunidades' | 'explorar' | 'arena', slug?: string) => void;
  readonly aoAbrirGravadorRapido: () => void;
  readonly aoSair: () => void;
  readonly aoEntrar?: () => void;
}

type IconeDaNavegacao = 'feed' | 'grupos' | 'tropa' | 'arena' | 'eu';

function IconeDaNavegacao({ tipo }: { readonly tipo: IconeDaNavegacao }) {
  return (
    <span className="ico" aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        {tipo === 'feed' && <>
          <rect x="4" y="3.5" width="16" height="17" rx="3" />
          <path d="M8 8h8M8 12h8M8 16h5" />
          <circle cx="6.5" cy="8" r=".5" fill="currentColor" stroke="none" />
          <circle cx="6.5" cy="12" r=".5" fill="currentColor" stroke="none" />
          <circle cx="6.5" cy="16" r=".5" fill="currentColor" stroke="none" />
        </>}
        {tipo === 'grupos' && <>
          <rect x="4" y="4" width="6.5" height="6.5" rx="1.5" />
          <rect x="13.5" y="4" width="6.5" height="6.5" rx="1.5" />
          <rect x="4" y="13.5" width="6.5" height="6.5" rx="1.5" />
          <rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.5" />
        </>}
        {tipo === 'tropa' && <>
          <circle cx="8.5" cy="8" r="3" />
          <circle cx="16.5" cy="9" r="2.5" />
          <path d="M3.5 20v-1a5 5 0 0 1 10 0v1" />
          <path d="M14 16.5a4.5 4.5 0 0 1 6.5 4" />
        </>}
        {tipo === 'arena' && <>
          <rect x="9" y="3" width="6" height="11" rx="3" />
          <path d="M6 10a6 6 0 0 0 12 0M12 16v5M8.5 21h7" />
        </>}
        {tipo === 'eu' && <>
          <circle cx="12" cy="8" r="3.5" />
          <path d="M4.5 20v-1.5a7.5 7.5 0 0 1 15 0V20" />
        </>}
      </svg>
    </span>
  );
}

export const BarraLateral = memo(function BarraLateral({
  viewAtual,
  estaAutenticado,
  aoMudarView,
  aoAbrirGravadorRapido,
  aoSair,
  aoEntrar,
}: Props) {
  const navigate = useNavigate();

  const isFeedAtivo = viewAtual === 'feed' || viewAtual === 'seguindo';
  const isComunidadesAtivo = viewAtual === 'comunidades' || viewAtual === 'comunidade';
  const isTropaAtivo = viewAtual === 'seguindo';
  const isPerfilAtivo = viewAtual === 'perfil';

  return (
    <aside className="sidebar" aria-label="Navegação do Auê">
      {/* Brand Desktop */}
      <Link
        to="/"
        className="brand"
        aria-label="Auê, página inicial"
        onClick={() => aoMudarView('feed')}
      >
        <span className="brand-full">AUÊ!</span>
        <span className="brand-compact" aria-hidden="true">A!</span>
      </Link>

      {/* Navegação Desktop (>= 700px) */}
      <nav className="sidebar-desktop-nav" aria-label="Menu principal">
        <button
          className={`nav-item ${viewAtual === 'feed' ? 'active' : ''}`}
          type="button"
          onClick={() => {
            aoMudarView('feed');
            navigate('/');
          }}
        >
          <IconeDaNavegacao tipo="feed" />Feed
        </button>
        <button
          className={`nav-item ${viewAtual === 'comunidades' || viewAtual === 'explorar' ? 'active' : ''}`}
          type="button"
          onClick={() => {
            aoMudarView('comunidades');
            navigate('/comunidades');
          }}
        >
          <IconeDaNavegacao tipo="grupos" />Comunidades
        </button>
        <button
          className={`nav-item ${viewAtual === 'seguindo' ? 'active' : ''}`}
          type="button"
          onClick={() => {
            if (!estaAutenticado) {
              aoEntrar?.();
            } else {
              aoMudarView('seguindo');
              navigate('/seguindo');
            }
          }}
        >
          <IconeDaNavegacao tipo="tropa" />Tropa
        </button>
        <button
          className={`nav-item ${viewAtual === 'arena' ? 'active' : ''}`}
          type="button"
          onClick={() => {
            aoMudarView('arena');
            navigate('/arena/em-breve');
          }}
        >
          <IconeDaNavegacao tipo="arena" />Arena
        </button>
        <button
          className={`nav-item ${viewAtual === 'perfil' ? 'active' : ''}`}
          type="button"
          onClick={() => {
            if (!estaAutenticado) {
              aoEntrar?.();
            } else {
              aoMudarView('perfil');
              navigate('/perfil');
            }
          }}
        >
          <IconeDaNavegacao tipo="eu" />Eu
        </button>

        <button
          className="create-side"
          type="button"
          onClick={aoAbrirGravadorRapido}
        >
          + Soltar um arroto
        </button>

      </nav>

      {/* Navegação Inferior Mobile (Zona do Polegar: Feed, Comunidades, ARROTAR, Tropa e Perfil) */}
      <nav className="mobile-bottom-nav" aria-label="Navegação móvel inferior">
        {/* 1. Feed */}
        <button
          type="button"
          className={`mobile-nav-item ${isFeedAtivo ? 'active' : ''}`}
          onClick={() => {
            aoMudarView('feed');
            navigate('/');
          }}
          aria-label="Feed de causos"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M3 11l9-8 9 8v10a1 1 0 01-1 1h-5v-6h-6v6H4a1 1 0 01-1-1V11z" />
          </svg>
          <span>Feed</span>
        </button>

        {/* 2. Comunidades */}
        <button
          type="button"
          className={`mobile-nav-item ${isComunidadesAtivo ? 'active' : ''}`}
          onClick={() => {
            aoMudarView('comunidades');
            navigate('/comunidades');
          }}
          aria-label="Comunidades"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 00-3-3.87" />
            <path d="M16 3.13a4 4 0 010 7.75" />
          </svg>
          <span>Comunidades</span>
        </button>

        {/* 3. Botão Central de Arroto (O Botão de Ouro) */}
        <button
          type="button"
          className="mobile-nav-item mobile-nav-item--arrotar"
          onClick={aoAbrirGravadorRapido}
          aria-label="Gravar um arroto para publicar"
          title="Gravar arroto agora"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M12 2a4 4 0 00-4 4v6a4 4 0 008 0V6a4 4 0 00-4-4z" />
            <path d="M19 10v2a7 7 0 01-14 0v-2H3v2a9 9 0 008 8.94V23h2v-2.06A9 9 0 0021 12v-2h-2z" />
          </svg>
          <span className="arrotar-label">ARROTAR</span>
        </button>

        {/* 4. Tropa */}
        <button
          type="button"
          className={`mobile-nav-item ${isTropaAtivo ? 'active' : ''}`}
          onClick={() => {
            if (!estaAutenticado) {
              aoEntrar?.();
              return;
            }
            aoMudarView('seguindo');
            navigate('/seguindo');
          }}
          aria-label="Minha Tropa"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="8.5" cy="8" r="3" />
            <circle cx="16.5" cy="9" r="2.5" />
            <path d="M3.5 20v-1a5 5 0 0 1 10 0v1" />
            <path d="M14 16.5a4.5 4.5 0 0 1 6.5 4" />
          </svg>
          <span>Tropa</span>
        </button>

        {/* 5. Perfil */}
        <button
          type="button"
          className={`mobile-nav-item ${isPerfilAtivo ? 'active' : ''}`}
          onClick={() => {
            if (!estaAutenticado) {
              aoEntrar?.();
            } else {
              aoMudarView('perfil');
              navigate('/perfil');
            }
          }}
          aria-label="Meu perfil"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          <span>Perfil</span>
        </button>
      </nav>

      {/* Footer Desktop */}
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
      </div>
    </aside>
  );
});
