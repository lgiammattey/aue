// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ModalGerirComunidade } from './ModalGerirComunidade';

describe('ModalGerirComunidade', () => {
  afterEach(cleanup);

  it('encaminha a foto escolhida para o editor sem criar preview local', () => {
    const aoEscolherMidia = vi.fn();
    const arquivo = new File(['imagem'], 'comunidade.png', { type: 'image/png' });
    render(
      <ModalGerirComunidade
        aberto
        regrasIniciais={[]}
        moderadoresIniciais={[]}
        podeGerirMidia
        aoFechar={vi.fn()}
        aoSalvar={vi.fn()}
        aoEscolherMidia={aoEscolherMidia}
        aoRemoverMidia={vi.fn()}
      />,
    );

    fireEvent.change(screen.getByLabelText('Foto de perfil da comunidade'), { target: { files: [arquivo] } });

    expect(aoEscolherMidia).toHaveBeenCalledWith('avatar', arquivo);
  });

  it('desabilita a edição quando a comunidade não autorizou gestão', () => {
    render(
      <ModalGerirComunidade
        aberto
        regrasIniciais={[]}
        moderadoresIniciais={[]}
        podeGerirMidia={false}
        aoFechar={vi.fn()}
        aoSalvar={vi.fn()}
        aoEscolherMidia={vi.fn()}
        aoRemoverMidia={vi.fn()}
      />,
    );

    expect(screen.getByRole('button', { name: '+ Escolher foto' }).hasAttribute('disabled')).toBe(true);
    expect(screen.getByRole('button', { name: '+ Escolher thumbnail/capa' }).hasAttribute('disabled')).toBe(true);
  });
});
