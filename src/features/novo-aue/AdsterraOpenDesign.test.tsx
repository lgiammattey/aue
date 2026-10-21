// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PainelDireito } from './PainelDireito';

describe('Adsterra no OpenDesign — placements ficam desligados até publicação explícita', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    document.querySelectorAll('script[data-aue-adsterra]').forEach((el) => el.remove());
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it('não exibe Smartlink externo sem a flag de publicação', () => {
    render(
      <MemoryRouter>
        <PainelDireito
          comunidades={[]}
          aoAbrirComunidade={() => {}}
          viewAtual="feed"
        />
      </MemoryRouter>
    );

    expect(screen.queryByText('Combustível Oficial 🍺')).toBeNull();
  });
});
