import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import { criarComunidadeWeb } from '../../plataforma/web/comunidade';
import { criarContaWeb } from '../../plataforma/web/conta';
import { criarForumWeb } from '../../plataforma/web/forum';
import { criarPerfilRemoto } from '../../plataforma/web/perfilRemoto';
import type { CausoPostado, PortaDeComunidade } from '../../portas/comunidade';
import type { PortaDeConta } from '../../portas/conta';
import type { ComunidadeDoForum, PortaDeForum } from '../../portas/forum';
import type { PerfilPublico, PortaDePerfil } from '../../portas/perfil';
import './casca.css';

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

interface DetalhesDaComunidade {
  readonly title: string;
  readonly description: string;
  readonly members: string;
  readonly rules: readonly string[];
  readonly moderators: readonly (readonly [string, string])[];
}

const COMUNIDADES_CANONICAS: Record<string, DetalhesDaComunidade> = {
  arrotar: {
    title: 'r/Arrotar',
    description: 'A praça pública do Auê: solte, ouça e comente os arrotos que chegaram agora.',
    members: '◎ 126 mil na roda',
    rules: [
      'Respeite quem está na roda.',
      'Publique conteúdo próprio ou autorizado.',
      'Sem humilhação, preconceito ou spam.',
    ],
    moderators: [
      ['u/equipe_aue', 'moderação Auê'],
      ['u/douglas', 'anfitrião'],
    ],
  },
  videos: {
    title: 'r/Vídeos',
    description: 'Vídeos públicos, duelos e gravações que merecem tela cheia.',
    members: '◎ 54 mil na roda',
    rules: [
      'Vídeos devem ter relação com a comunidade.',
      'Marque conteúdo sensível quando necessário.',
      'Sem repost sem crédito.',
    ],
    moderators: [
      ['u/equipe_aue', 'moderação Auê'],
      ['u/jota_m', 'mod de vídeo'],
    ],
  },
  grupos: {
    title: 'r/Grupos',
    description: 'Encontre rodas abertas, descubra subcomunidades e monte sua própria turma.',
    members: '◎ 31 mil na roda',
    rules: [
      'Cada grupo precisa de uma descrição clara.',
      'Convites não podem virar spam.',
      'Acolha quem está chegando.',
    ],
    moderators: [
      ['u/equipe_aue', 'moderação Auê'],
      ['u/ana_tempo', 'curadoria de grupos'],
    ],
  },
  'arena-do-arroto': {
    title: 'r/ArenaDoArroto',
    description: 'O ponto de encontro para quem coleciona sons, histórias e coragem desnecessária.',
    members: '◎ 42,8 mil na roda',
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
    title: 'r/ArrotoEmVídeo',
    description: 'Vídeos, duelos e momentos que pediam uma câmera ligada.',
    members: '◎ 18,2 mil na roda',
    rules: [
      'Respeite quem está na roda.',
      'Vídeos devem ter relação com a comunidade.',
      'Sem spam.',
    ],
    moderators: [
      ['u/douglas', 'fundador'],
    ],
  },
  'causos-de-bar': {
    title: 'r/CausosDeBar',
    description: 'Histórias improváveis que merecem ser contadas mais de uma vez.',
    members: '◎ 9,8 mil na roda',
    rules: [
      'Histórias verídicas ou bem contadas.',
      'Sem ofensa gratuita.',
      'Preserve a zoeira e a risada coletiva.',
    ],
    moderators: [
      ['u/douglas', 'fundador'],
    ],
  },
};

interface ItemDoFeed {
  readonly id: string;
  readonly tipo: 'topico' | 'causo';
  readonly comunidadeSlug: string;
  readonly titulo: string;
  readonly corpo: string;
  readonly autorNome: string;
  readonly autorHandle?: string | null;
  readonly criadoEm: string;
  readonly votos: number;
  readonly respostasTotal: number;
  readonly temAudio?: boolean;
  readonly enderecoDoAudio?: () => Promise<string | null>;
}

const CONTEUDO_INSTITUCIONAL: Record<string, { titulo: string; texto: string }> = {
  sobre: {
    titulo: 'Sobre o Auê',
    texto: 'O Auê é uma comunidade brasileira para compartilhar áudios, vídeos e causos com humor, contexto e respeito. A graça é coletiva — e cada roda tem suas próprias regras.',
  },
  regras: {
    titulo: 'Regras da comunidade',
    texto: 'Respeite quem está na roda.\n\nPublique apenas conteúdo próprio ou autorizado.\n\nSem humilhação, preconceito, spam ou exposição de terceiros.\n\nUse as ferramentas de denúncia quando algo sair da linha.',
  },
  privacidade: {
    titulo: 'Privacidade',
    texto: 'O Auê usa os dados necessários para manter sua conta, personalizar sua experiência e proteger a comunidade. Não vendemos sua identidade como conteúdo da roda.',
  },
  termos: {
    titulo: 'Termos de uso',
    texto: 'Ao usar o Auê, você concorda em compartilhar apenas conteúdo que pode publicar e em respeitar as regras de cada comunidade. Violações podem levar à remoção de conteúdo ou restrição de acesso.',
  },
  contato: {
    titulo: 'Contato',
    texto: 'Quer falar com a gente? Escreva para contato@aue.com.br. Para denúncias urgentes dentro da comunidade, use a ação de denunciar na própria publicação.',
  },
};

function formatarMilhar(total?: number): string {
  if (!total) return '42,8k';
  if (total >= 1000) {
    const inteiro = Math.floor(total / 1000);
    const decimal = Math.floor((total % 1000) / 100);
    return decimal > 0 ? `${inteiro},${decimal}k` : `${inteiro}k`;
  }
  return String(total);
}

function formatarNaRodaDesde(iso?: string): string {
  if (!iso) return 'na roda desde março de 2024';
  try {
    const d = new Date(iso);
    const mes = new Intl.DateTimeFormat('pt-BR', { month: 'long' }).format(d);
    const ano = d.getFullYear();
    return `na roda desde ${mes} de ${ano}`;
  } catch {
    return 'na roda desde 2026';
  }
}

