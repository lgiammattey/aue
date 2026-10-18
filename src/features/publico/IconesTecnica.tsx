import React from 'react';

/**
 * Ícones das técnicas de `/como-arrotar`.
 *
 * Mesma linguagem visual dos ícones que já existem no jogo (os cinco ícones de
 * lugar na roda, o ícone de "tirar participante" em `AbrirARoda.tsx`):
 * `viewBox="0 0 24 24"`, sem preenchimento, traço de 2px, pontas e junções
 * arredondadas. A cor não vem daqui — quem usa o ícone decide via `color` no
 * CSS (ver `.desktop-step-icone svg` e `.publico-tipo-card svg` em
 * `LayoutPublico.css`).
 */
const propsBase = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
};

/** Golinhos em sequência: três chevrons empilhados descendo. */
export const IconeGolinhos: React.FC = () => (
  <svg {...propsBase}>
    <path d="M8 3l4 4 4-4" />
    <path d="M8 9l4 4 4-4" />
    <path d="M8 15l4 4 4-4" />
  </svg>
);

/** Bebida com gás: uma lata e as bolhas subindo. */
export const IconeLata: React.FC = () => (
  <svg {...propsBase}>
    <rect x="5" y="6" width="10" height="14" rx="2" />
    <path d="M5 10h10" />
    <circle cx="18" cy="15" r="1" />
    <circle cx="19.5" cy="10.5" r="1" />
    <circle cx="17.5" cy="6.5" r="1" />
  </svg>
);

/** Postura: corpo inclinado pra frente. */
export const IconePostura: React.FC = () => (
  <svg {...propsBase}>
    <circle cx="9" cy="5" r="2" />
    <path d="M9 7l5 8" />
    <path d="M14 15l3 5" />
    <path d="M11 9l5 3" />
  </svg>
);

/** Sequência: duas setas fechando um círculo, repetição. */
export const IconeRepeticao: React.FC = () => (
  <svg {...propsBase}>
    <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
    <path d="M21 3v5h-5" />
    <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
    <path d="M3 21v-5h5" />
  </svg>
);

/** Volume: alto-falante com os arcos de som crescendo. */
export const IconeVolume: React.FC = () => (
  <svg {...propsBase}>
    <path d="M4 9v6h4l5 4V5L8 9H4Z" />
    <path d="M16 8a5 5 0 0 1 0 8" />
    <path d="M18.5 5.5a9 9 0 0 1 0 13" />
  </svg>
);

/** Trovão: raio descendo com impacto acústico. */
export const IconeTrovao: React.FC = () => (
  <svg {...propsBase}>
    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
  </svg>
);

/** Trator / Motor: engrenagem ou pulso mecânico contínuo. */
export const IconeTrator: React.FC = () => (
  <svg {...propsBase}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);

/** Rajada / Pulsos curtos: três traços paralelos de impacto. */
export const IconeRajada: React.FC = () => (
  <svg {...propsBase}>
    <line x1="3" y1="6" x2="21" y2="6" />
    <line x1="7" y1="12" x2="17" y2="12" />
    <line x1="5" y1="18" x2="19" y2="18" />
  </svg>
);

/** Sopro / Vento disperso: linhas de ar fluindo sem impacto. */
export const IconeSopro: React.FC = () => (
  <svg {...propsBase}>
    <path d="M17.7 7.7a2.5 2.5 0 1 1 1.8 4.3H2" />
    <path d="M9.6 4.6A2 2 0 1 1 11 8H2" />
    <path d="M12.6 19.4A2 2 0 1 0 14 16H2" />
  </svg>
);

/** Troféu / Pódio: taça de vencedor. */
export const IconeTrofeu: React.FC = () => (
  <svg {...propsBase}>
    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
    <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
    <path d="M4 22h16" />
    <path d="M10 14.66V17c0 .55-.45 1-1 1H8v4h8v-4h-1c-.55 0-1-.45-1-1v-2.34" />
    <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
  </svg>
);

/** Decibel / Medidor de som: barra com indicadores. */
export const IconeDecibel: React.FC = () => (
  <svg {...propsBase}>
    <path d="M12 2v20" />
    <path d="M17 5v14" />
    <path d="M22 9v6" />
    <path d="M7 5v14" />
    <path d="M2 9v6" />
  </svg>
);

