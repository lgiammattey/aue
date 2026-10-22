// @vitest-environment jsdom
import { cleanup, render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { Telemetria } from '../../portas/telemetria';
import { RastreadorDePaginas } from './RastreadorDePaginas';

describe('RastreadorDePaginas', () => {
  afterEach(cleanup);

  it('envia somente a categoria agregada da rota pública', () => {
    const telemetria: Telemetria = { registrar: vi.fn() };
    render(<MemoryRouter initialEntries={['/c/eu-arroto-e-dai/t/segredo']}><RastreadorDePaginas telemetria={telemetria} /></MemoryRouter>);
    expect(telemetria.registrar).toHaveBeenCalledWith('visitou_pagina', { pagina: 'topico' });
  });

  it('não mede a rota administrativa', () => {
    const telemetria: Telemetria = { registrar: vi.fn() };
    render(<MemoryRouter initialEntries={['/admin']}><RastreadorDePaginas telemetria={telemetria} /></MemoryRouter>);
    expect(telemetria.registrar).not.toHaveBeenCalled();
  });
});
