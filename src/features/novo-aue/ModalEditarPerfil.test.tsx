// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ModalEditarPerfil } from './ModalEditarPerfil';

afterEach(cleanup);

const abrir = (aoSalvar = vi.fn(async () => undefined)) => {
  const aoFechar = vi.fn();
  render(
    <ModalEditarPerfil
      aberto
      nomeInicial="Giam"
      handleInicial="giam"
      bioInicial=""
      cidadeInicial=""
      redesIniciais={{}}
      aoFechar={aoFechar}
      aoSalvar={aoSalvar}
    />,
  );
  return { aoSalvar, aoFechar };
};

const digitar = (rotulo: string, valor: string) => fireEvent.change(screen.getByLabelText(rotulo), { target: { value: valor } });
const salvar = () => fireEvent.click(screen.getByRole('button', { name: 'Salvar mudanças' }));

describe('ModalEditarPerfil', () => {
  it('os campos têm o limite do banco e a bio mostra o contador', () => {
    abrir();
    expect(screen.getByLabelText('Nome de exibição').getAttribute('maxlength')).toBe('30');
    expect(screen.getByLabelText('Bio do perfil').getAttribute('maxlength')).toBe('280');
    expect(screen.getByLabelText('Cidade').getAttribute('maxlength')).toBe('60');
    expect(screen.getByText('0/280')).toBeTruthy();
    digitar('Bio do perfil', 'oi gente');
    expect(screen.getByText('8/280')).toBeTruthy();
  });

  it('@ inválido volta com a regra escrita e não chama o servidor', () => {
    const { aoSalvar } = abrir();
    digitar('@ do Auê', 'João Silva');
    salvar();
    expect(screen.getByRole('alert').textContent).toMatch(/3 a 20 letras minúsculas sem acento, números ou _/);
    expect(aoSalvar).not.toHaveBeenCalled();
  });

  it('@ reservado e nome curto demais têm mensagem própria', () => {
    const { aoSalvar } = abrir();
    digitar('@ do Auê', 'admin');
    salvar();
    expect(screen.getByRole('alert').textContent).toBe('Esse @ é reservado. Escolhe outro.');
    digitar('@ do Auê', 'giam');
    digitar('Nome de exibição', 'G');
    salvar();
    expect(screen.getByRole('alert').textContent).toBe('O nome de exibição precisa ter de 2 a 30 caracteres.');
    expect(aoSalvar).not.toHaveBeenCalled();
  });

  it('trocar o @ avisa que o link do perfil muda; sem trocar, mostra a regra', () => {
    abrir();
    expect(screen.getByText(/De 3 a 20 letras minúsculas/)).toBeTruthy();
    digitar('@ do Auê', '@Giam');
    // Só muda a caixa e o @: é o mesmo handle, então não há o que avisar.
    expect(screen.queryByText(/muda o link do seu perfil/)).toBeNull();
    digitar('@ do Auê', 'giam_novo');
    expect(screen.getByText('Trocar o @ muda o link do seu perfil: o endereço antigo deixa de funcionar.')).toBeTruthy();
  });

  it('dados válidos salvam com @ minúsculo e sem arroba, e fecham só depois do servidor', async () => {
    const { aoSalvar, aoFechar } = abrir();
    digitar('Nome de exibição', '  Giam Silva ');
    digitar('@ do Auê', '@Giam_Novo');
    digitar('Cidade', 'Rio');
    salvar();
    await waitFor(() => expect(aoFechar).toHaveBeenCalled());
    expect(aoSalvar).toHaveBeenCalledWith(expect.objectContaining({ apelido: 'Giam Silva', handle: 'giam_novo', cidade: 'Rio' }));
  });

  it('falha do servidor mostra a mensagem e mantém o formulário aberto', async () => {
    const { aoFechar } = abrir(vi.fn(async () => { throw new Error('Esse @ já está ocupado.'); }));
    salvar();
    expect((await screen.findByRole('alert')).textContent).toBe('Esse @ já está ocupado.');
    expect(aoFechar).not.toHaveBeenCalled();
    expect((screen.getByRole('button', { name: 'Salvar mudanças' }) as HTMLButtonElement).disabled).toBe(false);
  });
});
