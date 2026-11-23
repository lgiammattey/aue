import React from 'react';
import { Link } from 'react-router-dom';
import { CascaInformativaOpenDesign } from '../novo-aue/CascaInformativaOpenDesign';

import './LayoutPublico.css';

export const MolduraPublica: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <CascaInformativaOpenDesign>{children}</CascaInformativaOpenDesign>;
};

export const LayoutPublico: React.FC<{ eyebrow: string; titulo: string; resumo: string; children: React.ReactNode }> = ({ eyebrow, titulo, resumo, children }) => (
  <MolduraPublica><section className="publico-shell"><section className="publico-hero"><span className="publico-eyebrow">{eyebrow}</span><h1>{titulo}</h1><p>{resumo}</p></section>{children}<section className="publico-cta"><h2>Chega de ler.</h2><p>Abre o mic e manda o seu.</p><Link className="publico-pilula publico-pilula-accent publico-pilula-grande" to="/">Ir pra Arena</Link></section></section></MolduraPublica>
);

export const SecaoPublica: React.FC<{
  eyebrow: string;
  titulo: string;
  ilustracao?: { src: string; alt: string };
  children: React.ReactNode;
}> = ({ eyebrow, titulo, ilustracao, children }) => (
  <section className="publico-secao">
    <div className="publico-secao-cabeca">
      <span className="publico-eyebrow">{eyebrow}</span>
      <h2>{titulo}</h2>
      {ilustracao && (
        <img
          className="publico-ilustracao"
          src={ilustracao.src}
          alt={ilustracao.alt}
          loading="lazy"
        />
      )}
    </div>
    <div className="publico-secao-corpo">{children}</div>
  </section>
);
export const CartoesPublicos: React.FC<{ cartoes: ReadonlyArray<{ titulo: string; texto: React.ReactNode }> }> = ({ cartoes }) => <div className="publico-cartoes">{cartoes.map(({ titulo, texto }) => <div className="publico-cartao" key={titulo}><h3>{titulo}</h3><p>{texto}</p></div>)}</div>;
export interface ItemDaListaPublica { numero: string; eyebrow: string; titulo: string; texto: readonly string[]; }
export const ListaPublica: React.FC<{ eyebrow?: string; titulo?: string; itens: readonly ItemDaListaPublica[] }> = ({ eyebrow, titulo, itens }) => <section className="publico-lista">{titulo && <div className="publico-lista-cabeca">{eyebrow && <span className="publico-eyebrow">{eyebrow}</span>}<h2>{titulo}</h2></div>}{itens.map(({ numero, eyebrow: rotulo, titulo: tituloDoItem, texto }) => <article className="publico-item" key={numero}><div className="publico-item-numero">{numero}</div><div className="publico-item-corpo"><span className="publico-eyebrow">{rotulo}</span><h3>{tituloDoItem}</h3>{texto.map((paragrafo) => <p key={paragrafo}>{paragrafo}</p>)}</div></article>)}</section>;
export const LinksPublicos: React.FC<{ links: ReadonlyArray<{ para: string; rotulo: string }> }> = ({ links }) => <div className="publico-links">{links.map(({ para, rotulo }) => <Link className="publico-pilula publico-pilula-clara" to={para} key={para}>{rotulo} →</Link>)}</div>;
