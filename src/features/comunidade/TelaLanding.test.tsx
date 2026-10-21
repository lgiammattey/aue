// @vitest-environment jsdom
import { afterEach, describe, it, expect, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { TelaLanding } from './TelaLanding';
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
  return <output data-testid="caminho-atual">{location.pathname}</output>;
}

describe('TelaLanding (Protótipo Canônico Landing.dc.html)', () => {
  afterEach(() => {
    cleanup();
  });

  it('renderiza a marca, a chamada e as saídas sem conta', () => {
    render(
      <MemoryRouter>
        <TelaLanding portaConta={contaFalsa()} />
      </MemoryRouter>,
    );

    expect(screen.getByLabelText('Auê!')).toBeTruthy();
    expect(
      screen.getByRole('heading', { level: 1, name: 'Arrotar é um dom. Aqui, ele tem turma.' }),
    ).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Só quero ouvir' }).getAttribute('href')).toBe('/comunidades');
    expect(screen.getByRole('link', { name: 'Ir pra Arena' }).getAttribute('href')).toBe('/arena');
  });

  it('o Auê está fechado: sem criar conta, sem Google, e o convite fica desabilitado', () => {
    render(
      <MemoryRouter>
        <TelaLanding portaConta={contaFalsa()} />
      </MemoryRouter>,
    );

    expect(screen.queryByText(/Criar conta/)).toBeNull();
    expect(screen.queryByText(/Google/)).toBeNull();
    expect(screen.queryByRole('tab', { name: /convite/i })).toBeNull();
    expect(screen.queryByText(/em breve/i)).toBeNull();
    expect(screen.queryAllByRole('tab').filter((t) => (t as HTMLButtonElement).disabled)).toHaveLength(0);
    expect(screen.getByRole('tab', { name: 'Entrar' }).getAttribute('aria-selected')).toBe('true');
  });

  it('marca o cartão de conversa como exemplo', () => {
    render(
      <MemoryRouter>
        <TelaLanding portaConta={contaFalsa()} />
      </MemoryRouter>,
    );

    expect(screen.getByLabelText('Exemplo de conversa').textContent).toContain('Exemplo');
  });

  it('valida e-mail e senha antes de ir ao servidor', async () => {
    const conta = contaFalsa();
    render(
      <MemoryRouter>
        <TelaLanding portaConta={conta} />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getAllByRole('button', { name: 'Entrar' })[0]);
    expect(await screen.findByText('E-mail inválido.')).toBeTruthy();

    fireEvent.change(screen.getByPlaceholderText('E-mail'), { target: { value: 'betao@aue.com' } });
    fireEvent.change(screen.getByPlaceholderText('Senha'), { target: { value: 'curta' } });
    fireEvent.click(screen.getAllByRole('button', { name: 'Entrar' })[0]);
    expect(await screen.findByText('Senha com no mínimo 8 caracteres.')).toBeTruthy();
    expect(conta.entrar).not.toHaveBeenCalled();
  });

  it('entra com e-mail e senha de quem já tem conta', async () => {
    const conta = contaFalsa();
    render(
      <MemoryRouter initialEntries={['/']}>
        <TelaLanding portaConta={conta} />
        <CaminhoAtual />
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByPlaceholderText('E-mail'), { target: { value: 'betao@aue.com' } });
    fireEvent.change(screen.getByPlaceholderText('Senha'), { target: { value: 'senhaboa123' } });
    fireEvent.click(screen.getAllByRole('button', { name: 'Entrar' })[0]);

    await waitFor(() => expect(conta.entrar).toHaveBeenCalledWith('betao@aue.com', 'senhaboa123'));
  });

  it('mostra erro honesto se as credenciais não baterem', async () => {
    render(
      <MemoryRouter>
        <TelaLanding
          portaConta={contaFalsa({
            entrar: vi.fn(async () => ({ ok: false as const, motivo: 'credenciaisInvalidas' as const })),
          })}
        />
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByPlaceholderText('E-mail'), { target: { value: 'errado@aue.com' } });
    fireEvent.change(screen.getByPlaceholderText('Senha'), { target: { value: 'senhaerrada' } });
    fireEvent.click(screen.getAllByRole('button', { name: 'Entrar' })[0]);

    expect(await screen.findByText('E-mail ou senha incorretos.')).toBeTruthy();
  });

  it('esqueci a senha manda o link', async () => {
    const conta = contaFalsa();
    render(
      <MemoryRouter>
        <TelaLanding portaConta={conta} />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Esqueci minha senha' }));
    expect(screen.queryByPlaceholderText('Senha')).toBeNull();
    fireEvent.change(screen.getByPlaceholderText('E-mail'), { target: { value: 'alguem@aue.com' } });
    fireEvent.click(screen.getByRole('button', { name: 'Mandar o link' }));

    expect(await screen.findByText(/Se esse e-mail tiver conta/)).toBeTruthy();
    expect(conta.enviarLinkDeRedefinicao).toHaveBeenCalledWith('alguem@aue.com');
  });

  it('chama os callbacks das saídas sem conta', () => {
    const onEntrarSemConta = vi.fn();
    const onArrotar = vi.fn();
    render(
      <MemoryRouter>
        <TelaLanding portaConta={contaFalsa()} onEntrarSemConta={onEntrarSemConta} onArrotar={onArrotar} />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('link', { name: 'Só quero ouvir' }));
    fireEvent.click(screen.getByRole('link', { name: 'Ir pra Arena' }));

    expect(onEntrarSemConta).toHaveBeenCalledTimes(1);
    expect(onArrotar).toHaveBeenCalledTimes(1);
  });

  it('fala como a comunidade, sem "causo" e sem chamar o Auê de jogo', () => {
    render(
      <MemoryRouter>
        <TelaLanding portaConta={contaFalsa()} />
      </MemoryRouter>,
    );

    const texto = (document.body.textContent ?? '').toLowerCase();
    expect(texto).toContain('arrota, aprende ou só vem ouvir');
    expect(texto).not.toMatch(/\bcausos?\b/);
    expect(texto).not.toContain('jogo de arroto');
  });
});
