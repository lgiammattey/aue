// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { PortaDeForum } from '../../portas/forum';
import { TopArrotadoresDaHome } from './TopArrotadoresDaHome';

const tocar = vi.fn().mockResolvedValue(undefined);
vi.mock('../../plataforma/web/reprodutorDoTop', () => ({ criarReprodutorDoTop: () => ({ tocar, pausar: vi.fn(), soltar: vi.fn() }) }));
const pessoa = { handle: 'bia', apelido: 'Bia', avatarUrl: null, nota: 81, alvoTipo: 'topico' as const, alvoId: '00000000-0000-0000-0000-000000000001', fonte: 'anexo' as const };
function porta(overrides: object = {}): PortaDeForum {
  return {
    listarTopArrotadores: vi.fn().mockResolvedValue({ ok: true, valor: [pessoa] }),
    listarAnexosDoForum: vi.fn().mockResolvedValue({ ok: true, valor: [{ alvo: 'topico', alvoId: pessoa.alvoId, tipo: 'audio', caminho: 'protegido' }] }),
    assinarAnexoDoForum: vi.fn().mockResolvedValue({ ok: true, valor: 'https://exemplo.test/assinada' }),
    ...overrides,
  } as unknown as PortaDeForum;
}
afterEach(() => { cleanup(); vi.clearAllMocks(); });
describe('Top de arrotadores na home', () => {
  it('mostra a nota real, leva ao perfil e busca autorização para ouvir o áudio escolhido', async () => {
    const api = porta();
    render(<MemoryRouter><TopArrotadoresDaHome porta={api} /></MemoryRouter>);
    expect((await screen.findByRole('link', { name: 'Bia' })).getAttribute('href')).toBe('/u/bia');
    expect(screen.getByRole('heading', { name: 'Top arrotadores' })).toBeTruthy();
    expect(screen.getByRole('region', { name: 'Top arrotadores' })).toBeTruthy();
    expect(screen.getByText('81')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Ouvir arroto de Bia' }));
    await waitFor(() => expect(tocar).toHaveBeenCalledWith('https://exemplo.test/assinada'));
    expect(api.listarAnexosDoForum).toHaveBeenCalledWith({ topicoIds: [pessoa.alvoId] });
    expect(api.assinarAnexoDoForum).toHaveBeenCalledWith('protegido');
  });
  it('ouve o áudio público real de uma conta da casa pela projeção autorizada', async () => {
    const api = porta({
      listarTopArrotadores: vi.fn().mockResolvedValue({ ok: true, valor: [{ ...pessoa, handle: 'giam', apelido: 'Giam', fonte: 'casa' }] }),
      listarAudioDosTopicos: vi.fn().mockResolvedValue({ ok: true, valor: [{ topicoId: pessoa.alvoId, audio: { caminhoDoAudioDaCasa: 'som-publico' } }] }),
      enderecoDoAudioDaCasa: vi.fn().mockReturnValue('https://exemplo.test/som-publico'),
    });
    render(<MemoryRouter><TopArrotadoresDaHome porta={api} /></MemoryRouter>);
    fireEvent.click(await screen.findByRole('button', { name: 'Ouvir arroto de Giam' }));
    await waitFor(() => expect(tocar).toHaveBeenCalledWith('https://exemplo.test/som-publico'));
    expect(api.listarAudioDosTopicos).toHaveBeenCalledWith([pessoa.alvoId]);
    expect(api.listarAnexosDoForum).not.toHaveBeenCalled();
  });

  it('mostra ausência real e erro sem inventar pessoas ou notas', async () => {
    const api = porta({ listarTopArrotadores: vi.fn().mockResolvedValue({ ok: true, valor: [] }) });
    render(<MemoryRouter><TopArrotadoresDaHome porta={api} /></MemoryRouter>);
    expect(await screen.findByText('Ainda não há arrotos públicos com nota no ranking.')).toBeTruthy();
    expect(screen.queryByRole('listitem')).toBeNull();
  });
  it('informa quando o arquivo deixou de estar disponível', async () => {
    const api = porta({ assinarAnexoDoForum: vi.fn().mockResolvedValue({ ok: false, motivo: 'falhou' }) });
    render(<MemoryRouter><TopArrotadoresDaHome porta={api} /></MemoryRouter>);
    fireEvent.click(await screen.findByRole('button', { name: 'Ouvir arroto de Bia' }));
    expect((await screen.findByRole('status')).textContent).toContain('Não deu para ouvir');
  });
});
