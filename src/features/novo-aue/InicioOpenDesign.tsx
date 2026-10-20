/**
 * CANÔNICO ATIVO — Experiência Principal do Bonde do Arroto (OpenDesign)
 * Referência visual: docs/design/prototipo/Bonde do Arroto.dc.html
 * Mapeamento: docs/design/MAPA_DE_PAGINAS_E_FLUXOS.md
 * 
 * Orquestra o layout de 3 colunas (desktop) e webapp mobile (via VersaoMobileOpenDesign).
 * Gerencia as views centrais: 'feed', 'emAlta', 'seguindo', 'comunidade', 'comunidades', 'perfil' e 'auth'.
 */
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { criarComunidadeWeb } from '../../plataforma/web/comunidade';
import { criarContaWeb } from '../../plataforma/web/conta';
import { criarCapturaWeb } from '../../plataforma/web/captura';
import { criarForumWeb } from '../../plataforma/web/forum';
import { criarArrotosDoPerfilRemoto } from '../../plataforma/web/arrotosDoPerfil';
import { criarUrlDePreviewDeImagem, prepararImagemDePerfil, revokeUrlDePreviewDeImagem } from '../../plataforma/web/imagem';
import { criarPerfilRemoto } from '../../plataforma/web/perfilRemoto';
import type { ArrotoDoPerfil, PortaDeArrotosDoPerfil } from '../../portas/arrotosDoPerfil';
import type { AudioCapturado, CapturaDeAudio } from '../../portas/captura';
import type { CausoPostado, PortaDeComunidade } from '../../portas/comunidade';
import { sugerirHandle, type PortaDeConta, type ResultadoDaConta } from '../../portas/conta';
import type { AnexoDoForum, AnexoParaPublicar, ComunidadeDoForum, PortaDeForum, TipoDeMidiaDaComunidade } from '../../portas/forum';
import type { DadosDoPerfil, PerfilPublico, PortaDePerfil } from '../../portas/perfil';
import { AdsterraNativeBanner } from './AdsterraNativeBanner';
import { BarraLateral } from './BarraLateral';
import { BarraSuperior } from './BarraSuperior';
import { CardDoPost } from './CardDoPost';
import { ThreadDeComentarios } from './ThreadDeComentarios';
import { ModalCompositor, type AnexoRascunho } from './ModalCompositor';
import { ModalComentarios } from './ModalComentarios';
import { ModalEditarPerfil } from './ModalEditarPerfil';
import { ModalAjustarImagem, type RecorteVisual, type TipoDeImagemAjustavel } from './ModalAjustarImagem';
import { ModalFundarComunidade } from './ModalFundarComunidade';
import { ModalGravarArroto, type DestinoDoArrotoDireto, type EstadoDaGravacaoDireta } from './ModalGravarArroto';
import { ModalGerirComunidade } from './ModalGerirComunidade';
import { PainelDireito } from './PainelDireito';
import { PlayerDoArroto } from './PlayerDoArroto';
import type { DetalhesDaComunidade, ItemComentario, ItemDoFeed } from './tipos';
import './casca.css';
import './InicioOpenDesign.css';

interface Props {
  readonly portaForum?: PortaDeForum;
  readonly portaComunidade?: PortaDeComunidade;
  readonly portaPerfil?: PortaDePerfil;
  readonly portaConta?: PortaDeConta;
  readonly portaArrotosDoPerfil?: PortaDeArrotosDoPerfil;
  readonly capturaDireta?: CapturaDeAudio;
  readonly autenticado?: boolean;
  readonly viewInicial?: 'feed' | 'emAlta' | 'seguindo' | 'auth' | 'perfil' | 'comunidade' | 'comunidades';
  readonly slugInicial?: string;
  readonly handleInicial?: string;
  readonly topicoIdInicial?: string;
  readonly abrirCompositor?: boolean;
  readonly aoEntrar?: () => void;
}

const DETALHES_PADRAO: Record<string, DetalhesDaComunidade> = {
  'arena-do-arroto': {
    title: 'r/arena-do-arroto',
    description: 'O ponto de encontro para quem coleciona sons, histórias e coragem desnecessária.',
    members: '42,8k',
    rules: [
      'Respeite quem está na roda.',
      'Publique conteúdo próprio ou autorizado.',
      'Sem humilhação, preconceito ou spam.',
      'Marcações de vídeo devem ser sinceras.',
    ],
    moderators: [
      ['u/barulhofausto', 'mestre da roda'],
      ['u/ana_tempo', 'guardião dos causos'],
      ['u/jota_m', 'mod de vídeo'],
    ],
  },
  'arroto-em-video': {
    title: 'r/arroto-em-video',
    description: 'Vídeos, duelos e momentos que pediam uma câmera ligada.',
    members: '18,2k',
    rules: [
      'Respeite quem está na roda.',
      'Vídeos devem ter relação com a comunidade.',
      'Sem spam.',
    ],
    moderators: [
      ['u/equipe_aue', 'moderação Auê'],
      ['u/jota_m', 'mod de vídeo'],
    ],
  },
};

class ErroDePublicacaoDoAnexo extends Error {}

function formatarMilhar(total?: number): string {
  if (!total) return '1';
  if (total >= 1000) {
    const inteiro = Math.floor(total / 1000);
    const decimal = Math.floor((total % 1000) / 100);
    return decimal > 0 ? `${inteiro},${decimal}k` : `${inteiro}k`;
  }
  return String(total);
}

