import React from 'react';
import { Link } from 'react-router-dom';
import { LayoutArenaPublica as LayoutPublico } from './LayoutArenaPublica';
import './ComoArrotar.css';

export const ComoArrotar: React.FC = () => (
  <LayoutPublico
    eyebrow=""
    titulo=""
    resumo=""
    mostrarCta={false}
    ocultarHeroPadrao
  >
    <section className="guia-arena__hero como-arrotar-hero">
      <div className="como-arrotar-hero__texto">
        <span>Manual prático</span>
        <h1>Como arrotar</h1>
        <p>
          <strong>Todo mundo arrota. Alguns fazem no comando e com técnica.</strong>{' '}
          Aprende a engolir ar no seco, puxar mais volume e duração, mandar o alfabeto e testar direto no microfone.
        </p>
        <Link className="como-arrotar-hero__cta" to="/">
          Testar no microfone
        </Link>
      </div>
      <div className="como-arrotar-hero__arte">
        <img
          src="/ilustracoes/como-arrotar-comando-codex.png"
          alt="Ilustração estilizada de amigo de boné pra trás soltando ondas sonoras laranja"
        />
      </div>
    </section>

    <div className="guia-arena__secoes">
      <section className="como-arrotar-bloco" aria-label="Passo a passo">
        <span className="como-arrotar-rotulo">Passo a passo</span>

        <article className="como-arrotar-passo como-arrotar-passo--simples">
          <div className="como-arrotar-passo__texto">
            <span className="como-arrotar-passo__num">Passo 01</span>
            <h2>Como arrotar de propósito (no comando)</h2>
            <p>Pra não depender só da sorte depois do almoço, o truque clássico é engolir ar no seco.</p>
            <p>Fecha a boca, junta um pouco de ar e engole como se fosse uma pílula invisível, sem forçar o peito. Você vai sentir o ar parar ali no alto da garganta.</p>
            <p>Na hora de soltar, contrai leve a barriga, abre a boca e relaxa a garganta pro som sair encorpado. A ideia é dar risada, não passar mal: se ficar estufado, para e toma água.</p>
          </div>
        </article>

        <article className="como-arrotar-passo">
          <div className="como-arrotar-passo__texto">
            <span className="como-arrotar-passo__num">Passo 02</span>
            <h2>Bebida com gás: o combustível certo</h2>
            <p>Água com gás, refri ou cerveja gelada dão pressão no estômago na hora.</p>
            <p>Não precisa virar uma garrafa inteira de uma vez. Dois ou três goles rápidos e cinco segundos de coluna reta já juntam gás suficiente pra soltar um arroto limpo.</p>
          </div>
          <div className="como-arrotar-passo__arte">
            <img
              src="/ilustracoes/como-arrotar-gas-codex.png"
              alt="Ilustração estilizada de amigo em postura reta com garrafa de bebida com gás soltando bolhas laranja"
              loading="lazy"
            />
          </div>
        </article>

        <article className="como-arrotar-passo como-arrotar-passo--invertido">
          <div className="como-arrotar-passo__texto">
            <span className="como-arrotar-passo__num">Passo 03</span>
            <h2>Arroto alto: postura e garganta solta</h2>
            <p>Esse é pra quando você quer que o outro lado da sala escute.</p>
            <p>Coluna reta, peito aberto e uma esticada leve no pescoço pra frente. Garganta dura abafa o som, então relaxa, empurra com a barriga e abre a boca.</p>
            <p><strong>Bom sinal:</strong> alguém pergunta “quem foi?”.</p>
          </div>
          <div className="como-arrotar-passo__arte">
            <img
              src="/ilustracoes/como-arrotar-postura-codex.png"
              alt="Ilustração estilizada de turma de amigos rindo enquanto um solta ondas sonoras laranja"
              loading="lazy"
            />
          </div>
        </article>
      </section>

      <section className="como-arrotar-bloco" aria-label="Estilos e variações">
        <span className="como-arrotar-rotulo">Estilos pra dominar</span>
        <div className="como-arrotar-grade">
          <article className="como-arrotar-card">
            <h2>Arroto longo: segurar e dosar o ar</h2>
            <p>Aqui não pode soltar tudo num estouro só: mantém a garganta aberta e vai dosando a saída com a barriga aos poucos pro som durar vários segundos.</p>
            <p className="como-arrotar-card__sinal"><strong>Bom sinal:</strong> a galera começa a rir antes de você terminar.</p>
          </article>

          <article className="como-arrotar-card">
            <h2>Arroto explosivo: curto e grosso</h2>
            <p>Sem enrolação. É um <strong>RÁ</strong> seco e acabou. Junta o ar na garganta e solta tudo de uma pancada só.</p>
            <p className="como-arrotar-card__sinal"><strong>Bom sinal:</strong> você se assusta junto com o resto da mesa.</p>
          </article>

          <article className="como-arrotar-card">
            <h2>Arroto grave: o trovão de dentro</h2>
            <p>Pra puxar o grave, abaixa um pouco o queixo e deixa a boca menos aberta, usando o fundo da garganta como caixa de som, sem forçar a voz pra não machucar.</p>
            <p className="como-arrotar-card__sinal"><strong>Bom sinal:</strong> alguém olha em volta procurando de onde veio o barulho.</p>
          </article>

          <article className="como-arrotar-card">
            <h2>Truque clássico: como arrotar o alfabeto</h2>
            <p>Junta bastante ar (ou manda uns goles de bebida com gás), solta um arroto contínuo e vai mexendo lábios e língua pra formar as letras sem cortar o fluxo.</p>
            <p className="como-arrotar-card__sinal"><strong>Bom sinal:</strong> passou do G sem perder o fôlego.</p>
          </article>
        </div>
      </section>

      <section className="como-arrotar-bloco" aria-label="Etiqueta">
        <span className="como-arrotar-rotulo">Regras de convivência</span>
        <article className="como-arrotar-passo como-arrotar-passo--simples">
          <div className="como-arrotar-passo__texto">
            <h2>Como perder a vergonha de arrotar em público</h2>
            <p>Escapou um entre amigos que entram na zoeira? Assume na hora: um “esse veio sincero” já resolve. Vergonha é não assumir uma obra quando ela sai.</p>
            <p>Num jantar formal, reunião ou perto de quem claramente não curte, segura a onda. E se ainda trava, começa na sua turma: todo mundo que manda bem já teve primeira plateia.</p>
          </div>
        </article>
      </section>

      <section className="guia-arena__cta">
        <h2>Treinou? Testa agora no microfone.</h2>
        <p>Não precisa baixar app nem criar conta. Abre a Arena direto no navegador, grava seu arroto, ouve o replay e confere a medição experimental na hora.</p>
        <p>Se a obra merecer plateia, manda pra galera.</p>
        <Link to="/">Gravar meu arroto</Link>
      </section>
    </div>
  </LayoutPublico>
);
