import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

import { paginaMonitoradaDoCaminho } from '../../nucleo/telemetria/paginas';
import type { Telemetria } from '../../portas/telemetria';
import { registrarPaginaAnalytics } from '../../plataforma/web/analyticsArenaV2';
import { FLAGS } from '../../shared/flags';
import { abreArenaV2 } from '../../nucleo/arena/entradaV2';

interface Props {
  readonly telemetria: Telemetria;
}

/**
 * Ponto único de observação de navegação. Só entrega à porta uma categoria
 * permitida; a porta preserva o limite de uma categoria por sessão.
 */
export function RastreadorDePaginas({ telemetria }: Props) {
  const local = useLocation();
  const ultimaNavegacao = useRef<string | null>(null);

  useEffect(() => {
    const pagina = paginaMonitoradaDoCaminho(local.pathname);
    if (pagina) telemetria.registrar('visitou_pagina', { pagina });
    const chave = `${local.pathname}${local.search}${local.hash}`;
    if (ultimaNavegacao.current !== chave) {
      ultimaNavegacao.current = chave;
      registrarPaginaAnalytics(FLAGS.arenaV2 && abreArenaV2(local.pathname, local.search) ? 'arena' : pagina);
    }
  }, [local.pathname, local.search, local.hash, telemetria]);

  return null;
}
