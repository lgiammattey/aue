import { memo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { ComunidadeDoForum } from '../../portas/forum';

interface Props {
  readonly viewAtual: 'feed' | 'emAlta' | 'seguindo' | 'auth' | 'perfil' | 'comunidade' | 'comunidades';
  readonly comunidadeAtivaSlug?: string;
  readonly comunidades: readonly ComunidadeDoForum[];
  readonly estaAutenticado: boolean;
  readonly aoMudarView: (view: 'feed' | 'emAlta' | 'seguindo' | 'auth' | 'perfil' | 'comunidade' | 'comunidades', slug?: string) => void;
  readonly aoAbrirCompositor: () => void;
  readonly aoAbrirFundar: () => void;
  readonly aoSair: () => void;
  readonly aoEntrar?: () => void;
}

export const BarraLateral = memo(function BarraLateral({
  viewAtual,
  comunidadeAtivaSlug,
  comunidades,
  estaAutenticado,
  aoMudarView,
  aoAbrirCompositor,
  aoAbrirFundar,
  aoSair,
  aoEntrar,
}: Props) {
  const navigate = useNavigate();

  const isFeedAtivo = viewAtual === 'feed' || viewAtual === 'emAlta' || viewAtual === 'seguindo';
  const isComunidadesAtivo = viewAtual === 'comunidades' || viewAtual === 'comunidade';
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
        <div className="nav-label">Índice</div>
        <button
          className={`nav-item ${viewAtual === 'feed' ? 'active' : ''}`}
          type="button"
          onClick={() => {
            aoMudarView('feed');
            navigate('/');
          }}
        >
          <span className="ico">⌂</span>Início
        </button>
        <button
          className={`nav-item ${viewAtual === 'emAlta' ? 'active' : ''}`}
          type="button"
          onClick={() => {
            aoMudarView('emAlta');
            navigate('/em-alta');
          }}
        >
          <span className="ico">↗</span>Em alta
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
          <span className="ico">◎</span>Seguindo
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
          <span className="ico">◉</span>Meu perfil
        </button>

        <button
          className="create-side"
          type="button"
          onClick={aoAbrirCompositor}
        >
          + Soltar um arroto
        </button>

        <div className="nav-label">Comunidades</div>
        <button
          className="nav-item"
          id="openCommunityFounder"
          type="button"
          onClick={aoAbrirFundar}
        >
          <span className="ico">＋</span>Fundar comunidade
        </button>
        <button
          className={`nav-item ${viewAtual === 'comunidades' ? 'active' : ''}`}
          type="button"
          onClick={() => {
            aoMudarView('comunidades');
            navigate('/comunidades');
          }}
        >
          <span className="ico">◎</span>Todas as rodas
        </button>

        {comunidades.slice(0, 5).map((c) => {
          const ativa = viewAtual === 'comunidade' && comunidadeAtivaSlug === c.slug;
          return (
            <button
              key={c.id}
              className={`nav-item ${ativa ? 'active' : ''}`}
              type="button"
              onClick={() => {
                aoMudarView('comunidade', c.slug);
                navigate(`/c/${c.slug}`);
              }}
            >
              <span className="community-dot" />
              <span>r/{c.slug}</span>
            </button>
          );
        })}
      </nav>

      {/* Navegação Inferior Mobile (Zona do Polegar com 5 alvos: Feed, Comunidades, ARROTAR, X1, Perfil) */}
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
          aria-label="Rodas e comunidades"
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
          onClick={() => navigate('/arena')}
          aria-label="Entrar na Arena para arrotar"
          title="Arrotar agora na Arena"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M12 2a4 4 0 00-4 4v6a4 4 0 008 0V6a4 4 0 00-4-4z" />
            <path d="M19 10v2a7 7 0 01-14 0v-2H3v2a9 9 0 008 8.94V23h2v-2.06A9 9 0 0021 12v-2h-2z" />
          </svg>
          <span className="arrotar-label">ARROTAR</span>
        </button>

        {/* 4. X1 (Desafios) */}
        <button
          type="button"
          className="mobile-nav-item"
          onClick={() => navigate('/desafios')}
          aria-label="Central de Desafios X1"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
          <span>X1</span>
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
          <button className="nav-item" type="button" onClick={aoSair}>
            <span className="ico">↩</span>Sair da conta
          </button>
        ) : (
          <button className="nav-item" type="button" onClick={aoEntrar}>
            <span className="ico">→</span>Entrar
          </button>
        )}
      </div>
    </aside>
  );
});
