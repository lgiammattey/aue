/**
 * CANÔNICO ATIVO — Experiência Principal da Tropa do Arroto (OpenDesign)
 * Referência visual: docs/design/prototipo/Bonde do Arroto.dc.html
 * Mapeamento: docs/design/MAPA_DE_PAGINAS_E_FLUXOS.md
 * 
 * Orquestra o layout de 3 colunas (desktop) e webapp mobile (o mesmo componente, responsivo).
 * Gerencia as views centrais: 'feed', 'seguindo', 'comunidade', 'comunidades', 'perfil' e 'auth'.
 */
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { criarComunidadeWeb } from '../../plataforma/web/comunidade';
import { criarContaWeb } from '../../plataforma/web/conta';
import { criarCapturaWeb } from '../../plataforma/web/captura';
import { criarControleDeDialogoWeb } from '../../plataforma/web/controleDeDialogo';
import { criarForumWeb } from '../../plataforma/web/forum';
import { criarPautasWeb } from '../../plataforma/web/pautas';
import { criarArrotosDoPerfilRemoto } from '../../plataforma/web/arrotosDoPerfil';
import { criarUrlDePreviewDeImagem, prepararImagemDePerfil, revokeUrlDePreviewDeImagem } from '../../plataforma/web/imagem';
import { criarPerfilRemoto } from '../../plataforma/web/perfilRemoto';
import { analyticsArenaV2 } from '../../plataforma/web/analyticsArenaV2';
import { analisarNotaDoAudioPublicado } from '../../plataforma/web/notaDoAudioPublicado';
import type { ArrotoDoPerfil, PortaDeArrotosDoPerfil } from '../../portas/arrotosDoPerfil';
import type { CapturaDeAudio } from '../../portas/captura';
import type { PortaDeComunidade } from '../../portas/comunidade';
import { sugerirHandle, type PortaDeConta, type ResultadoDaConta } from '../../portas/conta';
import type { AnexoDeAudioDoTopico, AnexoDoForum, AnexoParaPublicar, ComunidadeDoForum, CursorDoForum, NotaRetrospectiva, NotificacaoDeMencao, PortaDeForum, PreviaDeRespostaDoTopico, PublicacaoPessoal, RespostaDoForum, TipoDeMidiaDaComunidade, TopicoDoAutor } from '../../portas/forum';
import type { Conexao, DadosDoPerfil, PerfilPublico, PortaDePerfil } from '../../portas/perfil';
import type { PautaDoForum, PortaDePautas } from '../../portas/pautas';
import { BarraLateral } from './BarraLateral';
import { BarraSuperior } from './BarraSuperior';
import { CardDoPost } from './CardDoPost';
import { ListaDeTopicos } from './ListaDeTopicos';
import { PautaAbertaDaComunidade } from './PautaDaComunidade';
import { SlotPatrocinadoDoFeed } from './SlotPatrocinadoDoFeed';
import { PreviaDaConversa } from './PreviaDaConversa';
import { ThreadDeComentarios } from './ThreadDeComentarios';
import { ModalCompositor, type AnexoRascunho, type DesafioAlvoDoCompositor } from './ModalCompositor';
import { ModalComentarios } from './ModalComentarios';
import { ModalEditarPerfil } from './ModalEditarPerfil';
import { ModalAjustarImagem, type RecorteVisual, type TipoDeImagemAjustavel } from './ModalAjustarImagem';
import { ModalGravarArroto, type DestinoDoArrotoDireto, type EstadoDaGravacaoDireta } from './ModalGravarArroto';
import { ModalGerirComunidade } from './ModalGerirComunidade';
import { linkDaRede } from '../../nucleo/perfil/redesSociais';
import { caminhoDeVoltaSeguro } from '../../nucleo/comunidade/caminhoDeVolta';
import { DialogoDoPost } from './DialogoDoPost';
import { ModalConexoes, type EstadoDasConexoes } from './ModalConexoes';
import { PainelDireito } from './PainelDireito';
import { PlayerDoArroto } from './PlayerDoArroto';
import { TopArrotadoresDaHome } from './TopArrotadoresDaHome';
import { erroDeEnvio } from '../../nucleo/forum/escrita';
import { SalvosDoPerfil } from './SalvosDoPerfil';
import { engajamentoDoCauso, useEngajamento } from './useEngajamento';
import type { ItemComentario, ItemDoFeed } from './tipos';
import './casca.css';
import '../../styles/appShell.css';
import './InicioOpenDesign.css';
import './diretorioArena.css';
import { criarPaginacaoDoMural } from './paginacaoDoMural';
import './muralArena.css';
import './perfilArena.css';
import './authArena.css';

interface Props {
  readonly portaForum?: PortaDeForum;
  readonly portaPautas?: PortaDePautas;
  readonly portaComunidade?: PortaDeComunidade;
  readonly portaPerfil?: PortaDePerfil;
  readonly portaConta?: PortaDeConta;
  readonly portaArrotosDoPerfil?: PortaDeArrotosDoPerfil;
  readonly capturaDireta?: CapturaDeAudio;
  readonly autenticado?: boolean;
  readonly viewInicial?: 'feed' | 'seguindo' | 'auth' | 'perfil' | 'comunidade' | 'comunidades';
  readonly slugInicial?: string;
  readonly handleInicial?: string;
  readonly topicoIdInicial?: string;
  readonly abrirCompositor?: boolean;
  readonly aoEntrar?: () => void;
  readonly slotArena?: ReactNode;
  readonly aoFocarArena?: () => void;
}

class ErroDePublicacaoDoAnexo extends Error {}

interface AudioDiretoPronto {
  readonly dados: Blob;
  readonly duracaoMs: number;
  readonly origem: 'gravacao' | 'arquivo';
}

type FiltroDoFeed = 'resenha' | 'arrotos' | 'links';

function IconeDaRede({ rede }: { readonly rede: 'instagram' | 'tiktok' | 'youtube' | 'twitter' }) {
  if (rede === 'instagram') return <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.4" cy="6.6" r=".9" fill="currentColor" stroke="none" /></svg>;
  if (rede === 'tiktok') return <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M14 4v10.1a4.1 4.1 0 1 1-3.1-4V7.3A7.1 7.1 0 1 0 17 14.1V9.8c1 .8 2.3 1.3 3.7 1.3V8.3A3.8 3.8 0 0 1 17 4h-3Z" fill="currentColor" stroke="none" /></svg>;
  if (rede === 'youtube') return <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M20.3 7.1a2.8 2.8 0 0 0-2-2C16.6 4.7 12 4.7 12 4.7s-4.6 0-6.3.4a2.8 2.8 0 0 0-2 2C3.3 8.8 3.3 12 3.3 12s0 3.2.4 4.9a2.8 2.8 0 0 0 2 2c1.7.4 6.3.4 6.3.4s4.6 0 6.3-.4a2.8 2.8 0 0 0 2-2c.4-1.7.4-4.9.4-4.9s0-3.2-.4-4.9Z" /><path d="m10.2 15.3 5-3.3-5-3.3v6.6Z" fill="currentColor" stroke="none" /></svg>;
  return <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M4.5 4h3.8l4.1 5.5L17.1 4h2.3l-6 7.2 6.1 8.2h-3.8l-4.5-6-5 6H4l6.3-7.6L4.5 4Z" fill="currentColor" stroke="none" /></svg>;
}

function IconeDoX() {
  return <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M4.5 4h3.8l4.1 5.5L17.1 4h2.3l-6 7.2 6.1 8.2h-3.8l-4.5-6-5 6H4l6.3-7.6L4.5 4Z" fill="currentColor" /></svg>;
}

function formatarMilhar(total?: number): string {
  if (typeof total !== 'number') return '—';
  if (total >= 1000) {
    const inteiro = Math.floor(total / 1000);
    const decimal = Math.floor((total % 1000) / 100);
    return decimal > 0 ? `${inteiro},${decimal}k` : `${inteiro}k`;
  }
  return String(total);
}

function fonteDoAvatarDaComunidade(comunidade: Pick<ComunidadeDoForum, 'slug' | 'avatarUrl' | 'icone'> | null | undefined): string | undefined {
  return comunidade?.avatarUrl ?? undefined;
}

function fonteDaCapaDaComunidade(comunidade: Pick<ComunidadeDoForum, 'slug' | 'capaUrl'> | null | undefined): string | undefined {
  return comunidade?.capaUrl ?? undefined;
}

/**
 * O acervo da casa só chega pela leitura autorizada do tópico. A URL pública
 * é resolvida pela plataforma, para a tela não conhecer o Storage.
 */
function audioDoTopico(audio: AnexoDeAudioDoTopico | null | undefined, forum: PortaDeForum) {
  if (audio?.caminhoDoAudioDaCasa) {
    const enderecoDoAudio = forum.enderecoDoAudioDaCasa?.(audio.caminhoDoAudioDaCasa) ?? undefined;
    return {
      temAudio: Boolean(enderecoDoAudio),
      enderecoDoAudio,
      nota: audio.nota ?? undefined,
      duracaoSegundos: audio.duracao ?? undefined,
    };
  }
  if (audio?.caminhoDoAudio && forum.assinarAudioDoResultado) {
    return {
      temAudio: true,
      enderecoDoAudio: () => forum.assinarAudioDoResultado!(audio.caminhoDoAudio!),
      nota: audio.nota ?? undefined,
      duracaoSegundos: audio.duracao ?? undefined,
    };
  }
  return {
    temAudio: false,
    enderecoDoAudio: undefined,
    nota: undefined,
    duracaoSegundos: undefined,
  };
}

function paraItemDePublicacaoPessoal(publicacao: PublicacaoPessoal, anexo?: AnexoDoForum, urlDoAnexo?: string): ItemDoFeed {
  return {
    id: `topico-${publicacao.id}`,
    tipo: 'topico',
    origem: 'pessoal',
    comunidadeSlug: '',
    titulo: publicacao.titulo,
    corpo: publicacao.corpo,
    autorNome: publicacao.autor.apelido ?? publicacao.autor.handle ?? 'Anônimo',
    autorHandle: publicacao.autor.handle ?? undefined,
    autorAvatarUrl: publicacao.autor.avatarUrl ?? undefined,
    criadoEm: publicacao.criadoEm,
    respostasTotal: publicacao.respostasTotal,
    temAudio: anexo?.tipo === 'audio',
    anexo: anexo ? { tipo: anexo.tipo, url: urlDoAnexo, duracaoMs: anexo.duracaoMs } : undefined,
  };
}

function paraItemDeTopicoDoPerfil(topico: TopicoDoAutor, perfil: PerfilPublico, forum: PortaDeForum, anexo?: AnexoDoForum, urlDoAnexo?: string, audioProjetado?: AnexoDeAudioDoTopico): ItemDoFeed {
  const audio = audioDoTopico(audioProjetado ?? topico.audio, forum);
  return {
    id: `topico-${topico.id}`,
    tipo: 'topico',
    comunidadeSlug: topico.comunidade.slug,
    titulo: topico.titulo,
    corpo: topico.corpo,
    autorNome: perfil.apelido ?? perfil.handle ?? 'Anônimo',
    autorHandle: perfil.handle ?? undefined,
    autorAvatarUrl: perfil.avatarUrl ?? undefined,
    criadoEm: topico.criadoEm,
    respostasTotal: topico.respostasTotal,
    temAudio: anexo?.tipo === 'audio' || audio.temAudio,
    enderecoDoAudio: audio.enderecoDoAudio,
    nota: audio.nota,
    duracaoSegundos: audio.duracaoSegundos,
    anexo: anexo ? { tipo: anexo.tipo, url: urlDoAnexo, duracaoMs: anexo.duracaoMs } : undefined,
  };
}

async function calcularNotaLocalDoAudio(arquivo: Blob): Promise<number | undefined> {
  try {
    const resultado = await analisarNotaDoAudioPublicado(arquivo);
    return resultado && resultado.ok ? resultado.nota : undefined;
  } catch {
    return undefined;
  }
}

function aplicarNotaAoTopico(
  anexo: AnexoDoForum | undefined,
  url: string | undefined,
  audioRaw: AnexoDeAudioDoTopico | null | undefined,
  audioResolvido: ReturnType<typeof audioDoTopico>,
  nota: NotaRetrospectiva | undefined,
): { readonly nota?: number; readonly notaRetrospectiva: boolean; readonly duracaoSegundos?: number } {
  const anexoDeAudio = anexo?.tipo === 'audio';
  const fonteAtual = anexoDeAudio ? 'anexo' : audioRaw?.caminhoDoAudioDaCasa ? 'casa' : null;
  const avaliada = Boolean(
    (anexoDeAudio || audioResolvido.nota === undefined)
    && nota?.fonte === fonteAtual
    && (fonteAtual === 'anexo' ? Boolean(url) : audioResolvido.temAudio),
  );
  return {
    nota: anexoDeAudio ? (avaliada ? nota?.nota : undefined) : audioResolvido.nota ?? (avaliada ? nota?.nota : undefined),
    notaRetrospectiva: Boolean(avaliada && nota?.versao === 'retrospectiva-acustica-legado-v1' && (anexoDeAudio || audioResolvido.nota === undefined)),
    duracaoSegundos: anexoDeAudio ? undefined : audioResolvido.duracaoSegundos,
  };
}

async function hidratarPublicacoesPessoais(
  publicacoes: readonly PublicacaoPessoal[],
  forum: PortaDeForum,
): Promise<readonly ItemDoFeed[]> {
  if (publicacoes.length === 0) return [];
  const ids = publicacoes.map((publicacao) => publicacao.id);
  const anexos = new Map<string, AnexoDoForum>();
  const notas = new Map<string, NotaRetrospectiva>();
  if (forum.listarAnexosDoForum) {
    const leitura = await forum.listarAnexosDoForum({ topicoIds: ids });
    if (leitura.ok) leitura.valor.forEach((anexo) => anexos.set(anexo.alvoId, anexo));
  }
  if (forum.listarNotasRetrospectivas) {
    const leitura = await forum.listarNotasRetrospectivas(ids);
    if (leitura.ok) leitura.valor.forEach((nota) => notas.set(nota.id, nota));
  }
  return Promise.all(publicacoes.map(async (publicacao) => {
    const anexo = anexos.get(publicacao.id);
    const url = anexo?.caminho && forum.assinarAnexoDoForum
      ? await forum.assinarAnexoDoForum(anexo.caminho).then((leitura) => (leitura.ok ? leitura.valor : undefined))
      : anexo?.urlVideo ?? undefined;
    const item = paraItemDePublicacaoPessoal(publicacao, anexo, url);
    const nota = notas.get(publicacao.id);
    return nota?.fonte === 'anexo' && anexo?.tipo === 'audio' && url
      ? { ...item, nota: nota.nota, notaRetrospectiva: nota.versao === 'retrospectiva-acustica-legado-v1' }
      : item;
  }));
}

function paraItemDaPrevia(
  { resposta, anexo }: PreviaDeRespostaDoTopico,
  urlDoAnexo?: string,
  nota?: NotaRetrospectiva,
): ItemComentario | null {
  if (resposta.status !== 'visivel') return null;

  const conteudo = resposta.corpo?.trim() || (
    anexo?.tipo === 'audio'
      ? 'Mandou um áudio.'
      : anexo?.tipo === 'imagem'
        ? 'Mandou uma imagem.'
        : anexo?.tipo === 'videoExterno'
          ? 'Mandou um vídeo.'
          : null
  );
  if (!conteudo) return null;

  const url = urlDoAnexo ?? anexo?.urlVideo ?? undefined;
  return {
    id: resposta.id,
    autorNome: resposta.autor?.apelido ?? resposta.autor?.handle ?? 'Alguém da comunidade',
    autorHandle: resposta.autor?.handle ?? undefined,
    autorAvatarUrl: resposta.autor?.avatarUrl ?? undefined,
    conteudo,
    criadoEm: resposta.criadoEm,
    paiId: resposta.paiId,
    nivel: resposta.nivel,
    ...(anexo?.tipo === 'audio' && url && nota
      ? {
          notaRetrospectiva: nota.nota,
          notaAvaliadaDepois: nota.versao === 'retrospectiva-acustica-legado-v1',
        }
      : {}),
    anexo: anexo
      ? { tipo: anexo.tipo, url, duracaoMs: anexo.duracaoMs }
      : undefined,
  };
}

