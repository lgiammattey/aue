// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { TelaComunidade } from './TelaComunidade';
import { FalhaDeLeitura } from '../../nucleo/comunidade/falhaDeLeitura';
import { criarComunidadeWeb } from '../../plataforma/web/comunidade';

describe('TelaComunidade — falha de leitura', () => {
  afterEach(cleanup);

  it('servidor fora do ar mostra erro e "Tentar de novo", não "Nenhum arroto encontrado"', async () => {
    const base = criarComunidadeWeb({ forcarOffline: true });
    const listarFeed = vi
      .fn()
      .mockRejectedValueOnce(new FalhaDeLeitura('feed'))
      .mockResolvedValue([]);
    render(<TelaComunidade porta={{ ...base, listarFeed }} />);

    expect(await screen.findByText('Não deu pra carregar')).toBeDefined();
    expect(screen.queryByText(/Nenhum arroto encontrado/)).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Tentar de novo' }));
    await waitFor(() => expect(screen.queryByText('Não deu pra carregar')).toBeNull());
    expect(listarFeed).toHaveBeenCalledTimes(2);
  });

  it('falha só na lista de comunidades não derruba o feed', async () => {
    const base = criarComunidadeWeb({ forcarOffline: true });
    const listarComunidades = vi.fn().mockRejectedValue(new FalhaDeLeitura('comunidades'));
    render(<TelaComunidade porta={{ ...base, listarComunidades }} />);

    await waitFor(() => expect(listarComunidades).toHaveBeenCalled());
    expect(screen.queryByText('Não deu pra carregar')).toBeNull();
  });
});
