import './conteudoDaHome.css';
import { GruposNaHome } from './GruposNaHome';

/** Conteúdo público de descoberta, exibido depois da Arena apenas na página inicial. */
export function ConteudoDaHome() {
  return (
    <div className="conteudo-home" aria-label="Conheça o Auê">
      <div className="conteudo-home__interno">
        <p className="conteudo-home__chamada">O ARROTO É SÓ O COMEÇO</p>
        <section className="conteudo-home__secao">
          <span>01 / O BÁSICO</span><div><h2>Como arrotar?</h2><p>O gás entrou, a garganta abriu e o espetáculo começou. Quer entender de onde vem o barulho e o papel das bolhas nessa história?</p><a href="/como-arrotar">Entenda o arroto <span aria-hidden="true">↗</span></a></div>
        </section>
        <section className="conteudo-home__secao">
          <span>02 / A ARENA</span><div><h2>Como jogar no Auê</h2><p>Microfone na mão, arroto no ar. Grave, ouça sua tentativa e, quando disponível, confira a medição experimental. Curtiu? Compartilhe a obra.</p><a href="/como-jogar">Conheça a Arena <span aria-hidden="true">↗</span></a></div>
        </section>
        <section className="conteudo-home__secao">
          <span>03 / A TROPA</span><div><h2>Grupos de WhatsApp</h2><p>Um arroto desses merece plateia. Encontre a galera nos grupos cadastrados por aqui.</p><GruposNaHome /></div>
        </section>
      </div>
    </div>
  );
}
