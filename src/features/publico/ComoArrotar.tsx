import React from 'react';
import { LinksPublicos, SecaoPublica } from './LayoutPublico';
import { LayoutArenaPublica as LayoutPublico } from './LayoutArenaPublica';

export const ComoArrotar: React.FC = () => (
  <LayoutPublico eyebrow="Manual do arroto" titulo="Como arrotar" resumo="O corpo juntou gás, a garganta abriu e pronto: nasceu um arroto. Mas de onde vem esse barulho todo?">
    <SecaoPublica eyebrow="A origem" titulo="Por que a gente arrota?">
      <p>Ao comer e beber, a gente também engole ar. Parte dele resolve fazer o caminho de volta pela boca — com direito a trilha sonora. Algumas pessoas liberam ar antes mesmo de ele chegar ao estômago.</p>
      <p>As bolhas do refrigerante também entram no jogo: bebidas com gás podem favorecer um arroto. Mas cada corpo tem seu jeito, então nada de esperar uma sirene a cada gole.</p>
    </SecaoPublica>
    <SecaoPublica eyebrow="Sem pressão" titulo="Como arrotar de propósito?">
      <p>Não tem botão secreto nem técnica garantida. Se a vontade bater, relaxa e deixa acontecer. Engolir ar sem parar, apertar a barriga ou exagerar na bebida não precisa entrar no campeonato.</p>
      <p>Saiu um digno de replay? Na Arena você grava, ouve e decide se quer compartilhar a obra.</p>
      <LinksPublicos links={[{ para: '/arena', rotulo: 'Ir para a Arena' }]} />
    </SecaoPublica>
    <SecaoPublica eyebrow="Dúvidas comuns" titulo="Arroto preso ou dificuldade para arrotar">
      <p>Se a barriga estiver estufada, uma caminhada leve pode ajudar. Mandar mais gás pra dentro pode piorar o desconforto — o refri não é tratamento pra arroto preso.</p>
      <p>Se a dificuldade for frequente ou vier com dor, azia, perda de peso ou outros sintomas que preocupam, procure orientação médica. Aqui a gente leva o arroto a sério; saúde, mais ainda.</p>
    </SecaoPublica>
    <SecaoPublica eyebrow="Referências" titulo="Fontes da resenha">
      <p>Pra não tirar explicação do nada, consultamos o <a href="https://www.niddk.nih.gov/health-information/digestive-diseases/gas-digestive-tract/symptoms-causes">NIDDK</a> e o <a href="https://www.nhs.uk/symptoms/bloating/">NHS</a>.</p>
      <LinksPublicos links={[{ para: '/como-jogar', rotulo: 'Como funciona o Auê' }, { para: '/feed', rotulo: 'Ver o mural' }]} />
    </SecaoPublica>
  </LayoutPublico>
);
