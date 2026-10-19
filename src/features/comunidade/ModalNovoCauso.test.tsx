// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ModalNovoCauso } from './ModalNovoCauso';

const comunidades = [
  { id: 'c1', slug: 'eu-arroto-e-dai', nome: 'Eu arroto, e daí?', icone: '💨', descricao: '' },
] as never;

describe('ModalNovoCauso — autoria', () => {
  afterEach(cleanup);

  it('não pede apelido: a autoria é a conta, não um texto digitado', async () => {
    const onSubmit = vi.fn().mockResolvedValue(true);
    render(<ModalNovoCauso aberto comunidades={comunidades} onSubmit={onSubmit} onFechar={vi.fn()} />);

    expect(screen.queryByLabelText(/apelido/i)).toBeNull();

    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Foi no shopping.' } });
    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.click(screen.getByRole('button', { name: 'Publicar arroto' }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit.mock.calls[0][0]).not.toHaveProperty('autorNome');
  });
});
