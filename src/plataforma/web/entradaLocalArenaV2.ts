import { abreArenaV2 } from '../../nucleo/arena/entradaV2';

/** Lê endereço apenas para decidir a entrada local sem configurar servidor. */
export function entradaLocalArenaV2(): boolean {
  return abreArenaV2(window.location.pathname, window.location.search);
}
