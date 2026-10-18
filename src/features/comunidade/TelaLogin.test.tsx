// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { TelaLogin } from './TelaLogin';
import * as supabaseModule from '../../db/supabase';

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
    expect(await screen.findByText('Senha com no mínimo 6 caracteres.')).toBeDefined();
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
    fireEvent.change(inputSenha, { target: { value: '123456' } });

    const btnCriarSubmit = screen.getByRole('button', { name: 'Criar conta' });
    fireEvent.click(btnCriarSubmit);

    expect(await screen.findByText('Escolhe um apelido.')).toBeDefined();
  });

  it('exibe mensagem honesta de credenciais inválidas se o login falhar', async () => {
    vi.spyOn(supabaseModule.supabase.auth, 'signInWithPassword').mockResolvedValueOnce({
      data: { user: null, session: null },
      error: { message: 'Invalid login credentials', name: 'AuthApiError', status: 400 },
    } as any);

    render(
      <MemoryRouter>
        <TelaLogin />
      </MemoryRouter>,
    );

    const inputEmail = screen.getByPlaceholderText('E-mail');
    const inputSenha = screen.getByPlaceholderText('Senha');
    fireEvent.change(inputEmail, { target: { value: 'errado@aue.com' } });
    fireEvent.change(inputSenha, { target: { value: 'senhaerrada' } });

    const btnSubmit = screen.getByRole('button', { name: 'Entrar' });
    fireEvent.click(btnSubmit);

    expect(await screen.findByText('E-mail ou senha incorretos.')).toBeDefined();
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
