import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { marcarPaginaNaoIndexavel } from '../../plataforma/web/documento';
import { MolduraPublica } from './LayoutPublico';

/** Rota que o Auê não conhece: diz isso, em vez de mandar a pessoa para a home calada. */
export function TelaNaoEncontrada() {
  useEffect(() => marcarPaginaNaoIndexavel('Página não encontrada · Auê!'), []);

  return (
    <MolduraPublica>
      <main className="publico-shell">
        <section className="publico-hero">
          <span className="publico-eyebrow">Erro 404</span>
          <h1>Página não encontrada.</h1>
          <p>Esse endereço não existe no Auê, ou o conteúdo foi removido.</p>
          <p>
            <Link to="/">Voltar para o Bonde</Link> · <Link to="/comunidades">Ver comunidades</Link>
          </p>
        </section>
      </main>
    </MolduraPublica>
  );
}
