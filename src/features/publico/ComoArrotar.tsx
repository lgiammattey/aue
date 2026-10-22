import React from 'react';

import { CartoesPublicos, LayoutPublico, LinksPublicos, ListaPublica, SecaoPublica } from './LayoutPublico';
import type { ItemDaListaPublica } from './LayoutPublico';

/** As cinco técnicas, na ordem que aparecem na tela. */
const tecnicas: readonly ItemDaListaPublica[] = [
  {
    numero: '01',
    eyebrow: 'Técnica',
    titulo: 'Engole ar, devolve ar',
    texto: [
      'Puxa uma sequência de golinhos de ar pela boca, rápido, um atrás do outro — não é uma golada só, é várias pequenas.',
      'Deixa acumular um instante e solta pela garganta relaxada, sem forçar o peito. As primeiras tentativas saem meia-boca. É normal.',
    ],
  },
  {
    numero: '02',
    eyebrow: 'Atalho',
    titulo: 'Com refrigerante é trapaça? É, e funciona',
    texto: [
      'Bebida com gás já entrega o ar pronto, veio de fábrica. Dá um gole, espera a garganta perceber que tem bolha subindo, e relaxa.',
      'Empurrãozinho: aperta de leve a barriga enquanto solta a garganta. É o caminho mais fácil e ninguém vai te julgar por isso — o Auê julga o som, não o método.',
    ],
  },
  {
    numero: '03',
    eyebrow: 'Postura',
    titulo: 'O corpo ajuda, se você deixar',
    texto: [
      'Sentado ereto ou inclinado pra frente facilita o ar descer e voltar — deitado, o caminho emperra.',
      'Quanto mais você tenta "segurar" pra não sair estranho, mais trava — o pulo do gato é relaxar na hora que a vontade bate, não competir com ela. Uma pressão leve na boca do estômago também ajuda. Não é soco, é cutucão.',
    ],
  },
  {
    numero: '04',
    eyebrow: 'Sequência',
    titulo: 'Arroto renovado',
    texto: [
      'Quando a Arena abrir, ela vai medir duração. Um arroto seco não separa ninguém do resto. Repete os golinhos em sequência, sem parar pra respirar fundo no meio — o efeito é uma cadeia, um arroto grudando no outro.',
      'Treino, não milagre: sai picotado nas primeiras vezes.',
    ],
  },
  {
    numero: '05',
    eyebrow: 'Volume',
    titulo: 'Arrotar alto',
    texto: [
      'Alto é garganta aberta e boca aberta na hora certa. Peito pra frente, queixo um pouco pra cima, e solta sem segurar no meio.',
      'Arroto abafado perde volume. Quando a Arena abrir, isso vai pesar na nota.',
    ],
  },
];

/**
 * `/como-arrotar` — a página que responde a busca que traz gente pro Auê.
 *
 * "como arrotar", "como arrotar de propósito", "como arrotar alto": é isso que
 * as pessoas digitam, e sem esta página o Auê não respondia nada disso.
 * `/como-jogar` explica o Auê; esta explica o ARROTO, pra quem quer aprender, e
 * termina empurrando pra Arena.
 *
 * MESMA MOLDURA DE `/como-jogar`, via `LayoutPublico`.
 * Não é estado da Arena, não muda o loop e não é alcançável de dentro da Arena.
 * Também sem gate `ehDesktop`: é página de busca, lida do celular na maioria
 * das vezes.
 *
 * O QUE ELA NÃO FAZ: conselho médico. Dor, refluxo, azia e tratamento não são
 * território de uma comunidade de arrotadores. Em vez de fingir que o assunto não existe, a
 * página diz com todas as letras que ali o caminho é médico, não Auê.
 *
 * As cinco técnicas são a lista numerada de `ListaPublica`, como no
 * protótipo `Páginas Públicas.dc.html`.
 */
export const ComoArrotar: React.FC = () => (
  <LayoutPublico
    eyebrow="Pra aprender"
    titulo="Como arrotar"
    resumo="Não sabe arrotar? Dá pra aprender. Arroto é ar que entrou e resolveu voltar: a entrada dá pra treinar, o resto o corpo resolve sozinho."
  >
    <SecaoPublica eyebrow="Antes das técnicas" titulo="Tem arroto de ar e tem arroto de estômago">
      <p>Tem dois jeitos de um arroto nascer.</p>

      <CartoesPublicos
        cartoes={[
          {
            titulo: 'Arroto de ar',
            texto: 'É o ar que você engoliu — sobe rápido, sai fácil, e dá pra repetir moral.',
          },
          {
            titulo: 'Arroto de estômago',
            texto:
              'Vem lá de baixo, do gás que já tava rolando no estômago — geralmente por causa de bebida com gás — demora mais pra formar mas costuma sair com mais força.',
          },
        ]}
      />

      <p>Nenhum dos dois é melhor. Quando abrir, a Arena vai julgar o som, não a origem.</p>
    </SecaoPublica>

    <ListaPublica itens={tecnicas} />

    <SecaoPublica eyebrow="Se travar" titulo="E se não sai nada?">
      <p>Tem gente que simplesmente não arrota, e não tem técnica que resolva.</p>
      <p>
        Se forçar dói, incomoda ou vira azia, para — isso é assunto de médico, não de brincadeira. O Auê é
        brincadeira, não consultório.
      </p>
      <p>Aprendeu? A Arena está sendo preparada. Enquanto isso, cola na resenha.</p>
      <LinksPublicos
        links={[
          { para: '/arena', rotulo: 'Conhecer a Arena' },
          { para: '/como-jogar', rotulo: 'Como funciona o Auê' },
        ]}
      />
    </SecaoPublica>
  </LayoutPublico>
);
