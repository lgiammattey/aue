// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ModalComentarios } from './ModalComentarios';
import { PreviaDaConversa } from './PreviaDaConversa';
import { ThreadDeComentarios } from './ThreadDeComentarios';
import type { ItemComentario, ItemDoFeed } from './tipos';

const post: ItemDoFeed = { id: 'topico-1', tipo: 'topico', comunidadeSlug: 'arena', titulo: 'Post', corpo: 'Causo', autorNome: 'Lia', criadoEm: '2026-10-22T12:00:00Z', respostasTotal: 1 };
const resposta: ItemComentario = { id: 'resposta', autorNome: 'Bia', conteudo: 'Meu som', criadoEm: '2026-10-22T12:05:00Z', nivel: 0, notaRetrospectiva: 0, notaAvaliadaDepois: true, anexo: { tipo: 'audio', url: 'https://example.test/audio.webm' } };
const superfícies = {
  previa: (c: ItemComentario) => <PreviaDaConversa post={post} comentarios={[c]} temMais={false} aoCarregarMais={vi.fn()} aoResponder={vi.fn()} />,
  thread: (c: ItemComentario) => <ThreadDeComentarios post={post} comentarios={[c]} carregando={false} enviando={false} aoVoltar={vi.fn()} aoEnviarComentario={vi.fn(async () => true)} />,
  modal: (c: ItemComentario) => <ModalComentarios aberto post={post} comentarios={[c]} carregando={false} enviando={false} aoFechar={vi.fn()} aoEnviarComentario={vi.fn(async () => true)} />,
};
afterEach(cleanup);
describe('Nota junto ao áudio de respostas', () => {
  it.each(Object.entries(superfícies))('%s mantém controles nativos, nota zero acessível e remove texto antigo', (_nome, componente) => {
    const { container } = render(<MemoryRouter>{componente(resposta)}</MemoryRouter>);
    const audio = container.querySelector('audio');
    const nota = screen.getByRole('img', { name: 'Nota: 0 de 100' });
    expect(audio?.getAttribute('src')).toBe('https://example.test/audio.webm');
    expect(audio?.hasAttribute('controls')).toBe(true);
    expect(audio?.closest('.audio-com-nota')?.contains(nota)).toBe(true);
    expect(screen.queryByText('AVALIADO DEPOIS')).toBeNull();
  });
  it.each(Object.entries(superfícies))('%s não mostra nota quando o áudio não está disponível', (_nome, componente) => {
    const semAudio = { ...resposta, anexo: undefined };
    render(<MemoryRouter>{componente(semAudio)}</MemoryRouter>);
    expect(screen.queryByRole('img', { name: 'Nota: 0 de 100' })).toBeNull();
  });
});
