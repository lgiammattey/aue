import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { AdsterraBanner300x250 } from '../../shared/components/AdsterraBanner300x250';
import './LayoutArenaPublica.css';

export function LayoutArenaPublica({ eyebrow, titulo, resumo, children, mostrarCta = true }: { eyebrow: string; titulo: string; resumo: ReactNode; children: ReactNode; mostrarCta?: boolean }) {
  return <main className="guia-arena">
    <header className="guia-arena__topo"><Link className="guia-arena__marca" to="/">AUÊ<span className="guia-arena__bang">!</span></Link><nav aria-label="Navegação principal"><Link to="/">Início</Link><Link to="/ranking-de-arrotos">Ranking</Link><Link to="/grupos">Grupos Zap</Link></nav></header>
    <div className="guia-arena__miolo">
      <div className="guia-arena__hero"><span>{eyebrow}</span><h1>{titulo}</h1><p>{resumo}</p></div>
      <div className="guia-arena__secoes">{children}</div>
      <AdsterraBanner300x250 />
      {mostrarCta && <section className="guia-arena__cta"><h2>CHEGA DE LER.</h2><p>Abre a Arena e manda o seu.</p><Link to="/">Ir pra Arena ↗</Link></section>}
    </div>
    <footer className="guia-arena__rodape"><Link to="/como-arrotar">Como arrotar</Link><Link to="/como-jogar">Como jogar</Link><Link to="/privacidade">Privacidade</Link><Link to="/termos">Termos</Link></footer>
  </main>;
}
