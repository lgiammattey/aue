// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';

import { manterFocoNoDialogo } from './focoNoDialogo';

function montar(botoes: number) {
  document.body.innerHTML = `
    <button id="fora">fora</button>
    <div id="dialogo" role="dialog" tabindex="-1">
      ${Array.from({ length: botoes }, (_, i) => `<button id="b${i + 1}">b${i + 1}</button>`).join('')}
    </div>`;
  const dialogo = document.getElementById('dialogo') as HTMLElement;
  return { dialogo, fora: document.getElementById('fora') as HTMLElement, b: (n: number) => document.getElementById(`b${n}`) as HTMLElement };
}

function tecla(dialogo: HTMLElement, init: KeyboardEventInit) {
  const evento = new KeyboardEvent('keydown', { bubbles: true, cancelable: true, ...init });
  manterFocoNoDialogo(evento, dialogo);
  return evento;
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('manterFocoNoDialogo', () => {
  it('Tab no contêiner vai ao primeiro botão', () => {
    const { dialogo, b } = montar(3);
    dialogo.focus();
    const e = tecla(dialogo, { key: 'Tab' });
    expect(e.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(b(1));
  });

  it('Shift+Tab no contêiner vai ao último botão', () => {
    const { dialogo, b } = montar(3);
    dialogo.focus();
    const e = tecla(dialogo, { key: 'Tab', shiftKey: true });
    expect(e.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(b(3));
  });

  it('Shift+Tab no primeiro vai ao último', () => {
    const { dialogo, b } = montar(3);
    b(1).focus();
    const e = tecla(dialogo, { key: 'Tab', shiftKey: true });
    expect(e.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(b(3));
  });

  it('Tab no último volta ao primeiro', () => {
    const { dialogo, b } = montar(3);
    b(3).focus();
    const e = tecla(dialogo, { key: 'Tab' });
    expect(e.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(b(1));
  });

  it('no meio da lista deixa o navegador andar sozinho', () => {
    const { dialogo, b } = montar(3);
    b(2).focus();
    expect(tecla(dialogo, { key: 'Tab' }).defaultPrevented).toBe(false);
    expect(tecla(dialogo, { key: 'Tab', shiftKey: true }).defaultPrevented).toBe(false);
    expect(document.activeElement).toBe(b(2));
  });

  it('foco fora do diálogo ou no body volta para dentro', () => {
    const { dialogo, fora, b } = montar(3);
    fora.focus();
    expect(tecla(dialogo, { key: 'Tab' }).defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(b(1));
    fora.focus();
    tecla(dialogo, { key: 'Tab', shiftKey: true });
    expect(document.activeElement).toBe(b(3));
    (document.activeElement as HTMLElement).blur();
    expect(document.activeElement).toBe(document.body);
    tecla(dialogo, { key: 'Tab' });
    expect(document.activeElement).toBe(b(1));
  });

  it('lista vazia segura o foco no contêiner, com Tab e Shift+Tab', () => {
    const { dialogo } = montar(0);
    dialogo.focus();
    expect(tecla(dialogo, { key: 'Tab' }).defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(dialogo);
    expect(tecla(dialogo, { key: 'Tab', shiftKey: true }).defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(dialogo);
  });

  it('botão desabilitado não conta como focável', () => {
    const { dialogo, b } = montar(2);
    (b(2) as HTMLButtonElement).disabled = true;
    b(1).focus();
    tecla(dialogo, { key: 'Tab' });
    expect(document.activeElement).toBe(b(1));
  });

  it('tecla que não é Tab e diálogo nulo não fazem nada', () => {
    const { dialogo } = montar(2);
    dialogo.focus();
    expect(tecla(dialogo, { key: 'Escape' }).defaultPrevented).toBe(false);
    expect(tecla(dialogo, { key: 'a', shiftKey: true }).defaultPrevented).toBe(false);
    const e = new KeyboardEvent('keydown', { key: 'Tab', cancelable: true });
    manterFocoNoDialogo(e, null);
    expect(e.defaultPrevented).toBe(false);
  });
});
