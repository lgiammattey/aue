// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { ArvoreDeComentarios } from './ArvoreDeComentarios';
import { ordenarEmNiveis } from '../../../nucleo/comunidade/comentarios';
import type { RespostaDeCauso } from '../../../portas/comunidade';

const r = (id: string, respostaAId?: string): RespostaDeCauso => ({
  id,
  causoId: 'p',
  autorNome: `Autor ${id}`,
  autorHandle: `a_${id}`,
  conteudo: `texto ${id}`,
  criadoEm: '2026-10-18T10:00:00Z',
  respostaAId,
});

afterEach(cleanup);

describe('comentário em níveis', () => {
  it('põe cada resposta logo abaixo do pai e trava o recuo em 3 níveis', () => {
    const lista = [r('a'), r('b'), r('a1', 'a'), r('a1x', 'a1'), r('a1xy', 'a1x'), r('b1', 'b')];
    const saida = ordenarEmNiveis(lista).map((i) => `${i.resposta.id}:${i.nivel}`);
    expect(saida).toEqual(['a:0', 'a1:1', 'a1x:2', 'a1xy:2', 'b:0', 'b1:1']);
  });

  it('resposta cujo pai sumiu (escondido) sobe para a raiz em vez de desaparecer', () => {
    expect(ordenarEmNiveis([r('x', 'sumiu')]).map((i) => i.nivel)).toEqual([0]);
  });

  it('Responder abre o campo e envia com o id do comentário respondido', async () => {
    const aoResponder = vi.fn();
    render(<ArvoreDeComentarios comentarios={[r('a')]} aoResponder={aoResponder} />);
    fireEvent.click(screen.getByRole('button', { name: 'Responder' }));
    fireEvent.change(screen.getByLabelText('Responder a @a_a'), { target: { value: 'boa' } });
    fireEvent.click(screen.getByRole('button', { name: 'Enviar' }));
    expect(aoResponder).toHaveBeenCalledWith('boa', 'a');
  });
});
