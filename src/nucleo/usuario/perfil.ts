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
