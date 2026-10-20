// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { AdsterraNativeBanner } from './AdsterraNativeBanner';

describe('AdsterraNativeBanner — bloco de anúncio nativo integrado ao feed', () => {
  beforeEach(() => {
    document.querySelectorAll('script[data-aue-adsterra]').forEach((el) => el.remove());
  });

  it('não injeta placement externo sem a flag explícita de publicação', () => {
    render(<AdsterraNativeBanner />);

    expect(screen.queryByText('Patrocinado')).toBeNull();
    expect(document.querySelector('script[data-aue-adsterra="native"]')).toBeNull();
  });
});
