// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { TelaLogin } from './TelaLogin';
import type { PortaDeConta } from '../../portas/conta';

function contaFalsa(sobrepor: Partial<PortaDeConta> = {}): PortaDeConta {
  return {
    estado: vi.fn(async () => ({ temSessao: true, anonima: false })),
    cadastrar: vi.fn(async () => ({ ok: true as const })),
    entrar: vi.fn(async () => ({ ok: true as const })),
    enviarLinkDeRedefinicao: vi.fn(async () => ({ ok: true as const })),
    redefinirSenha: vi.fn(async () => ({ ok: true as const })),
    sair: vi.fn(async () => true),
    ...sobrepor,
  };
}

function CaminhoAtual() {
  const location = useLocation();
  return <output data-testid="caminho-atual">{`${location.pathname}${location.search}`}</output>;
}

function montar(conta: PortaDeConta) {
  render(
    <MemoryRouter initialEntries={['/login']}>
      <TelaLogin portaConta={conta} />
      <CaminhoAtual />
    </MemoryRouter>,
  );
}

function irParaSenha(email = 'betao@aue.com') {
  fireEvent.change(screen.getByPlaceholderText('E-mail'), { target: { value: email } });
  fireEvent.click(screen.getByRole('button', { name: 'Avançar' }));
}

describe('TelaLogin (cartão estilo Google, só pra quem já tem conta)', () => {
  afterEach(() => {
    cleanup();
  });

  it('não deixa criar conta nem entrar com Google, e o convite fica desabilitado', () => {
    montar(contaFalsa());

    expect(screen.queryByRole('button', { name: /Criar conta/ })).toBeNull();
    expect(screen.queryByRole('link', { name: /Criar conta/ })).toBeNull();
    expect(screen.queryByText(/Google/)).toBeNull();
    expect((screen.getByRole('button', { name: 'Pedir convite' }) as HTMLButtonElement).disabled).toBe(true);
  });

  it('o primeiro passo só avança com e-mail válido', async () => {
    montar(contaFalsa());

    fireEvent.click(screen.getByRole('button', { name: 'Avançar' }));
    expect(await screen.findByText('E-mail inválido.')).toBeDefined();
    expect(screen.queryByPlaceholderText('Digite sua senha')).toBeNull();
  });

  it('o segundo passo mostra o e-mail num chip e exige a senha mínima', async () => {
    const conta = contaFalsa();
    montar(conta);

    irParaSenha();
    expect(screen.getByRole('button', { name: /Trocar o e-mail betao@aue.com/ })).toBeDefined();

    fireEvent.change(screen.getByPlaceholderText('Digite sua senha'), { target: { value: 'curta' } });
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));

    expect(await screen.findByText('Senha com no mínimo 8 caracteres.')).toBeDefined();
    expect(conta.entrar).not.toHaveBeenCalled();
  });

  it('trocar o e-mail pelo chip volta ao primeiro passo', () => {
    montar(contaFalsa());

    irParaSenha();
    fireEvent.click(screen.getByRole('button', { name: /Trocar o e-mail/ }));

    expect(screen.getByPlaceholderText('E-mail')).toBeDefined();
  });

  it('mostra a senha quando a pessoa pede', () => {
    montar(contaFalsa());

    irParaSenha();
    const campo = screen.getByPlaceholderText('Digite sua senha') as HTMLInputElement;
    expect(campo.type).toBe('password');
    fireEvent.click(screen.getByLabelText('Mostrar senha'));
    expect(campo.type).toBe('text');
  });

  it('exibe mensagem honesta de credenciais inválidas se o login falhar', async () => {
    montar(
      contaFalsa({ entrar: vi.fn(async () => ({ ok: false as const, motivo: 'credenciaisInvalidas' as const })) }),
    );

    irParaSenha('errado@aue.com');
    fireEvent.change(screen.getByPlaceholderText('Digite sua senha'), { target: { value: 'senhaerrada' } });
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));

    expect(await screen.findByText('E-mail ou senha incorretos.')).toBeDefined();
  });

  it('entra e leva pra home', async () => {
    const conta = contaFalsa();
    montar(conta);

    irParaSenha();
    fireEvent.change(screen.getByPlaceholderText('Digite sua senha'), { target: { value: 'senhaboa123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));

    await waitFor(() => expect(screen.getByTestId('caminho-atual').textContent).toBe('/'));
    expect(conta.entrar).toHaveBeenCalledWith('betao@aue.com', 'senhaboa123');
  });

  it('login de conta com ficha pendente volta para o perfil, não para o feed', async () => {
    montar(
      contaFalsa({
        estado: vi.fn(async () => ({ temSessao: true, anonima: false, perfilSocialPendente: true })),
      }),
    );

    irParaSenha();
    fireEvent.change(screen.getByPlaceholderText('Digite sua senha'), { target: { value: 'senhaboa123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));

    await waitFor(() => expect(screen.getByTestId('caminho-atual').textContent).toBe('/perfil?boas-vindas=1'));
  });

  it('esqueci a senha manda o link e responde igual exista a conta ou não', async () => {
    const conta = contaFalsa();
    montar(conta);

    irParaSenha('alguem@aue.com');
    fireEvent.click(screen.getByRole('button', { name: 'Esqueceu a senha?' }));
    expect(screen.queryByPlaceholderText('Digite sua senha')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Mandar o link' }));
    expect(await screen.findByText(/Se esse e-mail tiver conta/)).toBeDefined();
    expect(conta.enviarLinkDeRedefinicao).toHaveBeenCalledWith('alguem@aue.com');
  });

  it('oferece ouvir as comunidades e arrotar como convidado, sem conta', () => {
    montar(contaFalsa());

    expect(screen.getByRole('link', { name: 'ouça as comunidades' }).getAttribute('href')).toBe('/comunidade');
    expect(screen.getByRole('link', { name: 'arrote como convidado' }).getAttribute('href')).toBe('/arena');
  });
});
