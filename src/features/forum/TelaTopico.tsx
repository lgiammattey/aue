import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate, useParams } from 'react-router-dom';
import { formatarNota } from '../../shared/formato/nota';
import { normalizarQuebras, nomeDoAutor } from '../../nucleo/forum/apresentacao';
import type { ComunidadeDoForum, TopicoDoForum } from '../../portas/forum';
import { BotaoParticipar } from './AcoesDaComunidade';
import { Respostas, type ApiDasRespostas } from './ArvoreDeRespostas';
import {
  Avatar,
  BotaoComoLink,
  EstadoDeErro,
  EstadoDeMolde,
  Esqueleto,
  Marcadores,
  NomeDoAutor,
  Tempo,
} from './componentes';
import { useDependenciasDoForum } from './contexto';
import { DialogoDeConfirmacao } from './DialogoDeConfirmacao';
import { DialogoDeDenuncia } from './DialogoDeDenuncia';
import { useTituloDoDocumento } from './encaixes';
import { enderecoDaComunidade, enderecoDoTopico } from './enderecos';
import { FormularioDeTopico } from './FormularioDeTopico';
import { esquecerListasVistas, useLeitura, useOnline } from './hooks';
import { MenuDeAcoes, type ItemDoMenu } from './MenuDeAcoes';
import { usePapel, useSouMembro, SLUG_DO_BONDE_GERAL } from './papel';
import { AsideSobreAComunidade } from './RegrasDaCasa';
import { NoAside, TopoDaTela } from './ShellDoForum';
import { useToast } from './toast';
import { useParticiparDaComunidade } from './useParticiparDaComunidade';
import { AnexoPublicadoDoForum } from './MidiaDoForum';

function formatarDuracao(segundos: number): string {
  const total = Math.max(0, Math.round(segundos));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}

// ---------------------------------------------------------------------------
// Áudio e nota: só o que o servidor devolveu
// ---------------------------------------------------------------------------

/**
 * Existe áudio quando há caminho; existe nota quando a nota não é nula. Áudio
 * sem nota não ganha selo; nada de forma de onda inventada. Tocar depende do
 * contrato de URL do áudio (#250), que ainda não fechou: até lá não há botão
 * nem player (nada que sugira que dá pra ouvir), só a duração e a nota que o
 * servidor devolveu.
 */
function BlocoDeAudio({ topico }: { readonly topico: TopicoDoForum }) {
  const audio = topico.audio;
  if (!audio || (!audio.caminhoDoAudio && !audio.caminhoDoAudioDaCasa)) return null;
  if (audio.duracao === null && audio.nota === null) return null;
  return (
    <div className="forum-audio">
      <p className="forum-audio__resumo">
        {audio.duracao !== null && (
          <span className="forum-audio__duracao">
            <span className="forum-sr">Duração </span>
            {formatarDuracao(audio.duracao)}
          </span>
        )}
        {audio.nota !== null && (
          <span className="forum-selo-nota">
            <span className="forum-sr">Nota </span>
            {formatarNota(audio.nota)}
          </span>
        )}
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Cabeçalho do tópico
// ---------------------------------------------------------------------------

function CabecalhoDoTopico({
  topico,
  agora,
  aoResponder,
}: {
  readonly topico: TopicoDoForum;
  readonly agora: number;
  /** "Responder": leva ao composer (ou ao convite). Sem ele, o botão não existe. */
  readonly aoResponder?: () => void;
}) {
  const h1 = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    h1.current?.focus({ preventScroll: true });
  }, [topico.id]);
  const corpo = normalizarQuebras(topico.corpo);
  const fechado = topico.status === 'fechado';

  return (
    <article className="forum-topico" aria-labelledby="forum-h1">
      <nav className="forum-migalha" aria-label="Você está em">
        <Link to={enderecoDaComunidade(topico.comunidade.slug)}>{topico.comunidade.nome}</Link>
        <span aria-hidden="true"> › </span>
        <span>Tópico</span>
      </nav>
      <h1 id="forum-h1" className="forum-h1 forum-h1--topico" ref={h1} tabIndex={-1}>
        Conversa em {topico.comunidade.nome}
      </h1>
      <p className="forum-autoria">
        <Avatar nome={nomeDoAutor(topico.autor)} url={topico.autor.avatarUrl} />
        <NomeDoAutor autor={topico.autor} forte />
        {topico.autor.apelido && topico.autor.handle && <span className="forum-muted">@{topico.autor.handle}</span>}
        <Tempo iso={topico.criadoEm} agora={agora} />
        {topico.editadoEm && <span className="forum-muted">editado</span>}
      </p>
      {(topico.fixado || fechado) && (
        <p className="forum-meta">
          <Marcadores fixado={topico.fixado} fechado={fechado} />
        </p>
      )}
      {corpo.trim() !== '' && <p className="forum-corpo">{corpo}</p>}
      <BlocoDeAudio topico={topico} />
      <AnexoPublicadoDoForum alvo="topico" alvoId={topico.id} />
      {aoResponder && (
        <button type="button" className="forum-botao forum-botao--contorno forum-topico__responder" onClick={aoResponder}>
          Responder
        </button>
      )}
      {fechado && (
        <p className="forum-faixa-fechado">
          Este tópico está fechado. Dá pra ler tudo, mas não aceita novas respostas.
        </p>
      )}
    </article>
  );
}

