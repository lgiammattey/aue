// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { ModalNovoCauso } from './ModalNovoCauso';

const comunidades = [{ id: 'c1', slug: 'eu-arroto-e-dai', nome: 'Eu arroto, e daí?', icone: '💨', descricao: '' }] as never;

function montar() {
  const onSubmit = vi.fn().mockResolvedValue(true);
  render(<ModalNovoCauso aberto comunidades={comunidades} onSubmit={onSubmit} onFechar={vi.fn()} />);
  fireEvent.click(screen.getByRole('checkbox'));
  return { onSubmit, campo: screen.getByRole('textbox', { name: /Resenha/i }) };
}

describe('limite do causo na tela = limite do banco (1000)', () => {
  afterEach(cleanup);

  it('1000 caracteres: libera e conta zero restante', () => {
    const { campo } = montar();
    fireEvent.change(campo, { target: { value: 'a'.repeat(1000) } });
    expect(screen.getByText('0 caracteres restantes')).toBeDefined();
    expect((screen.getByRole('button', { name: 'Publicar arroto' }) as HTMLButtonElement).disabled).toBe(false);
  });

  it('1001 caracteres: avisa quanto passou e trava o envio', () => {
    const { campo, onSubmit } = montar();
    fireEvent.change(campo, { target: { value: 'a'.repeat(1001) } });
    expect(screen.getByText('1 caracteres a mais que o limite')).toBeDefined();
    const botao = screen.getByRole('button', { name: 'Publicar arroto' }) as HTMLButtonElement;
    expect(botao.disabled).toBe(true);
    fireEvent.click(botao);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('emoji conta como um caractere, igual ao Postgres', () => {
    const { campo } = montar();
    fireEvent.change(campo, { target: { value: '💨'.repeat(1000) } });
    expect(screen.getByText('0 caracteres restantes')).toBeDefined();
  });
});
