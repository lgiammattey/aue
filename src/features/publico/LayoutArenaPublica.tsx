import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import './LayoutArenaPublica.css';

export function LayoutArenaPublica({ eyebrow, titulo, resumo, children }: { eyebrow: string; titulo: string; resumo: string; children: ReactNode }) {
  return <main className="guia-arena">
    <header className="guia-arena__topo"><Link className="guia-arena__marca" to="/">AUÊ!</Link><nav aria-label="Navegação principal"><Link to="/">Arena</Link><Link to="/grupos">Grupos de WhatsApp</Link><Link to="/feed">Mural</Link></nav></header>
    <div className="guia-arena__miolo"><div className="guia-arena__placar"><span>GUIA DO AUÊ</span><span>SEM CERIMÔNIA</span></div>
      <div className="guia-arena__hero"><span>{eyebrow}</span><h1>{titulo}</h1><p>{resumo}</p></div>
      <div className="guia-arena__secoes">{children}</div>
      <section className="guia-arena__cta"><span>CHEGA DE TEORIA</span><h2>Bora fazer barulho?</h2><p>A Arena está aberta. O próximo arroto é seu.</p><Link to="/">Gravar meu arroto ↗</Link></section>
    </div>
    <footer className="guia-arena__rodape"><Link to="/como-arrotar">Como arrotar</Link><Link to="/como-jogar">Como jogar</Link><Link to="/privacidade">Privacidade</Link><Link to="/termos">Termos</Link></footer>
  </main>;
}
