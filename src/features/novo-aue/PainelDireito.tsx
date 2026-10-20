import { memo } from 'react';
import { Link } from 'react-router-dom';
import type { ComunidadeDoForum } from '../../portas/forum';

interface Props {
  readonly comunidades: readonly ComunidadeDoForum[];
  readonly aoAbrirComunidade: (slug: string) => void;
  readonly aoAlternarEntrar?: (slug: string) => void;
  readonly comunidadesEntradas?: Record<string, boolean>;
}

export const PainelDireito = memo(function PainelDireito({
  comunidades,
  aoAbrirComunidade,
  aoAlternarEntrar,
  comunidadesEntradas = {},
}: Props) {
  return (
    <aside className="rightbar" aria-label="Painel complementar">
      <div className="panel">
        <h2>Sobre o Auê!</h2>
        <p>
          A rede social dos arrotadores. Grave na Arena, receba sua nota, conte seus causos e
          conquiste seu lugar nas rodas.
        </p>
      </div>

      <div className="panel">
        <h2>Rodas em alta</h2>
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
                  >
                    {jaEntrou ? 'Participando' : '+ Entrar'}
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>

      <div className="panel">
        <h2>Regras da casa</h2>
        <p style={{ marginBottom: 8 }}>1. Respeite quem está na roda.</p>
        <p style={{ marginBottom: 8 }}>2. Arroto fake ou truque de áudio não passa.</p>
        <p>3. Zoeira liberada, humilhação e preconceito nunca.</p>
      </div>

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
