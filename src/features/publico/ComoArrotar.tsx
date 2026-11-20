import React from 'react';
import { Link } from 'react-router-dom';
import { SecaoPublica } from './LayoutPublico';
import { LayoutArenaPublica as LayoutPublico } from './LayoutArenaPublica';

export const ComoArrotar: React.FC = () => (
  <LayoutPublico eyebrow="Manual do arroto" titulo="Como arrotar" resumo={<strong>Todo mundo arrota. Alguns fazem história.</strong>} mostrarCta={false}>
    <div className="publico-secao">
      <div aria-hidden="true" />
      <div className="publico-secao-corpo">
        <p>Tem o arroto que sai de fininho e tem aquele que interrompe a conversa, assusta o cachorro e deixa a mesa inteira em silêncio por dois segundos.</p>
        <p>Se você quer conhecer seu estilo, perder a vergonha e mandar um arroto digno de replay, chegou ao lugar certo.</p>
      </div>
    </div>
    <SecaoPublica eyebrow="" titulo="Primeiro: deixa o bicho vir">
      <p>Arroto não é miojo: não fica pronto só porque você quer.</p>
      <p>Às vezes ele vem depois de um gole de refrigerante. Às vezes aparece do nada, no meio de uma frase importante. Quando sentir que tá chegando, relaxa, abre espaço e deixa sair.</p>
      <p>Não precisa virar uma garrafa de refri, engolir ar até ficar estufado ou apertar a barriga. A ideia é dar risada, não passar mal.</p>
      <p>Agora vamos às modalidades.</p>
    </SecaoPublica>
    <SecaoPublica eyebrow="" titulo="Arroto alto: o que chama atenção">
      <p>Esse é pra quando você quer que o outro lado da sala saiba que alguma coisa aconteceu.</p>
      <p>Quando sentir o arroto chegando, abre a boca, relaxa a garganta e deixa o som sair sem tentar segurar. Depois, olhe para os lados com a tranquilidade de quem não ouviu nada.</p>
      <p><strong>Bom sinal:</strong> alguém pergunta “quem foi?”.</p>
    </SecaoPublica>
    <SecaoPublica eyebrow="" titulo="Arroto longo: o que não acaba nunca">
      <p>O longo é aquele que começa como um arroto normal e, quando você acha que terminou, ele continua. E continua.</p>
      <p>Se vier um arroto comprido, tenta manter a garganta relaxada e deixa ele seguir no tempo dele. Não precisa forçar pra arrancar mais um segundo: quando acabar, acabou.</p>
      <p><strong>Bom sinal:</strong> a galera começa a rir antes de você terminar.</p>
    </SecaoPublica>
    <SecaoPublica eyebrow="" titulo="Arroto explosivo: curto e grosso">
      <p>Não tem preparação, não tem discurso. É um <strong>RÁ</strong> e acabou.</p>
      <p>O explosivo geralmente pega todo mundo desprevenido — inclusive quem arrotou. Quando vier, deixa sair de uma vez e segura a pose.</p>
      <p><strong>Bom sinal:</strong> você se assusta junto com o resto da mesa.</p>
    </SecaoPublica>
    <SecaoPublica eyebrow="" titulo="Arroto grave: o trovão de dentro">
      <p>Esse é o arroto com voz de quem acabou de acordar e já tem boleto pra pagar.</p>
      <p>Quando vier um mais encorpado, relaxa a garganta e deixa o som sair natural. Cada pessoa tem seu timbre; não precisa forçar a voz ou a garganta pra imitar motor de caminhão.</p>
      <p><strong>Bom sinal:</strong> alguém olha em volta procurando de onde veio o barulho.</p>
    </SecaoPublica>
    <SecaoPublica eyebrow="" titulo="Como perder a vergonha de arrotar em público">
      <p>Primeiro: arrotou sem querer? Acontece. Não precisa pedir desculpa como se tivesse derrubado a mesa inteira.</p>
      <p>Se estiver entre amigos que entram na brincadeira, assume a autoria. Um “esse veio sincero” já resolve. Vergonha é não reconhecer uma obra quando ela sai.</p>
      <p>Agora, se estiver num jantar formal, numa reunião ou do lado de alguém que claramente não curte, usa o bom senso. O macho sem vergonha também sabe ler o ambiente.</p>
      <p>E se você ainda fica tímido, começa na sua turma. Todo grande profissional do arroto já teve sua primeira plateia.</p>
    </SecaoPublica>
    <section className="guia-arena__cta">
      <h2>Treinou? Quero ouvir.</h2>
      <p>Agora que você conhece as modalidades, é hora de descobrir qual é a sua especialidade.</p>
      <p>Grava seu arroto na Arena, ouve o resultado e, se a obra merecer plateia, compartilha com a galera.</p>
      <Link to="/">Gravar meu arroto</Link>
    </section>
  </LayoutPublico>
);
