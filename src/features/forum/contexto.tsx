import { createContext, useContext, useState, type ReactNode } from 'react';
import type { AmbienteDoForum } from '../../portas/ambienteDoForum';
import type { ArmazenamentoLocal } from '../../portas/armazenamento';
import type { PortaDeComunidade } from '../../portas/comunidade';
import type { PortaDeConta } from '../../portas/conta';
import type { PortaDeForum } from '../../portas/forum';
import { criarArmazenamentoWeb } from '../../plataforma/web/armazenamento';
import { criarAmbienteDoForumWeb } from '../../plataforma/web/ambienteDoForum';
import { criarComunidadeWeb } from '../../plataforma/web/comunidade';
import { criarContaWeb } from '../../plataforma/web/conta';
import { criarForumWeb } from '../../plataforma/web/forum';

/**
 * As portas que as telas do fórum usam. A tela nunca importa o cliente do
 * Supabase: pede aqui. Os testes entram com portas dubladas pelo `ForumProvider`.
 */
export interface DependenciasDoForum {
  readonly forum: PortaDeForum;
  readonly conta: PortaDeConta;
  /**
   * `listarMinhasComunidades` (conta promovida entra no bonde-geral) e, na escrita
   * (pedaço 2c), `entrarComunidade` e `sairComunidade`.
   */
  readonly comunidade: PortaDeComunidade;
  readonly ambiente: AmbienteDoForum;
  /** Só o rascunho do que a pessoa está escrevendo (spec 6.8). */
  readonly armazenamento: ArmazenamentoLocal;
}

const Contexto = createContext<DependenciasDoForum | null>(null);

export function criarDependenciasPadrao(): DependenciasDoForum {
  return {
    forum: criarForumWeb(),
    conta: criarContaWeb(),
    comunidade: criarComunidadeWeb(),
    ambiente: criarAmbienteDoForumWeb(),
    armazenamento: criarArmazenamentoWeb(),
  };
}

export function ForumProvider({
  dependencias,
  children,
}: {
  readonly dependencias: DependenciasDoForum;
  readonly children: ReactNode;
}) {
  return <Contexto.Provider value={dependencias}>{children}</Contexto.Provider>;
}

/** Quem não recebeu portas de fora cria as de verdade, uma vez. */
export function useDependenciasOuPadrao(): DependenciasDoForum {
  const doContexto = useContext(Contexto);
  const [padrao] = useState<DependenciasDoForum | null>(() => (doContexto ? null : criarDependenciasPadrao()));
  return doContexto ?? (padrao as DependenciasDoForum);
}

export function useDependenciasDoForum(): DependenciasDoForum {
  const deps = useContext(Contexto);
  if (!deps) throw new Error('As telas do fórum precisam estar dentro do ForumProvider.');
  return deps;
}
