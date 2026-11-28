import { Link, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import { areaDaNavegacaoM05 } from './areaDaNavegacaoM05';
import './navegacaoM05.css';

const destinos = [
  { id: 'inicio', caminho: '/', en: '/en', label: ['Início', 'Home'], icone: 'M3 10.5 12 3l9 7.5V21h-6v-6H9v6H3z' },
  { id: 'resenha', caminho: '/feed', label: ['Resenha', 'Hangout'], icone: 'M21 11.5a8.5 8.5 0 0 1-8.5 8.5H4l1.6-4A8.5 8.5 0 1 1 21 11.5ZM8 10h9m-9 4h6' },
  { id: 'arrotar', caminho: '/arena', en: '/arena?lang=en', label: ['Arrotar', 'Burp'], icone: 'M9 5a3 3 0 0 1 6 0v6a3 3 0 0 1-6 0zM5 10v1a7 7 0 0 0 14 0v-1m-7 8v4m-4 0h8' },
  { id: 'disputas', caminho: '/disputas', label: ['Disputas', 'Battles'], icone: 'M14.5 17.5 21 11l-2.5-2.5L12 15M3 21l7-7m7-11-7 7m-7 1 10 10m-9-2 3-3m10-7 3-3M4 4l16 16M3 3l4 1-3 3z' },
  { id: 'perfil', caminho: '/perfil', label: ['Perfil', 'Profile'], icone: 'M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0ZM4 21v-1a8 8 0 0 1 16 0v1' },
] as const;

export type IdiomaM05 = 'pt' | 'en';

export function NavegacaoM05({ mobile = false, idioma = 'pt' }: { readonly mobile?: boolean; readonly idioma?: IdiomaM05 }) {
  const { pathname } = useLocation();
  const area = areaDaNavegacaoM05(pathname.replace(/\/+$/, '') || '/');
  return (
    <nav className={`m05-nav${mobile ? ' m05-nav--mobile' : ''}`} aria-label={idioma === 'en' ? 'Main navigation' : 'Navegação principal'}>
      {destinos.map((destino) => (
        <Link
          key={destino.id}
          to={idioma === 'en' && 'en' in destino ? destino.en : destino.caminho}
          className={`m05-nav__link${destino.id === 'arrotar' ? ' m05-nav__link--arrotar' : ''}`}
          aria-current={area === destino.id ? 'page' : undefined}
        >
          <span className="m05-nav__icone">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
              <path d={destino.icone} />
            </svg>
          </span>
          <span>{destino.label[idioma === 'en' ? 1 : 0]}</span>
        </Link>
      ))}
    </nav>
  );
}

export function MolduraM05({ idioma = 'pt', children }: { readonly idioma?: IdiomaM05; readonly children: ReactNode }) {
  return (
    <div className="m05-moldura">
      <aside className="m05-moldura__lateral">
        <Link className="m05-marca" to={idioma === 'en' ? '/en' : '/'} aria-label={idioma === 'en' ? 'Auê home' : 'Auê, página inicial'}>AUÊ<span>!</span></Link>
        <NavegacaoM05 idioma={idioma} />
      </aside>
      <div className="m05-moldura__miolo">{children}</div>
    </div>
  );
}
