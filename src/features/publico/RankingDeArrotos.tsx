import React from 'react';

import { LayoutPublico, LinksPublicos, ListaPublica, SecaoPublica } from './LayoutPublico';
import type { ItemDaListaPublica } from './LayoutPublico';

const faixasDeNota = [
  { pontos: '0–19', veredito: 'Foi isso?', descricao: 'Nem o cachorro ouviu. Faltou ar, faltou garra, sobrou vergonha.' },
  { pontos: '20–39', veredito: 'Tá fraco, hein.', descricao: 'Saiu com som de porta rangendo. Dá pra melhorar sem muito esforço.' },
  { pontos: '40–59', veredito: 'Dá pro gasto.', descricao: 'Arroto mediano de almoço de família. Não passa vergonha, mas não ganha X1.' },
  { pontos: '60–74', veredito: 'Aí sim, porra.', descricao: 'Arroto de respeito. Vibrou a garganta e impôs respeito na sala.' },
  { pontos: '75–84', veredito: 'Caralho, veio forte.', descricao: 'Potência acima da média. Entra fácil no ranking do Bonde do Arroto.' },
  { pontos: '85–94', veredito: 'Tá maluco.', descricao: 'Estrondo de tremer janela. Oponente no X1 já começa a tremer na base.' },
  { pontos: '95–99', veredito: 'Esse bagulho tá apelão.', descricao: 'Nível quase sobre-humano. Duração longa e potência de show de rock.' },
  { pontos: '100', veredito: 'Tá roubado. Não é possível.', descricao: 'A lenda. Alinhamento planetário do estômago com a acústica perfeita.' },
];

const faixas: readonly ItemDaListaPublica[] = faixasDeNota.map(({ pontos, veredito, descricao }) => ({
  numero: pontos,
  eyebrow: 'Faixa oficial',
  titulo: veredito,
  texto: [descricao],
}));

/**
 * `/ranking-de-arrotos` — a tabela de notas da Arena e como a nota é calculada.
 *
 * Responde a buscas como "ranking de arrotos" e "nota de arroto". Os recordes
 * mundiais de decibéis saíram desta página: eram números de terceiros que a
 * gente não conferiu, e texto sem fonte não fica aqui. Se voltarem, voltam
 * com a fonte do registro.
 */
export const RankingDeArrotos: React.FC = () => (
  <LayoutPublico
    eyebrow="Notas e vereditos"
    titulo="Ranking e notas de arroto"
    resumo="Como a Arena dá a nota de 0 a 100 e o que cada faixa quer dizer."
  >
    <ListaPublica eyebrow="A escala de 0 a 100" titulo="A tabela de vereditos do Auê" itens={faixas} />

    <SecaoPublica eyebrow="Sem sorteio" titulo="Como a Arena calcula a nota">
      <p>
        Não tem roleta nem botão de compra de nota. Um modelo de inteligência artificial (YAMNet),
        rodando no navegador do seu celular, confere se o áudio é mesmo um arroto e descarta palmas,
        assobios, fala e ruído de vento.
      </p>
      <p>
        Depois mede a potência máxima, o tempo de sustentação e o equilíbrio dos graves. Com a nota
        na mão, você publica na comunidade, chama alguém pro X1 ou arrota de novo.
      </p>
      <LinksPublicos
        links={[
          { para: '/como-jogar', rotulo: 'Como funciona o X1' },
          { para: '/tipos-de-arroto', rotulo: 'Qual é o seu estilo de arroto' },
        ]}
      />
    </SecaoPublica>
  </LayoutPublico>
);
