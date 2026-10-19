// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { criarAmbienteDoForumWeb } from './ambienteDoForum';

afterEach(() => {
  document.body.innerHTML = '';
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

function montar() {
  document.body.innerHTML = '<input id="a" type="text"><textarea id="b"></textarea><button id="c">ok</button><input id="d" type="checkbox"><select id="e"></select>';
  return {
    a: document.getElementById('a') as HTMLInputElement,
    b: document.getElementById('b') as HTMLTextAreaElement,
    c: document.getElementById('c') as HTMLButtonElement,
    d: document.getElementById('d') as HTMLInputElement,
    e: document.getElementById('e') as HTMLSelectElement,
  };
}

describe('aoMudarFocoEmCampo: o teclado do celular abre quando um campo de texto ganha o foco', () => {
  it('campo de texto, área de texto e select abrem; botão e caixa de seleção não', () => {
    const { a, b, c, d, e } = montar();
    const ouvinte = vi.fn();
    const parar = criarAmbienteDoForumWeb().aoMudarFocoEmCampo(ouvinte);
    for (const [el, esperado] of [[a, true], [b, true], [e, true], [c, false], [d, false]] as const) {
      ouvinte.mockClear();
      el.focus();
      expect(ouvinte).toHaveBeenLastCalledWith(esperado);
      el.blur();
    }
    parar();
  });

  it('sair do campo sem ir para outro fecha; ir de um campo para outro não pisca', () => {
    const { a, b } = montar();
    const ouvinte = vi.fn();
    const parar = criarAmbienteDoForumWeb().aoMudarFocoEmCampo(ouvinte);
    a.focus();
    ouvinte.mockClear();
    b.focus(); // focusout de `a` (relatedTarget = b) e focusin de `b`
    expect(ouvinte.mock.calls.map((c) => c[0])).toEqual([true, true]);
    ouvinte.mockClear();
    b.blur();
    expect(ouvinte).toHaveBeenLastCalledWith(false);
    parar();
  });

  it('devolve quem desfaz a inscrição', () => {
    const { a } = montar();
    const ouvinte = vi.fn();
    const parar = criarAmbienteDoForumWeb().aoMudarFocoEmCampo(ouvinte);
    parar();
    a.focus();
    expect(ouvinte).not.toHaveBeenCalled();
  });
});

describe('centralizarCampo', () => {
  it('campo já à vista: não rola (rolar por cima de um toque faz a página sair de baixo do dedo)', () => {
    const { b } = montar();
    const rolar = vi.fn();
    b.scrollIntoView = rolar;
    b.getBoundingClientRect = () => ({ top: 100, bottom: 200 }) as DOMRect;
    vi.stubGlobal('visualViewport', null);
    criarAmbienteDoForumWeb().centralizarCampo('b');
    expect(rolar).not.toHaveBeenCalled();
  });

  it('sem visualViewport, centraliza na hora', () => {
    const { b } = montar();
    b.getBoundingClientRect = () => ({ top: 5000, bottom: 5100 }) as DOMRect;
    const rolar = vi.fn();
    b.scrollIntoView = rolar;
    vi.stubGlobal('visualViewport', null);
    criarAmbienteDoForumWeb().centralizarCampo('b');
    expect(rolar).toHaveBeenCalledWith({ block: 'center', behavior: 'instant' });
  });

  it('com visualViewport, espera o teclado abrir (resize) e centraliza uma vez só', () => {
    const { b } = montar();
    const rolar = vi.fn();
    b.scrollIntoView = rolar;
    b.getBoundingClientRect = () => ({ top: 5000, bottom: 5100 }) as DOMRect;
    const alvo = new EventTarget();
    vi.stubGlobal('visualViewport', alvo);
    vi.useFakeTimers();
    criarAmbienteDoForumWeb().centralizarCampo('b');
    expect(rolar).not.toHaveBeenCalled();
    alvo.dispatchEvent(new Event('resize'));
    alvo.dispatchEvent(new Event('resize'));
    vi.advanceTimersByTime(500);
    expect(rolar).toHaveBeenCalledTimes(1);
  });

  it('teclado que não abre: centraliza depois de 350ms mesmo assim', () => {
    const { b } = montar();
    const rolar = vi.fn();
    b.scrollIntoView = rolar;
    b.getBoundingClientRect = () => ({ top: 5000, bottom: 5100 }) as DOMRect;
    vi.stubGlobal('visualViewport', new EventTarget());
    vi.useFakeTimers();
    criarAmbienteDoForumWeb().centralizarCampo('b');
    vi.advanceTimersByTime(349);
    expect(rolar).not.toHaveBeenCalled();
    vi.advanceTimersByTime(2);
    expect(rolar).toHaveBeenCalledTimes(1);
  });

  it('campo que não existe ou API ausente: não lança', () => {
    montar();
    vi.stubGlobal('visualViewport', null);
    expect(() => criarAmbienteDoForumWeb().centralizarCampo('nao-existe')).not.toThrow();
  });
});
