// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
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
        podeEditarRegras
        aoFechar={vi.fn()}
        aoSalvar={vi.fn(async () => ({ ok: true }))}
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
        podeEditarRegras={false}
        aoFechar={vi.fn()}
        aoSalvar={vi.fn(async () => ({ ok: true }))}
        aoEscolherMidia={vi.fn()}
        aoRemoverMidia={vi.fn()}
      />,
    );

    expect(screen.getByRole('button', { name: '+ Escolher foto' }).hasAttribute('disabled')).toBe(true);
    expect(screen.getByRole('button', { name: '+ Escolher thumbnail/capa' }).hasAttribute('disabled')).toBe(true);
  });

  const abrirComRegras = (aoSalvar: (r: string[]) => Promise<{ ok: boolean; mensagem?: string }>, aoFechar = vi.fn()) =>
    render(
      <ModalGerirComunidade
        aberto
        regrasIniciais={['Respeite quem está na roda.']}
        moderadoresIniciais={[['u/giamzinn_aue', 'moderação']]}
        podeGerirMidia
        podeEditarRegras
        aoFechar={aoFechar}
        aoSalvar={aoSalvar}
        aoEscolherMidia={vi.fn()}
        aoRemoverMidia={vi.fn()}
      />,
    );

  it('só fecha depois que o servidor confirmar as regras', async () => {
    const aoFechar = vi.fn();
    const aoSalvar = vi.fn(async () => ({ ok: true }));
    abrirComRegras(aoSalvar, aoFechar);
    fireEvent.change(screen.getByLabelText('Regras da comunidade'), { target: { value: 'Uma\n\n  Duas  ' } });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar regras' }));
    await waitFor(() => expect(aoFechar).toHaveBeenCalled());
    expect(aoSalvar).toHaveBeenCalledWith(['Uma', 'Duas']);
  });

  it('falha ao salvar mantém aberto, mostra o motivo e não finge sucesso', async () => {
    const aoFechar = vi.fn();
    abrirComRegras(vi.fn(async () => ({ ok: false, mensagem: 'Não consegui salvar as regras agora. Nada mudou.' })), aoFechar);
    fireEvent.click(screen.getByRole('button', { name: 'Salvar regras' }));
    expect((await screen.findByRole('alert')).textContent).toContain('Nada mudou');
    expect(aoFechar).not.toHaveBeenCalled();
  });

  it('mais de 10 regras ou regra com mais de 140 caracteres nem chega ao servidor', () => {
    const aoSalvar = vi.fn(async () => ({ ok: true }));
    abrirComRegras(aoSalvar);
    fireEvent.change(screen.getByLabelText('Regras da comunidade'), { target: { value: 'x'.repeat(141) } });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar regras' }));
    expect(screen.getByRole('alert').textContent).toContain('140');
    fireEvent.change(screen.getByLabelText('Regras da comunidade'), { target: { value: Array.from({ length: 11 }, (_, i) => `r${i}`).join('\n') } });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar regras' }));
    expect(screen.getByRole('alert').textContent).toContain('10');
    expect(aoSalvar).not.toHaveBeenCalled();
  });

  it('moderadores são só leitura e quem não pode editar não vê Salvar', () => {
    render(
      <ModalGerirComunidade
        aberto
        regrasIniciais={[]}
        moderadoresIniciais={[['u/giamzinn_aue', 'moderação']]}
        podeGerirMidia={false}
        podeEditarRegras={false}
        aoFechar={vi.fn()}
        aoSalvar={vi.fn(async () => ({ ok: true }))}
        aoEscolherMidia={vi.fn()}
        aoRemoverMidia={vi.fn()}
      />,
    );
    expect(screen.getByText(/u\/giamzinn_aue · moderação/)).toBeTruthy();
    expect(screen.queryByRole('button', { name: /Salvar/ })).toBeNull();
    expect(screen.queryByRole('textbox', { name: 'Moderadores' })).toBeNull();
  });
});
