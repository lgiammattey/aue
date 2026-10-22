import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { useState } from 'react';
import { ModalComentarios } from '../src/features/novo-aue/ModalComentarios';
import { ModalCompositor } from '../src/features/novo-aue/ModalCompositor';
import { ModalGravarArroto } from '../src/features/novo-aue/ModalGravarArroto';
import { CardDoPost } from '../src/features/novo-aue/CardDoPost';
import { ThreadDeComentarios } from '../src/features/novo-aue/ThreadDeComentarios';
import { PautaAbertaDaComunidade } from '../src/features/novo-aue/PautaDaComunidade';
import { TelaAdministracao } from '../src/features/administracao/TelaAdministracao';
import { criarControleDeDialogoWeb } from '../src/plataforma/web/controleDeDialogo';
import type { ItemDoFeed } from '../src/features/novo-aue/tipos';
import type { PortaDeAdministracao, ResumoAdministrativo } from '../src/portas/administracao';
import '../src/index.css';
import '../src/features/novo-aue/casca.css';
import '../src/features/novo-aue/InicioOpenDesign.css';

const controle = criarControleDeDialogoWeb();
const postDeMidia: ItemDoFeed = { id: 'post-e2e-midia', tipo: 'causo', origem: 'pessoal', comunidadeSlug: 'perfil', titulo: 'Mídia no perfil', corpo: '', autorNome: 'Bia', autorHandle: 'bia_do_grave', criadoEm: '2026-10-21T00:00:00Z', respostasTotal: 1, anexo: { tipo: 'imagem', url: '/pwa-512x512.png' } };
const postComTituloAutoral: ItemDoFeed = { ...postDeMidia, id: 'post-e2e-autoral', titulo: 'O gás virou história' };
function Harness() {
  const [modal, setModal] = useState<'comentarios' | 'compositor' | 'gravar' | null>(null);
  return <BrowserRouter><main style={{ minHeight: '1900px', padding: 24 }}><h1>Harness local E2E</h1><p>Sem Supabase, feed ou porta remota.</p><button onClick={() => setModal('comentarios')}>Abrir comentários</button><button onClick={() => setModal('compositor')}>Abrir compositor</button><button onClick={() => setModal('gravar')}>Abrir gravador</button><CardDoPost post={postDeMidia} audioTocando={false} tempoAtualDoAudio={0} duracaoDoAudio={null} aoAbrirComentarios={() => setModal('comentarios')} /><CardDoPost post={postComTituloAutoral} audioTocando={false} tempoAtualDoAudio={0} duracaoDoAudio={null} /><ModalComentarios aberto={modal === 'comentarios'} post={postDeMidia} comentarios={[{ id: 'c1', autorNome: 'Gui', autorHandle: 'gui', conteudo: 'Comentário local.', criadoEm: '2026-10-21T00:00:00Z', nivel: 0 }]} carregando={false} enviando={false} controleDeDialogo={controle} aoFechar={() => setModal(null)} aoEnviarComentario={async () => false} /><ModalCompositor aberto={modal === 'compositor'} controleDeDialogo={controle} comunidades={[{ id: 'roda-1', slug: 'teste', nome: 'Roda de teste' }]} aoFechar={() => setModal(null)} aoPublicar={async () => false} /><ModalGravarArroto aberto={modal === 'gravar'} controleDeDialogo={controle} estado="ocioso" aoFechar={() => setModal(null)} aoIniciarGravacao={() => {}} aoPararGravacao={() => {}} aoRegravar={() => {}} aoEnviar={() => {}} /></main></BrowserRouter>;
}
function HarnessQuebras() {
  const texto = 'Primeira linha\nSegunda linha\n\nOutro parágrafo';
  const post: ItemDoFeed = { ...postComTituloAutoral, tipo: 'topico', origem: 'comunidade', corpo: texto };
  const comentarios = [{ id: 'quebra-1', autorNome: 'Gui', conteudo: texto, criadoEm: '2026-10-21T00:00:00Z' }];
  return new URLSearchParams(window.location.search).get('quebras') === 'modal'
    ? <BrowserRouter><ModalComentarios aberto post={post} comentarios={comentarios} carregando={false} enviando={false} aoFechar={() => {}} aoEnviarComentario={async () => false} /></BrowserRouter>
    : <BrowserRouter><ThreadDeComentarios post={post} comentarios={comentarios} carregando={false} enviando={false} aoVoltar={() => {}} aoEnviarComentario={async () => false} /></BrowserRouter>;
}
function HarnessPauta() {
  const entradas = [
    { ...postComTituloAutoral, id: 'original-1', tipo: 'topico' as const, origem: 'comunidade' as const, anexo: undefined, corpo: 'Primeira publicação\ncom quebra de linha.', comunidadeSlug: 'eu-arroto-e-dai' },
    { ...postComTituloAutoral, id: 'original-2', tipo: 'topico' as const, origem: 'comunidade' as const, anexo: undefined, autorNome: 'Gui', autorHandle: 'gui', corpo: 'Segunda publicação preservada.', comunidadeSlug: 'eu-arroto-e-dai' },
  ];
  return <BrowserRouter><main style={{ maxWidth: 600, margin: '0 auto' }}><PautaAbertaDaComunidade titulo="Mural da vergonha" entradas={entradas.map((post) => <CardDoPost key={post.id} post={post} audioTocando={false} tempoAtualDoAudio={0} duracaoDoAudio={null} />)} aoVoltar={() => {}} /></main></BrowserRouter>;
}

