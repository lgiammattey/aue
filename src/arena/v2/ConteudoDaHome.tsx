import './conteudoDaHome.css';
import { AdsterraBanner300x250 } from '../../shared/components/AdsterraBanner300x250';
import { GruposNaHome } from './GruposNaHome';

/** Conteúdo público de descoberta, exibido depois da Arena apenas na página inicial. */
export function ConteudoDaHome() {
  return (
    <div className="conteudo-home" aria-label="Conheça o Auê">
      <div className="conteudo-home__interno">
        <p className="conteudo-home__chamada">MAIS DO AUÊ</p>

        <section className="conteudo-home__secao" aria-label="Mural da Tropa">
          <span>MURAL</span>
          <div>
            <h2>O que a galera mandou</h2>
            <p>Áudios, notas e X1 ao vivo.</p>
            <a className="conteudo-home__cta-mural" href="/feed">
              Abrir Mural <span aria-hidden="true">↗</span>
            </a>
          </div>
        </section>

        <div className="conteudo-home__anuncio">
          <AdsterraBanner300x250 />
        </div>

        <section className="conteudo-home__secao" aria-label="Grupos de WhatsApp">
          <span>NO ZAP</span>
          <div>
            <h2>Grupos de WhatsApp</h2>
            <GruposNaHome />
          </div>
        </section>

        <nav className="conteudo-home__seo" aria-label="Manual e guias do Auê">
          <span className="conteudo-home__chamada">GUIAS</span>
          <ul className="conteudo-home__seo-links">
            <li><a href="/como-arrotar">Como arrotar: alto, longo, explosivo e grave</a></li>
            <li><a href="/tipos-de-arroto">Tipos de arroto: do Trovão ao Trator</a></li>
            <li><a href="/ranking-de-arrotos">Ranking e avaliação de arrotos</a></li>
            <li><a href="/como-jogar">Como funciona a Arena e o Mural</a></li>
            <li><a href="/grupos">Diretório de grupos de WhatsApp</a></li>
          </ul>
        </nav>
      </div>
    </div>
  );
}
