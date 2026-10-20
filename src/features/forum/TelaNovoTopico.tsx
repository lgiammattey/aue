import { useCallback, useState, type RefObject } from 'react';
import { Navigate, useLocation, useNavigate, useOutletContext } from 'react-router-dom';
import {
  apagarRascunho,
  guardarRascunhoDeTopico,
  lerRascunhoDeTopico,
} from '../../nucleo/forum/rascunho';
import { chaveDoRascunhoDeTopico } from '../../portas/armazenamento';
import type { ComunidadeDoForum, TopicoCriado } from '../../portas/forum';
import { useDependenciasDoForum } from './contexto';
import { useAnunciar } from './encaixes';
import { enderecoDaComunidade, enderecoDoTopico } from './enderecos';
import { FormularioDeTopico, type TextoDoTopico } from './FormularioDeTopico';
import { esquecerListasVistas } from './hooks';
import { usePapel } from './papel';
import { useToast } from './toast';

/** O que `TelaComunidadeDoForum` entrega às rotas filhas (`<Outlet context>`). */
export interface ContextoDaComunidade {
  readonly comunidade: ComunidadeDoForum;
  readonly souMembro: boolean;
  /** O link "Novo tópico": quem fecha o dialog devolve o foco a ele. */
  readonly gatilho: RefObject<HTMLAnchorElement | null>;
  /** Lê a lista de tópicos de novo (depois de uma falha ambígua, "Conferir"). */
  readonly conferirLista: () => void;
  /** Lê o cabeçalho de novo, sem piscar (números do servidor). */
  readonly atualizarComunidade: () => void;
  /** Foco no H1 da comunidade: para onde o dialog volta se o gatilho não existe (abriu por URL direta). */
  readonly focarTitulo: () => void;
}

/**
 * Rota `/c/:slug/novo` (spec 10). Filha de `/c/:slug`: a lista fica por baixo e o
 * dialog abre por cima. Visitante, conta que não participa e quem ainda não
 * se sabe quem é nunca abrem o formulário: voltam para a comunidade, onde está
 * o convite certo.
 */
export function TelaNovoTopico() {
  const contexto = useOutletContext<ContextoDaComunidade | undefined>();
  const papel = usePapel();
  if (!contexto) return null;
  if (papel.tipo === 'carregando') return null;
  // Visitante, conta sem participação e "não deu para saber quem é": o formulário não abre.
  // A comunidade mostra a ação certa (convite, "Participar") ou nada, nunca um botão que falha.
  if (papel.tipo !== 'conta' || !contexto.souMembro) {
    return <Navigate to={enderecoDaComunidade(contexto.comunidade.slug)} replace />;
  }
  return <NovoTopico key={contexto.comunidade.slug} contexto={contexto} contaId={papel.contaId} />;
}

function NovoTopico({ contexto, contaId }: { readonly contexto: ContextoDaComunidade; readonly contaId: string }) {
  const { comunidade, gatilho } = contexto;
  const { forum, armazenamento } = useDependenciasDoForum();
  const navegar = useNavigate();
  const local = useLocation();
  const anunciar = useAnunciar();
  const toast = useToast();
  const slug = comunidade.slug;
  const chave = chaveDoRascunhoDeTopico(contaId, slug);
  const [inicial] = useState(() => lerRascunhoDeTopico(armazenamento, chave) ?? { titulo: '', corpo: '' });

  // Quem chegou pela lista volta pelo histórico; quem caiu aqui por URL direta vai para a comunidade.
  const veioDaLista = (local.state as { daLista?: boolean } | null)?.daLista === true;
  const fechar = useCallback(() => {
    // O texto já está guardado a cada tecla: fechar nunca apaga (spec 6.8).
    if (veioDaLista) navegar(-1);
    else navegar(enderecoDaComunidade(slug), { replace: true });
  }, [navegar, slug, veioDaLista]);

  const devolverFoco = useCallback(() => {
    if (gatilho.current) gatilho.current.focus({ preventScroll: true });
    else contexto.focarTitulo();
  }, [gatilho, contexto]);

  const conferir = useCallback(() => {
    esquecerListasVistas(`c:${slug}|`);
    esquecerListasVistas('perfil-');
    anunciar('Conferindo os tópicos da comunidade.');
    fechar();
    contexto.conferirLista();
  }, [slug, anunciar, fechar, contexto]);

  return (
    <FormularioDeTopico
      modo="criar"
      comunidade={comunidade}
      inicial={inicial}
      aoMudarTexto={(texto: TextoDoTopico) => guardarRascunhoDeTopico(armazenamento, chave, texto)}
      aoDescartar={() => apagarRascunho(armazenamento, chave)}
      // Título pertence ao formato antigo do backend; no composer novo ele não
      // é uma decisão da pessoa nem aparece no card. O corpo é o post raiz.
      enviar={(texto, anexo) => forum.criarTopico({ comunidadeSlug: slug, corpo: texto.corpo, ...(anexo ? { anexo } : {}) })}
      aoSucesso={(valor) => {
        const criado = valor as TopicoCriado;
        apagarRascunho(armazenamento, chave);
        // A volta do navegador não pode mostrar a lista velha, sem este tópico.
        esquecerListasVistas(`c:${slug}|`);
        esquecerListasVistas('explorar|');
        esquecerListasVistas('perfil-');
        toast('Tópico criado.');
        navegar(enderecoDoTopico(slug, criado.id), { replace: true });
      }}
      aoCancelar={fechar}
      aoFechar={devolverFoco}
      caminhoDeVolta={local.pathname + local.search}
      aoConferir={conferir}
      aoMudarParticipacao={contexto.atualizarComunidade}
    />
  );
}
