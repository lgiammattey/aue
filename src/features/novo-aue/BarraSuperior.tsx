import { memo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { PerfilPublico } from '../../portas/perfil';

interface Props {
  readonly busca: string;
  readonly estaAutenticado: boolean;
  readonly meuPerfil: PerfilPublico | null;
  readonly aoBuscar: (termo: string) => void;
  readonly aoEntrar?: () => void;
}

export const BarraSuperior = memo(function BarraSuperior({
  busca,
  estaAutenticado,
  meuPerfil,
  aoBuscar,
  aoEntrar,
}: Props) {
  const navigate = useNavigate();
  const nomeExibicao = meuPerfil?.apelido ?? meuPerfil?.handle ?? 'Você';
  const iniciais = nomeExibicao.slice(0, 2).toUpperCase();

  return (
    <header className="topbar">
      <Link to="/" className="topbar-brand-mobile" aria-label="Auê mobile">
        AUÊ!
      </Link>

      <form
        role="search"
        style={{ display: 'contents' }}
        onSubmit={(e) => {
          e.preventDefault();
          const termo = busca.trim();
          navigate(termo.length >= 2 ? `/explorar?q=${encodeURIComponent(termo)}` : '/explorar');
        }}
      >
        <input
          type="search"
          className="search"
          placeholder="Buscar pessoas, rodas e publicações…"
          value={busca}
          maxLength={60}
          onChange={(e) => aoBuscar(e.target.value)}
          aria-label="Campo de busca"
        />
        <button type="submit" className="icon-btn">Buscar</button>
      </form>

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
