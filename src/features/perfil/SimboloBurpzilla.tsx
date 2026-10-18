import React from 'react';

/**
 * Símbolo de usuário da casa. Só o perfil mostra; o feed e os comentários não.
 * Monocromático (`currentColor`), sem verde, sem pill e sem tooltip. Não indica
 * posição, nota nem ranking.
 */
export const SimboloBurpzilla: React.FC = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="currentColor"
    fillRule="evenodd"
    role="img"
    aria-label="Usuário da casa, Burpzilla"
    focusable="false"
    style={{ flex: 'none', marginLeft: 6, color: 'var(--fg)' }}
  >
    <path d="M6 7l1.5-5 1.5 4 3-5 3 5 1.5-4L18 7a7 7 0 0 1 2 5v8H4v-8a7 7 0 0 1 2-5z M8 11.5a1.5 1.5 0 1 0 3 0 1.5 1.5 0 1 0-3 0z M13 11.5a1.5 1.5 0 1 0 3 0 1.5 1.5 0 1 0-3 0z M8 15h8v2H8z" />
  </svg>
);