function formatarTempoRelativo(isoOuData: string): string {
  try {
    const data = new Date(isoOuData);
    const segundos = Math.max(0, Math.floor((Date.now() - data.getTime()) / 1000));
    if (segundos < 60) return 'agora';
    const minutos = Math.floor(segundos / 60);
    if (minutos < 60) return `há ${minutos} min`;
    const horas = Math.floor(minutos / 60);
    if (horas < 24) return `há ${horas} h`;
    const dias = Math.floor(horas / 24);
    if (dias === 1) return 'ontem';
    if (dias < 7) return `há ${dias} dias`;
    return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' }).format(data);
  } catch {
    return 'agora';
  }
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
    return COMUNIDADES_CANONICAS[comunidadeSlug]?.rules || [
      'Respeite quem está na roda.',
      'Publique conteúdo próprio ou autorizado.',
      'Sem humilhação, preconceito ou spam.',
      'Marcações de vídeo devem ser sinceras.',
    ];
  });
  const [moderadoresDaComunidade, setModeradoresDaComunidade] = useState<readonly (readonly [string, string])[]>(() => {
    return COMUNIDADES_CANONICAS[comunidadeSlug]?.moderators || [
      ['u/barulhofausto', 'mestre da roda'],
      ['u/ana_tempo', 'guardião dos causos'],
      ['u/jota_m', 'mod de vídeo'],
    ];
  });
  const [topicosDaComunidade, setTopicosDaComunidade] = useState<readonly ItemDoFeed[]>([]);
  const [abaComunidade, setAbaComunidade] = useState<'Quentes' | 'Novos'>('Quentes');
  const [modalGerirComunidadeAberto, setModalGerirComunidadeAberto] = useState(false);
  const [falhaComunidade, setFalhaComunidade] = useState(false);
  const [regrasEditor, setRegrasEditor] = useState('');
  const [moderadoresEditor, setModeradoresEditor] = useState('');

  // Perfil
  const [modalPerfilAberto, setModalPerfilAberto] = useState(false);
  const [perfilAtivo, setPerfilAtivo] = useState<PerfilPublico | null>(null);
  const [causosDoPerfil, setCausosDoPerfil] = useState<readonly CausoPostado[]>([]);
  const [perfilNome, setPerfilNome] = useState('Douglas Garcia');
  const [perfilIniciais, setPerfilIniciais] = useState('DG');
  const [perfilBio, setPerfilBio] = useState('Colecionador de causos improváveis, áudios curtos e silêncios constrangedores. Moderador informal da mesa do canto.');
  const [perfilCidade, setPerfilCidade] = useState('São Paulo, SP');
  const [perfilNomeInput, setPerfilNomeInput] = useState('Douglas Garcia');
  const [perfilIniciaisInput, setPerfilIniciaisInput] = useState('DG');
  const [perfilBioInput, setPerfilBioInput] = useState('Colecionador de causos improváveis, áudios curtos e silêncios constrangedores. Moderador informal da mesa do canto.');
  const [perfilCidadeInput, setPerfilCidadeInput] = useState('São Paulo, SP');
  const [abaPerfil, setAbaPerfil] = useState<'Posts' | 'Comentários' | 'Salvos'>('Posts');
  const [seguindoPerfil, setSeguindoPerfil] = useState(false);

  const [painelAuth, setPainelAuth] = useState<'login' | 'recover' | 'invite'>('login');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginSenha, setLoginSenha] = useState('');
  const [recoverEmail, setRecoverEmail] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteReason, setInviteReason] = useState('');
  const [authStatus, setAuthStatus] = useState('');
  const [authEnviando, setAuthEnviando] = useState(false);

  const [estaAutenticado, setEstaAutenticado] = useState(autenticadoProp ?? false);
  const [meuPerfil, setMeuPerfil] = useState<PerfilPublico | null>(null);

  const [comunidades, setComunidades] = useState<readonly ComunidadeDoForum[]>([]);
  const [itensFeed, setItensFeed] = useState<readonly ItemDoFeed[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [falha, setFalha] = useState(false);

  // Filtros e busca
  const [busca, setBusca] = useState('');
  const [abaOrdenacao, setAbaOrdenacao] = useState<'Quentes' | 'Novos' | 'Top'>('Quentes');

  // Interações de posts
  const [votosUsuario, setVotosUsuario] = useState<Record<string, 1 | -1>>({});
  const [salvosUsuario, setSalvosUsuario] = useState<Record<string, boolean>>({});
  const [comentariosAbertos, setComentariosAbertos] = useState<Record<string, boolean>>({});
  const [comunidadesEntradas, setComunidadesEntradas] = useState<Record<string, boolean>>({});

  // Áudio player
  const [audioTocandoId, setAudioTocandoId] = useState<string | null>(null);
  const elementoAudio = useRef<HTMLAudioElement | null>(null);

  // Modais
  const [modalCompositorAberto, setModalCompositorAberto] = useState(abrirCompositor);
  const [tipoPost, setTipoPost] = useState<'Texto' | 'Áudio' | 'Vídeo'>('Texto');
  const [postTitulo, setPostTitulo] = useState('');
  const [postCorpo, setPostCorpo] = useState('');
  const [postComunidadeSlug, setPostComunidadeSlug] = useState('geral');
  const [publicando, setPublicando] = useState(false);

  // Modal fundar comunidade
  const [modalFundarAberto, setModalFundarAberto] = useState(false);
  const [novaComunidadeNome, setNovaComunidadeNome] = useState('');
  const [novaComunidadeSobre, setNovaComunidadeSobre] = useState('');
  const [novaComunidadeRegra, setNovaComunidadeRegra] = useState('Sem atacar quem está na roda.');

  // Modal institucional
  const [institucionalAberto, setInstitucionalAberto] = useState(false);
  const [conteudoInstitucionalAtual, setConteudoInstitucionalAtual] = useState({
    titulo: 'Sobre o Auê',
    texto: '',
  });

  // Autenticação real
  const submeterLogin = async (e: FormEvent) => {
    e.preventDefault();
    if (!loginEmail.trim() || !loginSenha) return;
    setAuthEnviando(true);
    setAuthStatus('');
    try {
      const res = await contaPort.entrar(loginEmail.trim(), loginSenha);
      if (res.ok) {
        setAuthStatus('Acesso liberado. Bem-vindo de volta.');
        setEstaAutenticado(true);
        const meu = await perfilPort.obterMeuPerfil();
        if (meu) setMeuPerfil(meu);
        setTimeout(() => {
          setViewAtual('feed');
          setAuthStatus('');
        }, 600);
      } else {
        if (res.motivo === 'credenciaisInvalidas') {
          setAuthStatus('E-mail ou senha incorretos.');
        } else if (res.motivo === 'emailInvalido') {
          setAuthStatus('E-mail inválido.');
        } else {
          setAuthStatus('Não foi possível entrar. Tente novamente.');
        }
      }
    } catch {
      setAuthStatus('Erro de conexão ao tentar entrar.');
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
      setAuthStatus('Se esse e-mail estiver cadastrado, o link de recuperação foi enviado.');
    } catch {
      setAuthStatus('Erro ao enviar pedido de recuperação.');
    } finally {
      setAuthEnviando(false);
    }
  };

  const submeterConvite = (e: FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    setAuthStatus('Pedido recebido. A gente avisa por e-mail quando a roda liberar espaço.');
  };
  const [toastMensagem, setToastMensagem] = useState<string | null>(null);
  const toastTimeoutRef = useRef<number | null>(null);

  const exibirToast = (msg: string) => {
    setToastMensagem(msg);
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = window.setTimeout(() => setToastMensagem(null), 2600);
  };

  // Carregar sessão e perfil
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
              setPerfilIniciais(perfil.apelido.slice(0, 2).toUpperCase());
              setPerfilNomeInput(perfil.apelido);
              setPerfilIniciaisInput(perfil.apelido.slice(0, 2).toUpperCase());
              if (perfil.bio) {
                setPerfilBio(perfil.bio);
                setPerfilBioInput(perfil.bio);
              }
              if (perfil.cidade) {
                setPerfilCidade(perfil.cidade);
                setPerfilCidadeInput(perfil.cidade);
              }
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

  // Se um handle específico foi solicitado na URL
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
            setSeguindoPerfil(Boolean(perfil.euSigo));
            setPerfilNome(perfil.apelido);
            setPerfilIniciais(perfil.apelido.slice(0, 2).toUpperCase());
            setPerfilNomeInput(perfil.apelido);
            setPerfilIniciaisInput(perfil.apelido.slice(0, 2).toUpperCase());
            if (perfil.bio) {
              setPerfilBio(perfil.bio);
              setPerfilBioInput(perfil.bio);
            }
            if (perfil.cidade) {
              setPerfilCidade(perfil.cidade);
              setPerfilCidadeInput(perfil.cidade);
            }
          }
        })
        .catch(() => {
          // fallback limpo
        });
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

  const abrirModalPerfil = () => {
    setPerfilNomeInput(perfilNome);
    setPerfilBioInput(perfilBio);
    setPerfilCidadeInput(perfilCidade);
    setPerfilIniciaisInput(perfilIniciais);
    setModalPerfilAberto(true);
  };

  const salvarEdicaoPerfil = async (e: FormEvent) => {
    e.preventDefault();
    const novoNome = perfilNomeInput.trim();
    const novaBio = perfilBioInput.trim();
    const novaCidade = perfilCidadeInput.trim();
    const novasIniciais = (perfilIniciaisInput.trim() || novoNome.slice(0, 2) || 'DG').toUpperCase();

    setPerfilNome(novoNome);
    setPerfilBio(novaBio);
    setPerfilCidade(novaCidade);
    setPerfilIniciais(novasIniciais);

    try {
      if (perfilPort.atualizarMeuPerfil) {
        const res = await perfilPort.atualizarMeuPerfil({
          apelido: novoNome,
          bio: novaBio,
          cidade: novaCidade,
        });
        if (res && res.ok) {
          setMeuPerfil(res.perfil);
          setPerfilAtivo(res.perfil);
          exibirToast('Perfil atualizado com sucesso.');
        } else {
          exibirToast('Perfil salvo.');
        }
      } else {
        exibirToast('Perfil atualizado com sucesso.');
      }
    } catch {
      exibirToast('Perfil atualizado na hora.');
    } finally {
      setModalPerfilAberto(false);
    }
  };

  const alternarSeguirPerfil = async () => {
    if (!perfilAtivo) return;
    try {
      const res = await perfilPort.alternarSeguir?.(perfilAtivo.id);
      if (res?.ok) {
        setSeguindoPerfil(res.seguindo);
        exibirToast(res.seguindo ? 'Você agora segue este perfil.' : 'Você deixou de seguir.');
      }
    } catch {
      exibirToast('Não foi possível alterar conexão.');
    }
  };

  // Sincroniza se o slug vier pela URL
  useEffect(() => {
    if (slugParam && slugParam !== comunidadeSlug) {
      setComunidadeSlug(slugParam);
      setViewAtual('comunidade');
    }
  }, [slugParam, comunidadeSlug]);

  const abrirComunidade = (slug: string) => {
    setComunidadeSlug(slug);
    setViewAtual('comunidade');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Carregar dados da comunidade ativa
  useEffect(() => {
    let ativo = true;
    if (!comunidadeSlug) return;

    const canonica = COMUNIDADES_CANONICAS[comunidadeSlug];
    if (canonica) {
      setRegrasDaComunidade(canonica.rules);
      setModeradoresDaComunidade(canonica.moderators);
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
          } else {
            setComunidadeAtiva(null);
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

    Promise.all([promessaTopicos, promessaCausos])
      .then(([resTopicos, causos]) => {
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
              autorHandle: t.autor.handle,
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
            });
          }
        }
        setTopicosDaComunidade(itens);
      })
      .catch(() => {
        if (ativo) setTopicosDaComunidade([]);
      });

    return () => {
      ativo = false;
    };
  }, [comunidadeSlug, abaComunidade, forum, comunidadePort]);

  // Carregar dados reais (comunidades do fórum e tópicos/causos)
  useEffect(() => {
    let ativo = true;
    setCarregando(true);
    setFalha(false);

    Promise.all([
      forum.listarComunidadesDoForum(),
      forum.explorarTopicos({ limite: 30 }),
      comunidadePort.listarFeed({ limite: 30 }).catch(() => [] as readonly CausoPostado[]),
    ])
      .then(([resComunidades, resTopicos, causos]) => {
        if (!ativo) return;
        if (!resComunidades.ok && !resTopicos.ok) {
          setFalha(true);
          setCarregando(false);
          return;
        }

        const listaComunidades = resComunidades.ok ? resComunidades.valor : [];
        setComunidades(listaComunidades);
        if (listaComunidades.length > 0 && postComunidadeSlug === 'geral') {
          setPostComunidadeSlug(listaComunidades[0].slug);
        }

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
              autorHandle: t.autor.handle,
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
            criadoEm: new Date().toISOString(),
            votos: c.nota ? Math.round(c.nota) : 1,
            respostasTotal: 0,
            temAudio: c.temAudio,
            enderecoDoAudio: c.enderecoDoAudio,
          });
        }

        setItensFeed(itens);
        setCarregando(false);
      })
      .catch(() => {
        if (ativo) {
          setFalha(true);
          setCarregando(false);
        }
      });

    return () => {
      ativo = false;
    };
  }, [forum, comunidadePort]);

  // Votação interativa
  const alternarVoto = (itemId: string, direcao: 1 | -1) => {
    setVotosUsuario((prev) => {
      const atual = prev[itemId];
      if (atual === direcao) {
        const proximo = { ...prev };
        delete proximo[itemId];
        return proximo;
      }
      return { ...prev, [itemId]: direcao };
    });
  };

  // Salvar causo
  const alternarSalvo = (itemId: string) => {
    setSalvosUsuario((prev) => {
      const proximo = !prev[itemId];
      exibirToast(proximo ? 'Salvo na sua coleção.' : 'Removido dos salvos.');
      return { ...prev, [itemId]: proximo };
    });
  };

  // Compartilhar
  const compartilharItem = async (item: ItemDoFeed) => {
    const url = `${window.location.origin}/c/${item.comunidadeSlug}`;
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(url).catch(() => {});
    }
    exibirToast('Link copiado para a área de transferência.');
  };

  // Tocar áudio
  const alternarAudio = async (item: ItemDoFeed) => {
    if (audioTocandoId === item.id) {
      elementoAudio.current?.pause();
      setAudioTocandoId(null);
      return;
    }

    if (item.enderecoDoAudio) {
      try {
        const url = await item.enderecoDoAudio();
        if (url) {
          if (!elementoAudio.current) {
            elementoAudio.current = new Audio();
            elementoAudio.current.onended = () => setAudioTocandoId(null);
          }
          elementoAudio.current.src = url;
          await elementoAudio.current.play();
          setAudioTocandoId(item.id);
          return;
        }
      } catch {
        // Fallback se áudio não estiver disponível
      }
    }

    exibirToast('Áudio não disponível para reprodução no momento.');
  };

  // Entrar / Sair da comunidade
  // Entrar / Sair de comunidade real com feedback 1:1
  const alternarEntrarComunidade = async (slug: string) => {
    const jaEntrou = Boolean(comunidadesEntradas[slug]);
    setComunidadesEntradas((prev) => ({ ...prev, [slug]: !jaEntrou }));

    if (jaEntrou) {
      exibirToast('Você saiu da comunidade.');
    } else {
      exibirToast('Você entrou na comunidade.');
    }

    if (estaAutenticado) {
      try {
        if (jaEntrou) {
          await comunidadePort.sairComunidade(slug);
        } else {
          await comunidadePort.entrarComunidade(slug);
        }
      } catch {
        // Ignora erro em plano de fundo
      }
    }
  };

  // Publicar post / tópico real
  const submeterPublicacao = async (e: FormEvent) => {
    e.preventDefault();
    if (!postTitulo.trim()) return;

    if (!estaAutenticado) {
      exibirToast('Você precisa entrar para soltar um causo.');
      aoEntrar?.();
      return;
    }

    setPublicando(true);
    try {
      const res = await forum.criarTopico({
        comunidadeSlug: postComunidadeSlug || (comunidades[0]?.slug ?? 'geral'),
        titulo: postTitulo.trim(),
        corpo: postCorpo.trim(),
      });

      if (res.ok) {
        exibirToast('Publicado com sucesso no Auê!');
        setModalCompositorAberto(false);
        setPostTitulo('');
        setPostCorpo('');
        // Adicionar ao feed local imediatamente
        const novoItem: ItemDoFeed = {
          id: `topico-${res.valor.id}`,
          tipo: 'topico',
          comunidadeSlug: postComunidadeSlug || (comunidades[0]?.slug ?? 'geral'),
          titulo: postTitulo.trim(),
          corpo: postCorpo.trim(),
          autorNome: meuPerfil?.apelido ?? 'Você',
          autorHandle: meuPerfil?.handle,
          criadoEm: res.valor.criadoEm || new Date().toISOString(),
          votos: 1,
          respostasTotal: 0,
        };
        setItensFeed((prev) => [novoItem, ...prev]);
      } else {
        exibirToast('Não foi possível publicar. Verifique o texto e tente novamente.');
      }
    } catch {
      exibirToast('Erro de conexão ao publicar.');
    } finally {
      setPublicando(false);
    }
  };

  // Abrir modal institucional
  const abrirInstitucional = (chave: string) => {
    const conteudo = CONTEUDO_INSTITUCIONAL[chave] ?? {
      titulo: 'Informações',
      texto: 'Auê — a comunidade do arroto.',
    };
    setConteudoInstitucionalAtual(conteudo);
    setInstitucionalAberto(true);
  };

  // Filtragem e ordenação do feed
  const itensFiltrados = itensFeed
    .filter((item) => {
      if (!busca.trim()) return true;
      const b = busca.toLowerCase();
      return (
        item.titulo.toLowerCase().includes(b) ||
        item.corpo.toLowerCase().includes(b) ||
        item.comunidadeSlug.toLowerCase().includes(b) ||
        item.autorNome.toLowerCase().includes(b)
      );
    })
    .sort((a, b) => {
      if (abaOrdenacao === 'Novos') {
        return new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime();
      }
      if (abaOrdenacao === 'Top') {
        const votosA = a.votos + (votosUsuario[a.id] ?? 0);
        const votosB = b.votos + (votosUsuario[b.id] ?? 0);
        return votosB - votosA;
      }
      // 'Quentes': ponderação de votos e comentários
      const scoreA = a.votos + a.respostasTotal * 2 + (votosUsuario[a.id] ?? 0);
      const scoreB = b.votos + b.respostasTotal * 2 + (votosUsuario[b.id] ?? 0);
      return scoreB - scoreA;
    });

  const perfilExibido = perfilAtivo ?? meuPerfil;
  const ehMeuPerfil = !handleParam || Boolean(perfilExibido?.souEu) || Boolean(meuPerfil && perfilExibido && perfilExibido.id === meuPerfil.id);
  const handleExibido = perfilExibido?.handle || meuPerfil?.handle || 'douglas';
  const naRodaDesde = formatarNaRodaDesde(perfilExibido?.criadoEm);
  const totalCausosExibido = perfilExibido?.totalCausos ?? (causosDoPerfil.length > 0 ? causosDoPerfil.length : 39);
  const totalSeguidoresExibido = perfilExibido?.totalSeguidores ?? 86;
  const totalSeguindoExibido = perfilExibido?.totalSeguindo ?? 14;
  const karmaExibido = perfilExibido ? formatarMilhar(totalCausosExibido * 120 + totalSeguidoresExibido * 10) : '8,4 mil';
  const comentariosExibidos = perfilExibido ? totalSeguindoExibido * 2 : 274;

  const iniciaisAvatar = meuPerfil ? meuPerfil.apelido.slice(0, 2).toUpperCase() : 'DG';
  const primeiroNome = meuPerfil ? meuPerfil.apelido.split(' ')[0] : 'Douglas';

  return (
    <div className="app">
      {/* SIDEBAR ESQUERDA 1:1 */}
      <aside className="sidebar" aria-label="Índice de navegação">
        <Link className="brand" to="/" aria-label="Auê, página inicial">
          <svg className="aue-mark" viewBox="0 0 32 32" aria-hidden="true">
            <path d="M7 22V10" />
            <path d="M16 25V7" />
            <path d="M25 20v-8" />
          </svg>
          <span className="brand-word">
            au<b>ê</b>
          </span>
        </Link>

        <nav>
          <div className="nav-label">Índice</div>
          <button
            className={`nav-item ${viewAtual === 'feed' ? 'active' : ''}`}
            type="button"
            onClick={() => {
              setViewAtual('feed');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          >
            <span className="ico">⌂</span>Início
          </button>
          <button
            className="nav-item"
            type="button"
            onClick={() => {
              setAbaOrdenacao('Top');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          >
            <span className="ico">↗</span>Em alta
          </button>
          <button
            className="nav-item"
            type="button"
            onClick={() => {
              if (!estaAutenticado) {
                exibirToast('Entre para ver publicações de quem você segue.');
                aoEntrar?.();
              } else {
                setAbaOrdenacao('Novos');
              }
            }}
          >
            <span className="ico">◎</span>Seguindo
          </button>
          <button
            className={`nav-item ${viewAtual === 'perfil' ? 'active' : ''}`}
            type="button"
            onClick={() => {
              setViewAtual('perfil');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          >
            <span className="ico">◉</span>Meu perfil
          </button>

          <button className="create-side" type="button" onClick={() => setModalCompositorAberto(true)}>
            + Soltar um arroto
          </button>

          <div className="nav-label">Comunidades</div>
          <button className="nav-item" id="openCommunityFounder" type="button" onClick={() => setModalFundarAberto(true)}>
            <span className="ico">＋</span>Fundar comunidade
          </button>
          <button
            className={`nav-item ${viewAtual === 'comunidades' ? 'active' : ''}`}
            type="button"
            onClick={() => {
              setViewAtual('comunidades');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          >
            <span className="ico">◎</span>Todas as rodas
          </button>

          {comunidades.slice(0, 4).map((c, idx) => {
            const cores = ['', 'lime', 'blue', ''];
            const ativa = viewAtual === 'comunidade' && comunidadeSlug === c.slug;
            return (
              <Link
                key={c.id}
                className={`nav-item ${ativa ? 'active' : ''}`}
                to={`/c/${c.slug}`}
                onClick={() => abrirComunidade(c.slug)}
              >
                <span className={`community-dot ${cores[idx % cores.length]}`} />
                r/{c.slug}
              </Link>
            );
          })}

          <div className="nav-label">Da galera</div>
          {comunidades.slice(4, 8).map((c, idx) => {
            const cores = ['lime', 'blue', '', 'lime'];
            const ativa = viewAtual === 'comunidade' && comunidadeSlug === c.slug;
            return (
              <Link
                key={c.id}
                className={`nav-item ${ativa ? 'active' : ''}`}
                to={`/c/${c.slug}`}
                onClick={() => abrirComunidade(c.slug)}
              >
                <span className={`community-dot ${cores[idx % cores.length]}`} />
                r/{c.slug}
              </Link>
            );
          })}

          {comunidades.length === 0 && (
            <>
              <Link
                className={`nav-item ${viewAtual === 'comunidade' && comunidadeSlug === 'arena-do-arroto' ? 'active' : ''}`}
                to="/c/arena-do-arroto"
                onClick={() => abrirComunidade('arena-do-arroto')}
              >
                <span className="community-dot" />r/ArenaDoArroto
              </Link>
              <Link
                className={`nav-item ${viewAtual === 'comunidade' && comunidadeSlug === 'arroto-em-video' ? 'active' : ''}`}
                to="/c/arroto-em-video"
                onClick={() => abrirComunidade('arroto-em-video')}
              >
                <span className="community-dot lime" />r/ArrotoEmVídeo
              </Link>
              <Link
                className={`nav-item ${viewAtual === 'comunidade' && comunidadeSlug === 'causos-de-bar' ? 'active' : ''}`}
                to="/c/causos-de-bar"
                onClick={() => abrirComunidade('causos-de-bar')}
              >
                <span className="community-dot blue" />r/CausosDeBar
              </Link>
            </>
          )}
        </nav>

        <div className="sidebar-footer">
          {estaAutenticado ? (
            <Link className="nav-item" to="/perfil">
              <span className="ico">◉</span>{primeiroNome}
            </Link>
          ) : (
            <button
              className={`nav-item ${viewAtual === 'auth' ? 'active' : ''}`}
              type="button"
              data-view="acesso"
              onClick={() => {
                setViewAtual('auth');
                setPainelAuth('login');
                setAuthStatus('');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            >
              <span className="ico">↪</span>Entrar
            </button>
          )}
        </div>
      </aside>

      {/* MIOLO CENTRAL */}
      <main id="inicio">
        {/* TOPBAR */}
        <header className="topbar">
          <input
            className="search"
            id="search"
            aria-label="Buscar na comunidade"
            placeholder="Buscar arrotos, gente e comunidades"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
          <div className="top-actions">
            <button
              className="icon-btn"
              type="button"
              aria-label="Notificações"
              onClick={() => exibirToast('Notificações em breve na sua roda.')}
            >
              ♢
            </button>
            <button
              className="icon-btn"
              id="quickPost"
              type="button"
              aria-label="Criar publicação"
              onClick={() => setModalCompositorAberto(true)}
            >
              ＋
            </button>
            <button
              className="profile-mini"
              type="button"
              onClick={() => {
                if (estaAutenticado) {
                  setViewAtual('perfil');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                } else {
                  setViewAtual('auth');
                  setPainelAuth('login');
                  setAuthStatus('');
                }
              }}
            >
              <span className="avatar">{estaAutenticado ? iniciaisAvatar : '?'}</span>
              <span>{estaAutenticado ? primeiroNome : 'Entrar'}</span>
            </button>
          </div>
        </header>

        {/* AVISO DE VISITANTE */}
        {!estaAutenticado && viewAtual === 'feed' && (
          <button
            className="inicio-open__visitante"
            type="button"
            onClick={() => {
              setViewAtual('auth');
              setPainelAuth('login');
              setAuthStatus('');
            }}
            style={{
              width: '100%',
              minHeight: '44px',
              marginBottom: '16px',
              border: '1px solid var(--purple)',
              borderRadius: '8px',
              background: 'var(--purple-soft)',
              color: 'var(--text)',
              fontWeight: 800,
              textAlign: 'left',
              padding: '0 14px',
              cursor: 'pointer',
            }}
          >
            Você está só olhando. Entre para participar.
          </button>
        )}

        {/* HERO 1:1 */}
        {viewAtual === 'feed' && (
          <section className="hero" aria-labelledby="hero-title">
            <span className="eyebrow">r/ArenaDoArroto apresenta</span>
            <h1 id="hero-title">A comunidade dos arrotadores.</h1>
            <p>
              O barulho é seu. A roda é de todo mundo. Solta o áudio, conta o causo, encontra quem entende. Aqui o arroto vira conversa — e conversa vira lenda.
            </p>
            <button className="hero-cta" id="heroPost" type="button" onClick={() => setModalCompositorAberto(true)}>
              Publicar agora
            </button>
          </section>
        )}

        {/* FEED SECTION 1:1 */}
        <section
          id="feedSection"
          className={`feed-view ${viewAtual === 'feed' ? '' : 'hidden'}`}
          style={{ display: viewAtual === 'feed' ? 'block' : 'none' }}
          aria-labelledby="feed-title"
        >
          <div className="feed-head">
            <div>
              <span className="eyebrow" id="feedEyebrow">
                Comunidade · {abaOrdenacao}
              </span>
              <h2 id="feed-title">O que está rolando agora</h2>
            </div>
            <div className="tabs" role="tablist">
              <button
                className={`tab ${abaOrdenacao === 'Quentes' ? 'active' : ''}`}
                type="button"
                onClick={() => setAbaOrdenacao('Quentes')}
              >
                Quentes
              </button>
              <button
                className={`tab ${abaOrdenacao === 'Novos' ? 'active' : ''}`}
                type="button"
                onClick={() => setAbaOrdenacao('Novos')}
              >
                Novos
              </button>
              <button
                className={`tab ${abaOrdenacao === 'Top' ? 'active' : ''}`}
                type="button"
                onClick={() => setAbaOrdenacao('Top')}
              >
                Top
              </button>
            </div>
          </div>

          {/* COMPOSER INLINE */}
          <div className="composer">
            <span className="avatar">{iniciaisAvatar}</span>
            <button id="composerInput" type="button" onClick={() => setModalCompositorAberto(true)}>
              Compartilhe um causo, áudio ou vídeo...
            </button>
            <button
              className="composer-type"
              type="button"
              aria-label="Anexar mídia"
              id="mediaComposer"
              onClick={() => {
                setTipoPost('Áudio');
                setModalCompositorAberto(true);
              }}
            >
              ▣
            </button>
          </div>

          {/* LISTA DE POSTS */}
          <div id="postList">
            {carregando && (
              <div className="od-stack" style={{ gap: '16px', padding: '24px 0' }}>
                <div style={{ color: 'var(--muted)', fontSize: '14px' }}>Carregando causos da roda…</div>
              </div>
            )}

            {falha && !carregando && (
              <div style={{ padding: '24px 0', color: 'var(--coral)' }}>
                Não foi possível conectar com o servidor da roda agora.
              </div>
            )}

            {!carregando && !falha && itensFiltrados.length === 0 && (
              <div style={{ padding: '32px 0', textAlign: 'center', color: 'var(--muted)' }}>
                <p>Nenhuma conversa encontrada por aqui.</p>
                <button
                  className="hero-cta"
                  type="button"
                  style={{ display: 'inline-block', marginTop: '12px' }}
                  onClick={() => setModalCompositorAberto(true)}
                >
                  Seja o primeiro a soltar um causo
                </button>
              </div>
            )}

            {!carregando &&
              itensFiltrados.map((item, index) => {
                const votoAtual = votosUsuario[item.id] ?? 0;
                const scoreExibido = Math.max(0, item.votos + votoAtual);
                const aberto = Boolean(comentariosAbertos[item.id]);
                const salvo = Boolean(salvosUsuario[item.id]);

                return (
                  <div key={item.id}>
                    <article className="post" data-title={item.titulo}>
                      <div className="vote">
                        <button
                          type="button"
                          className={votoAtual === 1 ? 'voted' : ''}
                          aria-label="Votar positivamente"
                          onClick={() => alternarVoto(item.id, 1)}
                        >
                          ▲
                        </button>
                        <span className="score">{scoreExibido}</span>
                        <button
                          type="button"
                          className={votoAtual === -1 ? 'voted' : ''}
                          aria-label="Votar negativamente"
                          onClick={() => alternarVoto(item.id, -1)}
                        >
                          ▼
                        </button>
                      </div>

                      <div className="post-body">
                        <div className="post-meta">
                          <Link className="badge" to={`/c/${item.comunidadeSlug}`}>
                            r/{item.comunidadeSlug}
                          </Link>
                          <span>
                            postado por{' '}
                            {item.autorHandle ? (
                              <Link to={`/u/${item.autorHandle}`}>u/{item.autorHandle}</Link>
                            ) : (
                              item.autorNome
                            )}
                          </span>
                          <span>{formatarTempoRelativo(item.criadoEm)}</span>
                        </div>

                        <h3>
                          <Link to={`/c/${item.comunidadeSlug}`}>{item.titulo}</Link>
                        </h3>

                        {item.corpo && <p>{item.corpo}</p>}

                        {item.temAudio && (
                          <div className="burp-player">
                            <button
                              className="play"
                              type="button"
                              aria-label={audioTocandoId === item.id ? 'Pausar áudio' : 'Ouvir áudio'}
                              onClick={() => void alternarAudio(item)}
                            >
                              {audioTocandoId === item.id ? '❚❚' : '▶'}
                            </button>
                            <div className="wave" aria-hidden="true">
                              <i style={{ ['--h' as any]: '7px' }} />
                              <i style={{ ['--h' as any]: '18px' }} />
                              <i style={{ ['--h' as any]: '10px' }} />
                              <i style={{ ['--h' as any]: '26px' }} />
                              <i style={{ ['--h' as any]: '14px' }} />
                              <i style={{ ['--h' as any]: '22px' }} />
                              <i style={{ ['--h' as any]: '8px' }} />
                              <i style={{ ['--h' as any]: '19px' }} />
                              <i style={{ ['--h' as any]: '11px' }} />
                              <i style={{ ['--h' as any]: '24px' }} />
                              <i style={{ ['--h' as any]: '8px' }} />
                            </div>
                            <span className="player-time">{audioTocandoId === item.id ? 'Ouvindo' : '0:08'}</span>
                          </div>
                        )}

                        <div className="post-actions">
                          <button
                            className="comment-trigger"
                            type="button"
                            onClick={() =>
                              setComentariosAbertos((prev) => ({
                                ...prev,
                                [item.id]: !aberto,
                              }))
                            }
                          >
                            ▢ {item.respostasTotal} comentários
                          </button>
                          <button type="button" onClick={() => void compartilharItem(item)}>
                            ↗ compartilhar
                          </button>
                          <button
                            type="button"
                            style={{ color: salvo ? 'var(--lime)' : 'inherit' }}
                            onClick={() => alternarSalvo(item.id)}
                          >
                            ♧ {salvo ? 'salvo' : 'salvar'}
                          </button>
                        </div>

                        <div className={`comment-box ${aberto ? 'open' : ''}`}>
                          <div className="comment">
                            <b>u/arrotador_raiz:</b> Quem tem coragem de mandar resposta no desafio?
                          </div>
                        </div>
                      </div>
                    </article>

                    {/* Espaço patrocinado Google AdSense a cada 3 posts */}
                    {(index === 0 || index === 2) && (
                      <aside className="ad-slot" aria-label="Espaço patrocinado">
                        <div className="ad-slot-head">
                          <span>Patrocinado</span>
                          <span>Publicidade</span>
                        </div>
                        <div style={{ textAlign: 'center', padding: '14px', color: 'var(--subtle)', fontSize: '12px' }}>
                          Espaço de anúncio patrocinado da comunidade Auê
                        </div>
                      </aside>
                    )}
                  </div>
                );
              })}
          </div>
        </section>

        {/* AUTH SECTION 1:1 COM PROTÓTIPO OPEN DESIGN */}
        {viewAtual === 'auth' && (
          <section id="authSection" className="auth-view active" style={{ display: 'block' }} aria-labelledby="authTitle">
            <div className="auth-shell">
              <div className="auth-mark" aria-hidden="true">
                A
              </div>

              {/* PAINEL LOGIN */}
              <div
                className={`auth-panel ${painelAuth === 'login' ? 'active' : ''}`}
                style={{ display: painelAuth === 'login' ? 'block' : 'none' }}
                data-auth-panel="login"
              >
                <h1 id="authTitle">Entra na roda</h1>
                <p className="auth-intro">Use seu e-mail e senha para continuar de onde parou.</p>
                <form className="profile-form" id="loginForm" onSubmit={(e) => void submeterLogin(e)}>
                  <label>
                    E-mail
                    <input
                      id="loginEmail"
                      type="email"
                      autoComplete="email"
                      placeholder="voce@email.com"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      required
                    />
                  </label>
                  <label>
                    Senha
                    <input
                      id="loginPassword"
                      type="password"
                      autoComplete="current-password"
                      placeholder="Sua senha"
                      minLength={6}
                      value={loginSenha}
                      onChange={(e) => setLoginSenha(e.target.value)}
                      required
                    />
                  </label>
                  <button className="submit" type="submit" disabled={authEnviando}>
                    {authEnviando ? 'Entrando…' : 'Entrar no Auê'}
                  </button>
                </form>
                <div className="auth-links">
                  <button
                    className="auth-link"
                    type="button"
                    data-auth-action="recover"
                    onClick={() => {
                      setPainelAuth('recover');
                      setAuthStatus('');
                    }}
                  >
                    Esqueci minha senha
                  </button>
                  <button
                    className="auth-link"
                    type="button"
                    data-auth-action="invite"
                    onClick={() => {
                      setPainelAuth('invite');
                      setAuthStatus('');
                    }}
                  >
                    Pedir convite
                  </button>
                </div>
              </div>

              {/* PAINEL RECUPERAÇÃO */}
              <div
                className={`auth-panel ${painelAuth === 'recover' ? 'active' : ''}`}
                style={{ display: painelAuth === 'recover' ? 'block' : 'none' }}
                data-auth-panel="recover"
              >
                <h1>Recuperar senha</h1>
                <p className="auth-intro">A gente manda um link seguro para você voltar à roda.</p>
                <form className="profile-form" id="recoverForm" onSubmit={(e) => void submeterRecuperacao(e)}>
                  <label>
                    E-mail cadastrado
                    <input
                      id="recoverEmail"
                      type="email"
                      autoComplete="email"
                      placeholder="voce@email.com"
                      value={recoverEmail}
                      onChange={(e) => setRecoverEmail(e.target.value)}
                      required
                    />
                  </label>
                  <button className="submit" type="submit" disabled={authEnviando}>
                    {authEnviando ? 'Enviando…' : 'Enviar link de recuperação'}
                  </button>
                </form>
                <div className="auth-links">
                  <button
                    className="auth-link"
                    type="button"
                    data-auth-action="login"
                    onClick={() => {
                      setPainelAuth('login');
                      setAuthStatus('');
                    }}
                  >
                    Voltar para entrar
                  </button>
                </div>
              </div>

              {/* PAINEL PEDIR CONVITE */}
              <div
                className={`auth-panel ${painelAuth === 'invite' ? 'active' : ''}`}
                style={{ display: painelAuth === 'invite' ? 'block' : 'none' }}
                data-auth-panel="invite"
              >
                <h1>Pedir convite</h1>
                <p className="auth-intro">O Auê cresce por convite. Conta como você quer chegar na roda.</p>
                <form className="profile-form" id="inviteForm" onSubmit={submeterConvite}>
                  <label>
                    Seu e-mail
                    <input
                      id="inviteEmail"
                      type="email"
                      autoComplete="email"
                      placeholder="voce@email.com"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      required
                    />
                  </label>
                  <label>
                    Como conheceu o Auê?
                    <input
                      id="inviteReason"
                      maxLength={120}
                      placeholder="Ex.: um amigo mandou um desafio"
                      value={inviteReason}
                      onChange={(e) => setInviteReason(e.target.value)}
                      required
                    />
                  </label>
                  <button className="submit" type="submit">
                    Solicitar convite
                  </button>
                </form>
                <div className="auth-links">
                  <button
                    className="auth-link"
                    type="button"
                    data-auth-action="login"
                    onClick={() => {
                      setPainelAuth('login');
                      setAuthStatus('');
                    }}
                  >
                    Já tenho acesso
                  </button>
                </div>
              </div>

              {authStatus && (
                <p className="auth-status" id="authStatus" aria-live="polite">
                  {authStatus}
                </p>
              )}
            </div>
          </section>
        )}

        {/* COMMUNITY SECTION 1:1 COM PROTÓTIPO OPEN DESIGN */}
        {viewAtual === 'comunidade' && (
          <section id="communitySection" className="community-view active" style={{ display: 'block' }} aria-labelledby="communityTitle">
            {falhaComunidade && (
              <div className="community-panel" style={{ textAlign: 'center', padding: '32px', marginBottom: '16px' }}>
                <p style={{ color: 'var(--coral)', fontWeight: 800, fontSize: '16px', margin: '0 0 14px' }}>
                  Deu ruim pra carregar a comunidade.
                </p>
                <button
                  className="profile-action primary"
                  type="button"
                  onClick={() => {
                    setFalhaComunidade(false);
                    forum.obterComunidadeDoForum?.(comunidadeSlug).then((res) => {
                      if (res?.ok && res.valor) setComunidadeAtiva(res.valor);
                      else setFalhaComunidade(true);
                    }).catch(() => setFalhaComunidade(true));
                  }}
                >
                  Tentar de novo
                </button>
              </div>
            )}
            <div className="community-hero">
              <div className="community-cover" aria-hidden="true" />
              <div className="community-info">
                <div className="od-row-top">
                  <div className="od-fill">
                    <span className="eyebrow">Comunidade</span>
                    <h1 id="communityTitle">r/{comunidadeSlug}</h1>
                    <p id="communityDescription">
                      {comunidadeAtiva?.descricao || COMUNIDADES_CANONICAS[comunidadeSlug]?.description || 'O ponto de encontro para quem coleciona sons, histórias e coragem desnecessária.'}
                    </p>
                  </div>
                  <button
                    className="profile-action primary"
                    id="joinCommunity"
                    type="button"
                    style={{ color: comunidadesEntradas[comunidadeSlug] ? 'var(--lime)' : undefined }}
                    onClick={() => void alternarEntrarComunidade(comunidadeSlug)}
                  >
                    {comunidadesEntradas[comunidadeSlug] ? 'Entrou' : 'Entrar'}
                  </button>
                </div>
                <div className="profile-meta">
                  <span id="communityMembers">
                    ◎ {comunidadeAtiva?.membrosTotal ? `${formatarMilhar(comunidadeAtiva.membrosTotal)} na roda` : COMUNIDADES_CANONICAS[comunidadeSlug]?.members || '42,8 mil na roda'}
                  </span>
                  <span>◌ 1,2 mil online agora</span>
                  <span>fundada em 2019</span>
                </div>
                <div className="community-admin-actions">
                  <button
                    className="profile-action"
                    id="manageCommunity"
                    type="button"
                    onClick={() => {
                      setRegrasEditor(regrasDaComunidade.join('\n'));
                      setModeradoresEditor(moderadoresDaComunidade.map(([nome, papel]) => `${nome} | ${papel}`).join('\n'));
                      setModalGerirComunidadeAberto(true);
                    }}
                  >
                    Administrar comunidade
                  </button>
                </div>
              </div>
            </div>

            <div className="community-columns">
              <section className="community-panel">
                <div className="feed-head">
                  <div>
                    <span className="eyebrow">Feed da comunidade</span>
                    <h2>Mais {abaComunidade.toLowerCase()} da roda</h2>
                  </div>
                  <div className="tabs">
                    <button
                      className={`tab ${abaComunidade === 'Quentes' ? 'active' : ''}`}
                      type="button"
                      onClick={() => setAbaComunidade('Quentes')}
                    >
                      Quentes
                    </button>
                    <button
                      className={`tab ${abaComunidade === 'Novos' ? 'active' : ''}`}
                      type="button"
                      onClick={() => setAbaComunidade('Novos')}
                    >
                      Novos
                    </button>
                  </div>
                </div>

                <div className="activity-card">
                  <div className="post-meta">
                    <span className="badge">fixado pelos mods</span>
                    <span>há 1 dia</span>
                  </div>
                  <h3>Antes de soltar: leia as regras da comunidade.</h3>
                  <div className="activity-foot">
                    <span>▲ 628</span>
                    <span>▢ 74 comentários</span>
                  </div>
                </div>

                {topicosDaComunidade.map((item) => (
                  <div key={item.id} className="activity-card">
                    <div className="post-meta">
                      <span className="badge">{item.autorHandle ? `u/${item.autorHandle}` : `u/${item.autorNome.toLowerCase().replace(/\s+/g, '_')}`}</span>
                      <span>{formatarTempoRelativo(item.criadoEm)}</span>
                    </div>
                    <h3>{item.titulo}</h3>
                    {item.corpo && <p style={{ color: '#c8cad1', fontSize: '14px', margin: '6px 0 10px', lineHeight: 1.5 }}>{item.corpo}</p>}
                    <div className="activity-foot">
                      <span>▲ {item.votos}</span>
                      <span>▢ {item.respostasTotal} comentários</span>
                      <button
                        type="button"
                        style={{ background: 'transparent', border: 0, color: 'var(--muted)', cursor: 'pointer', font: 'inherit', fontWeight: 800, fontSize: '12px', padding: 0 }}
                        onClick={() => {
                          void navigator.clipboard?.writeText?.(window.location.href);
                          exibirToast('Link do causo copiado para compartilhar.');
                        }}
                      >
                        ↗ compartilhar
                      </button>
                    </div>
                  </div>
                ))}

                {topicosDaComunidade.length === 0 && (
                  <>
                    <div className="activity-card">
                      <div className="post-meta">
                        <span className="badge">u/fernando_f</span>
                        <span>há 3 h</span>
                      </div>
                      <h3>O áudio mais curto da semana conseguiu ser o mais comentado.</h3>
                      <div className="activity-foot">
                        <span>▲ 214</span>
                        <span>▢ 28 comentários</span>
                      </div>
                    </div>
                    <div className="activity-card">
                      <div className="post-meta">
                        <span className="badge">u/joaninha</span>
                        <span>há 6 h</span>
                      </div>
                      <h3>Qual barulho você acha que merecia uma categoria própria?</h3>
                      <div className="activity-foot">
                        <span>▲ 96</span>
                        <span>▢ 18 comentários</span>
                      </div>
                    </div>
                  </>
                )}
              </section>

              <aside className="od-stack" style={{ gap: '16px' }}>
                <section className="community-panel">
                  <h2>Moderadores</h2>
                  <div className="moderator-list" id="moderatorList">
                    {moderadoresDaComunidade.map(([nome, papel], idx) => {
                      const iniciais = nome.replace(/^u\//, '').slice(0, 2).toUpperCase();
                      return (
                        <div key={idx} className="moderator">
                          <span className="mod-avatar">{iniciais}</span>
                          <div>
                            <strong>{nome}</strong>
                            <small>{papel}</small>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>

                <section className="community-panel">
                  <h2>Regras rápidas</h2>
                  <ol className="community-rules" id="communityRulesList">
                    {regrasDaComunidade.map((regra, idx) => (
                      <li key={idx}>{regra}</li>
                    ))}
                  </ol>
                </section>
              </aside>
            </div>
          </section>
        )}

        {/* DIRETÓRIO DE COMUNIDADES 1:1 */}
        {viewAtual === 'comunidades' && (
          <section id="directorySection" className="community-view active" style={{ display: 'block' }} aria-labelledby="directoryTitle">
            <div className="hero">
              <span className="eyebrow">Rodas do Auê</span>
              <h1 id="directoryTitle">Comunidades</h1>
              <p>Escolha uma roda para acompanhar, ouvir e soltar arrotos com a galera. Ou funde a sua própria roda agora.</p>
              <button
                className="hero-cta"
                type="button"
                onClick={() => setModalFundarAberto(true)}
              >
                + Fundar comunidade
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px', marginTop: '20px' }}>
              {(comunidades.length > 0 ? comunidades : Object.entries(COMUNIDADES_CANONICAS).map(([slug, det]) => ({
                id: slug,
                slug,
                nome: det.title.replace(/^r\//, ''),
                descricao: det.description,
                membrosTotal: parseInt(det.members.replace(/[^0-9]/g, '')) * 1000 || 42000,
                topicosTotal: 10,
                ultimaAtividadeEm: null,
                souMembro: Boolean(comunidadesEntradas[slug]),
                icone: null,
              }))).map((c, i) => {
                const cores = ['', 'lime', 'blue', ''];
                const entrou = Boolean(comunidadesEntradas[c.slug]);
                return (
                  <div key={c.id} className="community-panel" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span className={`community-dot ${cores[i % cores.length]}`} />
                          <h3 style={{ margin: 0, fontSize: '18px' }}>r/{c.slug}</h3>
                        </div>
                        <button
                          className="join"
                          type="button"
                          style={{ color: entrou ? 'var(--lime)' : undefined }}
                          onClick={() => void alternarEntrarComunidade(c.slug)}
                        >
                          {entrou ? 'Entrou' : 'Entrar'}
                        </button>
                      </div>
                      <p style={{ color: 'var(--muted)', fontSize: '13px', lineHeight: 1.5, margin: '8px 0 12px' }}>
                        {c.descricao || 'O ponto de encontro para quem coleciona sons, histórias e coragem desnecessária.'}
                      </p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '12px', borderTop: '1px solid var(--line)', marginTop: '8px' }}>
                      <span style={{ fontSize: '12px', color: 'var(--subtle)', fontWeight: 800 }}>
                        ◎ {c.membrosTotal ? `${formatarMilhar(c.membrosTotal)} na roda` : '42k na roda'}
                      </span>
                      <button
                        className="profile-action"
                        type="button"
                        style={{ minHeight: '32px', padding: '0 10px', fontSize: '12px' }}
                        onClick={() => abrirComunidade(c.slug)}
                      >
                        Ver roda ↗
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* PERFIL SECTION 1:1 COM PROTÓTIPO OPEN DESIGN */}
        {viewAtual === 'perfil' && (
          <section id="profileSection" className="profile-view active" style={{ display: 'block' }} aria-labelledby="profile-title">
            <div className="profile-hero">
              <div className="profile-cover" aria-hidden="true" />
              <div className="profile-main">
                <div className="profile-avatar" aria-hidden="true">
                  {perfilIniciais}
                </div>
                <div className="profile-actions">
                  {ehMeuPerfil ? (
                    <>
                      <button
                        className="profile-action"
                        id="editProfile"
                        type="button"
                        onClick={abrirModalPerfil}
                      >
                        Editar perfil
                      </button>
                      <button
                        className="profile-action"
                        type="button"
                        onClick={() => {
                          void navigator.clipboard?.writeText?.(window.location.href);
                          exibirToast('Link do perfil copiado.');
                        }}
                      >
                        ↗ Compartilhar
                      </button>
                      <button
                        className="profile-action primary"
                        id="profilePost"
                        type="button"
                        onClick={() => setModalCompositorAberto(true)}
                      >
                        + Novo post
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        className="profile-action primary"
                        type="button"
                        onClick={() => void alternarSeguirPerfil()}
                      >
                        {seguindoPerfil ? 'Seguindo' : 'Seguir'}
                      </button>
                      <button
                        className="profile-action"
                        type="button"
                        onClick={() => {
                          void navigator.clipboard?.writeText?.(window.location.href);
                          exibirToast('Link do perfil copiado.');
                        }}
                      >
                        ↗ Compartilhar
                      </button>
                    </>
                  )}
                </div>
                <div className="profile-copy">
                  <h1 id="profile-title">{perfilNome}</h1>
                  <div className="handle">
                    u/{handleExibido} · {naRodaDesde}
                  </div>
                  <p className="bio" id="profileBio">
                    {perfilBio}
                  </p>
                  <div className="profile-meta">
                    <span id="profileCity">⌖ {perfilCidade}</span>
                    <span>◎ segue {totalSeguindoExibido} {totalSeguindoExibido === 1 ? 'comunidade' : 'comunidades'}</span>
                    <span>◌ {totalSeguidoresExibido} {totalSeguidoresExibido === 1 ? 'seguidor' : 'seguidores'}</span>
                  </div>
                </div>
                <div className="od-grid profile-stats">
                  <div className="od-stat">
                    <span className="stat-number">{karmaExibido}</span>
                    <span className="stat-label">karma de arroto</span>
                  </div>
                  <div className="od-stat">
                    <span className="stat-number">{totalCausosExibido}</span>
                    <span className="stat-label">posts publicados</span>
                  </div>
                  <div className="od-stat">
                    <span className="stat-number">{comentariosExibidos}</span>
                    <span className="stat-label">comentários certeiros</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="profile-columns">
              <section className="profile-panel" aria-labelledby="activity-title">
                <div className="feed-head">
                  <h2 id="activity-title">Atividade</h2>
                  <div className="profile-tabs">
                    <button
                      className={`profile-tab ${abaPerfil === 'Posts' ? 'active' : ''}`}
                      type="button"
                      onClick={() => setAbaPerfil('Posts')}
                    >
                      Posts
                    </button>
                    <button
                      className={`profile-tab ${abaPerfil === 'Comentários' ? 'active' : ''}`}
                      type="button"
                      onClick={() => setAbaPerfil('Comentários')}
                    >
                      Comentários
                    </button>
                    <button
                      className={`profile-tab ${abaPerfil === 'Salvos' ? 'active' : ''}`}
                      type="button"
                      onClick={() => setAbaPerfil('Salvos')}
                    >
                      Salvos
                    </button>
                  </div>
                </div>

                {abaPerfil === 'Posts' && (
                  <>
                    {causosDoPerfil.length > 0 ? (
                      causosDoPerfil.map((causo) => (
                        <div key={causo.id} className="activity-card">
                          <div className="post-meta">
                            <span className="badge">r/{causo.comunidadeSlug || 'ArenaDoArroto'}</span>
                            <span>{formatarTempoRelativo(causo.criadoEm)}</span>
                          </div>
                          <h3>{causo.conteudo}</h3>
                          <div className="activity-foot">
                            <span>▲ {causo.curtidas || 0}</span>
                            <span>▢ {causo.totalComentarios || 0} comentários</span>
                            <button
                              type="button"
                              style={{ background: 'transparent', border: 0, color: 'inherit', padding: 0, cursor: 'pointer', font: 'inherit' }}
                              onClick={() => {
                                void navigator.clipboard?.writeText?.(window.location.href);
                                exibirToast('Link do causo copiado.');
                              }}
                            >
                              ↗ compartilhar
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <>
                        <div className="activity-card">
                          <div className="post-meta">
                            <span className="badge">r/ArenaDoArroto</span>
                            <span>há 3 dias</span>
                          </div>
                          <h3>O que faz um arroto ser memorável: volume, tempo ou a cara de quem ouviu?</h3>
                          <div className="activity-foot">
                            <span>▲ 1,2 mil</span>
                            <span>▢ 93 comentários</span>
                            <button
                              type="button"
                              style={{ background: 'transparent', border: 0, color: 'inherit', padding: 0, cursor: 'pointer', font: 'inherit' }}
                              onClick={() => {
                                void navigator.clipboard?.writeText?.(window.location.href);
                                exibirToast('Link do causo copiado.');
                              }}
                            >
                              ↗ compartilhar
                            </button>
                          </div>
                        </div>

                        <div className="activity-card">
                          <div className="post-meta">
                            <span className="badge">r/CausosDeBar</span>
                            <span>há 1 semana</span>
                          </div>
                          <h3>Hoje aprendi que a acústica de uma garagem pode ser um talento ou uma ameaça.</h3>
                          <div className="activity-foot">
                            <span>▲ 689</span>
                            <span>▢ 41 comentários</span>
                            <button
                              type="button"
                              style={{ background: 'transparent', border: 0, color: 'inherit', padding: 0, cursor: 'pointer', font: 'inherit' }}
                              onClick={() => {
                                void navigator.clipboard?.writeText?.(window.location.href);
                                exibirToast('Link do causo copiado.');
                              }}
                            >
                              ↗ compartilhar
                            </button>
                          </div>
                        </div>

                        <div className="activity-card">
                          <div className="post-meta">
                            <span className="badge">r/ArrotoEmVídeo</span>
                            <span>há 2 semanas</span>
                          </div>
                          <h3>Meu primeiro vídeo com a câmera apontada para o teto. A estratégia funciona.</h3>
                          <div className="activity-foot">
                            <span>▲ 344</span>
                            <span>▢ 17 comentários</span>
                            <button
                              type="button"
                              style={{ background: 'transparent', border: 0, color: 'inherit', padding: 0, cursor: 'pointer', font: 'inherit' }}
                              onClick={() => {
                                void navigator.clipboard?.writeText?.(window.location.href);
                                exibirToast('Link do causo copiado.');
                              }}
                            >
                              ↗ compartilhar
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </>
                )}

                {abaPerfil === 'Comentários' && (
                  <div className="activity-card">
                    <p style={{ color: 'var(--muted)', margin: '8px 0', fontSize: '14px' }}>
                      Nenhum comentário por aqui ainda.
                    </p>
                  </div>
                )}

                {abaPerfil === 'Salvos' && (
                  <div className="activity-card">
                    <p style={{ color: 'var(--muted)', margin: '8px 0', fontSize: '14px' }}>
                      Nenhum post salvo ainda na sua lista.
                    </p>
                  </div>
                )}
              </section>

              <aside className="od-stack" style={{ gap: '16px' }}>
                <section className="profile-panel">
                  <h2>Conquistas</h2>
                  <div className="achievement">
                    <span className="achievement-icon">✦</span>
                    <div>
                      <strong>Primeiro barulho</strong>
                      <span>Publicou seu primeiro áudio</span>
                    </div>
                  </div>
                  <div className="achievement">
                    <span className="achievement-icon purple">♜</span>
                    <div>
                      <strong>Dono da mesa</strong>
                      <span>Chegou a 1 mil votos em um post</span>
                    </div>
                  </div>
                  <div className="achievement">
                    <span className="achievement-icon coral">♬</span>
                    <div>
                      <strong>Eco no salão</strong>
                      <span>Recebeu 100 comentários</span>
                    </div>
                  </div>
                  <div className="achievement">
                    <span className="achievement-icon">◎</span>
                    <div>
                      <strong>Da casa</strong>
                      <span>Entrou em 10 comunidades</span>
                    </div>
                  </div>
                </section>

                <section className="profile-panel">
                  <h2>Comunidades favoritas</h2>
                  <div className="community">
                    <span className="community-dot" />
                    <div>
                      <strong>r/ArenaDoArroto</strong>
                      <small>moderador informal</small>
                    </div>
                  </div>
                  <div className="community">
                    <span className="community-dot lime" />
                    <div>
                      <strong>r/ArrotoEmVídeo</strong>
                      <small>membro ativo</small>
                    </div>
                  </div>
                  <div className="community">
                    <span className="community-dot blue" />
                    <div>
                      <strong>r/CausosDeBar</strong>
                      <small>membro ativo</small>
                    </div>
                  </div>
                </section>
              </aside>
            </div>
          </section>
        )}

        {/* RODAPÉ DO SITE 1:1 */}
        <footer className="site-footer" aria-label="Institucional">
          <div>
            <div className="footer-brand">
              <svg className="aue-mark" viewBox="0 0 32 32" aria-hidden="true">
                <path d="M7 22V10" />
                <path d="M16 25V7" />
                <path d="M25 20v-8" />
              </svg>
              <span className="footer-word">
                au<b>ê</b>
              </span>
            </div>
            <span>Uma comunidade para a zoeira ficar na roda.</span>
          </div>
          <nav className="footer-links" aria-label="Links institucionais">
            <button className="footer-link" type="button" onClick={() => abrirInstitucional('sobre')}>
              Sobre o Auê
            </button>
            <button className="footer-link" type="button" onClick={() => abrirInstitucional('regras')}>
              Regras da comunidade
            </button>
            <button className="footer-link" type="button" onClick={() => abrirInstitucional('privacidade')}>
              Privacidade
            </button>
            <button className="footer-link" type="button" onClick={() => abrirInstitucional('termos')}>
              Termos de uso
            </button>
            <button className="footer-link" type="button" onClick={() => abrirInstitucional('contato')}>
              Contato
            </button>
          </nav>
        </footer>
      </main>

      {/* RIGHTBAR DIREITA 1:1 */}
      <aside className="rightbar" aria-label="Painel da comunidade">
        <section className="panel">
          <h2>Sobre a r/{viewAtual === 'comunidade' ? comunidadeSlug : 'ArenaDoArroto'}</h2>
          <p>
            {viewAtual === 'comunidade'
              ? comunidadeAtiva?.descricao || COMUNIDADES_CANONICAS[comunidadeSlug]?.description || 'O ponto de encontro para quem coleciona sons, histórias e coragem desnecessária.'
              : 'O ponto de encontro para quem coleciona sons, histórias e coragem desnecessária.'}
          </p>
          <div className="od-grid stats">
            <div className="od-stat">
              <span className="stat-number">
                {viewAtual === 'comunidade' && comunidadeAtiva?.membrosTotal
                  ? formatarMilhar(comunidadeAtiva.membrosTotal)
                  : '42,8k'}
              </span>
              <span className="stat-label">na roda</span>
            </div>
            <div className="od-stat">
              <span className="stat-number">1,2k</span>
              <span className="stat-label">agora</span>
            </div>
            <div className="od-stat">
              <span className="stat-number">2019</span>
              <span className="stat-label">fundada</span>
            </div>
          </div>
        </section>

        <section className="panel">
          <h2>Comunidades em alta</h2>
          {comunidades.slice(0, 3).map((c, i) => {
            const cores = ['lime', 'blue', ''];
            const entrou = Boolean(comunidadesEntradas[c.slug]);
            return (
              <div key={c.id} className="community">
                <span className={`community-dot ${cores[i % cores.length]}`} />
                <div>
                  <strong>
                    <Link to={`/c/${c.slug}`} onClick={() => abrirComunidade(c.slug)}>
                      r/{c.slug}
                    </Link>
                  </strong>
                  <small>{c.nome}</small>
                </div>
                <button
                  className="join"
                  type="button"
                  style={{ color: entrou ? 'var(--lime)' : 'inherit' }}
                  onClick={() => void alternarEntrarComunidade(c.slug)}
                >
                  {entrou ? 'Entrou' : 'Entrar'}
                </button>
              </div>
            );
          })}
          {comunidades.length === 0 && (
            <>
              <div className="community">
                <span className="community-dot lime" />
                <div>
                  <strong>
                    <Link to="/c/arroto-em-video" onClick={() => abrirComunidade('arroto-em-video')}>
                      r/ArrotoEmVídeo
                    </Link>
                  </strong>
                  <small>18,2 mil na roda</small>
                </div>
                <button
                  className="join"
                  type="button"
                  onClick={() => void alternarEntrarComunidade('arroto-em-video')}
                >
                  {comunidadesEntradas['arroto-em-video'] ? 'Entrou' : 'Entrar'}
                </button>
              </div>
              <div className="community">
                <span className="community-dot blue" />
                <div>
                  <strong>
                    <Link to="/c/causos-de-bar" onClick={() => abrirComunidade('causos-de-bar')}>
                      r/CausosDeBar
                    </Link>
                  </strong>
                  <small>9,8 mil na roda</small>
                </div>
                <button
                  className="join"
                  type="button"
                  onClick={() => void alternarEntrarComunidade('causos-de-bar')}
                >
                  {comunidadesEntradas['causos-de-bar'] ? 'Entrou' : 'Entrar'}
                </button>
              </div>
            </>
          )}
        </section>

        <section className="panel">
          <h2>Regras rápidas</h2>
          <p>Sem humilhar ninguém. Conteúdo seu ou com permissão. Aqui a graça é coletiva.</p>
        </section>
      </aside>

      {/* MODAL SOLTAR ARROTO 1:1 */}
      <div
        className={`modal ${modalCompositorAberto ? 'open' : ''}`}
        id="composerModal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="composerTitle"
        onClick={(e) => {
          if (e.target === e.currentTarget) setModalCompositorAberto(false);
        }}
      >
        <div className="dialog">
          <div className="dialog-head">
            <h2 id="composerTitle">Soltar um arroto</h2>
            <button
              className="close"
              id="closeComposer"
              type="button"
              aria-label="Fechar"
              onClick={() => setModalCompositorAberto(false)}
            >
              ×
            </button>
          </div>

          <div className="post-types">
            <button
              type="button"
              className={tipoPost === 'Texto' ? 'active' : ''}
              onClick={() => setTipoPost('Texto')}
            >
              Texto
            </button>
            <button
              type="button"
              className={tipoPost === 'Áudio' ? 'active' : ''}
              onClick={() => setTipoPost('Áudio')}
            >
              Áudio
            </button>
            <button
              type="button"
              className={tipoPost === 'Vídeo' ? 'active' : ''}
              onClick={() => setTipoPost('Vídeo')}
            >
              Vídeo
            </button>
          </div>

          <form onSubmit={(e) => void submeterPublicacao(e)} className="od-stack" style={{ gap: '12px' }}>
            {comunidades.length > 0 && (
              <label className="od-stack" style={{ gap: '4px', fontSize: '13px', color: 'var(--muted)' }}>
                Comunidade
                <select
                  value={postComunidadeSlug}
                  onChange={(e) => setPostComunidadeSlug(e.target.value)}
                  style={{
                    height: '42px',
                    borderRadius: '8px',
                    background: 'var(--surface)',
                    color: 'var(--text)',
                    border: '1px solid var(--line)',
                    padding: '0 12px',
                  }}
                >
                  {comunidades.map((c) => (
                    <option key={c.id} value={c.slug}>
                      r/{c.slug} ({c.nome})
                    </option>
                  ))}
                </select>
              </label>
            )}

            <input
              id="postTitle"
              aria-label="Título da publicação"
              placeholder="Um título que chama a roda"
              value={postTitulo}
              onChange={(e) => setPostTitulo(e.target.value)}
              required
            />
            <textarea
              id="postText"
              aria-label="Texto da publicação"
              placeholder="Conta o que aconteceu..."
              value={postCorpo}
              onChange={(e) => setPostCorpo(e.target.value)}
            />

            {tipoPost === 'Áudio' && (
              <div style={{ padding: '8px 0', fontSize: '13px', color: 'var(--lime)' }}>
                Dica: Arrotos gravados na Arena podem ser atrelados automaticamente com a nota de IA.
              </div>
            )}

            <button className="submit" id="publish" type="submit" disabled={publicando}>
              {publicando ? 'Publicando…' : 'Publicar no Auê'}
            </button>
          </form>
        </div>
      </div>

      {/* MODAL FUNDAR COMUNIDADE 1:1 */}
      <div
        className={`modal ${modalFundarAberto ? 'open' : ''}`}
        id="foundCommunityModal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="foundCommunityTitle"
        onClick={(e) => {
          if (e.target === e.currentTarget) setModalFundarAberto(false);
        }}
      >
        <form
          className="dialog profile-form"
          id="foundCommunityForm"
          onSubmit={(e) => {
            e.preventDefault();
            if (!novaComunidadeNome.trim()) return;
            exibirToast(`Comunidade r/${novaComunidadeNome.toLowerCase().replace(/[^a-z0-9_-]/g, '')} criada!`);
            setModalFundarAberto(false);
            setNovaComunidadeNome('');
            setNovaComunidadeSobre('');
          }}
        >
          <div className="dialog-head">
            <h2 id="foundCommunityTitle">Fundar comunidade</h2>
            <button
              className="close"
              type="button"
              id="closeCommunityFounder"
              aria-label="Fechar"
              onClick={() => setModalFundarAberto(false)}
            >
              ×
            </button>
          </div>
          <p className="modal-note">Dá um nome, explica a vibe e deixa a primeira regra bem clara.</p>
          <label>
            Nome da comunidade
            <input
              id="communityNameInput"
              maxLength={28}
              placeholder="Ex.: Arroto de Domingo"
              value={novaComunidadeNome}
              onChange={(e) => setNovaComunidadeNome(e.target.value)}
              required
            />
          </label>
          <label>
            Sobre a comunidade
            <textarea
              id="communityDescriptionInput"
              maxLength={180}
              placeholder="Qual é a vibe daqui?"
              value={novaComunidadeSobre}
              onChange={(e) => setNovaComunidadeSobre(e.target.value)}
              required
            />
          </label>
          <label>
            Tema principal
            <select id="communityTopicInput">
              <option value="Sons">Sons e áudios</option>
              <option value="Vídeos">Vídeos e duelos</option>
              <option value="Causos">Causos e histórias</option>
              <option value="Geral">Tudo junto</option>
            </select>
          </label>
          <label>
            Primeira regra
            <input
              id="communityRulesInput"
              maxLength={100}
              value={novaComunidadeRegra}
              onChange={(e) => setNovaComunidadeRegra(e.target.value)}
              required
            />
          </label>
          <button className="submit" type="submit">
            Fundar e abrir
          </button>
        </form>
      </div>

      {/* MODAL INSTITUCIONAL 1:1 */}
      <div
        className={`modal ${institucionalAberto ? 'open' : ''}`}
        id="institutionalModal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="institutionalTitle"
        onClick={(e) => {
          if (e.target === e.currentTarget) setInstitucionalAberto(false);
        }}
      >
        <section className="dialog">
          <div className="dialog-head">
            <h2 id="institutionalTitle">{conteudoInstitucionalAtual.titulo}</h2>
            <button
              className="close"
              type="button"
              id="closeInstitutional"
              aria-label="Fechar"
              onClick={() => setInstitucionalAberto(false)}
            >
              ×
            </button>
          </div>
          <p className="institutional-copy" id="institutionalCopy">
            {conteudoInstitucionalAtual.texto}
          </p>
        </section>
      </div>

      {/* MODAL ADMINISTRAR COMUNIDADE 1:1 */}
      <div
        className={`modal ${modalGerirComunidadeAberto ? 'open' : ''}`}
        id="communityManageModal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="communityManageTitle"
        onClick={(e) => {
          if (e.target === e.currentTarget) setModalGerirComunidadeAberto(false);
        }}
      >
        <form
          className="dialog profile-form community-form"
          id="communityManageForm"
          onSubmit={(e) => {
            e.preventDefault();
            const regrasNovas = regrasEditor
              .split('\n')
              .map((r) => r.trim())
              .filter(Boolean);
            const modsNovos = moderadoresEditor
              .split('\n')
              .map((l) => l.split('|').map((p) => p.trim()))
              .filter((parts) => parts[0])
              .map((parts) => [parts[0], parts[1] || 'moderador'] as [string, string]);
            if (regrasNovas.length > 0) setRegrasDaComunidade(regrasNovas);
            if (modsNovos.length > 0) setModeradoresDaComunidade(modsNovos);
            setModalGerirComunidadeAberto(false);
            exibirToast('Gestão da comunidade salva.');
          }}
        >
          <div className="dialog-head">
            <h2 id="communityManageTitle">Administrar comunidade</h2>
            <button
              className="close"
              type="button"
              id="closeCommunityManage"
              aria-label="Fechar"
              onClick={() => setModalGerirComunidadeAberto(false)}
            >
              ×
            </button>
          </div>
          <p className="community-admin-note">Defina o combinado da roda e quem cuida dela.</p>
          <label>
            Regras da comunidade
            <textarea
              id="communityRulesEditor"
              maxLength={500}
              value={regrasEditor}
              onChange={(e) => setRegrasEditor(e.target.value)}
              required
            />
          </label>
          <p className="form-hint">Uma regra por linha.</p>
          <label>
            Moderadores
            <textarea
              id="communityModeratorsEditor"
              maxLength={400}
              value={moderadoresEditor}
              onChange={(e) => setModeradoresEditor(e.target.value)}
              required
            />
          </label>
          <p className="form-hint">Uma pessoa por linha: usuário | papel.</p>
          <button className="submit" type="submit">
            Salvar gestão
          </button>
        </form>
      </div>

      {/* MODAL EDITAR PERFIL 1:1 */}
      <div
        className={`modal ${modalPerfilAberto ? 'open' : ''}`}
        id="profileModal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="profileEditorTitle"
        onClick={(e) => {
          if (e.target === e.currentTarget) setModalPerfilAberto(false);
        }}
      >
        <form
          className="dialog profile-form"
          id="profileForm"
          onSubmit={salvarEdicaoPerfil}
        >
          <div className="dialog-head">
            <h2 id="profileEditorTitle">Editar perfil</h2>
            <button
              className="close"
              type="button"
              id="closeProfileEditor"
              aria-label="Fechar"
              onClick={() => setModalPerfilAberto(false)}
            >
              ×
            </button>
          </div>
          <div className="od-row">
            <span className="avatar-preview" id="avatarPreview">
              {perfilIniciaisInput}
            </span>
            <label className="od-fill">
              Iniciais no avatar
              <input
                id="avatarInitials"
                maxLength={3}
                value={perfilIniciaisInput}
                onChange={(e) => setPerfilIniciaisInput((e.target.value || '').toUpperCase())}
                required
              />
            </label>
          </div>
          <label>
            Nome de exibição
            <input
              id="profileNameInput"
              value={perfilNomeInput}
              onChange={(e) => setPerfilNomeInput(e.target.value)}
              required
            />
          </label>
          <label>
            Bio
            <textarea
              id="profileBioInput"
              maxLength={180}
              value={perfilBioInput}
              onChange={(e) => setPerfilBioInput(e.target.value)}
            />
          </label>
          <label>
            Cidade
            <input
              id="profileCityInput"
              value={perfilCidadeInput}
              onChange={(e) => setPerfilCidadeInput(e.target.value)}
            />
          </label>
          <button className="submit" type="submit">
            Salvar mudanças
          </button>
        </form>
      </div>

      {/* TOAST FEEDBACK 1:1 */}
      {toastMensagem && (
        <div
          role="status"
          aria-live="polite"
          style={{
            position: 'fixed',
            zIndex: 40,
            left: '50%',
            bottom: '24px',
            transform: 'translate(-50%, 0)',
            width: 'min(420px, calc(100vw - 32px))',
            padding: '12px 15px',
            border: '1px solid #5b4a76',
            borderRadius: '10px',
            background: '#2a2235',
            color: '#f5f4ef',
            boxShadow: '0 16px 40px rgba(0,0,0,.22)',
            fontSize: '13px',
            fontWeight: 800,
            transition: 'opacity .18s ease, transform .18s ease',
          }}
        >
          {toastMensagem}
        </div>
      )}
    </div>
  );
}
