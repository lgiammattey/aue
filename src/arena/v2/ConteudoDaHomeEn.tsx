import './conteudoDaHome.css';

/** English copy for the public home. Recording and measurement remain in the Arena. */
export function ConteudoDaHomeEn() {
  return <div className="conteudo-home" aria-label="Auê guide">
    <div className="conteudo-home__interno">
      <section className="conteudo-home__bloco" aria-labelledby="home-burp-guide">
        <div className="conteudo-home__cabeca">
          <span>THE BURP GUIDE</span><h2 id="home-burp-guide">How to burp</h2>
          <p>From a quick little burp to an all-out rumble, everyone's got a style.</p>
        </div>
        <div className="conteudo-home__passo"><div className="conteudo-home__passo-texto">
          <span className="conteudo-home__etiqueta">01 · LET IT OUT</span>
          <h3>Find your sound</h3><p>Relax, take your time, and let it happen. If anything feels uncomfortable, stop.</p>
        </div><img className="conteudo-home__arte" src="/ilustracoes/como-arrotar-comando-codex.png" alt="Illustration of a person making sound waves" loading="lazy" /></div>
      </section>
      <section className="conteudo-home__bloco" aria-labelledby="home-burp-types">
        <div className="conteudo-home__cabeca"><span>THE LINEUP</span><h2 id="home-burp-types">Types of burps</h2><p>Which one sounds like yours?</p></div>
        <ol className="conteudo-home__lista-tipos">
          {[
            ['01', 'The Thunder', 'A deep, sudden blast that stops the conversation.'],
            ['02', 'The Tractor', 'A long rumble that just keeps going.'],
            ['03', 'The Burst', 'A rapid-fire string of short burps.'],
            ['04', 'The Talker', 'Words, or even the alphabet, delivered mid-burp.'],
            ['05', 'The Hollow Puff', 'Plenty of effort, not much sound.'],
          ].map(([number, name, description]) => <li key={number} className="conteudo-home__tipo-item"><span className="conteudo-home__tipo-num">{number}</span><div className="conteudo-home__tipo-info"><div className="conteudo-home__tipo-topo"><h3>{name}</h3></div><p>{description}</p></div></li>)}
        </ol>
      </section>
    </div>
  </div>;
}
