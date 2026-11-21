import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { marcarPaginaNaoIndexavel } from '../../plataforma/web/documento';
import { MolduraPublica } from './LayoutPublico';

/** Rota que o Auê não conhece: diz isso, em vez de mandar a pessoa para a home calada. */
export function TelaNaoEncontrada() {
  useEffect(() => marcarPaginaNaoIndexavel('Página não encontrada · Auê!'), []);

  return (
    <MolduraPublica>
      <section className="publico-shell">
        <section className="publico-hero">
          <span className="publico-eyebrow">404</span>
          <h1>Página não encontrada.</h1>
          <p>Esse link não existe ou sumiu.</p>
          <p>
            <Link to="/">Voltar ao início</Link> · <Link to="/ranking-de-arrotos">Ver ranking</Link>
          </p>
        </section>
      </section>
    </MolduraPublica>
  );
}
