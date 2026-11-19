// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import type { DueloV2, MeuDueloV2, RecuperacaoV2, ResultadoDueloV2 } from '../../../portas/dueloV2';
import { MeusDuelosV2 } from './MeusDuelosV2';

const soltar = vi.hoisted(() => vi.fn());
vi.mock('../../../plataforma/web/enderecoDeAudio', () => ({ criarEnderecoLocal: () => 'blob:teste', soltarEnderecoLocal: soltar }));
afterEach(() => { cleanup(); soltar.mockClear(); });
const item: MeuDueloV2 = { id: 'duelo-privado', gravacaoPropriaId: 'audio-privado', lado: 'criador', estado: 'respondido', versao: 1, prazo: '2027-01-01T12:00:00Z' };
const revelado: RecuperacaoV2 = { estado: 'revelado', resultado: { criador: { duracaoMs: 1500 }, desafiante: { duracaoMs: 1000 }, resultadoProvisorio: 'criador', versaoRegua: 'experimental-2', origemMedicao: 'cliente_nao_verificada' } };
function portas() {
  const d = {
    listarMeusDuelos: vi.fn(async (_offset: number) => ({ ok: true as const, valor: { itens: [item], temMais: false } })),
    recuperar: vi.fn(async (_id: string): Promise<ResultadoDueloV2<RecuperacaoV2>> => ({ ok: true, valor: revelado })),
    baixarAudioRecuperado: vi.fn(async (_id: string, _lado: 'criador' | 'desafiante') => ({ ok: true as const, valor: new Blob(['teste']) })),
    novoToken: vi.fn(() => ({ ok: true as const, valor: 'a'.repeat(64) })),
    reemitir: vi.fn(async (_id: string, _token: string, _versao: number) => ({ ok: true as const, valor: { estado: 'aguardando_resposta' as const, id: item.id, prazo: item.prazo, versao: 2 } })),
    revogar: vi.fn(async (_id: string, _versao: number) => ({ ok: true as const, valor: { estado: 'revogado' as const, id: item.id, prazo: item.prazo, versao: 2 } })),
    removerGravacao: vi.fn(async (_id: string) => ({ ok: true as const, valor: 'removida' as const })),
    denunciarPorDuelo: vi.fn(async (_id: string, _lado: 'criador' | 'desafiante', _motivo: 'ofensivo' | 'outro') => ({ ok: true as const, valor: 'registrada' as const })),
  };
  return { d, duelo: d as unknown as DueloV2 };
}

it('lista estado e prazo, preserva identificadores internos e avisa sobre sessão anônima', async () => {
  const { d, duelo } = portas();
  const { container } = render(<MeusDuelosV2 duelo={duelo} aoVoltar={vi.fn()} />);
  expect(await screen.findByText(/Desafio 1 · Respondido/)).toBeTruthy();
  expect(screen.getByText(/Prazo do convite:/)).toBeTruthy();
  expect(screen.getByText(/sessão anônima/)).toBeTruthy();
  expect(container.textContent).not.toContain(item.id);
  expect(container.textContent).not.toContain(item.gravacaoPropriaId);
  expect(d.recuperar).not.toHaveBeenCalled();
  expect(d.baixarAudioRecuperado).not.toHaveBeenCalled();
});

it('recupera resultado pelo servidor e só baixa o áudio ao pedir', async () => {
  const { d, duelo } = portas();
  render(<MeusDuelosV2 duelo={duelo} aoVoltar={vi.fn()} />);
  fireEvent.click(await screen.findByRole('button', { name: 'Abrir desafio 1' }));
  expect(await screen.findByText('Você levou esta rodada.')).toBeTruthy();
  expect(d.recuperar).toHaveBeenCalledExactlyOnceWith(item.id);
  expect(d.baixarAudioRecuperado).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Ouvir adversário' }));
  expect(await screen.findByLabelText('Áudio do adversário')).toBeTruthy();
  expect(d.baixarAudioRecuperado).toHaveBeenCalledExactlyOnceWith(item.id, 'desafiante');
  fireEvent.click(screen.getByRole('button', { name: 'Voltar para desafios' }));
  expect(soltar).toHaveBeenCalledExactlyOnceWith('blob:teste');
});

