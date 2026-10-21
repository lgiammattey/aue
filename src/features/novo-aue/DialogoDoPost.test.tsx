// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DialogoDoPost } from './DialogoDoPost';

afterEach(cleanup);

const abrir = (props: Partial<React.ComponentProps<typeof DialogoDoPost>> = {}) => {
  const aoConfirmar = vi.fn();
  const aoCancelar = vi.fn();
  render(<DialogoDoPost tipo="denunciar" titulo="Um post qualquer" temAudio={false} enviando={false} erro={null} aoConfirmar={aoConfirmar} aoCancelar={aoCancelar} {...props} />);
  return { aoConfirmar, aoCancelar };
};

describe('DialogoDoPost', () => {
  it('denunciar: motivo é opcional, vai aparado, e a tela não promete que o post some', () => {
    const { aoConfirmar } = abrir();
    expect(screen.getByRole('dialog', { name: 'Denunciar post' })).toBeTruthy();
    expect(screen.getByText(/o post não some só porque você denunciou/)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Enviar denúncia' }));
    expect(aoConfirmar).toHaveBeenLastCalledWith({ motivo: '', apagarAudio: false });
    fireEvent.change(screen.getByLabelText('Motivo da denúncia'), { target: { value: '  spam  ' } });
    fireEvent.click(screen.getByRole('button', { name: 'Enviar denúncia' }));
    expect(aoConfirmar).toHaveBeenLastCalledWith({ motivo: 'spam', apagarAudio: false });
  });

  it('o motivo tem teto de 500 caracteres', () => {
    abrir();
    expect(screen.getByLabelText('Motivo da denúncia').getAttribute('maxlength')).toBe('500');
  });

  it('apagar: avisa que não dá para desfazer; causo com áudio oferece apagar o arquivo, marcado por padrão', () => {
    const { aoConfirmar } = abrir({ tipo: 'apagar', temAudio: true });
    expect(screen.getByRole('dialog', { name: 'Apagar post' })).toBeTruthy();
    expect(screen.getByText('Isso não dá para desfazer.')).toBeTruthy();
    const caixa = screen.getByRole('checkbox', { name: /Apagar também o áudio/ }) as HTMLInputElement;
    expect(caixa.checked).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: 'Apagar' }));
    expect(aoConfirmar).toHaveBeenLastCalledWith({ motivo: '', apagarAudio: true });
    fireEvent.click(caixa);
    fireEvent.click(screen.getByRole('button', { name: 'Apagar' }));
    expect(aoConfirmar).toHaveBeenLastCalledWith({ motivo: '', apagarAudio: false });
  });

  it('sem áudio, não oferece apagar arquivo', () => {
    abrir({ tipo: 'apagar', temAudio: false });
    expect(screen.queryByRole('checkbox')).toBeNull();
  });

  it('enviando trava tudo; erro aparece como alerta; Esc e Cancelar cancelam', () => {
    const { aoCancelar } = abrir({ erro: 'Não deu para enviar a denúncia agora. Tenta de novo.' });
    expect(screen.getByRole('alert').textContent).toContain('Não deu para enviar a denúncia');
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(aoCancelar).toHaveBeenCalledTimes(2);
    cleanup();
    const outra = abrir({ enviando: true });
    expect((screen.getByRole('button', { name: 'Enviando…' }) as HTMLButtonElement).disabled).toBe(true);
    expect((screen.getByRole('button', { name: 'Cancelar' }) as HTMLButtonElement).disabled).toBe(true);
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
    expect(outra.aoCancelar).not.toHaveBeenCalled();
  });

  it('para comentário, só mudam as frases', () => {
    abrir({ alvo: 'comentário' });
    expect(screen.getByRole('dialog', { name: 'Denunciar comentário' })).toBeTruthy();
    expect(screen.getByText(/o comentário não some só porque você denunciou/)).toBeTruthy();
    cleanup();
    abrir({ tipo: 'apagar', alvo: 'comentário' });
    expect(screen.getByRole('dialog', { name: 'Apagar comentário' })).toBeTruthy();
  });
});
