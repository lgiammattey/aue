import type { PerfilUsuario } from '../../nucleo/usuario/perfil';
import { criarPerfilPadrao } from '../../nucleo/usuario/perfil';

const CHAVE_PERFIL = 'aue.perfil.v1';

/**
 * Lê o perfil do arrotador persistido localmente no navegador.
 * Garante cold-start saudável com perfil padrão do Auê.
 */
export function obterPerfilLocal(): PerfilUsuario {
  try {
    if (typeof localStorage === 'undefined') {
      return criarPerfilPadrao();
    }
    const bruto = localStorage.getItem(CHAVE_PERFIL);
    if (!bruto) {
      const padrao = criarPerfilPadrao();
      salvarPerfilLocal(padrao);
      return padrao;
    }
    const parsed = JSON.parse(bruto);
    return {
      id: parsed.id || `user_${Date.now()}`,
      nome: parsed.nome || 'Você',
      handle: parsed.handle || 'voce_arrota',
      bio: parsed.bio || 'Arrotador oficial no Bonde do Arroto.',
      avatarUrl: parsed.avatarUrl,
      maiorScore: typeof parsed.maiorScore === 'number' ? parsed.maiorScore : 0,
      vitoriasX1: typeof parsed.vitoriasX1 === 'number' ? parsed.vitoriasX1 : 7,
      derrotasX1: typeof parsed.derrotasX1 === 'number' ? parsed.derrotasX1 : 3,
    };
  } catch {
    return criarPerfilPadrao();
  }
}

/**
 * Salva as alterações de perfil no navegador.
 */
export function salvarPerfilLocal(perfil: PerfilUsuario): void {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(CHAVE_PERFIL, JSON.stringify(perfil));
  } catch {
    // ignora erro em modo privado
  }
}

/**
 * Atualiza o maior score registrado pelo jogador caso a nova nota seja maior.
 */
export function atualizarMaiorScoreLocal(nota: number): void {
  const p = obterPerfilLocal();
  if (nota > p.maiorScore) {
    p.maiorScore = nota;
    salvarPerfilLocal(p);
  }
}

/**
 * Incrementa o cartel de duelos X1 do usuário local.
 */
export function registrarResultadoX1Local(resultado: 'vitoria' | 'derrota'): void {
  const p = obterPerfilLocal();
  if (resultado === 'vitoria') {
    p.vitoriasX1 += 1;
  } else {
    p.derrotasX1 += 1;
  }
  salvarPerfilLocal(p);
}
