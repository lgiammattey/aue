/** Preferência local ao navegador; sem identificador pessoal no cookie. */
const COOKIE = 'aue_nao_contar';
const DURACAO_SEGUNDOS = 365 * 24 * 60 * 60;
let bloqueioNestaPagina = false;
export type EstadoExclusaoTelemetria = 'nenhuma' | 'ativada' | 'ativacao_nao_persistida' | 'desativada' | 'desativacao_nao_confirmada';

function parametroAtivo(nome: string): boolean {
  if (typeof window === 'undefined') return false;
  return new URLSearchParams(window.location.search).getAll(nome).includes('1');
}

function atributos(maxAge: number): string {
  const seguro = typeof window !== 'undefined' && window.location.protocol === 'https:' ? '; Secure' : '';
  // Sem Domain: o cookie pertence apenas ao host atual, não aos subdomínios.
  return `Path=/; Max-Age=${maxAge}; SameSite=Lax${seguro}`;
}

/** Chamada síncrona antes de montar o app ou inicializar qualquer coleta. */
export function configurarExclusaoTelemetria(): EstadoExclusaoTelemetria {
  if (typeof document === 'undefined') return 'nenhuma';
  try {
    // Se os dois parâmetros vierem juntos, a opção mais protetiva prevalece.
    if (parametroAtivo('nao-contar')) {
      bloqueioNestaPagina = true;
      document.cookie = `${COOKIE}=1; ${atributos(DURACAO_SEGUNDOS)}`;
      return cookieAtivo() ? 'ativada' : 'ativacao_nao_persistida';
    } else if (parametroAtivo('voltar-a-contar')) {
      document.cookie = `${COOKIE}=; ${atributos(0)}`;
      bloqueioNestaPagina = false;
      return cookieAtivo() ? 'desativacao_nao_confirmada' : 'desativada';
    }
  } catch {
    // Se o navegador não permitir cookies, não contar a visita de exclusão.
    if (parametroAtivo('nao-contar')) { bloqueioNestaPagina = true; return 'ativacao_nao_persistida'; }
    if (parametroAtivo('voltar-a-contar')) return 'desativacao_nao_confirmada';
  }
  return 'nenhuma';
}

function cookieAtivo(): boolean {
  return document.cookie.split(';').some(parte => parte.trim() === `${COOKIE}=1`);
}

/** Consultar imediatamente antes de carregar scripts ou enviar qualquer evento. */
export function telemetriaBloqueada(): boolean {
  if (bloqueioNestaPagina || parametroAtivo('nao-contar')) return true;
  if (typeof document === 'undefined') return false;
  try {
    return cookieAtivo();
  } catch {
    // Sem acesso à preferência persistida, não enviar telemetria.
    return true;
  }
}
