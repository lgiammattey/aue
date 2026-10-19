import React from 'react';
import { Link, NavLink } from 'react-router-dom';

import '../../shared/publico/tema-claro.css';
import './LayoutPublico.css';

/**
 * A moldura das páginas públicas de conteúdo: `/como-jogar`, `/como-arrotar`,
 * `/tipos-de-arroto`, `/ranking-de-arrotos`, `/grupos` e `/videos-de-arroto`.
 *
 * O DESENHO VEM DE `docs/design/prototipo/Páginas Públicas.dc.html`
 * ----------------------------------------------------------------
 * Base clara e esverdeada, Archivo pesada nos títulos (sem Anton em caixa
 * alta), abas em pílula no topo, seções em duas colunas separadas por linha,
 * listas numeradas em vez de grade de cards e uma faixa final verde-escura.
 * É a direção "roda de amigos" do Auê: a intensidade preta com verde elétrico
 * fica pra Arena.
 *
 * O tema é sempre claro aqui, de propósito. Os tokens são redefinidos no
 * escopo de `.publico-site` (ver `LayoutPublico.css`), então nada vaza pro app.
 *
 * Quem chega por busca abre do celular: nada aqui depende de tela larga.
 *
 * NENHUM ESTADO DA ARENA NASCE AQUI: esta moldura vive fora da máquina de
 * estados.
 */

const ABAS: ReadonlyArray<{ para: string; rotulo: string }> = [
  { para: '/como-jogar', rotulo: 'Como jogar' },
  { para: '/como-arrotar', rotulo: 'Como arrotar' },
  { para: '/tipos-de-arroto', rotulo: 'Tipos de arroto' },
  { para: '/ranking-de-arrotos', rotulo: 'Ranking' },
  { para: '/grupos', rotulo: 'Grupos' },
  { para: '/videos-de-arroto', rotulo: 'Vídeos' },
];

const classeDaAba = ({ isActive }: { isActive: boolean }) =>
  isActive ? 'publico-aba publico-aba-ativa' : 'publico-aba';

/**
 * Topo com abas e rodapé, sem hero nem faixa final. É o que as páginas de
 * conteúdo e os documentos legais têm em comum.
 */
export const MolduraPublica: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="publico-site">
    <header className="publico-topo">
      <div className="publico-shell publico-topo-inner">
        <Link className="publico-marca" to="/" aria-label="Auê! início">
          auê<span>!</span>
        </Link>
        <nav className="publico-abas" aria-label="Navegação">
          {ABAS.map(({ para, rotulo }) => (
            <NavLink key={para} to={para} className={classeDaAba}>
              {rotulo}
            </NavLink>
          ))}
        </nav>
        <Link className="publico-pilula publico-pilula-escura" to="/login">
          Entrar
        </Link>
      </div>
    </header>

    {children}

    <footer className="publico-rodape">
      <div className="publico-shell publico-rodape-inner">
        <span>© 2026 Auê! · Competição de arroto levada a sério demais.</span>
        <nav aria-label="Links institucionais">
          <Link to="/como-jogar">Como jogar</Link>
          <Link to="/como-arrotar">Como arrotar</Link>
          <Link to="/tipos-de-arroto">Tipos de arroto</Link>
          <Link to="/ranking-de-arrotos">Ranking</Link>
          <Link to="/comunidade">Bonde & Comunidades</Link>
          <Link to="/grupos">Grupos</Link>
          <Link to="/videos-de-arroto">Vídeos</Link>
          <Link to="/privacidade">Política de privacidade</Link>
          <Link to="/termos">Termos de uso</Link>
        </nav>
      </div>
    </footer>
  </div>
);

export const LayoutPublico: React.FC<{
  /** Vai acima do H1. Curto, no tom do jogo. */
  eyebrow: string;
  /** O H1 da página. */
  titulo: string;
  /** O parágrafo de abertura, logo abaixo do H1. */
  resumo: string;
  children: React.ReactNode;
}> = ({ eyebrow, titulo, resumo, children }) => (
  <MolduraPublica>
    <main className="publico-shell">
      <section className="publico-hero">
        <span className="publico-eyebrow">{eyebrow}</span>
        <h1>{titulo}</h1>
        <p>{resumo}</p>
      </section>

      {children}

      <section className="publico-cta">
        <span className="publico-eyebrow">Chega de ler</span>
        <h2>Agora entra na competição.</h2>
        <p>Pega o celular, solta o primeiro arroto e arruma alguém pra tentar bater tua nota.</p>
        <Link className="publico-pilula publico-pilula-grande publico-pilula-accent" to="/">
          Arrotar agora
        </Link>
      </section>
    </main>
  </MolduraPublica>
);

/**
 * Uma seção de conteúdo: eyebrow + h2 numa coluna, o corpo na outra. Em tela
 * estreita as duas colunas empilham sozinhas (grid `auto-fit`).
 */
export const SecaoPublica: React.FC<{
  eyebrow: string;
  titulo: string;
  children: React.ReactNode;
}> = ({ eyebrow, titulo, children }) => (
  <section className="publico-secao">
    <div className="publico-secao-cabeca">
      <span className="publico-eyebrow">{eyebrow}</span>
      <h2>{titulo}</h2>
    </div>
    <div className="publico-secao-corpo">{children}</div>
  </section>
);

/** Cartões curtos lado a lado, dentro do corpo de uma `SecaoPublica`. */
export const CartoesPublicos: React.FC<{
  cartoes: ReadonlyArray<{ titulo: string; texto: React.ReactNode }>;
}> = ({ cartoes }) => (
  <div className="publico-cartoes">
    {cartoes.map(({ titulo, texto }) => (
      <div className="publico-cartao" key={titulo}>
        <h3>{titulo}</h3>
        <p>{texto}</p>
      </div>
    ))}
  </div>
);

export interface ItemDaListaPublica {
  numero: string;
  eyebrow: string;
  titulo: string;
  texto: readonly string[];
}

/**
 * A lista numerada (técnicas, estilos, faixas de nota): número grande em verde
 * escuro à esquerda, texto à direita, uma linha entre cada item.
 */
export const ListaPublica: React.FC<{
  eyebrow?: string;
  titulo?: string;
  itens: readonly ItemDaListaPublica[];
}> = ({ eyebrow, titulo, itens }) => (
  <section className="publico-lista">
    {titulo && (
      <div className="publico-lista-cabeca">
        {eyebrow && <span className="publico-eyebrow">{eyebrow}</span>}
        <h2>{titulo}</h2>
      </div>
    )}
    {itens.map(({ numero, eyebrow: eyebrowDoItem, titulo: tituloDoItem, texto }) => (
      <article className="publico-item" key={numero}>
        <div className="publico-item-numero">{numero}</div>
        <div className="publico-item-corpo">
          <span className="publico-eyebrow">{eyebrowDoItem}</span>
          <h3>{tituloDoItem}</h3>
          {texto.map((paragrafo) => (
            <p key={paragrafo}>{paragrafo}</p>
          ))}
        </div>
      </article>
    ))}
  </section>
);

/** Pílulas de "veja também" no fim de uma seção. */
export const LinksPublicos: React.FC<{
  links: ReadonlyArray<{ para: string; rotulo: string }>;
}> = ({ links }) => (
  <div className="publico-links">
    {links.map(({ para, rotulo }) => (
      <Link className="publico-pilula publico-pilula-clara" to={para} key={para}>
        {rotulo} →
      </Link>
    ))}
  </div>
);
