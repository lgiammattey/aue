/**
 * Modelo de domínio do Perfil de Arrotador no Auê.
 *
 * Núcleo puro sem dependência de APIs do navegador (ADR 0001).
 */
export interface PerfilUsuario {
  id: string;
  nome: string;
  handle: string;
  bio: string;
  avatarUrl?: string;
  bannerUrl?: string;
  cidade?: string;
  maiorScore: number;
  vitoriasX1: number;
  derrotasX1: number;
}

/**
 * Cria a estrutura de um perfil de usuário padrão para cold start.
 */
export function criarPerfilPadrao(): PerfilUsuario {
  return {
    id: `user_${Date.now()}`,
    nome: 'Você',
    handle: 'voce_arrota',
    bio: 'Arrotador oficial no Bonde do Arroto.',
    maiorScore: 0,
    vitoriasX1: 7,
    derrotasX1: 3,
  };
}

/**
 * Resolve o perfil correspondente a um handle específico.
 */
export function resolverPerfilPorHandle(
  handleDesejado: string,
  meuPerfil: PerfilUsuario,
  perfisConhecidos: readonly PerfilUsuario[] = [],
): PerfilUsuario {
  const normalizado = handleDesejado.replace(/^@/, '').trim().toLowerCase();
  if (!normalizado || normalizado === meuPerfil.handle.replace(/^@/, '').trim().toLowerCase()) {
    return meuPerfil;
  }
  const encontrado = perfisConhecidos.find(
    (p) => p.handle.replace(/^@/, '').trim().toLowerCase() === normalizado,
  );
  if (encontrado) {
    return encontrado;
  }
  return {
    id: `arrotador_${normalizado}`,
    nome: normalizado.charAt(0).toUpperCase() + normalizado.slice(1).replace(/_/g, ' '),
    handle: normalizado,
    bio: 'Arrotador ativo no Bonde do Arroto.',
    maiorScore: 0,
    vitoriasX1: 0,
    derrotasX1: 0,
  };
}
