import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { criarComunidadeWeb } from '../../plataforma/web/comunidade';
import { criarContaWeb } from '../../plataforma/web/conta';
import { criarForumWeb } from '../../plataforma/web/forum';
import { criarPerfilRemoto } from '../../plataforma/web/perfilRemoto';
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
import { ModalGerirComunidade } from './ModalGerirComunidade';
import { PainelDireito } from './PainelDireito';
import type { DetalhesDaComunidade, ItemComentario, ItemDoFeed } from './tipos';
import './casca.css';
import './InicioOpenDesign.css';

interface Props {
  readonly portaForum?: PortaDeForum;
  readonly portaComunidade?: PortaDeComunidade;
  readonly portaPerfil?: PortaDePerfil;
  readonly portaConta?: PortaDeConta;
  readonly autenticado?: boolean;
  readonly viewInicial?: 'feed' | 'auth' | 'perfil' | 'comunidade' | 'comunidades';
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

  const [viewAtual, setViewAtual] = useState<'feed' | 'auth' | 'perfil' | 'comunidade' | 'comunidades'>(() => {
    if (viewInicial === 'auth' || viewInicial === 'perfil' || viewInicial === 'comunidades') return viewInicial;
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
  const [perfilNome, setPerfilNome] = useState('Arrotador');
  const [perfilBio, setPerfilBio] = useState('');
  const [perfilCidade, setPerfilCidade] = useState('');
  const [modalPerfilAberto, setModalPerfilAberto] = useState(false);

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
  const [busca, setBusca] = useState('');
  const [abaOrdenacao, setAbaOrdenacao] = useState<'Quentes' | 'Novos' | 'Top'>('Quentes');

  // Interações
  const [votosUsuario, setVotosUsuario] = useState<Record<string, 1 | -1>>({});
  const [salvosUsuario, setSalvosUsuario] = useState<Record<string, boolean>>({});
  const [comunidadesEntradas, setComunidadesEntradas] = useState<Record<string, boolean>>({});

  // Audio player
  const [audioTocandoId, setAudioTocandoId] = useState<string | null>(null);
  const elementoAudio = useRef<HTMLAudioElement | null>(null);

  // Modais
  const [modalCompositorAberto, setModalCompositorAberto] = useState(abrirCompositor);
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
        if (logado) {
          const perfil = await perfilPort.obterMeuPerfil?.();
          if (ativo && perfil) {
            setMeuPerfil(perfil);
            if (!handleParam) {
              setPerfilAtivo(perfil);
              setPerfilNome(perfil.apelido);
              setPerfilBio(perfil.bio ?? '');
              setPerfilCidade(perfil.cidade ?? '');
            }
          }
        }
      })
      .catch(() => {
        if (ativo) setEstaAutenticado(false);
      });
    return () => {
      ativo = false;
    };
  }, [contaPort, perfilPort, handleParam]);

  // Carregar perfil solicitado pelo handle
  useEffect(() => {
    let ativo = true;
    if (handleParam) {
      setViewAtual('perfil');
      perfilPort
        .obterPerfil?.(handleParam)
        .then((perfil) => {
          if (!ativo) return;
          if (perfil) {
            setPerfilAtivo(perfil);
            setPerfilNome(perfil.apelido);
            setPerfilBio(perfil.bio ?? '');
            setPerfilCidade(perfil.cidade ?? '');
          }
        })
        .catch(() => {});
    }
    return () => {
      ativo = false;
    };
  }, [handleParam, perfilPort]);

  // Carregar causos do perfil ativo
  useEffect(() => {
    let ativo = true;
    const alvo = perfilAtivo ?? meuPerfil;
    if (!alvo) return;
    comunidadePort
      .listarFeed?.({ autorId: alvo.id, limite: 50 })
      .then((lista) => {
        if (!ativo) return;
        setCausosDoPerfil(lista ?? []);
      })
      .catch(() => {
        if (ativo) setCausosDoPerfil([]);
      });
    return () => {
      ativo = false;
    };
  }, [perfilAtivo, meuPerfil, comunidadePort]);

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
          });
        }
        setItensFeed(itens);
      })
      .catch(() => {});

    return () => {
      ativo = false;
    };
  }, [forum, comunidadePort]);

  // Áudio player handler
  const alternarAudio = async (urlOuResolver?: string | (() => Promise<string | null>)) => {
    if (!urlOuResolver) return;
    let url: string | null = null;
    if (typeof urlOuResolver === 'function') {
      url = await urlOuResolver();
    } else {
      url = urlOuResolver;
    }
    if (!url) return;
    if (audioTocandoId === url) {
      elementoAudio.current?.pause();
      setAudioTocandoId(null);
      return;
    }
    if (!elementoAudio.current) {
      elementoAudio.current = new Audio(url);
      elementoAudio.current.onended = () => setAudioTocandoId(null);
    } else {
      elementoAudio.current.src = url;
    }
    elementoAudio.current.play().catch(() => {});
    setAudioTocandoId(url);
  };

  const alternarVoto = (id: string, delta: 1 | -1) => {
    setVotosUsuario((prev) => {
      const atual = prev[id];
      if (atual === delta) {
        const next = { ...prev };
        delete next[id];
        return next;
      }
      return { ...prev, [id]: delta };
    });
  };

  const alternarSalvo = (id: string) => {
    setSalvosUsuario((prev) => ({ ...prev, [id]: !prev[id] }));
    exibirToast(salvosUsuario[id] ? 'Removido dos salvos.' : 'Salvo na sua conta.');
  };

  const [seguindoPerfil, setSeguindoPerfil] = useState(false);

  const alternarSeguirPerfil = () => {
    const novoStatus = !seguindoPerfil;
    setSeguindoPerfil(novoStatus);
    exibirToast(novoStatus ? 'Você agora segue este perfil.' : 'Você deixou de seguir.');
    if (perfilAtivo) {
      perfilPort.alternarSeguir?.(perfilAtivo.id).catch(() => {});
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

  const salvarEdicaoPerfil = async (dados: { apelido: string; bio: string; cidade: string }) => {
    setPerfilNome(dados.apelido);
    setPerfilBio(dados.bio);
    setPerfilCidade(dados.cidade);
    try {
      const res = await perfilPort.atualizarMeuPerfil?.(dados);
      if (res?.ok) {
        setMeuPerfil(res.perfil);
      }
      exibirToast('Perfil atualizado na hora.');
    } catch {
      exibirToast('Perfil salvo.');
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
        aoAbrirCompositor={() => setModalCompositorAberto(true)}
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
                  voto={votosUsuario[post.id]}
                  salvo={Boolean(salvosUsuario[post.id])}
                  audioTocando={audioTocandoId === post.enderecoDoAudio}
                  aoVotar={(delta) => alternarVoto(post.id, delta)}
                  aoAlternarSalvar={() => alternarSalvo(post.id)}
                  aoTocarAudio={alternarAudio}
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
                      voto={votosUsuario[post.id]}
                      salvo={Boolean(salvosUsuario[post.id])}
                      audioTocando={audioTocandoId === post.enderecoDoAudio}
                      aoVotar={(delta) => alternarVoto(post.id, delta)}
                      aoAlternarSalvar={() => alternarSalvo(post.id)}
                      aoTocarAudio={alternarAudio}
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
          <section aria-label="Perfil do usuário">
            <div
              style={{
                background: 'var(--aue-surface)',
                border: '1px solid var(--aue-line)',
                borderRadius: '12px',
                padding: 24,
                marginBottom: 20,
              }}
            >
              <h1>{perfilNome}</h1>
              <p style={{ color: 'var(--aue-muted)', margin: '4px 0 10px', fontSize: 14 }}>
                u/{perfilAtivo?.handle ?? meuPerfil?.handle ?? 'arrotador'}
              </p>
              <p id="profileBio" style={{ margin: '0 0 10px', fontSize: 15 }}>
                {perfilBio}
              </p>
              {perfilCidade && (
                <p style={{ color: 'var(--aue-subtle)', fontSize: 13, margin: '0 0 16px' }}>
                  📍 {perfilCidade}
                </p>
              )}

              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {perfilAtivo && perfilAtivo.souEu === false ? (
                  <button
                    type="button"
                    className="join"
                    style={{ padding: '8px 18px', fontSize: 13 }}
                    onClick={alternarSeguirPerfil}
                  >
                    {seguindoPerfil ? 'Seguindo' : 'Seguir'}
                  </button>
                ) : (
                  <button
                    type="button"
                    className="tab"
                    style={{ border: '1px solid var(--aue-line)' }}
                    onClick={() => setModalPerfilAberto(true)}
                  >
                    Editar perfil
                  </button>
                )}
                <button
                  type="button"
                  className="tab"
                  style={{ border: '1px solid var(--aue-line)' }}
                  onClick={() => {
                    if (navigator.clipboard) navigator.clipboard.writeText(window.location.href);
                    exibirToast('Link copiado!');
                  }}
                >
                  ↗ Compartilhar
                </button>
                <button
                  type="button"
                  className="tab"
                  style={{ border: '1px solid var(--aue-line)' }}
                  onClick={() => setModalCompositorAberto(true)}
                >
                  + Novo post
                </button>
              </div>

              <div style={{ display: 'flex', gap: 24, marginTop: 20, borderTop: '1px solid var(--aue-line)', paddingTop: 14 }}>
                <div>
                  <strong style={{ fontSize: 18, display: 'block' }}>
                    {perfilAtivo?.totalCausos ? perfilAtivo.totalCausos * 12 : 42}
                  </strong>
                  <span style={{ fontSize: 11, color: 'var(--aue-subtle)' }}>karma de arroto</span>
                </div>
                <div>
                  <strong style={{ fontSize: 18, display: 'block' }}>
                    {perfilAtivo?.totalCausos ?? causosDoPerfil.length}
                  </strong>
                  <span style={{ fontSize: 11, color: 'var(--aue-subtle)' }}>posts publicados</span>
                </div>
                <div>
                  <strong style={{ fontSize: 18, display: 'block' }}>
                    {perfilAtivo?.totalSeguidores ?? 0}
                  </strong>
                  <span style={{ fontSize: 11, color: 'var(--aue-subtle)' }}>comentários certeiros</span>
                </div>
              </div>
            </div>

            <div className="profile-activity">
              <h2 style={{ fontSize: 18, marginBottom: 12 }}>Atividade</h2>
              {causosDoPerfil.length === 0 ? (
                <p style={{ color: 'var(--aue-muted)' }}>Nenhum causo publicado ainda.</p>
              ) : (
                causosDoPerfil.map((c) => (
                  <article key={c.id} className="post" style={{ padding: 16 }}>
                    <h3>{c.conteudo}</h3>
                    <small style={{ color: 'var(--aue-subtle)' }}>
                      r/{c.comunidadeSlug || 'arena-do-arroto'}
                    </small>
                  </article>
                ))
              )}
            </div>
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
        nomeInicial={perfilNome}
        bioInicial={perfilBio}
        cidadeInicial={perfilCidade}
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
