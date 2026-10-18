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

const CHAVE_SEGUINDO = 'aue.seguindo.v1';

export function obterSeguindoLocais(): string[] {
  try {
    if (typeof localStorage === 'undefined') return [];
    const bruto = localStorage.getItem(CHAVE_SEGUINDO);
    if (!bruto) return ['tiagobonde', 'tiobeto'];
    const parsed = JSON.parse(bruto);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function alternarSeguirLocal(handle: string): boolean {
  const normalizado = handle.replace(/^@/, '').toLowerCase();
  const atuais = obterSeguindoLocais();
  const index = atuais.indexOf(normalizado);
  let novo: string[];
  let seguindo: boolean;
  if (index >= 0) {
    novo = atuais.filter((h) => h !== normalizado);
    seguindo = false;
  } else {
    novo = [...atuais, normalizado];
    seguindo = true;
  }
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(CHAVE_SEGUINDO, JSON.stringify(novo));
    }
  } catch {
    // ignora
  }
  return seguindo;
}

export const PERFIS_CATALOGO: readonly PerfilUsuario[] = [
  {
    id: 'usr_tiagobonde',
    nome: 'Tiago do Bonde',
    handle: 'tiagobonde',
    bio: 'Aqui não tem arroto de moça. Respeita a história.',
    cidade: 'Rio de Janeiro',
    maiorScore: 96,
    vitoriasX1: 14,
    derrotasX1: 2,
  },
  {
    id: 'usr_tiobeto',
    nome: 'Tio Beto',
    handle: 'tiobeto',
    bio: 'Rei do churrasco de domingo e do arroto sonoro.',
    cidade: 'São Paulo',
    maiorScore: 91,
    vitoriasX1: 8,
    derrotasX1: 5,
  },
  {
    id: 'usr_iury',
    nome: 'Iury da Oficina',
    handle: 'iury_oficina',
    bio: 'Motor afinado e arroto no compasso certo.',
    cidade: 'Belo Horizonte',
    maiorScore: 98,
    vitoriasX1: 12,
    derrotasX1: 1,
  },
  {
    id: 'usr_rian',
    nome: 'Rian da Bolha',
    handle: 'rian_design',
    bio: 'Visual 1:1 e nota sem firula.',
    cidade: 'Curitiba',
    maiorScore: 89,
    vitoriasX1: 6,
    derrotasX1: 4,
  },
  {
    id: 'usr_danigas',
    nome: 'Dani Gás',
    handle: 'danigas',
    bio: 'Especialista em refri de 2 litros sem respirar.',
    cidade: 'Porto Alegre',
    maiorScore: 93,
    vitoriasX1: 9,
    derrotasX1: 3,
  },
];
