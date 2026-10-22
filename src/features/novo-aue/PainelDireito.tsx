import { memo, useState } from 'react';
import { Link } from 'react-router-dom';
import type { ComunidadeDoForum, NotificacaoDeMencao } from '../../portas/forum';
import type { PerfilPublico } from '../../portas/perfil';
import { SlotPatrocinado } from './SlotPatrocinadoDoFeed';

function avatarDaComunidade(comunidade: ComunidadeDoForum): string | undefined {
  return comunidade.avatarUrl ?? undefined;
}

interface Props {
  readonly comunidades: readonly ComunidadeDoForum[];
  readonly aoAbrirComunidade: (slug: string) => void;
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
  comunidades,
  aoAbrirComunidade,
  comunidadesEntradas = {},
  viewAtual = 'feed',
  regrasDaComunidade = [],
  estaAutenticado = false,
  contaPerfil,
  notificacoesDeMencao = [],
  aoAbrirNotificacoes,
  estadoDasComunidades = 'pronto',
  aoTentarComunidades,
}: Props) {
  const [notificacoesAbertas, setNotificacoesAbertas] = useState(false);
  const nomeDaConta = contaPerfil?.apelido ?? contaPerfil?.handle ?? 'Você';
  const iniciaisDaConta = nomeDaConta.slice(0, 2).toUpperCase();
  const naoLidas = notificacoesDeMencao.filter((notificacao) => notificacao.lidaEm === null).length;
  const minhasComunidades = comunidades.filter((comunidade) => comunidadesEntradas[comunidade.slug] || comunidade.possoGerirMidia);
  const comunidadesExibidas = (minhasComunidades.length > 0 ? minhasComunidades : comunidades).slice(0, 4);
  const tituloDasComunidades = minhasComunidades.length > 0 ? 'Suas comunidades' : 'Comunidades abertas';
  const previaDaArena = <>
    <span className="rightbar-arena__eyebrow">ARENA · EM BREVE</span>
    <span className="rightbar-arena__stamp">SIMULAÇÃO</span>
    <div className="rightbar-arena__heading">
      <h2>Top ogros</h2>
      <span>prévia</span>
    </div>
    <ol className="rightbar-arena__ranking" aria-label="Ranking simulado">
      <li><span>01</span><strong>Godzila</strong><b>94</b></li>
      <li><span>02</span><strong>Monstro do arroto</strong><b>87</b></li>
      <li><span>03</span><strong>Shrek</strong><b>82</b></li>
    </ol>
    <p>Ranking ilustrativo. O juiz tá afinando o ouvido.</p>
    {viewAtual !== 'arena' && <span className="rightbar-arena__link">Conheça a Arena <span aria-hidden="true">→</span></span>}
  </>;

  return (
    <>
      <aside className="rightbar" aria-label="Painel complementar">
      {estaAutenticado && (
        <section className="rightbar-account" aria-label="Minha conta">
          <Link to="/perfil" className="rightbar-account__profile" aria-label="Abrir meu perfil">
            {contaPerfil?.avatarUrl ? <img className="rightbar-account__avatar" src={contaPerfil.avatarUrl} alt="" /> : <span className="rightbar-account__avatar" aria-hidden="true">{iniciaisDaConta}</span>}
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
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" /><path d="M10 21h4" /></svg>
              {naoLidas > 0 && <span className="rightbar-account__count">{naoLidas > 9 ? '9+' : naoLidas}</span>}
            </button>
            {notificacoesAbertas && (
              <section className="rightbar-account__menu" aria-label="Marcações recentes">
                <h2>Marcações</h2>
                {notificacoesDeMencao.length === 0 ? <p>Ninguém marcou você ainda.</p> : <ul>{notificacoesDeMencao.map((notificacao) => <li key={notificacao.id} className={notificacao.lidaEm ? undefined : 'is-unread'}><strong>{notificacao.autor.apelido ?? `@${notificacao.autor.handle ?? 'alguém'}`}</strong> marcou você em um post.</li>)}</ul>}
              </section>
            )}
          </div>
        </section>
      )}

      {viewAtual === 'comunidade' && regrasDaComunidade.length > 0 && (
        <section className="rightbar-context" aria-label="Resumo das regras da comunidade">
          <span>NA COMUNIDADE</span>
          <h2>Regras da casa</h2>
          <ol>
            {regrasDaComunidade.map((regra, indice) => <li key={`${indice}-${regra}`}>{regra}</li>)}
          </ol>
        </section>
      )}

      {viewAtual !== 'comunidade' && (viewAtual === 'arena' ? (
        <section className="rightbar-arena" aria-label="Prévia simulada do ranking da Arena">
          {previaDaArena}
        </section>
      ) : (
        <Link to="/arena/em-breve" className="rightbar-arena" aria-label="Prévia simulada do ranking da Arena, em breve">
          {previaDaArena}
        </Link>
      ))}

      <section className="rightbar-roads" aria-label={tituloDasComunidades}>
        <div className="rightbar-roads__head">
          <h2>{tituloDasComunidades}</h2>
          <Link to="/comunidades">Ver comunidades</Link>
        </div>
        {estadoDasComunidades === 'carregando' ? (
          <p className="rightbar-roads__state">Carregando comunidades…</p>
        ) : estadoDasComunidades === 'erro' ? (
          <p className="rightbar-roads__state">Não deu pra carregar as comunidades agora. {aoTentarComunidades && <button type="button" onClick={aoTentarComunidades}>Tentar de novo</button>}</p>
        ) : comunidadesExibidas.length === 0 ? (
          <p className="rightbar-roads__state">Nenhuma comunidade aberta agora.</p>
        ) : (
          <div className="rightbar-roads__list">
            {comunidadesExibidas.map((comunidade) => (
              <Link key={comunidade.id} className="rightbar-road" to={`/c/${comunidade.slug}`} onClick={() => aoAbrirComunidade(comunidade.slug)}>
                {avatarDaComunidade(comunidade) ? <img src={avatarDaComunidade(comunidade)} alt="" /> : <span aria-hidden="true">{comunidade.icone ?? comunidade.nome.slice(0, 1).toUpperCase()}</span>}
                <div><strong>{comunidade.nome}</strong><small>Comunidade</small></div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <SlotPatrocinado posicionamento="sidebar" />

      <footer className="site-footer site-footer--page">
        <div className="footer-links">
          <Link to="/como-jogar" className="footer-link">Como Jogar</Link>
          <Link to="/ranking-de-arrotos" className="footer-link">Ranking</Link>
          <Link to="/termos" className="footer-link">Termos</Link>
          <Link to="/privacidade" className="footer-link">Privacidade</Link>
        </div>
        <small style={{ color: 'var(--aue-subtle)', display: 'block', marginTop: 12 }}>
          Auê! © 2026. Feito para arrotar com orgulho.
        </small>
      </footer>
      </aside>

      <footer className="site-footer site-footer--mobile">
        <div className="footer-links">
          <Link to="/como-jogar" className="footer-link">Como Jogar</Link>
          <Link to="/ranking-de-arrotos" className="footer-link">Ranking</Link>
          <Link to="/termos" className="footer-link">Termos</Link>
          <Link to="/privacidade" className="footer-link">Privacidade</Link>
        </div>
        <small style={{ color: 'var(--aue-subtle)', display: 'block', marginTop: 12 }}>
          Auê! © 2026. Feito para arrotar com orgulho.
        </small>
      </footer>
    </>
  );
});
