import React from 'react';
import { Link } from 'react-router-dom';

import { LayoutPublico, SecaoPublica } from './LayoutPublico';
import { IconeTrofeu, IconeDecibel, IconeVolume } from './IconesTecnica';

const faixasDeNota = [
  { pontos: '0 – 19', veredito: 'Foi isso?', descricao: 'Nem o cachorro ouviu. Faltou ar, faltou garra, sobrou vergonha.' },
  { pontos: '20 – 39', veredito: 'Tá fraco, hein.', descricao: 'Saiu com som de porta rangendo. Dá pra melhorar sem muito esforço.' },
  { pontos: '40 – 59', veredito: 'Dá pro gasto.', descricao: 'Arroto mediano de almoço de família. Não passa vergonha, mas não ganha X1.' },
  { pontos: '60 – 74', veredito: 'Aí sim, porra.', descricao: 'Arroto de respeito. Vibrou a garganta e impôs respeito na sala.' },
  { pontos: '75 – 84', veredito: 'Caralho, veio forte.', descricao: 'Potência acima da média. Entra fácil no ranking do Bonde do Arroto.' },
  { pontos: '85 – 94', veredito: 'Tá maluco.', descricao: 'Estrondo de tremer janela. Oponente no X1 já começa a tremer na base.' },
  { pontos: '95 – 99', veredito: 'Esse bagulho tá apelão.', descricao: 'Nível quase sobre-humano. Duração longa e potência de show de rock.' },
  { pontos: '100', veredito: 'Tá roubado. Não é possível.', descricao: 'A lenda. Alinhamento planetário do estômago com a acústica perfeita.' },
];

/**
 * `/ranking-de-arrotos` — Tabela oficial de notas do Auê e recordes mundiais.
 *
 * Responde a buscas como "ranking de arrotos", "recorde mundial de arroto",
 * "arroto mais alto do mundo" e "decibéis de arroto".
 */
export const RankingDeArrotos: React.FC = () => (
  <LayoutPublico
    eyebrow="Competição & Estatísticas"
    titulo="Ranking e Recordes de Arroto"
    resumo="Qual é o arroto mais alto registrado na história humana? E como o juiz do Auê avalia sua nota de 0 a 100? Conheça os números do Guinness, as faixas oficiais de pontuação e veja onde o seu arroto se posiciona."
  >
    <SecaoPublica eyebrow="História & Guinness" titulo="Os maiores recordes mundiais de decibéis">
      <p>
        O livro dos recordes mundiais (Guinness World Records) audita e homologa arrotos desde os
        anos 1990 usando medidores de pressão sonora calibrados a 2,5 metros de distância. Os
        números assustam:
      </p>

      <div className="publico-dois-tipos">
        <div className="publico-tipo-card">
          <IconeTrofeu />
          <h3>Neville Sharp (Austrália) · 112,4 dB</h3>
          <p>
            Em 2021, o australiano atingiu 112,4 decibéis — mais alto que uma britadeira elétrica em
            operação ou um show de heavy metal na primeira fila.
          </p>
        </div>
        <div className="publico-tipo-card">
          <IconeDecibel />
          <h3>Kimberly Winter (EUA) · 107,3 dB</h3>
          <p>
            Em 2023, a americana bateu o recorde mundial feminino em uma estação de rádio,
            superando o som de uma motocicleta em aceleração máxima.
          </p>
        </div>
      </div>

      <p>
        O lendário britânico Paul Hunn manteve o trono por mais de uma década com 109,9 dB (2009).
        Para comparar: uma conversa normal fica em 60 dB; um arroto comum de mesa fica em torno de 70 a 80 dB.
      </p>
    </SecaoPublica>

    <section className="desktop-shell desktop-section publico-section">
      <div className="publico-section-head">
        <span className="desktop-eyebrow">A escala de 0 a 100</span>
        <h2>A tabela de vereditos do Auê</h2>
      </div>

      <div className="publico-tecnicas">
        {faixasDeNota.map(({ pontos, veredito, descricao }) => (
          <article className="desktop-step desktop-step-icone" key={pontos}>
            <IconeVolume />
            <span>{pontos}</span>
            <p className="publico-tecnica-eyebrow">Faixa oficial</p>
            <h3>{veredito}</h3>
            <p>{descricao}</p>
          </article>
        ))}
      </div>
    </section>

    <SecaoPublica eyebrow="Sem sorteio" titulo="Como o algoritmo calcula sua pontuação">
      <p>
        No Auê não tem roleta nem botão de compra de nota. O motor utiliza o modelo de inteligência
        artificial YAMNet rodando 100% no navegador do seu celular:
      </p>
      <p>
        <strong>1. Reconhecimento acústico:</strong> A rede neural verifica se o áudio captado é de
        fato um arroto humano (rejeita palmas, assobios, falas comuns e ruídos de vento).
      </p>
      <p>
        <strong>2. Análise espectral:</strong> O som é decomposto em tempo real para medir a potência
        máxima (RMS), tempo de sustentação ininterrupta e equilíbrio de frequências graves.
      </p>
      <p>
        <strong>3. Duelo X1:</strong> Com a nota calculada, você pode desafiar um amigo por link no
        WhatsApp. O placar confronta as métricas e define quem paga a próxima rodada.
      </p>
    </SecaoPublica>

    <div className="desktop-shell publico-extra">
      <p>Pronto para testar sua capacidade pulmonar?</p>
      <Link to="/como-jogar">Como funciona a disputa no X1 ↗</Link>
      <Link to="/tipos-de-arroto">Descubra qual é o seu estilo de arroto ↗</Link>
    </div>
  </LayoutPublico>
);
