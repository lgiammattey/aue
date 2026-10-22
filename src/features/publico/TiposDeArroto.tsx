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
      'Quando a Arena abrir, força e graves vão pesar bastante na nota.',
    ],
  },
  {
    numero: '02',
    eyebrow: 'Resistência',
    titulo: 'O Trator',
    texto: [
      'Vibração rítmica e contínua que parece um motor a diesel dando partida na subida. Não é o mais estridente, mas não acaba nunca.',
      'Quando a Arena abrir, duração vai contar bastante. Manter o fluxo contínuo por mais de 3 segundos exige ar de estômago e garganta totalmente relaxada.',
    ],
  },
  {
    numero: '03',
    eyebrow: 'Cadência',
    titulo: 'A Rajada',
    texto: [
      'Uma sequência picotada de mini-arrotos em rajada, um colado atrás do outro sem respirar no meio. O famoso efeito metralhadora.',
      'Quando a Arena abrir, a sequência contínua vai entrar na análise. Pra nota valer, não pode haver pausa pra respirar.',
    ],
  },
  {
    numero: '04',
    eyebrow: 'Controle vocal',
    titulo: 'O Fraseado',
    texto: [
      'A arte lendária de modular as cordas vocais para falar uma palavra inteira (ou o alfabeto) enquanto o gás sobe.',
      'Quando a Arena abrir, a textura sonora vai entrar na análise. O juiz vai avaliar a clareza da frequência vocal sobreposta à turbulência do ar.',
    ],
  },
  {
    numero: '05',
    eyebrow: 'O desastre',
    titulo: 'O Sopro Oco',
    texto: [
      'Muito esforço pra quase nada. O ar sai como um vento fino, sem atrito nas cordas vocais e sem impacto na caixa torácica. O famoso arroto fantasma.',
      'Quando a Arena abrir, só ar passando não vai virar nota. O motor nem vai validar como arroto.',
    ],
  },
];

/**
 * `/tipos-de-arroto` — Guia público de estilos e física acústica do arroto.
 *
 * Responde a buscas como "tipos de arroto", "nomes de arroto", "sons de arroto"
 * e "classificação de arroto", explicando o que a Arena vai avaliar quando abrir.
 */
export const TiposDeArroto: React.FC = () => (
  <LayoutPublico
    eyebrow="Estilos & Acústica"
    titulo="Tipos de arroto"
    resumo="Nem todo arroto é igual. Tem o que racha parede, o que parece trator e o sopro oco que não assusta ninguém. Conheça as cinco variantes que a Arena vai avaliar quando abrir."
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
        Quando a Arena abrir, o algoritmo acústico vai julgar quatro métricas: <strong>duração</strong>{' '}
        (tempo de sustentação), <strong>potência</strong> (amplitude do sinal),{' '}
        <strong>profundidade</strong> (frequências sub-graves) e <strong>textura</strong>{' '}
        (aspereza espectral).
      </p>
    </SecaoPublica>

    <ListaPublica eyebrow="As cinco categorias" titulo="Os cinco estilos" itens={tipos} />

    <SecaoPublica eyebrow="Dicas" titulo="Pra guardar pra Arena">
      <p>
        Quando a Arena abrir, três detalhes mecânicos vão fazer diferença:
      </p>
      <p>
        <strong>1. Distância do microfone:</strong> Deixe o celular a cerca de 10 a 15 centímetros da
        boca. Falar colado na cápsula distorce o som (clipping) e pode reduzir a nota de textura; longe
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
          { para: '/ranking-de-arrotos', rotulo: 'Entender as notas da Arena' },
        ]}
      />
    </SecaoPublica>
  </LayoutPublico>
);
