// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { GrupoExterno, PortaDeGrupos } from '../../portas/grupos';
import { GruposNaHome } from './GruposNaHome';

const grupo: GrupoExterno = { id: '1', slug: 'teste', nome: 'Grupo da galera', descricao: 'Um grupo de teste', plataforma: 'whatsapp', linkDoConvite: 'https://chat.whatsapp.com/exemplo', imagemUrl: null, oficial: false };
function porta(listarGrupos: PortaDeGrupos['listarGrupos']): PortaDeGrupos {
  return { listarGrupos, cadastrarGrupo: vi.fn(), denunciarGrupo: vi.fn() };
}
afterEach(cleanup);
describe('Grupos na home', () => {
  it('mostra apenas WhatsApp e abre o convite público', async () => {
    render(<GruposNaHome porta={porta(vi.fn().mockResolvedValue({ ok: true, grupos: [grupo, { ...grupo, id: '2', nome: 'Telegram', plataforma: 'telegram' }] }))} />);
    const link = await screen.findByRole('link', { name: 'Abrir convite de Grupo da galera no WhatsApp' });
    expect(link.getAttribute('href')).toBe(grupo.linkDoConvite);
    expect(link.getAttribute('target')).toBe('_blank');
    expect(link.getAttribute('rel')).toContain('noopener');
    expect(screen.queryByText('Telegram')).toBeNull();
  });
  it('oferece nova tentativa quando a leitura falha e mostra vazio somente depois de sucesso', async () => {
    const listar = vi.fn().mockResolvedValueOnce({ ok: false, motivo: 'falhou' }).mockResolvedValueOnce({ ok: true, grupos: [] });
    render(<GruposNaHome porta={porta(listar)} />);
    fireEvent.click(await screen.findByRole('button', { name: 'Tentar novamente' }));
    expect(await screen.findByText(/Ainda não tem grupo/)).toBeDefined();
  });
});
