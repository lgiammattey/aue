// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { TelaHistoria } from './TelaHistoria';
import { criarComunidadeWeb } from '../../plataforma/web/comunidade';
import type { CausoPostado } from '../../portas/comunidade';

const CAUSO_TESTE: CausoPostado = {
  id: 'causo-teste-historia',
  comunidadeId: 'comu-cerveja-gelada',
  comunidadeSlug: 'cerveja-gelada',
  autorNome: 'Tiago do Bonde',
  autorHandle: 'tiagobonde',
  conteudo: 'Almoço de domingo na sogra, todo mundo concentrado na novela das nove. O arroto que soltei fez o periquito da sala cair do poleiro.',
  nota: 94,
  duracaoSegundos: 4.8,
  origem: 'refrigerante',
  reacoes: { fogo: 284, nojo: 12, trofeu: 198 },
  curtidas: 284,
  reposts: 76,
  totalComentarios: 1,
  comentarios: [
    {
      id: 'resp-t-1',
      causoId: 'causo-teste-historia',
      autorNome: 'Iury da Oficina',
      autorHandle: 'iury_oficina',
      conteudo: 'Isso não é arroto de visita, Tiago.',
      criadoEm: '2026-10-17T18:10:00.000Z',
    },
  ],
  criadoEm: '2026-10-17T18:00:00.000Z',
};

describe('TelaHistoria — Página de Contos e Leitura Completa', () => {
  afterEach(() => {
    cleanup();
    localStorage.clear();
  });

  it('renderiza o conto completo, autor, botões de ação e lista de comentários', async () => {
    const adapter = criarComunidadeWeb({
      causosIniciais: [CAUSO_TESTE],
      forcarOffline: true,
    });
    render(
      <MemoryRouter initialEntries={['/historia/causo-teste-historia']}>
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
    const adapter = criarComunidadeWeb({
      causosIniciais: [CAUSO_TESTE],
      forcarOffline: true,
    });
    render(
      <MemoryRouter initialEntries={['/historia/causo-teste-historia']}>
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
