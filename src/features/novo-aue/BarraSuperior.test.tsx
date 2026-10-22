// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { BarraSuperior } from './BarraSuperior';

afterEach(cleanup);

const montar = (extra: Partial<React.ComponentProps<typeof BarraSuperior>> = {}) =>
  render(
    <MemoryRouter>
      <BarraSuperior busca="" estaAutenticado meuPerfil={null} aoBuscar={vi.fn()} {...extra} />
    </MemoryRouter>,
  );

describe('BarraSuperior', () => {
  it('campo de busca com o texto do print e sem botão de chat', () => {
    montar();
    expect(screen.getByPlaceholderText('Buscar pessoas, comunidades e publicações…')).toBeTruthy();
    expect(screen.queryByRole('button', { name: /chat|mensagem/i })).toBeNull();
    expect(screen.getByRole('link', { name: 'Auê mobile' })).toBeTruthy();
  });

  it('digitar chama aoBuscar; sem busca (Explorar) o campo nem existe', () => {
    const aoBuscar = vi.fn();
    montar({ aoBuscar });
    fireEvent.change(screen.getByLabelText('Campo de busca'), { target: { value: 'giamz' } });
    expect(aoBuscar).toHaveBeenCalledWith('giamz');
    cleanup();
    montar({ mostrarBusca: false });
    expect(screen.queryByLabelText('Campo de busca')).toBeNull();
  });
});
