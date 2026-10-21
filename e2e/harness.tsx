import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { useState } from 'react';
import { ModalComentarios } from '../src/features/novo-aue/ModalComentarios';
import { ModalCompositor } from '../src/features/novo-aue/ModalCompositor';
import { ModalGravarArroto } from '../src/features/novo-aue/ModalGravarArroto';
import { CardDoPost } from '../src/features/novo-aue/CardDoPost';
import { criarControleDeDialogoWeb } from '../src/plataforma/web/controleDeDialogo';
import type { ItemDoFeed } from '../src/features/novo-aue/tipos';
import '../src/features/novo-aue/casca.css';
import '../src/features/novo-aue/InicioOpenDesign.css';

const controle = criarControleDeDialogoWeb();
const post: ItemDoFeed = { id: 'post-e2e', tipo: 'topico', comunidadeSlug: 'teste', titulo: '', corpo: 'Post de prova local.', autorNome: 'Bia', criadoEm: '2026-10-21T00:00:00Z', respostasTotal: 1, anexo: { tipo: 'imagem', url: '/pwa-512x512.png' } };
function Harness() {
  const [modal, setModal] = useState<'comentarios' | 'compositor' | 'gravar' | null>(null);
  return <BrowserRouter><main style={{ minHeight: '1900px', padding: 24 }}><h1>Harness local E2E</h1><p>Sem Supabase, feed ou porta remota.</p><button onClick={() => setModal('comentarios')}>Abrir comentários</button><button onClick={() => setModal('compositor')}>Abrir compositor</button><button onClick={() => setModal('gravar')}>Abrir gravador</button><CardDoPost post={post} aoAbrirComentarios={() => setModal('comentarios')} aoAlternarReacao={async () => false} aoAlternarSalvo={async () => false} /><ModalComentarios aberto={modal === 'comentarios'} post={post} comentarios={[{ id: 'c1', autorNome: 'Gui', autorHandle: 'gui', conteudo: 'Comentário local.', criadoEm: '2026-10-21T00:00:00Z', nivel: 0 }]} carregando={false} enviando={false} controleDeDialogo={controle} aoFechar={() => setModal(null)} aoEnviarComentario={async () => false} /><ModalCompositor aberto={modal === 'compositor'} controleDeDialogo={controle} comunidades={[{ id: 'roda-1', slug: 'teste', nome: 'Roda de teste' }]} aoFechar={() => setModal(null)} aoPublicar={async () => false} /><ModalGravarArroto aberto={modal === 'gravar'} controleDeDialogo={controle} estado="ocioso" aoFechar={() => setModal(null)} aoIniciarGravacao={() => {}} aoPararGravacao={() => {}} aoRegravar={() => {}} aoEnviar={() => {}} /></main></BrowserRouter>;
}
createRoot(document.getElementById('root')!).render(<Harness />);