it('usa o lado da sessão ao apresentar resultado do respondente', async () => {
  const { d, duelo } = portas();
  d.listarMeusDuelos.mockResolvedValueOnce({ ok: true, valor: { itens: [{ ...item, lado: 'desafiante' }], temMais: false } });
  render(<MeusDuelosV2 duelo={duelo} aoVoltar={vi.fn()} />);
  fireEvent.click(await screen.findByRole('button', { name: 'Abrir desafio 1' }));
  expect(await screen.findByText('Seu adversário levou esta rodada.')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Ouvir minha tentativa' }));
  expect(await screen.findByLabelText('Sua gravação')).toBeTruthy();
  expect(d.baixarAudioRecuperado).toHaveBeenCalledExactlyOnceWith(item.id, 'desafiante');
});

it('não mostra nem baixa resultado se o servidor recusar recuperação', async () => {
  const { d, duelo } = portas();
  d.recuperar.mockResolvedValueOnce({ ok: true, valor: { estado: 'indisponivel' } });
  render(<MeusDuelosV2 duelo={duelo} aoVoltar={vi.fn()} />);
  fireEvent.click(await screen.findByRole('button', { name: 'Abrir desafio 1' }));
  expect(await screen.findByText('Este desafio está indisponível.')).toBeTruthy();
  expect(screen.queryByRole('heading', { name: 'RESULTADO PROVISÓRIO' })).toBeNull();
  expect(d.baixarAudioRecuperado).not.toHaveBeenCalled();
});

it('distingue falha da lista de lista vazia e permite tentar de novo', async () => {
  const { d, duelo } = portas();
  d.listarMeusDuelos.mockRejectedValueOnce(new Error('rede'));
  render(<MeusDuelosV2 duelo={duelo} aoVoltar={vi.fn()} />);
  expect(await screen.findByRole('alert')).toBeTruthy();
  expect(screen.queryByText(/Nenhum desafio/)).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }));
  expect(await screen.findByText(/Desafio 1 · Respondido/)).toBeTruthy();
});

it('mostra convite pendente sem prometer acesso ao link perdido', async () => {
  const { d, duelo } = portas();
  d.recuperar.mockResolvedValueOnce({ ok: true, valor: { estado: 'aguardando_resposta', id: item.id, prazo: item.prazo, versao: 1 } });
  render(<MeusDuelosV2 duelo={duelo} aoVoltar={vi.fn()} />);
  fireEvent.click(await screen.findByRole('button', { name: 'Abrir desafio 1' }));
  expect(await screen.findByText('O link original não pode ser recuperado aqui.')).toBeTruthy();
  expect(screen.queryByRole('button', { name: /Ouvir/ })).toBeNull();
});

it('ignora resposta tardia depois de voltar à lista', async () => {
  const { d, duelo } = portas();
  let concluir!: (valor: ResultadoDueloV2<RecuperacaoV2>) => void;
  d.recuperar.mockReturnValueOnce(new Promise(resolve => { concluir = resolve; }));
  render(<MeusDuelosV2 duelo={duelo} aoVoltar={vi.fn()} />);
  fireEvent.click(await screen.findByRole('button', { name: 'Abrir desafio 1' }));
  fireEvent.click(screen.getByRole('button', { name: 'Voltar para desafios' }));
  await act(async () => { concluir({ ok: true, valor: revelado }); });
  expect(screen.queryByRole('heading', { name: 'RESULTADO PROVISÓRIO' })).toBeNull();
  expect(screen.getByRole('button', { name: 'Abrir desafio 1' })).toBeTruthy();
});


it('reemite convite sem revelar o token antigo e revoga a versão nova', async () => {
  const { d, duelo } = portas();
  d.recuperar.mockResolvedValueOnce({ ok: true, valor: { estado: 'aguardando_resposta', id: item.id, prazo: item.prazo, versao: 1 } });
  const compartilhar = { copiar: vi.fn(), compartilhar: vi.fn() } as never;
  render(<MeusDuelosV2 duelo={duelo} compartilhar={compartilhar} origem="https://teste.example" aoVoltar={vi.fn()} />);
  fireEvent.click(await screen.findByRole('button', { name: 'Abrir desafio 1' }));
  fireEvent.click(await screen.findByRole('button', { name: 'Gerar novo convite' }));
  const input = await screen.findByLabelText('Link do desafio') as HTMLInputElement;
  expect(input.value).toBe(`https://teste.example/duelo#t=${'a'.repeat(64)}`);
  expect(d.reemitir).toHaveBeenCalledWith(item.gravacaoPropriaId, 'a'.repeat(64), 1);
  fireEvent.click(screen.getByRole('button', { name: 'Revogar convite' }));
  expect((await screen.findAllByText('Convite revogado.')).length).toBeGreaterThan(0);
  expect(d.revogar).toHaveBeenCalledWith(item.gravacaoPropriaId, 2);
  expect(screen.queryByLabelText('Link do desafio')).toBeNull();
});

