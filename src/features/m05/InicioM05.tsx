import { Suspense, lazy, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { FLAGS } from '../../shared/flags';
import { AnuncioM05 } from './AnuncioM05';
import type { IdiomaM05 } from './NavegacaoM05';
import './inicioM05.css';

const ResenhaNoInicio = lazy(() => import('./ResenhaNoInicio').then((modulo) => ({ default: modulo.ResenhaNoInicio })));

const textos = {
  pt: {
    clube: 'O clube do arroto',
    titulo: ['SOLTA O', 'ARROTO.', 'CHAMA NO X1.'],
    chamada: 'AUÊ. Aqui, arroto é talento.',
    gravar: 'Arrotar',
    disputas: 'Ver Disputas',
    privacidade: '18+ · Dá pra jogar solo como visitante. Você escolhe se quer publicar.',
    churrasqueira: 'Quatro amigos à mesa num churrasco. O de boné arrota, o amigo do meio se espanta e duas amigas fazem cara de nojo.',
    falas: ['BRÓÓÓÓRP!', 'Caralho!', 'Homens.'],
    passos: [
      ['Arrote', 'Grave e ouça sua tentativa. Mande pro juiz quando estiver pronta.'],
      ['Chame no X1', 'Mande um convite privado. Cada um grava na sua hora.'],
      ['Caia na Resenha', 'Ouça as jogadas que a galera quis compartilhar.'],
    ],
    guia: 'Como funciona',
    entrar: 'Entrar',
    links: [['/como-arrotar', 'Como arrotar'], ['/como-jogar', 'Como jogar'], ['/termos', 'Termos'], ['/privacidade', 'Privacidade']],
  },
  en: {
    clube: 'The burp club',
    titulo: ['LET IT', 'RIP.', 'CALL A FRIEND.'],
    chamada: 'Record a burp, get an experimental score and send a friend a one-on-one challenge.',
    gravar: 'Burp',
    disputas: 'See Battles',
    privacidade: '18+ · Play solo as a guest. You choose what to post.',
    churrasqueira: 'Four friends around a backyard barbecue. The guy in the cap burps, his friend looks startled, and two women look disgusted.',
    falas: ['BUUUUURP!', 'Holy shit!', 'Men.'],
    passos: [
      ['Burp', 'Record and listen back. Send your attempt to the judge when it’s ready.'],
      ['Invite a friend', 'Share a private link and take your turns whenever you’re ready.'],
      ['Join the banter', 'Listen to the clips other players chose to post.'],
    ],
    guia: 'How to play',
    entrar: 'Sign in',
    links: [['#how-to-burp', 'How to burp'], ['#burp-types', 'Burp types'], ['/termos', 'Terms (Portuguese)'], ['/privacidade', 'Privacy (Portuguese)']],
  },
} as const;

export function InicioM05({ idioma = 'pt', comResenha = true, children }: {
  readonly idioma?: IdiomaM05;
  readonly comResenha?: boolean;
  readonly children?: ReactNode;
}) {
  const t = textos[idioma];
  const ingles = idioma === 'en';
  const temDisputas = FLAGS.arenaV2 && FLAGS.dueloV2;
  return (
    <main className="m05-home" lang={ingles ? 'en' : 'pt-BR'}>
      <header className="m05-home__topo">
        <Link className="m05-marca m05-home__marca" to={ingles ? '/en' : '/'} aria-label={ingles ? 'Auê home' : 'Auê, página inicial'}>AUÊ<span>!</span></Link>
        <nav className="m05-home__idioma" aria-label={ingles ? 'Language' : 'Idioma'}>
          <Link to="/" hrefLang="pt-BR" lang="pt-BR" aria-label="Português" aria-current={!ingles ? 'page' : undefined}>PT</Link>
          <Link to="/en" hrefLang="en" lang="en" aria-label="English" aria-current={ingles ? 'page' : undefined}>EN</Link>
        </nav>
        <Link to="/login?modo=entrar" className="m05-home__link">{t.entrar}</Link>
      </header>

      <section className="m05-home__hero" aria-labelledby="m05-home-titulo">
        <div className="m05-home__pitch">
          <p className="m05-home__clube">{t.clube}</p>
          <h1 id="m05-home-titulo">{t.titulo[0]} <em>{t.titulo[1]}</em><br />{' '}{t.titulo[2]}</h1>
          <p>{t.chamada}</p>
          <div className="m05-home__acoes">
            <Link className="m05-home__botao" id="arena" to={ingles ? '/arena?lang=en' : '/arena'}>{t.gravar} <span aria-hidden="true">→</span></Link>
            {temDisputas && <Link className="m05-home__link" to="/disputas">{t.disputas}</Link>}
          </div>
          <p className="m05-home__privacidade">{t.privacidade}</p>
        </div>
        <figure className="m05-home__quadrinho">
          <img src="/ilustracoes/hero-churrasco.webp" width="1360" height="907" fetchPriority="high" alt={t.churrasqueira} />
          <figcaption className="m05-home__baloes">
            {t.falas.map((fala) => <span key={fala}>{fala}</span>)}
          </figcaption>
        </figure>
      </section>

      <AnuncioM05 area="inicio" idioma={idioma} />
      {comResenha && <Suspense fallback={null}><ResenhaNoInicio idioma={idioma} /></Suspense>}

      <div className="m05-home__guia" aria-label={t.guia}>
        {t.passos.map(([titulo, descricao]) => (
          <section key={titulo}><h2>{titulo}</h2><p>{descricao}</p></section>
        ))}
      </div>

      {children}

      <footer className="m05-home__rodape">
        {t.links.map(([url, rotulo]) => url.startsWith('#')
          ? <a key={url} href={url}>{rotulo}</a>
          : <Link key={url} to={url}>{rotulo}</Link>)}
      </footer>
    </main>
  );
}