// ---------------------------------------------------------------------------
// Aside do desktop: quem é a comunidade (e a ação da pessoa nela)
// ---------------------------------------------------------------------------

function AcaoDoAside({ comunidade, souMembro, aoMudar }: { readonly comunidade: { slug: string; nome: string }; readonly souMembro: boolean; readonly aoMudar: () => void }) {
  const papel = usePapel();
  const participar = useParticiparDaComunidade(comunidade, aoMudar);
  if (papel.tipo !== 'conta') return null;
  if (!souMembro) {
    return (
      <div className="forum-acoes">
        <BotaoParticipar pendente={participar.pendente === 'entrar'} aoClicar={() => void participar.entrar()} acento={false} />
        {participar.erro && <p className="forum-campo__erro" role="alert">{participar.erro}</p>}
      </div>
    );
  }
  return (
    <p className="forum-meta forum-meta--forte forum-acoes__participa">
      <span>Você participa</span>
      {comunidade.slug !== SLUG_DO_BONDE_GERAL && (
        <>
          <span aria-hidden="true"> · </span>
          <button type="button" className="forum-botao-texto" onClick={() => void participar.sair()}>
            Sair da comunidade
          </button>
        </>
      )}
    </p>
  );
}

// ---------------------------------------------------------------------------
// A conversa (tópico já lido)
// ---------------------------------------------------------------------------

type DialogoDoTopico = 'editar' | 'apagar' | 'denunciar' | null;

