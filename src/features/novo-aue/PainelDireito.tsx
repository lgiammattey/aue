import { memo, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { GruposNaHome } from '../../arena/v2/GruposNaHome';
import type { ComunidadeDoForum, NotificacaoDeMencao } from '../../portas/forum';
import type { PerfilPublico } from '../../portas/perfil';
import { SlotPatrocinado } from './SlotPatrocinadoDoFeed';
import { TopArrotadoresDaHome } from './TopArrotadoresDaHome';

interface Props {
  readonly anuncio?: ReactNode;
  readonly comunidades?: readonly ComunidadeDoForum[];
  readonly aoAbrirComunidade?: (slug: string) => void;
  readonly comunidadesEntradas?: Record<string, boolean>;
  readonly viewAtual?: 'feed' | 'seguindo' | 'auth' | 'perfil' | 'comunidade' | 'comunidades' | 'explorar' | 'arena';
  readonly regrasDaComunidade?: readonly string[];
  readonly estaAutenticado?: boolean;
  readonly contaPerfil?: PerfilPublico | null;
  readonly notificacoesDeMencao?: readonly NotificacaoDeMencao[];
  readonly aoAbrirNotificacoes?: () => void;
  readonly estadoDasComunidades?: 'carregando' | 'pronto' | 'erro';
  readonly aoTentarComunidades?: () => void;
}

export const PainelDireito = memo(function PainelDireito({
  anuncio,
  estaAutenticado = false,
  contaPerfil,
  notificacoesDeMencao = [],
  aoAbrirNotificacoes,
}: Props) {
  const [notificacoesAbertas, setNotificacoesAbertas] = useState(false);
  const nomeDaConta = contaPerfil?.apelido ?? contaPerfil?.handle ?? 'Você';
  const iniciaisDaConta = nomeDaConta.slice(0, 2).toUpperCase();
  const naoLidas = notificacoesDeMencao.filter((notificacao) => notificacao.lidaEm === null).length;

  return (
    <>
      <aside className="rightbar" aria-label="Painel complementar">
        {estaAutenticado && (
          <section className="rightbar-account" aria-label="Minha conta">
            <Link to="/perfil" className="rightbar-account__profile" aria-label="Abrir meu perfil">
              {contaPerfil?.avatarUrl ? (
                <img className="rightbar-account__avatar" src={contaPerfil.avatarUrl} alt="" />
              ) : (
                <span className="rightbar-account__avatar" aria-hidden="true">{iniciaisDaConta}</span>
              )}
              <span className="rightbar-account__copy">
                <strong>{nomeDaConta}</strong>
                {contaPerfil?.handle && <small>@{contaPerfil.handle}</small>}
              </span>
            </Link>
            <div className="rightbar-account__notifications">
              <button
                type="button"
                className="rightbar-account__bell"
                aria-label={naoLidas ? `${naoLidas} novas marcações` : 'Marcações'}
                aria-expanded={notificacoesAbertas}
                onClick={() => {
                  const abrindo = !notificacoesAbertas;
                  setNotificacoesAbertas(abrindo);
                  if (abrindo && naoLidas) aoAbrirNotificacoes?.();
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
                  <path d="M10 21h4" />
                </svg>
                {naoLidas > 0 && <span className="rightbar-account__count">{naoLidas > 9 ? '9+' : naoLidas}</span>}
              </button>
              {notificacoesAbertas && (
                <section className="rightbar-account__menu" aria-label="Marcações recentes">
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
          </section>
        )}

        <div className="rightbar-ranking-wrap">
          <TopArrotadoresDaHome variante="painel" />
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 6 }}>
            <Link to="/ranking-de-arrotos" className="rightbar-bloco__link">
              Ranking completo →
            </Link>
          </div>
        </div>

        <section className="rightbar-bloco" aria-label="Grupos de WhatsApp">
          <div className="rightbar-bloco__head">
            <div>
              <span className="rightbar-bloco__eyebrow">NO ZAP</span>
              <h2>Grupos</h2>
            </div>
          </div>
          <GruposNaHome limite={3} emPainel />
        </section>

        {anuncio ?? <SlotPatrocinado posicionamento="sidebar" />}

        <footer className="site-footer site-footer--page">
          <div className="footer-links">
            <Link to="/como-arrotar" className="footer-link">Como Arrotar</Link>
            <Link to="/tipos-de-arroto" className="footer-link">Tipos</Link>
            <Link to="/como-jogar" className="footer-link">Como Jogar</Link>
            <Link to="/ranking-de-arrotos" className="footer-link">Ranking</Link>
            <Link to="/termos" className="footer-link">Termos</Link>
            <Link to="/privacidade" className="footer-link">Privacidade</Link>
          </div>
          <small style={{ color: 'var(--aue-subtle)', display: 'block', marginTop: 10 }}>
            Auê! © 2026
          </small>
        </footer>
      </aside>

      <footer className="site-footer site-footer--mobile">
        <div className="footer-links">
          <Link to="/como-arrotar" className="footer-link">Como Arrotar</Link>
          <Link to="/tipos-de-arroto" className="footer-link">Tipos</Link>
          <Link to="/como-jogar" className="footer-link">Como Jogar</Link>
          <Link to="/ranking-de-arrotos" className="footer-link">Ranking</Link>
          <Link to="/termos" className="footer-link">Termos</Link>
          <Link to="/privacidade" className="footer-link">Privacidade</Link>
        </div>
        <small style={{ color: 'var(--aue-subtle)', display: 'block', marginTop: 10 }}>
          Auê! © 2026
        </small>
      </footer>
    </>
  );
});
