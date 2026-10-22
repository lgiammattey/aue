// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { FolhaDaFoto } from './FolhaDaFoto';

afterEach(cleanup);

function abrir(temFoto = true) {
  const aoFechar = vi.fn();
  render(
    <>
      <button type="button">Compartilhar</button>
      <FolhaDaFoto aberta temFoto={temFoto} aoTrocar={vi.fn()} aoRemover={vi.fn()} aoFechar={aoFechar} />
    </>,
  );
  return { aoFechar, folha: screen.getByRole('dialog', { name: 'Foto do perfil' }) };
}

describe('FolhaDaFoto: foco preso', () => {
  it('abre com o foco no contêiner e Shift+Tab não escapa: vai ao último botão', () => {
    const { folha } = abrir();
    expect(document.activeElement).toBe(folha);
    expect(fireEvent.keyDown(folha, { key: 'Tab', shiftKey: true })).toBe(false);
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Remover foto' }));
  });

  it('sem foto, o último botão é Trocar foto', () => {
    const { folha } = abrir(false);
    fireEvent.keyDown(folha, { key: 'Tab', shiftKey: true });
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Trocar foto' }));
  });

  it('Tab no último volta a Fechar', () => {
    const { folha } = abrir();
    screen.getByRole('button', { name: 'Remover foto' }).focus();
    fireEvent.keyDown(document.activeElement as HTMLElement, { key: 'Tab' });
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Fechar' }));
    expect(folha.contains(document.activeElement)).toBe(true);
  });

  it('Esc fecha com o foco no contêiner e em qualquer botão', () => {
    const { folha, aoFechar } = abrir();
    fireEvent.keyDown(folha, { key: 'Escape' });
    expect(aoFechar).toHaveBeenCalledTimes(1);
    screen.getByRole('button', { name: 'Trocar foto' }).focus();
    fireEvent.keyDown(document.activeElement as HTMLElement, { key: 'Escape' });
    expect(aoFechar).toHaveBeenCalledTimes(2);
  });
});
