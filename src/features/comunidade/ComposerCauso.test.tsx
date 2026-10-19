// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ComposerCauso } from './components/ComposerCauso';

const perfil = { id: 'u1', nome: 'Ana', handle: 'ana', vitoriasX1: 0, derrotasX1: 0 } as never;

describe('ComposerCauso — autoria', () => {
  afterEach(cleanup);

  it('não pede apelido e o envio não leva nome digitado', async () => {
    const aoPostar = vi.fn().mockResolvedValue(true);
    render(
      <ComposerCauso
        aoPostar={aoPostar}
        aoAbrirArrotar={vi.fn()}
        aoAbrirDesafio={vi.fn()}
        perfil={perfil}
        comunidades={[]}
      />,
    );

    expect(screen.queryByPlaceholderText(/apelido/i)).toBeNull();

    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Foi no shopping.' } });
    fireEvent.click(screen.getByRole('button', { name: /postar|publicar|enviar/i }));

    await waitFor(() => expect(aoPostar).toHaveBeenCalledTimes(1));
    expect(aoPostar.mock.calls[0][0]).not.toHaveProperty('autorNome');
  });
});
