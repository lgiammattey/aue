import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { definirIdiomaETitulo } from '../../plataforma/web/documento';
import '../../arena/v2/conteudoDaHome.css';
import './LayoutArenaPublica.css';
import './ComoArrotar.css';
import './HomeEn.css';

/**
 * Home em inglês (`/en`). Copy adaptada ao público de língua inglesa, não
 * traduzida. O texto existe em dois lugares que precisam bater: aqui e no
 * `<noscript>` de `paginas/en.html`. `HomeEn.paridade.test.tsx` cobra os dois.
 *
 * Decisão de produto: a página linka a Arena, que continua em PT-BR. A copy diz
 * isso na lata em vez de fingir uma Arena em inglês que ainda não existe.
 */
export const TITULO_DA_HOME_EN = 'Burping Community: How to Burp & Record Yours | Auê';

const TIPOS = [
  { numero: '01', nome: 'The Thunder', criterio: 'Raw impact', descricao: 'Big, dry and deep. The one that stops the conversation at the table.' },
  { numero: '02', nome: 'The Freight Train', criterio: 'Stamina', descricao: 'A long, rolling rumble that keeps going. Past three seconds takes saved-up air and a loose throat.' },
  { numero: '03', nome: 'The Rapid-Fire', criterio: 'Rhythm', descricao: 'A string of short burps, back to back, with no breath in between.' },
  { numero: '04', nome: 'The Talker', criterio: 'Voice control', descricao: 'A word, or the whole alphabet, said mid-burp while the gas is still on its way up.' },
  { numero: '05', nome: 'The Dud', criterio: 'Just air', descricao: "Lots of effort, mostly air. No real vibration, so it doesn't count as a burp." },
] as const;

