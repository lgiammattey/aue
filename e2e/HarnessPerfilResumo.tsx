import { MemoryRouter } from 'react-router-dom';
import { InicioOpenDesign } from '../src/features/novo-aue/InicioOpenDesign';
import type { PortaDeForum } from '../src/portas/forum';
import type { PortaDePerfil, PerfilPublico } from '../src/portas/perfil';
import type { PortaDeConta } from '../src/portas/conta';
import type { PortaDeComunidade } from '../src/portas/comunidade';
import type { PortaDeArrotosDoPerfil } from '../src/portas/arrotosDoPerfil';

const perfil: PerfilPublico = {
  id: '11111111-1111-4111-8111-111111111111', handle: 'bia_do_grave', apelido: 'Bia do Grave',
  bio: 'Especialista em grandes arrotos.', cidade: 'São Paulo', fundador: false, daCasa: false,
  criadoEm: '2026-10-18T10:00:00Z', totalCausos: 2, totalSeguidores: 3, totalSeguindo: 4,
  euSigo: false, souEu: true,
};
const pagina = { ok: true as const, valor: { itens: [], proximo: null } };
const forum = {
  listarComunidadesDoForum: async () => ({ ok: true, valor: [] }), explorarTopicos: async () => pagina,
  listarTopicosDoAutor: async () => pagina, listarPublicacoesPessoaisDoAutor: async () => pagina,
  listarPublicacoesMarcadas: async () => pagina, listarPublicacoesPessoais: async () => pagina,
  obterResumoDasNotasPublicadas: async () => ({ ok: true, valor: { melhorNota: 87, media: 72.5, total: 2 } }),
} as unknown as PortaDeForum;
const perfis = { obterMeuPerfil: async () => perfil, obterPerfil: async () => perfil } as unknown as PortaDePerfil;
const conta = { estado: async () => ({ temSessao: true, anonima: false, perfilSocialPendente: false, podeParticiparSocialmente: true }) } as unknown as PortaDeConta;
const comunidade = { listarMinhasComunidades: async () => [] } as unknown as PortaDeComunidade;
const arrotos = { listarArrotos: async () => [] } as unknown as PortaDeArrotosDoPerfil;

/** Dados simulados, tela e componentes reais, sem dependência de produção. */
export function HarnessPerfilResumo() {
  return <MemoryRouter><InicioOpenDesign viewInicial="perfil" handleInicial="bia_do_grave" portaForum={forum} portaPerfil={perfis} portaConta={conta} portaComunidade={comunidade} portaArrotosDoPerfil={arrotos} /></MemoryRouter>;
}
