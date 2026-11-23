// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const registrarMock = vi.fn();
vi.mock('../../plataforma/web/analyticsArenaV2', () => ({
  analyticsArenaV2: { registrar: registrarMock },
}));

describe('AvisoMaioridade', () => {
  beforeEach(() => {
    window.localStorage.clear();
    registrarMock.mockClear();
  });

  afterEach(() => {
    cleanup();
  });

  it('exibe o aviso +18 na chegada, grava a confirmação e registra no Analytics', async () => {
    const { AvisoMaioridade } = await import('./AvisoMaioridade');

    const { unmount } = render(<AvisoMaioridade />);
    expect(screen.getByLabelText('Aviso de conteúdo para maiores de 18 anos')).toBeTruthy();
    expect(screen.getByText('+18')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Tenho 18+' }));

    expect(screen.queryByLabelText('Aviso de conteúdo para maiores de 18 anos')).toBeNull();
    expect(window.localStorage.getItem('aue.maioridade.v1')).toBe('1');
    expect(registrarMock).toHaveBeenCalledWith('confirmou_maioridade');

    unmount();
    render(<AvisoMaioridade />);
    expect(screen.queryByLabelText('Aviso de conteúdo para maiores de 18 anos')).toBeNull();
  });

  it('fala inglês quando a página está em inglês', async () => {
    const { AvisoMaioridade } = await import('./AvisoMaioridade');

    render(<AvisoMaioridade idioma="en" />);
    expect(screen.getByLabelText('Notice: content for adults 18 and over')).toBeTruthy();
    expect(screen.getByText('Adults only. Crude humor, no filter.')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: "I'm 18+" }));
    expect(window.localStorage.getItem('aue.maioridade.v1')).toBe('1');
  });
});
