// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import { AvisoExclusaoTelemetria, ComAvisoExclusaoTelemetria } from './AvisoExclusaoTelemetria';

afterEach(cleanup);
it('confirma exclusão só quando a gravação do cookie foi confirmada e oferece reversão', () => {
  render(<AvisoExclusaoTelemetria estado="ativada" />);
  expect(screen.getByRole('status').textContent).toMatch(/Este navegador foi excluído/);
  expect(screen.getByRole('link', { name: /Voltar a contar/ }).getAttribute('href')).toBe('/?voltar-a-contar=1');
});
it('mostra limite em vez de afirmar persistência quando não confirmou o cookie', () => {
  render(<AvisoExclusaoTelemetria estado="ativacao_nao_persistida" />);
  expect(screen.getByRole('status').textContent).toMatch(/não confirmou o cookie/);
  expect(screen.getByRole('status').textContent).not.toMatch(/Este navegador foi excluído/);
});
it('confirma o retorno e oferece exclusão novamente', () => {
  render(<AvisoExclusaoTelemetria estado="desativada" />);
  expect(screen.getByRole('status').textContent).toMatch(/exclusão foi removida/);
  expect(screen.getByRole('link', { name: /Excluir este navegador/ }).getAttribute('href')).toBe('/?nao-contar=1');
});
it('não afirma remoção caso o cookie ainda exista', () => {
  render(<AvisoExclusaoTelemetria estado="desativacao_nao_confirmada" />);
  expect(screen.getByRole('status').textContent).toMatch(/Não foi possível confirmar/);
  expect(screen.getByRole('status').textContent).not.toMatch(/exclusão foi removida/);
});
it('preserva a árvore original sem aviso e empilha conteúdo quando o aviso aparece', () => {
  const { container, rerender } = render(<ComAvisoExclusaoTelemetria estado="nenhuma"><main>Arena</main></ComAvisoExclusaoTelemetria>);
  expect(container.firstElementChild?.tagName).toBe('MAIN');
  rerender(<ComAvisoExclusaoTelemetria estado="ativada"><main>Arena</main></ComAvisoExclusaoTelemetria>);
  const moldura = container.firstElementChild as HTMLElement;
  expect(moldura.style.flexDirection).toBe('column');
  expect(moldura.style.width).toBe('100%');
  expect(moldura.children[0].getAttribute('role')).toBe('status');
  expect(moldura.children[1].tagName).toBe('MAIN');
});
