// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { PortaDeConta } from '../../portas/conta';
import { TelaRedefinirSenha } from './TelaRedefinirSenha';

afterEach(cleanup);
describe('redefinir senha', () => {
  it('valida a senha antes de enviar e confirma quando a conta aceita', async () => {
    const redefinirSenha = vi.fn(async () => ({ ok: true as const }));
    const porta = { redefinirSenha } as unknown as PortaDeConta;
    render(<MemoryRouter><TelaRedefinirSenha portaConta={porta} linkValidoDeCara /></MemoryRouter>);
    fireEvent.change(screen.getByLabelText('Nova senha'), { target: { value: 'curta' } });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar senha' }));
    expect(screen.getByRole('alert').textContent).toContain('mínimo');
    expect(redefinirSenha).not.toHaveBeenCalled();
    fireEvent.change(screen.getByLabelText('Nova senha'), { target: { value: 'uma-senha-valida' } });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar senha' }));
    expect((await screen.findByRole('status')).textContent).toContain('Senha trocada');
    expect(redefinirSenha).toHaveBeenCalledWith('uma-senha-valida');
  });
  it('exibe erro do servidor sem dizer que a senha foi trocada', async () => {
    const porta = { redefinirSenha: vi.fn(async () => ({ ok: false as const, motivo: 'falhou' as const })) } as unknown as PortaDeConta;
    render(<MemoryRouter><TelaRedefinirSenha portaConta={porta} linkValidoDeCara /></MemoryRouter>);
    fireEvent.change(screen.getByLabelText('Nova senha'), { target: { value: 'uma-senha-valida' } });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar senha' }));
    expect((await screen.findByRole('alert')).textContent).toContain('Não deu para trocar');
    expect(screen.queryByRole('status')).toBeNull();
  });
});
