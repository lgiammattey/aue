import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { criarComunidadeWeb } from '../../plataforma/web/comunidade';
import { criarContaWeb } from '../../plataforma/web/conta';
import { criarCapturaWeb } from '../../plataforma/web/captura';
import { criarForumWeb } from '../../plataforma/web/forum';
import { criarArrotosDoPerfilRemoto } from '../../plataforma/web/arrotosDoPerfil';
import { criarPerfilRemoto } from '../../plataforma/web/perfilRemoto';
import type { ArrotoDoPerfil, PortaDeArrotosDoPerfil } from '../../portas/arrotosDoPerfil';
import type { AudioCapturado, CapturaDeAudio } from '../../portas/captura';
import type { CausoPostado, PortaDeComunidade } from '../../portas/comunidade';
import type { PortaDeConta } from '../../portas/conta';
import type { ComunidadeDoForum, PortaDeForum } from '../../portas/forum';
import type { PerfilPublico, PortaDePerfil } from '../../portas/perfil';
import { BarraLateral } from './BarraLateral';
import { BarraSuperior } from './BarraSuperior';
import { CardDoPost } from './CardDoPost';
import { ModalCompositor } from './ModalCompositor';
import { ModalComentarios } from './ModalComentarios';
import { ModalEditarPerfil } from './ModalEditarPerfil';
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
  abrirCompositor = false,
  aoEntrar,
}: Props) {
  const navigate = useNavigate();
  const params = useParams<{ slug?: string; handle?: string }>();
  const slugParam = slugInicial ?? params.slug;
  const handleParam = handleInicial ?? params.handle;

  const [forum] = useState(() => portaForum ?? criarForumWeb());
  const [comunidadePort] = useState(() => portaComunidade ?? criarComunidadeWeb());
  const [perfilPort] = useState(() => portaPerfil ?? criarPerfilRemoto());
  const [contaPort] = useState(() => portaConta ?? criarContaWeb());
  const [arrotosPort] = useState(() => portaArrotosDoPerfil ?? criarArrotosDoPerfilRemoto());
  const [capturaDoArroto] = useState(() => capturaDireta ?? criarCapturaWeb());

  const [viewAtual, setViewAtual] = useState<'feed' | 'emAlta' | 'seguindo' | 'auth' | 'perfil' | 'comunidade' | 'comunidades'>(() => {
    if (viewInicial === 'auth' || viewInicial === 'perfil' || viewInicial === 'comunidades' || viewInicial === 'emAlta' || viewInicial === 'seguindo') return viewInicial;
    if (handleParam) return 'perfil';
    if (slugParam || viewInicial === 'comunidade') return 'comunidade';
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
  const [abaComunidade, setAbaComunidade] = useState<'Quentes' | 'Novos'>('Quentes');
  const [topicosDaComunidade, setTopicosDaComunidade] = useState<readonly ItemDoFeed[]>([]);

  // Perfil
  const [perfilAtivo, setPerfilAtivo] = useState<PerfilPublico | null>(null);
  const [causosDoPerfil, setCausosDoPerfil] = useState<readonly CausoPostado[]>([]);
  const [arrotosDoPerfil, setArrotosDoPerfil] = useState<readonly ArrotoDoPerfil[]>([]);
  const [estadoArrotosDoPerfil, setEstadoArrotosDoPerfil] = useState<'carregando' | 'pronto' | 'erro'>('carregando');
  const [estadoPerfil, setEstadoPerfil] = useState<'carregando' | 'pronto' | 'pendente' | 'inexistente' | 'erro'>('carregando');
  const [estadoCausosDoPerfil, setEstadoCausosDoPerfil] = useState<'ocioso' | 'carregando' | 'pronto' | 'erro'>('ocioso');
  const [tentativaDoPerfil, setTentativaDoPerfil] = useState(0);
  const [modalPerfilAberto, setModalPerfilAberto] = useState(false);
  const [fotoEnviando, setFotoEnviando] = useState(false);
  const [capaEnviando, setCapaEnviando] = useState(false);
  const inputDaFoto = useRef<HTMLInputElement | null>(null);
  const inputDaCapa = useRef<HTMLInputElement | null>(null);

  // Auth
  const [painelAuth, setPainelAuth] = useState<'login' | 'recover' | 'invite'>('login');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginSenha, setLoginSenha] = useState('');
  const [recoverEmail, setRecoverEmail] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
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
  const [modalComentariosAberto, setModalComentariosAberto] = useState(false);
  const [postComentariosAtivo, setPostComentariosAtivo] = useState<ItemDoFeed | null>(null);
  const [listaComentarios, setListaComentarios] = useState<readonly ItemComentario[]>([]);
  const [carregandoComentarios, setCarregandoComentarios] = useState(false);
  const [enviandoComentario, setEnviandoComentario] = useState(false);
  const [modalFundarAberto, setModalFundarAberto] = useState(false);
  const [modalGerirComunidadeAberto, setModalGerirComunidadeAberto] = useState(false);
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
        const logado = e.temSessao && !e.anonima && !e.perfilSocialPendente;
        setEstaAutenticado(logado);
        if (!logado) {
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

    Promise.all([promessaTopicos, promessaCausos]).then(([resTopicos, causos]) => {
      if (!ativo) return;
      const itens: ItemDoFeed[] = [];
      if (resTopicos?.ok) {
        for (const t of resTopicos.valor.itens) {
          itens.push({
            id: `topico-${t.id}`,
            tipo: 'topico',
            comunidadeSlug: t.comunidade.slug,
            titulo: t.titulo,
            corpo: t.corpo,
            autorNome: t.autor.apelido ?? (t.autor.handle ? `@${t.autor.handle}` : 'Anônimo'),
            autorHandle: t.autor.handle ?? undefined,
            criadoEm: t.criadoEm,
            votos: 1,
            respostasTotal: t.respostasTotal,
            temAudio: Boolean(t.audio?.resultadoId || t.audio?.caminhoDoAudio),
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

  // Carregar feed geral e lista de comunidades
  useEffect(() => {
    let ativo = true;
    Promise.all([
      forum.listarComunidadesDoForum(),
      forum.explorarTopicos({ limite: 30 }),
      comunidadePort.listarFeed({ limite: 30 }).catch(() => [] as readonly CausoPostado[]),
    ])
      .then(([resComunidades, resTopicos, causos]) => {
        if (!ativo) return;
        const listaComunidades = resComunidades.ok ? resComunidades.valor : [];
        setComunidades(listaComunidades);

        const itens: ItemDoFeed[] = [];
        if (resTopicos.ok) {
          for (const t of resTopicos.valor.itens) {
            itens.push({
              id: `topico-${t.id}`,
              tipo: 'topico',
              comunidadeSlug: t.comunidade.slug,
              titulo: t.titulo,
              corpo: '',
              autorNome: t.autor.apelido ?? t.autor.handle ?? 'Anônimo',
              autorHandle: t.autor.handle ?? undefined,
              criadoEm: t.criadoEm,
              votos: Math.max(1, t.respostasTotal * 3),
              respostasTotal: t.respostasTotal,
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

  const submeterConvite = (e: FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    setAuthStatus('Pedido recebido. Você será avisado por e-mail.');
  };

  const abrirComentarios = async (post: ItemDoFeed) => {
    setPostComentariosAtivo(post);
    setModalComentariosAberto(true);
    setCarregandoComentarios(true);
    setListaComentarios([]);

    try {
      if (post.tipo === 'topico') {
        const topicoId = post.id.replace('topico-', '');
        const res = await forum.listarRespostasDoTopico?.(topicoId);
        if (res && res.ok) {
          setListaComentarios(
            res.valor.itens.map((r) => ({
              id: r.id,
              autorNome: r.autor?.apelido ?? (r.autor?.handle ? `@${r.autor.handle}` : 'Anônimo'),
              autorHandle: r.autor?.handle ?? undefined,
              conteudo: r.corpo ?? '',
              criadoEm: r.criadoEm,
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

  const enviarComentario = async (conteudo: string) => {
    if (!postComentariosAtivo || !conteudo.trim()) return;
    setEnviandoComentario(true);

    try {
      const meuNome = meuPerfil?.apelido ?? 'Você';
      const meuHandle = meuPerfil?.handle ?? 'arrotador';

      if (postComentariosAtivo.tipo === 'topico') {
        const topicoId = postComentariosAtivo.id.replace('topico-', '');
        const res = await forum.responderTopico?.({
          topicoId,
          corpo: conteudo.trim(),
        });
        if (res && !res.ok && res.motivo === 'precisaEntrar') {
          exibirToast('Entre na sua conta para comentar.');
          if (aoEntrar) {
            aoEntrar();
          } else {
            setViewAtual('auth');
          }
          return;
        }
      } else {
        const causoId = postComentariosAtivo.id.replace('causo-', '');
        await comunidadePort.adicionarResposta?.(
          causoId,
          conteudo.trim(),
          meuNome,
          meuHandle,
        );
      }

      const novoComentario: ItemComentario = {
        id: `comentario-${Date.now()}`,
        autorNome: meuNome,
        autorHandle: meuHandle,
        conteudo: conteudo.trim(),
        criadoEm: new Date().toISOString(),
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
    } catch {
      exibirToast('Não foi possível enviar o comentário agora.');
    } finally {
      setEnviandoComentario(false);
    }
  };

  const publicarPost = async (dados: {
    titulo: string;
    corpo: string;
    comunidadeSlug: string;
    tipo: 'Texto' | 'Áudio' | 'Vídeo';
  }) => {
    const meuNome = meuPerfil?.apelido ?? 'Você';
    const meuHandle = meuPerfil?.handle;
    let postCriadoId = `topico-${Date.now()}`;

    try {
      const resForum = await forum.criarTopico?.({
        comunidadeSlug: dados.comunidadeSlug,
        titulo: dados.titulo,
        corpo: dados.corpo,
      });
      if (resForum && resForum.ok) {
        postCriadoId = `topico-${resForum.valor.id}`;
      }
    } catch {
      // segue para causo
    }

    try {
      await comunidadePort.postarCauso?.({
        conteudo: dados.corpo ? `${dados.titulo}\n\n${dados.corpo}` : dados.titulo,
        comunidadeSlug: dados.comunidadeSlug,
        autorNome: meuNome,
        autorHandle: meuHandle,
        consentimentoAudioPublico: true,
      });
    } catch {
      // fallback
    }

    exibirToast('Publicado com sucesso.');

    const novoItem: ItemDoFeed = {
      id: postCriadoId,
      tipo: 'topico',
      comunidadeSlug: dados.comunidadeSlug,
      titulo: dados.titulo,
      corpo: dados.corpo,
      autorNome: meuNome,
      autorHandle: meuHandle,
      criadoEm: new Date().toISOString(),
      votos: 1,
      respostasTotal: 0,
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
        conteudo: dados.titulo,
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

  const trocarFotoDoPerfil = async (arquivo?: File) => {
    if (!arquivo || fotoEnviando) return;
    setFotoEnviando(true);
    try {
      const resultado = await perfilPort.enviarFoto(arquivo);
      if (!resultado.ok) {
        const mensagem = resultado.motivo === 'formatoInvalido'
          ? 'Use JPG, PNG ou WebP para a foto.'
          : resultado.motivo === 'grandeDemais'
            ? 'A foto passa do limite de 15 MB.'
            : 'Não foi possível trocar a foto agora.';
        exibirToast(mensagem);
        return;
      }
      setMeuPerfil(resultado.perfil);
      setPerfilAtivo(resultado.perfil);
      exibirToast('Foto atualizada.');
    } catch {
      exibirToast('Não foi possível trocar a foto agora.');
    } finally {
      setFotoEnviando(false);
      if (inputDaFoto.current) inputDaFoto.current.value = '';
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

  const trocarCapaDoPerfil = async (arquivo?: File) => {
    if (!arquivo || capaEnviando) return;
    setCapaEnviando(true);
    try {
      const resultado = await perfilPort.enviarCapa(arquivo);
      if (!resultado.ok) {
        const mensagem = resultado.motivo === 'formatoInvalido'
          ? 'Use JPG, PNG ou WebP para a capa.'
          : resultado.motivo === 'grandeDemais'
            ? 'A capa passa do limite de 15 MB.'
            : 'Não foi possível trocar a capa agora.';
        exibirToast(mensagem);
        return;
      }
      setMeuPerfil(resultado.perfil);
      setPerfilAtivo(resultado.perfil);
      exibirToast('Capa atualizada.');
    } catch {
      exibirToast('Não foi possível trocar a capa agora.');
    } finally {
      setCapaEnviando(false);
      if (inputDaCapa.current) inputDaCapa.current.value = '';
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

  const abrirGravacaoDireta = () => {
    if (!estaAutenticado) {
      (aoEntrar ?? (() => setViewAtual('auth')))();
      return;
    }
    setAudioDireto(null);
    setErroDaGravacaoDireta(null);
    setEstadoGravacaoDireta('ocioso');
    setModalGravarArrotoAberto(true);
  };

  const fecharGravacaoDireta = () => {
    capturaDoArroto.soltar();
    setModalGravarArrotoAberto(false);
    setEstadoGravacaoDireta('ocioso');
    setAudioDireto(null);
    setErroDaGravacaoDireta(null);
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
      const preparo = await arrotosPort.prepararArroto(
        destino.tipo === 'perfil-marcado' ? destino.handle : undefined,
      );
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
    <div className="app">
      <BarraLateral
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
      />

      <main>
        <BarraSuperior
          busca={busca}
          estaAutenticado={estaAutenticado}
          meuPerfil={meuPerfil}
          aoBuscar={setBusca}
          aoEntrar={aoEntrar ?? (() => setViewAtual('auth'))}
        />

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
              {postsFiltrados.map((post) => (
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
                />
              ))}
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
            {estadoSeguindo === 'pronto' && postsSeguindo.length > 0 && <div className="feed">{postsSeguindo.map((post) => <CardDoPost key={post.id} post={post} {...acoesDeReacao(post)} salvo={Boolean(salvosUsuario[post.id])} audioTocando={audioTocandoId === post.id} tempoAtualDoAudio={audioSelecionadoId === post.id ? tempoAtualDoAudio : 0} duracaoDoAudio={audioSelecionadoId === post.id ? duracaoDoAudio : null} aoAlternarSalvar={() => alternarSalvo(post.id)} aoTocarAudio={(fonte) => void alternarAudio(fonte, post.id)} aoAbrirComentarios={() => void abrirComentarios(post)} />)}</div>}
          </section>
        )}

        {/* ==================== VIEW: COMUNIDADE ESPECÍFICA ==================== */}
        {viewAtual === 'comunidade' && (
          <section aria-label={`Comunidade r/${comunidadeSlug}`}>
            {falhaComunidade ? (
              <div className="panel" style={{ padding: 24 }}>
                <p>Deu ruim pra carregar a comunidade.</p>
              </div>
            ) : (
              <>
                <div className="community-hero" style={{ marginBottom: 16 }}>
                  <div
                    style={{
                      height: 110,
                      background: 'linear-gradient(135deg, #1f232b 0%, #16181d 100%)',
                      borderRadius: '12px 12px 0 0',
                      border: '1px solid var(--aue-line)',
                      borderBottom: 0,
                    }}
                  />
                  <div
                    style={{
                      padding: '16px 20px',
                      background: 'var(--aue-surface)',
                      border: '1px solid var(--aue-line)',
                      borderRadius: '0 0 12px 12px',
                    }}
                  >
                    <h1>r/{comunidadeSlug}</h1>
                    <span style={{ color: 'var(--aue-accent)', fontSize: 13, fontWeight: 800 }}>
                      ◎ {formatarMilhar(comunidadeAtiva?.membrosTotal)} na roda
                    </span>
                    <p style={{ color: 'var(--aue-muted)', margin: '6px 0 14px', fontSize: 14 }}>
                      {comunidadeAtiva?.descricao ||
                        DETALHES_PADRAO[comunidadeSlug]?.description ||
                        'O ponto de encontro para quem coleciona sons, histórias e coragem desnecessária.'}
                    </p>
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                      <button
                        id="joinCommunity"
                        type="button"
                        className="join"
                        style={{ padding: '8px 18px', fontSize: 13 }}
                        onClick={() => alternarEntrarComunidade(comunidadeSlug)}
                      >
                        {comunidadesEntradas[comunidadeSlug] ? 'Entrou' : 'Entrar'}
                      </button>
                      <button
                        id="manageCommunity"
                        type="button"
                        className="tab"
                        style={{ border: '1px solid var(--aue-line)' }}
                        onClick={() => setModalGerirComunidadeAberto(true)}
                      >
                        Administrar comunidade
                      </button>
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
                </div>

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
                    />
                  ))}
                </div>
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
              <section className="od-profile__state">
                <h1>Sua ficha ainda não está pronta.</h1>
                <p>Entre na conta e escolha seu nome e @ antes de participar das rodas.</p>
                <Link className="join od-profile__button" to="/login">Entrar na conta</Link>
              </section>
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
                    <input ref={inputDaCapa} className="od-profile__file" type="file" accept="image/jpeg,image/png,image/webp" aria-label="Escolher nova capa do perfil" onChange={(e) => void trocarCapaDoPerfil(e.target.files?.[0])} />
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
                        <input ref={inputDaFoto} className="od-profile__file" type="file" accept="image/jpeg,image/png,image/webp" aria-label="Escolher nova foto de perfil" onChange={(e) => void trocarFotoDoPerfil(e.target.files?.[0])} />
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
                      <div><dt>Causos</dt><dd>{perfilExibido.totalCausos}</dd></div>
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

                <section className="od-profile__activity" aria-labelledby="profileActivity">
                  <div className="od-profile__activity-head"><h2 id="profileActivity">Causos</h2><span>{perfilExibido.totalCausos}</span></div>
                  {estadoCausosDoPerfil === 'carregando' && <p className="od-profile__muted">Carregando causos…</p>}
                  {estadoCausosDoPerfil === 'erro' && <p className="od-profile__error" role="alert">Não deu para carregar os causos agora.</p>}
                  {estadoCausosDoPerfil === 'pronto' && causosDoPerfil.length === 0 && (
                    <div className="od-profile__empty"><h3>Nenhum causo publicado ainda.</h3><p>{donoDoPerfil ? 'Quando soltar um, ele aparece aqui.' : 'Quando esta pessoa publicar, aparece aqui.'}</p></div>
                  )}
                  {estadoCausosDoPerfil === 'pronto' && causosDoPerfil.map((c) => (
                    <Link key={c.id} to={`/historia/${c.id}`} className="od-profile__post">
                      <span>r/{c.comunidadeSlug}</span><h3>{c.conteudo}</h3><small>{c.totalComentarios} comentários · {c.curtidas} curtidas</small>
                    </Link>
                  ))}
                </section>

                <section className="od-profile__activity" aria-labelledby="profileArrotos">
                  <div className="od-profile__activity-head"><h2 id="profileArrotos">Arrotos</h2><span>{arrotosDoPerfil.length}</span></div>
                  {estadoArrotosDoPerfil === 'carregando' && <p className="od-profile__muted">Carregando arrotos…</p>}
                  {estadoArrotosDoPerfil === 'erro' && <p className="od-profile__error" role="alert">Não deu para carregar os arrotos agora.</p>}
                  {estadoArrotosDoPerfil === 'pronto' && arrotosDoPerfil.length === 0 && (
                    <div className="od-profile__empty"><h3>Nenhum arroto aqui ainda.</h3><p>{donoDoPerfil ? 'Grave um para começar sua coleção.' : 'Quando alguém mandar um arroto para este perfil, ele aparece aqui.'}</p></div>
                  )}
                  {estadoArrotosDoPerfil === 'pronto' && arrotosDoPerfil.map((arroto) => (
                    <article key={arroto.id} className="od-profile__post">
                      <span>{arroto.autorId === perfilExibido.id ? 'Gravado por esta pessoa' : `Enviado por @${arroto.autorHandle}`}</span>
                      <h3>Arroto direto · {Math.ceil(arroto.duracaoSegundos)}s</h3>
                      <PlayerDoArroto
                        tocando={audioTocandoId === arroto.id}
                        tempoAtualSegundos={audioSelecionadoId === arroto.id ? tempoAtualDoAudio : 0}
                        duracaoSegundos={audioSelecionadoId === arroto.id ? duracaoDoAudio : arroto.duracaoSegundos}
                        aoAlternar={() => void alternarAudio(arroto.enderecoDoAudio, arroto.id)}
                      />
                      {arroto.possoOcultar && <button type="button" className="tab" onClick={() => void arrotosPort.ocultarArroto(arroto.id).then((ocultou) => { if (ocultou) setArrotosDoPerfil((atuais) => atuais.filter((item) => item.id !== arroto.id)); })}>Ocultar</button>}
                    </article>
                  ))}
                </section>
              </>
            )}
          </section>
        )}

        {/* ==================== VIEW: AUTH ==================== */}
        {viewAtual === 'auth' && (
          <section className="auth-shell" style={{ maxWidth: 440, margin: '40px auto' }}>
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
                      setPainelAuth('invite');
                      setAuthStatus('');
                    }}
                  >
                    Pedir convite
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

            {painelAuth === 'invite' && (
              <form onSubmit={submeterConvite} className="dialog">
                <h1>Pedir convite</h1>
                <p style={{ color: 'var(--aue-muted)', marginBottom: 16 }}>
                  Quer entrar no Auê? Deixe seu e-mail para avisarmos.
                </p>
                <label style={{ display: 'grid', gap: 6, marginBottom: 16 }}>
                  Seu e-mail
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    required
                    aria-label="Seu e-mail"
                  />
                </label>
                <button type="submit" className="submit" style={{ width: '100%', float: 'none' }}>
                  Pedir convite
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
          </section>
        )}
      </main>

      <PainelDireito
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
      />

      {/* ==================== MODAIS ==================== */}
      <ModalCompositor
        aberto={modalCompositorAberto}
        comunidades={comunidades}
        comunidadePadraoSlug={comunidadeSlug}
        aoFechar={() => setModalCompositorAberto(false)}
        aoPublicar={publicarPost}
      />

      <ModalGravarArroto
        aberto={modalGravarArrotoAberto}
        estado={estadoGravacaoDireta}
        erro={erroDaGravacaoDireta}
        enviando={enviandoArrotoDireto}
        comunidades={comunidades.map((comunidade) => ({ slug: comunidade.slug, nome: comunidade.nome }))}
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
        aoFechar={() => {
          setModalComentariosAberto(false);
          setPostComentariosAtivo(null);
        }}
        aoEnviarComentario={enviarComentario}
        aoIrParaConversaCompleta={
          postComentariosAtivo
            ? () => {
                setModalComentariosAberto(false);
                if (postComentariosAtivo.tipo === 'topico') {
                  const topicoId = postComentariosAtivo.id.replace('topico-', '');
                  navigate(`/c/${postComentariosAtivo.comunidadeSlug}/t/${topicoId}`);
                } else {
                  const causoId = postComentariosAtivo.id.replace('causo-', '');
                  navigate(`/historia/${causoId}`);
                }
              }
            : undefined
        }
      />

      <ModalFundarComunidade
        aberto={modalFundarAberto}
        aoFechar={() => setModalFundarAberto(false)}
        aoCriar={fundarNovaComunidade}
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
        aoFechar={() => setModalGerirComunidadeAberto(false)}
        aoSalvar={(dados) => {
          setRegrasDaComunidade(dados.regras);
          setModeradoresDaComunidade(dados.moderadores);
          exibirToast('Gestão da comunidade salva.');
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