export function InicioOpenDesign({
  portaForum,
  portaPautas,
  portaComunidade,
  portaPerfil,
  portaConta,
  portaArrotosDoPerfil,
  capturaDireta,
  autenticado: autenticadoProp,
  viewInicial = 'feed',
  slugInicial,
  handleInicial,
  topicoIdInicial,
  abrirCompositor = false,
  aoEntrar,
  slotArena,
  aoFocarArena,
}: Props) {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams<{ slug?: string; handle?: string; id?: string }>();
  const slugParam = slugInicial ?? params.slug;
  const handleParam = handleInicial ?? params.handle;
  const topicoIdParam = topicoIdInicial ?? params.id;

  const [forum] = useState(() => portaForum ?? criarForumWeb());
  // Testes que injetam o fórum não devem disparar a RPC real de pautas. Em
  // produção as duas portas vêm da plataforma e a leitura agrupada acontece.
  const [pautas] = useState<PortaDePautas>(() => portaPautas ?? (portaForum
    ? { obterPautaPorTopico: async () => ({ ok: true, valor: null }) }
    : criarPautasWeb()));
  const [comunidadePort] = useState(() => portaComunidade ?? criarComunidadeWeb());
  const [perfilPort] = useState(() => portaPerfil ?? criarPerfilRemoto());
  const [contaPort] = useState(() => portaConta ?? criarContaWeb());
  const [arrotosPort] = useState(() => portaArrotosDoPerfil ?? criarArrotosDoPerfilRemoto());
  const [capturaDoArroto] = useState(() => capturaDireta ?? criarCapturaWeb());
  const controleDeDialogo = useMemo(() => criarControleDeDialogoWeb(), []);

  const [viewAtual, setViewAtual] = useState<'feed' | 'seguindo' | 'auth' | 'perfil' | 'comunidade' | 'comunidades' | 'explorar' | 'arena'>(() => {
    if (viewInicial === 'auth' || viewInicial === 'perfil' || viewInicial === 'comunidades' || viewInicial === 'seguindo') return viewInicial;
    if (handleParam) return 'perfil';
    if (slugParam || topicoIdParam || viewInicial === 'comunidade') return 'comunidade';
    return 'feed';
  });

  const [comunidadeSlug, setComunidadeSlug] = useState(() => slugParam || 'eu-arroto-e-dai');
  const [comunidadeAtiva, setComunidadeAtiva] = useState<ComunidadeDoForum | null>(null);
  const [regrasDaComunidade, setRegrasDaComunidade] = useState<readonly string[]>([]);
  const [moderadoresDaComunidade, setModeradoresDaComunidade] = useState<readonly (readonly [string, string])[]>([]);
  const [falhaComunidade, setFalhaComunidade] = useState(false);
  const [comunidadeInexistente, setComunidadeInexistente] = useState(false);
  const [falhaTopico, setFalhaTopico] = useState(false);
  const [pautaAberta, setPautaAberta] = useState<PautaDoForum | null>(null);
  const [entradasDaPauta, setEntradasDaPauta] = useState<readonly ItemDoFeed[]>([]);
  const [estadoDaPauta, setEstadoDaPauta] = useState<'ocioso' | 'carregando' | 'pronto' | 'erro'>('ocioso');
  const [secaoComunidade, setSecaoComunidade] = useState<'causos' | 'sobre'>('causos');
  const [abaComunidade, setAbaComunidade] = useState<'Ativos' | 'Recentes'>('Ativos');
  const [topicosDaComunidade, setTopicosDaComunidade] = useState<readonly ItemDoFeed[]>([]);
  const [estadoTopicosDaComunidade, setEstadoTopicosDaComunidade] = useState<'carregando' | 'pronto' | 'erro'>('carregando');

  // Perfil
  const [abaPerfil, setAbaPerfil] = useState<'posts' | 'marcados' | 'arrotos' | 'salvos'>('arrotos');
  const [perfilAtivo, setPerfilAtivo] = useState<PerfilPublico | null>(null);
  const [topicosDaComunidadeDoPerfil, setTopicosDaComunidadeDoPerfil] = useState<readonly ItemDoFeed[]>([]);
  const [publicacoesPessoaisDoPerfil, setPublicacoesPessoaisDoPerfil] = useState<readonly ItemDoFeed[]>([]);
  const [publicacoesMarcadasDoPerfil, setPublicacoesMarcadasDoPerfil] = useState<readonly ItemDoFeed[]>([]);
  const [estadoPublicacoesPessoais, setEstadoPublicacoesPessoais] = useState<'ocioso' | 'carregando' | 'pronto' | 'erro'>('ocioso');
  const [estadoMarcadasDoPerfil, setEstadoMarcadasDoPerfil] = useState<'ocioso' | 'carregando' | 'pronto' | 'erro'>('ocioso');
  const [arrotosDoPerfil, setArrotosDoPerfil] = useState<readonly ArrotoDoPerfil[]>([]);
  const [notasDosArrotos, setNotasDosArrotos] = useState<ReadonlyMap<string, { nota: number; retrospectiva: boolean }>>(() => new Map());
  const [estadoArrotosDoPerfil, setEstadoArrotosDoPerfil] = useState<'carregando' | 'pronto' | 'erro'>('carregando');
  const [handleDosArrotos, setHandleDosArrotos] = useState<string | null>(null);
  const [resumoDasNotas, setResumoDasNotas] = useState<{ perfilId: string; estado: 'carregando' | 'erro' | 'pronto'; melhorNota: number | null; media: number | null }>({ perfilId: '', estado: 'carregando', melhorNota: null, media: null });
  const [revisaoDasNotas, setRevisaoDasNotas] = useState(0);
  const [estadoPerfil, setEstadoPerfil] = useState<'carregando' | 'pronto' | 'pendente' | 'inexistente' | 'erro'>('carregando');
  const [fichaSocialPendente, setFichaSocialPendente] = useState(false);
  const [estadoDaFicha, setEstadoDaFicha] = useState<'ocioso' | 'carregando' | 'pronto' | 'erro' | 'salvando'>('ocioso');
  const [ficha, setFicha] = useState<Required<Pick<DadosDoPerfil, 'apelido' | 'handle'>> & DadosDoPerfil>({ apelido: '', handle: '', bio: '', cidade: '' });
  const [erroDaFicha, setErroDaFicha] = useState('');
  const [estadoTopicosDoPerfil, setEstadoTopicosDoPerfil] = useState<'ocioso' | 'carregando' | 'pronto' | 'erro'>('ocioso');
  const [tentativaDoPerfil, setTentativaDoPerfil] = useState(0);
  const [modalPerfilAberto, setModalPerfilAberto] = useState(false);
  const [fotoEnviando, setFotoEnviando] = useState(false);
  const [capaEnviando, setCapaEnviando] = useState(false);
  const [ajusteDeImagem, setAjusteDeImagem] = useState<{ arquivo: File; tipo: TipoDeImagemAjustavel; alvo: 'perfil' | 'comunidade'; previewUrl: string } | null>(null);
  const [estadoDoAjusteDeImagem, setEstadoDoAjusteDeImagem] = useState<'preparando' | 'pronto' | 'erro' | 'enviando'>('pronto');
  const [erroDoAjusteDeImagem, setErroDoAjusteDeImagem] = useState<string | null>(null);
  const [recorteDaImagem, setRecorteDaImagem] = useState<RecorteVisual>({ centroX: 0.5, centroY: 0.5, zoom: 1 });
  const inputDaFoto = useRef<HTMLInputElement | null>(null);
  const inputDaCapa = useRef<HTMLInputElement | null>(null);

  // Auth
  const [painelAuth, setPainelAuth] = useState<'login' | 'recover' | 'signup'>('login');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginSenha, setLoginSenha] = useState('');
  const [recoverEmail, setRecoverEmail] = useState('');
  const [cadastroApelido, setCadastroApelido] = useState('');
  const [cadastroHandle, setCadastroHandle] = useState('');
  const [cadastroEmail, setCadastroEmail] = useState('');
  const [cadastroSenha, setCadastroSenha] = useState('');
  const [authStatus, setAuthStatus] = useState('');
  const [authEnviando, setAuthEnviando] = useState(false);

  const [estaAutenticado, setEstaAutenticado] = useState(autenticadoProp ?? false);
  const [meuPerfil, setMeuPerfil] = useState<PerfilPublico | null>(null);

  const [comunidades, setComunidades] = useState<readonly ComunidadeDoForum[]>([]);
  const [estadoComunidades, setEstadoComunidades] = useState<'carregando' | 'pronto' | 'erro'>('carregando');
  const [tentativaComunidades, setTentativaComunidades] = useState(0);
  const [itensFeed, setItensFeed] = useState<readonly ItemDoFeed[]>([]);
  const [previasDasConversas, setPreviasDasConversas] = useState<ReadonlyMap<string, readonly ItemComentario[]>>(() => new Map());
  const [previasEmCarregamento, setPreviasEmCarregamento] = useState<ReadonlySet<string>>(() => new Set());
  const [conversasExpandidas, setConversasExpandidas] = useState<ReadonlySet<string>>(() => new Set());
  const [cursoresDasConversas, setCursoresDasConversas] = useState<ReadonlyMap<string, CursorDoForum | null>>(() => new Map());
  const [respostasEmExpansao, setRespostasEmExpansao] = useState<ReadonlySet<string>>(() => new Set());
  const [filtroDoFeed, setFiltroDoFeed] = useState<FiltroDoFeed>('resenha');
  const [estadoFeed, setEstadoFeed] = useState<'carregando' | 'pronto' | 'erro'>('carregando');
  const [tentativaFeed, setTentativaFeed] = useState(0);
  const [temMaisFeed, setTemMaisFeed] = useState(false);
  const [carregandoMaisFeed, setCarregandoMaisFeed] = useState(false);
  const [erroMaisFeed, setErroMaisFeed] = useState(false);
  const carregarMaisFeed = useRef<() => void>(() => {});
  const fimDoFeed = useRef<HTMLDivElement | null>(null);
  const [itensSeguindo, setItensSeguindo] = useState<readonly ItemDoFeed[]>([]);
  const [estadoSeguindo, setEstadoSeguindo] = useState<'ocioso' | 'carregando' | 'pronto' | 'erro' | 'semConta'>('ocioso');
  const [busca, setBusca] = useState('');
  const [notificacoesDeMencao, setNotificacoesDeMencao] = useState<readonly NotificacaoDeMencao[]>([]);

  // Interações
  const [comunidadesEntradas, setComunidadesEntradas] = useState<Record<string, boolean>>({});

  // Audio player
  const [audioTocandoId, setAudioTocandoId] = useState<string | null>(null);
  const [audioSelecionadoId, setAudioSelecionadoId] = useState<string | null>(null);
  const [tempoAtualDoAudio, setTempoAtualDoAudio] = useState(0);
  const [duracaoDoAudio, setDuracaoDoAudio] = useState<number | null>(null);
  const elementoAudio = useRef<HTMLAudioElement | null>(null);
  const pedidoDeAudioAtual = useRef(0);

  // Modais
  const [modalCompositorAberto, setModalCompositorAberto] = useState(abrirCompositor);
  const [destinoDoCompositor, setDestinoDoCompositor] = useState<'pessoal' | 'comunidade'>(
    viewInicial === 'comunidade' || Boolean(slugParam) ? 'comunidade' : 'pessoal',
  );
  const [desafioAlvo, setDesafioAlvo] = useState<DesafioAlvoDoCompositor | null>(null);
  const [modalGravarArrotoAberto, setModalGravarArrotoAberto] = useState(false);
  const [estadoGravacaoDireta, setEstadoGravacaoDireta] = useState<EstadoDaGravacaoDireta>('ocioso');
  const [audioDireto, setAudioDireto] = useState<AudioDiretoPronto | null>(null);
  const [erroDaGravacaoDireta, setErroDaGravacaoDireta] = useState<string | null>(null);
  const [enviandoArrotoDireto, setEnviandoArrotoDireto] = useState(false);
  const [destinoFixoDaGravacao, setDestinoFixoDaGravacao] = useState<'perfil-proprio' | null>(null);
  const [publicarArrotoDiretoNoFeed, setPublicarArrotoDiretoNoFeed] = useState(false);
  const [gravacaoDiretaCompacta, setGravacaoDiretaCompacta] = useState(false);
  const [modalComentariosAberto, setModalComentariosAberto] = useState(false);
  const [postComentariosAtivo, setPostComentariosAtivo] = useState<ItemDoFeed | null>(null);
  const [comentarioInicialParaResponder, setComentarioInicialParaResponder] = useState<ItemComentario | null>(null);
  const [listaComentarios, setListaComentarios] = useState<readonly ItemComentario[]>([]);
  const [carregandoComentarios, setCarregandoComentarios] = useState(false);
  const [enviandoComentario, setEnviandoComentario] = useState(false);

  const carregarPreviasDasConversas = useCallback(async (posts: readonly ItemDoFeed[]) => {
    const postsComConversa = posts.filter((post) => post.tipo === 'topico' && post.respostasTotal > 0);
    const ids = [...new Set(postsComConversa.map((post) => post.id.replace(/^topico-/, '')))];
    const listarPrevias = forum.listarPreviaRespostasDosTopicos;
    if (!listarPrevias || ids.length === 0) return;

    const idsDosPosts = new Set(postsComConversa.map((post) => post.id));
    setPreviasEmCarregamento((anteriores) => new Set([...anteriores, ...idsDosPosts]));

    try {
      const resultado = await listarPrevias(ids);
      if (!resultado.ok) return;

      const respostaIdsComAudio = resultado.valor
        .filter((previa) => previa.resposta.status === 'visivel' && previa.anexo?.tipo === 'audio')
        .map((previa) => previa.resposta.id);

      const notasPorResposta = new Map<string, NotaRetrospectiva>();
      if (respostaIdsComAudio.length > 0 && forum.listarNotasRetrospectivas) {
        const leituraNotas = await forum.listarNotasRetrospectivas([], respostaIdsComAudio).catch(() => null);
        if (leituraNotas?.ok) {
          leituraNotas.valor
            .filter((nota) => nota.tipo === 'resposta' && nota.fonte === 'anexo')
            .forEach((nota) => notasPorResposta.set(nota.id, nota));
        }
      }

      const urlsPorResposta = new Map<string, string | undefined>();
      await Promise.all(resultado.valor.map(async (previa) => {
        if (previa.resposta.status !== 'visivel' || !previa.anexo) return;
        const url = previa.anexo.caminho && forum.assinarAnexoDoForum
          ? await forum.assinarAnexoDoForum(previa.anexo.caminho)
              .then((leitura) => (leitura.ok ? leitura.valor : undefined))
              .catch(() => undefined)
          : previa.anexo.urlVideo ?? undefined;
        urlsPorResposta.set(previa.resposta.id, url);
      }));

      const porPost = new Map<string, ItemComentario[]>();
      for (const previa of resultado.valor) {
        const url = urlsPorResposta.get(previa.resposta.id);
        const nota = previa.anexo?.tipo === 'audio' && url ? notasPorResposta.get(previa.resposta.id) : undefined;
        const comentario = paraItemDaPrevia(previa, url, nota);
        if (!comentario) continue;
        const idDoPost = `topico-${previa.topicoId}`;
        if (!idsDosPosts.has(idDoPost)) continue;
        const existentes = porPost.get(idDoPost) ?? [];
        if (existentes.length < 2) existentes.push(comentario);
        porPost.set(idDoPost, existentes);
      }

      setPreviasDasConversas((anteriores) => {
        const proximas = new Map(anteriores);
        for (const idDoPost of idsDosPosts) proximas.delete(idDoPost);
        for (const [idDoPost, comentarios] of porPost) proximas.set(idDoPost, comentarios);
        return proximas;
      });
      setConversasExpandidas((anteriores) => new Set([...anteriores].filter((id) => !idsDosPosts.has(id))));
      setCursoresDasConversas((anteriores) => new Map([...anteriores].filter(([id]) => !idsDosPosts.has(id))));
    } catch {
      // A prévia é informativa; o contador e a thread completa continuam honestos.
    } finally {
      setPreviasEmCarregamento((anteriores) => {
        const proximas = new Set(anteriores);
        for (const idDoPost of idsDosPosts) proximas.delete(idDoPost);
        return proximas;
      });
    }
  }, [forum]);
  const [modalGerirComunidadeAberto, setModalGerirComunidadeAberto] = useState(false);
  const [midiaDaComunidadeEnviando, setMidiaDaComunidadeEnviando] = useState<TipoDeMidiaDaComunidade | null>(null);
  const [modalInstitucionalAberto, setModalInstitucionalAberto] = useState(false);
  const [toastMensagem, setToastMensagem] = useState<string | null>(null);
  const toastTimeoutRef = useRef<number | null>(null);

  const exibirToast = (msg: string) => {
    setToastMensagem(msg);
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = window.setTimeout(() => setToastMensagem(null), 2600);
  };

  // Carregar sessão e meu perfil
  useEffect(() => {
    let ativo = true;
    contaPort
      .estado()
      .then(async (e) => {
        if (!ativo) return;
        if (e.temSessao && !e.anonima && e.perfilSocialPendente) {
          setEstaAutenticado(false);
          setFichaSocialPendente(true);
          setEstadoPerfil('pendente');
          setEstadoDaFicha('carregando');
          try {
            const rascunho = await perfilPort.obterMeuPerfilParaEdicao();
            if (!ativo) return;
            setFicha({
              apelido: rascunho?.apelido ?? '', handle: rascunho?.handle ?? '',
              bio: rascunho?.bio ?? '', cidade: rascunho?.cidade ?? '',
              instagram: rascunho?.instagram ?? '', tiktok: rascunho?.tiktok ?? '',
              youtube: rascunho?.youtube ?? '', twitter: rascunho?.twitter ?? '',
            });
            setEstadoDaFicha('pronto');
          } catch {
            if (ativo) setEstadoDaFicha('erro');
          }
          return;
        }
        const logado = e.temSessao && !e.anonima && !e.perfilSocialPendente;
        setEstaAutenticado(logado);
        if (!logado) {
          setFichaSocialPendente(false);
          if (!handleParam) setEstadoPerfil('pendente');
          return;
        }

        // Meu perfil sustenta a sessão na casca inteira, inclusive quando a
        // pessoa está visitando /u/:handle. O perfil visitado é carregado no
        // efeito abaixo; ele não pode apagar a identidade de quem está logado.
        const perfil = await perfilPort.obterMeuPerfil?.();
        if (ativo && perfil) {
          setMeuPerfil(perfil);
          if (!handleParam) {
            setPerfilAtivo(perfil);
            setSeguindoPerfil(perfil.euSigo);
            setEstadoPerfil('pronto');
          }
        } else if (ativo && !handleParam) {
            setEstadoPerfil('pendente');
        }
      })
      .catch(() => {
        if (ativo) {
          setEstaAutenticado(false);
          if (!handleParam) setEstadoPerfil('erro');
        }
      });
    return () => {
      ativo = false;
    };
  }, [contaPort, perfilPort, handleParam, tentativaDoPerfil]);

  // Carregar perfil solicitado pelo handle
  useEffect(() => {
    let ativo = true;
    if (handleParam) {
      setViewAtual('perfil');
      setEstadoPerfil('carregando');
      setPerfilAtivo(null);
      perfilPort
        .obterPerfil?.(handleParam)
        .then((perfil) => {
          if (!ativo) return;
          if (perfil) {
            setPerfilAtivo(perfil);
            setSeguindoPerfil(perfil.euSigo);
            setEstadoPerfil('pronto');
          } else setEstadoPerfil('inexistente');
        })
        .catch(() => {
          if (ativo) setEstadoPerfil('erro');
        });
    }
    return () => {
      ativo = false;
    };
  }, [handleParam, perfilPort, tentativaDoPerfil]);

  // O perfil precisa ler o mesmo acervo que abastece o feed novo. O adaptador
  // antigo só enxerga `posts_comunidade`, deixando de fora tópicos atuais.
  useEffect(() => {
    let ativo = true;
    const alvo = perfilAtivo ?? meuPerfil;
    if (!alvo?.handle || !forum.listarTopicosDoAutor) return;
    setEstadoTopicosDoPerfil('carregando');
    void Promise.resolve(forum.listarTopicosDoAutor(alvo.handle, { limite: 50 })).then(async (resultado) => {
      if (!ativo) return;
      if (!resultado?.ok) {
        setTopicosDaComunidadeDoPerfil([]);
        setEstadoTopicosDoPerfil('erro');
        return;
      }

      const topicos = resultado.valor.itens;
      const anexosPorTopico = new Map<string, AnexoDoForum>();
      const audioPorTopico = new Map<string, AnexoDeAudioDoTopico>();
      const notasPorTopico = new Map<string, NotaRetrospectiva>();
      if (forum.listarAnexosDoForum) {
        const leituraAnexos = await forum.listarAnexosDoForum({ topicoIds: topicos.map((topico) => topico.id) });
        if (leituraAnexos.ok) leituraAnexos.valor.forEach((anexo) => anexosPorTopico.set(anexo.alvoId, anexo));
      }
      if (forum.listarAudioDosTopicos) {
        const leituraAudio = await forum.listarAudioDosTopicos(topicos.map((topico) => topico.id));
        if (leituraAudio.ok) leituraAudio.valor.forEach(({ topicoId, audio }) => audioPorTopico.set(topicoId, audio));
      }
      if (forum.listarNotasRetrospectivas) {
        const leitura = await forum.listarNotasRetrospectivas(topicos.map((topico) => topico.id));
        if (leitura.ok) leitura.valor.forEach((nota) => notasPorTopico.set(nota.id, nota));
      }
      if (!ativo) return;

      const itens = await Promise.all(topicos.map(async (topico) => {
        const anexo = anexosPorTopico.get(topico.id);
        const url = anexo?.caminho && forum.assinarAnexoDoForum
          ? await forum.assinarAnexoDoForum(anexo.caminho).then((leitura) => leitura.ok ? leitura.valor : undefined)
          : anexo?.urlVideo ?? undefined;
        const audioRaw = audioPorTopico.get(topico.id) ?? topico.audio;
        const item = paraItemDeTopicoDoPerfil(topico, alvo, forum, anexo, url, audioRaw ?? undefined);
        const notaAplicada = aplicarNotaAoTopico(anexo, url, audioRaw, audioDoTopico(audioRaw, forum), notasPorTopico.get(topico.id));
        return { ...item, ...notaAplicada };
      }));
      if (!ativo) return;
      setTopicosDaComunidadeDoPerfil(itens);
      setEstadoTopicosDoPerfil('pronto');
    }).catch(() => {
      if (!ativo) return;
      setTopicosDaComunidadeDoPerfil([]);
      setEstadoTopicosDoPerfil('erro');
    });
    return () => {
      ativo = false;
    };
  }, [perfilAtivo, meuPerfil, forum]);

  // Posts pessoais e menções não passam pela porta legada de causos: ambos são
  // tópicos sem roda, retornados pela porta do fórum.
  useEffect(() => {
    let ativo = true;
    const alvo = perfilAtivo ?? meuPerfil;
    if (!alvo?.handle || !forum.listarPublicacoesPessoaisDoAutor) return;
    setEstadoPublicacoesPessoais('carregando');
    void forum.listarPublicacoesPessoaisDoAutor(alvo.handle, { limite: 50 }).then(async (resultado) => {
      if (!ativo) return;
      if (!resultado.ok) {
        setPublicacoesPessoaisDoPerfil([]);
        setEstadoPublicacoesPessoais('erro');
        return;
      }
      const itens = await hidratarPublicacoesPessoais(resultado.valor.itens, forum);
      if (!ativo) return;
      setPublicacoesPessoaisDoPerfil(itens);
      setEstadoPublicacoesPessoais('pronto');
    }).catch(() => {
      if (!ativo) return;
      setPublicacoesPessoaisDoPerfil([]);
      setEstadoPublicacoesPessoais('erro');
    });
    return () => { ativo = false; };
  }, [perfilAtivo, meuPerfil, forum]);

  useEffect(() => {
    let ativo = true;
    if (!estaAutenticado || !forum.listarMinhasNotificacoesDeMencao) {
      setNotificacoesDeMencao([]);
      return;
    }
    void forum.listarMinhasNotificacoesDeMencao().then((resultado) => {
      if (ativo) setNotificacoesDeMencao(resultado.ok ? resultado.valor : []);
    }).catch(() => {
      if (ativo) setNotificacoesDeMencao([]);
    });
    return () => { ativo = false; };
  }, [estaAutenticado, forum, tentativaDoPerfil]);

  useEffect(() => {
    let ativo = true;
    const alvo = perfilAtivo ?? meuPerfil;
    if (!alvo?.handle || !forum.listarPublicacoesMarcadas) return;
    setEstadoMarcadasDoPerfil('carregando');
    void forum.listarPublicacoesMarcadas(alvo.handle, { limite: 50 }).then(async (resultado) => {
      if (!ativo) return;
      if (!resultado.ok) {
        setPublicacoesMarcadasDoPerfil([]);
        setEstadoMarcadasDoPerfil('erro');
        return;
      }
      const itens = await hidratarPublicacoesPessoais(resultado.valor.itens, forum);
      if (!ativo) return;
      setPublicacoesMarcadasDoPerfil(itens);
      setEstadoMarcadasDoPerfil('pronto');
    }).catch(() => {
      if (!ativo) return;
      setPublicacoesMarcadasDoPerfil([]);
      setEstadoMarcadasDoPerfil('erro');
    });
    return () => { ativo = false; };
  }, [perfilAtivo, meuPerfil, forum]);

  useEffect(() => {
    let ativo = true;
    const alvo = perfilAtivo ?? meuPerfil;
    if (!alvo) return;
    setEstadoArrotosDoPerfil('carregando');
    setNotasDosArrotos(new Map());
    setHandleDosArrotos(alvo.handle);
    arrotosPort.listarArrotos(alvo.handle).then(
      (lista) => {
        if (!ativo) return;
        setArrotosDoPerfil(lista);
        setEstadoArrotosDoPerfil('pronto');
        if (forum.listarNotasRetrospectivas) {
          void forum.listarNotasRetrospectivas([], [], lista.map((arroto) => arroto.id)).then((res) => {
            if (ativo && res.ok) setNotasDosArrotos(new Map(res.valor.filter((nota) => nota.tipo === 'perfil' && nota.fonte === 'perfil').map((nota) => [nota.id, { nota: nota.nota, retrospectiva: nota.versao === 'retrospectiva-acustica-legado-v1' }])));
          }).catch(() => {});
        }
      },
      () => {
        if (!ativo) return;
        setArrotosDoPerfil([]);
        setEstadoArrotosDoPerfil('erro');
      },
    );
    return () => {
      ativo = false;
    };
  }, [perfilAtivo, meuPerfil, arrotosPort, forum]);

  useEffect(() => {
    let ativo = true;
    const perfilId = (perfilAtivo ?? meuPerfil)?.id;
    if (!perfilId) return;
    setResumoDasNotas({ perfilId, estado: 'carregando', melhorNota: null, media: null });
    if (!forum.obterResumoDasNotasPublicadas) {
      setResumoDasNotas({ perfilId, estado: 'erro', melhorNota: null, media: null });
      return;
    }
    void forum.obterResumoDasNotasPublicadas(perfilId).then((resumo) => {
      if (!ativo) return;
      setResumoDasNotas(resumo.ok
        ? { perfilId, estado: 'pronto', melhorNota: resumo.valor.melhorNota, media: resumo.valor.media }
        : { perfilId, estado: 'erro', melhorNota: null, media: null });
    }).catch(() => {
      if (ativo) setResumoDasNotas({ perfilId, estado: 'erro', melhorNota: null, media: null });
    });
    return () => { ativo = false; };
  }, [perfilAtivo, meuPerfil, forum, revisaoDasNotas]);

  useEffect(() => () => capturaDoArroto.soltar(), [capturaDoArroto]);

  // Sincroniza se o slug vier pela URL
  useEffect(() => {
    if (slugParam && slugParam !== comunidadeSlug) {
      setComunidadeSlug(slugParam);
      setViewAtual('comunidade');
    }
  }, [slugParam, comunidadeSlug]);

  // Carregar comunidade ativa
  useEffect(() => {
    let ativo = true;
    if (!comunidadeSlug) return;

    setComunidadeInexistente(false);
    setRegrasDaComunidade([]);
    setModeradoresDaComunidade([]);
    void forum.obterDetalhesDaComunidade?.(comunidadeSlug).then((res) => {
      if (!ativo || !res.ok || !res.valor) return;
      setRegrasDaComunidade(res.valor.regras);
      setModeradoresDaComunidade(res.valor.moderadores.map((m) => [`u/${m.handle}`, 'moderação'] as const));
    }).catch(() => undefined);

    const promessaComunidade = forum.obterComunidadeDoForum?.(comunidadeSlug);
    if (promessaComunidade && typeof promessaComunidade.then === 'function') {
      promessaComunidade
        .then((res) => {
          if (!ativo) return;
          if (res?.ok && !res.valor) {
            setComunidadeAtiva(null);
            setFalhaComunidade(false);
            setComunidadeInexistente(true);
          } else if (res?.ok && res.valor) {
            setComunidadeAtiva(res.valor);
            setFalhaComunidade(false);
            if (res.valor.souMembro) {
              setComunidadesEntradas((prev) => ({ ...prev, [comunidadeSlug]: true }));
            }
          } else if (res && !res.ok) {
            setComunidadeAtiva(null);
            setFalhaComunidade(true);
          }
        })
        .catch(() => {
          if (ativo) {
            setComunidadeAtiva(null);
            setFalhaComunidade(true);
          }
        });
    }

    setEstadoTopicosDaComunidade('carregando');
    const promessaTopicos = forum.listarTopicos?.(comunidadeSlug, {
      ordem: abaComunidade === 'Recentes' ? 'recentes' : 'atividade',
    }) ?? Promise.resolve({ ok: false as const, motivo: 'falhou' as const });

    promessaTopicos.then(async (resTopicos) => {
      if (!ativo) return;
      if (!resTopicos.ok) {
        setTopicosDaComunidade([]);
        setEstadoTopicosDaComunidade('erro');
        return;
      }
      const itens: ItemDoFeed[] = [];
      const topicoIds = resTopicos.valor.itens.map((topico) => topico.id);
      const anexosPorTopico = new Map<string, AnexoDoForum>();
      const audioPorTopico = new Map<string, AnexoDeAudioDoTopico>();
      const notasPorTopico = new Map<string, NotaRetrospectiva>();
      if (forum.listarAnexosDoForum && topicoIds.length > 0) {
        const leitura = await forum.listarAnexosDoForum({ topicoIds });
        if (leitura.ok) leitura.valor.forEach((anexo) => anexosPorTopico.set(anexo.alvoId, anexo));
      }
      if (forum.listarAudioDosTopicos && topicoIds.length > 0) {
        const leitura = await forum.listarAudioDosTopicos(topicoIds);
        if (leitura.ok) leitura.valor.forEach(({ topicoId, audio }) => audioPorTopico.set(topicoId, audio));
      }
      if (forum.listarNotasRetrospectivas && topicoIds.length > 0) {
        const leitura = await forum.listarNotasRetrospectivas(topicoIds);
        if (leitura.ok) leitura.valor.forEach((nota) => notasPorTopico.set(nota.id, nota));
      }
      for (const t of resTopicos.valor.itens) {
        const anexo = anexosPorTopico.get(t.id);
        const url = anexo?.caminho && forum.assinarAnexoDoForum
          ? await forum.assinarAnexoDoForum(anexo.caminho).then((resultado) => resultado.ok ? resultado.valor : undefined)
          : anexo?.urlVideo ?? undefined;
        if (!ativo) return;
        const audioRaw = audioPorTopico.get(t.id) ?? t.audio;
        const audio = audioDoTopico(audioRaw, forum);
        const notaAplicada = aplicarNotaAoTopico(anexo, url, audioRaw, audio, notasPorTopico.get(t.id));
        itens.push({
          id: `topico-${t.id}`,
          tipo: 'topico',
          comunidadeSlug: t.comunidade.slug,
          comunidadeAvatarUrl: fonteDoAvatarDaComunidade(comunidadeAtiva),
          titulo: t.titulo,
          corpo: t.corpo,
          autorNome: t.autor.apelido ?? (t.autor.handle ? `@${t.autor.handle}` : 'Anônimo'),
          autorHandle: t.autor.handle ?? undefined,
          autorAvatarUrl: t.autor.avatarUrl ?? undefined,
          criadoEm: t.criadoEm,
          respostasTotal: t.respostasTotal,
          temAudio: audio.temAudio || anexo?.tipo === 'audio',
          enderecoDoAudio: audio.enderecoDoAudio,
          ...notaAplicada,
          anexo: anexo ? { tipo: anexo.tipo, url, duracaoMs: anexo.duracaoMs } : undefined,
        });
      }
      setTopicosDaComunidade(itens);
      void carregarPreviasDasConversas(itens);
      setEstadoTopicosDaComunidade('pronto');
    }).catch(() => {
      if (!ativo) return;
      setTopicosDaComunidade([]);
      setEstadoTopicosDaComunidade('erro');
    });

    return () => {
      ativo = false;
    };
  }, [comunidadeSlug, forum, abaComunidade, carregarPreviasDasConversas]);

  // Carregar tópico específico via URL direta (/c/:slug/t/:id)
  useEffect(() => {
    let ativo = true;
    if (!topicoIdParam) return;

    setFalhaTopico(false);
    setPautaAberta(null);
    setEntradasDaPauta([]);
    setEstadoDaPauta('carregando');

    const paraItem = async (
      t: import('../../portas/forum').TopicoDoForum,
      anexos: ReadonlyMap<string, AnexoDoForum>,
      notas: ReadonlyMap<string, NotaRetrospectiva>,
    ): Promise<ItemDoFeed> => {
      const anexo = anexos.get(t.id);
      const url = anexo?.caminho && forum.assinarAnexoDoForum
        ? await forum.assinarAnexoDoForum(anexo.caminho).then((resultado) => resultado.ok ? resultado.valor : undefined)
        : anexo?.urlVideo ?? undefined;
      const audio = audioDoTopico(t.audio, forum);
      const notaAplicada = aplicarNotaAoTopico(anexo, url, t.audio, audio, notas.get(t.id));
      return {
        id: `topico-${t.id}`,
        tipo: 'topico',
        comunidadeSlug: t.comunidade.slug,
        comunidadeAvatarUrl: fonteDoAvatarDaComunidade(comunidadeAtiva),
        titulo: t.titulo,
        corpo: t.corpo,
        autorNome: t.autor.apelido ?? (t.autor.handle ? `@${t.autor.handle}` : 'Anônimo'),
        autorHandle: t.autor.handle ?? undefined,
        autorAvatarUrl: t.autor.avatarUrl ?? undefined,
        criadoEm: t.criadoEm,
        respostasTotal: t.respostasTotal,
        temAudio: audio.temAudio || anexo?.tipo === 'audio',
        enderecoDoAudio: audio.enderecoDoAudio,
        ...notaAplicada,
        anexo: anexo ? { tipo: anexo.tipo, url, duracaoMs: anexo.duracaoMs } : undefined,
      };
    };

    const carregar = async () => {
      try {
        const agrupada = await pautas.obterPautaPorTopico(topicoIdParam);
        if (!ativo) return;
        if (agrupada.ok && agrupada.valor) {
          const ids = agrupada.valor.entradas.map((entrada) => entrada.id);
          const anexos = new Map<string, AnexoDoForum>();
          const notas = new Map<string, NotaRetrospectiva>();
          if (forum.listarAnexosDoForum && ids.length > 0) {
            const leitura = await forum.listarAnexosDoForum({ topicoIds: ids });
            if (leitura.ok) leitura.valor.forEach((anexo) => anexos.set(anexo.alvoId, anexo));
          }
          if (forum.listarNotasRetrospectivas && ids.length > 0) {
            const leitura = await forum.listarNotasRetrospectivas(ids);
            if (leitura.ok) leitura.valor.forEach((nota) => notas.set(nota.id, nota));
          }
          const entradas = await Promise.all(agrupada.valor.entradas.map((entrada) => paraItem(entrada, anexos, notas)));
          if (!ativo) return;
          setPautaAberta(agrupada.valor);
          setEntradasDaPauta(entradas);
          void carregarPreviasDasConversas(entradas);
          setEstadoDaPauta('pronto');
          return;
        }

        const res = await forum.obterTopico(topicoIdParam);
        if (!ativo) return;
        if (!res.ok || !res.valor) {
          setFalhaTopico(true);
          setEstadoDaPauta('ocioso');
          return;
        }
        const anexos = new Map<string, AnexoDoForum>();
        const notas = new Map<string, NotaRetrospectiva>();
        if (forum.listarAnexosDoForum) {
          const leitura = await forum.listarAnexosDoForum({ topicoIds: [res.valor.id] });
          if (leitura.ok) leitura.valor.forEach((anexo) => anexos.set(anexo.alvoId, anexo));
        }
        if (forum.listarNotasRetrospectivas) {
          const leitura = await forum.listarNotasRetrospectivas([res.valor.id]);
          if (leitura.ok) leitura.valor.forEach((nota) => notas.set(nota.id, nota));
        }
        const post = await paraItem(res.valor, anexos, notas);
        if (!ativo) return;
        setEstadoDaPauta('ocioso');
        setPostComentariosAtivo(post);
        void abrirComentarios(post, undefined, true);
      } catch {
        if (!ativo) return;
        setEstadoDaPauta('erro');
      }
    };
    void carregar();

    return () => {
      ativo = false;
    };
  }, [topicoIdParam, forum, pautas, comunidadeAtiva]);

  // Duas leituras públicas, intercaladas com cursores independentes sem antecipar itens antigos.
  useEffect(() => {
    let ativo = true;
    let emAndamento = false;
    const paginacao = criarPaginacaoDoMural(forum);
    setEstadoFeed('carregando');
    setEstadoComunidades('carregando');
    setTemMaisFeed(false);
    setErroMaisFeed(false);
    const leituraComunidades = forum.listarComunidadesDoForum().then((resultado) => {
      if (ativo) {
        if (resultado.ok) setComunidades(resultado.valor);
        setEstadoComunidades(resultado.ok ? 'pronto' : 'erro');
      }
      return resultado;
    }).catch(() => {
      if (ativo) setEstadoComunidades('erro');
      return { ok: false as const, motivo: 'falhou' as const };
    });
    const carregarPagina = async (adicionar: boolean) => {
      if (emAndamento) return;
      emAndamento = true;
      if (adicionar) { setCarregandoMaisFeed(true); setErroMaisFeed(false); }
      try {
        const [pagina, resComunidades] = await Promise.all([paginacao.proxima(), leituraComunidades]);
        const topicos = pagina.entradas.flatMap((entrada) => entrada.tipo === 'comunidade' ? [entrada.valor] : []);
        const pessoais = pagina.entradas.flatMap((entrada) => entrada.tipo === 'pessoal' ? [entrada.valor] : []);
        const anexosPorTopico = new Map<string, AnexoDoForum>();
        const audioPorTopico = new Map<string, AnexoDeAudioDoTopico>();
        const notasRetrospectivas = new Map<string, import('../../portas/forum').NotaRetrospectiva>();
        const corpos = new Map<string, string>();
        const removidos = new Set<string>();
        if (forum.listarAnexosDoForum) {
          const leitura = await forum.listarAnexosDoForum({ topicoIds: [...topicos.map((t) => t.id), ...pessoais.map((p) => p.id)] });
          if (!leitura.ok) throw new Error('Não foi possível carregar os anexos.');
          leitura.valor.forEach((anexo) => anexosPorTopico.set(anexo.alvoId, anexo));
        }
        if (forum.listarAudioDosTopicos) {
          const leitura = await forum.listarAudioDosTopicos(topicos.map((t) => t.id));
          if (!leitura.ok) throw new Error('Não foi possível carregar os áudios.');
          leitura.valor.forEach(({ topicoId, audio }) => audioPorTopico.set(topicoId, audio));
        }
        if (forum.listarNotasRetrospectivas) {
          const leitura = await forum.listarNotasRetrospectivas(pagina.entradas.map((entrada) => entrada.valor.id));
          if (leitura.ok) leitura.valor.forEach((nota) => notasRetrospectivas.set(nota.id, nota));
        }
        // A projeção da lista não possui corpo; consulta pública em lotes evita disparar 30 de uma vez.
        for (let i = 0; i < topicos.length; i += 6) {
          await Promise.all(topicos.slice(i, i + 6).map(async (topico) => {
            const detalhe = await forum.obterTopico(topico.id);
            if (!detalhe) return; // Adaptadores antigos de teste não implementam essa leitura.
            if (!detalhe.ok) throw new Error('Não foi possível carregar o conteúdo da publicação.');
            if (!detalhe.valor) { removidos.add(topico.id); return; }
            corpos.set(topico.id, detalhe.valor.corpo);
          }));
        }
        const avatares = new Map((resComunidades.ok ? resComunidades.valor : []).map((c) => [c.slug, fonteDoAvatarDaComunidade(c)]));
        const itens: ItemDoFeed[] = [];
        for (const entrada of pagina.entradas) {
          const item = entrada.valor;
          if (entrada.tipo === 'comunidade' && removidos.has(item.id)) continue;
          const anexo = anexosPorTopico.get(item.id);
          let url = anexo?.urlVideo ?? undefined;
          if (anexo?.caminho) {
            if (!forum.assinarAnexoDoForum) throw new Error('Anexo indisponível.');
            const assinatura = await forum.assinarAnexoDoForum(anexo.caminho);
            if (!assinatura.ok) throw new Error('Não foi possível abrir o anexo.');
            url = assinatura.valor;
          }
          if (entrada.tipo === 'pessoal') {
            const nota = notasRetrospectivas.get(item.id);
            const avaliada = nota?.fonte === 'anexo' && anexo?.tipo === 'audio' && Boolean(url);
            itens.push({ ...paraItemDePublicacaoPessoal(entrada.valor, anexo, url), ...(avaliada ? { nota: nota.nota, notaRetrospectiva: nota.versao === 'retrospectiva-acustica-legado-v1' } : {}) });
          } else {
            const t = entrada.valor;
            const audioRaw = audioPorTopico.get(t.id) ?? t.audio;
            const audio = audioDoTopico(audioRaw, forum);
            const notaAplicada = aplicarNotaAoTopico(anexo, url, audioRaw, audio, notasRetrospectivas.get(t.id));
            itens.push({ id: `topico-${t.id}`, tipo: 'topico', comunidadeSlug: t.comunidade.slug,
              comunidadeAvatarUrl: avatares.get(t.comunidade.slug), titulo: t.titulo, corpo: corpos.get(t.id) ?? '',
              autorNome: t.autor.apelido ?? t.autor.handle ?? 'Anônimo', autorHandle: t.autor.handle ?? undefined,
              autorAvatarUrl: t.autor.avatarUrl ?? undefined, criadoEm: t.criadoEm, respostasTotal: t.respostasTotal,
              temAudio: anexo?.tipo === 'audio' || audio.temAudio, enderecoDoAudio: audio.enderecoDoAudio,
              ...notaAplicada,
              anexo: anexo ? { tipo: anexo.tipo, url, duracaoMs: anexo.duracaoMs } : undefined });
          }
        }
        if (!ativo) return;
        pagina.confirmar();
        setItensFeed((anteriores) => adicionar ? [...anteriores, ...itens.filter((item) => !anteriores.some((a) => a.id === item.id))] : itens);
        setTemMaisFeed(pagina.temMais);
        void carregarPreviasDasConversas(itens);
        setEstadoFeed('pronto');
      } catch {
        if (!ativo) return;
        if (adicionar) setErroMaisFeed(true);
        else { setItensFeed([]); setEstadoFeed('erro'); }
      } finally {
        emAndamento = false;
        if (ativo) setCarregandoMaisFeed(false);
      }
    };
    carregarMaisFeed.current = () => { void carregarPagina(true); };
    if (viewAtual === 'feed') void carregarPagina(false);
    return () => { ativo = false; carregarMaisFeed.current = () => {}; };
  }, [forum, viewAtual, tentativaFeed, tentativaComunidades, carregarPreviasDasConversas]);

  useEffect(() => {
    const alvo = fimDoFeed.current;
    if (viewAtual !== 'feed' || estadoFeed !== 'pronto' || !temMaisFeed || carregandoMaisFeed || erroMaisFeed || !alvo || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver((entradas) => {
      if (entradas.some((entrada) => entrada.isIntersecting)) carregarMaisFeed.current();
    }, { rootMargin: '300px' });
    observer.observe(alvo);
    return () => observer.disconnect();
  }, [viewAtual, estadoFeed, temMaisFeed, carregandoMaisFeed, erroMaisFeed]);

  const itensDoFeedFiltrados = useMemo(() => {
    const porDataDePublicacao = [...itensFeed].sort((a, b) =>
      new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime(),
    );

    if (filtroDoFeed === 'arrotos') {
      return porDataDePublicacao.filter((post) =>
        Boolean(post.temAudio || post.enderecoDoAudio || post.anexo?.tipo === 'audio'),
      );
    }

    if (filtroDoFeed === 'links') {
      return porDataDePublicacao.filter((post) =>
        Boolean(post.videoUrl || post.anexo?.tipo === 'videoExterno'),
      );
    }

    return porDataDePublicacao;
  }, [filtroDoFeed, itensFeed]);

  useEffect(() => {
    if (viewAtual !== 'seguindo') return;
    if (!estaAutenticado) {
      setEstadoSeguindo('semConta');
      return;
    }
    let ativo = true;
    setEstadoSeguindo('carregando');
    comunidadePort.listarFeed({ seguindo: true, limite: 30 }).then(
      (causos) => {
        if (!ativo) return;
        setItensSeguindo(causos.map((causo) => ({
          id: `causo-${causo.id}`,
          tipo: 'causo',
          comunidadeSlug: causo.comunidadeSlug || 'eu-arroto-e-dai',
          titulo: causo.conteudo.slice(0, 65) + (causo.conteudo.length > 65 ? '…' : ''),
          corpo: causo.conteudo,
          autorNome: causo.autorNome,
          autorHandle: causo.autorHandle,
          criadoEm: causo.criadoEm || new Date().toISOString(),
          respostasTotal: causo.totalComentarios || 0,
          temAudio: causo.temAudio,
          enderecoDoAudio: causo.enderecoDoAudio,
          nota: causo.nota,
          videoUrl: causo.videoUrl,
          engajamento: engajamentoDoCauso(causo),
        })));
        setEstadoSeguindo('pronto');
      },
      () => { if (ativo) setEstadoSeguindo('erro'); },
    );
    return () => { ativo = false; };
  }, [viewAtual, estaAutenticado, comunidadePort]);

  useEffect(() => () => {
    const audio = elementoAudio.current;
    if (!audio) return;
    audio.pause();
    audio.onloadedmetadata = null;
    audio.ondurationchange = null;
    audio.ontimeupdate = null;
    audio.onended = null;
    audio.onerror = null;
    audio.src = '';
  }, []);

  // Áudio player handler
  const alternarAudio = async (
    urlOuResolver?: string | (() => Promise<string | null>),
    identificador?: string,
  ) => {
    if (!urlOuResolver) return;
    const pedido = ++pedidoDeAudioAtual.current;
    const chave = identificador ?? (typeof urlOuResolver === 'string' ? urlOuResolver : null);
    if (chave && audioTocandoId === chave) {
      elementoAudio.current?.pause();
      setAudioTocandoId(null);
      return;
    }
    if (chave && audioSelecionadoId === chave && elementoAudio.current?.src) {
      try {
        await elementoAudio.current.play();
        if (pedido === pedidoDeAudioAtual.current) {
          setAudioTocandoId(chave);
          analyticsArenaV2.registrar('ouviu_arroto');
        }
      } catch {
        if (pedido === pedidoDeAudioAtual.current) setAudioTocandoId(null);
      }
      return;
    }
    let url: string | null = null;
    if (typeof urlOuResolver === 'function') {
      url = await urlOuResolver();
    } else {
      url = urlOuResolver;
    }
    if (!url || pedido !== pedidoDeAudioAtual.current) return;
    if (!elementoAudio.current) {
      elementoAudio.current = new Audio(url);
    } else {
      elementoAudio.current.pause();
      elementoAudio.current.src = url;
    }
    const audio = elementoAudio.current;
    const sincronizarDuracao = () => {
      if (pedido !== pedidoDeAudioAtual.current) return;
      setDuracaoDoAudio(Number.isFinite(audio.duration) && audio.duration > 0 ? audio.duration : null);
    };
    audio.onloadedmetadata = sincronizarDuracao;
    audio.ondurationchange = sincronizarDuracao;
    audio.ontimeupdate = () => {
      if (pedido === pedidoDeAudioAtual.current) setTempoAtualDoAudio(audio.currentTime || 0);
    };
    audio.onended = () => {
      if (pedido !== pedidoDeAudioAtual.current) return;
      setAudioTocandoId(null);
      setTempoAtualDoAudio(0);
    };
    audio.onerror = () => {
      if (pedido !== pedidoDeAudioAtual.current) return;
      setAudioTocandoId(null);
      setTempoAtualDoAudio(0);
      setDuracaoDoAudio(null);
    };
    setTempoAtualDoAudio(0);
    setDuracaoDoAudio(null);
    setAudioSelecionadoId(chave ?? url);
    try {
      await audio.play();
      if (pedido === pedidoDeAudioAtual.current) {
        setAudioTocandoId(chave ?? url);
        analyticsArenaV2.registrar('ouviu_arroto');
      }
      else audio.pause();
    } catch {
      if (pedido === pedidoDeAudioAtual.current) setAudioTocandoId(null);
    }
  };

  const pedirEntrada = useCallback((mensagem: string) => {
    exibirToast(mensagem);
    (aoEntrar ?? (() => setViewAtual('auth')))();
  // exibirToast e aoEntrar só mudam de identidade a cada render; o pedido não depende deles.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aoEntrar]);
  const itensVisiveis = useMemo(
    () => [...itensFeed, ...itensSeguindo, ...topicosDaComunidade, ...entradasDaPauta, ...(postComentariosAtivo ? [postComentariosAtivo] : [])],
    [itensFeed, itensSeguindo, topicosDaComunidade, entradasDaPauta, postComentariosAtivo],
  );
  const { propsDeEngajamento } = useEngajamento({
    forum,
    comunidadePort,
    estaAutenticado,
    aoPedirEntrada: pedirEntrada,
    exibirToast,
    itens: itensVisiveis,
  });

  const [seguindoPerfil, setSeguindoPerfil] = useState(false);
  const [alternandoSeguir, setAlternandoSeguir] = useState(false);

  const alternarSeguirPerfil = async () => {
    if (!perfilAtivo || perfilAtivo.souEu || alternandoSeguir) return;
    setAlternandoSeguir(true);
    try {
      const resultado = await perfilPort.alternarSeguir(perfilAtivo.id);
      if (!resultado.ok) {
        exibirToast('Não foi possível atualizar o follow agora.');
        return;
      }
      setSeguindoPerfil(resultado.seguindo);
      setPerfilAtivo((atual) => atual && {
        ...atual,
        euSigo: resultado.seguindo,
        totalSeguidores: Math.max(0, atual.totalSeguidores + (resultado.seguindo === atual.euSigo ? 0 : resultado.seguindo ? 1 : -1)),
      });
      exibirToast(resultado.seguindo ? 'Agora vocês estão na mesma roda.' : 'Você deixou de seguir este perfil.');
    } catch {
      exibirToast('Não foi possível atualizar o follow agora.');
    } finally {
      setAlternandoSeguir(false);
    }
  };

  const ehModerador = (slug: string) =>
    Boolean(comunidades.find((c) => c.slug === slug)?.possoGerirMidia)
    || (comunidadeAtiva?.slug === slug && Boolean(comunidadeAtiva.possoGerirMidia));

  /** Texto do botão de participação: "Entrar", "Participando" (toque para sair) ou "Moderador" (não sai). */
  const rotuloDaParticipacao = (slug: string) => (ehModerador(slug) ? 'Moderador' : comunidadesEntradas[slug] ? 'Participando' : 'Entrar');
  const propsDaParticipacao = (slug: string) => {
    const nomeDaComunidade = comunidades.find((comunidade) => comunidade.slug === slug)?.nome ?? 'esta comunidade';
    if (ehModerador(slug)) {
      return { disabled: true, title: 'Você modera essa comunidade. Para deixar a moderação, fale com a administração do Auê.', 'aria-label': `Você modera ${nomeDaComunidade}` };
    }
    return comunidadesEntradas[slug]
      ? { title: 'Sair da comunidade', 'aria-label': `Participando de ${nomeDaComunidade}. Tocar para sair.` }
      : { 'aria-label': `Entrar em ${nomeDaComunidade}` };
  };

  const alternarEntrarComunidade = async (slug: string) => {
    if (!estaAutenticado) {
      exibirToast('Entre na sua conta para participar da comunidade.');
      (aoEntrar ?? (() => setViewAtual('auth')))();
      return;
    }
    const jaEntrou = Boolean(comunidadesEntradas[slug]);
    if (jaEntrou && ehModerador(slug)) {
      exibirToast('Você modera essa comunidade, então não dá para sair. Fale com a administração do Auê.');
      return;
    }
    try {
      const atualizado = jaEntrou
        ? await comunidadePort.sairComunidade(slug)
        : await comunidadePort.entrarComunidade(slug);
      if (atualizado === false) {
        exibirToast('Não deu para atualizar sua participação agora.');
        return;
      }
      setComunidadesEntradas((prev) => ({ ...prev, [slug]: !jaEntrou }));
      const delta = jaEntrou ? -1 : 1;
      const ajustar = <T extends { slug: string; membrosTotal: number; souMembro: boolean }>(c: T): T =>
        c.slug === slug ? { ...c, membrosTotal: Math.max(0, c.membrosTotal + delta), souMembro: !jaEntrou } : c;
      setComunidadeAtiva((prev) => (prev ? ajustar(prev) : prev));
      setComunidades((prev) => prev.map(ajustar));
      exibirToast(jaEntrou ? 'Você saiu da comunidade.' : 'Você entrou na comunidade.');
    } catch {
      exibirToast('Não deu para atualizar sua participação agora.');
    }
  };

  const submeterLogin = async (e: FormEvent) => {
    e.preventDefault();
    if (!loginEmail.trim() || !loginSenha) return;
    setAuthEnviando(true);
    setAuthStatus('');
    try {
      const res = await (contaPort as any).entrar?.(loginEmail.trim(), loginSenha);
      if (res?.ok) {
        setAuthStatus('Acesso liberado. Bem-vindo de volta.');
        setEstaAutenticado(true);
        const meu = await perfilPort.obterMeuPerfil();
        if (meu) setMeuPerfil(meu);
        setTimeout(() => {
          setViewAtual('feed');
          const volta = caminhoDeVoltaSeguro(new URLSearchParams(location.search).get('volta'));
          navigate(volta ?? '/feed');
        }, 500);
      } else {
        setAuthStatus('E-mail ou senha incorretos.');
      }
    } catch {
      setAuthStatus('Erro ao tentar entrar.');
    } finally {
      setAuthEnviando(false);
    }
  };

  const submeterRecuperacao = async (e: FormEvent) => {
    e.preventDefault();
    if (!recoverEmail.trim()) return;
    setAuthEnviando(true);
    try {
      await contaPort.enviarLinkDeRedefinicao(recoverEmail.trim());
      setAuthStatus('Link de recuperação enviado.');
    } catch {
      setAuthStatus('Erro ao enviar link.');
    } finally {
      setAuthEnviando(false);
    }
  };

  const mensagemDaConta = (resultado: ResultadoDaConta): string => {
    if (resultado.ok) return resultado.aviso === 'confirmeNoEmail'
      ? 'Confirma seu e-mail para seguir para o perfil.'
      : '';
    const mensagens = {
      emailInvalido: 'Confere esse e-mail e tenta de novo.',
      senhaFraca: 'A senha precisa ter pelo menos 8 caracteres.',
      emailEmUso: 'Esse e-mail já está na roda. Tenta entrar.',
      handleEmUso: 'Esse @ já está em uso. Escolhe outro.',
      handleInvalido: 'O @ usa 3 a 20 letras minúsculas, números ou _.',
      credenciaisInvalidas: 'E-mail ou senha incorretos.',
      identidadeXEmUso: 'Esse X já está em outra conta. Volta para entrar com X.',
      semServidor: 'Não deu para falar com o Auê agora. Tenta mais tarde.',
      falhou: 'Não deu para criar sua conta agora. Tenta de novo.',
    } as const;
    return mensagens[resultado.motivo];
  };

  const submeterCadastro = async (e: FormEvent) => {
    e.preventDefault();
    if (!cadastroApelido.trim() || !cadastroEmail.trim() || !cadastroSenha) return;
    setAuthEnviando(true);
    setAuthStatus('');
    try {
      const resultado = await contaPort.cadastrar({
        apelido: cadastroApelido.trim(),
        handle: cadastroHandle.trim().replace(/^@/, ''),
        email: cadastroEmail.trim(),
        senha: cadastroSenha,
      });
      if (!resultado.ok || resultado.aviso === 'confirmeNoEmail') {
        setAuthStatus(mensagemDaConta(resultado));
        return;
      }
      setEstaAutenticado(true);
      navigate('/perfil?boas-vindas=1');
    } catch {
      setAuthStatus('Não deu para criar sua conta agora. Tenta de novo.');
    } finally {
      setAuthEnviando(false);
    }
  };

  const concluirFichaSocial = async (e: FormEvent) => {
    e.preventDefault();
    setErroDaFicha('');
    setEstadoDaFicha('salvando');
    try {
      const resultado = await perfilPort.concluirMeuPerfilSocial(ficha);
      if (!resultado.ok) {
        setErroDaFicha(
          resultado.motivo === 'handleEmUso' ? 'Esse @ já está em uso. Escolhe outro.'
            : resultado.motivo === 'invalido' ? resultado.detalhe
              : resultado.motivo === 'semConta' ? 'Sua sessão acabou. Entre de novo para continuar.'
                : 'Não deu para salvar sua ficha agora. Tenta de novo.',
        );
        setEstadoDaFicha('pronto');
        return;
      }
      setFichaSocialPendente(false);
      setEstaAutenticado(true);
      setMeuPerfil(resultado.perfil);
      setPerfilAtivo(resultado.perfil);
      setEstadoPerfil('pronto');
      navigate('/perfil');
    } catch {
      setErroDaFicha('Não deu para salvar sua ficha agora. Tenta de novo.');
      setEstadoDaFicha('pronto');
    }
  };

  const paraItensDeResposta = useCallback(async (respostas: readonly RespostaDoForum[]): Promise<readonly ItemComentario[]> => {
    const anexos = forum.listarAnexosDoForum
      ? await forum.listarAnexosDoForum({ respostaIds: respostas.map((resposta) => resposta.id) })
      : null;
    const anexosPorResposta = new Map((anexos?.ok ? anexos.valor : []).map((anexo) => [anexo.alvoId, anexo]));
    const leituraNotas = forum.listarNotasRetrospectivas
      ? await forum.listarNotasRetrospectivas([], respostas.map((resposta) => resposta.id)).catch(() => null)
      : null;
    const notas = new Map((leituraNotas?.ok ? leituraNotas.valor : []).filter((nota) => nota.tipo === 'resposta' && nota.fonte === 'anexo').map((nota) => [nota.id, nota]));

    return Promise.all(respostas.map(async (resposta) => {
      const anexo = anexosPorResposta.get(resposta.id);
      const url = anexo?.caminho && forum.assinarAnexoDoForum
        ? await forum.assinarAnexoDoForum(anexo.caminho).then((resultado) => resultado.ok ? resultado.valor : undefined)
        : anexo?.urlVideo ?? undefined;
      return {
        id: resposta.id,
        autorNome: resposta.autor?.apelido ?? (resposta.autor?.handle ? `@${resposta.autor.handle}` : 'Anônimo'),
        autorHandle: resposta.autor?.handle ?? undefined,
        autorAvatarUrl: resposta.autor?.avatarUrl ?? undefined,
        conteudo: resposta.corpo ?? '',
        criadoEm: resposta.criadoEm,
        paiId: resposta.paiId,
        nivel: resposta.nivel,
        notaRetrospectiva: anexo?.tipo === 'audio' && url ? notas.get(resposta.id)?.nota : undefined,
        notaAvaliadaDepois: notas.get(resposta.id)?.versao === 'retrospectiva-acustica-legado-v1',
        anexo: anexo ? { tipo: anexo.tipo, url, duracaoMs: anexo.duracaoMs } : undefined,
      };
    }));
  }, [forum]);

  const carregarMaisRespostasNaPrevia = useCallback(async (post: ItemDoFeed) => {
    if (post.tipo !== 'topico' || respostasEmExpansao.has(post.id)) return;

    const expandida = conversasExpandidas.has(post.id);
    const cursor = cursoresDasConversas.get(post.id) ?? null;
    if (expandida && cursor === null) return;

    setRespostasEmExpansao((anteriores) => new Set([...anteriores, post.id]));
    try {
      const resultado = await forum.listarRespostasDoTopico(post.id.replace(/^topico-/, ''), {
        limite: 3,
        ...(expandida ? { cursor } : {}),
      });
      if (!resultado.ok) return;

      const proximasRespostas = await paraItensDeResposta(resultado.valor.itens);
      setPreviasDasConversas((anteriores) => {
        const proximas = new Map(anteriores);
        const atuais = expandida ? proximas.get(post.id) ?? [] : [];
        const porId = new Map(atuais.map((comentario) => [comentario.id, comentario]));
        for (const comentario of proximasRespostas) porId.set(comentario.id, comentario);
        proximas.set(post.id, [...porId.values()]);
        return proximas;
      });
      setConversasExpandidas((anteriores) => new Set([...anteriores, post.id]));
      setCursoresDasConversas((anteriores) => new Map(anteriores).set(post.id, resultado.valor.proximo));
    } catch {
      // O feed continua utilizável com a prévia já carregada.
    } finally {
      setRespostasEmExpansao((anteriores) => {
        const proximas = new Set(anteriores);
        proximas.delete(post.id);
        return proximas;
      });
    }
  }, [conversasExpandidas, cursoresDasConversas, forum, paraItensDeResposta, respostasEmExpansao]);

  const abrirComentarios = async (post: ItemDoFeed, respostaInicial?: ItemComentario, forcarAbertura = false) => {
    const responderNoFeed = Boolean(respostaInicial) || Boolean(pautaAberta);

    // Abrir o balão do post preserva a thread; responder alguém abre o
    // compositor por cima do feed, sem trocar a pessoa de contexto.
    if (!forcarAbertura && !responderNoFeed && postComentariosAtivo?.id === post.id) {
      setPostComentariosAtivo(null);
      setModalComentariosAberto(false);
      setComentarioInicialParaResponder(null);
      setListaComentarios([]);
      return;
    }

    setComentarioInicialParaResponder(respostaInicial ?? null);
    setModalComentariosAberto(responderNoFeed);
    setPostComentariosAtivo(post);
    setCarregandoComentarios(true);
    setListaComentarios([]);

    try {
      if (post.tipo === 'topico') {
        const topicoId = post.id.replace('topico-', '');
        const res = await forum.listarRespostasDoTopico?.(topicoId);
        if (res && res.ok) {
          setListaComentarios(await paraItensDeResposta(res.valor.itens));
        }
      } else {
        const causoId = post.id.replace('causo-', '');
        const res = await comunidadePort.listarRespostas?.(causoId);
        if (res) {
          setListaComentarios(
            res.map((r) => ({
              id: r.id,
              autorNome: r.autorNome,
              autorHandle: r.autorHandle,
              conteudo: r.conteudo,
              criadoEm: r.criadoEm,
            })),
          );
        }
      }
    } catch {
      // Mantém lista vazia sem interromper navegação
    } finally {
      setCarregandoComentarios(false);
    }
  };

  const prepararAnexo = async (rascunho: AnexoRascunho | null): Promise<AnexoParaPublicar | null> => {
    if (!rascunho) return null;
    if (rascunho.tipo === 'videoExterno') return { tipo: 'videoExterno', url: rascunho.url };
    if (!forum.enviarAnexoDoForum) throw new Error('Anexos indisponíveis');
    const enviado = await forum.enviarAnexoDoForum(
      rascunho.tipo === 'imagem'
        ? { tipo: 'imagem', arquivo: rascunho.arquivo }
        : { tipo: 'audio', arquivo: rascunho.arquivo, duracaoMs: rascunho.duracaoMs },
    );
    if (!enviado.ok) {
      const mensagem = enviado.motivo === 'precisaEntrar'
        ? 'Entre na sua conta antes de anexar o áudio.'
        : enviado.motivo === 'naoEMembro'
          ? 'Entre nesta comunidade antes de anexar o áudio.'
          : enviado.motivo === 'semConfirmacao'
            ? 'Não deu para confirmar o envio do anexo. Confira a comunidade antes de tentar de novo.'
            : 'O anexo foi recusado e não foi publicado.';
      throw new ErroDePublicacaoDoAnexo(mensagem);
    }
    return enviado.valor;
  };

  const enviarComentario = async (dados: { conteudo: string; paiId: string | null; anexo: AnexoRascunho | null }): Promise<boolean> => {
    if (!postComentariosAtivo || (!dados.conteudo.trim() && !dados.anexo)) return false;
    setEnviandoComentario(true);

    try {
      const meuNome = meuPerfil?.apelido ?? 'Você';
      const meuHandle = meuPerfil?.handle ?? 'arrotador';

      if (postComentariosAtivo.tipo === 'topico') {
        const topicoId = postComentariosAtivo.id.replace('topico-', '');
        const res = await forum.responderTopico?.({
          topicoId,
          corpo: dados.conteudo.trim(),
          paiId: dados.paiId,
          anexo: await prepararAnexo(dados.anexo),
        });
        if (res && !res.ok && res.motivo === 'precisaEntrar') {
          exibirToast('Entre na sua conta para comentar.');
          if (aoEntrar) {
            aoEntrar();
          } else {
            setViewAtual('auth');
          }
          return false;
        }
        if (!res?.ok) {
          exibirToast('Não foi possível publicar a resposta agora.');
          return false;
        }
      } else {
        const causoId = postComentariosAtivo.id.replace('causo-', '');
        await comunidadePort.adicionarResposta?.(
          causoId,
          dados.conteudo.trim(),
          meuNome,
          meuHandle,
        );
      }

      const notaDoAudio = dados.anexo?.tipo === 'audio'
        ? await calcularNotaLocalDoAudio(dados.anexo.arquivo)
        : undefined;

      const novoComentario: ItemComentario = {
        id: `comentario-${Date.now()}`,
        autorNome: meuNome,
        autorHandle: meuHandle,
        conteudo: dados.conteudo.trim(),
        criadoEm: new Date().toISOString(),
        paiId: dados.paiId,
        nivel: dados.paiId
          ? Math.min((listaComentarios.find((comentario) => comentario.id === dados.paiId)?.nivel ?? 0) + 1, 2) as 0 | 1 | 2
          : 0,
        ...(notaDoAudio !== undefined ? { notaRetrospectiva: notaDoAudio } : {}),
        anexo: dados.anexo
          ? {
              tipo: dados.anexo.tipo,
              url: dados.anexo.tipo === 'videoExterno' ? dados.anexo.url : URL.createObjectURL(dados.anexo.arquivo),
              duracaoMs: dados.anexo.tipo === 'audio' ? dados.anexo.duracaoMs : undefined,
            }
          : undefined,
      };

      setListaComentarios((prev) => [...prev, novoComentario]);
      setPreviasDasConversas((anteriores) => {
        const proximas = new Map(anteriores);
        const existentes = proximas.get(postComentariosAtivo.id) ?? [];
        proximas.set(
          postComentariosAtivo.id,
          existentes.some((comentario) => comentario.id === novoComentario.id)
            ? existentes
            : [...existentes, novoComentario],
        );
        return proximas;
      });
      setConversasExpandidas((anteriores) => new Set([...anteriores, postComentariosAtivo.id]));

      const incrementar = (itens: readonly ItemDoFeed[]) =>
        itens.map((it) =>
          it.id === postComentariosAtivo.id
            ? { ...it, respostasTotal: it.respostasTotal + 1 }
            : it,
        );

      setItensFeed(incrementar);
      setTopicosDaComunidade(incrementar);
      setEntradasDaPauta(incrementar);
      exibirToast(dados.anexo?.tipo === 'audio' && postComentariosAtivo.tipo === 'topico'
        ? 'Comentário publicado! O áudio será analisado; a nota pode demorar alguns minutos.'
        : 'Comentário publicado na roda!');
      return true;
    } catch (erro) {
      exibirToast(erro instanceof ErroDePublicacaoDoAnexo ? erro.message : 'Não foi possível enviar o comentário agora.');
      return false;
    } finally {
      setEnviandoComentario(false);
    }
  };

  const propsDeComentariosDoPost = (post: ItemDoFeed) => ({
    threadAberta: postComentariosAtivo?.id === post.id,
    comentarios: postComentariosAtivo?.id === post.id ? listaComentarios : [],
    carregandoComentarios: postComentariosAtivo?.id === post.id && carregandoComentarios,
    enviandoComentario,
    criarGravacao: forum.criarGravacaoLivreDoForum,
    aoEnviarComentario: enviarComentario,
  });

  const publicarPost = async (
    dados: { titulo?: string; corpo: string; comunidadeSlug?: string; anexo: AnexoRascunho | null },
    destino: 'pessoal' | 'comunidade' = destinoDoCompositor,
    notaPrecalculada?: number | null,
    arrotoEspelhadoId?: string,
  ): Promise<boolean> => {
    const meuNome = meuPerfil?.apelido ?? 'Você';
    const meuHandle = meuPerfil?.handle;
    let postCriadoId = `topico-${Date.now()}`;
    const ePostPessoal = destino === 'pessoal';

    try {
      const anexo = await prepararAnexo(dados.anexo);
      const resForum = ePostPessoal
        ? await forum.criarPublicacaoPessoal?.({ corpo: dados.corpo, anexo, ...(arrotoEspelhadoId ? { arrotoEspelhadoId } : {}) })
        : await forum.criarTopico?.({ comunidadeSlug: dados.comunidadeSlug ?? '', titulo: dados.titulo ?? '', corpo: dados.corpo, anexo });
      if (resForum && resForum.ok) {
        postCriadoId = `topico-${resForum.valor.id}`;
      } else {
        const motivo = resForum && !resForum.ok ? resForum.motivo : null;
        exibirToast(
          motivo === 'naoEMembro' && !ePostPessoal
            ? 'Entre nesta comunidade antes de publicar.'
            : motivo === 'precisaEntrar'
              ? 'Entre com sua conta para publicar.'
              : motivo === 'limiteDeFrequencia'
                ? 'Muita coisa de uma vez. Tenta daqui a pouco.'
                : motivo === 'topicoFechado' || motivo === 'comunidadeInexistente'
                  ? 'Essa comunidade não está aceitando posts agora.'
                  : 'Não foi possível publicar agora. Tenta de novo.',
        );
        return false;
      }
    } catch (erro) {
      exibirToast(erro instanceof ErroDePublicacaoDoAnexo ? erro.message : 'Não foi possível publicar agora.');
      return false;
    }

    const notaDoAudio = notaPrecalculada ?? (
      dados.anexo?.tipo === 'audio' ? await calcularNotaLocalDoAudio(dados.anexo.arquivo) : undefined
    );

    exibirToast(desafioAlvo
      ? `Desafio enviado para @${desafioAlvo.handle}!`
      : dados.anexo?.tipo === 'audio'
        ? 'Publicado! O áudio será analisado; a nota pode demorar alguns minutos.'
        : ePostPessoal ? 'Publicado no seu perfil e no feed.' : 'Publicado com sucesso.');

    if (desafioAlvo && dados.anexo?.tipo === 'audio' && arrotosPort.prepararArroto && arrotosPort.publicarArroto) {
      const audioDoDesafio = dados.anexo;
      const handleDoDesafiado = desafioAlvo.handle;
      void arrotosPort.prepararArroto(handleDoDesafiado)
        .then((preparo) => (preparo.ok
          ? arrotosPort.publicarArroto(preparo.rascunho, audioDoDesafio.arquivo, audioDoDesafio.duracaoMs / 1000)
          : null))
        .catch(() => {});
    }
    setDesafioAlvo(null);

    const novoItem: ItemDoFeed = {
      id: postCriadoId,
      tipo: 'topico',
      origem: ePostPessoal ? 'pessoal' : 'comunidade',
      comunidadeSlug: ePostPessoal ? '' : dados.comunidadeSlug ?? '',
      comunidadeAvatarUrl: ePostPessoal ? undefined : fonteDoAvatarDaComunidade(comunidades.find((comunidade) => comunidade.slug === dados.comunidadeSlug)),
      titulo: dados.titulo ?? (dados.corpo || (ePostPessoal && dados.anexo ? '' : dados.anexo?.tipo === 'imagem' ? 'Imagem na comunidade' : dados.anexo?.tipo === 'audio' ? 'Áudio na comunidade' : 'Vídeo na comunidade')),
      corpo: dados.corpo,
      autorNome: meuNome,
      autorHandle: meuHandle,
      criadoEm: new Date().toISOString(),
      respostasTotal: 0,
      temAudio: dados.anexo?.tipo === 'audio',
      ...(notaDoAudio !== undefined && notaDoAudio !== null ? { nota: notaDoAudio } : {}),
      anexo: dados.anexo
        ? {
            tipo: dados.anexo.tipo,
            url: dados.anexo.tipo === 'videoExterno' ? dados.anexo.url : URL.createObjectURL(dados.anexo.arquivo),
            duracaoMs: dados.anexo.tipo === 'audio' ? dados.anexo.duracaoMs : undefined,
          }
        : undefined,
    };

    setItensFeed((prev) => [novoItem, ...prev]);
    if (ePostPessoal) {
      setPublicacoesPessoaisDoPerfil((prev) => [novoItem, ...prev]);
    } else {
      setTopicosDaComunidade((prev) => [novoItem, ...prev]);
    }
    return true;
  };

  const salvarEdicaoPerfil = async (dados: {
    apelido: string;
    handle: string;
    bio: string;
    cidade: string;
    instagram: string;
    tiktok: string;
    youtube: string;
    twitter: string;
  }) => {
    const resultado = await perfilPort.atualizarMeuPerfil(dados);
    if (!resultado.ok) {
      const mensagem = resultado.motivo === 'handleEmUso'
        ? 'Esse @ já está ocupado.'
        : resultado.motivo === 'invalido'
          ? resultado.detalhe
          : 'Não foi possível salvar seu perfil agora.';
      throw new Error(mensagem);
    }
    setMeuPerfil(resultado.perfil);
    setPerfilAtivo(resultado.perfil);
    exibirToast('Perfil atualizado.');
  };

  const mensagemDoErroDeImagem = (motivo: string, tipo: TipoDeImagemAjustavel) => {
    if (motivo === 'formatoInvalido') return 'Use JPG, PNG ou WebP.';
    if (motivo === 'grandeDemais') return 'Essa imagem passa do limite de 10 MB.';
    if (motivo === 'dimensoesInsuficientes') return tipo === 'capa'
      ? 'A capa precisa ter pelo menos 1200 × 400 pixels.'
      : 'A foto precisa ter pelo menos 320 × 320 pixels.';
    if (motivo === 'dimensoesExcedidas') return 'Essa imagem passa do limite de 24 megapixels.';
    return 'Não consegui abrir essa imagem. Tenta outro arquivo.';
  };

  const abrirAjusteDeImagem = async (
    arquivo: File | undefined,
    tipo: TipoDeImagemAjustavel,
    alvo: 'perfil' | 'comunidade' = 'perfil',
  ) => {
    if (!arquivo || fotoEnviando || capaEnviando) return;
    const antigo = ajusteDeImagem;
    setAjusteDeImagem({ arquivo, tipo, alvo, previewUrl: criarUrlDePreviewDeImagem(arquivo) });
    if (antigo) revokeUrlDePreviewDeImagem(antigo.previewUrl);
    setEstadoDoAjusteDeImagem('preparando');
    setErroDoAjusteDeImagem(null);
    setRecorteDaImagem({ centroX: 0.5, centroY: 0.5, zoom: 1 });

    const preparada = await prepararImagemDePerfil(arquivo, tipo === 'capa' ? 'capa' : 'avatar');
    if (!preparada.ok) {
      setEstadoDoAjusteDeImagem('erro');
      setErroDoAjusteDeImagem(mensagemDoErroDeImagem(preparada.motivo, tipo));
      return;
    }
    setEstadoDoAjusteDeImagem('pronto');
  };

  const fecharAjusteDeImagem = () => {
    if (estadoDoAjusteDeImagem === 'enviando') return;
    if (ajusteDeImagem) revokeUrlDePreviewDeImagem(ajusteDeImagem.previewUrl);
    setAjusteDeImagem(null);
    setErroDoAjusteDeImagem(null);
    if (inputDaFoto.current) inputDaFoto.current.value = '';
    if (inputDaCapa.current) inputDaCapa.current.value = '';
  };

  const trocarFotoDoPerfil = async (arquivo: Blob): Promise<{ readonly ok: boolean; readonly mensagem?: string }> => {
    if (fotoEnviando) return { ok: false, mensagem: 'A foto já está sendo enviada.' };
    setFotoEnviando(true);
    try {
      const resultado = await perfilPort.enviarFoto(arquivo);
      if (!resultado.ok) {
        const mensagem = resultado.motivo === 'formatoInvalido'
          ? 'Use JPG, PNG ou WebP para a foto.'
          : resultado.motivo === 'grandeDemais'
            ? 'A foto não coube no limite de envio.'
            : resultado.motivo === 'semConta'
              ? 'Entre com sua conta e conclua o perfil para ter foto.'
              : 'Não foi possível trocar a foto agora.';
        exibirToast(mensagem);
        return { ok: false, mensagem };
      }
      setMeuPerfil(resultado.perfil);
      setPerfilAtivo(resultado.perfil);
      exibirToast('Foto atualizada.');
      return { ok: true };
    } catch {
      const mensagem = 'O servidor recusou o envio da foto. Não foi possível trocar a foto agora.';
      exibirToast(mensagem);
      return { ok: false, mensagem };
    } finally {
      setFotoEnviando(false);
    }
  };

  const removerFotoDoPerfil = async () => {
    if (fotoEnviando) return;
    setFotoEnviando(true);
    try {
      const resultado = await perfilPort.removerFoto();
      if (!resultado.ok) {
        exibirToast('Não foi possível remover a foto agora.');
        return;
      }
      setMeuPerfil(resultado.perfil);
      setPerfilAtivo(resultado.perfil);
      exibirToast('Foto removida.');
    } catch {
      exibirToast('Não foi possível remover a foto agora.');
    } finally {
      setFotoEnviando(false);
    }
  };

  const trocarCapaDoPerfil = async (arquivo: Blob): Promise<{ readonly ok: boolean; readonly mensagem?: string }> => {
    if (capaEnviando) return { ok: false, mensagem: 'A capa já está sendo enviada.' };
    setCapaEnviando(true);
    try {
      const resultado = await perfilPort.enviarCapa(arquivo);
      if (!resultado.ok) {
        const mensagem = resultado.motivo === 'formatoInvalido'
          ? 'Use JPG, PNG ou WebP para a capa.'
          : resultado.motivo === 'grandeDemais'
            ? 'A capa não coube no limite de envio.'
            : 'Não foi possível trocar a capa agora.';
        exibirToast(mensagem);
        return { ok: false, mensagem };
      }
      setMeuPerfil(resultado.perfil);
      setPerfilAtivo(resultado.perfil);
      exibirToast('Capa atualizada.');
      return { ok: true };
    } catch {
      const mensagem = 'O servidor recusou o envio da capa. Não foi possível trocar a capa agora.';
      exibirToast(mensagem);
      return { ok: false, mensagem };
    } finally {
      setCapaEnviando(false);
    }
  };

  const salvarAjusteDeImagem = async () => {
    if (!ajusteDeImagem || estadoDoAjusteDeImagem !== 'pronto') return;
    const destino = ajusteDeImagem.tipo === 'capa' ? 'capa' : 'avatar';
    setEstadoDoAjusteDeImagem('enviando');
    setErroDoAjusteDeImagem(null);
    const preparada = await prepararImagemDePerfil(ajusteDeImagem.arquivo, destino, {
      ...recorteDaImagem,
    });
    if (!preparada.ok) {
      setEstadoDoAjusteDeImagem('erro');
      setErroDoAjusteDeImagem(mensagemDoErroDeImagem(preparada.motivo, ajusteDeImagem.tipo));
      return;
    }
    if (ajusteDeImagem.alvo === 'comunidade') {
      const comunidade = comunidadeAtiva;
      const definirMidia = forum.definirMidiaDaComunidade;
      if (!comunidade || !definirMidia) {
        setEstadoDoAjusteDeImagem('erro');
        setErroDoAjusteDeImagem('Não consegui salvar essa imagem na comunidade agora.');
        return;
      }
      const tipoDaMidia: TipoDeMidiaDaComunidade = ajusteDeImagem.tipo === 'capa' ? 'capa' : 'avatar';
      setMidiaDaComunidadeEnviando(tipoDaMidia);
      try {
        const resultado = await definirMidia({ comunidadeSlug: comunidade.slug, tipo: tipoDaMidia, arquivo: preparada.imagem });
        if (!resultado.ok) {
          setEstadoDoAjusteDeImagem('erro');
          setErroDoAjusteDeImagem(resultado.motivo === 'naoEAutor'
            ? 'Só a administração pode trocar a imagem da comunidade.'
            : 'Não consegui salvar essa imagem na comunidade agora.');
          return;
        }
        setComunidadeAtiva(resultado.valor);
        fecharAjusteDeImagem();
        exibirToast(ajusteDeImagem.tipo === 'capa' ? 'Capa da comunidade atualizada.' : 'Foto da comunidade atualizada.');
      } catch {
        setEstadoDoAjusteDeImagem('erro');
        setErroDoAjusteDeImagem('Não consegui salvar essa imagem na comunidade agora.');
      } finally {
        setMidiaDaComunidadeEnviando(null);
      }
      return;
    }

    const atualizado = await (ajusteDeImagem.tipo === 'capa' ? trocarCapaDoPerfil(preparada.imagem) : trocarFotoDoPerfil(preparada.imagem));
    if (atualizado.ok) fecharAjusteDeImagem();
    else {
      setEstadoDoAjusteDeImagem('erro');
      setErroDoAjusteDeImagem(atualizado.mensagem ?? 'Não foi possível salvar essa imagem agora.');
    }
  };

  const removerCapaDoPerfil = async () => {
    if (capaEnviando) return;
    setCapaEnviando(true);
    try {
      const resultado = await perfilPort.removerCapa();
      if (!resultado.ok) {
        exibirToast('Não foi possível remover a capa agora.');
        return;
      }
      setMeuPerfil(resultado.perfil);
      setPerfilAtivo(resultado.perfil);
      exibirToast('Capa removida.');
    } catch {
      exibirToast('Não foi possível remover a capa agora.');
    } finally {
      setCapaEnviando(false);
    }
  };

  // ---- Denunciar e apagar post ------------------------------------------------
  const [acaoDoPost, setAcaoDoPost] = useState<{ tipo: 'denunciar' | 'apagar'; post: ItemDoFeed } | null>(null);
  const [acaoEnviando, setAcaoEnviando] = useState(false);
  const [erroDaAcao, setErroDaAcao] = useState<string | null>(null);

  const souAutorDe = (post: ItemDoFeed) =>
    Boolean(meuPerfil?.handle && post.autorHandle && meuPerfil.handle.toLowerCase() === post.autorHandle.toLowerCase());

  const abrirDesafio = (alvo: DesafioAlvoDoCompositor) => {
    setDesafioAlvo(alvo);
    setDestinoDoCompositor('pessoal');
    setModalCompositorAberto(true);
  };

  const propsDeDesafio = (post: ItemDoFeed) =>
    post.autorHandle && !souAutorDe(post)
      ? {
          aoDesafiar: () =>
            abrirDesafio({
              handle: post.autorHandle!,
              nome: post.autorNome,
              ...(post.nota !== undefined && post.nota !== null ? { notaAlvo: post.nota } : {}),
            }),
        }
      : {};

  /** Só oferece o que a pessoa pode fazer: apagar o próprio, denunciar o dos outros. Visitante é levado a entrar. */
  const propsDeModeracao = (post: ItemDoFeed) =>
    souAutorDe(post)
      ? { aoApagar: () => { setErroDaAcao(null); setAcaoDoPost({ tipo: 'apagar', post }); } }
      : {
          aoDenunciar: () => {
            if (!estaAutenticado) {
              exibirToast('Entre na sua conta para denunciar.');
              (aoEntrar ?? (() => setViewAtual('auth')))();
              return;
            }
            setErroDaAcao(null);
            setAcaoDoPost({ tipo: 'denunciar', post });
          },
        };

  const retirarPostDaTela = (post: ItemDoFeed) => {
    const sai = (p: ItemDoFeed) => p.id !== post.id;
    setItensFeed((prev) => prev.filter(sai));
    setItensSeguindo((prev) => prev.filter(sai));
    setTopicosDaComunidade((prev) => prev.filter(sai));
    setTopicosDaComunidadeDoPerfil((prev) => prev.filter(sai));
    setEntradasDaPauta((prev) => prev.filter(sai));
    if (postComentariosAtivo?.id === post.id) {
      setPostComentariosAtivo(null);
      setListaComentarios([]);
      if (topicoIdParam) navigate(`/c/${post.comunidadeSlug}`);
    }
  };

  const confirmarAcaoDoPost = async (dados: { motivo: string; apagarAudio: boolean }) => {
    if (!acaoDoPost || acaoEnviando) return;
    const { tipo, post } = acaoDoPost;
    const id = post.id.replace(/^(topico|causo)-/, '');
    setAcaoEnviando(true);
    setErroDaAcao(null);
    try {
      let ok = false;
      let mensagem = tipo === 'denunciar' ? 'Não deu para enviar a denúncia agora. Tenta de novo.' : 'Não deu para apagar agora. Nada foi apagado.';
      if (post.tipo === 'topico') {
        const r = tipo === 'denunciar' ? await forum.denunciarTopico(id, dados.motivo) : await forum.apagarTopico(id);
        ok = r.ok;
        if (!r.ok) mensagem = erroDeEnvio(r.motivo, tipo === 'denunciar' ? 'denuncia' : 'apagar').texto;
      } else {
        ok = tipo === 'denunciar'
          ? await comunidadePort.denunciarCauso(id, dados.motivo)
          : await comunidadePort.apagarCauso(id, { apagarAudio: dados.apagarAudio });
      }
      if (!ok) {
        setErroDaAcao(mensagem);
        return;
      }
      setAcaoDoPost(null);
      if (tipo === 'apagar') retirarPostDaTela(post);
      exibirToast(tipo === 'denunciar' ? 'Denúncia enviada. Obrigado por avisar.' : 'Post apagado.');
    } catch {
      setErroDaAcao(tipo === 'denunciar' ? 'Não deu para enviar a denúncia agora. Tenta de novo.' : 'Não deu para apagar agora. Nada foi apagado.');
    } finally {
      setAcaoEnviando(false);
    }
  };

  const [conexoesAbertas, setConexoesAbertas] = useState<{ tipo: 'seguidores' | 'seguindo'; estado: EstadoDasConexoes; lista: readonly Conexao[] } | null>(null);
  const abrirConexoes = async (tipo: 'seguidores' | 'seguindo') => {
    const handle = (perfilAtivo ?? meuPerfil)?.handle;
    if (!handle) return;
    setConexoesAbertas({ tipo, estado: 'carregando', lista: [] });
    try {
      const lista = await perfilPort.listarConexoes(handle, tipo);
      setConexoesAbertas((atual) => (atual?.tipo === tipo ? { tipo, estado: 'pronto', lista } : atual));
    } catch {
      setConexoesAbertas((atual) => (atual?.tipo === tipo ? { tipo, estado: 'erro', lista: [] } : atual));
    }
  };

  const compartilharPerfil = async () => {
    if (!navigator.clipboard?.writeText) {
      exibirToast('Seu navegador não liberou a cópia do link.');
      return;
    }
    // O link é o público (/u/:handle). `/perfil` é "meu perfil": quem recebesse veria o próprio.
    const handle = (perfilAtivo ?? meuPerfil)?.handle;
    const link = handle ? `${window.location.origin}/u/${encodeURIComponent(handle)}` : window.location.href;
    try {
      await navigator.clipboard.writeText(link);
      exibirToast('Link copiado.');
    } catch {
      exibirToast('Não foi possível copiar o link agora.');
    }
  };

  const abrirGravacaoDireta = (opcoes?: {
    readonly destinoFixo?: 'perfil-proprio';
    readonly publicarNoFeed?: boolean;
    readonly iniciarImediatamente?: boolean;
    readonly compacto?: boolean;
  }) => {
    if (!estaAutenticado) {
      (aoEntrar ?? (() => setViewAtual('auth')))();
      return;
    }
    setAudioDireto(null);
    setErroDaGravacaoDireta(null);
    setEstadoGravacaoDireta('ocioso');
    setDestinoFixoDaGravacao(opcoes?.destinoFixo ?? null);
    setPublicarArrotoDiretoNoFeed(Boolean(opcoes?.publicarNoFeed));
    setGravacaoDiretaCompacta(Boolean(opcoes?.compacto ?? opcoes?.publicarNoFeed));
    setModalGravarArrotoAberto(true);
    if (opcoes?.iniciarImediatamente) void iniciarGravacaoDireta();
  };

  const fecharGravacaoDireta = () => {
    capturaDoArroto.soltar();
    setModalGravarArrotoAberto(false);
    setEstadoGravacaoDireta('ocioso');
    setAudioDireto(null);
    setErroDaGravacaoDireta(null);
    setDestinoFixoDaGravacao(null);
    setPublicarArrotoDiretoNoFeed(false);
    setGravacaoDiretaCompacta(false);
  };

  async function iniciarGravacaoDireta() {
    setErroDaGravacaoDireta(null);
    setEstadoGravacaoDireta('solicitando');
    const permissao = await capturaDoArroto.pedir();
    if (!permissao.ok) {
      capturaDoArroto.soltar();
      setEstadoGravacaoDireta('erro');
      setErroDaGravacaoDireta(
        permissao.motivo === 'negado'
          ? 'O microfone foi bloqueado. Libere o acesso no navegador e tente de novo.'
          : permissao.motivo === 'semAparelho'
            ? 'Não achei um microfone disponível neste aparelho.'
            : 'Não deu para abrir o microfone agora.',
      );
      return;
    }
    if (!capturaDoArroto.comecar()) {
      capturaDoArroto.soltar();
      setEstadoGravacaoDireta('erro');
      setErroDaGravacaoDireta('Não deu para começar a gravar agora.');
      return;
    }
    setEstadoGravacaoDireta('gravando');
  }

  const pararGravacaoDireta = async () => {
    const resultado = await capturaDoArroto.parar();
    if ('motivo' in resultado) {
      setEstadoGravacaoDireta('erro');
      setErroDaGravacaoDireta('A gravação não saiu inteira. Tente de novo.');
      return;
    }
    setAudioDireto({ dados: resultado.dados, duracaoMs: resultado.duracaoMs, origem: 'gravacao' });
    setEstadoGravacaoDireta('pronto');
  };

  const escolherArquivoDeArroto = async (arquivo: File) => {
    setErroDaGravacaoDireta(null);
    const preparado = await arrotosPort.prepararArquivoDeAudio(arquivo);
    if (!preparado.ok) {
      throw new Error(
        preparado.motivo === 'formatoInvalido'
          ? 'Use MP3, M4A, OGG ou WebM.'
          : preparado.motivo === 'grandeDemais'
            ? 'Esse áudio passou de 12 MB.'
            : preparado.motivo === 'duracaoInvalida'
              ? 'O arquivo precisa ter até 30 segundos.'
              : 'Não consegui ler a duração desse áudio. Tenta outro arquivo.',
      );
    }
    setAudioDireto({ ...preparado.audio, origem: 'arquivo' });
    setEstadoGravacaoDireta('pronto');
  };

  const publicarAudioNoPerfil = async (audio: AudioDiretoPronto, destino: Exclude<DestinoDoArrotoDireto, { readonly tipo: 'comunidade' }>) => {
    const preparo = destino.tipo === 'perfil-marcado'
      ? await arrotosPort.prepararArroto(destino.handle)
      : await arrotosPort.prepararArroto();
    if (!preparo.ok) {
      throw new Error(
        preparo.motivo === 'destinoInexistente'
          ? 'Esse @ não foi encontrado.'
          : preparo.motivo === 'semConta'
            ? 'Entre na sua conta antes de enviar um arroto.'
            : 'Não deu para preparar o envio agora.',
      );
    }
    const publicado = await arrotosPort.publicarArroto(
      preparo.rascunho,
      audio.dados,
      audio.duracaoMs / 1000,
    );
    if (!publicado.ok) {
      const mensagem = publicado.motivo === 'formatoInvalido'
        ? 'Esse formato de áudio não entra aqui.'
        : publicado.motivo === 'grandeDemais'
          ? 'Esse áudio passou de 12 MB.'
          : publicado.motivo === 'duracaoInvalida'
            ? 'A gravação precisa ter até 90 segundos.'
            : 'Não foi possível enviar. Seu arroto não foi publicado.';
      throw new Error(mensagem);
    }
    const notaDoAudio = await calcularNotaLocalDoAudio(audio.dados);
    if (notaDoAudio !== undefined) {
      setNotasDosArrotos((atuais) => new Map(atuais).set(publicado.arroto.id, { nota: notaDoAudio, retrospectiva: false }));
    }
    setArrotosDoPerfil((anteriores) => (
      perfilExibido?.id === publicado.arroto.perfilId ? [publicado.arroto, ...anteriores] : anteriores
    ));
    setRevisaoDasNotas((atual) => atual + 1);
    return { publicado: publicado.arroto, preparo: preparo.rascunho, nota: notaDoAudio ?? null };
  };

  const enviarArrotoDireto = async (destino: DestinoDoArrotoDireto) => {
    if (!audioDireto) throw new Error('Grave o arroto antes de enviar.');
    if (destino.tipo === 'comunidade') {
      throw new Error('Publicação em comunidade ainda não está pronta para áudio direto.');
    }
    setEnviandoArrotoDireto(true);
    try {
      if (publicarArrotoDiretoNoFeed && destino.tipo === 'perfil-proprio') {
        const noPerfil = await publicarAudioNoPerfil(audioDireto, destino);
        const publicadoNoFeed = await publicarPost(
          {
            corpo: '',
            anexo: {
              tipo: 'audio',
              arquivo: audioDireto.dados,
              duracaoMs: audioDireto.duracaoMs,
            },
          },
          'pessoal',
          noPerfil.nota,
          noPerfil.publicado.id,
        );
        if (publicadoNoFeed) {
          fecharGravacaoDireta();
          setViewAtual('feed');
          navigate('/feed');
        } else {
          fecharGravacaoDireta();
          exibirToast('O arroto ficou no perfil, mas não entrou no feed. A nota será analisada.');
        }
        return;
      }
      const { preparo } = await publicarAudioNoPerfil(audioDireto, destino);
      exibirToast(
        destino.tipo === 'perfil-marcado'
          ? `Arroto enviado para @${preparo.perfilDestinoHandle}. A nota será analisada.`
          : 'Arroto guardado no seu perfil. A nota pode demorar alguns minutos.',
      );
      fecharGravacaoDireta();
      if (destino.tipo === 'perfil-marcado') {
        navigate(`/u/${preparo.perfilDestinoHandle}`);
      }
    } finally {
      setEnviandoArrotoDireto(false);
    }
  };

  const postsSeguindo = itensSeguindo
    .filter((p) => {
      if (!busca.trim()) return true;
      const termo = busca.toLowerCase();
      return p.titulo.toLowerCase().includes(termo) || p.comunidadeSlug.toLowerCase().includes(termo);
    })
    .sort((a, b) => new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime());

  const perfilExibido = perfilAtivo ?? meuPerfil;
  const notasExibidas = resumoDasNotas.perfilId === perfilExibido?.id ? resumoDasNotas : null;
  const estadoDosArrotosExibidos = handleDosArrotos === perfilExibido?.handle ? estadoArrotosDoPerfil : 'carregando';
  const donoDoPerfil = Boolean(perfilExibido?.souEu);
  const postsDoPerfil = useMemo(
    () => [...topicosDaComunidadeDoPerfil, ...publicacoesPessoaisDoPerfil]
      .sort((a, b) => new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime()),
    [publicacoesPessoaisDoPerfil, topicosDaComunidadeDoPerfil],
  );
  const iniciaisDoPerfil = perfilExibido?.apelido
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0]?.toUpperCase())
    .join('') ?? '';

  const haDialogoAberto = modalCompositorAberto
    || modalGravarArrotoAberto
    || modalComentariosAberto
    || modalPerfilAberto
    || modalGerirComunidadeAberto
    || modalInstitucionalAberto
    || Boolean(ajusteDeImagem)
    || Boolean(acaoDoPost)
    || conexoesAbertas !== null;

  // Toda superfície modal da casca passa pelo mesmo bloqueio. Sem isso cada
  // diálogo parece fechado, mas o feed continua andando por trás no celular.
  useEffect(() => {
    if (!haDialogoAberto) return;
    return controleDeDialogo.bloquearRolagemDoDocumento();
  }, [controleDeDialogo, haDialogoAberto]);

  useEffect(() => {
    if (new URLSearchParams(location.search).get('gravar') !== '1') return;

    navigate('/feed', { replace: true });
    if (!estaAutenticado) {
      (aoEntrar ?? (() => setViewAtual('auth')))();
      return;
    }
    setAudioDireto(null);
    setErroDaGravacaoDireta(null);
    setEstadoGravacaoDireta('ocioso');
    setDestinoFixoDaGravacao('perfil-proprio');
    setPublicarArrotoDiretoNoFeed(true);
    setModalGravarArrotoAberto(true);
  }, [aoEntrar, estaAutenticado, location.search, navigate]);

  return (
    <div className={`app${viewAtual === 'auth' ? ' app--auth' : ''}${viewAtual === 'comunidades' ? ' app--diretorio' : ''}${viewAtual === 'feed' ? ' app--mural' : ''}${viewAtual === 'perfil' ? ' app--perfil-arena' : ''}`}>
      {viewAtual !== 'auth' && <BarraLateral
        viewAtual={viewAtual}
        estaAutenticado={estaAutenticado}
        aoMudarView={(v, s) => {
          setViewAtual(v);
          if (s) setComunidadeSlug(s);
        }}
        aoAbrirGravadorRapido={() => {
          if (viewAtual === 'feed' && slotArena && aoFocarArena) {
            aoFocarArena();
            return;
          }
          abrirGravacaoDireta({
            destinoFixo: 'perfil-proprio',
            publicarNoFeed: true,
            iniciarImediatamente: true,
          });
        }}
        aoSair={async () => {
          await contaPort.sair();
          setEstaAutenticado(false);
          setMeuPerfil(null);
          navigate('/');
        }}
        aoEntrar={aoEntrar ?? (() => setViewAtual('auth'))}
      />}

      <main className={viewAtual === 'auth' ? 'auth-main' : undefined}>
        {viewAtual !== 'auth' && <BarraSuperior
          busca={busca}
          estaAutenticado={estaAutenticado}
          meuPerfil={meuPerfil}
          aoBuscar={setBusca}
          aoEntrar={aoEntrar ?? (() => setViewAtual('auth'))}
          notificacoesDeMencao={notificacoesDeMencao}
          aoAbrirNotificacoes={() => {
            const ids = notificacoesDeMencao.filter((notificacao) => notificacao.lidaEm === null).map((notificacao) => notificacao.id);
            if (ids.length === 0 || !forum.marcarNotificacoesDeMencaoComoLidas) return;
            void forum.marcarNotificacoesDeMencaoComoLidas(ids).then((resultado) => {
              if (!resultado.ok) return;
              setNotificacoesDeMencao((anteriores) => anteriores.map((notificacao) => ids.includes(notificacao.id)
                ? { ...notificacao, lidaEm: new Date().toISOString() }
                : notificacao));
            });
          }}
        />}

        {/* ==================== VIEW: THREAD DE COMENTÁRIOS (PADRÃO TWITTER / FORA DO CARD) ==================== */}
        {topicoIdParam && (estadoDaPauta === 'carregando' || estadoDaPauta === 'erro' || pautaAberta) ? (
          <PautaAbertaDaComunidade
            titulo={pautaAberta?.pauta.titulo ?? 'Tópico'}
            descricao={pautaAberta?.pauta.corpo}
            carregando={estadoDaPauta === 'carregando'}
            erro={estadoDaPauta === 'erro'}
            aoVoltar={() => {
              setPautaAberta(null);
              setEntradasDaPauta([]);
              setEstadoDaPauta('ocioso');
              navigate('/');
            }}
            entradas={entradasDaPauta.map((post) => (
              <div key={post.id} id={pautaAberta?.entradaEmFocoId === post.id.replace('topico-', '') ? 'entrada-em-foco' : undefined}>
                <CardDoPost
                  post={post}
                  {...propsDeEngajamento(post)}
                  {...propsDeModeracao(post)}
                  {...propsDeDesafio(post)}
                  audioTocando={audioTocandoId === post.id}
                  tempoAtualDoAudio={audioSelecionadoId === post.id ? tempoAtualDoAudio : 0}
                  duracaoDoAudio={audioSelecionadoId === post.id ? duracaoDoAudio : null}
                  aoTocarAudio={(fonte) => void alternarAudio(fonte, post.id)}
                  aoAbrirComentarios={() => void abrirComentarios(post)}
                  {...propsDeComentariosDoPost(post)}
                />
                <PreviaDaConversa
                  post={post}
                  comentarios={previasDasConversas.get(post.id) ?? []}
                  carregando={previasEmCarregamento.has(post.id)}
                  expandida={conversasExpandidas.has(post.id)}
                  carregandoMais={respostasEmExpansao.has(post.id)}
                  temMais={conversasExpandidas.has(post.id) ? cursoresDasConversas.get(post.id) !== null : (previasDasConversas.get(post.id)?.length ?? 0) < post.respostasTotal}
                  aoCarregarMais={() => void carregarMaisRespostasNaPrevia(post)}
                  aoResponder={(comentario) => void abrirComentarios(post, comentario)}
                />
              </div>
            ))}
          />
        ) : postComentariosAtivo && !modalComentariosAberto ? (
          <ThreadDeComentarios
            post={postComentariosAtivo}
            comentarios={listaComentarios}
            carregando={carregandoComentarios}
            enviando={enviandoComentario}
            criarGravacao={forum.criarGravacaoLivreDoForum}
            comentarioInicialParaResponder={comentarioInicialParaResponder}
            aoVoltar={() => {
              setPostComentariosAtivo(null);
              setComentarioInicialParaResponder(null);
              setListaComentarios([]);
              if (topicoIdParam) {
                navigate('/');
              }
            }}
            aoEnviarComentario={enviarComentario}
            {...propsDeEngajamento(postComentariosAtivo)} {...propsDeModeracao(postComentariosAtivo)} {...propsDeDesafio(postComentariosAtivo)}
            aoTocarAudio={(fonte) => void alternarAudio(fonte, postComentariosAtivo.id)}
            audioTocando={audioTocandoId === postComentariosAtivo.id}
            tempoAtualDoAudio={audioSelecionadoId === postComentariosAtivo.id ? tempoAtualDoAudio : 0}
            duracaoDoAudio={audioSelecionadoId === postComentariosAtivo.id ? duracaoDoAudio : null}
          />
        ) : (
          <>
            {/* ==================== VIEW: HUB UNIFICADO (ARENA + MURAL) ==================== */}
            {viewAtual === 'feed' && (
          <section aria-label="Feed principal">
            {slotArena}
            {!slotArena && (
              <section className="arena-v2 arena-v2--embutida" aria-label="Atalho de gravação">
                <div className="arena-v2__palco">
                  <div className="arena-v2__cabecalho-modulo">
                    <p className="arena-v2__identificador">
                      <span className="arena-v2__pulso" aria-hidden="true" />
                      ARENA
                    </p>
                  </div>
                  <div className="arena-v2__linha-topo is-compacta">
                    <div className="arena-v2__chamada">
                      <h2>SOLTA O ARROTO.</h2>
                    </div>
                    <button
                      type="button"
                      className="arena-v2__gatilho"
                      onClick={() => abrirGravacaoDireta({
                        destinoFixo: 'perfil-proprio',
                        publicarNoFeed: true,
                        iniciarImediatamente: true,
                      })}
                    >
                      Gravar agora
                    </button>
                  </div>
                </div>
              </section>
            )}

            <div className="hub-mobile-ranking">
              <TopArrotadoresDaHome variante="faixa-mobile" />
            </div>

            <div className="mural-cabecalho">
              <div className="mural-cabecalho__titulo-grupo">
                <h1>Mural</h1>
              </div>
              <button
                type="button"
                className="mural-publicar"
                onClick={() => { setDesafioAlvo(null); setDestinoDoCompositor('pessoal'); setModalCompositorAberto(true); }}
              >
                + Postar
              </button>
            </div>

            <div className="mural-controles">
              <div className="feed-filters" role="group" aria-label="Filtrar publicações">
                <button type="button" className="feed-filter" aria-pressed={filtroDoFeed === 'resenha'} onClick={() => setFiltroDoFeed('resenha')}>Tudo</button>
                <button type="button" className="feed-filter" aria-pressed={filtroDoFeed === 'arrotos'} onClick={() => setFiltroDoFeed('arrotos')}>Arrotos</button>
              </div>
            </div>

            <div className="feed">
              {estadoFeed === 'carregando' && (
                <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--aue-muted)' }}>
                  <p>Carregando conversas…</p>
                </div>
              )}
              {estadoFeed === 'erro' && (
                <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--aue-muted)' }}>
                  <p>Não deu para carregar as conversas agora.</p>
                  <button type="button" className="tab" onClick={() => setTentativaFeed((tentativa) => tentativa + 1)}>
                    Tentar de novo
                  </button>
                </div>
              )}
              {estadoFeed === 'pronto' && itensDoFeedFiltrados.length === 0 && (
                <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--aue-muted)' }}>
                  <p>{filtroDoFeed === 'arrotos'
                    ? temMaisFeed ? 'Buscando mais publicações com áudio…' : 'Nenhum arroto aqui ainda.'
                    : filtroDoFeed === 'links'
                      ? 'Nenhum link aqui ainda.'
                      : 'Mural vazio. Manda o primeiro.'}
                  </p>
                </div>
              )}
              {itensDoFeedFiltrados.map((post, indice) => {
                return (
                  <div key={post.id}>
                    <CardDoPost
                      post={post}
                      {...propsDeEngajamento(post)} {...propsDeModeracao(post)} {...propsDeDesafio(post)}
                      audioTocando={audioTocandoId === post.id}
                      tempoAtualDoAudio={audioSelecionadoId === post.id ? tempoAtualDoAudio : 0}
                      duracaoDoAudio={audioSelecionadoId === post.id ? duracaoDoAudio : null}
                      aoTocarAudio={(fonte) => void alternarAudio(fonte, post.id)}
                      aoAbrirComentarios={() => void abrirComentarios(post)}
                      {...propsDeComentariosDoPost(post)}
                    />
                    <PreviaDaConversa
                      post={post}
                      comentarios={previasDasConversas.get(post.id) ?? []}
                      carregando={previasEmCarregamento.has(post.id)}
                      expandida={conversasExpandidas.has(post.id)}
                      carregandoMais={respostasEmExpansao.has(post.id)}
                      temMais={conversasExpandidas.has(post.id)
                        ? cursoresDasConversas.get(post.id) !== null
                        : (previasDasConversas.get(post.id)?.length ?? 0) < post.respostasTotal}
                      aoCarregarMais={() => void carregarMaisRespostasNaPrevia(post)}
                      aoResponder={(comentario) => void abrirComentarios(post, comentario)}
                    />
                    {((indice + 1) % 3 === 0 || (itensDoFeedFiltrados.length < 3 && indice === itensDoFeedFiltrados.length - 1)) && (
                      <SlotPatrocinadoDoFeed indiceDoSlot={(indice + 1) % 3 === 0 ? Math.floor((indice + 1) / 3) - 1 : 0} />
                    )}
                  </div>
                );
              })}
              {estadoFeed === 'pronto' && (temMaisFeed || erroMaisFeed) && <div className="feed-mais" ref={fimDoFeed}>
                {erroMaisFeed && <p role="alert">Não foi possível carregar mais publicações.</p>}
                <button type="button" onClick={() => carregarMaisFeed.current()} disabled={carregandoMaisFeed}>
                  {carregandoMaisFeed ? 'Carregando…' : erroMaisFeed ? 'Tentar novamente' : 'Carregar mais'}
                </button>
              </div>}
            </div>

            <footer className="mural-rodape-acoes">
              <button
                type="button"
                className="tab"
                onClick={() => setModalInstitucionalAberto(true)}
              >
                Sobre o Auê
              </button>
            </footer>
          </section>
        )}

        {viewAtual === 'seguindo' && (
          <section aria-label="Feed de quem você segue">
            <div className="hero">
              <span className="eyebrow">Pessoas que você acompanha</span>
              <h1>Seguindo</h1>
              <p>Posts das pessoas que você escolheu acompanhar.</p>
            </div>
            {estadoSeguindo === 'semConta' && (
              <section className="od-profile__state"><h2>Entre para ver quem você segue.</h2><p>Você precisa de uma conta para acompanhar outros arrotadores.</p><button className="tab" type="button" onClick={aoEntrar ?? (() => setViewAtual('auth'))}>Entrar</button></section>
            )}
            {estadoSeguindo === 'carregando' && <p className="od-profile__muted">Carregando seu feed…</p>}
            {estadoSeguindo === 'erro' && <section className="od-profile__state"><h2>Não deu para abrir seu feed agora.</h2><p>Tenta de novo quando a conexão voltar.</p><button className="tab" type="button" onClick={() => setViewAtual('feed')}>Voltar ao início</button></section>}
            {estadoSeguindo === 'pronto' && postsSeguindo.length === 0 && <section className="od-profile__state"><h2>Quem você segue ainda está quieto.</h2><p>Siga alguns perfis pelo Mural para ver os posts deles aqui.</p><button className="tab" type="button" onClick={() => { setViewAtual('feed'); navigate('/'); }}>Ir para o Mural</button></section>}
            {estadoSeguindo === 'pronto' && postsSeguindo.length > 0 && <div className="feed">{postsSeguindo.map((post, indice) => <div key={post.id}><CardDoPost post={post} {...propsDeEngajamento(post)} {...propsDeModeracao(post)} {...propsDeDesafio(post)} audioTocando={audioTocandoId === post.id} tempoAtualDoAudio={audioSelecionadoId === post.id ? tempoAtualDoAudio : 0} duracaoDoAudio={audioSelecionadoId === post.id ? duracaoDoAudio : null} aoTocarAudio={(fonte) => void alternarAudio(fonte, post.id)} aoAbrirComentarios={() => void abrirComentarios(post)} {...propsDeComentariosDoPost(post)} /><PreviaDaConversa post={post} comentarios={previasDasConversas.get(post.id) ?? []} carregando={previasEmCarregamento.has(post.id)} expandida={conversasExpandidas.has(post.id)} carregandoMais={respostasEmExpansao.has(post.id)} temMais={conversasExpandidas.has(post.id) ? cursoresDasConversas.get(post.id) !== null : (previasDasConversas.get(post.id)?.length ?? 0) < post.respostasTotal} aoCarregarMais={() => void carregarMaisRespostasNaPrevia(post)} aoResponder={(comentario) => void abrirComentarios(post, comentario)} />{((indice + 1) % 3 === 0 || (postsSeguindo.length < 3 && indice === postsSeguindo.length - 1)) && <SlotPatrocinadoDoFeed indiceDoSlot={(indice + 1) % 3 === 0 ? Math.floor((indice + 1) / 3) - 1 : 0} />}</div>)}</div>}
          </section>
        )}

        {/* ==================== VIEW: COMUNIDADE ESPECÍFICA ==================== */}
        {viewAtual === 'comunidade' && (
          <section aria-label={`Comunidade ${comunidadeAtiva?.nome ?? comunidadeSlug}`}>
            {falhaTopico ? (
              <div className="estado-chapado">
                <p>Deu ruim pra carregar o tópico.</p>
              </div>
            ) : comunidadeInexistente ? (
              <div className="estado-chapado">
                <h2 style={{ margin: '0 0 8px' }}>Comunidade não encontrada.</h2>
                <p style={{ margin: '0 0 16px' }}>Essa comunidade não existe no Auê, ou foi removida.</p>
                <Link className="submit" style={{ float: 'none' }} to="/comunidades">Ver comunidades</Link>
              </div>
            ) : falhaComunidade ? (
              <div className="estado-chapado">
                <p>Deu ruim pra carregar a comunidade.</p>
              </div>
            ) : (
              <>
                <div style={{ position: 'sticky', top: 0, zIndex: 5, background: 'var(--aue-bg, #0d0e12)', borderBottom: '1px solid var(--aue-line)', display: 'flex', alignItems: 'center', gap: 16, padding: '0 16px', height: 53, marginBottom: 16 }}>
                  <button
                    type="button"
                    onClick={() => {
                      setViewAtual('comunidades');
                      navigate('/comunidades');
                    }}
                    aria-label="Voltar para comunidades"
                    style={{ width: 36, height: 36, borderRadius: '50%', border: 0, background: 'none', color: 'var(--aue-fg, #fff)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
                  </button>
                  <div style={{ lineHeight: 1.2 }}>
                    <div style={{ fontWeight: 700, fontSize: 18 }}>{comunidadeAtiva?.nome || 'Comunidade'}</div>
                    <div style={{ color: 'var(--aue-muted)', fontSize: 13 }}>{formatarMilhar(comunidadeAtiva?.membrosTotal)} membros</div>
                  </div>
                </div>

                <div className="community-hero" style={{ marginBottom: 16 }}>
                  <div
                    style={{
                      height: 130,
                      background: fonteDaCapaDaComunidade(comunidadeAtiva)
                        ? `url("${fonteDaCapaDaComunidade(comunidadeAtiva)}") center/cover no-repeat`
                        : 'var(--aue-surface-2)',
                      borderRadius: '12px 12px 0 0',
                      border: '1px solid var(--aue-line)',
                      borderBottom: 0,
                      display: 'flex',
                      alignItems: 'flex-end',
                      padding: 16,
                      position: 'relative',
                    }}
                  >
                    <div
                      style={{
                        width: 64,
                        height: 64,
                        borderRadius: '50%',
                        border: '3px solid var(--aue-surface)',
                        background: (fonteDoAvatarDaComunidade(comunidadeAtiva) ?? comunidadeAtiva?.icone)
                          ? `url("${fonteDoAvatarDaComunidade(comunidadeAtiva) ?? comunidadeAtiva?.icone}") center/cover no-repeat`
                          : 'var(--aue-surface-2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                        marginBottom: -32,
                        zIndex: 2,
                      }}
                    >
                      {!(fonteDoAvatarDaComunidade(comunidadeAtiva) ?? comunidadeAtiva?.icone) && (
                        <span style={{ fontFamily: 'var(--font-display, Anton)', fontSize: 32, lineHeight: 1, color: 'var(--aue-accent, #ff5500)' }}>
                          {comunidadeAtiva?.nome ? comunidadeAtiva.nome.slice(0, 1).toUpperCase() : comunidadeSlug.slice(0, 1).toUpperCase()}
                        </span>
                      )}
                    </div>
                  </div>
                  <div
                    style={{
                      padding: '38px 20px 16px',
                      background: 'var(--aue-surface)',
                      border: '1px solid var(--aue-line)',
                      borderRadius: '0 0 12px 12px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
                      <div>
                        <h1 style={{ margin: 0, fontSize: 24 }}>{comunidadeAtiva?.nome ?? comunidadeSlug}</h1>
                        <span style={{ color: 'var(--aue-accent)', fontSize: 13, fontWeight: 800 }}>
                          ◎ {formatarMilhar(comunidadeAtiva?.membrosTotal)} membros
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                        <button
                          id="joinCommunity"
                          type="button"
                          className="join"
                          style={{ padding: '8px 18px', fontSize: 13 }}
                          onClick={() => alternarEntrarComunidade(comunidadeSlug)}
                          {...propsDaParticipacao(comunidadeSlug)}
                        >
                          {rotuloDaParticipacao(comunidadeSlug)}
                        </button>
                        {comunidadeAtiva?.possoGerirMidia && (
                          <button
                            id="manageCommunity"
                            type="button"
                            className="tab"
                            style={{ border: '1px solid var(--aue-line)' }}
                            onClick={() => setModalGerirComunidadeAberto(true)}
                          >
                            Administrar comunidade
                          </button>
                        )}
                        <button
                          type="button"
                          className="tab"
                          style={{ border: '1px solid var(--aue-line)' }}
                          onClick={() => { setDestinoDoCompositor('comunidade'); setModalCompositorAberto(true); }}
                        >
                          + Criar tópico
                        </button>
                      </div>
                    </div>
                    <p style={{ color: 'var(--aue-muted)', margin: '10px 0 0', fontSize: 14 }}>
                      {comunidadeAtiva?.descricao ?? ''}
                    </p>
                  </div>
                </div>

                <div className="tabs" style={{ marginBottom: 16, borderBottom: '1px solid var(--aue-line)' }}>
                  <button
                    type="button"
                    className={`tab ${secaoComunidade === 'causos' ? 'active' : ''}`}
                    onClick={() => setSecaoComunidade('causos')}
                  >
                    Posts
                  </button>
                  <button
                    type="button"
                    className={`tab ${secaoComunidade === 'sobre' ? 'active' : ''}`}
                    onClick={() => setSecaoComunidade('sobre')}
                  >
                    Sobre
                  </button>
                </div>

                {secaoComunidade === 'causos' && (
                  <>
                    <div className="estado-chapado estado-chapado--aviso">
                      <strong style={{ fontSize: 13 }}>Antes de criar um tópico: leia as regras da comunidade.</strong>
                    </div>

                    <div className="community-feed">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                        <h2 style={{ fontSize: 18, margin: 0 }}>Tópicos</h2>
                        <div className="tabs">
                          <button
                            type="button"
                            className={`tab ${abaComunidade === 'Ativos' ? 'active' : ''}`}
                            onClick={() => setAbaComunidade('Ativos')}
                          >
                            Ativos
                          </button>
                          <button
                            type="button"
                            className={`tab ${abaComunidade === 'Recentes' ? 'active' : ''}`}
                            onClick={() => setAbaComunidade('Recentes')}
                          >
                            Recentes
                          </button>
                        </div>
                      </div>
                      {estadoTopicosDaComunidade === 'carregando' && (
                        <p style={{ color: 'var(--aue-muted)' }}>Carregando tópicos…</p>
                      )}
                      {estadoTopicosDaComunidade === 'erro' && (
                        <p style={{ color: 'var(--aue-muted)' }}>Não deu para carregar os tópicos desta comunidade.</p>
                      )}
                      {estadoTopicosDaComunidade === 'pronto' && topicosDaComunidade.length === 0 && (
                        <p style={{ color: 'var(--aue-muted)' }}>Ainda não há tópicos nesta comunidade.</p>
                      )}
                      {topicosDaComunidade.length > 0 && (
                        <ListaDeTopicos
                          topicos={topicosDaComunidade}
                          aoAbrirTopico={(topico) => {
                            void abrirComentarios(topico);
                            navigate(`/c/${encodeURIComponent(topico.comunidadeSlug)}/t/${encodeURIComponent(topico.id.replace('topico-', ''))}`);
                          }}
                        />
                      )}
                    </div>
                  </>
                )}

                {secaoComunidade === 'sobre' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div className="estado-chapado">
                      <h2 style={{ margin: '0 0 12px', fontSize: 18 }}>Regras rápidas</h2>
                      {regrasDaComunidade.length === 0 ? (
                        <p style={{ margin: 0, fontSize: 14, color: 'var(--aue-muted)' }}>Essa comunidade ainda não tem regras escritas.</p>
                      ) : (
                        <ol style={{ margin: 0, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 8, fontSize: 14, color: 'var(--aue-fg)' }}>
                          {regrasDaComunidade.map((regra, i) => (
                            <li key={i}>{regra}</li>
                          ))}
                        </ol>
                      )}
                    </div>
                    <div className="estado-chapado">
                      <h2 style={{ margin: '0 0 12px', fontSize: 18 }}>Moderadores</h2>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {moderadoresDaComunidade.length === 0 && (
                          <p style={{ margin: 0, fontSize: 14, color: 'var(--aue-muted)' }}>Nenhum moderador definido.</p>
                        )}
                        {moderadoresDaComunidade.map(([mod, papel], i) => (
                          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 14 }}>
                            <strong>{mod}</strong>
                            <span style={{ color: 'var(--aue-muted)', fontSize: 13 }}>{papel}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </section>
        )}

        {/* ==================== VIEW: DIRETÓRIO DE COMUNIDADES ==================== */}
        {viewAtual === 'comunidades' && (
          <section className="od-groups" aria-label="Grupos do Auê">
            <nav className="diretorio-nav" aria-label="Navegação principal">
              <Link className="diretorio-nav__marca" to="/" aria-label="Auê, voltar à Arena">AUÊ<span>!</span></Link>
              <div><Link to="/feed">Mural</Link><Link to="/perfil">Perfil</Link><Link to="/">Ir pra Arena ↗</Link></div>
            </nav>
            <header className="od-groups__head">
              <span className="od-groups__eyebrow">Comunidades</span>
              <h1>Encontre sua comunidade.</h1>
              <p>Seu canto na arquibancada. Chegue junto, ouça os arrotos e encontre sua turma.</p>
              {comunidades.length > 0 && <span className="od-groups__total">{comunidades.length} {comunidades.length === 1 ? 'comunidade aberta' : 'comunidades abertas'}</span>}
            </header>

            <div className="od-groups__list">
              {comunidades.map((c) => (
                <article key={c.id} className="od-groups__card">
                  <Link
                    className="od-groups__card-link"
                    to={`/c/${c.slug}`}
                    onClick={() => {
                      setComunidadeSlug(c.slug);
                      setViewAtual('comunidade');
                    }}
                  >
                    <div
                      className={`od-groups__thumbnail${fonteDaCapaDaComunidade(c) ? '' : ' od-groups__thumbnail--fallback'}`}
                      style={fonteDaCapaDaComunidade(c) ? { backgroundImage: `url("${fonteDaCapaDaComunidade(c)}")` } : undefined}
                      aria-hidden="true"
                    />
                    <div className="od-groups__card-content">
                      <div className="od-groups__identity">
                        {fonteDoAvatarDaComunidade(c) ? (
                          <img className="od-groups__avatar" src={fonteDoAvatarDaComunidade(c)} alt="" />
                        ) : (
                          <span className="od-groups__avatar od-groups__avatar--fallback" aria-hidden="true">{c.icone ?? c.nome.slice(0, 1).toUpperCase()}</span>
                        )}
                        <div>
                          <h2>{c.nome}</h2>
                          <p>{c.descricao || 'Essa comunidade ainda não se apresentou.'}</p>
                        </div>
                      </div>
                      <div className="od-groups__stats" aria-label={`Dados de ${c.nome}`}>
                        <span><strong>{formatarMilhar(c.membrosTotal)}</strong> membros</span>
                        <span><strong>{formatarMilhar(c.topicosTotal)}</strong> posts</span>
                      </div>
                    </div>
                  </Link>
                  <button
                    type="button"
                    className="od-groups__join"
                    onClick={() => alternarEntrarComunidade(c.slug)}
                    {...propsDaParticipacao(c.slug)}
                  >
                    {rotuloDaParticipacao(c.slug)}
                  </button>
                </article>
              ))}
              {estadoComunidades === 'carregando' && <p className="od-groups__empty" role="status">Buscando as comunidades…</p>}
              {estadoComunidades === 'erro' && <div className="od-groups__empty" role="alert"><p>Não foi possível carregar as comunidades agora.</p><button type="button" className="od-groups__join" onClick={() => setTentativaComunidades((atual) => atual + 1)}>Tentar novamente</button></div>}
              {estadoComunidades === 'pronto' && comunidades.length === 0 && <p className="od-groups__empty">Ainda não há comunidades abertas por aqui.</p>}
            </div>
          </section>
        )}

        {/* ==================== VIEW: PERFIL ==================== */}
        {viewAtual === 'perfil' && (
          <section className="od-profile" aria-label="Perfil do usuário">
            {estadoPerfil === 'carregando' && (
              <section className="od-profile__state" aria-live="polite">
                <h1>Abrindo perfil…</h1><p>Buscando a ficha desta pessoa.</p>
              </section>
            )}

            {estadoPerfil === 'erro' && (
              <section className="od-profile__state" role="alert">
                <h1>Não deu para abrir este perfil.</h1>
                <p>Pode ser uma falha de conexão. Tenta de novo.</p>
                <button type="button" className="tab od-profile__button" onClick={() => setTentativaDoPerfil((n) => n + 1)}>Tentar novamente</button>
              </section>
            )}

            {estadoPerfil === 'inexistente' && (
              <section className="od-profile__state">
                <h1>Esse @ não foi encontrado.</h1>
                <p>O perfil pode ter mudado de nome ou não existir.</p>
                <Link className="tab od-profile__button" to="/">Voltar ao início</Link>
              </section>
            )}

            {estadoPerfil === 'pendente' && (
              fichaSocialPendente ? (
                <section className="od-profile__state od-profile__onboarding" aria-live="polite">
                  <p className="od-profile__eyebrow">PASSO 1</p>
                  <h1>Fecha a ficha.</h1>
                  <p>Escolhe apelido e @. O resto é opcional.</p>
                  {estadoDaFicha === 'carregando' && <p>Buscando o que você já preencheu…</p>}
                  {estadoDaFicha === 'erro' && <><p>Não deu para carregar sua ficha agora.</p><button type="button" className="tab od-profile__button" onClick={() => setTentativaDoPerfil((n) => n + 1)}>Tentar novamente</button></>}
                  {(estadoDaFicha === 'pronto' || estadoDaFicha === 'salvando') && (
                    <form className="od-profile__form" onSubmit={concluirFichaSocial}>
                      <label>Apelido<input value={ficha.apelido} onChange={(e) => setFicha({ ...ficha, apelido: e.target.value })} autoComplete="nickname" required /></label>
                      <label>@<input value={ficha.handle} onChange={(e) => setFicha({ ...ficha, handle: e.target.value.toLowerCase().replace(/^@/, '') })} autoComplete="username" pattern="[a-z0-9_]{3,20}" minLength={3} maxLength={20} required /></label>
                      <label>Bio <span>opcional</span><textarea value={ficha.bio ?? ''} onChange={(e) => setFicha({ ...ficha, bio: e.target.value })} /></label>
                      <label>Cidade <span>opcional</span><input value={ficha.cidade ?? ''} onChange={(e) => setFicha({ ...ficha, cidade: e.target.value })} /></label>
                      <fieldset className="od-profile__redes"><legend>Redes <span>opcional</span></legend>
                        <label>Instagram<input value={ficha.instagram ?? ''} onChange={(e) => setFicha({ ...ficha, instagram: e.target.value })} /></label>
                        <label>TikTok<input value={ficha.tiktok ?? ''} onChange={(e) => setFicha({ ...ficha, tiktok: e.target.value })} /></label>
                        <label>YouTube<input value={ficha.youtube ?? ''} onChange={(e) => setFicha({ ...ficha, youtube: e.target.value })} /></label>
                        <label>X<input value={ficha.twitter ?? ''} onChange={(e) => setFicha({ ...ficha, twitter: e.target.value })} /></label>
                      </fieldset>
                      {erroDaFicha && <p className="od-profile__form-error" role="alert">{erroDaFicha}</p>}
                      <button type="submit" className="join od-profile__button" disabled={estadoDaFicha === 'salvando'}>{estadoDaFicha === 'salvando' ? 'Salvando…' : 'Entrar na Tropa'}</button>
                    </form>
                  )}
                </section>
              ) : (
                <section className="od-profile__state">
                  <h1>Sua ficha ainda não está pronta.</h1>
                  <p>Entre na conta e escolha seu nome e @ antes de publicar no mural.</p>
                  <Link className="join od-profile__button" to="/login">Entrar na conta</Link>
                </section>
              )
            )}

            {estadoPerfil === 'pronto' && perfilExibido && (
              <>
                <article className="od-profile__hero od-profile__hero--plain od-profile__athlete">
                  <div className="od-profile__athlete-label">FICHA <span>AUÊ!</span></div>
                  <input ref={inputDaCapa} className="od-profile__file" type="file" accept="image/jpeg,image/png,image/webp" aria-label="Escolher nova capa do perfil" onChange={(e) => void abrirAjusteDeImagem(e.target.files?.[0], 'capa')} />
                  <div className="od-profile__body">
                    <div className="od-profile__topline">
                      <div className="od-profile__identity-head">
                        <div className="od-profile__avatar-wrap">
                          <div className="od-profile__avatar" aria-label={`Avatar de ${perfilExibido.apelido}`}>
                            {perfilExibido.avatarUrl ? <img src={perfilExibido.avatarUrl} alt="" /> : iniciaisDoPerfil}
                          </div>
                          {donoDoPerfil && <>
                            <button type="button" className="od-profile__photo-action" aria-label="Trocar foto" onClick={() => inputDaFoto.current?.click()} disabled={fotoEnviando}>
                              <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M4 7.5h3l1.3-2h7.4l1.3 2h3A1.5 1.5 0 0 1 21.5 9v9.5A1.5 1.5 0 0 1 20 20H4a1.5 1.5 0 0 1-1.5-1.5V9A1.5 1.5 0 0 1 4 7.5Z" /><circle cx="12" cy="13.5" r="3.25" /></svg>
                            </button>
                            {perfilExibido.avatarUrl && <button type="button" className="od-profile__photo-remove-action" aria-label="Remover foto" onClick={() => void removerFotoDoPerfil()} disabled={fotoEnviando}>×</button>}
                          </>}
                          <input ref={inputDaFoto} className="od-profile__file" type="file" accept="image/jpeg,image/png,image/webp" aria-label="Escolher nova foto de perfil" onChange={(e) => void abrirAjusteDeImagem(e.target.files?.[0], 'foto')} />
                        </div>
                        <div className="od-profile__name"><h1>{perfilExibido.apelido}</h1><p className="od-profile__handle">@{perfilExibido.handle}</p></div>
                      </div>
                      {!donoDoPerfil && (
                        <div className="od-profile__actions">
                          <button type="button" className="join od-profile__button" onClick={() => void alternarSeguirPerfil()} disabled={alternandoSeguir}>
                            {alternandoSeguir ? 'Atualizando…' : seguindoPerfil ? 'Seguindo' : 'Seguir'}
                          </button>
                          <button
                            type="button"
                            className="join od-profile__button od-profile__button--challenge"
                            onClick={() =>
                              abrirDesafio({
                                handle: perfilExibido.handle,
                                nome: perfilExibido.apelido,
                                ...(notasExibidas?.melhorNota !== null && notasExibidas?.melhorNota !== undefined
                                  ? { notaAlvo: Math.round(notasExibidas.melhorNota) }
                                  : {}),
                              })
                            }
                            aria-label={`Desafiar @${perfilExibido.handle}`}
                          >
                            <span aria-hidden="true">⚔️</span> Puxar X1
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="od-profile__identity">
                      {perfilExibido.bio && <p id="profileBio" className="od-profile__bio">{perfilExibido.bio}</p>}
                      <div className="od-profile__meta">
                        {perfilExibido.cidade && <span>⌖ {perfilExibido.cidade}</span>}
                        <span>no Auê desde {new Date(perfilExibido.criadoEm).getFullYear()}</span>
                      </div>
                      <div className="od-profile__social-line">
                        <div className="od-profile__social" aria-label="Redes sociais">
                          {([['instagram', 'Instagram'], ['tiktok', 'TikTok'], ['youtube', 'YouTube'], ['twitter', 'X']] as const).map(([rede, nome]) => {
                            const href = linkDaRede(rede, perfilExibido[rede]);
                            return href ? <a key={rede} href={href} target="_blank" rel="noreferrer" aria-label={nome} title={nome}><IconeDaRede rede={rede} /></a> : null;
                          })}
                        </div>
                        <div className="od-profile__profile-actions">
                          {donoDoPerfil && <button type="button" className="od-profile__icon-action" aria-label="Editar perfil" title="Editar perfil" onClick={() => setModalPerfilAberto(true)}><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="m4 20 4.3-1 10-10a2.1 2.1 0 0 0-3-3l-10 10L4 20Z" /><path d="m13.8 7.5 3 3" /></svg></button>}
                          <button type="button" className="od-profile__icon-action" aria-label="Compartilhar perfil" title="Compartilhar perfil" onClick={() => void compartilharPerfil()}><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><circle cx="18" cy="5" r="2.25" /><circle cx="6" cy="12" r="2.25" /><circle cx="18" cy="19" r="2.25" /><path d="m8 11 7.8-4.7M8 13l7.8 4.7" /></svg></button>
                        </div>
                      </div>
                    </div>

                    <section className="od-profile__dashboard" aria-labelledby="perfilPlacar">
                      <div className="od-profile__dashboard-head">
                        <div><h2 id="perfilPlacar">{donoDoPerfil ? 'Seu placar' : 'Placar'}</h2></div>
                        {donoDoPerfil && <Link className="join od-profile__button od-profile__arena" to="/arena">Ir pra Arena <span aria-hidden="true">↗</span></Link>}
                      </div>
                      <div className="od-profile__dashboard-stats">
                        <div className="od-profile__best">
                          <h3 id="perfilMelhorNota">Melhor nota</h3>
                          {notasExibidas?.estado === 'pronto' && notasExibidas.melhorNota !== null
                            ? <p className="od-profile__best-score">{Math.round(notasExibidas.melhorNota)}<span> pts</span></p>
                            : <p className="od-profile__best-empty">—</p>}
                          {(notasExibidas?.estado === 'erro' || !notasExibidas || notasExibidas.estado === 'carregando' || notasExibidas.melhorNota === null) && (
                            <p className="od-profile__best-caption">
                              {notasExibidas?.estado === 'erro'
                                ? 'Não foi possível carregar'
                                : !notasExibidas || notasExibidas.estado === 'carregando'
                                  ? 'Carregando…'
                                  : 'Sem nota ainda'}
                            </p>
                          )}
                        </div>
                        <div className="od-profile__best">
                          <h3>Média</h3>
                          {notasExibidas?.estado === 'pronto' && notasExibidas.media !== null
                            ? <p className="od-profile__best-score">{notasExibidas.media.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}<span> pts</span></p>
                            : <p className="od-profile__best-empty">—</p>}
                          {(notasExibidas?.estado === 'erro' || !notasExibidas || notasExibidas.estado === 'carregando' || notasExibidas.media === null) && (
                            <p className="od-profile__best-caption">
                              {notasExibidas?.estado === 'erro'
                                ? 'Não foi possível carregar'
                                : !notasExibidas || notasExibidas.estado === 'carregando'
                                  ? 'Carregando…'
                                  : 'Sem nota ainda'}
                            </p>
                          )}
                        </div>
                      </div>
                    </section>
                    <div className="od-profile__connections">
                      <button type="button" aria-label={`Ver quem segue (${perfilExibido.totalSeguidores})`} onClick={() => void abrirConexoes('seguidores')}><b>{perfilExibido.totalSeguidores}</b> seguidores</button>
                      <button type="button" aria-label={`Ver quem é seguido (${perfilExibido.totalSeguindo})`} onClick={() => void abrirConexoes('seguindo')}><b>{perfilExibido.totalSeguindo}</b> seguindo</button>
                    </div>

                  </div>
                </article>

                <div className="od-profile__tabs-nav" role="tablist" aria-label="Abas do perfil">
                  <button
                    type="button"
                    role="tab"
                    aria-selected={abaPerfil === 'arrotos'}
                    className={`od-profile__tab-btn ${abaPerfil === 'arrotos' ? 'active' : ''}`}
                    onClick={() => setAbaPerfil('arrotos')}
                  >
                    Arrotos {estadoDosArrotosExibidos === 'pronto' && <span>{arrotosDoPerfil.length}</span>}
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={abaPerfil === 'posts'}
                    className={`od-profile__tab-btn ${abaPerfil === 'posts' ? 'active' : ''}`}
                    onClick={() => setAbaPerfil('posts')}
                  >
                    Posts <span>{postsDoPerfil.length}</span>
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={abaPerfil === 'marcados'}
                    className={`od-profile__tab-btn ${abaPerfil === 'marcados' ? 'active' : ''}`}
                    onClick={() => setAbaPerfil('marcados')}
                  >
                    Marcados <span>{publicacoesMarcadasDoPerfil.length}</span>
                  </button>
                  {donoDoPerfil && (
                    <button
                      type="button"
                      role="tab"
                      aria-selected={abaPerfil === 'salvos'}
                      className={`od-profile__tab-btn ${abaPerfil === 'salvos' ? 'active' : ''}`}
                      onClick={() => setAbaPerfil('salvos')}
                    >
                      Salvos
                    </button>
                  )}
                </div>

                {abaPerfil === 'posts' && (
                  <section className="od-profile__activity od-profile__activity--posts" aria-labelledby="profileActivity">
                    <div className="od-profile__activity-head">
                      <div className="od-profile__activity-title"><h2 id="profileActivity">Posts</h2><span>{postsDoPerfil.length}</span></div>
                      {donoDoPerfil && (
                        <button
                          type="button"
                          className="od-profile__new-post-cta"
                          aria-label="Criar novo post"
                          onClick={() => { setDesafioAlvo(null); setDestinoDoCompositor('pessoal'); setModalCompositorAberto(true); }}
                        >
                          <span aria-hidden="true">+</span> Alguma merda
                        </button>
                      )}
                    </div>
                    {estadoPublicacoesPessoais === 'carregando' && <p className="od-profile__muted">Carregando posts do perfil…</p>}
                    {estadoPublicacoesPessoais === 'erro' && <p className="od-profile__error" role="alert">Não deu para carregar os posts do perfil agora.</p>}
                    {estadoTopicosDoPerfil === 'carregando' && <p className="od-profile__muted">Carregando posts…</p>}
                    {estadoTopicosDoPerfil === 'erro' && <p className="od-profile__error" role="alert">Não deu para carregar os posts agora.</p>}
                    {postsDoPerfil.map((post, indice) => (
                      <div key={post.id}>
                        <CardDoPost
                          variante="perfil"
                          post={post}
                          {...propsDeEngajamento(post)}
                          {...propsDeModeracao(post)}
                          {...propsDeDesafio(post)}
                          audioTocando={audioTocandoId === post.id}
                          tempoAtualDoAudio={audioSelecionadoId === post.id ? tempoAtualDoAudio : 0}
                          duracaoDoAudio={audioSelecionadoId === post.id ? duracaoDoAudio : null}
                          aoTocarAudio={(fonte) => void alternarAudio(fonte, post.id)}
                          aoAbrirComentarios={() => void abrirComentarios(post)}
                          {...propsDeComentariosDoPost(post)}
                        />
                        {((indice + 1) % 3 === 0 || (postsDoPerfil.length < 3 && indice === postsDoPerfil.length - 1)) && (
                          <SlotPatrocinadoDoFeed indiceDoSlot={(indice + 1) % 3 === 0 ? Math.floor((indice + 1) / 3) - 1 : 0} />
                        )}
                      </div>
                    ))}
                    {estadoTopicosDoPerfil === 'pronto' && estadoPublicacoesPessoais === 'pronto' && postsDoPerfil.length === 0 && (
                      <div className="od-profile__empty"><h3>Nenhum post ainda.</h3></div>
                    )}
                  </section>
                )}

                {abaPerfil === 'marcados' && (
                  <section className="od-profile__activity od-profile__activity--posts" aria-labelledby="profileMarked">
                    <div className="od-profile__activity-head"><h2 id="profileMarked">Marcados</h2><span>{publicacoesMarcadasDoPerfil.length}</span></div>
                    {estadoMarcadasDoPerfil === 'carregando' && <p className="od-profile__muted">Carregando marcações…</p>}
                    {estadoMarcadasDoPerfil === 'erro' && <p className="od-profile__error" role="alert">Não deu para carregar as marcações agora.</p>}
                    {estadoMarcadasDoPerfil === 'pronto' && publicacoesMarcadasDoPerfil.length === 0 && <div className="od-profile__empty"><h3>Nenhuma marcação ainda.</h3></div>}
                    {publicacoesMarcadasDoPerfil.map((post) => (
                      <CardDoPost
                        key={post.id}
                        variante="perfil"
                        post={post}
                        {...propsDeEngajamento(post)}
                        {...propsDeModeracao(post)}
                        {...propsDeDesafio(post)}
                        audioTocando={audioTocandoId === post.id}
                        tempoAtualDoAudio={audioSelecionadoId === post.id ? tempoAtualDoAudio : 0}
                        duracaoDoAudio={audioSelecionadoId === post.id ? duracaoDoAudio : null}
                        aoTocarAudio={(fonte) => void alternarAudio(fonte, post.id)}
                        aoAbrirComentarios={() => void abrirComentarios(post)}
                        {...propsDeComentariosDoPost(post)}
                      />
                    ))}
                  </section>
                )}

                {abaPerfil === 'arrotos' && (
                  <section className="od-profile__activity" aria-labelledby="profileArrotos">
                    <div className="od-profile__activity-head"><h2 id="profileArrotos">Arrotos</h2>{estadoDosArrotosExibidos === 'pronto' && <span>{arrotosDoPerfil.length}</span>}</div>
                    {donoDoPerfil && (
                      <div className="od-profile__record-cta">
                        <button
                          type="button"
                          className="od-profile__record-button"
                          aria-label="Gravar um arroto no meu perfil"
                          onClick={() => abrirGravacaoDireta({ destinoFixo: 'perfil-proprio', compacto: true })}
                        >
                          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                            <path d="M12 14.5a3 3 0 0 0 3-3v-5a3 3 0 1 0-6 0v5a3 3 0 0 0 3 3Z" />
                            <path d="M18 11.5a6 6 0 0 1-12 0M12 17.5v3M8.5 20.5h7" />
                          </svg>
                        </button>
                        <div>
                          <p className="od-profile__record-eyebrow">DIRETO</p>
                          <h3>Gravar arroto</h3>
                        </div>
                      </div>
                    )}
                    {estadoDosArrotosExibidos === 'carregando' && <p className="od-profile__muted">Carregando arrotos…</p>}
                    {estadoDosArrotosExibidos === 'erro' && <p className="od-profile__error" role="alert">Não deu para carregar os arrotos agora.</p>}
                    {estadoDosArrotosExibidos === 'pronto' && arrotosDoPerfil.length === 0 && <div className="od-profile__empty"><h3>Nenhum arroto ainda.</h3></div>}
                    {estadoDosArrotosExibidos === 'pronto' && arrotosDoPerfil.map((arroto) => (
                      <article key={arroto.id} className="od-profile__post">
                        <span>{arroto.autorId === perfilExibido.id ? 'Gravado por esta pessoa' : `Enviado por @${arroto.autorHandle}`}</span>
                        <h3 style={{ margin: '7px 0', fontSize: 16 }}>Arroto direto · {Math.ceil(arroto.duracaoSegundos)}s</h3>
                        <div className="audio-com-nota od-profile__audio-com-nota"><div className="audio-com-nota__player"><PlayerDoArroto
                          tocando={audioTocandoId === arroto.id}
                          tempoAtualSegundos={audioSelecionadoId === arroto.id ? tempoAtualDoAudio : 0}
                          duracaoSegundos={audioSelecionadoId === arroto.id ? duracaoDoAudio : arroto.duracaoSegundos}
                          aoAlternar={() => void alternarAudio(arroto.enderecoDoAudio, arroto.id)}
                        /></div>
                        {notasDosArrotos.has(arroto.id) && <span className="audio-com-nota__nota" role="img" aria-label={`Nota: ${notasDosArrotos.get(arroto.id)?.nota} de 100`}>{notasDosArrotos.get(arroto.id)?.nota}</span>}</div>
                        {arroto.possoOcultar && <button type="button" className="tab" style={{ marginTop: 8 }} onClick={() => void arrotosPort.ocultarArroto(arroto.id).then((ocultou) => { if (ocultou) { setArrotosDoPerfil((atuais) => atuais.filter((item) => item.id !== arroto.id)); setRevisaoDasNotas((atual) => atual + 1); } })}>Ocultar</button>}
                      </article>
                    ))}
                  </section>
                )}

                {abaPerfil === 'salvos' && donoDoPerfil && <SalvosDoPerfil forum={forum} />}
              </>
            )}
          </section>
        )}
      </>
    )}

        {/* ==================== VIEW: AUTH ==================== */}
        {viewAtual === 'auth' && (
          <section className="auth-shell">
            <header className="auth-header">
              <Link to="/" className="auth-brand" aria-label="Auê, página inicial">AUÊ<span>!</span></Link>
              <nav aria-label="Navegação principal"><Link to="/">Início</Link><Link to="/ranking-de-arrotos">Ranking</Link><Link to="/grupos">Grupos</Link></nav>
            </header>
            <div className="auth-arena__conteudo">
              <div className="auth-arena__manifesto" aria-hidden="true">
                <p>SEM FRESCURA</p><div>ARROTA.<br />PONTUA.<br />COBRA X1.</div>
              </div>
            {painelAuth === 'login' && (
              <form onSubmit={submeterLogin} className="dialog">
                <h1>Entrar</h1>

                <label style={{ display: 'grid', gap: 6, marginBottom: 12 }}>
                  E-mail
                  <input
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    required
                    aria-label="E-mail"
                  />
                </label>

                <label style={{ display: 'grid', gap: 6, marginBottom: 16 }}>
                  Senha
                  <input
                    type="password"
                    value={loginSenha}
                    onChange={(e) => setLoginSenha(e.target.value)}
                    required
                    aria-label="Senha"
                  />
                </label>

                <button type="submit" className="submit" style={{ width: '100%', float: 'none' }}>
                  {authEnviando ? 'Entrando…' : 'Entrar'}
                </button>

                <div className="auth-divider" aria-hidden="true"><span>ou entre por</span></div>
                <div className="auth-social-soon" aria-label="Entradas sociais em breve">
                  <button type="button" className="auth-social-soon__button" disabled aria-label="X: em breve">
                    <span className="auth-social-soon__provider"><IconeDoX /></span>
                    <small>Em breve</small>
                  </button>
                  <button type="button" className="auth-social-soon__button" disabled aria-label="TikTok: em breve">
                    <span className="auth-social-soon__provider"><IconeDaRede rede="tiktok" /><span>TikTok</span></span>
                    <small>Em breve</small>
                  </button>
                </div>

                {authStatus && (
                  <p style={{ color: 'var(--aue-accent)', fontSize: 13, marginTop: 10 }}>
                    {authStatus}
                  </p>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 18 }}>
                  <button
                    type="button"
                    className="tab"
                    onClick={() => {
                      setPainelAuth('recover');
                      setAuthStatus('');
                    }}
                  >
                    Esqueci minha senha
                  </button>
                  <button
                    type="button"
                    className="tab"
                    onClick={() => {
                      setPainelAuth('signup');
                      setAuthStatus('');
                    }}
                  >
                    Criar conta
                  </button>
                </div>
              </form>
            )}

            {painelAuth === 'recover' && (
              <form onSubmit={submeterRecuperacao} className="dialog">
                <h1>Recuperar senha</h1>
                <p style={{ color: 'var(--aue-muted)', marginBottom: 16 }}>
                  Manda o e-mail que o link chega.
                </p>
                <label style={{ display: 'grid', gap: 6, marginBottom: 16 }}>
                  E-mail
                  <input
                    type="email"
                    value={recoverEmail}
                    onChange={(e) => setRecoverEmail(e.target.value)}
                    required
                    aria-label="E-mail"
                  />
                </label>
                <button type="submit" className="submit" style={{ width: '100%', float: 'none' }}>
                  Enviar link
                </button>
                {authStatus && (
                  <p style={{ color: 'var(--aue-accent)', fontSize: 13, marginTop: 10 }}>
                    {authStatus}
                  </p>
                )}
                <button
                  type="button"
                  className="tab"
                  style={{ marginTop: 14 }}
                  onClick={() => {
                    setPainelAuth('login');
                    setAuthStatus('');
                  }}
                >
                  Voltar para entrar
                </button>
              </form>
            )}

            {painelAuth === 'signup' && (
              <form onSubmit={submeterCadastro} className="dialog auth-signup">
                <h1>Criar conta</h1>
                <label style={{ display: 'grid', gap: 6, marginBottom: 16 }}>
                  Apelido
                  <input
                    type="text"
                    value={cadastroApelido}
                    onChange={(e) => {
                      const apelido = e.target.value;
                      setCadastroApelido(apelido);
                      if (!cadastroHandle || cadastroHandle === sugerirHandle(cadastroApelido)) {
                        setCadastroHandle(sugerirHandle(apelido));
                      }
                    }}
                    autoComplete="nickname"
                    required
                    aria-label="Apelido"
                  />
                </label>
                <label style={{ display: 'grid', gap: 6, marginBottom: 16 }}>
                  @
                  <input
                    type="text"
                    value={cadastroHandle}
                    onChange={(e) => setCadastroHandle(e.target.value.toLowerCase().replace(/^@/, ''))}
                    autoComplete="username"
                    required
                    minLength={3}
                    maxLength={20}
                    pattern="[a-z0-9_]{3,20}"
                    aria-label="@"
                  />
                  <small className="auth-hint">3–20 caracteres (a-z, 0-9, _).</small>
                </label>
                <label style={{ display: 'grid', gap: 6, marginBottom: 16 }}>
                  E-mail
                  <input
                    type="email"
                    value={cadastroEmail}
                    onChange={(e) => setCadastroEmail(e.target.value)}
                    autoComplete="email"
                    required
                    aria-label="E-mail para cadastro"
                  />
                </label>
                <label style={{ display: 'grid', gap: 6, marginBottom: 16 }}>
                  Senha
                  <input
                    type="password"
                    value={cadastroSenha}
                    onChange={(e) => setCadastroSenha(e.target.value)}
                    autoComplete="new-password"
                    minLength={8}
                    required
                    aria-label="Senha para cadastro"
                  />
                  <small className="auth-hint">Mínimo 8 caracteres.</small>
                </label>
                <button type="submit" className="submit" style={{ width: '100%', float: 'none' }} disabled={authEnviando}>
                  {authEnviando ? 'Criando…' : 'Criar conta'}
                </button>
                {authStatus && (
                  <p className="auth-status" role="status">
                    {authStatus}
                  </p>
                )}
                <button
                  type="button"
                  className="tab"
                  style={{ marginTop: 14 }}
                  onClick={() => {
                    setPainelAuth('login');
                    setAuthStatus('');
                  }}
                >
                  Já tenho conta
                </button>
              </form>
            )}
            </div>
          </section>
        )}
      </main>

      {viewAtual !== 'auth' && <PainelDireito
        comunidades={comunidades}
        comunidadesEntradas={comunidadesEntradas}
        viewAtual={viewAtual}
        regrasDaComunidade={regrasDaComunidade}
        estaAutenticado={estaAutenticado}
        contaPerfil={meuPerfil}
        notificacoesDeMencao={notificacoesDeMencao}
        aoAbrirNotificacoes={() => {
          const ids = notificacoesDeMencao.filter((notificacao) => notificacao.lidaEm === null).map((notificacao) => notificacao.id);
          if (ids.length === 0 || !forum.marcarNotificacoesDeMencaoComoLidas) return;
          void forum.marcarNotificacoesDeMencaoComoLidas(ids).then((resultado) => {
            if (!resultado.ok) return;
            setNotificacoesDeMencao((anteriores) => anteriores.map((notificacao) => ids.includes(notificacao.id)
              ? { ...notificacao, lidaEm: new Date().toISOString() }
              : notificacao));
          });
        }}
        aoAbrirComunidade={(slug) => {
          setComunidadeSlug(slug);
          setViewAtual('comunidade');
        }}
      />}

      {/* ==================== MODAIS ==================== */}
      <ModalCompositor
        aberto={modalCompositorAberto}
        controleDeDialogo={controleDeDialogo}
        destino={destinoDoCompositor}
        comunidades={comunidades}
        comunidadePadraoSlug={destinoDoCompositor === 'comunidade' ? comunidadeSlug : undefined}
        autor={{ nome: meuPerfil?.apelido ?? 'Você', avatarUrl: meuPerfil?.avatarUrl }}
        desafioAlvo={desafioAlvo}
        aoFechar={() => { setDesafioAlvo(null); setModalCompositorAberto(false); }}
        criarGravacao={forum.criarGravacaoLivreDoForum}
        aoPublicar={publicarPost}
      />

      <ModalGravarArroto
        aberto={modalGravarArrotoAberto}
        controleDeDialogo={controleDeDialogo}
        estado={estadoGravacaoDireta}
        erro={erroDaGravacaoDireta}
        enviando={enviandoArrotoDireto}
        comunidades={comunidades.map((comunidade) => ({ slug: comunidade.slug, nome: comunidade.nome }))}
        destinoFixo={destinoFixoDaGravacao ?? undefined}
        compacto={gravacaoDiretaCompacta}
        audioParaPrevia={audioDireto?.dados ?? null}
        duracaoEmSegundos={audioDireto ? audioDireto.duracaoMs / 1000 : null}
        origemDoAudio={audioDireto?.origem ?? null}
        aoFechar={fecharGravacaoDireta}
        aoIniciarGravacao={iniciarGravacaoDireta}
        aoPararGravacao={pararGravacaoDireta}
        aoRegravar={() => {
          capturaDoArroto.soltar();
          setAudioDireto(null);
          setErroDaGravacaoDireta(null);
          setEstadoGravacaoDireta('ocioso');
        }}
        aoEscolherArquivo={escolherArquivoDeArroto}
        aoEnviar={enviarArrotoDireto}
      />

      {acaoDoPost && (
        <DialogoDoPost
          tipo={acaoDoPost.tipo}
          titulo={acaoDoPost.post.titulo || acaoDoPost.post.corpo}
          temAudio={Boolean(acaoDoPost.post.temAudio) && acaoDoPost.post.tipo === 'causo'}
          enviando={acaoEnviando}
          erro={erroDaAcao}
          aoConfirmar={(d) => void confirmarAcaoDoPost(d)}
          aoCancelar={() => { if (!acaoEnviando) setAcaoDoPost(null); }}
        />
      )}

      <ModalConexoes
        aberto={conexoesAbertas !== null}
        titulo={conexoesAbertas?.tipo === 'seguindo' ? 'Seguindo' : 'Seguidores'}
        estado={conexoesAbertas?.estado ?? 'carregando'}
        conexoes={conexoesAbertas?.lista ?? []}
        limite={100}
        aoFechar={() => setConexoesAbertas(null)}
        aoTentarDeNovo={() => conexoesAbertas && void abrirConexoes(conexoesAbertas.tipo)}
      />

      <ModalComentarios
        aberto={modalComentariosAberto}
        post={postComentariosAtivo}
        comentarios={listaComentarios}
        carregando={carregandoComentarios}
        enviando={enviandoComentario}
        autor={{ nome: meuPerfil?.apelido ?? 'Você', avatarUrl: meuPerfil?.avatarUrl }}
        comentarioInicialParaResponder={comentarioInicialParaResponder}
        criarGravacao={forum.criarGravacaoLivreDoForum}
        aoFechar={() => {
          setModalComentariosAberto(false);
          setPostComentariosAtivo(null);
          setComentarioInicialParaResponder(null);
          setListaComentarios([]);
        }}
        aoEnviarComentario={async (dados) => {
          const publicado = await enviarComentario(dados);
          if (publicado) {
            setModalComentariosAberto(false);
            setPostComentariosAtivo(null);
            setComentarioInicialParaResponder(null);
            setListaComentarios([]);
          }
          return publicado;
        }}
      />


      <ModalAjustarImagem
        aberto={Boolean(ajusteDeImagem)}
        tipo={ajusteDeImagem?.tipo ?? 'foto'}
        previewUrl={ajusteDeImagem?.previewUrl ?? null}
        estado={estadoDoAjusteDeImagem}
        erro={erroDoAjusteDeImagem}
        recorte={recorteDaImagem}
        aoFechar={fecharAjusteDeImagem}
        aoSalvar={() => void salvarAjusteDeImagem()}
        aoTrocarArquivo={() => (ajusteDeImagem?.tipo === 'capa' ? inputDaCapa.current?.click() : inputDaFoto.current?.click())}
        aoAlterarRecorte={setRecorteDaImagem}
      />

      <ModalEditarPerfil
        aberto={modalPerfilAberto}
        nomeInicial={perfilExibido?.apelido ?? ''}
        handleInicial={perfilExibido?.handle ?? ''}
        bioInicial={perfilExibido?.bio ?? ''}
        cidadeInicial={perfilExibido?.cidade ?? ''}
        temCapa={Boolean(perfilExibido?.capaUrl)}
        capaEnviando={capaEnviando}
        aoTrocarCapa={() => inputDaCapa.current?.click()}
        aoRemoverCapa={() => void removerCapaDoPerfil()}
        redesIniciais={{
          instagram: perfilExibido?.instagram,
          tiktok: perfilExibido?.tiktok,
          youtube: perfilExibido?.youtube,
          twitter: perfilExibido?.twitter,
        }}
        aoFechar={() => setModalPerfilAberto(false)}
        aoSalvar={salvarEdicaoPerfil}
      />

      <ModalGerirComunidade
        aberto={modalGerirComunidadeAberto}
        regrasIniciais={regrasDaComunidade}
        moderadoresIniciais={moderadoresDaComunidade}
        fotoUrlInicial={comunidadeAtiva?.avatarUrl}
        capaUrlInicial={comunidadeAtiva?.capaUrl}
        podeGerirMidia={Boolean(comunidadeAtiva?.possoGerirMidia)}
        midiaEnviando={midiaDaComunidadeEnviando}
        aoFechar={() => setModalGerirComunidadeAberto(false)}
        podeEditarRegras={Boolean(comunidadeAtiva?.possoGerirMidia) && Boolean(forum.definirRegrasDaComunidade)}
        aoSalvar={async (regras) => {
          if (!comunidadeAtiva || !forum.definirRegrasDaComunidade) {
            return { ok: false, mensagem: 'Não consegui salvar as regras agora.' };
          }
          const resultado = await forum.definirRegrasDaComunidade(comunidadeAtiva.slug, regras);
          if (!resultado.ok) {
            return {
              ok: false,
              mensagem: resultado.motivo === 'naoEAutor'
                ? 'Só a moderação da comunidade pode mudar as regras.'
                : resultado.motivo === 'precisaEntrar'
                  ? 'Entre com sua conta para mudar as regras.'
                  : 'Não consegui salvar as regras agora. Nada mudou.',
            };
          }
          setRegrasDaComunidade(regras);
          exibirToast('Regras salvas.');
          return { ok: true };
        }}
        aoEscolherMidia={(tipo, arquivo) => void abrirAjusteDeImagem(arquivo, tipo === 'capa' ? 'capa' : 'foto', 'comunidade')}
        aoRemoverMidia={(tipo) => {
          if (!comunidadeAtiva || !forum.removerMidiaDaComunidade) return;
          setMidiaDaComunidadeEnviando(tipo);
          void forum.removerMidiaDaComunidade(comunidadeAtiva.slug, tipo).then((resultado) => {
            if (!resultado.ok) {
              exibirToast(resultado.motivo === 'naoEAutor'
                ? 'Só a administração pode remover essa imagem.'
                : 'Não consegui remover essa imagem agora.');
              return;
            }
            setComunidadeAtiva(resultado.valor);
            exibirToast(tipo === 'capa' ? 'Capa da comunidade removida.' : 'Foto da comunidade removida.');
          }).catch(() => exibirToast('Não consegui remover essa imagem agora.')).finally(() => setMidiaDaComunidadeEnviando(null));
        }}
      />

      {/* Modal institucional rápido */}
      {modalInstitucionalAberto && (
        <div className="modal open" role="dialog" aria-modal="true">
          <div className="dialog">
            <div className="dialog-head">
              <h2>Sobre o Auê</h2>
              <button
                type="button"
                className="close"
                onClick={() => setModalInstitucionalAberto(false)}
              >
                ✕
              </button>
            </div>
            <p style={{ lineHeight: 1.6, color: 'var(--aue-muted)' }}>
              O Auê é uma comunidade brasileira para quem gosta de arrotar.
              Aqui você encontra gente para trocar histórias, ouvir arrotos e participar da resenha.
            </p>
          </div>
        </div>
      )}

      {/* Toast Feedback */}
      {toastMensagem && (
        <div
          role="status"
          style={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            background: 'var(--aue-surface)',
            color: 'var(--aue-text)',
            border: '1px solid var(--aue-accent)',
            borderRadius: 8,
            padding: '12px 20px',
            boxShadow: 'var(--aue-shadow)',
            zIndex: 100,
            fontWeight: 800,
            fontSize: 14,
          }}
        >
          {toastMensagem}
        </div>
      )}
    </div>
  );
}
