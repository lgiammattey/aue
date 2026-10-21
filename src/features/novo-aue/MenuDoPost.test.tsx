// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MenuDoPost } from './MenuDoPost';

afterEach(cleanup);

describe('MenuDoPost', () => {
  it('sem ação nenhuma, não aparece', () => {
    const { container } = render(<MenuDoPost />);
    expect(container.firstChild).toBeNull();
  });

  it('post de outra pessoa: só Denunciar', () => {
    const aoDenunciar = vi.fn();
    render(<MenuDoPost aoDenunciar={aoDenunciar} />);
    fireEvent.click(screen.getByRole('button', { name: 'Mais ações' }));
    expect(screen.queryByRole('menuitem', { name: 'Apagar' })).toBeNull();
    fireEvent.click(screen.getByRole('menuitem', { name: 'Denunciar' }));
    expect(aoDenunciar).toHaveBeenCalledOnce();
    expect(screen.queryByRole('menu')).toBeNull();
  });

  it('post próprio: só Apagar', () => {
    const aoApagar = vi.fn();
    render(<MenuDoPost aoApagar={aoApagar} />);
    fireEvent.click(screen.getByRole('button', { name: 'Mais ações' }));
    expect(screen.queryByRole('menuitem', { name: 'Denunciar' })).toBeNull();
    fireEvent.click(screen.getByRole('menuitem', { name: 'Apagar' }));
    expect(aoApagar).toHaveBeenCalledOnce();
  });

  it('expõe o estado aberto/fechado e fecha com Esc e clicando fora', () => {
    render(<div><span>fora</span><MenuDoPost aoDenunciar={vi.fn()} /></div>);
    const botao = screen.getByRole('button', { name: 'Mais ações' });
    expect(botao.getAttribute('aria-expanded')).toBe('false');
    fireEvent.click(botao);
    expect(botao.getAttribute('aria-expanded')).toBe('true');
    expect(screen.getByRole('menu')).toBeTruthy();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('menu')).toBeNull();
    fireEvent.click(botao);
    fireEvent.mouseDown(screen.getByText('fora'));
    expect(screen.queryByRole('menu')).toBeNull();
  });
});
