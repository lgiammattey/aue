// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { TelaComunidade } from './TelaComunidade';
import { criarComunidadeWeb } from '../../plataforma/web/comunidade';

describe('TelaComunidade (Auê 3.0)', () => {
  afterEach(() => {
    cleanup();
  });
  it('renderiza header, chips de comunidades e feed inicial', async () => {
    const adapter = criarComunidadeWeb({ forcarOffline: true });
    render(<TelaComunidade porta={adapter} />);

    expect(screen.getByText('Auê')).toBeDefined();
    expect(screen.getByText('3.0')).toBeDefined();

    // Aguarda carregar comunidades
    expect(await screen.findByRole('button', { name: /Eu arroto, e daí\?/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /Na reunião da firma/i })).toBeDefined();

    // Aguarda causos no feed
    expect(await screen.findByText(/Betão da TI/)).toBeDefined();
  });

  it('permite alternar reações no causo pelo feed', async () => {
    const adapter = criarComunidadeWeb({ forcarOffline: true });
    render(<TelaComunidade porta={adapter} />);

    const botoesFogo = await screen.findAllByRole('button', { name: /Reagir com fogo/i });
    expect(botoesFogo.length).toBeGreaterThan(0);

    fireEvent.click(botoesFogo[0]);
    // Deve ter atualizado para 43
    expect(await screen.findByRole('button', { name: /Reagir com fogo \(43\)/i })).toBeDefined();
  });

  it('filtra causos ao tocar no chip de comunidade', async () => {
    const adapter = criarComunidadeWeb({ forcarOffline: true });
    render(<TelaComunidade porta={adapter} />);

    const chipReuniao = await screen.findByRole('button', { name: /Na reunião da firma/i });
    fireEvent.click(chipReuniao);

    // Deve exibir o causo da firma
    expect(await screen.findByText(/Marcão do RH/)).toBeDefined();
  });

  it('chama onArrotar ao tocar no botão da Arena', async () => {
    const onArrotar = vi.fn();
    const adapter = criarComunidadeWeb({ forcarOffline: true });
    render(<TelaComunidade porta={adapter} onArrotar={onArrotar} />);

    const btnArrotar = screen.getByRole('button', { name: 'Ir para a Arena e arrotar' });
    fireEvent.click(btnArrotar);

    expect(onArrotar).toHaveBeenCalledTimes(1);
  });

  it('abre modal e publica um novo causo de texto no feed', async () => {
    const adapter = criarComunidadeWeb({ forcarOffline: true });
    render(<TelaComunidade porta={adapter} />);

    const btnPrompt = await screen.findByRole('button', { name: /Qual foi seu último arroto histórico\?/i });
    fireEvent.click(btnPrompt);

    // Modal aberto
    expect(screen.getByRole('heading', { name: 'Soltar Causo no Mural' })).toBeDefined();

    // Preenche causo
    const inputNome = screen.getByLabelText('Seu Apelido');
    const textareaCauso = screen.getByLabelText('O Causo / Contexto');

    fireEvent.change(inputNome, { target: { value: 'Luiz da Laudo' } });
    fireEvent.change(textareaCauso, { target: { value: 'Arrotei no silêncio da biblioteca.' } });

    const btnPublicar = screen.getByRole('button', { name: 'Publicar Causo' });
    fireEvent.click(btnPublicar);

    // Causo novo deve aparecer no feed
    expect(await screen.findByText('Arrotei no silêncio da biblioteca.')).toBeDefined();
    expect(screen.getByText(/Luiz da Laudo/)).toBeDefined();
  });
});