function ConversaDoTopico({ topico, atualizar }: { readonly topico: TopicoDoForum; readonly atualizar: () => Promise<boolean> }) {
  const { forum, ambiente } = useDependenciasDoForum();
  const papel = usePapel();
  const navegar = useNavigate();
  const local = useLocation();
  const toast = useToast();
  const slug = topico.comunidade.slug;
  const { estado: leituraDaComunidade, atualizar: atualizarComunidade } = useLeitura(
    () => forum.obterComunidadeDoForum(slug),
    `aside:${slug}`,
  );
  const comunidadeLida: ComunidadeDoForum | null = leituraDaComunidade.fase === 'pronto' ? leituraDaComunidade.valor : null;
  const souMembro = useSouMembro(slug, comunidadeLida?.souMembro ?? false);
  const aberto = topico.status === 'aberto';
  const ehConta = papel.tipo === 'conta';
  const agora = ambiente.agora();
  const respostas = useRef<ApiDasRespostas>(null);
  const botaoDoMenu = useRef<HTMLButtonElement>(null);
  const [dialogo, setDialogo] = useState<DialogoDoTopico>(null);
  const caminho = local.pathname + local.search;

  const aoMudarParticipacao = useCallback(() => {
    void atualizarComunidade();
  }, [atualizarComunidade]);
  const aoMudarConversa = useCallback(() => {
    void atualizar();
  }, [atualizar]);

  const itens: ItemDoMenu[] = [];
  if (ehConta) {
    if (topico.souAutor && aberto) itens.push({ id: 'editar', rotulo: 'Editar', aoEscolher: () => setDialogo('editar') });
    if (topico.souAutor) itens.push({ id: 'apagar', rotulo: 'Apagar', aoEscolher: () => setDialogo('apagar') });
    if (!topico.souAutor) itens.push({ id: 'denunciar', rotulo: 'Denunciar', aoEscolher: () => setDialogo('denunciar') });
  }
  const fecharDialogo = () => setDialogo(null);
  const devolverFoco = () => botaoDoMenu.current?.focus();
  const papelSabido = papel.tipo === 'conta' || papel.tipo === 'visitante';

  return (
    <>
      <TopoDaTela
        titulo={topico.comunidade.nome}
        voltar={{ para: enderecoDaComunidade(slug), rotulo: topico.comunidade.nome }}
        acoes={<MenuDeAcoes rotulo="Ações do tópico" itens={itens} botaoRef={botaoDoMenu} />}
      />
      <NoAside>
        <AsideSobreAComunidade
          referencia={topico.comunidade}
          comunidade={comunidadeLida}
          acao={<AcaoDoAside comunidade={topico.comunidade} souMembro={souMembro} aoMudar={aoMudarParticipacao} />}
        />
      </NoAside>
      <CabecalhoDoTopico
        topico={topico}
        agora={agora}
        aoResponder={aberto && papelSabido ? () => void respostas.current?.irParaOCompositor() : undefined}
      />
      <Respostas
        topico={topico}
        agora={agora}
        comunidade={topico.comunidade}
        souMembro={souMembro}
        aoMudarConversa={aoMudarConversa}
        api={respostas}
      />

      {dialogo === 'editar' && (
        <FormularioDeTopico
          modo="editar"
          comunidade={topico.comunidade}
          inicial={{ titulo: topico.titulo, corpo: topico.corpo }}
          enviar={(texto) =>
            forum.editarTopico({
              topicoId: topico.id,
              ...(texto.titulo !== topico.titulo.trim() ? { titulo: texto.titulo } : {}),
              ...(texto.corpo !== topico.corpo.trim() ? { corpo: texto.corpo } : {}),
            })
          }
          aoSucesso={() => {
            setDialogo(null);
            esquecerListasVistas(`c:${slug}|`);
            esquecerListasVistas('explorar|');
            esquecerListasVistas('perfil-');
            toast('Tópico atualizado.');
            void atualizar();
          }}
          aoCancelar={fecharDialogo}
          aoFechar={devolverFoco}
          caminhoDeVolta={caminho}
          aoEstadoDoTopicoMudar={aoMudarConversa}
        />
      )}
      {dialogo === 'apagar' && (
        <DialogoDeConfirmacao
          titulo="Apagar este tópico?"
          corpo="Ele sai da comunidade e as respostas deixam de aparecer. Não dá pra desfazer."
          rotuloDeConfirmar="Apagar tópico"
          rotuloEmAndamento="Apagando…"
          confirmar={() => forum.apagarTopico(topico.id)}
          aoSucesso={() => {
            esquecerListasVistas(`c:${slug}|`);
            esquecerListasVistas('explorar|');
            esquecerListasVistas('perfil-');
            toast('Tópico apagado.');
            navegar(enderecoDaComunidade(slug), { replace: true });
          }}
          aoCancelar={fecharDialogo}
          aoFechar={devolverFoco}
          caminhoDeVolta={caminho}
        />
      )}
      {dialogo === 'denunciar' && (
        <DialogoDeDenuncia
          alvo="tópico"
          denunciar={(motivo) => forum.denunciarTopico(topico.id, motivo)}
          aoSucesso={() => {
            setDialogo(null);
            toast('Denúncia enviada. Valeu.');
          }}
          aoCancelar={fecharDialogo}
          aoFechar={devolverFoco}
          caminhoDeVolta={caminho}
        />
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// A tela
// ---------------------------------------------------------------------------

/**
 * Tela 3 (spec 9): a conversa. `obter_topico` não distingue ausente, oculto,
 * removido nem id errado: é uma tela só, "não está disponível". O `id` é global;
 * se o slug da URL não for o da comunidade do tópico, a URL é corrigida
 * (`replace`) e o tópico nunca aparece debaixo de outra comunidade.
 */
export function TelaTopico() {
  const { slug = '', id = '' } = useParams<{ slug: string; id: string }>();
  const { forum, ambiente } = useDependenciasDoForum();
  const online = useOnline(ambiente);
  const { estado, recarregar, atualizar } = useLeitura(() => forum.obterTopico(id), `topico:${id}`);

  const topico = estado.fase === 'pronto' ? estado.valor : null;
  useTituloDoDocumento(topico ? `Conversa em ${topico.comunidade.nome}` : 'Conversa');

  const voltarParaSlug = { para: enderecoDaComunidade(slug), rotulo: 'a comunidade' };

  if (estado.fase === 'carregando') {
    return (
      <>
        <TopoDaTela titulo="Conversa" voltar={voltarParaSlug} />
        <Esqueleto forma="topico" anuncio="Carregando tópico" />
      </>
    );
  }
  if (estado.fase === 'erro') {
    return (
      <>
        <TopoDaTela titulo="Conversa" voltar={voltarParaSlug} />
        <EstadoDeErro tela titulo="Deu ruim pra carregar o tópico." offline={!online} aoTentar={recarregar} />
      </>
    );
  }
  if (topico === null) {
    return (
      <>
        <TopoDaTela titulo="Conversa" voltar={voltarParaSlug} />
        <EstadoDeMolde
          tela
          titulo="Esse tópico não está disponível."
          linha="Ele pode ter sido apagado, estar oculto, ou o endereço está errado."
          acao={<BotaoComoLink para={enderecoDaComunidade(slug)}>Voltar para a comunidade</BotaoComoLink>}
        />
      </>
    );
  }
  if (topico.comunidade.slug !== slug) {
    return <Navigate to={enderecoDoTopico(topico.comunidade.slug, topico.id)} replace />;
  }

  return <ConversaDoTopico key={topico.id} topico={topico} atualizar={atualizar} />;
}