export function HomeEn() {
  useEffect(() => definirIdiomaETitulo('en', TITULO_DA_HOME_EN), []);

  return (
    <main className="guia-arena home-en">
      <header className="guia-arena__topo">
        <Link className="guia-arena__marca" to="/en" aria-label="Auê home">
          AUÊ<span className="guia-arena__bang">!</span>
        </Link>
        <nav aria-label="Main navigation">
          <a href="#how-to-burp">How to burp</a>
          <a href="#burp-types">Burp types</a>
          <Link to="/" hrefLang="pt-BR" lang="pt-BR">Português</Link>
        </nav>
      </header>

      <div className="guia-arena__miolo">
        <section className="guia-arena__hero como-arrotar-hero">
          <div className="como-arrotar-hero__texto">
            <span>Burping community</span>
            <h1>Burping is a talent. Meet the crew.</h1>
            <p>
              Auê is a free burping community. Learn to burp on command, burp the alphabet, record yours in your browser, and send it to your friends.
            </p>
            <p>Say it ow-WAY. In Brazilian Portuguese it means a loud, happy mess, which is about right.</p>
            <Link className="como-arrotar-hero__cta" to="/">
              Record a burp
            </Link>
            <p className="home-en__aviso">The Arena is in Portuguese for now. The mic works the same in any language.</p>
          </div>
          <div className="como-arrotar-hero__arte">
            <img
              src="/ilustracoes/como-arrotar-comando-codex.png"
              alt="Illustration of a friend in a backwards cap letting out orange sound waves"
            />
          </div>
        </section>

        <div className="guia-arena__secoes">
          <section id="how-to-burp" className="como-arrotar-bloco" aria-labelledby="home-en-how-to-burp">
            <span className="como-arrotar-rotulo">Step by step</span>
            <h2 id="home-en-how-to-burp" className="home-en__titulo">How to burp on command</h2>
            <p className="home-en__intro">Everybody burps. Doing it on purpose takes a little technique. This is the one that works for most people.</p>

            <article className="como-arrotar-passo como-arrotar-passo--simples">
              <div className="como-arrotar-passo__texto">
                <h3>1. Swallow some air</h3>
                <p>Close your mouth, take in a bit of air, and swallow it like an invisible pill. Don't push from your chest. You'll feel it stop high in your throat.</p>
                <p>To let it out, tighten your stomach a little, relax your throat, and open your mouth. If you start feeling bloated or queasy, stop and drink some water.</p>
              </div>
            </article>

            <article className="como-arrotar-passo como-arrotar-passo--simples">
              <div className="como-arrotar-passo__texto">
                <h3>2. Add some fizz</h3>
                <p>Seltzer, soda, root beer or a cold beer (if you're old enough) all build pressure fast. Two or three quick gulps and five seconds sitting up straight is usually plenty. You don't need to chug the whole can.</p>
              </div>
            </article>

            <article className="como-arrotar-passo como-arrotar-passo--simples">
              <div className="como-arrotar-passo__texto">
                <h3>3. For a loud one, sit tall and open your throat</h3>
                <p>Straight back, chest open, neck stretched a little forward. A tight throat muffles the sound, so relax it, push with your stomach, and open up.</p>
                <p><strong>Good sign:</strong> somebody yells "Who was that?"</p>
              </div>
            </article>
          </section>

          <section className="como-arrotar-bloco" aria-labelledby="home-en-four-burps">
            <span className="como-arrotar-rotulo">Styles to master</span>
            <h2 id="home-en-four-burps" className="home-en__titulo">Four burps worth learning</h2>
            <div className="como-arrotar-grade">
              <article className="como-arrotar-card">
                <h3>The long burp</h3>
                <p>Don't dump it all at once. Keep your throat open and let the air out in a slow, steady stream so the sound lasts.</p>
                <p className="como-arrotar-card__sinal"><strong>Good sign:</strong> the table is laughing before you're done.</p>
              </article>
              <article className="como-arrotar-card">
                <h3>The short, loud burp</h3>
                <p>No windup. Gather the air in your throat and let it all go in one hard HRAH.</p>
                <p className="como-arrotar-card__sinal"><strong>Good sign:</strong> you jump a little too.</p>
              </article>
              <article className="como-arrotar-card">
                <h3>The deep burp</h3>
                <p>Drop your chin a bit and keep your mouth less open, so the back of your throat works like a speaker. Don't force your voice, you'll just hurt it.</p>
                <p className="como-arrotar-card__sinal"><strong>Good sign:</strong> people look around to see where that came from.</p>
              </article>
              <article className="como-arrotar-card">
                <h3>How to burp the alphabet</h3>
                <p>The classic. Take in plenty of air (a few gulps of something fizzy help), start one steady burp, and shape the letters with your lips and tongue without cutting off the flow.</p>
                <p className="como-arrotar-card__sinal"><strong>Good sign:</strong> you got past G without gasping.</p>
              </article>
            </div>
          </section>

          <section id="burp-types" className="como-arrotar-bloco" aria-labelledby="home-en-burp-types">
            <span className="como-arrotar-rotulo">The lineup</span>
            <h2 id="home-en-burp-types" className="home-en__titulo">Types of burps</h2>
            <p className="home-en__intro">Which one sounds like yours?</p>
            <ol className="conteudo-home__lista-tipos">
              {TIPOS.map((tipo) => (
                <li key={tipo.numero} className="conteudo-home__tipo-item">
                  <span className="conteudo-home__tipo-num">{tipo.numero}</span>
                  <div className="conteudo-home__tipo-info">
                    <div className="conteudo-home__tipo-topo">
                      <h3>{tipo.nome}</h3>
                      <span>{tipo.criterio}</span>
                    </div>
                    <p>{tipo.descricao}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <section className="como-arrotar-bloco" aria-labelledby="home-en-in-public">
            <span className="como-arrotar-rotulo">Etiquette</span>
            <article className="como-arrotar-passo como-arrotar-passo--simples">
              <div className="como-arrotar-passo__texto">
                <h2 id="home-en-in-public">Burping in public, or not</h2>
                <p>Slipped one out around friends who are in on the joke? Own it. A quick "that one was honest" does the job.</p>
                <p>At a nice dinner, in a meeting, or around anyone who clearly isn't into it, hold it in. If one gets out anyway, "excuse me" still works. Feeling shy about it? Start with your own crew. Every great burper had a first audience.</p>
              </div>
            </article>
          </section>

          <section className="como-arrotar-bloco" aria-labelledby="home-en-what-you-can-do">
            <span className="como-arrotar-rotulo">On Auê</span>
            <article className="como-arrotar-passo como-arrotar-passo--simples">
              <div className="como-arrotar-passo__texto">
                <h2 id="home-en-what-you-can-do">What you can do on Auê</h2>
                <p>Record a burp in your browser. No app to install and no account needed to try it.</p>
                <p>Play it back and check the experimental readout. It's a rough measurement for fun, not an official score.</p>
                <p>Send it to a friend or download it. Your recording stays on your device until you choose to share it.</p>
                <p>Want to hear what the crew posts? The public wall has burps and stories from the community, mostly in Portuguese. Posting takes an account. Auê is for adults, 18 and over.</p>
              </div>
            </article>
          </section>

          <section className="guia-arena__cta" aria-labelledby="home-en-cta">
            <h2 id="home-en-cta">Practiced? Test it on the mic.</h2>
            <p>Open the Arena in your browser, record a burp and play it back. Then send it to someone who'll appreciate it.</p>
            <Link to="/">Record my burp</Link>
          </section>
        </div>
      </div>

      <footer className="guia-arena__rodape">
        <Link to="/" hrefLang="pt-BR" lang="pt-BR">Português</Link>
        <Link to="/privacidade" hrefLang="pt-BR" lang="pt-BR">Privacy (in Portuguese)</Link>
        <Link to="/termos" hrefLang="pt-BR" lang="pt-BR">Terms (in Portuguese)</Link>
      </footer>
    </main>
  );
}