// Fixture E2E no formato exato da porta: só agregados e a lista mínima que o
// painel pode receber. Não há sessão, e-mail, UUID, URL de áudio ou Supabase.
const diasDoPainel = Array.from({ length: 30 }, (_, indice) => {
  const data = new Date(Date.UTC(2026, 9, indice + 1)).toISOString().slice(0, 10);
  return {
    data,
    acessosDePaginas: 8 + (indice % 5),
    abriuArena: 4 + (indice % 4),
    iniciouArroto: 2 + (indice % 3),
    recebeuNota: 2 + (indice % 2),
    compartilhou: indice % 2,
    criouX1: indice % 3,
    respondeuX1: (indice + 1) % 2,
    pediuRevanche: indice % 4,
    topicosPublicados: 1 + (indice % 3),
    respostasPublicadas: 2 + (indice % 4),
  };
});

const resumoAdministrativoDoHarness: ResumoAdministrativo = {
  inicio: '2026-10-01', fim: '2026-10-30',
  totalContasDeEmailAtual: 184, contasAnonimasAtuais: 17, contasAtivasNoPeriodo: 76,
  cadastrosNoPeriodo: 34, acompanhamentoDeCadastrosIniciadoEm: '2026-10-01T12:00:00Z',
  perfisConcluidosNoPeriodo: 28, perfisPendentesAtuais: 9,
  topicosPublicadosNoPeriodo: 57, respostasPublicadasNoPeriodo: 113, comunidadesAtivasNoPeriodo: 12,
  acessosDePaginasNoPeriodo: 312, acompanhamentoDeAcessosIniciadoEm: '2026-10-01T12:00:00Z',
  eventos: { abriu_arena: 96, recebeu_nota: 61, criou_x1: 12, respondeu_x1: 9 },
  acessosPorPagina: [
    { pagina: 'feed', acessos: 128 }, { pagina: 'comunidade', acessos: 82 },
    { pagina: 'perfil', acessos: 57 }, { pagina: 'arena', acessos: 45 },
  ],
  eventosPorDia: diasDoPainel,
  pessoas: [
    { apelido: 'Luiz', handle: 'giamzinn_aue', criadoEm: '2026-10-29T12:00:00Z', perfilSocialConcluidoEm: '2026-10-29T12:05:00Z', estado: 'perfil_pronto' },
    { apelido: 'Bia', handle: 'bia_do_grave', criadoEm: '2026-10-28T12:00:00Z', perfilSocialConcluidoEm: null, estado: 'ficha_pendente' },
  ],
};

const portaAdministrativaDoHarness: PortaDeAdministracao = {
  obterResumo: async () => resumoAdministrativoDoHarness,
  obterMonetizacao: async () => ({ inicio: '2026-10-01', fim: '2026-10-30', totalImpressoes: 841, totalCliques: 23, receitaTotal: 6.72, cpmMedio: 7.99 }),
};

function HarnessAdministracao() {
  return <TelaAdministracao porta={portaAdministrativaDoHarness} />;
}

const parametrosDoHarness = new URLSearchParams(window.location.search);
createRoot(document.getElementById('root')!).render(
  parametrosDoHarness.has('admin') ? <HarnessAdministracao /> : parametrosDoHarness.has('pauta') ? <HarnessPauta /> : parametrosDoHarness.has('quebras') ? <HarnessQuebras /> : <Harness />,
);
