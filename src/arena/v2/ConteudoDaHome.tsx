import './conteudoDaHome.css';
import { AdsterraBanner300x250 } from '../../shared/components/AdsterraBanner300x250';
import { GruposNaHome } from './GruposNaHome';

/** Conteúdo público de descoberta, exibido depois da Arena apenas na página inicial. */
export function ConteudoDaHome() {
  return (
    <div className="conteudo-home" aria-label="Conheça o Auê">
      <div className="conteudo-home__interno">
        <p className="conteudo-home__chamada">O ARROTO É SÓ O COMEÇO</p>

        <section className="conteudo-home__secao" aria-label="Mural da Tropa">
          <span>MURAL DA TROPA · TUDO NUM LUGAR SÓ</span>
          <div>
            <h2>Arrotos, notas, vídeos e resenha</h2>
            <p>
              Todo o acervo do Auê num fluxo único: ouça a galera, confira as notas de 0 a 100 e solte seu áudio direto no Mural.
            </p>
            <a className="conteudo-home__cta-mural" href="/feed">
              Abrir o Mural completo <span aria-hidden="true">↗</span>
            </a>
          </div>
        </section>

        <div className="conteudo-home__anuncio">
          <AdsterraBanner300x250 />
        </div>

        <section className="conteudo-home__secao" aria-label="Grupos de WhatsApp">
          <span>A TROPA NO ZAP</span>
          <div>
            <h2>Grupos de WhatsApp</h2>
            <p>Um arroto desses merece plateia. Encontre a galera nos grupos cadastrados por aqui.</p>
            <GruposNaHome />
          </div>
        </section>

        <nav className="conteudo-home__seo" aria-label="Manual e guias do Auê">
          <span className="conteudo-home__chamada">MANUAL &amp; GUIAS DO AUÊ</span>
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
