// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

import { criarControleDeDialogoWeb } from './controleDeDialogo';

afterEach(() => {
  document.body.innerHTML = '';
  document.body.removeAttribute('style');
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

function definirRolagem(y: number): void {
  Object.defineProperty(window, 'scrollY', { configurable: true, value: y });
}

describe('controle de diálogo web', () => {
  it('captura a rolagem, fixa o documento e restaura a posição ao fechar', () => {
    definirRolagem(384);
    const rolar = vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined);
    const soltar = criarControleDeDialogoWeb().bloquearRolagemDoDocumento();

    expect(document.body.style.position).toBe('fixed');
    expect(document.body.style.top).toBe('-384px');
    expect(document.body.style.width).toBe('100%');
    expect(document.body.style.overflow).toBe('hidden');

    soltar();

    expect(document.body.style.cssText).toBe('');
    expect(rolar).toHaveBeenCalledWith(0, 384);
  });

  it('preserva estilos inline que já existiam no documento', () => {
    document.body.style.setProperty('position', 'relative');
    document.body.style.setProperty('width', 'min(100%, 1200px)', 'important');
    definirRolagem(12);
    vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined);

    const soltar = criarControleDeDialogoWeb().bloquearRolagemDoDocumento();
    expect(document.body.style.position).toBe('fixed');
    expect(document.body.style.getPropertyPriority('width')).toBe('important');
    soltar();

    expect(document.body.style.position).toBe('relative');
    expect(document.body.style.width).toBe('min(100%, 1200px)');
    expect(document.body.style.getPropertyPriority('width')).toBe('important');
  });

  it('mantém a rolagem bloqueada até o último diálogo fechar', () => {
    definirRolagem(91);
    const rolar = vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined);
    const controle = criarControleDeDialogoWeb();
    const fecharPrimeiro = controle.bloquearRolagemDoDocumento();
    const fecharSegundo = controle.bloquearRolagemDoDocumento();

    fecharPrimeiro();
    expect(document.body.style.position).toBe('fixed');
    expect(rolar).not.toHaveBeenCalled();

    fecharSegundo();
    expect(document.body.style.position).toBe('');
    expect(rolar).toHaveBeenCalledTimes(1);
    expect(rolar).toHaveBeenCalledWith(0, 91);
  });

  it('desfazer duas vezes é inofensivo', () => {
    definirRolagem(8);
    const rolar = vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined);
    const soltar = criarControleDeDialogoWeb().bloquearRolagemDoDocumento();

    soltar();
    soltar();

    expect(rolar).toHaveBeenCalledTimes(1);
    expect(document.body.style.position).toBe('');
  });
});

describe('campo com teclado virtual', () => {
  it('não rola um campo que já está visível', () => {
    const campo = document.createElement('textarea');
    campo.id = 'resposta';
    campo.scrollIntoView = vi.fn();
    campo.getBoundingClientRect = () => ({ top: 100, bottom: 180 }) as DOMRect;
    document.body.append(campo);
    vi.stubGlobal('visualViewport', null);

    const desfazer = criarControleDeDialogoWeb().manterCampoVisivelAoAbrirTeclado('resposta');

    expect(campo.scrollIntoView).not.toHaveBeenCalled();
    desfazer();
  });

  it('espera o resize do VisualViewport e centraliza uma única vez', () => {
    const campo = document.createElement('textarea');
    campo.id = 'resposta';
    campo.scrollIntoView = vi.fn();
    campo.getBoundingClientRect = () => ({ top: 600, bottom: 680 }) as DOMRect;
    document.body.append(campo);
    const viewport = new EventTarget();
    Object.defineProperty(viewport, 'height', { value: 500 });
    vi.stubGlobal('visualViewport', viewport);
    vi.useFakeTimers();

    criarControleDeDialogoWeb().manterCampoVisivelAoAbrirTeclado('resposta');
    viewport.dispatchEvent(new Event('resize'));
    viewport.dispatchEvent(new Event('resize'));
    vi.advanceTimersByTime(500);

    expect(campo.scrollIntoView).toHaveBeenCalledTimes(1);
    expect(campo.scrollIntoView).toHaveBeenCalledWith({ block: 'center', behavior: 'instant' });
  });

  it('cleanup cancela a espera e não deixa listener rolar depois do fechamento', () => {
    const campo = document.createElement('textarea');
    campo.id = 'resposta';
    campo.scrollIntoView = vi.fn();
    campo.getBoundingClientRect = () => ({ top: 600, bottom: 680 }) as DOMRect;
    document.body.append(campo);
    const viewport = new EventTarget();
    Object.defineProperty(viewport, 'height', { value: 500 });
    vi.stubGlobal('visualViewport', viewport);
    vi.useFakeTimers();

    const desfazer = criarControleDeDialogoWeb().manterCampoVisivelAoAbrirTeclado('resposta');
    desfazer();
    viewport.dispatchEvent(new Event('resize'));
    vi.advanceTimersByTime(500);

    expect(campo.scrollIntoView).not.toHaveBeenCalled();
  });
});
