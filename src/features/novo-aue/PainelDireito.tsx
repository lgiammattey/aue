import { memo } from 'react';
import { Link } from 'react-router-dom';
import { ADSTERRA_CONFIG, anunciosAdsterraHabilitados } from '../../plataforma/web/adsterra';
import type { ComunidadeDoForum } from '../../portas/forum';
import type { PerfilPublico } from '../../portas/perfil';

interface Props {
  readonly comunidades: readonly ComunidadeDoForum[];
  readonly aoAbrirComunidade: (slug: string) => void;
  readonly aoAlternarEntrar?: (slug: string) => void;
  readonly comunidadesEntradas?: Record<string, boolean>;
  readonly viewAtual?: 'feed' | 'seguindo' | 'auth' | 'perfil' | 'comunidade' | 'comunidades';
  readonly moderadoresDaComunidade?: readonly (readonly [string, string])[];
  readonly regrasDaComunidade?: readonly string[];
  readonly perfil?: PerfilPublico | null;
}

export const PainelDireito = memo(function PainelDireito({
  comunidades,
  aoAbrirComunidade,
  aoAlternarEntrar,
  comunidadesEntradas = {},
  viewAtual = 'feed',
  moderadoresDaComunidade = [],
  regrasDaComunidade = [],
  perfil,
}: Props) {
  return (
    <aside className="rightbar" aria-label="Painel complementar">
      {viewAtual === 'comunidade' && (
        <>
          <div className="panel">
            <h2>Moderadores</h2>
            {moderadoresDaComunidade.map(([handle, papel]) => (
              <div key={handle} style={{ fontSize: 13, padding: '4px 0' }}>
                <strong>{handle}</strong>
                <span style={{ color: 'var(--aue-subtle)', display: 'block', fontSize: 11 }}>
                  {papel}
                </span>
              </div>
            ))}
          </div>

          <div className="panel">
            <h2>Regras rápidas</h2>
            <ol style={{ paddingLeft: 18, margin: 0, fontSize: 13, color: 'var(--aue-muted)' }}>
              {regrasDaComunidade.map((r, i) => (
                <li key={i} style={{ marginBottom: 6 }}>
                  {r}
                </li>
              ))}
            </ol>
          </div>
        </>
      )}

      {viewAtual === 'perfil' && (
        <div className="panel">
          <h2>Sobre esta ficha</h2>
          {perfil ? (
            <p>{perfil.souEu ? 'Esta é sua ficha pública no Auê.' : `Acompanhe os posts publicados por @${perfil.handle}.`}</p>
          ) : <p>Os dados desta ficha aparecem aqui quando ela carregar.</p>}
        </div>
      )}

      {viewAtual !== 'comunidade' && viewAtual !== 'perfil' && (
        <div className="panel">
          <h2>Sobre o Auê!</h2>
          <p>
            A rede social dos arrotadores. Grave na Arena, receba sua nota, compartilhe seus posts e
            conquiste seu lugar nas rodas.
          </p>
        </div>
      )}

      <div className="panel">
        <h2>Rodas para explorar</h2>
        {comunidades.length === 0 ? (
          <p>Carregando rodas…</p>
        ) : (
          comunidades.slice(0, 5).map((c) => {
            const jaEntrou = Boolean(comunidadesEntradas[c.slug]);
            return (
              <div key={c.id} className="community">
                <Link
                  to={`/c/${c.slug}`}
                  onClick={() => aoAbrirComunidade(c.slug)}
                  style={{ textDecoration: 'none', color: 'inherit', flex: 1 }}
                >
                  <strong>r/{c.slug}</strong>
                  <small>{c.nome}</small>
                </Link>
                {aoAlternarEntrar && (
                  <button
                    type="button"
                    className="join"
                    onClick={() => aoAlternarEntrar(c.slug)}
                    disabled={Boolean(c.possoGerirMidia)}
                    title={c.possoGerirMidia ? 'Você modera essa comunidade' : jaEntrou ? 'Sair da comunidade' : undefined}
                    aria-label={c.possoGerirMidia ? `Você modera r/${c.slug}` : jaEntrou ? `Participando de r/${c.slug}. Tocar para sair.` : `Entrar em r/${c.slug}`}
                  >
                    {c.possoGerirMidia ? 'Moderador' : jaEntrou ? 'Participando' : '+ Entrar'}
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>

      {anunciosAdsterraHabilitados && <div className="panel adsterra-smartlink-panel">
        <span
          style={{
            fontSize: '11px',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: 'var(--aue-accent, #c6ff00)',
            fontWeight: 700,
          }}
        >
          Parceiro da Tropa
        </span>
        <h2 style={{ marginTop: 4 }}>Combustível Oficial 🍺</h2>
        <p style={{ fontSize: 13, color: 'var(--aue-muted)' }}>
          Mantenha o gás e a pressão em dia. Acesse ofertas parceiras e apoie o Auê!
        </p>
        <a
          href={ADSTERRA_CONFIG.smartlinkUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="join"
          style={{
            display: 'inline-block',
            textAlign: 'center',
            marginTop: 10,
            textDecoration: 'none',
            width: '100%',
            boxSizing: 'border-box',
          }}
        >
          Conferir ofertas parceiras ↗
        </a>
      </div>}

      {viewAtual !== 'comunidade' && (
        <div className="panel">
          <h2>Regras da casa</h2>
          <p style={{ marginBottom: 8 }}>1. Respeite quem está na roda.</p>
          <p style={{ marginBottom: 8 }}>2. Arroto fake ou truque de áudio não passa.</p>
          <p>3. Zoeira liberada, humilhação e preconceito nunca.</p>
        </div>
      )}

      <footer className="site-footer" style={{ marginTop: 24 }}>
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
  );
});
