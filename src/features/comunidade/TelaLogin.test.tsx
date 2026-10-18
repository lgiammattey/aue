// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { TelaLogin } from './TelaLogin';
import * as supabaseModule from '../../db/supabase';
import type { PortaDeConta } from '../../portas/conta';

vi.mock('../../shared/flags', () => ({
  FLAGS: { loginSocial: true, disputaLocal: false, disputaNaArena: false },
}));

function contaFalsa(sobrepor: Partial<PortaDeConta> = {}): PortaDeConta {
  return {
    estado: vi.fn(async () => ({ temSessao: true, anonima: true })),
    cadastrar: vi.fn(async () => ({ ok: true as const })),
    entrar: vi.fn(async () => ({ ok: true as const })),
    enviarLinkDeRedefinicao: vi.fn(async () => ({ ok: true as const })),
    redefinirSenha: vi.fn(async () => ({ ok: true as const })),
    sair: vi.fn(async () => true),
    ...sobrepor,
  };
}

describe('TelaLogin (Autenticação do Auê)', () => {
  afterEach(() => {
    cleanup();
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('valida campos obrigatórios e formato de e-mail e senha antes de submeter', async () => {
    render(
      <MemoryRouter>
        <TelaLogin />
      </MemoryRouter>,
    );

    const btnSubmit = screen.getByRole('button', { name: 'Entrar' });

    // Tenta submeter vazio
    fireEvent.click(btnSubmit);
    expect(await screen.findByText('E-mail inválido.')).toBeDefined();

    // Preenche e-mail válido mas senha curta
    const inputEmail = screen.getByPlaceholderText('E-mail');
    fireEvent.change(inputEmail, { target: { value: 'arrotador@aue.com' } });
    fireEvent.click(btnSubmit);
    expect(await screen.findByText('Senha com no mínimo 8 caracteres.')).toBeDefined();
  });

  it('no modo criar conta, exige apelido válido', async () => {
    render(
      <MemoryRouter>
        <TelaLogin />
      </MemoryRouter>,
    );

    // Muda para Criar conta pela aba
    const btnCriarContaTab = screen.getByRole('button', { name: 'Aba Criar conta' });
    fireEvent.click(btnCriarContaTab);

    const inputEmail = screen.getByPlaceholderText('E-mail');
    const inputSenha = screen.getByPlaceholderText('Senha');
    fireEvent.change(inputEmail, { target: { value: 'novato@aue.com' } });
    fireEvent.change(inputSenha, { target: { value: '12345678' } });

    const btnCriarSubmit = screen.getByRole('button', { name: 'Criar conta' });
    fireEvent.click(btnCriarSubmit);

    expect(await screen.findByText('Escolhe um apelido.')).toBeDefined();
  });

  it('exibe mensagem honesta de credenciais inválidas se o login falhar', async () => {
    const conta = contaFalsa({ entrar: vi.fn(async () => ({ ok: false as const, motivo: 'credenciaisInvalidas' as const })) });
    render(
      <MemoryRouter>
        <TelaLogin portaConta={conta} />
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByPlaceholderText('E-mail'), { target: { value: 'errado@aue.com' } });
    fireEvent.change(screen.getByPlaceholderText('Senha'), { target: { value: 'senhaerrada' } });
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));

    expect(await screen.findByText('E-mail ou senha incorretos.')).toBeDefined();
  });

  it('cadastro promove a conta e avisa para confirmar no e-mail, sem fingir que já entrou', async () => {
    const conta = contaFalsa({ cadastrar: vi.fn(async () => ({ ok: true as const, aviso: 'confirmeNoEmail' as const })) });
    render(
      <MemoryRouter>
        <TelaLogin portaConta={conta} />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Aba Criar conta' }));
    fireEvent.change(screen.getByLabelText('Apelido'), { target: { value: 'Betão da TI' } });
    // O @ nasce do apelido, sem acento e com _.
    expect((screen.getByLabelText('Seu @') as HTMLInputElement).value).toBe('betao_da_ti');
    fireEvent.change(screen.getByPlaceholderText('E-mail'), { target: { value: 'betao@aue.com' } });
    fireEvent.change(screen.getByPlaceholderText('Senha'), { target: { value: 'senhaboa123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Criar conta' }));

    expect(await screen.findByText(/Mandamos um link para betao@aue.com/)).toBeDefined();
    expect(conta.cadastrar).toHaveBeenCalledWith({
      email: 'betao@aue.com',
      senha: 'senhaboa123',
      apelido: 'Betão da TI',
      handle: 'betao_da_ti',
    });
  });

  it('@ que já é de outra pessoa vira mensagem clara e não prende o cadastro', async () => {
    const conta = contaFalsa({ cadastrar: vi.fn(async () => ({ ok: false as const, motivo: 'handleEmUso' as const })) });
    render(
      <MemoryRouter>
        <TelaLogin portaConta={conta} />
      </MemoryRouter>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Aba Criar conta' }));
    fireEvent.change(screen.getByLabelText('Apelido'), { target: { value: 'Betão' } });
    fireEvent.change(screen.getByPlaceholderText('E-mail'), { target: { value: 'betao@aue.com' } });
    fireEvent.change(screen.getByPlaceholderText('Senha'), { target: { value: 'senhaboa123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Criar conta' }));
    expect(await screen.findByText(/Esse @ já é de outra pessoa/)).toBeDefined();
  });

  it('@ inválido nem chega ao servidor', async () => {
    const conta = contaFalsa();
    render(
      <MemoryRouter>
        <TelaLogin portaConta={conta} />
      </MemoryRouter>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Aba Criar conta' }));
    fireEvent.change(screen.getByLabelText('Apelido'), { target: { value: 'Betão' } });
    fireEvent.change(screen.getByLabelText('Seu @'), { target: { value: 'oi' } });
    fireEvent.change(screen.getByPlaceholderText('E-mail'), { target: { value: 'betao@aue.com' } });
    fireEvent.change(screen.getByPlaceholderText('Senha'), { target: { value: 'senhaboa123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Criar conta' }));
    expect(await screen.findByText(/3 a 20 letras minúsculas/)).toBeDefined();
    expect(conta.cadastrar).not.toHaveBeenCalled();
  });

  it('e-mail já cadastrado vira mensagem clara', async () => {
    const conta = contaFalsa({ cadastrar: vi.fn(async () => ({ ok: false as const, motivo: 'emailEmUso' as const })) });
    render(
      <MemoryRouter>
        <TelaLogin portaConta={conta} />
      </MemoryRouter>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Aba Criar conta' }));
    fireEvent.change(screen.getByLabelText('Apelido'), { target: { value: 'Betão' } });
    fireEvent.change(screen.getByPlaceholderText('E-mail'), { target: { value: 'betao@aue.com' } });
    fireEvent.change(screen.getByPlaceholderText('Senha'), { target: { value: 'senhaboa123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Criar conta' }));
    expect(await screen.findByText(/já está cadastrado/)).toBeDefined();
  });

  it('esqueci a senha manda o link e responde igual exista a conta ou não', async () => {
    const conta = contaFalsa();
    render(
      <MemoryRouter>
        <TelaLogin portaConta={conta} />
      </MemoryRouter>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Esqueci minha senha' }));
    expect(screen.queryByPlaceholderText('Senha')).toBeNull();
    fireEvent.change(screen.getByPlaceholderText('E-mail'), { target: { value: 'alguem@aue.com' } });
    fireEvent.click(screen.getByRole('button', { name: 'Mandar o link' }));
    expect(await screen.findByText(/Se esse e-mail tiver conta/)).toBeDefined();
    expect(conta.enviarLinkDeRedefinicao).toHaveBeenCalledWith('alguem@aue.com');
  });

  it('aciona signInWithGoogle ao clicar no botão de Google', async () => {
    const googleSpy = vi.spyOn(supabaseModule, 'signInWithGoogle').mockResolvedValueOnce({} as any);

    render(
      <MemoryRouter>
        <TelaLogin />
      </MemoryRouter>,
    );

    const btnGoogle = screen.getByRole('button', { name: 'Continuar com Google' });
    fireEvent.click(btnGoogle);

    expect(googleSpy).toHaveBeenCalledTimes(1);
  });
});
