// @vitest-environment jsdom
import { StrictMode } from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, useNavigate } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { Telemetria } from '../../portas/telemetria';
import { RastreadorDePaginas } from './RastreadorDePaginas';
vi.mock('../../plataforma/web/analyticsArenaV2', () => ({ registrarPaginaAnalytics: vi.fn() }));
vi.mock('../../shared/flags', () => ({ FLAGS: { arenaV2: true } }));
import { registrarPaginaAnalytics } from '../../plataforma/web/analyticsArenaV2';

describe('RastreadorDePaginas', () => {
  afterEach(() => { cleanup(); vi.clearAllMocks(); });

  it('raiz v2 é arena, deduplica StrictMode e conta retorno real', () => {
    const telemetria: Telemetria = { registrar: vi.fn() };
    function Navegar() { const ir = useNavigate(); return <><button onClick={() => ir('/feed')}>Mural</button><button onClick={() => ir('/')}>Arena</button></>; }
    render(<StrictMode><MemoryRouter initialEntries={['/']}><RastreadorDePaginas telemetria={telemetria} /><Navegar /></MemoryRouter></StrictMode>);
    expect(registrarPaginaAnalytics).toHaveBeenCalledTimes(1);
    expect(registrarPaginaAnalytics).toHaveBeenLastCalledWith('arena');
    fireEvent.click(screen.getByRole('button', { name: 'Mural' }));
    fireEvent.click(screen.getByRole('button', { name: 'Arena' }));
    expect(registrarPaginaAnalytics).toHaveBeenCalledTimes(3);
    expect(registrarPaginaAnalytics).toHaveBeenLastCalledWith('arena');
  });

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
