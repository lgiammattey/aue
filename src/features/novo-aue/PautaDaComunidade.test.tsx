// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { PautaAbertaDaComunidade } from './PautaDaComunidade';

describe('PautaDaComunidade', () => {
  it('mantém as entradas como nós originais e oferece retorno', () => {
    const voltar = vi.fn();
    render(<PautaAbertaDaComunidade titulo="Mural da vergonha" entradas={[<article key="post-1">Post original</article>]} aoVoltar={voltar} />);
    expect(screen.getByText('Post original')).toBeTruthy();
    screen.getByRole('button', { name: 'Voltar' }).click();
    expect(voltar).toHaveBeenCalledOnce();
  });
});
