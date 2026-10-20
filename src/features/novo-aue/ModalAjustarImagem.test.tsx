// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ModalAjustarImagem, recorteDepoisDoArrasto } from './ModalAjustarImagem';

function renderizar(tipo: 'foto' | 'capa' = 'foto') {
  const acoes = {
    aoFechar: vi.fn(), aoSalvar: vi.fn(), aoTrocarArquivo: vi.fn(), aoAlterarRecorte: vi.fn(),
  };
  render(
    <ModalAjustarImagem
      aberto
      tipo={tipo}
      previewUrl="blob:imagem"
      estado="pronto"
      recorte={{ centroX: .5, centroY: .5, zoom: 1.2 }}
      {...acoes}
    />,
  );
  return acoes;
}

describe('ModalAjustarImagem', () => {
  afterEach(cleanup);
  it('oferece ajuste acessível de foto quadrada', () => {
    const acoes = renderizar();

    expect(screen.getByRole('dialog', { name: 'Ajustar foto' })).toBeTruthy();
    expect(screen.getByText(/mínimo 320 × 320/)).toBeTruthy();

    fireEvent.change(screen.getByLabelText(/Zoom/), { target: { value: '145' } });
    expect(acoes.aoAlterarRecorte).toHaveBeenCalled();
  });

  it('muda o enquadramento e os limites para capa', () => {
    renderizar('capa');

    expect(screen.getByRole('dialog', { name: 'Ajustar capa' })).toBeTruthy();
    expect(screen.getByText(/mínimo 1200 × 400/)).toBeTruthy();
  });

  it('preserva o recorte e bloqueia ações enquanto salva', () => {
    const acoes = {
      aoFechar: vi.fn(), aoSalvar: vi.fn(), aoTrocarArquivo: vi.fn(), aoAlterarRecorte: vi.fn(),
    };
    render(
      <ModalAjustarImagem aberto tipo="foto" previewUrl="blob:imagem" estado="enviando" recorte={{ centroX: .5, centroY: .5, zoom: 1 }} {...acoes} />,
    );

    expect(screen.getByRole('button', { name: 'Salvando…' }).hasAttribute('disabled')).toBe(true);
    expect(screen.getByRole('button', { name: 'Fechar ajuste de imagem' }).hasAttribute('disabled')).toBe(true);
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
    expect(acoes.aoFechar).not.toHaveBeenCalled();
  });
});
  it('converte o arrasto na mesma coordenada normalizada salva pelo recorte', () => {
    const depois = recorteDepoisDoArrasto({ centroX: .5, centroY: .5, zoom: 2 }, 100, 0, { larguraDaJanela: 400, alturaDaJanela: 400, larguraDaImagem: 800, alturaDaImagem: 800 });
    expect(depois.centroX).toBe(.375);
    expect(depois.centroY).toBe(.5);
  });
