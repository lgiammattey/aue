import { memo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { NotificacaoDeMencao } from '../../portas/forum';
import type { PerfilPublico } from '../../portas/perfil';

interface Props {
  readonly busca: string;
  readonly estaAutenticado: boolean;
  readonly meuPerfil: PerfilPublico | null;
  readonly aoBuscar: (termo: string) => void;
  readonly aoEntrar?: () => void;
  readonly notificacoesDeMencao?: readonly NotificacaoDeMencao[];
  readonly aoAbrirNotificacoes?: () => void;
  /** Explorar já tem a busca no conteúdo; evita dois campos para a mesma ação. */
  readonly mostrarBusca?: boolean;
}

export const BarraSuperior = memo(function BarraSuperior({
  busca,
  estaAutenticado,
  meuPerfil,
  aoBuscar,
  aoEntrar,
  notificacoesDeMencao = [],
  aoAbrirNotificacoes,
  mostrarBusca = true,
}: Props) {
  const navigate = useNavigate();
  const nomeExibicao = meuPerfil?.apelido ?? meuPerfil?.handle ?? 'Você';
  const iniciais = nomeExibicao.slice(0, 2).toUpperCase();
  const avatarUrl = meuPerfil?.avatarUrl ?? null;
  const [notificacoesAbertas, setNotificacoesAbertas] = useState(false);
  const naoLidas = notificacoesDeMencao.filter((notificacao) => notificacao.lidaEm === null).length;

  return (
    <header className="topbar">
      <Link to="/" className="topbar-brand-mobile" aria-label="Auê mobile">
        AUÊ!
      </Link>

      {mostrarBusca && <form
        className="topbar-search"
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          const termo = busca.trim();
          navigate(termo.length >= 2 ? `/explorar?q=${encodeURIComponent(termo)}` : '/explorar');
        }}
      >
        <div className="topbar-search__field">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="11" cy="11" r="6.5" />
            <path d="m16 16 4 4" />
          </svg>
          <input
            type="search"
            className="search"
            placeholder="Buscar pessoas, comunidades e publicações…"
            value={busca}
            maxLength={60}
            onChange={(e) => aoBuscar(e.target.value)}
            aria-label="Campo de busca"
          />
        </div>
        <button type="submit" className="icon-btn topbar-search__submit">Buscar</button>
      </form>}

      <div className={`top-actions${estaAutenticado ? ' top-actions--authenticated' : ''}`}>
        {estaAutenticado ? (
          <>
            <div className="topbar-notifications">
              <button
                type="button"
                className="icon-btn topbar-notifications__button"
                aria-label={naoLidas ? `${naoLidas} novas marcações` : 'Marcações'}
                aria-expanded={notificacoesAbertas}
                onClick={() => {
                  const abrindo = !notificacoesAbertas;
                  setNotificacoesAbertas(abrindo);
                  if (abrindo && naoLidas) aoAbrirNotificacoes?.();
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" /><path d="M10 21h4" /></svg>
                {naoLidas > 0 && <span className="topbar-notifications__count">{naoLidas > 9 ? '9+' : naoLidas}</span>}
              </button>
              {notificacoesAbertas && (
                <section className="topbar-notifications__panel" aria-label="Marcações recentes">
                  <h2>Marcações</h2>
                  {notificacoesDeMencao.length === 0 ? <p>Ninguém marcou você ainda.</p> : (
                    <ul>
                      {notificacoesDeMencao.map((notificacao) => (
                        <li key={notificacao.id} className={notificacao.lidaEm ? undefined : 'is-unread'}>
                          <strong>{notificacao.autor.apelido ?? `@${notificacao.autor.handle ?? 'alguém'}`}</strong> marcou você em um post.
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              )}
            </div>
            <Link to="/perfil" className="profile-mini" aria-label="Abrir meu perfil">
              {avatarUrl ? <img className="avatar profile-mini__avatar" src={avatarUrl} alt="" /> : <span className="avatar profile-mini__avatar">{iniciais}</span>}
              <span className="profile-mini__name">{nomeExibicao}</span>
              <svg className="profile-mini__chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m9 18 6-6-6-6" /></svg>
            </Link>
          </>
        ) : (
          <button type="button" className="icon-btn topbar-login" onClick={aoEntrar} aria-label="Fazer login">
            Entrar
          </button>
        )}
      </div>
    </header>
  );
});
