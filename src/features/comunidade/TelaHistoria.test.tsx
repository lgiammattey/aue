// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { TelaHistoria } from './TelaHistoria';
import { criarComunidadeWeb } from '../../plataforma/web/comunidade';

describe('TelaHistoria — Página de Contos e Leitura Completa', () => {
  afterEach(() => {
    cleanup();
    localStorage.clear();
  });

  it('renderiza o conto completo, autor, botões de ação e lista de comentários', async () => {
    const adapter = criarComunidadeWeb({ forcarOffline: true });
    render(
      <MemoryRouter initialEntries={['/historia/causo-seed-tiago']}>
        <Routes>
          <Route path="/historia/:id" element={<TelaHistoria porta={adapter} />} />
        </Routes>
      </MemoryRouter>,
    );

    // Título da página
    expect(await screen.findByText('História de Arroto')).toBeDefined();

    // Autor e conteúdo completo
    expect((await screen.findAllByText('Tiago do Bonde')).length).toBeGreaterThan(0);
    expect(await screen.findByText(/Almoço de domingo na sogra/)).toBeDefined();

    // Botão de Jogar Auê no topo
    expect(screen.getByRole('button', { name: 'Jogar o Auê' })).toBeDefined();

    // Botões de ação (Curtidas e Compartilhar)
    expect(screen.getByText(/curtidas/)).toBeDefined();
    expect(screen.getByText('Compartilhar')).toBeDefined();

    // Comentários carregados em lista simples
    expect(screen.getByText(/Isso não é arroto de visita/)).toBeDefined();
  });

  it('permite enviar um novo comentário com apelido customizado', async () => {
    const adapter = criarComunidadeWeb({ forcarOffline: true });
    render(
      <MemoryRouter initialEntries={['/historia/causo-seed-tiago']}>
        <Routes>
          <Route path="/historia/:id" element={<TelaHistoria porta={adapter} />} />
        </Routes>
      </MemoryRouter>,
    );

    // Aguarda carregar
    expect((await screen.findAllByText('Tiago do Bonde')).length).toBeGreaterThan(0);

    const inputApelido = screen.getByPlaceholderText('Seu apelido (nickname)');
    const inputTexto = screen.getByPlaceholderText('Deixe seu comentário ou zoação...');

    fireEvent.change(inputApelido, { target: { value: 'Zeca do Bar' } });
    fireEvent.change(inputTexto, { target: { value: 'Esse aí quebrou as taças da estante!' } });

    const btnComentar = screen.getByRole('button', { name: 'Comentar' });
    fireEvent.click(btnComentar);

    // Comentário aparece na lista simples
    expect(await screen.findByText('Zeca do Bar')).toBeDefined();
    expect(screen.getByText('Esse aí quebrou as taças da estante!')).toBeDefined();
  });
});
