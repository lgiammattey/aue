import React, { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';

import './LayoutPublico.css';

const NAVEGACAO_DO_PRODUTO = [
  { para: '/', rotulo: 'Início', icone: '⌂', fim: true },
  { para: '/arena', rotulo: 'Auê Arena', icone: '◉' },
  { para: '/comunidade', rotulo: 'Comunidades', icone: '◎' },
  { para: '/desafios', rotulo: 'Desafios', icone: '↗' },
  { para: '/perfil', rotulo: 'Perfil', icone: '◌' },
] as const;

const ABAS = [
  { para: '/como-jogar', rotulo: 'Como funciona' },
  { para: '/comunidade', rotulo: 'Comunidades' },
  { para: '/como-arrotar', rotulo: 'Como arrotar' },
  { para: '/tipos-de-arroto', rotulo: 'Tipos de arroto' },
  { para: '/ranking-de-arrotos', rotulo: 'Ranking' },
  { para: '/grupos', rotulo: 'Grupos externos' },
  { para: '/videos-de-arroto', rotulo: 'Vídeos' },
] as const;

const classeDaAba = ({ isActive }: { isActive: boolean }) =>
  isActive ? 'publico-nav-link active' : 'publico-nav-link';

const NavegacaoDoProduto: React.FC<{ mobile?: boolean }> = ({ mobile = false }) => (
  <nav className={mobile ? 'publico-navegacao-mobile' : 'publico-nav'} aria-label="Navegação principal">
    {NAVEGACAO_DO_PRODUTO.map((item) => (
      <NavLink key={item.para} to={item.para} end={'fim' in item && item.fim} className={classeDaAba}>
        {!mobile && <span className="publico-icone" aria-hidden="true">{item.icone}</span>}
        <span>{item.rotulo}</span>
      </NavLink>
    ))}
  </nav>
);

export const MolduraPublica: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [menuAberto, setMenuAberto] = useState(false);
  const fechar = () => setMenuAberto(false);

  return (
    <div className="publico-site">
      <header className="publico-topo" onKeyDown={(event) => event.key === 'Escape' && fechar()}>
        <Link className="publico-marca" to="/" aria-label="Auê! início" onClick={fechar}>AUÊ<span>!</span></Link>
        <button type="button" className="publico-menu-botao" aria-label={menuAberto ? 'Fechar menu' : 'Abrir menu'} aria-expanded={menuAberto} aria-controls="menu-publico" onClick={() => setMenuAberto((aberto) => !aberto)}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true"><path d={menuAberto ? 'M5 5l14 14M19 5L5 19' : 'M4 7h16M4 12h16M4 17h16'} /></svg>
        </button>
      </header>
      <nav id="menu-publico" className="publico-menu" aria-label="Menu de páginas" hidden={!menuAberto}>
        <div className="publico-nav">{ABAS.map(({ para, rotulo }) => <NavLink key={para} to={para} className={classeDaAba} onClick={fechar}>{rotulo}</NavLink>)}</div>
      </nav>
      <div className="publico-app-shell">
        <aside className="publico-lateral">
          <Link className="publico-marca" to="/" aria-label="Auê! início">AUÊ<span>!</span></Link>
          <p className="publico-nav-titulo">Índice</p>
          <NavegacaoDoProduto />
          <Link className="publico-acao-arena" to="/arena"><span>Soltar um arroto</span></Link>
          <div className="publico-lateral-inferior"><p className="publico-nav-titulo">Guia do Auê</p><div className="publico-nav">{ABAS.map(({ para, rotulo }) => <NavLink key={para} to={para} className={classeDaAba}>{rotulo}</NavLink>)}</div></div>
        </aside>
        <div className="publico-conteudo">{children}</div>
        <aside className="publico-direita" aria-label="Sobre estas páginas">
          <section className="publico-bloco-lateral"><h2>Sobre o Auê!</h2><p>Uma rede social para arrotadores: grave na Arena, receba sua nota e encontre a resenha certa.</p></section>
          <section className="publico-bloco-lateral"><h2>Guia rápido</h2><nav className="publico-links-laterais" aria-label="Páginas informativas">{ABAS.map(({ para, rotulo }) => <Link key={para} to={para}>{rotulo}</Link>)}</nav></section>
        </aside>
      </div>
      <footer className="publico-rodape"><div className="publico-rodape-inner"><span>© 2026 Auê! · A comunidade de quem gosta de arrotar.</span><nav aria-label="Links institucionais"><Link to="/como-jogar">Como jogar</Link><Link to="/ranking-de-arrotos">Ranking</Link><Link to="/termos">Termos</Link><Link to="/privacidade">Privacidade</Link></nav></div></footer>
      <NavegacaoDoProduto mobile />
    </div>
  );
};

export const LayoutPublico: React.FC<{ eyebrow: string; titulo: string; resumo: string; children: React.ReactNode }> = ({ eyebrow, titulo, resumo, children }) => (
  <MolduraPublica><main className="publico-shell"><section className="publico-hero"><span className="publico-eyebrow">{eyebrow}</span><h1>{titulo}</h1><p>{resumo}</p></section>{children}<section className="publico-cta"><span className="publico-eyebrow">Quer participar?</span><h2>Chega mais.</h2><p>Arrota, aprende ou só vem ouvir. O importante é participar da resenha.</p><Link className="publico-pilula publico-pilula-accent publico-pilula-grande" to="/">Ir pro Auê</Link></section></main></MolduraPublica>
);

export const SecaoPublica: React.FC<{ eyebrow: string; titulo: string; children: React.ReactNode }> = ({ eyebrow, titulo, children }) => <section className="publico-secao"><div className="publico-secao-cabeca"><span className="publico-eyebrow">{eyebrow}</span><h2>{titulo}</h2></div><div className="publico-secao-corpo">{children}</div></section>;
export const CartoesPublicos: React.FC<{ cartoes: ReadonlyArray<{ titulo: string; texto: React.ReactNode }> }> = ({ cartoes }) => <div className="publico-cartoes">{cartoes.map(({ titulo, texto }) => <div className="publico-cartao" key={titulo}><h3>{titulo}</h3><p>{texto}</p></div>)}</div>;
export interface ItemDaListaPublica { numero: string; eyebrow: string; titulo: string; texto: readonly string[]; }
export const ListaPublica: React.FC<{ eyebrow?: string; titulo?: string; itens: readonly ItemDaListaPublica[] }> = ({ eyebrow, titulo, itens }) => <section className="publico-lista">{titulo && <div className="publico-lista-cabeca">{eyebrow && <span className="publico-eyebrow">{eyebrow}</span>}<h2>{titulo}</h2></div>}{itens.map(({ numero, eyebrow: rotulo, titulo: tituloDoItem, texto }) => <article className="publico-item" key={numero}><div className="publico-item-numero">{numero}</div><div className="publico-item-corpo"><span className="publico-eyebrow">{rotulo}</span><h3>{tituloDoItem}</h3>{texto.map((paragrafo) => <p key={paragrafo}>{paragrafo}</p>)}</div></article>)}</section>;
export const LinksPublicos: React.FC<{ links: ReadonlyArray<{ para: string; rotulo: string }> }> = ({ links }) => <div className="publico-links">{links.map(({ para, rotulo }) => <Link className="publico-pilula publico-pilula-clara" to={para} key={para}>{rotulo} →</Link>)}</div>;
