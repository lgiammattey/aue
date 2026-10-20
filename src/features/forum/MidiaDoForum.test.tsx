// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AcessoriosDoComposer, CartaoDeMidia, videoDoForum } from './MidiaDoForum';

describe('vídeo do fórum', () => {
  it('só transforma URLs conhecidas em iframe seguro', () => {
    expect(videoDoForum('https://youtu.be/dQw4w9WgXcQ')?.urlDeEmbed).toContain('youtube-nocookie.com/embed/dQw4w9WgXcQ');
    expect(videoDoForum('https://evil.example/embed')).toBeNull();
  });

  it('não carrega vídeo antes da escolha explícita e mantém a pessoa no Auê', () => {
    const midia = videoDoForum('https://www.youtube.com/watch?v=dQw4w9WgXcQ')!;
    const { container } = render(<CartaoDeMidia midia={midia} />);
    expect(container.querySelector('iframe')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Assistir aqui' }));
    expect(container.querySelector('iframe')?.getAttribute('src')).toContain('youtube-nocookie.com');
  });
});

describe('acessórios do composer', () => {
  it('aceita somente um link suportado por vez e permite removê-lo', () => {
    const mudar = vi.fn();
    const { rerender } = render(<AcessoriosDoComposer anexo={null} aoMudarAnexo={mudar} />);
    fireEvent.change(screen.getByLabelText('Link do YouTube ou TikTok'), { target: { value: 'https://youtu.be/dQw4w9WgXcQ' } });
    fireEvent.click(screen.getByRole('button', { name: 'Adicionar link' }));
    const midia = mudar.mock.calls[0][0];
    expect(midia.tipo).toBe('video-externo');
    rerender(<AcessoriosDoComposer anexo={midia} aoMudarAnexo={mudar} />);
    expect(screen.getByText(/1 anexo/)).toBeDefined();
    fireEvent.click(screen.getByRole('button', { name: 'Remover' }));
    expect(mudar).toHaveBeenLastCalledWith(null);
  });
});
