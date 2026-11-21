import { memo, useState } from 'react';
import { Link } from 'react-router-dom';
import type { NotificacaoDeMencao } from '../../portas/forum';
import type { PerfilPublico } from '../../portas/perfil';
import './BarraSuperior.css';

interface Props {
  readonly busca?: string;
  readonly estaAutenticado: boolean;
  readonly meuPerfil: PerfilPublico | null;
  readonly aoBuscar?: (termo: string) => void;
  readonly aoEntrar?: () => void;
  readonly notificacoesDeMencao?: readonly NotificacaoDeMencao[];
  readonly aoAbrirNotificacoes?: () => void;
  readonly mostrarBusca?: boolean;
}

/** Barra superior enxuta exibida no mobile (< 700px) — sem campo de busca nem comunidades. */
export const BarraSuperior = memo(function BarraSuperior({
  estaAutenticado,
  meuPerfil,
  aoEntrar,
  notificacoesDeMencao = [],
  aoAbrirNotificacoes,
}: Props) {
  const nomeExibicao = meuPerfil?.apelido ?? meuPerfil?.handle ?? 'Você';
  const iniciais = nomeExibicao.slice(0, 2).toUpperCase();
  const avatarUrl = meuPerfil?.avatarUrl ?? null;
  const [notificacoesAbertas, setNotificacoesAbertas] = useState(false);
  const naoLidas = notificacoesDeMencao.filter((notificacao) => notificacao.lidaEm === null).length;

  return (
    <header className="topbar" data-sessao={estaAutenticado ? 'ativa' : 'visitante'}>
      <Link to="/" className="topbar-brand-mobile" aria-label="Auê mobile">
        AUÊ<span className="topbar-brand-mobile__bang">!</span>
      </Link>

      <nav className="topbar-mobile-nav" aria-label="Navegação rápida">
        <Link to="/ranking-de-arrotos" className="topbar-nav-link">
          Ranking
        </Link>
        <Link to="/grupos" className="topbar-nav-link">
          Grupos
        </Link>
      </nav>

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
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
                  <path d="M10 21h4" />
                </svg>
                {naoLidas > 0 && <span className="topbar-notifications__count">{naoLidas > 9 ? '9+' : naoLidas}</span>}
              </button>
              {notificacoesAbertas && (
                <section className="topbar-notifications__panel" aria-label="Marcações recentes">
                  <h2>Marcações</h2>
                  {notificacoesDeMencao.length === 0 ? (
                    <p>Ninguém marcou você ainda.</p>
                  ) : (
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
              {avatarUrl ? (
                <img className="avatar profile-mini__avatar" src={avatarUrl} alt="" />
              ) : (
                <span className="avatar profile-mini__avatar" aria-hidden="true">{iniciais}</span>
              )}
              <span className="profile-mini__name">Perfil</span>
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
