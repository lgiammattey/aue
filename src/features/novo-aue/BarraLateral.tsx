import { memo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { ComunidadeDoForum } from '../../portas/forum';

interface Props {
  readonly viewAtual: 'feed' | 'auth' | 'perfil' | 'comunidade' | 'comunidades';
  readonly comunidadeAtivaSlug?: string;
  readonly comunidades: readonly ComunidadeDoForum[];
  readonly estaAutenticado: boolean;
  readonly aoMudarView: (view: 'feed' | 'auth' | 'perfil' | 'comunidade' | 'comunidades', slug?: string) => void;
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

  return (
    <aside className="sidebar" aria-label="Navegação lateral">
      <Link
        to="/"
        className="brand"
        aria-label="Auê, página inicial"
        onClick={() => aoMudarView('feed')}
      >
        <svg className="aue-mark" viewBox="0 0 32 32" aria-hidden="true">
          <path d="M4 24 C10 10, 22 10, 28 24" />
          <path d="M8 26 C13 18, 19 18, 24 26" />
          <path d="M12 28 C14 24, 18 24, 20 28" />
        </svg>
        <span>Auê!</span>
      </Link>

      <nav>
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
          className="nav-item"
          type="button"
          onClick={() => {
            aoMudarView('feed');
            navigate('/');
          }}
        >
          <span className="ico">↗</span>Em alta
        </button>
        <button
          className="nav-item"
          type="button"
          onClick={() => {
            if (!estaAutenticado) {
              aoEntrar?.();
            } else {
              aoMudarView('feed');
              navigate('/');
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
          onClick={() => {
            navigate('/arena');
            aoAbrirCompositor();
          }}
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
