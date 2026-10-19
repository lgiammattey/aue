// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { AbaDesafios } from './components/AbaDesafios';

vi.mock('../../arena/Arena', () => ({ Arena: () => <div>arena</div> }));

function montar(desafios?: never[]) {
  render(
    <AbaDesafios
      desafios={desafios}
      iniciarNoJogo={false}
      aoCriarDesafio={vi.fn()}
      aoCompartilhar={vi.fn()}
    />,
  );
}

describe('AbaDesafios — zero só quando alguém consultou', () => {
  afterEach(cleanup);

  it('sem consulta: não mostra contador nem "Nenhum X1"', () => {
    montar(undefined);
    expect(screen.getByRole('button', { name: /Duelos X1$/ })).toBeDefined();
    expect(screen.queryByText(/\(0\)/)).toBeNull();
    expect(screen.queryByText(/Nenhum X1/)).toBeNull();
  });

  it('consultou e veio vazio: aí sim é zero', () => {
    montar([]);
    expect(screen.getByRole('button', { name: /Duelos X1 \(0\)/ })).toBeDefined();
    fireEvent.click(screen.getByRole('button', { name: /Duelos X1/ }));
    expect(screen.getByText(/Nenhum X1 por aqui ainda/)).toBeDefined();
  });
});