it('exige confirmação e informa exclusão pendente', async () => {
  const { d, duelo } = portas();
  d.removerGravacao.mockResolvedValueOnce({ ok: true, valor: 'remocao_pendente' } as never);
  render(<MeusDuelosV2 duelo={duelo} aoVoltar={vi.fn()} />);
  fireEvent.click(await screen.findByRole('button', { name: 'Abrir desafio 1' }));
  fireEvent.click(await screen.findByRole('button', { name: 'Excluir minha gravação' }));
  expect(d.removerGravacao).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Confirmar exclusão' }));
  expect(await screen.findByText('Exclusão pendente. Para pedir ajuda, use o contato na política de privacidade.')).toBeTruthy();
  expect(d.removerGravacao).toHaveBeenCalledWith(item.gravacaoPropriaId);
});

it('denuncia o adversário correto sem reproduzir áudio', async () => {
  const { d, duelo } = portas();
  render(<MeusDuelosV2 duelo={duelo} aoVoltar={vi.fn()} />);
  fireEvent.click(await screen.findByRole('button', { name: 'Abrir desafio 1' }));
  fireEvent.click(await screen.findByRole('button', { name: 'Denunciar áudio do adversário' }));
  fireEvent.click(screen.getByLabelText('Conteúdo ofensivo'));
  fireEvent.click(screen.getByRole('button', { name: 'Enviar denúncia' }));
  expect(await screen.findByText(/Denúncia registrada/)).toBeTruthy();
  expect(d.denunciarPorDuelo).toHaveBeenCalledWith(item.id, 'desafiante', 'ofensivo');
  expect(d.baixarAudioRecuperado).not.toHaveBeenCalled();
});

it('repete a reemissão incerta com o mesmo token e versão', async () => {
  const { d, duelo } = portas();
  d.recuperar.mockResolvedValueOnce({ ok: true, valor: { estado: 'aguardando_resposta', id: item.id, prazo: item.prazo, versao: 1 } });
  d.reemitir.mockRejectedValueOnce(new Error('resposta perdida'));
  render(<MeusDuelosV2 duelo={duelo} compartilhar={{} as never} origem="https://teste.example" aoVoltar={vi.fn()} />);
  fireEvent.click(await screen.findByRole('button', { name: 'Abrir desafio 1' }));
  fireEvent.click(await screen.findByRole('button', { name: 'Gerar novo convite' }));
  expect(await screen.findByText('Não foi possível confirmar. Tente novamente.')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Gerar novo convite' }));
  expect(await screen.findByLabelText('Link do desafio')).toBeTruthy();
  expect(d.novoToken).toHaveBeenCalledOnce();
  expect(d.reemitir).toHaveBeenCalledTimes(2);
  expect(d.reemitir.mock.calls[0]).toEqual(d.reemitir.mock.calls[1]);
});

it('permite excluir a própria gravação mesmo quando o duelo está indisponível', async () => {
  const { d, duelo } = portas();
  d.recuperar.mockResolvedValueOnce({ ok: true, valor: { estado: 'indisponivel' } });
  render(<MeusDuelosV2 duelo={duelo} aoVoltar={vi.fn()} />);
  fireEvent.click(await screen.findByRole('button', { name: 'Abrir desafio 1' }));
  fireEvent.click(await screen.findByRole('button', { name: 'Excluir minha gravação' }));
  fireEvent.click(screen.getByRole('button', { name: 'Confirmar exclusão' }));
  expect(await screen.findByText('Gravação excluída.')).toBeTruthy();
  expect(d.removerGravacao).toHaveBeenCalledWith(item.gravacaoPropriaId);
});

it('não oferece link antigo após reemissão com resposta perdida', async () => {
  const { d, duelo } = portas();
  d.recuperar.mockResolvedValueOnce({ ok: true, valor: { estado: 'aguardando_resposta', id: item.id, prazo: item.prazo, versao: 1 } });
  d.reemitir.mockResolvedValueOnce({ ok: true, valor: { estado: 'aguardando_resposta', id: item.id, prazo: item.prazo, versao: 2 } });
  d.reemitir.mockResolvedValueOnce({ ok: false, motivo: 'criacao_incerta' } as never);
  render(<MeusDuelosV2 duelo={duelo} compartilhar={{} as never} origem="https://teste.example" aoVoltar={vi.fn()} />);
  fireEvent.click(await screen.findByRole('button', { name: 'Abrir desafio 1' }));
  fireEvent.click(await screen.findByRole('button', { name: 'Gerar novo convite' }));
  expect(await screen.findByLabelText('Link do desafio')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Gerar novo convite' }));
  expect(await screen.findByText(/O link anterior pode ter deixado de funcionar/)).toBeTruthy();
  expect(screen.queryByLabelText('Link do desafio')).toBeNull();
});
