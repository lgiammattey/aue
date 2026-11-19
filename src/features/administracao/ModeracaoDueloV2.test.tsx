// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import type { ModeracaoDueloV2 as Porta } from '../../portas/moderacaoDueloV2';
import { ModeracaoDueloV2 } from './ModeracaoDueloV2';
const soltar = vi.hoisted(() => vi.fn());
vi.mock('../../plataforma/web/enderecoDeAudio', () => ({ criarEnderecoLocal: () => 'blob:privado', soltarEnderecoLocal: soltar }));
afterEach(() => { cleanup(); soltar.mockClear(); });
function porta() {
  const p = { listar: vi.fn(async () => [{ id: 'interno', motivo: 'ofensivo' as const, criadoEm: '2026-11-18T00:00:00Z', audioDisponivel: true }]), ouvir: vi.fn(async () => new Blob(['audio'])), decidir: vi.fn(async () => {}) };
  return { p, porta: p as Porta };
}
it('revisa sob demanda, sem expor identificador ou decidir ao ouvir', async () => {
  const { p, porta: servico } = porta(); const tela = render(<ModeracaoDueloV2 porta={servico} />);
  fireEvent.click(await screen.findByRole('button', { name: 'Ouvir áudio 1' }));
  expect(await screen.findByLabelText('Áudio denunciado 1')).toBeTruthy();
  expect(p.ouvir).toHaveBeenCalledWith('interno'); expect(p.decidir).not.toHaveBeenCalled();
  expect(tela.container.textContent).not.toContain('interno');
  tela.unmount(); expect(soltar).toHaveBeenCalledWith('blob:privado');
});
it('exige confirmação e registra decisão antes de atualizar a fila', async () => {
  const { p, porta: servico } = porta(); render(<ModeracaoDueloV2 porta={servico} />);
  fireEvent.click(await screen.findByRole('button', { name: 'Restaurar áudio' }));
  expect(p.decidir).not.toHaveBeenCalled(); fireEvent.click(screen.getByRole('button', { name: 'Confirmar decisão' }));
  expect(await screen.findByText('Decisão registrada.')).toBeTruthy();
  expect(p.decidir).toHaveBeenCalledWith('interno', 'restaurada'); expect(p.listar).toHaveBeenCalledTimes(2);
});
it('avisa quando a fila falha e permite atualizar', async () => {
  const { p, porta: servico } = porta(); p.listar.mockRejectedValueOnce(new Error('rede')); render(<ModeracaoDueloV2 porta={servico} />);
  expect(await screen.findByRole('alert')).toBeTruthy(); fireEvent.click(screen.getByRole('button', { name: 'Atualizar denúncias' }));
  expect(await screen.findByRole('button', { name: 'Ouvir áudio 1' })).toBeTruthy();
});
