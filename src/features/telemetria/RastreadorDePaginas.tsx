import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

import { paginaMonitoradaDoCaminho } from '../../nucleo/telemetria/paginas';
import type { Telemetria } from '../../portas/telemetria';

interface Props {
  readonly telemetria: Telemetria;
}

/**
 * Ponto único de observação de navegação. Só entrega à porta uma categoria
 * permitida; a porta preserva o limite de uma categoria por sessão.
 */
export function RastreadorDePaginas({ telemetria }: Props) {
  const local = useLocation();

  useEffect(() => {
    const pagina = paginaMonitoradaDoCaminho(local.pathname);
    if (pagina) telemetria.registrar('visitou_pagina', { pagina });
  }, [local.pathname, telemetria]);

  return null;
}
