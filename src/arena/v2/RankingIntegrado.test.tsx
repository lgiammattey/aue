// @vitest-environment jsdom
import { useEffect } from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { CapturaPcmV2 } from '../../portas/capturaPcmV2';
import type { PortaDeForum } from '../../portas/forum';
import type { DueloV2 } from '../../portas/dueloV2';
import type { Compartilhamento } from '../../portas/compartilhamento';
import { TopArrotadoresDaHome } from '../../features/novo-aue/TopArrotadoresDaHome';
import { ArenaV2 } from './ArenaV2';
import { FluxoArenaV2 } from './FluxoArenaV2';

const audio = vi.hoisted(() => ({ tocar: vi.fn(async () => {}), pausar: vi.fn(), soltar: vi.fn() }));
vi.mock('../../plataforma/web/reprodutorDoTop', () => ({ criarReprodutorDoTop: () => audio }));
const pessoa = { handle: 'bia', apelido: 'Bia', avatarUrl: null, nota: 81, alvoTipo: 'topico' as const, alvoId: '00000000-0000-0000-0000-000000000001', fonte: 'anexo' as const };
const porta = {
  listarTopArrotadores: vi.fn(async () => ({ ok: true, valor: [pessoa] })),
  listarAnexosDoForum: vi.fn(async () => ({ ok: true, valor: [{ alvo: 'topico', alvoId: pessoa.alvoId, tipo: 'audio', caminho: 'privado' }] })),
  assinarAnexoDoForum: vi.fn(async () => ({ ok: true, valor: 'https://exemplo.test/audio' })),
} as unknown as PortaDeForum;
const captura = {
  iniciar: vi.fn(() => new Promise(() => {})),
  parar: vi.fn(), nivelAtual: vi.fn(() => 0), cancelar: vi.fn(), estaGravando: vi.fn(() => false),
} as unknown as CapturaPcmV2;
afterEach(() => { cleanup(); vi.clearAllMocks(); });

describe('Ranking dentro da Arena', () => {
  it('desmonta o player e solta o áudio ao começar a pedir o microfone', async () => {
    render(<MemoryRouter><ArenaV2 captura={captura} conteudoDoRepouso={<TopArrotadoresDaHome porta={porta} />} /></MemoryRouter>);
    fireEvent.click(await screen.findByRole('button', { name: 'Ouvir arroto de Bia' }));
    await waitFor(() => expect(audio.tocar).toHaveBeenCalledWith('https://exemplo.test/audio'));
    expect(screen.getByRole('button', { name: 'Pausar arroto de Bia' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Gravar agora' }));
    await waitFor(() => expect(audio.soltar).toHaveBeenCalledOnce());
    expect(screen.queryByRole('region', { name: 'Top arrotadores' })).toBeNull();
    expect(captura.iniciar).toHaveBeenCalledOnce();
  });

  it('não começa reprodução pendente depois que a gravação é iniciada', async () => {
    let resolver!: (resultado: { ok: true; valor: string }) => void;
    const assinatura = new Promise<{ ok: true; valor: string }>((resolve) => { resolver = resolve; });
    const assinar = vi.fn(() => assinatura);
    const portaLenta = { ...porta, assinarAnexoDoForum: assinar } as PortaDeForum;
    render(<MemoryRouter><ArenaV2 captura={captura} conteudoDoRepouso={<TopArrotadoresDaHome porta={portaLenta} />} /></MemoryRouter>);
    fireEvent.click(await screen.findByRole('button', { name: 'Ouvir arroto de Bia' }));
    await waitFor(() => expect(assinar).toHaveBeenCalledOnce());
    fireEvent.click(screen.getByRole('button', { name: 'Gravar agora' }));
    await act(async () => { resolver({ ok: true, valor: 'https://exemplo.test/audio' }); await assinatura; });
    expect(audio.tocar).not.toHaveBeenCalled();
  });

  it('libera o ranking ao abrir meus desafios e o restaura ao voltar', async () => {
    const desmontou = vi.fn();
    function Marcador() { useEffect(() => desmontou, []); return <p>Ranking de teste</p>; }
    const duelo = { listarMeusDuelos: vi.fn(async () => ({ ok: true, valor: { itens: [], temMais: false } })) } as unknown as DueloV2;
    const compartilhar = {} as Compartilhamento;
    render(<FluxoArenaV2 modo="criar" captura={captura} duelo={duelo} compartilhar={compartilhar} origem="https://exemplo.test" conteudoDoRepouso={<Marcador />} />);
    expect(screen.getByText('Ranking de teste')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Meus desafios' }));
    expect(await screen.findByText('Nenhum desafio encontrado nesta sessão.')).toBeTruthy();
    expect(desmontou).toHaveBeenCalledOnce();
    expect(screen.queryByText('Ranking de teste')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Voltar' }));
    expect(screen.getByText('Ranking de teste')).toBeTruthy();
  });

  it('não monta ranking nem pede microfone se o slot não é fornecido', () => {
    const desmontou = vi.fn();
    function Marcador() { useEffect(() => desmontou, []); return <p>Ranking de teste</p>; }
    const tela = render(<ArenaV2 captura={captura} />);
    expect(screen.queryByText('Ranking de teste')).toBeNull();
    expect(captura.iniciar).not.toHaveBeenCalled();
    tela.rerender(<ArenaV2 captura={captura} conteudoDoRepouso={<Marcador />} />);
    expect(screen.getByText('Ranking de teste')).toBeTruthy();
    tela.rerender(<ArenaV2 captura={captura} />);
    expect(desmontou).toHaveBeenCalledOnce();
  });
});
