import { memo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { PerfilPublico } from '../../portas/perfil';
import './BarraSuperior.css';

interface Props {
  readonly busca: string;
  readonly estaAutenticado: boolean;
  readonly meuPerfil: PerfilPublico | null;
  readonly aoBuscar: (termo: string) => void;
  readonly aoEntrar?: () => void;
  /** Explorar já tem a busca no conteúdo; evita dois campos para a mesma ação. */
  readonly mostrarBusca?: boolean;
}

export const BarraSuperior = memo(function BarraSuperior({
  busca,
  estaAutenticado,
  meuPerfil,
  aoBuscar,
  aoEntrar,
  mostrarBusca = true,
}: Props) {
  const navigate = useNavigate();
  const nomeExibicao = meuPerfil?.apelido ?? meuPerfil?.handle ?? 'Você';
  const iniciais = nomeExibicao.slice(0, 2).toUpperCase();

  return (
    <header className="topbar" data-sessao={estaAutenticado ? 'ativa' : undefined}>
      <Link to="/" className="topbar-brand-mobile" aria-label="Auê mobile">
        AUÊ!
      </Link>

      {mostrarBusca && <form
        role="search"
        style={{ display: 'contents' }}
        onSubmit={(e) => {
          e.preventDefault();
          const termo = busca.trim();
          navigate(termo.length >= 2 ? `/explorar?q=${encodeURIComponent(termo)}` : '/explorar');
        }}
      >
        <label className="topbar-search">
          <svg className="topbar-search__lupa" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
            <circle cx="11" cy="11" r="7" />
            <path d="M20 20l-3.5-3.5" />
          </svg>
          <input
            type="search"
            className="search"
            placeholder="Buscar pessoas, rodas e posts"
            value={busca}
            maxLength={60}
            enterKeyHint="search"
            onChange={(e) => aoBuscar(e.target.value)}
            aria-label="Campo de busca"
          />
        </label>
        <button type="submit" className="icon-btn">Buscar</button>
      </form>}

      <div className="top-actions">
        {estaAutenticado ? (
          <Link to="/perfil" className="profile-mini" aria-label="Abrir meu perfil">
            <span className="avatar">{iniciais}</span>
            <span>{nomeExibicao}</span>
          </Link>
        ) : (
          <button type="button" className="icon-btn" onClick={aoEntrar} aria-label="Fazer login">
            Entrar
          </button>
        )}
      </div>
    </header>
  );
});
