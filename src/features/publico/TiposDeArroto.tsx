import React from 'react';

import { CartoesPublicos, LayoutPublico, LinksPublicos, ListaPublica, SecaoPublica } from './LayoutPublico';
import type { ItemDaListaPublica } from './LayoutPublico';

const tipos: readonly ItemDaListaPublica[] = [
  {
    numero: '01',
    eyebrow: 'Impacto bruto',
    titulo: 'O Trovão',
    texto: [
      'Volume absurdo, impacto seco e ressonância grave no peito. É o arroto clássico de quem bebeu meio copo de cerveja de uma vez e soltou tudo sem filtro.',
      'Na pontuação do Auê: bate no teto de potência sonora e profundidade de graves. Se passar de 85 decibéis reais no celular, já briga pelo pódio da rodada.',
    ],
  },
  {
    numero: '02',
    eyebrow: 'Resistência',
    titulo: 'O Trator',
    texto: [
      'Vibração rítmica e contínua que parece um motor a diesel dando partida na subida. Não é o mais estridente, mas não acaba nunca.',
      'Na pontuação do Auê: pontua altíssimo no critério de duração. Manter o fluxo contínuo por mais de 3 segundos exige ar de estômago e garganta totalmente relaxada.',
    ],
  },
  {
    numero: '03',
    eyebrow: 'Cadência',
    titulo: 'A Rajada',
    texto: [
      'Uma sequência picotada de mini-arrotos em rajada, um colado atrás do outro sem respirar no meio. O famoso efeito metralhadora.',
      'Na pontuação do Auê: o classificador acústico reconhece a cadeia de repetição contínua. Para a nota valer, a sequência não pode ter pausa para respirar.',
    ],
  },
  {
    numero: '04',
    eyebrow: 'Controle vocal',
    titulo: 'O Fraseado',
    texto: [
      'A arte lendária de modular as cordas vocais para falar uma palavra inteira (ou o alfabeto) enquanto o gás sobe.',
      'Na pontuação do Auê: a textura sonora ganha riqueza harmônica. O juiz de IA avalia a clareza da frequência vocal sobreposta à turbulência do ar.',
    ],
  },
  {
    numero: '05',
    eyebrow: 'O desastre',
    titulo: 'O Sopro Oco',
    texto: [
      'Muito esforço pra quase nada. O ar sai como um vento fino, sem atrito nas cordas vocais e sem impacto na caixa torácica. O famoso arroto fantasma.',
      'Na pontuação do Auê: cai direto na primeira faixa (0 a 19 pontos, "Foi isso?"). Se o microfone captar só ar passando, o motor nem valida como arroto.',
    ],
  },
];

/**
 * `/tipos-de-arroto` — Guia público de estilos e física acústica do arroto.
 *
 * Responde a buscas como "tipos de arroto", "nomes de arroto", "sons de arroto"
 * e "classificação de arroto", convertendo curiosidade em desafio na Arena.
 */
export const TiposDeArroto: React.FC = () => (
  <LayoutPublico
    eyebrow="Estilos & Acústica"
    titulo="Tipos de arroto"
    resumo="Nem todo arroto é igual. Tem arroto que racha parede, tem arroto que parece trator e tem aquele sopro oco que não assusta ninguém. Conheça as cinco variantes principais e como cada uma pontua no juiz do Auê."
  >
    <SecaoPublica eyebrow="Como o som se forma" titulo="O que separa um trovão de um sopro">
      <p>
        O som do arroto é o resultado do gás sob pressão passando pelo esfíncter esofágico superior,
        fazendo a mucosa e as cordas vocais vibrarem.
      </p>

      <CartoesPublicos
        cartoes={[
          {
            titulo: 'Arroto de ar engolido',
            texto:
              'Vem do ar atmosférico preso no esôfago. Sobe rápido e seco, perfeito para rajadas curtas e técnicas de velocidade.',
          },
          {
            titulo: 'Arroto de fermentação',
            texto:
              'Gás carbônico concentrado no estômago (refrigerante ou cerveja). Pressão muito maior, gerando graves profundos e duração prolongada.',
          },
        ]}
      />

      <p>
        No Auê, o algoritmo acústico julga quatro métricas reais: <strong>duração</strong> (tempo de
        sustentação), <strong>potência</strong> (amplitude do sinal),{' '}
        <strong>profundidade</strong> (frequências sub-graves) e <strong>textura</strong>{' '}
        (aspereza espectral).
      </p>
    </SecaoPublica>

    <ListaPublica eyebrow="As cinco categorias" titulo="Os estilos no campo de batalha" itens={tipos} />

    <SecaoPublica eyebrow="Dicas da bancada" titulo="Como tirar nota máxima na Arena">
      <p>
        Para transformar qualquer tipo de arroto em nota alta no Auê, três detalhes mecânicos fazem
        a diferença:
      </p>
      <p>
        <strong>1. Distância do microfone:</strong> Deixe o celular a cerca de 10 a 15 centímetros da
        boca. Falar colado na cápsula distorce o som (clipping) e reduz a nota de textura; longe
        demais perde potência.
      </p>
      <p>
        <strong>2. Não abafe a boca:</strong> Arroto com a mão na frente vira som oco. Solte com o
        queixo erguido e a boca bem aberta para o som ressoar no ambiente.
      </p>
      <p>
        <strong>3. Solte sem frear no meio:</strong> Qualquer hesitação quebra a onda sonora e
        derruba o cálculo de duração contínua.
      </p>
      <p>Quer treinar a técnica antes de mandar ver?</p>
      <LinksPublicos
        links={[
          { para: '/como-arrotar', rotulo: 'Guia passo a passo de como arrotar' },
          { para: '/ranking-de-arrotos', rotulo: 'Ver tabela oficial de notas e recordes' },
        ]}
      />
    </SecaoPublica>
  </LayoutPublico>
);