export function InicioOpenDesign({
  portaForum,
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
}: Props) {
  const navigate = useNavigate();
  const params = useParams<{ slug?: string; handle?: string; id?: string }>();
  const slugParam = slugInicial ?? params.slug;
  const handleParam = handleInicial ?? params.handle;
  const topicoIdParam = topicoIdInicial ?? params.id;

  const [forum] = useState(() => portaForum ?? criarForumWeb());
  const [comunidadePort] = useState(() => portaComunidade ?? criarComunidadeWeb());
  const [perfilPort] = useState(() => portaPerfil ?? criarPerfilRemoto());
  const [contaPort] = useState(() => portaConta ?? criarContaWeb());
  const [arrotosPort] = useState(() => portaArrotosDoPerfil ?? criarArrotosDoPerfilRemoto());
  const [capturaDoArroto] = useState(() => capturaDireta ?? criarCapturaWeb());

  const [viewAtual, setViewAtual] = useState<'feed' | 'emAlta' | 'seguindo' | 'auth' | 'perfil' | 'comunidade' | 'comunidades'>(() => {
    if (viewInicial === 'auth' || viewInicial === 'perfil' || viewInicial === 'comunidades' || viewInicial === 'emAlta' || viewInicial === 'seguindo') return viewInicial;
    if (handleParam) return 'perfil';
    if (slugParam || topicoIdParam || viewInicial === 'comunidade') return 'comunidade';
    return 'feed';
  });

  const [comunidadeSlug, setComunidadeSlug] = useState(() => slugParam || 'arena-do-arroto');
  const [comunidadeAtiva, setComunidadeAtiva] = useState<ComunidadeDoForum | null>(null);
  const [regrasDaComunidade, setRegrasDaComunidade] = useState<readonly string[]>(() => {
    return DETALHES_PADRAO[comunidadeSlug]?.rules || [
      'Respeite quem está na roda.',
      'Publique conteúdo próprio ou autorizado.',
      'Sem humilhação, preconceito ou spam.',
    ];
  });
  const [moderadoresDaComunidade, setModeradoresDaComunidade] = useState<readonly (readonly [string, string])[]>(() => {
    return DETALHES_PADRAO[comunidadeSlug]?.moderators || [
      ['u/barulhofausto', 'mestre da roda'],
      ['u/ana_tempo', 'guardião dos causos'],
    ];
  });
  const [falhaComunidade, setFalhaComunidade] = useState(false);
  const [falhaTopico, setFalhaTopico] = useState(false);
  const [secaoComunidade, setSecaoComunidade] = useState<'causos' | 'sobre'>('causos');
  const [abaComunidade, setAbaComunidade] = useState<'Quentes' | 'Novos'>('Quentes');
  const [topicosDaComunidade, setTopicosDaComunidade] = useState<readonly ItemDoFeed[]>([]);

  // Perfil
  const [abaPerfil, setAbaPerfil] = useState<'posts' | 'arrotos' | 'salvos'>('posts');
  const [perfilAtivo, setPerfilAtivo] = useState<PerfilPublico | null>(null);
  const [causosDoPerfil, setCausosDoPerfil] = useState<readonly CausoPostado[]>([]);
  const [arrotosDoPerfil, setArrotosDoPerfil] = useState<readonly ArrotoDoPerfil[]>([]);
  const [estadoArrotosDoPerfil, setEstadoArrotosDoPerfil] = useState<'carregando' | 'pronto' | 'erro'>('carregando');
  const [estadoPerfil, setEstadoPerfil] = useState<'carregando' | 'pronto' | 'pendente' | 'inexistente' | 'erro'>('carregando');
  const [fichaSocialPendente, setFichaSocialPendente] = useState(false);
  const [estadoDaFicha, setEstadoDaFicha] = useState<'ocioso' | 'carregando' | 'pronto' | 'erro' | 'salvando'>('ocioso');
  const [ficha, setFicha] = useState<Required<Pick<DadosDoPerfil, 'apelido' | 'handle'>> & DadosDoPerfil>({ apelido: '', handle: '', bio: '', cidade: '' });
  const [erroDaFicha, setErroDaFicha] = useState('');
  const [estadoCausosDoPerfil, setEstadoCausosDoPerfil] = useState<'ocioso' | 'carregando' | 'pronto' | 'erro'>('ocioso');
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
  const [itensFeed, setItensFeed] = useState<readonly ItemDoFeed[]>([]);
  const [itensSeguindo, setItensSeguindo] = useState<readonly ItemDoFeed[]>([]);
  const [estadoSeguindo, setEstadoSeguindo] = useState<'ocioso' | 'carregando' | 'pronto' | 'erro' | 'semConta'>('ocioso');
  const [busca, setBusca] = useState('');
  const [abaOrdenacao, setAbaOrdenacao] = useState<'Quentes' | 'Novos' | 'Top'>('Quentes');

  // Interações
  const [salvosUsuario, setSalvosUsuario] = useState<Record<string, boolean>>({});
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
  const [modalGravarArrotoAberto, setModalGravarArrotoAberto] = useState(false);
  const [estadoGravacaoDireta, setEstadoGravacaoDireta] = useState<EstadoDaGravacaoDireta>('ocioso');
  const [audioDireto, setAudioDireto] = useState<AudioCapturado | null>(null);
  const [erroDaGravacaoDireta, setErroDaGravacaoDireta] = useState<string | null>(null);
  const [enviandoArrotoDireto, setEnviandoArrotoDireto] = useState(false);
  const [destinoFixoDaGravacao, setDestinoFixoDaGravacao] = useState<'perfil-proprio' | null>(null);
  const [modalComentariosAberto, setModalComentariosAberto] = useState(false);
  const [postComentariosAtivo, setPostComentariosAtivo] = useState<ItemDoFeed | null>(null);
  const [listaComentarios, setListaComentarios] = useState<readonly ItemComentario[]>([]);
  const [carregandoComentarios, setCarregandoComentarios] = useState(false);
  const [enviandoComentario, setEnviandoComentario] = useState(false);
  const [modalFundarAberto, setModalFundarAberto] = useState(false);
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

  // Carregar causos do perfil ativo
  useEffect(() => {
    let ativo = true;
    const alvo = perfilAtivo ?? meuPerfil;
    if (!alvo) return;
    setEstadoCausosDoPerfil('carregando');
    comunidadePort
      .listarFeed?.({ autorId: alvo.id, limite: 50 })
      .then((lista) => {
        if (!ativo) return;
        setCausosDoPerfil(lista ?? []);
        setEstadoCausosDoPerfil('pronto');
      })
      .catch(() => {
        if (ativo) {
          setCausosDoPerfil([]);
          setEstadoCausosDoPerfil('erro');
        }
      });
    return () => {
      ativo = false;
    };
  }, [perfilAtivo, meuPerfil, comunidadePort]);

  useEffect(() => {
    let ativo = true;
    const alvo = perfilAtivo ?? meuPerfil;
    if (!alvo) return;
    setEstadoArrotosDoPerfil('carregando');
    arrotosPort.listarArrotos(alvo.handle).then(
      (lista) => {
        if (!ativo) return;
        setArrotosDoPerfil(lista);
        setEstadoArrotosDoPerfil('pronto');
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
  }, [perfilAtivo, meuPerfil, arrotosPort]);

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

    const padrao = DETALHES_PADRAO[comunidadeSlug];
    if (padrao) {
      setRegrasDaComunidade(padrao.rules);
      setModeradoresDaComunidade(padrao.moderators);
    }

    const promessaComunidade = forum.obterComunidadeDoForum?.(comunidadeSlug);
    if (promessaComunidade && typeof promessaComunidade.then === 'function') {
      promessaComunidade
        .then((res) => {
          if (!ativo) return;
          if (res?.ok && res.valor) {
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

    const promessaTopicos = forum.listarTopicos?.(comunidadeSlug, {
      ordem: abaComunidade === 'Novos' ? 'recentes' : 'atividade',
    }) ?? Promise.resolve({ ok: false as const, motivo: 'falhou' as const });

    const promessaCausos =
      comunidadePort.listarFeed?.({ comunidadeSlug })?.catch?.(() => [] as readonly CausoPostado[]) ??
      Promise.resolve([] as readonly CausoPostado[]);

    Promise.all([promessaTopicos, promessaCausos]).then(async ([resTopicos, causos]) => {
      if (!ativo) return;
      const itens: ItemDoFeed[] = [];
      const anexosPorTopico = new Map<string, AnexoDoForum>();
      if (resTopicos?.ok && forum.listarAnexosDoForum) {
        const leitura = await forum.listarAnexosDoForum({ topicoIds: resTopicos.valor.itens.map((topico) => topico.id) });
        if (leitura.ok) leitura.valor.forEach((anexo) => anexosPorTopico.set(anexo.alvoId, anexo));
      }
      if (resTopicos?.ok) {
        for (const t of resTopicos.valor.itens) {
          const anexo = anexosPorTopico.get(t.id);
          const url = anexo?.caminho && forum.assinarAnexoDoForum
            ? await forum.assinarAnexoDoForum(anexo.caminho).then((resultado) => resultado.ok ? resultado.valor : undefined)
            : anexo?.urlVideo ?? undefined;
          itens.push({
            id: `topico-${t.id}`,
            tipo: 'topico',
            comunidadeSlug: t.comunidade.slug,
            titulo: t.titulo,
            corpo: t.corpo,
            autorNome: t.autor.apelido ?? (t.autor.handle ? `@${t.autor.handle}` : 'Anônimo'),
            autorHandle: t.autor.handle ?? undefined,
            autorAvatarUrl: t.autor.avatarUrl ?? undefined,
            criadoEm: t.criadoEm,
            votos: 1,
            respostasTotal: t.respostasTotal,
            temAudio: Boolean(t.audio?.resultadoId || t.audio?.caminhoDoAudio),
            anexo: anexo ? { tipo: anexo.tipo, url, duracaoMs: anexo.duracaoMs } : undefined,
          });
        }
      }
      for (const c of causos) {
        if (!itens.some((it) => it.id === `causo-${c.id}`)) {
          itens.push({
            id: `causo-${c.id}`,
            tipo: 'causo',
            comunidadeSlug: c.comunidadeSlug,
            titulo: c.conteudo.slice(0, 72) + (c.conteudo.length > 72 ? '…' : ''),
            corpo: c.conteudo,
            autorNome: c.autorNome,
            autorHandle: c.autorHandle,
            autorAvatarUrl: c.autorAvatarUrl ?? undefined,
            criadoEm: c.criadoEm,
            votos: c.curtidas,
            respostasTotal: c.totalComentarios,
            temAudio: c.temAudio,
            enderecoDoAudio: c.enderecoDoAudio,
            nota: c.nota,
            videoUrl: c.videoUrl,
          });
        }
      }
      setTopicosDaComunidade(itens);
    });

    return () => {
      ativo = false;
    };
  }, [comunidadeSlug, forum, comunidadePort, abaComunidade]);

  // Carregar tópico específico via URL direta (/c/:slug/t/:id)
  useEffect(() => {
    let ativo = true;
    if (!topicoIdParam) return;

    const promessa = forum.obterTopico?.(topicoIdParam);
    if (!promessa) {
      setFalhaTopico(true);
      return;
    }

    promessa
      .then(async (res) => {
        if (!ativo) return;
        if (res.ok && res.valor) {
          const t = res.valor;
          let anexoItem: ItemDoFeed['anexo'] = undefined;
          if (forum.listarAnexosDoForum) {
            const leituraAnexo = await forum.listarAnexosDoForum({ topicoIds: [t.id] });
            if (leituraAnexo.ok && leituraAnexo.valor[0]) {
              const a = leituraAnexo.valor[0];
              const url = a.caminho && forum.assinarAnexoDoForum
                ? await forum.assinarAnexoDoForum(a.caminho).then((resultado) => resultado.ok ? resultado.valor : undefined)
                : a.urlVideo ?? undefined;
              anexoItem = { tipo: a.tipo, url, duracaoMs: a.duracaoMs };
            }
          }
          const post: ItemDoFeed = {
            id: `topico-${t.id}`,
            tipo: 'topico',
            comunidadeSlug: t.comunidade.slug,
            titulo: t.titulo,
            corpo: t.corpo,
            autorNome: t.autor.apelido ?? (t.autor.handle ? `@${t.autor.handle}` : 'Anônimo'),
            autorHandle: t.autor.handle ?? undefined,
            autorAvatarUrl: t.autor.avatarUrl ?? undefined,
            criadoEm: t.criadoEm,
            votos: 1,
            respostasTotal: t.respostasTotal,
            temAudio: Boolean(t.audio?.resultadoId || t.audio?.caminhoDoAudio),
            anexo: anexoItem,
          };
          setPostComentariosAtivo(post);
          void abrirComentarios(post);
        } else {
          setFalhaTopico(true);
        }
      })
      .catch(() => {
        if (ativo) setFalhaTopico(true);
      });

    return () => {
      ativo = false;
    };
  }, [topicoIdParam, forum]);

  // Carregar feed geral e lista de comunidades
  useEffect(() => {
    let ativo = true;
    Promise.all([
      forum.listarComunidadesDoForum(),
      forum.explorarTopicos({ limite: 30 }),
      comunidadePort.listarFeed({ limite: 30 }).catch(() => [] as readonly CausoPostado[]),
    ])
      .then(async ([resComunidades, resTopicos, causos]) => {
        if (!ativo) return;
        const listaComunidades = resComunidades.ok ? resComunidades.valor : [];
        setComunidades(listaComunidades);

        const itens: ItemDoFeed[] = [];
        if (resTopicos.ok) {
          const anexosPorTopico = new Map<string, AnexoDoForum>();
          if (forum.listarAnexosDoForum) {
            const leituraAnexos = await forum.listarAnexosDoForum({
              topicoIds: resTopicos.valor.itens.map((topico) => topico.id),
            });
            if (leituraAnexos.ok) {
              leituraAnexos.valor.forEach((anexo) => anexosPorTopico.set(anexo.alvoId, anexo));
            }
          }
          if (!ativo) return;
          for (const t of resTopicos.valor.itens) {
            const anexo = anexosPorTopico.get(t.id);
            const url = anexo?.caminho && forum.assinarAnexoDoForum
              ? await forum.assinarAnexoDoForum(anexo.caminho).then((resultado) => resultado.ok ? resultado.valor : undefined)
              : anexo?.urlVideo ?? undefined;
            if (!ativo) return;
            itens.push({
              id: `topico-${t.id}`,
              tipo: 'topico',
              comunidadeSlug: t.comunidade.slug,
              titulo: t.titulo,
              corpo: '',
              autorNome: t.autor.apelido ?? t.autor.handle ?? 'Anônimo',
              autorHandle: t.autor.handle ?? undefined,
              autorAvatarUrl: t.autor.avatarUrl ?? undefined,
              criadoEm: t.criadoEm,
              votos: Math.max(1, t.respostasTotal * 3),
              respostasTotal: t.respostasTotal,
              anexo: anexo ? { tipo: anexo.tipo, url, duracaoMs: anexo.duracaoMs } : undefined,
            });
          }
        }
        for (const c of causos) {
          itens.push({
            id: `causo-${c.id}`,
            tipo: 'causo',
            comunidadeSlug: c.comunidadeSlug || 'arena-do-arroto',
            titulo: c.conteudo.slice(0, 65) + (c.conteudo.length > 65 ? '…' : ''),
            corpo: c.conteudo,
            autorNome: c.autorNome,
            autorHandle: c.autorHandle,
            autorAvatarUrl: c.autorAvatarUrl ?? undefined,
            criadoEm: c.criadoEm || new Date().toISOString(),
            votos: c.nota ? Math.round(c.nota) : 1,
            respostasTotal: c.totalComentarios || 0,
            temAudio: c.temAudio,
            enderecoDoAudio: c.enderecoDoAudio,
            nota: c.nota,
            videoUrl: c.videoUrl,
          });
        }
        setItensFeed(itens);
      })
      .catch(() => {});

    return () => {
      ativo = false;
    };
  }, [forum, comunidadePort]);

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
          comunidadeSlug: causo.comunidadeSlug || 'arena-do-arroto',
          titulo: causo.conteudo.slice(0, 65) + (causo.conteudo.length > 65 ? '…' : ''),
          corpo: causo.conteudo,
          autorNome: causo.autorNome,
          autorHandle: causo.autorHandle,
          criadoEm: causo.criadoEm || new Date().toISOString(),
          votos: causo.nota ? Math.round(causo.nota) : 1,
          respostasTotal: causo.totalComentarios || 0,
          temAudio: causo.temAudio,
          enderecoDoAudio: causo.enderecoDoAudio,
          nota: causo.nota,
          videoUrl: causo.videoUrl,
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
        if (pedido === pedidoDeAudioAtual.current) setAudioTocandoId(chave);
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
      if (pedido === pedidoDeAudioAtual.current) setAudioTocandoId(chave ?? url);
      else audio.pause();
    } catch {
      if (pedido === pedidoDeAudioAtual.current) setAudioTocandoId(null);
    }
  };

  const interagirNoPost = async (id: string, tipo: 'curtir' | 'fogo' | 'nojo' | 'trofeu') => {
    if (!estaAutenticado) {
      exibirToast('Entre na sua conta para reagir.');
      (aoEntrar ?? (() => setViewAtual('auth')))();
      return;
    }
    if (!id.startsWith('causo-')) return;
    const causoId = id.replace('causo-', '');
    const resultado = tipo === 'curtir'
      ? await comunidadePort.alternarCurtida(causoId)
      : await comunidadePort.alternarReacao(causoId, tipo);
    if (!resultado.ok) {
      exibirToast('Não deu para registrar sua reação agora.');
      return;
    }
    exibirToast(tipo === 'curtir' ? 'Curtida atualizada.' : 'Reação enviada.');
  };

  const acoesDeReacao = (post: ItemDoFeed) => post.tipo === 'causo'
    ? {
        aoCurtir: () => void interagirNoPost(post.id, 'curtir'),
        aoReagir: (tipo: 'fogo' | 'nojo' | 'trofeu') => void interagirNoPost(post.id, tipo),
      }
    : {};

  const alternarSalvo = (id: string) => {
    setSalvosUsuario((prev) => ({ ...prev, [id]: !prev[id] }));
    exibirToast(salvosUsuario[id] ? 'Removido dos salvos.' : 'Salvo na sua conta.');
  };

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

  const alternarEntrarComunidade = (slug: string) => {
    const jaEntrou = Boolean(comunidadesEntradas[slug]);
    setComunidadesEntradas((prev) => ({ ...prev, [slug]: !jaEntrou }));
    exibirToast(jaEntrou ? 'Você saiu da comunidade.' : 'Você entrou na comunidade.');
    if (jaEntrou) {
      comunidadePort.sairComunidade?.(slug).catch(() => {});
    } else {
      comunidadePort.entrarComunidade?.(slug).catch(() => {});
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
          navigate('/');
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

  const abrirComentarios = async (post: ItemDoFeed) => {
    // Se a thread deste post já estiver aberta, fecha (recolhe)
    if (postComentariosAtivo?.id === post.id) {
      setPostComentariosAtivo(null);
      setModalComentariosAberto(false);
      setListaComentarios([]);
      return;
    }

    setPostComentariosAtivo(post);
    setCarregandoComentarios(true);
    setListaComentarios([]);

    try {
      if (post.tipo === 'topico') {
        const topicoId = post.id.replace('topico-', '');
        const res = await forum.listarRespostasDoTopico?.(topicoId);
        if (res && res.ok) {
          const anexos = forum.listarAnexosDoForum
            ? await forum.listarAnexosDoForum({ respostaIds: res.valor.itens.map((resposta) => resposta.id) })
            : null;
          const anexosPorResposta = new Map((anexos?.ok ? anexos.valor : []).map((anexo) => [anexo.alvoId, anexo]));
          setListaComentarios(
            await Promise.all(res.valor.itens.map(async (r) => {
              const anexo = anexosPorResposta.get(r.id);
              const url = anexo?.caminho && forum.assinarAnexoDoForum
                ? await forum.assinarAnexoDoForum(anexo.caminho).then((resultado) => resultado.ok ? resultado.valor : undefined)
                : anexo?.urlVideo ?? undefined;
              return {
                id: r.id,
                autorNome: r.autor?.apelido ?? (r.autor?.handle ? `@${r.autor.handle}` : 'Anônimo'),
                autorHandle: r.autor?.handle ?? undefined,
                autorAvatarUrl: r.autor?.avatarUrl ?? undefined,
                conteudo: r.corpo ?? '',
                criadoEm: r.criadoEm,
                paiId: r.paiId,
                nivel: r.nivel,
                anexo: anexo ? { tipo: anexo.tipo, url, duracaoMs: anexo.duracaoMs } : undefined,
              };
            })),
          );
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
        anexo: dados.anexo
          ? {
              tipo: dados.anexo.tipo,
              url: dados.anexo.tipo === 'videoExterno' ? dados.anexo.url : URL.createObjectURL(dados.anexo.arquivo),
              duracaoMs: dados.anexo.tipo === 'audio' ? dados.anexo.duracaoMs : undefined,
            }
          : undefined,
      };

      setListaComentarios((prev) => [...prev, novoComentario]);

      const incrementar = (itens: readonly ItemDoFeed[]) =>
        itens.map((it) =>
          it.id === postComentariosAtivo.id
            ? { ...it, respostasTotal: it.respostasTotal + 1 }
            : it,
        );

      setItensFeed(incrementar);
      setTopicosDaComunidade(incrementar);
      exibirToast('Comentário publicado na roda!');
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

  const publicarPost = async (dados: { corpo: string; comunidadeSlug: string; anexo: AnexoRascunho | null }): Promise<boolean> => {
    const meuNome = meuPerfil?.apelido ?? 'Você';
    const meuHandle = meuPerfil?.handle;
    let postCriadoId = `topico-${Date.now()}`;

    try {
      const resForum = await forum.criarTopico?.({
        comunidadeSlug: dados.comunidadeSlug,
        corpo: dados.corpo,
        anexo: await prepararAnexo(dados.anexo),
      });
      if (resForum && resForum.ok) {
        postCriadoId = `topico-${resForum.valor.id}`;
      } else {
        exibirToast('Não foi possível publicar agora. Entre na comunidade e tente de novo.');
        return false;
      }
    } catch (erro) {
      exibirToast(erro instanceof ErroDePublicacaoDoAnexo ? erro.message : 'Não foi possível publicar agora.');
      return false;
    }

    exibirToast('Publicado com sucesso.');

    const novoItem: ItemDoFeed = {
      id: postCriadoId,
      tipo: 'topico',
      comunidadeSlug: dados.comunidadeSlug,
      titulo: dados.corpo || (dados.anexo?.tipo === 'imagem' ? 'Imagem na roda' : dados.anexo?.tipo === 'audio' ? 'Áudio na roda' : 'Vídeo na roda'),
      corpo: dados.corpo,
      autorNome: meuNome,
      autorHandle: meuHandle,
      criadoEm: new Date().toISOString(),
      votos: 1,
      respostasTotal: 0,
      anexo: dados.anexo
        ? {
            tipo: dados.anexo.tipo,
            url: dados.anexo.tipo === 'videoExterno' ? dados.anexo.url : URL.createObjectURL(dados.anexo.arquivo),
            duracaoMs: dados.anexo.tipo === 'audio' ? dados.anexo.duracaoMs : undefined,
          }
        : undefined,
    };

    setItensFeed((prev) => [novoItem, ...prev]);
    setTopicosDaComunidade((prev) => [novoItem, ...prev]);
    setCausosDoPerfil((prev) => [
      {
        id: postCriadoId,
        comunidadeId: '1',
        comunidadeSlug: dados.comunidadeSlug,
        autorNome: meuNome,
        autorHandle: meuHandle,
        conteudo: dados.corpo || 'Post na comunidade',
        criadoEm: new Date().toISOString(),
        reacoes: { fogo: 0, nojo: 0, trofeu: 0 },
        curtidas: 0,
        curtidoPorMim: false,
        reposts: 0,
        repostadoPorMim: false,
        totalComentarios: 0,
        meu: true,
      },
      ...prev,
    ]);
    return true;
  };

  const fundarNovaComunidade = async (dados: { nome: string; slug: string; descricao: string }) => {
    exibirToast(`Comunidade r/${dados.slug} fundada!`);
    setComunidadeSlug(dados.slug);
    setViewAtual('comunidade');
    navigate(`/c/${dados.slug}`);
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

  const compartilharPerfil = async () => {
    if (!navigator.clipboard?.writeText) {
      exibirToast('Seu navegador não liberou a cópia do link.');
      return;
    }
    try {
      await navigator.clipboard.writeText(window.location.href);
      exibirToast('Link copiado.');
    } catch {
      exibirToast('Não foi possível copiar o link agora.');
    }
  };

  const abrirGravacaoDireta = (opcoes?: { readonly destinoFixo?: 'perfil-proprio' }) => {
    if (!estaAutenticado) {
      (aoEntrar ?? (() => setViewAtual('auth')))();
      return;
    }
    setAudioDireto(null);
    setErroDaGravacaoDireta(null);
    setEstadoGravacaoDireta('ocioso');
    setDestinoFixoDaGravacao(opcoes?.destinoFixo ?? null);
    setModalGravarArrotoAberto(true);
  };

  const fecharGravacaoDireta = () => {
    capturaDoArroto.soltar();
    setModalGravarArrotoAberto(false);
    setEstadoGravacaoDireta('ocioso');
    setAudioDireto(null);
    setErroDaGravacaoDireta(null);
    setDestinoFixoDaGravacao(null);
  };

  const iniciarGravacaoDireta = async () => {
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
  };

  const pararGravacaoDireta = async () => {
    const resultado = await capturaDoArroto.parar();
    if ('motivo' in resultado) {
      setEstadoGravacaoDireta('erro');
      setErroDaGravacaoDireta('A gravação não saiu inteira. Tente de novo.');
      return;
    }
    setAudioDireto(resultado);
    setEstadoGravacaoDireta('pronto');
  };

  const enviarArrotoDireto = async (destino: DestinoDoArrotoDireto) => {
    if (!audioDireto) throw new Error('Grave o arroto antes de enviar.');
    if (destino.tipo === 'comunidade') {
      throw new Error('Publicação em comunidade ainda não está pronta para áudio direto.');
    }
    setEnviandoArrotoDireto(true);
    try {
      const preparo = destino.tipo === 'perfil-marcado'
        ? await arrotosPort.prepararArroto(destino.handle)
        : await arrotosPort.prepararArroto();
      if (!preparo.ok) {
        throw new Error(
          preparo.motivo === 'destinoInexistente'
            ? 'Esse @ não está na roda.'
            : preparo.motivo === 'semConta'
              ? 'Entre na sua conta antes de enviar um arroto.'
              : 'Não deu para preparar o envio agora.',
        );
      }
      const publicado = await arrotosPort.publicarArroto(
        preparo.rascunho,
        audioDireto.dados,
        audioDireto.duracaoMs / 1000,
      );
      if (!publicado.ok) {
        const mensagem = publicado.motivo === 'formatoInvalido'
          ? 'Seu navegador gravou num formato que ainda não conseguimos enviar.'
          : publicado.motivo === 'grandeDemais'
            ? 'Esse áudio passou de 12 MB.'
            : publicado.motivo === 'duracaoInvalida'
              ? 'A gravação precisa ter até 90 segundos.'
              : 'Não foi possível enviar. Seu arroto não foi publicado.';
        throw new Error(mensagem);
      }
      setArrotosDoPerfil((anteriores) => (
        perfilExibido?.id === publicado.arroto.perfilId ? [publicado.arroto, ...anteriores] : anteriores
      ));
      exibirToast(
        destino.tipo === 'perfil-marcado'
          ? `Arroto enviado para @${preparo.rascunho.perfilDestinoHandle}.`
          : 'Arroto guardado no seu perfil.',
      );
      fecharGravacaoDireta();
      if (destino.tipo === 'perfil-marcado') {
        navigate(`/u/${preparo.rascunho.perfilDestinoHandle}`);
      }
    } finally {
      setEnviandoArrotoDireto(false);
    }
  };

  // Filtragem de posts
  const postsFiltrados = itensFeed
    .filter((p) => {
      if (!busca.trim()) return true;
      const t = busca.toLowerCase();
      return p.titulo.toLowerCase().includes(t) || p.comunidadeSlug.toLowerCase().includes(t);
    })
    .sort((a, b) => {
      if (abaOrdenacao === 'Novos') return new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime();
      if (abaOrdenacao === 'Top') return b.votos - a.votos;
      return b.votos - a.votos;
    });

  const postsSeguindo = itensSeguindo
    .filter((p) => {
      if (!busca.trim()) return true;
      const termo = busca.toLowerCase();
      return p.titulo.toLowerCase().includes(termo) || p.comunidadeSlug.toLowerCase().includes(termo);
    })
    .sort((a, b) => new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime());

  const postsEmAlta = itensFeed
    .filter((p) => {
      if (!busca.trim()) return true;
      const termo = busca.toLowerCase();
      return p.titulo.toLowerCase().includes(termo) || p.comunidadeSlug.toLowerCase().includes(termo);
    })
    .sort((a, b) => b.votos - a.votos);

  const perfilExibido = perfilAtivo ?? meuPerfil;
  const donoDoPerfil = Boolean(perfilExibido?.souEu);
  const iniciaisDoPerfil = perfilExibido?.apelido
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0]?.toUpperCase())
    .join('') ?? '';

  return (
    <div className={`app${viewAtual === 'auth' ? ' app--auth' : ''}`}>
      {viewAtual !== 'auth' && <BarraLateral
        viewAtual={viewAtual}
        comunidadeAtivaSlug={comunidadeSlug}
        comunidades={comunidades}
        estaAutenticado={estaAutenticado}
        aoMudarView={(v, s) => {
          setViewAtual(v);
          if (s) setComunidadeSlug(s);
        }}
        aoAbrirCompositor={abrirGravacaoDireta}
        aoAbrirFundar={() => setModalFundarAberto(true)}
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
        />}

        {/* ==================== VIEW: THREAD DE COMENTÁRIOS (PADRÃO TWITTER / FORA DO CARD) ==================== */}
        {postComentariosAtivo ? (
          <ThreadDeComentarios
            post={postComentariosAtivo}
            comentarios={listaComentarios}
            carregando={carregandoComentarios}
            enviando={enviandoComentario}
            criarGravacao={forum.criarGravacaoLivreDoForum}
            aoVoltar={() => {
              setPostComentariosAtivo(null);
              setListaComentarios([]);
              if (topicoIdParam) {
                navigate(`/c/${comunidadeSlug}`);
              }
            }}
            aoEnviarComentario={enviarComentario}
            {...acoesDeReacao(postComentariosAtivo)}
            aoAlternarSalvar={() => alternarSalvo(postComentariosAtivo.id)}
            aoTocarAudio={(fonte) => void alternarAudio(fonte, postComentariosAtivo.id)}
            salvo={Boolean(salvosUsuario[postComentariosAtivo.id])}
            audioTocando={audioTocandoId === postComentariosAtivo.id}
            tempoAtualDoAudio={audioSelecionadoId === postComentariosAtivo.id ? tempoAtualDoAudio : 0}
            duracaoDoAudio={audioSelecionadoId === postComentariosAtivo.id ? duracaoDoAudio : null}
          />
        ) : (
          <>
            {/* ==================== VIEW: FEED PRINCIPAL ==================== */}
            {viewAtual === 'feed' && (
          <section aria-label="Feed principal">
            <div className="hero">
              <span className="eyebrow">Rede social de arrotadores</span>
              <h1>A comunidade dos arrotadores.</h1>
              <p>Solte seu melhor som, receba a nota do algoritmo e desafie quem você quiser.</p>
              {!estaAutenticado && (
                <button
                  className="inicio-open__visitante"
                  type="button"
                  style={{ marginTop: 16 }}
                  onClick={aoEntrar ?? (() => setViewAtual('auth'))}
                >
                  Você está só olhando. Entre para participar.
                </button>
              )}
            </div>

            <div className="feed-head">
              <h2>Em destaque</h2>
              <div className="tabs" role="tablist" aria-label="Abas do feed">
                {(['Quentes', 'Novos', 'Top'] as const).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    className={`tab ${abaOrdenacao === tab ? 'active' : ''}`}
                    onClick={() => setAbaOrdenacao(tab)}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {abaOrdenacao !== 'Quentes' && (
              <div style={{ color: 'var(--aue-muted)', fontSize: 13, marginBottom: 12, fontWeight: 700 }}>
                Comunidade · {abaOrdenacao}
              </div>
            )}

            <div className="composer">
              <button type="button" onClick={() => setModalCompositorAberto(true)}>
                Solte seu arroto ou conte seu causo…
              </button>
            </div>

            <div className="feed">
              {postsFiltrados.length === 0 && (
                <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--aue-muted)' }}>
                  <p>Sem posts por aqui ainda. Seja o primeiro a soltar um!</p>
                  <AdsterraNativeBanner />
                </div>
              )}
              {postsFiltrados.map((post, idx) => {
                const exibirBannerAqui =
                  postsFiltrados.length >= 3
                    ? idx === 2
                    : idx === postsFiltrados.length - 1;

                return (
                  <div key={post.id}>
                    <CardDoPost
                      post={post}
                      {...acoesDeReacao(post)}
                      salvo={Boolean(salvosUsuario[post.id])}
                      audioTocando={audioTocandoId === post.id}
                      tempoAtualDoAudio={audioSelecionadoId === post.id ? tempoAtualDoAudio : 0}
                      duracaoDoAudio={audioSelecionadoId === post.id ? duracaoDoAudio : null}
                      aoAlternarSalvar={() => alternarSalvo(post.id)}
                      aoTocarAudio={(fonte) => void alternarAudio(fonte, post.id)}
                      aoAbrirComentarios={() => void abrirComentarios(post)}
                      {...propsDeComentariosDoPost(post)}
                    />
                    {exibirBannerAqui && <AdsterraNativeBanner />}
                  </div>
                );
              })}
            </div>

            <footer style={{ marginTop: 32, borderTop: '1px solid var(--aue-line)', paddingTop: 16 }}>
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

        {viewAtual === 'emAlta' && (
          <section aria-label="Causos em alta">
            <div className="hero">
              <span className="eyebrow">O que está fervendo</span>
              <h1>Em alta</h1>
              <p>Os causos e tópicos que mais estão movimentando as rodas.</p>
            </div>
            {postsEmAlta.length === 0 ? (
              <section className="od-profile__state">
                <h2>A roda está quieta agora.</h2>
                <p>Quando alguém movimentar o Bonde, o que estiver em alta aparece aqui.</p>
              </section>
            ) : (
              <div className="feed">
                {postsEmAlta.map((post) => (
                  <CardDoPost
                    key={post.id}
                    post={post}
                    {...acoesDeReacao(post)}
                    salvo={Boolean(salvosUsuario[post.id])}
                    audioTocando={audioTocandoId === post.id}
                    tempoAtualDoAudio={audioSelecionadoId === post.id ? tempoAtualDoAudio : 0}
                    duracaoDoAudio={audioSelecionadoId === post.id ? duracaoDoAudio : null}
                    aoAlternarSalvar={() => alternarSalvo(post.id)}
                    aoTocarAudio={(fonte) => void alternarAudio(fonte, post.id)}
                    aoAbrirComentarios={() => void abrirComentarios(post)}
                    {...propsDeComentariosDoPost(post)}
                  />
                ))}
              </div>
            )}
          </section>
        )}

        {viewAtual === 'seguindo' && (
          <section aria-label="Feed de quem você segue">
            <div className="hero">
              <span className="eyebrow">Seu bonde</span>
              <h1>Seguindo</h1>
              <p>Os causos de quem você escolheu acompanhar.</p>
            </div>
            {estadoSeguindo === 'semConta' && (
              <section className="od-profile__state"><h2>Entre para ver seu bonde.</h2><p>Você precisa de uma conta para acompanhar outros arrotadores.</p><button className="tab" type="button" onClick={aoEntrar ?? (() => setViewAtual('auth'))}>Entrar</button></section>
            )}
            {estadoSeguindo === 'carregando' && <p className="od-profile__muted">Carregando seu bonde…</p>}
            {estadoSeguindo === 'erro' && <section className="od-profile__state"><h2>Não deu para abrir seu bonde.</h2><p>Tenta de novo quando a conexão voltar.</p><button className="tab" type="button" onClick={() => setViewAtual('feed')}>Voltar ao início</button></section>}
            {estadoSeguindo === 'pronto' && postsSeguindo.length === 0 && <section className="od-profile__state"><h2>Seu bonde ainda está quieto.</h2><p>Siga alguns perfis para ver os causos deles aqui.</p><button className="tab" type="button" onClick={() => { setViewAtual('feed'); navigate('/'); }}>Explorar o Bonde</button></section>}
            {estadoSeguindo === 'pronto' && postsSeguindo.length > 0 && <div className="feed">{postsSeguindo.map((post) => <CardDoPost key={post.id} post={post} {...acoesDeReacao(post)} salvo={Boolean(salvosUsuario[post.id])} audioTocando={audioTocandoId === post.id} tempoAtualDoAudio={audioSelecionadoId === post.id ? tempoAtualDoAudio : 0} duracaoDoAudio={audioSelecionadoId === post.id ? duracaoDoAudio : null} aoAlternarSalvar={() => alternarSalvo(post.id)} aoTocarAudio={(fonte) => void alternarAudio(fonte, post.id)} aoAbrirComentarios={() => void abrirComentarios(post)} {...propsDeComentariosDoPost(post)} />)}</div>}
          </section>
        )}

        {/* ==================== VIEW: COMUNIDADE ESPECÍFICA ==================== */}
        {viewAtual === 'comunidade' && (
          <section aria-label={`Comunidade r/${comunidadeSlug}`}>
            {falhaTopico ? (
              <div className="panel" style={{ padding: 24 }}>
                <p>Deu ruim pra carregar o tópico.</p>
              </div>
            ) : falhaComunidade ? (
              <div className="panel" style={{ padding: 24 }}>
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
                    <div style={{ fontWeight: 700, fontSize: 18 }}>{comunidadeAtiva?.nome || `r/${comunidadeSlug}`}</div>
                    <div style={{ color: 'var(--aue-muted)', fontSize: 13 }}>{formatarMilhar(comunidadeAtiva?.membrosTotal)} membros</div>
                  </div>
                </div>

                <div className="community-hero" style={{ marginBottom: 16 }}>
                  <div
                    style={{
                      height: 130,
                      background: comunidadeAtiva?.capaUrl
                        ? `url("${comunidadeAtiva.capaUrl}") center/cover no-repeat`
                        : 'linear-gradient(135deg, #1f232b 0%, #16181d 100%)',
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
                        background: (comunidadeAtiva?.avatarUrl ?? comunidadeAtiva?.icone)
                          ? `url("${comunidadeAtiva?.avatarUrl ?? comunidadeAtiva?.icone}") center/cover no-repeat`
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
                      {!(comunidadeAtiva?.avatarUrl ?? comunidadeAtiva?.icone) && (
                        <span style={{ fontFamily: 'var(--font-display, Anton)', fontSize: 32, lineHeight: 1, color: 'var(--aue-accent, #c6ff00)' }}>
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
                        <h1 style={{ margin: 0, fontSize: 24 }}>r/{comunidadeSlug}</h1>
                        <span style={{ color: 'var(--aue-accent)', fontSize: 13, fontWeight: 800 }}>
                          ◎ {formatarMilhar(comunidadeAtiva?.membrosTotal)} na roda
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                        <button
                          id="joinCommunity"
                          type="button"
                          className="join"
                          style={{ padding: '8px 18px', fontSize: 13 }}
                          onClick={() => alternarEntrarComunidade(comunidadeSlug)}
                        >
                          {comunidadesEntradas[comunidadeSlug] ? 'Entrou' : 'Entrar'}
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
                          onClick={() => setModalCompositorAberto(true)}
                        >
                          + Soltar arroto na roda
                        </button>
                      </div>
                    </div>
                    <p style={{ color: 'var(--aue-muted)', margin: '10px 0 0', fontSize: 14 }}>
                      {comunidadeAtiva?.descricao ||
                        DETALHES_PADRAO[comunidadeSlug]?.description ||
                        'O ponto de encontro para quem coleciona sons, histórias e coragem desnecessária.'}
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
                    <div className="panel" style={{ background: 'var(--aue-surface-2)', marginBottom: 16 }}>
                      <strong style={{ fontSize: 13 }}>Antes de soltar: leia as regras da comunidade.</strong>
                    </div>

                    <div className="community-feed">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                        <h2 style={{ fontSize: 18, margin: 0 }}>Feed da comunidade</h2>
                        <div className="tabs">
                          <button
                            type="button"
                            className={`tab ${abaComunidade === 'Quentes' ? 'active' : ''}`}
                            onClick={() => setAbaComunidade('Quentes')}
                          >
                            Quentes
                          </button>
                          <button
                            type="button"
                            className={`tab ${abaComunidade === 'Novos' ? 'active' : ''}`}
                            onClick={() => setAbaComunidade('Novos')}
                          >
                            Novos
                          </button>
                        </div>
                      </div>
                      {topicosDaComunidade.map((post) => (
                        <CardDoPost
                          key={post.id}
                          post={post}
                          {...acoesDeReacao(post)}
                          salvo={Boolean(salvosUsuario[post.id])}
                          audioTocando={audioTocandoId === post.id}
                          tempoAtualDoAudio={audioSelecionadoId === post.id ? tempoAtualDoAudio : 0}
                          duracaoDoAudio={audioSelecionadoId === post.id ? duracaoDoAudio : null}
                          aoAlternarSalvar={() => alternarSalvo(post.id)}
                          aoTocarAudio={(fonte) => void alternarAudio(fonte, post.id)}
                          aoAbrirComentarios={() => void abrirComentarios(post)}
                          {...propsDeComentariosDoPost(post)}
                        />
                      ))}
                    </div>
                  </>
                )}

                {secaoComunidade === 'sobre' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div className="panel" style={{ padding: 20 }}>
                      <h2 style={{ margin: '0 0 12px', fontSize: 18 }}>Regras rápidas</h2>
                      <ol style={{ margin: 0, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 8, fontSize: 14, color: 'var(--aue-fg)' }}>
                        {regrasDaComunidade.map((regra, i) => (
                          <li key={i}>{regra}</li>
                        ))}
                      </ol>
                    </div>
                    <div className="panel" style={{ padding: 20 }}>
                      <h2 style={{ margin: '0 0 12px', fontSize: 18 }}>Moderadores</h2>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
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
          <section aria-label="Diretório de comunidades">
            <div style={{ marginBottom: 20 }}>
              <span className="eyebrow">Rodas do Auê</span>
              <h1 style={{ margin: '6px 0 10px' }}>Comunidades</h1>
              <p style={{ color: 'var(--aue-muted)', margin: 0 }}>
                Explore as rodas de arrotadores ou funde a sua própria turma.
              </p>
              <button
                type="button"
                className="submit"
                style={{ float: 'none', marginTop: 14 }}
                onClick={() => setModalFundarAberto(true)}
              >
                + Fundar comunidade
              </button>
            </div>

            <div style={{ display: 'grid', gap: 12 }}>
              {comunidades.map((c) => (
                <div key={c.id} className="post" style={{ display: 'flex', padding: 18, alignItems: 'center' }}>
                  <div style={{ flex: 1 }}>
                    <Link
                      to={`/c/${c.slug}`}
                      onClick={() => {
                        setComunidadeSlug(c.slug);
                        setViewAtual('comunidade');
                      }}
                      style={{ textDecoration: 'none', color: 'inherit' }}
                    >
                      <h3 style={{ margin: '0 0 4px', fontSize: 18 }}>r/{c.slug}</h3>
                      <p style={{ margin: 0, color: 'var(--aue-muted)', fontSize: 13 }}>
                        {c.descricao || 'Roda oficial da comunidade Auê.'}
                      </p>
                    </Link>
                  </div>
                  <button
                    type="button"
                    className="join"
                    style={{ padding: '8px 16px', fontSize: 13 }}
                    onClick={() => alternarEntrarComunidade(c.slug)}
                  >
                    {comunidadesEntradas[c.slug] ? 'Entrou' : 'Entrar'}
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ==================== VIEW: PERFIL ==================== */}
        {viewAtual === 'perfil' && (
          <section className="od-profile" aria-label="Perfil do usuário">
            {estadoPerfil === 'carregando' && (
              <section className="od-profile__state" aria-live="polite">
                <h1>Abrindo perfil…</h1><p>Buscando a ficha desta pessoa na roda.</p>
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
                <h1>Esse @ não está na roda.</h1>
                <p>O perfil pode ter mudado de nome ou não existir.</p>
                <Link className="tab od-profile__button" to="/">Voltar para o Bonde</Link>
              </section>
            )}

            {estadoPerfil === 'pendente' && (
              fichaSocialPendente ? (
                <section className="od-profile__state od-profile__onboarding" aria-live="polite">
                  <p className="od-profile__eyebrow">Primeira chegada</p>
                  <h1>Termina sua ficha.</h1>
                  <p>Seu apelido e @ liberam o Bonde. Bio, cidade e redes são opcionais.</p>
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
                      <button type="submit" className="join od-profile__button" disabled={estadoDaFicha === 'salvando'}>{estadoDaFicha === 'salvando' ? 'Salvando…' : 'Entrar no Bonde'}</button>
                    </form>
                  )}
                </section>
              ) : (
                <section className="od-profile__state">
                  <h1>Sua ficha ainda não está pronta.</h1>
                  <p>Entre na conta e escolha seu nome e @ antes de participar das rodas.</p>
                  <Link className="join od-profile__button" to="/login">Entrar na conta</Link>
                </section>
              )
            )}

            {estadoPerfil === 'pronto' && perfilExibido && (
              <>
                <article className="od-profile__hero">
                  <div
                    className={`od-profile__cover${perfilExibido.capaUrl ? ' od-profile__cover--photo' : ''}`}
                    style={perfilExibido.capaUrl ? { backgroundImage: `url("${perfilExibido.capaUrl}")` } : undefined}
                    aria-label={perfilExibido.capaUrl ? `Capa de ${perfilExibido.apelido}` : 'Capa neutra do perfil'}
                  >
                    {!perfilExibido.capaUrl && <span>AUÊ!</span>}
                    {donoDoPerfil && (
                      <div className="od-profile__cover-actions">
                        <button type="button" className="od-profile__cover-action" onClick={() => inputDaCapa.current?.click()} disabled={capaEnviando}>{capaEnviando ? 'Enviando…' : 'Trocar capa'}</button>
                        {perfilExibido.capaUrl && <button type="button" className="od-profile__cover-action" onClick={() => void removerCapaDoPerfil()} disabled={capaEnviando}>Remover</button>}
                      </div>
                    )}
                    <input ref={inputDaCapa} className="od-profile__file" type="file" accept="image/jpeg,image/png,image/webp" aria-label="Escolher nova capa do perfil" onChange={(e) => void abrirAjusteDeImagem(e.target.files?.[0], 'capa')} />
                  </div>
                  <div className="od-profile__body">
                    <div className="od-profile__topline">
                      <div className="od-profile__avatar-wrap">
                        <div className="od-profile__avatar" aria-label={`Avatar de ${perfilExibido.apelido}`}>
                          {perfilExibido.avatarUrl ? <img src={perfilExibido.avatarUrl} alt="" /> : iniciaisDoPerfil}
                        </div>
                        {donoDoPerfil && (
                          <button type="button" className="od-profile__photo-action" onClick={() => inputDaFoto.current?.click()} disabled={fotoEnviando}>
                            {fotoEnviando ? 'Enviando…' : 'Trocar foto'}
                          </button>
                        )}
                        <input ref={inputDaFoto} className="od-profile__file" type="file" accept="image/jpeg,image/png,image/webp" aria-label="Escolher nova foto de perfil" onChange={(e) => void abrirAjusteDeImagem(e.target.files?.[0], 'foto')} />
                      </div>
                      <div className="od-profile__actions">
                        {donoDoPerfil ? (
                          <button type="button" className="tab od-profile__button" onClick={() => setModalPerfilAberto(true)}>Editar perfil</button>
                        ) : (
                          <button type="button" className="join od-profile__button" onClick={() => void alternarSeguirPerfil()} disabled={alternandoSeguir}>
                            {alternandoSeguir ? 'Atualizando…' : seguindoPerfil ? 'Seguindo' : 'Seguir'}
                          </button>
                        )}
                        <button type="button" className="tab od-profile__button" onClick={() => void compartilharPerfil()}>Compartilhar</button>
                      </div>
                    </div>

                    <div className="od-profile__identity">
                      <h1>{perfilExibido.apelido}</h1>
                      <p className="od-profile__handle">@{perfilExibido.handle}</p>
                      {perfilExibido.bio && <p id="profileBio" className="od-profile__bio">{perfilExibido.bio}</p>}
                      <div className="od-profile__meta">
                        {perfilExibido.cidade && <span>⌖ {perfilExibido.cidade}</span>}
                        <span>na roda desde {new Date(perfilExibido.criadoEm).getFullYear()}</span>
                      </div>
                      {(perfilExibido.instagram || perfilExibido.tiktok || perfilExibido.youtube || perfilExibido.twitter) && (
                        <div className="od-profile__social" aria-label="Redes sociais">
                          {perfilExibido.instagram && <a href={`https://instagram.com/${perfilExibido.instagram}`} target="_blank" rel="noreferrer">Instagram</a>}
                          {perfilExibido.tiktok && <a href={`https://tiktok.com/@${perfilExibido.tiktok}`} target="_blank" rel="noreferrer">TikTok</a>}
                          {perfilExibido.youtube && <a href={`https://youtube.com/@${perfilExibido.youtube}`} target="_blank" rel="noreferrer">YouTube</a>}
                          {perfilExibido.twitter && <a href={`https://x.com/${perfilExibido.twitter}`} target="_blank" rel="noreferrer">X</a>}
                        </div>
                      )}
                    </div>

                    <dl className="od-profile__metrics">
                      <div><dt>Posts</dt><dd>{perfilExibido.totalCausos}</dd></div>
                      <div><dt>Seguidores</dt><dd>{perfilExibido.totalSeguidores}</dd></div>
                      <div><dt>Seguindo</dt><dd>{perfilExibido.totalSeguindo}</dd></div>
                      {perfilExibido.melhorNota !== undefined && <div><dt>Melhor nota</dt><dd>{perfilExibido.melhorNota}</dd></div>}
                    </dl>

                    {donoDoPerfil && (
                      <div className="od-profile__owner-tools">
                        {perfilExibido.avatarUrl && <button type="button" className="tab" onClick={() => void removerFotoDoPerfil()} disabled={fotoEnviando}>Remover foto</button>}
                        <button type="button" className="tab od-profile__button" onClick={() => setModalCompositorAberto(true)}>+ Novo post</button>
                      </div>
                    )}
                  </div>
                </article>

                <div className="od-profile__tabs-nav" role="tablist" aria-label="Abas do perfil">
                  <button
                    type="button"
                    role="tab"
                    aria-selected={abaPerfil === 'posts'}
                    className={`od-profile__tab-btn ${abaPerfil === 'posts' ? 'active' : ''}`}
                    onClick={() => setAbaPerfil('posts')}
                  >
                    Posts <span>{perfilExibido.totalCausos}</span>
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={abaPerfil === 'arrotos'}
                    className={`od-profile__tab-btn ${abaPerfil === 'arrotos' ? 'active' : ''}`}
                    onClick={() => setAbaPerfil('arrotos')}
                  >
                    Arrotos <span>{arrotosDoPerfil.length}</span>
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={abaPerfil === 'salvos'}
                    className={`od-profile__tab-btn ${abaPerfil === 'salvos' ? 'active' : ''}`}
                    onClick={() => setAbaPerfil('salvos')}
                  >
                    Salvos
                  </button>
                </div>

                {abaPerfil === 'posts' && (
                  <section className="od-profile__activity" aria-labelledby="profileActivity">
                    <div className="od-profile__activity-head"><h2 id="profileActivity">Posts</h2><span>{perfilExibido.totalCausos}</span></div>
                    {estadoCausosDoPerfil === 'carregando' && <p className="od-profile__muted">Carregando posts…</p>}
                    {estadoCausosDoPerfil === 'erro' && <p className="od-profile__error" role="alert">Não deu para carregar os posts agora.</p>}
                    {estadoCausosDoPerfil === 'pronto' && causosDoPerfil.length === 0 && (
                      <div className="od-profile__empty"><h3>Nenhum post publicado ainda.</h3><p>{donoDoPerfil ? 'Quando soltar um, ele aparece aqui.' : 'Quando esta pessoa publicar, aparece aqui.'}</p></div>
                    )}
                    {estadoCausosDoPerfil === 'pronto' && causosDoPerfil.map((c) => (
                      <Link key={c.id} to={`/historia/${c.id}`} className="od-profile__post">
                        <span>r/{c.comunidadeSlug}</span>
                        <p className="od-profile__post-corpo">{c.conteudo}</p>
                        <small>{c.totalComentarios} comentários · {c.curtidas} curtidas</small>
                      </Link>
                    ))}
                  </section>
                )}

                {abaPerfil === 'arrotos' && (
                  <section className="od-profile__activity" aria-labelledby="profileArrotos">
                    <div className="od-profile__activity-head"><h2 id="profileArrotos">Arrotos</h2><span>{arrotosDoPerfil.length}</span></div>
                    {donoDoPerfil && (
                      <div className="od-profile__record-cta">
                        <button
                          type="button"
                          className="od-profile__record-button"
                          aria-label="Gravar um arroto no meu perfil"
                          onClick={() => abrirGravacaoDireta({ destinoFixo: 'perfil-proprio' })}
                        >
                          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                            <path d="M12 14.5a3 3 0 0 0 3-3v-5a3 3 0 1 0-6 0v5a3 3 0 0 0 3 3Z" />
                            <path d="M18 11.5a6 6 0 0 1-12 0M12 17.5v3M8.5 20.5h7" />
                          </svg>
                        </button>
                        <div>
                          <p className="od-profile__record-eyebrow">ARROTO DIRETO</p>
                          <h3>Grava um arroto pra deixar aqui.</h3>
                        </div>
                      </div>
                    )}
                    {estadoArrotosDoPerfil === 'carregando' && <p className="od-profile__muted">Carregando arrotos…</p>}
                    {estadoArrotosDoPerfil === 'erro' && <p className="od-profile__error" role="alert">Não deu para carregar os arrotos agora.</p>}
                    {estadoArrotosDoPerfil === 'pronto' && arrotosDoPerfil.length === 0 && (
                      <div className="od-profile__empty"><h3>Nenhum arroto aqui ainda.</h3><p>{donoDoPerfil ? 'Grave um para começar sua coleção.' : 'Quando alguém mandar um arroto para este perfil, ele aparece aqui.'}</p></div>
                    )}
                    {estadoArrotosDoPerfil === 'pronto' && arrotosDoPerfil.map((arroto) => (
                      <article key={arroto.id} className="od-profile__post">
                        <span>{arroto.autorId === perfilExibido.id ? 'Gravado por esta pessoa' : `Enviado por @${arroto.autorHandle}`}</span>
                        <h3 style={{ margin: '7px 0', fontSize: 16 }}>Arroto direto · {Math.ceil(arroto.duracaoSegundos)}s</h3>
                        <PlayerDoArroto
                          tocando={audioTocandoId === arroto.id}
                          tempoAtualSegundos={audioSelecionadoId === arroto.id ? tempoAtualDoAudio : 0}
                          duracaoSegundos={audioSelecionadoId === arroto.id ? duracaoDoAudio : arroto.duracaoSegundos}
                          aoAlternar={() => void alternarAudio(arroto.enderecoDoAudio, arroto.id)}
                        />
                        {arroto.possoOcultar && <button type="button" className="tab" style={{ marginTop: 8 }} onClick={() => void arrotosPort.ocultarArroto(arroto.id).then((ocultou) => { if (ocultou) setArrotosDoPerfil((atuais) => atuais.filter((item) => item.id !== arroto.id)); })}>Ocultar</button>}
                      </article>
                    ))}
                  </section>
                )}

                {abaPerfil === 'salvos' && (
                  <section className="od-profile__activity" aria-labelledby="profileSalvos">
                    <div className="od-profile__activity-head"><h2 id="profileSalvos">Salvos</h2></div>
                    <div className="od-profile__empty">
                      <h3>Nenhum post salvo ainda.</h3>
                      <p>Salve posts com a bandeirinha no feed para ler novamente por aqui.</p>
                    </div>
                  </section>
                )}
              </>
            )}
          </section>
        )}
      </>
    )}

        {/* ==================== VIEW: AUTH ==================== */}
        {viewAtual === 'auth' && (
          <section className="auth-shell" style={{ maxWidth: 440, margin: '40px auto' }}>
            <header className="auth-header">
              <Link to="/" className="auth-brand" aria-label="Auê, página inicial">AUÊ!</Link>
            </header>
            {painelAuth === 'login' && (
              <form onSubmit={submeterLogin} className="dialog">
                <h1>Entra na roda</h1>
                <p style={{ color: 'var(--aue-muted)', marginBottom: 16 }}>
                  Entre para soltar arrotos e postar seus causos.
                </p>

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
                  {authEnviando ? 'Entrando…' : 'Entrar no Auê'}
                </button>

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
                  Digite seu e-mail para receber o link de recuperação.
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
                <h1>Cria sua conta</h1>
                <p style={{ color: 'var(--aue-muted)', marginBottom: 16 }}>
                  Escolhe como a roda vai te chamar. Depois você completa seu perfil.
                </p>
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
                  <small className="auth-hint">3 a 20 caracteres: letras minúsculas, números ou _.</small>
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
                  <small className="auth-hint">Pelo menos 8 caracteres.</small>
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
          </section>
        )}
      </main>

      {viewAtual !== 'auth' && <PainelDireito
        comunidades={comunidades}
        comunidadesEntradas={comunidadesEntradas}
        viewAtual={viewAtual}
        moderadoresDaComunidade={moderadoresDaComunidade}
        regrasDaComunidade={regrasDaComunidade}
        perfil={perfilExibido}
        aoAbrirComunidade={(slug) => {
          setComunidadeSlug(slug);
          setViewAtual('comunidade');
        }}
        aoAlternarEntrar={alternarEntrarComunidade}
      />}

      {/* ==================== MODAIS ==================== */}
      <ModalCompositor
        aberto={modalCompositorAberto}
        comunidades={comunidades}
        comunidadePadraoSlug={comunidadeSlug}
        aoFechar={() => setModalCompositorAberto(false)}
        criarGravacao={forum.criarGravacaoLivreDoForum}
        aoPublicar={publicarPost}
      />

      <ModalGravarArroto
        aberto={modalGravarArrotoAberto}
        estado={estadoGravacaoDireta}
        erro={erroDaGravacaoDireta}
        enviando={enviandoArrotoDireto}
        comunidades={comunidades.map((comunidade) => ({ slug: comunidade.slug, nome: comunidade.nome }))}
        destinoFixo={destinoFixoDaGravacao ?? undefined}
        duracaoEmSegundos={audioDireto ? audioDireto.duracaoMs / 1000 : null}
        aoFechar={fecharGravacaoDireta}
        aoIniciarGravacao={iniciarGravacaoDireta}
        aoPararGravacao={pararGravacaoDireta}
        aoRegravar={() => {
          capturaDoArroto.soltar();
          setAudioDireto(null);
          setErroDaGravacaoDireta(null);
          setEstadoGravacaoDireta('ocioso');
        }}
        aoEnviar={enviarArrotoDireto}
      />

      <ModalComentarios
        aberto={modalComentariosAberto}
        post={postComentariosAtivo}
        comentarios={listaComentarios}
        carregando={carregandoComentarios}
        enviando={enviandoComentario}
        criarGravacao={forum.criarGravacaoLivreDoForum}
        aoFechar={() => {
          setModalComentariosAberto(false);
          setPostComentariosAtivo(null);
        }}
        aoEnviarComentario={enviarComentario}
      />

      <ModalFundarComunidade
        aberto={modalFundarAberto}
        aoFechar={() => setModalFundarAberto(false)}
        aoCriar={fundarNovaComunidade}
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
        aoSalvar={(dados) => {
          setRegrasDaComunidade(dados.regras);
          setModeradoresDaComunidade(dados.moderadores);
          if (comunidadeAtiva) {
            setComunidadeAtiva({
              ...comunidadeAtiva,
              icone: comunidadeAtiva.icone,
              avatarUrl: comunidadeAtiva.avatarUrl,
              capaUrl: comunidadeAtiva.capaUrl,
            });
          }
          exibirToast('Gestão da comunidade salva.');
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
              O Auê é uma comunidade brasileira para quem valoriza a arte sonora do arroto.
              Aqui você grava, descobre seu score e compete com amigos no X1.
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
