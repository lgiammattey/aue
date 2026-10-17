import React, { useCallback, useEffect, useRef, useState } from 'react';
import { criarComunidadeWeb } from '../../plataforma/web/comunidade';
import type {
  CausoPostado,
  PortaDeComunidade,
} from '../../portas/comunidade';
import { ORIGEM_CANONICA } from '../../shared/enderecoPublico';
import { BolhaAue } from '../../arena/bolha/BolhaAue';

interface TelaComunidadeProps {
  initialTab?: 'feed' | 'arena' | 'comm' | 'desafios' | 'perfil';
  porta?: PortaDeComunidade;
  onArrotar?: () => void;
  onDuvidar?: (causo: CausoPostado) => void;
  resultadoRecente?: { id: string; nota: number };
}

interface PostItem {
  id: number | string;
  name: string;
  handle: string;
  ini: string;
  when: string;
  community: string;
  communitySlug?: string;
  text: string;
  audio?: boolean;
  dur?: string;
  score?: number;
  likes: number;
  liked?: boolean;
  replies: number;
  reposts: number;
  reposted?: boolean;
  mine?: boolean;
}

interface ChallengeItem {
  id: number | string;
  title: string;
  a: string;
  b: string;
  sa: number | string;
  sb: number | string;
  status: string;
  code: string;
}

export const TelaComunidade: React.FC<TelaComunidadeProps> = ({
  initialTab = 'feed',
  porta,
  onArrotar,
  onDuvidar,
  resultadoRecente,
}) => {
  const [adaptador] = useState<PortaDeComunidade>(() => porta ?? criarComunidadeWeb());
  void adaptador;
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [w, setW] = useState<number>(() => (typeof window !== 'undefined' ? window.innerWidth : 1200));
  const [tab, setTab] = useState<'feed' | 'arena' | 'comm' | 'desafios' | 'perfil'>(initialTab);
  const [filter, setFilter] = useState<'all' | 'comm'>('all');
  const [composing, setComposing] = useState(false);
  const [ctype, setCtype] = useState<'texto' | 'audio' | 'desafio'>('texto');
  const [text, setText] = useState('');
  const [qtext, setQtext] = useState('');
  void setQtext;
  const [opp, setOpp] = useState('');
  const [commSel, setCommSel] = useState('Bonde Geral');
  const [rec, setRec] = useState(false);
  const [secs, setSecs] = useState(0);
  const [recorded, setRecorded] = useState(0);
  const [playing, setPlaying] = useState<number | string | null>(null);
  const [sharing, setSharing] = useState<{ kind: string; ch: any } | null>(null);
  const [gen, setGen] = useState(-1);
  const [toast, setToast] = useState('');
  const [joined, setJoined] = useState<string[]>([
    'Bonde Geral',
    'Cerveja Gelada',
    'Eu arroto, e daí?',
    'Na reunião da firma',
  ]);
  const [following, setFollowing] = useState<string[]>([]);
  const [filterCommunity, setFilterCommunity] = useState<string | null>(null);
  const [authorName, setAuthorName] = useState('Você');
  const [profileTab, setProfileTab] = useState<'causos' | 'x1' | 'curtidas'>('causos');

  // Estado da Arena (1:1 com Arena.dc.html)
  const [arenaState, setArenaState] = useState<
    'IDLE' | 'RECORDING' | 'VALIDATING' | 'JUDGING' | 'RESULT_REVEAL' | 'RESULT' | 'CHALLENGE_CREATED' | 'WAITING_OPPONENT' | 'SCOREBOARD' | 'DRAW' | 'REMATCH'
  >('IDLE');
  const [arenaSecs, setArenaSecs] = useState(0);
  const [arenaNota, setArenaNota] = useState(91);
  const [arenaJaGravou, setArenaJaGravou] = useState(false);
  const [arenaContagem, setArenaContagem] = useState(3);
  const [arenaBest, setArenaBest] = useState(88);

  // Timers da Arena e do Feed
  const timerRec = useRef<any>(null);
  const timerGen = useRef<any>(null);
  const timerToast = useRef<any>(null);
  const timerPlay = useRef<any>(null);
  const timerArenaRec = useRef<any>(null);
  const arenaTransitionTimers = useRef<any[]>([]);

  // Lista de Comunidades do Protótipo
  const [communities] = useState<Array<{ name: string; slug: string; ini: string; desc: string; members: string }>>([
    { name: 'Bonde Geral', slug: 'bonde-geral', ini: 'BG', desc: 'A praça central. Todo mundo arrota aqui.', members: '48,2 mil' },
    { name: 'Cerveja Gelada', slug: 'cerveja-gelada', ini: 'CG', desc: 'Arroto de long neck, chope e lata.', members: '12,9 mil' },
    { name: 'Refri & Cia', slug: 'refri-cia', ini: 'RC', desc: 'Gás de refrigerante. Grave é lei.', members: '9,4 mil' },
    { name: 'Histórias de Arroto', slug: 'historias-de-arroto', ini: 'HA', desc: 'Casos, vexames e lendas de família.', members: '21,7 mil' },
    { name: 'Churrasco Raiz', slug: 'churrasco-raiz', ini: 'CR', desc: 'Pós-picanha. Respeito.', members: '7,1 mil' },
    { name: 'Eu arroto, e daí?', slug: 'eu-arroto-e-dai', ini: '🦍', desc: 'A comunidade mãe do Auê. Orgulho do estrago e zero pudor.', members: '34,5 mil' },
    { name: 'Na reunião da firma', slug: 'reuniao-da-firma', ini: '💼', desc: 'Microfone aberto sem querer no Meet e a culpa no ar-condicionado.', members: '15,3 mil' },
    { name: 'Primeiro encontro', slug: 'primeiro-encontro', ini: '💔', desc: 'O momento que era pra ser romântico e virou trauma inesquecível.', members: '18,9 mil' },
    { name: 'Arroto trovão', slug: 'trovao-da-madrugada', ini: '⚡', desc: 'Aquele que treme o vidro da sala e assusta o vizinho.', members: '26,4 mil' },
  ]);

  // Posts Iniciais do Protótipo + Seeds do Auê
  const [posts, setPosts] = useState<PostItem[]>([
    { id: 1, name: 'Betão da TI', handle: 'betaodati', ini: 'BT', when: '18min', community: 'Na reunião da firma', communitySlug: 'reuniao-da-firma', text: 'Mandei ver na call com o diretor financeiro achando que tava mutado. O microfone do headset captou cada harmônico. Silêncio de 10 segundos no Teams.', audio: true, dur: '0:06', score: 91, likes: 42, replies: 14, reposts: 19 },
    { id: 99, name: 'Você', handle: 'voce_arrota', ini: 'VC', when: '1d', community: 'Eu arroto, e daí?', communitySlug: 'eu-arroto-e-dai', text: 'Soltei um grave no almoço de domingo que calou até o cachorro do vizinho. Nota 88 valendo pelo bonde.', audio: true, dur: '0:06', score: 88, likes: 19, replies: 4, reposts: 2, mine: true },
    { id: 2, name: 'Dani Gás', handle: 'danigas', ini: 'DG', when: '4min', community: 'Cerveja Gelada', communitySlug: 'cerveja-gelada', text: 'Terminei a long neck de uma vez e saiu um que fez a vizinha bater na parede. Nota 94, sem frescura.', audio: true, dur: '0:07', score: 94, likes: 128, replies: 23, reposts: 31 },
    { id: 3, name: 'Tio Beto', handle: 'tiobeto', ini: 'TB', when: '32min', community: 'Histórias de Arroto', communitySlug: 'historias-de-arroto', text: 'Churrasco de família, silêncio na hora da oração, e o meu cunhado solta um arroto em ré maior. Ninguém olhou pra ninguém por 40 segundos.', likes: 412, replies: 87, reposts: 120 },
    { id: 4, name: 'Rafa Fôlego', handle: 'rafafolego', ini: 'RF', when: '1h', community: 'Bonde Geral', communitySlug: 'bonde-geral', text: 'Quem aguenta 10 segundos? Tô esperando o X1. Quem pular fora ganha o apelido.', audio: true, dur: '0:11', score: 81, likes: 77, replies: 41, reposts: 18 },
    { id: 5, name: 'Marcão do RH', handle: 'marcaorh', ini: 'MR', when: '2h', community: 'Na reunião da firma', communitySlug: 'reuniao-da-firma', text: 'Reunião geral de alinhamento de metas. Bateu aquele refluxo pós-almoço e o fone bluetooth conectou sozinho no som do projetor.', audio: true, dur: '0:04', score: 78, likes: 34, replies: 9, reposts: 12 },
    { id: 6, name: 'Mari Grave', handle: 'marigrave', ini: 'MG', when: '3h', community: 'Refri & Cia', communitySlug: 'refri-cia', text: 'Guaraná gelado, grave de elevador. Dá pra sentir no peito.', audio: true, dur: '0:05', score: 68, likes: 54, replies: 9, reposts: 4 },
  ]);

  // Desafios Ativos do Protótipo
  const [challenges, setChallenges] = useState<ChallengeItem[]>([
    { id: 1, title: 'Churrasco de domingo', a: 'voce_arrota', b: 'tiobeto', sa: 88, sb: 91, status: 'Perdeu', code: 'k4x9' },
    { id: 2, title: 'Quem segura mais', a: 'voce_arrota', b: 'rafafolego', sa: 76, sb: '—', status: 'Esperando', code: 'p2m7' },
  ]);

  const trends = [
    { cat: 'Cerveja Gelada', tag: '#LongNeckChallenge', n: '8,4 mil' },
    { cat: 'Em alta', tag: '#X1DeDomingo', n: '5,1 mil' },
    { cat: 'Histórias de Arroto', tag: '#VexameNoChurrasco', n: '3,7 mil' },
    { cat: 'Refri & Cia', tag: '#GraveDeElevador', n: '1,9 mil' },
  ];

  const suggest = [
    { name: 'Dani Gás', handle: 'danigas', ini: 'DG' },
    { name: 'Mari Grave', handle: 'marigrave', ini: 'MG' },
    { name: 'Rafa Fôlego', handle: 'rafafolego', ini: 'RF' },
  ];

  // Listener de resize e montagem
  useEffect(() => {
    try {
      const t = localStorage.getItem('bda-theme') as 'dark' | 'light' | null;
      if (t) setTheme(t);
    } catch {
      // Ignora erro
    }

    const onResize = () => setW(window.innerWidth);
    window.addEventListener('resize', onResize);

    const currentArenaTimers = arenaTransitionTimers.current;
    return () => {
      window.removeEventListener('resize', onResize);
      clearInterval(timerRec.current);
      clearInterval(timerGen.current);
      clearTimeout(timerToast.current);
      clearTimeout(timerPlay.current);
      clearInterval(timerArenaRec.current);
      currentArenaTimers.forEach(clearTimeout);
    };
  }, []);

  // Se receber resultado recente de gravação
  useEffect(() => {
    if (resultadoRecente) {
      setArenaNota(resultadoRecente.nota);
      setArenaBest((b) => Math.max(b, resultadoRecente.nota));
      setTab('arena');
      setArenaState('RESULT');
    }
  }, [resultadoRecente]);

  // Toast
  const say = useCallback((msg: string) => {
    setToast(msg);
    clearTimeout(timerToast.current);
    timerToast.current = setTimeout(() => setToast(''), 2200);
  }, []);

  const fmt = (s: number) => '0:' + String(s).padStart(2, '0');

  // Barras de áudio do player (28 barras)
  const bars = (seed: number, on: boolean) =>
    Array.from({ length: 28 }, (_, i) => ({
      style: {
        width: 3,
        height: 6 + Math.abs(Math.sin(i * 1.7 + seed)) * 20,
        borderRadius: 2,
        background: on ? 'var(--fg)' : 'var(--muted)',
        flex: 'none',
      },
    }));

  // Toggle Tema
  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    try {
      localStorage.setItem('bda-theme', next);
    } catch {
      // Ignora erro
    }
  };

  // Gravador de áudio no modal de composição
  const toggleRec = () => {
    if (rec) {
      clearInterval(timerRec.current);
      setRec(false);
      setRecorded(secs);
      return;
    }
    setRec(true);
    setSecs(0);
    setRecorded(0);
    timerRec.current = setInterval(() => {
      setSecs((s) => {
        if (s >= 15) {
          clearInterval(timerRec.current);
          setRec(false);
          setRecorded(15);
          return 15;
        }
        return s + 1;
      });
    }, 1000);
  };

  // Simulação de geração de vídeo 9:16
  const startGen = () => {
    setGen(0);
    clearInterval(timerGen.current);
    timerGen.current = setInterval(() => {
      setGen((g) => {
        const next = g + 12 + Math.random() * 10;
        if (next >= 100) {
          clearInterval(timerGen.current);
          say('Vídeo 9:16 pronto pro TikTok. Baixando.');
          return -1;
        }
        return next;
      });
    }, 300);
  };

  // Publicar causo/áudio/desafio
  const addPost = (audio: boolean, txt: string, comm: string, r: number, name = 'Você') => {
    const autor = name.trim() || 'Você';
    const p: PostItem = {
      id: Date.now(),
      name: autor,
      handle: autor.toLowerCase().replace(/\s+/g, '_'),
      ini: autor.slice(0, 2).toUpperCase(),
      when: 'agora',
      community: comm,
      text: txt,
      audio,
      dur: fmt(r || 0),
      score: 60 + ((r || 0) * 11) % 38,
      likes: 0,
      replies: 0,
      reposts: 0,
      mine: true,
    };
    setPosts((prev) => [p, ...prev]);
    setTab('feed');
    setFilter('all');
    say('Postado em ' + comm + '.');
  };

  const publish = () => {
    if (ctype === 'audio' && !recorded) {
      say('Grava o arroto primeiro.');
      return;
    }
    if (ctype !== 'audio' && !text.trim()) {
      say('Escreve alguma coisa.');
      return;
    }

    if (ctype === 'desafio') {
      const ch: ChallengeItem = {
        id: Date.now(),
        title: text.trim().slice(0, 40) || 'Desafio X1',
        a: authorName.trim() ? authorName.trim().toLowerCase().replace(/\s+/g, '_') : 'voce_arrota',
        b: (opp || 'amigo').replace('@', ''),
        sa: recorded ? 70 + ((recorded * 7) % 28) : '—',
        sb: '—',
        status: 'Esperando',
        code: Math.random().toString(36).slice(2, 6),
      };
      setChallenges((prev) => [ch, ...prev]);
      setComposing(false);
      setText('');
      setOpp('');
      setRecorded(0);
      setTab('desafios');
      setSharing({ kind: 'x1', ch });
      return;
    }

    addPost(ctype === 'audio', text.trim() || 'Áudio novo no bonde.', commSel, recorded, authorName);
    setComposing(false);
    setText('');
    setRecorded(0);
  };

  const playPost = (id: number | string) => {
    clearTimeout(timerPlay.current);
    if (playing === id) {
      setPlaying(null);
      return;
    }
    setPlaying(id);
    timerPlay.current = setTimeout(() => setPlaying(null), 3000);
  };

  const toggleLike = (id: number | string) => {
    setPosts((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, liked: !p.liked, likes: p.likes + (p.liked ? -1 : 1) } : p,
      ),
    );
  };

  const toggleRepost = (id: number | string) => {
    setPosts((prev) =>
      prev.map((p) =>
        p.id === id
          ? { ...p, reposted: !p.reposted, reposts: p.reposts + (p.reposted ? -1 : 1) }
          : p,
      ),
    );
  };

  const toggleFollow = (handle: string) => {
    setFollowing((prev) =>
      prev.includes(handle) ? prev.filter((h) => h !== handle) : [...prev, handle],
    );
  };

  const toggleCommunity = (name: string) => {
    const isJoined = joined.includes(name);
    setJoined((prev) => (isJoined ? prev.filter((c) => c !== name) : [...prev, name]));
    say(isJoined ? 'Saiu de ' + name : 'Você entrou em ' + name);
  };

  // Handlers da Arena (1:1 com Arena.dc.html)
  const afterArena = (ms: number, fn: () => void) => {
    const t = setTimeout(fn, ms);
    arenaTransitionTimers.current.push(t);
  };

  const recArena = () => {
    clearInterval(timerArenaRec.current);
    setArenaState('RECORDING');
    setArenaSecs(0);
    setArenaJaGravou(true);
    timerArenaRec.current = setInterval(() => {
      setArenaSecs((s) => {
        if (s >= 9) {
          pararArena();
          return 9;
        }
        return s + 1;
      });
    }, 1000);
  };

  const pararArena = () => {
    clearInterval(timerArenaRec.current);
    setArenaState('VALIDATING');
    afterArena(900, () => setArenaState('JUDGING'));
    afterArena(2400, () => {
      const n = Math.floor(60 + Math.random() * 40);
      setArenaNota(n);
      setArenaBest((b) => Math.max(b, n));
      setArenaState('RESULT_REVEAL');
    });
    afterArena(3900, () => setArenaState('RESULT'));
  };

  const x1Arena = () => {
    setArenaState('CHALLENGE_CREATED');
  };

  const postarArena = () => {
    addPost(true, 'Arroto gravado na Arena. Bate aí!', 'Bonde Geral', 7);
    say('Postado no Bonde Geral com nota ' + arenaNota + '.');
  };

  const esperarArena = () => {
    setArenaState('WAITING_OPPONENT');
  };

  const empateArena = () => {
    setArenaState('DRAW');
  };

  const placarArena = () => {
    setArenaState('SCOREBOARD');
  };

  const revancheArena = () => {
    setArenaState('REMATCH');
    setArenaContagem(3);
    afterArena(620, () => setArenaContagem(2));
    afterArena(1240, () => setArenaContagem(1));
    afterArena(1860, () => recArena());
  };

  const sairArena = () => {
    setArenaState('IDLE');
  };

  // Layout Responsivo
  const mobile = w < 700;
  const wide = w >= 1200;
  const showRight = w >= 1000;

  const vars =
    theme === 'light'
      ? {
          '--bg': '#f5f3ea',
          '--surface': '#ebe9de',
          '--surface-2': '#dedcd0',
          '--fg': '#0a0a08',
          '--muted': '#6b6957',
          '--border': '#d6d4c6',
          '--fg-soft': 'rgba(10,10,8,.04)',
          '--overlay-scrim': 'rgba(245,243,234,.92)',
          '--accent': 'var(--cor-acento, #e63946)',
          '--accent-on': '#ffffff',
          '--accent-strong': '#d62839',
          '--danger': '#ef4444',
          colorScheme: 'light',
        }
      : {
          '--bg': '#0a0a08',
          '--surface': '#141410',
          '--surface-2': '#1e1e18',
          '--fg': '#f5f3ea',
          '--muted': '#9e9c8d',
          '--border': '#2a2a22',
          '--fg-soft': 'rgba(245,243,234,.06)',
          '--overlay-scrim': 'rgba(10,10,8,.92)',
          '--accent': 'var(--cor-acento, #e63946)',
          '--accent-on': '#ffffff',
          '--accent-strong': '#ff4d5e',
          '--danger': '#ef4444',
          colorScheme: 'dark',
        };

  const tabsNav = [
    { key: 'feed', label: 'Início', path: 'M3 11l9-8 9 8v10h-6v-6H9v6H3z' },
    { key: 'arena', label: 'Arena', path: 'M12 15a3 3 0 003-3V6a3 3 0 00-6 0v6a3 3 0 003 3zM5 11a7 7 0 0014 0M12 18v3' },
    { key: 'comm', label: 'Bondes', path: 'M16 11a4 4 0 100-8 4 4 0 000 8zM2 21v-1a6 6 0 0112 0v1M17 14a5 5 0 015 5v2' },
    { key: 'desafios', label: 'Desafios', path: 'M8 21h8M12 17v4M7 4h10v5a5 5 0 01-10 0zM17 5h3v2a3 3 0 01-3 3M7 5H4v2a3 3 0 003 3' },
    { key: 'perfil', label: 'Perfil', path: 'M12 12a5 5 0 100-10 5 5 0 000 10zM4 22a8 8 0 0116 0' },
  ];

  const pageTitles: Record<string, string> = {
    feed: 'Início',
    arena: 'Arena',
    comm: 'Bondes',
    desafios: 'Desafios',
    perfil: 'Perfil',
  };

  const arenaLabels: Record<string, string> = {
    IDLE: 'Pronto',
    RECORDING: 'Gravando',
    VALIDATING: 'Conferindo',
    JUDGING: 'Julgando',
    RESULT_REVEAL: 'Nota',
    RESULT: 'Resultado',
    CHALLENGE_CREATED: 'X1 criado',
    WAITING_OPPONENT: 'Esperando',
    SCOREBOARD: 'Placar',
    DRAW: 'Empate',
    REMATCH: 'Revanche',
  };

  const arenaBolhaModo: Record<string, 'repouso' | 'gravando' | 'julgando' | 'entregando' | 'segurando' | 'esperando'> = {
    IDLE: 'repouso',
    RECORDING: 'gravando',
    VALIDATING: 'julgando',
    JUDGING: 'julgando',
    RESULT_REVEAL: 'entregando',
    RESULT: 'entregando',
    CHALLENGE_CREATED: 'segurando',
    WAITING_OPPONENT: 'esperando',
    SCOREBOARD: 'entregando',
    DRAW: 'entregando',
    REMATCH: 'repouso',
  };

  const falaArena = arenaNota >= 85 ? 'Tá maluco.' : arenaNota >= 60 ? 'Caralho, veio forte.' : 'Foi isso?';
  const arenaTitles: Record<string, string> = {
    IDLE: 'Bora?',
    JUDGING: 'Tô julgando essa porra.',
    RESULT_REVEAL: falaArena,
    RESULT: falaArena,
    DRAW: 'Ninguém ganhou.',
  };
  const arenaSubs: Record<string, string> = {
    IDLE: 'Solta o primeiro e vê quanto dá.',
    VALIDATING: 'Conferindo…',
    RESULT: 'Manda isso no bonde e vê se alguém peita.',
    CHALLENGE_CREATED: 'Link pronto. Manda pro infeliz.',
    WAITING_OPPONENT: 'Ninguém aceitou ainda.',
  };

  const arenaRankings = [
    { pos: 1, name: 'Dani Gás', nota: 94, w: 400 },
    { pos: 2, name: 'Você', nota: arenaBest, w: 700 },
    { pos: 3, name: 'Rafa Fôlego', nota: 81, w: 400 },
    { pos: 4, name: 'Mari Grave', nota: 68, w: 400 },
    { pos: 5, name: 'Tio Beto', nota: 61, w: 400 },
  ].sort((a, b) => b.nota - a.nota).map((item, idx) => ({ ...item, pos: idx + 1 }));

  const arenaOpens = [
    { a: 'voce_arrota', b: 'rafafolego', t: 'Quem segura mais · esperando' },
    { a: 'danigas', b: 'marigrave', t: 'Long neck vs guaraná · 2h' },
  ];

  const visiblePosts = posts.filter((p) => {
    if (filterCommunity) {
      return p.community === filterCommunity;
    }
    return filter === 'all' || joined.includes(p.community);
  });

  // Preparação de dados do card de compartilhamento
  let cardKicker = '';
  let cardScore: string | number = '';
  let cardLine = '';
  let cardCode = 'x1';
  if (sharing) {
    if (sharing.kind === 'x1') {
      cardKicker = '@' + sharing.ch.a + ' chamou @' + sharing.ch.b;
      cardScore = sharing.ch.sa === '—' ? 'X1' : sharing.ch.sa;
      cardLine = 'Bate essa se for homem. Ou mulher.';
      cardCode = sharing.ch.code;
    } else if (sharing.kind === 'ch') {
      cardKicker = sharing.ch.title;
      cardScore = sharing.ch.sa + ' x ' + sharing.ch.sb;
      cardLine = 'Revanche é obrigação.';
      cardCode = sharing.ch.code;
    } else {
      cardKicker = '@' + sharing.ch.handle;
      cardScore = sharing.ch.audio ? sharing.ch.score : 'BO';
      cardLine = sharing.ch.audio ? 'Bate esse arroto.' : sharing.ch.text.slice(0, 48);
      cardCode = 'p' + sharing.ch.id;
    }
  }

  const themeIcon =
    theme === 'light'
      ? 'M21 13A9 9 0 1111 3a7 7 0 0010 10z'
      : 'M12 17a5 5 0 100-10 5 5 0 000 10zM12 1v3M12 20v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M1 12h3M20 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1';

  const renderPostCard = (p: PostItem) => {
    const isPlaying = playing === p.id;
    return (
      <article
        key={p.id}
        style={{
          padding: '12px 16px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          gap: 12,
        }}
      >
        <div
          style={{
            width: 44,
            height: 44,
            flex: 'none',
            borderRadius: '50%',
            background: 'var(--surface-2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            fontSize: 14,
          }}
        >
          {p.ini}
        </div>
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ display: 'flex', gap: 4, alignItems: 'baseline', flexWrap: 'wrap' }}>
            <b style={{ fontSize: 15 }}>{p.name}</b>
            <span style={{ color: 'var(--muted)', fontSize: 15 }}>
              @{p.handle} · {p.when}
            </span>
          </div>
          <span
            style={{
              fontFamily: 'ui-monospace, monospace',
              fontSize: 11,
              color: 'var(--muted)',
              letterSpacing: '.06em',
              textTransform: 'uppercase',
            }}
          >
            em {p.community}
          </span>
          <p style={{ margin: 0, fontSize: 15, lineHeight: 1.45, textWrap: 'pretty' }}>{p.text}</p>

          {/* Player de Áudio com 28 Barras */}
          {p.audio && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                border: '1px solid var(--border)',
                borderRadius: 16,
                padding: 12,
                marginTop: 4,
              }}
            >
              <button
                type="button"
                onClick={() => playPost(p.id)}
                aria-label={isPlaying ? 'Pausar áudio' : 'Tocar áudio'}
                style={{
                  width: 40,
                  height: 40,
                  flex: 'none',
                  borderRadius: '50%',
                  border: 0,
                  background: 'var(--fg)',
                  color: 'var(--bg)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d={isPlaying ? 'M6 4h4v16H6zM14 4h4v16h-4z' : 'M7 4l13 8-13 8z'} />
                </svg>
              </button>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 2, height: 28, minWidth: 0, overflow: 'hidden' }}>
                {bars(typeof p.id === 'number' ? p.id : 1, isPlaying).map((b, i) => (
                  <div key={i} style={b.style as any} />
                ))}
              </div>
              <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: 12, color: 'var(--muted)' }}>
                {p.dur || '0:07'}
              </span>
              <span
                style={{
                  fontFamily: 'var(--font-display, "Anton", sans-serif)',
                  fontSize: 24,
                  lineHeight: 1,
                  background: 'var(--accent)',
                  color: 'var(--accent-on)',
                  borderRadius: 12,
                  padding: '6px 10px',
                }}
              >
                {p.score || 88}
              </span>
            </div>
          )}

          {/* Ações do Card */}
          <div style={{ display: 'flex', justifyContent: 'space-between', maxWidth: 420, marginLeft: -8, marginTop: 4 }}>
            <button
              type="button"
              onClick={() => say('Respostas chegam na v2.')}
              style={{ background: 'none', border: 0, color: 'var(--muted)', fontSize: 13, padding: '6px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M21 12a8 8 0 01-11.6 7.1L3 21l1.9-6.4A8 8 0 1121 12z" />
              </svg>
              {p.replies}
            </button>
            <button
              type="button"
              onClick={() => toggleRepost(p.id)}
              style={{ background: 'none', border: 0, color: p.reposted ? 'var(--fg)' : 'var(--muted)', fontWeight: p.reposted ? 700 : 400, fontSize: 13, padding: '6px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M17 2l4 4-4 4M3 11V9a3 3 0 013-3h15M7 22l-4-4 4-4M21 13v2a3 3 0 01-3 3H3" />
              </svg>
              {p.reposts}
            </button>
            <button
              type="button"
              onClick={() => toggleLike(p.id)}
              aria-label={`Reagir com fogo (${p.likes})`}
              style={{ background: 'none', border: 0, color: p.liked ? 'var(--danger)' : 'var(--muted)', fontWeight: p.liked ? 700 : 400, fontSize: 13, padding: '6px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill={p.liked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 21s-8-5.2-8-11a4.5 4.5 0 018-2.8A4.5 4.5 0 0120 10c0 5.8-8 11-8 11z" />
              </svg>
              {p.likes}
            </button>
            <button
              type="button"
              onClick={() => {
                if (onDuvidar) {
                  onDuvidar({
                    id: String(p.id),
                    comunidadeId: p.communitySlug || 'bonde-geral',
                    comunidadeSlug: p.communitySlug || 'bonde-geral',
                    autorNome: p.name,
                    conteudo: p.text,
                    nota: p.score,
                    reacoes: { fogo: p.likes, nojo: 0, trofeu: p.reposts },
                    totalComentarios: p.replies,
                    criadoEm: new Date().toISOString(),
                  });
                } else {
                  setComposing(true);
                  setCtype('desafio');
                  setOpp('@' + p.handle);
                  setText('Bate esse arroto' + (p.audio ? ' de ' + p.score : '') + '.');
                }
              }}
              style={{ background: 'none', border: 0, color: 'var(--accent)', fontWeight: 700, fontSize: 13, padding: '6px 8px', cursor: 'pointer' }}
            >
              X1
            </button>
            <button
              type="button"
              onClick={() => setSharing({ kind: 'post', ch: p })}
              aria-label="Compartilhar card 9:16"
              style={{ background: 'none', border: 0, color: 'var(--muted)', fontSize: 13, padding: '6px 8px', cursor: 'pointer' }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 3v13M7 8l5-5 5 5M5 14v6h14v-6" />
              </svg>
            </button>
          </div>
        </div>
      </article>
    );
  };

  return (
    <div
      style={{
        ...vars,
        width: '100%',
        minHeight: '100vh',
        background: 'var(--bg)',
        color: 'var(--fg)',
        fontFamily: 'var(--font-body, "Archivo", sans-serif)',
        boxSizing: 'border-box',
      }}
    >
      <div style={{ width: '100%', maxWidth: 1200, margin: '0 auto', display: 'flex', justifyContent: 'center', alignItems: 'flex-start' }}>
        {/* ========================================================
            COLUNA ESQUERDA: NAVEGAÇÃO DESKTOP / TABLET (1:1 Protótipo)
            ======================================================== */}
        {!mobile && (
          <header
            style={{
              width: wide ? 275 : 76,
              flex: 'none',
              position: 'sticky',
              top: 0,
              height: '100vh',
              padding: wide ? '0 12px 12px' : '0 8px 12px',
              boxSizing: 'border-box',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: wide ? 'stretch' : 'center' }}>
              {/* Marca */}
              <div
                style={{
                  height: 52,
                  display: 'flex',
                  alignItems: 'center',
                  padding: '0 12px',
                  fontFamily: 'var(--font-display, "Anton", sans-serif)',
                  fontSize: 26,
                  letterSpacing: '.02em',
                  gap: 6,
                }}
              >
                <span>Auê</span>
                <span style={{ fontSize: 13, background: 'var(--accent)', color: 'var(--accent-on)', padding: '2px 6px', borderRadius: 6, fontWeight: 700 }}>
                  3.0
                </span>
                {wide && <span style={{ marginLeft: 6, fontSize: 20 }}>BONDE DO ARROTO</span>}
              </div>

              {/* Lista de Abas */}
              {tabsNav.map((t) => {
                const isActive = tab === t.key;
                return (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => {
                      if (t.key === 'arena' && onArrotar) {
                        onArrotar();
                      }
                      setTab(t.key as any);
                    }}
                    aria-label={t.key === 'arena' ? 'Ir para a Arena e arrotar' : t.label}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 16,
                      height: 52,
                      padding: wide ? '0 20px 0 12px' : 0,
                      width: wide ? 'auto' : 52,
                      justifyContent: wide ? 'flex-start' : 'center',
                      border: 0,
                      borderRadius: 999,
                      background: 'none',
                      color: isActive ? 'var(--fg)' : 'var(--muted)',
                      fontWeight: isActive ? 700 : 400,
                      cursor: 'pointer',
                      fontSize: 20,
                    }}
                  >
                    <svg
                      width="26"
                      height="26"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={isActive ? 2.4 : 1.8}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d={t.path} />
                    </svg>
                    {wide && <span>{t.label}</span>}
                  </button>
                );
              })}

              {/* Botão de Postar */}
              <button
                type="button"
                onClick={() => {
                  setComposing(true);
                  setCtype('texto');
                }}
                style={
                  wide
                    ? {
                        height: 52,
                        marginTop: 16,
                        border: 0,
                        borderRadius: 18,
                        background: 'var(--accent)',
                        color: 'var(--accent-on)',
                        fontWeight: 700,
                        fontSize: 17,
                        cursor: 'pointer',
                      }
                    : {
                        width: 52,
                        height: 52,
                        marginTop: 16,
                        border: 0,
                        borderRadius: 18,
                        background: 'var(--accent)',
                        color: 'var(--accent-on)',
                        fontWeight: 700,
                        fontSize: 26,
                        cursor: 'pointer',
                      }
                }
              >
                {wide ? 'Postar' : '+'}
              </button>
            </div>

            {/* Rodapé da Sidebar: Tema e Perfil */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: wide ? 'stretch' : 'center' }}>
              <button
                type="button"
                onClick={toggleTheme}
                aria-label="Alternar tema claro/escuro"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                  height: 44,
                  padding: wide ? '0 20px 0 12px' : 0,
                  width: wide ? 'auto' : 44,
                  justifyContent: wide ? 'flex-start' : 'center',
                  border: 0,
                  borderRadius: 999,
                  background: 'none',
                  color: 'var(--muted)',
                  cursor: 'pointer',
                  fontSize: 15,
                }}
              >
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d={themeIcon} />
                </svg>
                {wide && <span>{theme === 'light' ? 'Tema escuro' : 'Tema claro'}</span>}
              </button>

              <button
                type="button"
                onClick={() => setTab('perfil')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: 8,
                  border: 0,
                  borderRadius: 999,
                  background: 'none',
                  color: 'var(--fg)',
                  cursor: 'pointer',
                }}
              >
                <span
                  style={{
                    width: 40,
                    height: 40,
                    flex: 'none',
                    borderRadius: '50%',
                    background: 'var(--surface-2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: 14,
                  }}
                >
                  VC
                </span>
                {wide && (
                  <span style={{ textAlign: 'left', lineHeight: 1.25 }}>
                    <b style={{ fontSize: 15 }}>Você</b>
                    <br />
                    <span style={{ color: 'var(--muted)', fontSize: 14 }}>@voce_arrota</span>
                  </span>
                )}
              </button>
            </div>
          </header>
        )}

        {/* ========================================================
            COLUNA CENTRAL: FEED / ARENA / BONDES / DESAFIOS / PERFIL
            ======================================================== */}
        <main
          style={{
            width: mobile ? '100%' : 600,
            maxWidth: 600,
            flex: mobile ? '1 1 0' : '0 0 600px',
            minWidth: 0,
            borderLeft: '1px solid var(--border)',
            borderRight: '1px solid var(--border)',
            minHeight: '100vh',
            boxSizing: 'border-box',
          }}
        >
          {/* Topo Sticky da Página */}
          <div
            style={{
              position: 'sticky',
              top: 0,
              zIndex: 5,
              background: 'var(--bg)',
              borderBottom: '1px solid var(--border)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 16px',
                height: 53,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontWeight: 700, fontSize: 20 }}>{pageTitles[tab]}</span>
                <span style={{ display: 'none' }}>Auê 3.0</span>
              </div>
              {tab === 'arena' && (
                <span
                  style={{
                    fontFamily: 'ui-monospace, monospace',
                    fontSize: 11,
                    color: 'var(--muted)',
                    letterSpacing: '.06em',
                    textTransform: 'uppercase',
                  }}
                >
                  {arenaLabels[arenaState]}
                </span>
              )}
              {mobile && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto' }}>
                  {tab !== 'arena' && (
                    <button
                      type="button"
                      onClick={() => setTab('arena')}
                      style={{
                        background: 'none',
                        border: 0,
                        color: 'var(--fg)',
                        fontWeight: 700,
                        fontSize: 14,
                        cursor: 'pointer',
                      }}
                    >
                      Arena
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={toggleTheme}
                    aria-label="Alternar tema"
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: '50%',
                      border: '1px solid var(--border)',
                      background: 'none',
                      color: 'var(--fg)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d={themeIcon} />
                    </svg>
                  </button>
                </div>
              )}
            </div>

            {/* Filtros do Feed */}
            {tab === 'feed' && (
              <div style={{ display: 'flex' }}>
                <button
                  type="button"
                  onClick={() => setFilter('all')}
                  style={{
                    flex: 1,
                    height: 52,
                    border: 0,
                    background: 'none',
                    color: filter === 'all' ? 'var(--fg)' : 'var(--muted)',
                    fontWeight: filter === 'all' ? 700 : 500,
                    fontSize: 15,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <span
                    style={{
                      height: 52,
                      display: 'flex',
                      alignItems: 'center',
                      borderBottom: filter === 'all' ? '4px solid var(--accent)' : '4px solid transparent',
                      boxSizing: 'border-box',
                    }}
                  >
                    Para você
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setFilter('comm')}
                  aria-label="Causos de inscritos"
                  style={{
                    flex: 1,
                    height: 52,
                    border: 0,
                    background: 'none',
                    color: filter === 'comm' ? 'var(--fg)' : 'var(--muted)',
                    fontWeight: filter === 'comm' ? 700 : 500,
                    fontSize: 15,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <span
                    style={{
                      height: 52,
                      display: 'flex',
                      alignItems: 'center',
                      borderBottom: filter === 'comm' ? '4px solid var(--accent)' : '4px solid transparent',
                      boxSizing: 'border-box',
                    }}
                  >
                    Meus bondes
                  </span>
                </button>
              </div>
            )}
          </div>

          {/* ==========================================
              ABA 1: FEED (INÍCIO)
              ========================================== */}
          {tab === 'feed' && (
            <>
              {/* Chips de Comunidades */}
              <div style={{ display: 'flex', gap: 8, overflowX: 'auto', padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
                <button
                  type="button"
                  onClick={() => setFilterCommunity(null)}
                  style={{
                    height: 32,
                    padding: '0 14px',
                    borderRadius: 999,
                    border: !filterCommunity ? '1px solid var(--fg)' : '1px solid var(--border)',
                    background: !filterCommunity ? 'var(--fg)' : 'transparent',
                    color: !filterCommunity ? 'var(--bg)' : 'var(--fg)',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Todos
                </button>
                {communities.map((c) => {
                  const isSelected = filterCommunity === c.name;
                  return (
                    <button
                      key={c.slug}
                      type="button"
                      onClick={() => setFilterCommunity(isSelected ? null : c.name)}
                      style={{
                        height: 32,
                        padding: '0 14px',
                        borderRadius: 999,
                        border: isSelected ? '1px solid var(--fg)' : '1px solid var(--border)',
                        background: isSelected ? 'var(--fg)' : 'transparent',
                        color: isSelected ? 'var(--bg)' : 'var(--fg)',
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {c.name}
                    </button>
                  );
                })}
              </div>

              {/* Caixa de Criação Rápida */}
              <div style={{ display: 'flex', gap: 12, padding: 16, borderBottom: '1px solid var(--border)' }}>
                <div
                  style={{
                    width: 44,
                    height: 44,
                    flex: 'none',
                    borderRadius: '50%',
                    background: 'var(--surface-2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: 14,
                  }}
                >
                  VC
                </div>
                <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <button
                    type="button"
                    onClick={() => {
                      setComposing(true);
                      setCtype('texto');
                    }}
                    style={{
                      background: 'none',
                      border: 0,
                      outline: 'none',
                      textAlign: 'left',
                      color: 'var(--muted)',
                      fontFamily: 'inherit',
                      fontSize: 18,
                      padding: '8px 0',
                      cursor: 'pointer',
                    }}
                  >
                    {qtext || 'Qual foi seu último arroto histórico? O que tá rolando no bonde?'}
                  </button>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      borderTop: '1px solid var(--border)',
                      paddingTop: 10,
                    }}
                  >
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button
                        type="button"
                        onClick={() => {
                          setComposing(true);
                          setCtype('audio');
                        }}
                        style={{
                          height: 36,
                          padding: '0 12px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          border: 0,
                          borderRadius: 999,
                          background: 'none',
                          color: 'var(--fg)',
                          fontWeight: 600,
                          fontSize: 14,
                          cursor: 'pointer',
                        }}
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="M12 15a3 3 0 003-3V6a3 3 0 00-6 0v6a3 3 0 003 3zM5 11a7 7 0 0014 0M12 18v3" />
                        </svg>
                        Arrotar
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setComposing(true);
                          setCtype('desafio');
                        }}
                        style={{
                          height: 36,
                          padding: '0 12px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          border: 0,
                          borderRadius: 999,
                          background: 'none',
                          color: 'var(--fg)',
                          fontWeight: 600,
                          fontSize: 14,
                          cursor: 'pointer',
                        }}
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 01-10 0zM17 5h3v2a3 3 0 01-3 3M7 5H4v2a3 3 0 003 3" />
                        </svg>
                        Desafiar
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setComposing(true);
                        setCtype('texto');
                      }}
                      style={{
                        height: 36,
                        padding: '0 20px',
                        border: 0,
                        borderRadius: 18,
                        background: 'var(--accent)',
                        color: 'var(--accent-on)',
                        fontWeight: 700,
                        fontSize: 15,
                        cursor: 'pointer',
                      }}
                    >
                      Postar
                    </button>
                  </div>
                </div>
              </div>

              {/* Lista de Causos / Posts */}
              {visiblePosts.map(renderPostCard)}
            </>
          )}

          {/* ==========================================
              ABA 2: ARENA (1:1 COM Arena.dc.html)
              ========================================== */}
          {tab === 'arena' && (
            <div
              style={{
                minHeight: 'calc(100vh - 53px)',
                display: 'grid',
                gridTemplateRows: 'minmax(0, 240px) 1fr auto',
                padding: '16px 24px 0',
                boxSizing: 'border-box',
              }}
            >
              {/* Palco da Arena: Bolha, Nota, Versus, Contagem */}
              <div style={{ display: 'grid', placeItems: 'center', position: 'relative', minHeight: 220 }}>
                {arenaState !== 'SCOREBOARD' && arenaState !== 'DRAW' && arenaState !== 'REMATCH' && (
                  <div style={{ width: 220, height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <BolhaAue
                      modo={arenaBolhaModo[arenaState]}
                      nivel={() => (arenaState === 'RECORDING' ? (Math.sin(Date.now() / 250) + 1) / 2 : 0)}
                    />
                  </div>
                )}

                {/* Nota sobre a Bolha */}
                {(arenaState === 'RESULT_REVEAL' || arenaState === 'RESULT') && (
                  <div style={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center', pointerEvents: 'none' }}>
                    <span
                      style={{
                        fontFamily: 'var(--font-display, "Anton", sans-serif)',
                        fontSize: arenaState === 'RESULT' ? 68 : 88,
                        lineHeight: 1,
                        color: 'var(--fg)',
                      }}
                    >
                      {arenaNota}
                    </span>
                    <span
                      style={{
                        fontFamily: 'ui-monospace, monospace',
                        fontSize: 11,
                        textTransform: 'uppercase',
                        letterSpacing: '.06em',
                        color: 'var(--muted)',
                      }}
                    >
                      {arenaState === 'RESULT' ? 'Valendo' : 'De pé'}
                    </span>
                  </div>
                )}

                {/* Bloco Versus (Placar ou Empate) */}
                {(arenaState === 'SCOREBOARD' || arenaState === 'DRAW') && (
                  <div
                    style={{
                      width: '100%',
                      maxWidth: 380,
                      display: 'grid',
                      gridTemplateColumns: '1fr auto 1fr',
                      alignItems: 'center',
                      gap: 16,
                      padding: '16px 20px',
                      background: 'var(--surface)',
                      border: '1px solid var(--border)',
                      borderRadius: 20,
                    }}
                  >
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ fontSize: 14, color: 'var(--muted)' }}>Você</div>
                      <div
                        style={{
                          fontFamily: 'var(--font-display, "Anton", sans-serif)',
                          fontSize: 48,
                          lineHeight: 1,
                          color: arenaState === 'DRAW' ? 'var(--fg)' : 'var(--accent)',
                        }}
                      >
                        {arenaState === 'DRAW' ? 88 : arenaNota}
                      </div>
                    </div>
                    <span style={{ fontFamily: 'var(--font-display, "Anton", sans-serif)', fontSize: 22, color: 'var(--muted)' }}>
                      X1
                    </span>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 14, color: 'var(--muted)' }}>Luiz</div>
                      <div style={{ fontFamily: 'var(--font-display, "Anton", sans-serif)', fontSize: 48, lineHeight: 1 }}>
                        {arenaState === 'DRAW' ? 88 : arenaNota - 13}
                      </div>
                    </div>
                  </div>
                )}

                {/* Contagem da Revanche */}
                {arenaState === 'REMATCH' && (
                  <div
                    style={{
                      fontFamily: 'var(--font-display, "Anton", sans-serif)',
                      fontSize: 96,
                      color: 'var(--accent)',
                      lineHeight: 1,
                    }}
                  >
                    {arenaContagem}
                  </div>
                )}
              </div>

              {/* Informações da Rodada / Textos e Métricas */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 12,
                  paddingTop: 16,
                  textAlign: 'center',
                }}
                aria-live="polite"
              >
                {arenaTitles[arenaState] && (
                  <h2
                    style={{
                      fontFamily: 'var(--font-display, "Anton", sans-serif)',
                      fontSize: 'clamp(30px, 7vw, 40px)',
                      fontWeight: 400,
                      margin: 0,
                      lineHeight: 1.1,
                      textTransform: 'uppercase',
                    }}
                  >
                    {arenaTitles[arenaState]}
                  </h2>
                )}
                {arenaSubs[arenaState] && (
                  <p style={{ color: 'var(--muted)', fontSize: 15, margin: 0, maxWidth: '34ch' }}>
                    {arenaSubs[arenaState]}
                  </p>
                )}

                {/* Cronômetro */}
                {arenaState === 'RECORDING' && (
                  <div
                    style={{
                      fontFamily: 'ui-monospace, monospace',
                      fontSize: 32,
                      fontWeight: 700,
                      color: 'var(--accent)',
                    }}
                  >
                    {fmt(arenaSecs)}
                  </div>
                )}

                {/* Métricas e Player no Resultado */}
                {arenaState === 'RESULT' && (
                  <div style={{ width: '100%', maxWidth: 420, display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        background: 'var(--surface)',
                        border: '1px solid var(--border)',
                        borderRadius: 16,
                        padding: '10px 14px',
                      }}
                    >
                      <button
                        type="button"
                        aria-label="Tocar seu arroto"
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: '50%',
                          border: 0,
                          background: 'var(--fg)',
                          color: 'var(--bg)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M7 4l13 8-13 8z" />
                        </svg>
                      </button>
                      <span style={{ fontSize: 14, fontWeight: 600 }}>Seu arroto</span>
                      <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: 12, color: 'var(--muted)', marginLeft: 'auto' }}>
                        0:07
                      </span>
                    </div>

                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(3, 1fr)',
                        gap: 8,
                        background: 'var(--surface)',
                        border: '1px solid var(--border)',
                        borderRadius: 16,
                        padding: 12,
                      }}
                    >
                      <div>
                        <div style={{ color: 'var(--muted)', fontSize: 12 }}>Força</div>
                        <div style={{ fontFamily: 'var(--font-display, "Anton", sans-serif)', fontSize: 24 }}>82</div>
                      </div>
                      <div>
                        <div style={{ color: 'var(--muted)', fontSize: 12 }}>Fôlego</div>
                        <div style={{ fontFamily: 'var(--font-display, "Anton", sans-serif)', fontSize: 24 }}>4,2s</div>
                      </div>
                      <div>
                        <div style={{ color: 'var(--muted)', fontSize: 12 }}>Grave</div>
                        <div style={{ fontFamily: 'var(--font-display, "Anton", sans-serif)', fontSize: 24 }}>71</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Link de Desafio */}
                {arenaState === 'CHALLENGE_CREATED' && (
                  <div
                    style={{
                      width: '100%',
                      maxWidth: 380,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: 'var(--surface)',
                      border: '1px solid var(--border)',
                      borderRadius: 12,
                      padding: '10px 14px',
                    }}
                  >
                    <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: 13, color: 'var(--muted)' }}>
                      aue.gg/x1/9f2a
                    </span>
                    <button
                      type="button"
                      onClick={() => say('Link copiado.')}
                      style={{
                        border: 0,
                        background: 'none',
                        color: 'var(--accent)',
                        fontWeight: 700,
                        fontSize: 14,
                        cursor: 'pointer',
                      }}
                    >
                      Copiar
                    </button>
                  </div>
                )}
              </div>

              {/* Botões de Ação da Arena */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                  padding: '20px 24px 24px',
                  width: '100%',
                  maxWidth: 440,
                  margin: '0 auto',
                  boxSizing: 'border-box',
                }}
              >
                {arenaState === 'IDLE' && (
                  <button
                    type="button"
                    onClick={recArena}
                    style={{
                      width: '100%',
                      height: 64,
                      borderRadius: 20,
                      background: 'var(--accent)',
                      color: 'var(--accent-on)',
                      border: 0,
                      fontFamily: 'var(--font-display, "Anton", sans-serif)',
                      fontSize: 22,
                      letterSpacing: '.02em',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 12,
                      boxShadow: '0 4px 16px rgba(0,0,0,.25)',
                    }}
                  >
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 15a3 3 0 003-3V6a3 3 0 00-6 0v6a3 3 0 003 3zM5 11a7 7 0 0014 0M12 18v3" />
                    </svg>
                    {arenaJaGravou ? 'Soltar outro arroto' : 'Toca e arrota'}
                  </button>
                )}

                {arenaState === 'RECORDING' && (
                  <button
                    type="button"
                    onClick={pararArena}
                    style={{
                      width: '100%',
                      height: 60,
                      borderRadius: 18,
                      border: '2px solid var(--accent)',
                      background: 'transparent',
                      color: 'var(--accent)',
                      fontFamily: 'var(--font-display, "Anton", sans-serif)',
                      fontSize: 20,
                      cursor: 'pointer',
                    }}
                  >
                    Parar
                  </button>
                )}

                {arenaState === 'RESULT' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      <button
                        type="button"
                        onClick={x1Arena}
                        style={{
                          height: 52,
                          borderRadius: 16,
                          background: 'var(--accent)',
                          color: 'var(--accent-on)',
                          border: 0,
                          fontWeight: 700,
                          fontSize: 15,
                          cursor: 'pointer',
                        }}
                      >
                        Chamar pro X1
                      </button>
                      <button
                        type="button"
                        onClick={postarArena}
                        style={{
                          height: 52,
                          borderRadius: 16,
                          border: '1px solid var(--border)',
                          background: 'transparent',
                          color: 'var(--fg)',
                          fontWeight: 600,
                          fontSize: 15,
                          cursor: 'pointer',
                        }}
                      >
                        Postar no bonde
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={recArena}
                      style={{
                        height: 48,
                        border: 0,
                        background: 'none',
                        color: 'var(--muted)',
                        fontWeight: 600,
                        fontSize: 15,
                        cursor: 'pointer',
                      }}
                    >
                      Mandar outro
                    </button>
                  </div>
                )}

                {arenaState === 'CHALLENGE_CREATED' && (
                  <button
                    type="button"
                    onClick={esperarArena}
                    style={{
                      width: '100%',
                      height: 56,
                      borderRadius: 18,
                      background: 'var(--accent)',
                      color: 'var(--accent-on)',
                      border: 0,
                      fontWeight: 700,
                      fontSize: 16,
                      cursor: 'pointer',
                    }}
                  >
                    Mandar pro infeliz
                  </button>
                )}

                {arenaState === 'WAITING_OPPONENT' && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, width: '100%' }}>
                    <button
                      type="button"
                      onClick={empateArena}
                      style={{
                        height: 52,
                        borderRadius: 16,
                        border: '1px solid var(--border)',
                        background: 'transparent',
                        color: 'var(--fg)',
                        fontWeight: 600,
                        fontSize: 14,
                        cursor: 'pointer',
                      }}
                    >
                      Simular empate
                    </button>
                    <button
                      type="button"
                      onClick={placarArena}
                      style={{
                        height: 52,
                        borderRadius: 16,
                        background: 'var(--accent)',
                        color: 'var(--accent-on)',
                        border: 0,
                        fontWeight: 700,
                        fontSize: 14,
                        cursor: 'pointer',
                      }}
                    >
                      Simular resposta
                    </button>
                  </div>
                )}

                {(arenaState === 'SCOREBOARD' || arenaState === 'DRAW') && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%' }}>
                    <button
                      type="button"
                      onClick={revancheArena}
                      style={{
                        width: '100%',
                        height: 56,
                        borderRadius: 18,
                        background: 'var(--accent)',
                        color: 'var(--accent-on)',
                        border: 0,
                        fontWeight: 700,
                        fontSize: 16,
                        cursor: 'pointer',
                      }}
                    >
                      Revanche
                    </button>
                    <button
                      type="button"
                      onClick={sairArena}
                      style={{
                        height: 44,
                        border: 0,
                        background: 'none',
                        color: 'var(--muted)',
                        fontWeight: 600,
                        fontSize: 15,
                        cursor: 'pointer',
                      }}
                    >
                      Sair
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ==========================================
              ABA 3: BONDES (COMUNIDADES ESTILO ORKUT)
              ========================================== */}
          {tab === 'comm' && (
            <div style={{ minHeight: 'calc(100vh - 53px)' }}>
              <div style={{ padding: '16px 16px 8px' }}>
                <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Ache seu Bonde</h2>
              </div>
              {communities.map((c) => {
                const isJoined = joined.includes(c.name);
                return (
                  <div
                    key={c.slug}
                    style={{
                      padding: 16,
                      borderBottom: '1px solid var(--border)',
                      display: 'flex',
                      gap: 12,
                      alignItems: 'center',
                    }}
                  >
                    <div
                      style={{
                        width: 52,
                        height: 52,
                        flex: 'none',
                        borderRadius: 12,
                        background: 'var(--surface-2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontFamily: 'var(--font-display, "Anton", sans-serif)',
                        fontSize: 20,
                      }}
                    >
                      {c.ini}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <b style={{ fontSize: 15 }}>{c.name}</b>
                      <div style={{ color: 'var(--muted)', fontSize: 14, marginTop: 2 }}>{c.desc}</div>
                      <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>
                        {c.members} membros
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleCommunity(c.name)}
                      aria-label={isJoined ? `Sair de ${c.name}` : `Entrar em ${c.name}`}
                      style={{
                        height: 36,
                        padding: '0 18px',
                        borderRadius: 999,
                        cursor: 'pointer',
                        fontWeight: 700,
                        fontSize: 14,
                        border: isJoined ? '1px solid var(--border)' : 0,
                        background: isJoined ? 'transparent' : 'var(--fg)',
                        color: isJoined ? 'var(--fg)' : 'var(--bg)',
                      }}
                    >
                      {isJoined ? 'Dentro' : 'Entrar'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* ==========================================
              ABA 4: DESAFIOS (X1)
              ========================================== */}
          {tab === 'desafios' && (
            <div style={{ minHeight: 'calc(100vh - 53px)' }}>
              <div style={{ padding: '16px 16px 8px' }}>
                <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Duelos no X1</h2>
              </div>
              <div style={{ padding: 16, borderBottom: '1px solid var(--border)' }}>
                <button
                  type="button"
                  onClick={() => {
                    setComposing(true);
                    setCtype('desafio');
                    setText('');
                    setOpp('');
                  }}
                  style={{
                    width: '100%',
                    height: 56,
                    border: 0,
                    borderRadius: 18,
                    background: 'var(--accent)',
                    color: 'var(--accent-on)',
                    fontWeight: 700,
                    fontSize: 16,
                    cursor: 'pointer',
                  }}
                >
                  Chamar pro X1
                </button>
              </div>
              {challenges.map((d) => (
                <div
                  key={d.id}
                  style={{
                    padding: 16,
                    borderBottom: '1px solid var(--border)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 10,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <b style={{ fontSize: 15 }}>{d.title}</b>
                    <span
                      style={{
                        fontFamily: 'ui-monospace, monospace',
                        fontSize: 11,
                        color: 'var(--muted)',
                        textTransform: 'uppercase',
                      }}
                    >
                      {d.status}
                    </span>
                  </div>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr auto 1fr',
                      alignItems: 'center',
                      gap: 12,
                    }}
                  >
                    <div>
                      <div style={{ color: 'var(--muted)', fontSize: 14 }}>@{d.a}</div>
                      <div style={{ fontFamily: 'var(--font-display, "Anton", sans-serif)', fontSize: 40, lineHeight: 1.1 }}>
                        {d.sa}
                      </div>
                    </div>
                    <span style={{ fontFamily: 'var(--font-display, "Anton", sans-serif)', fontSize: 16, color: 'var(--muted)' }}>
                      X1
                    </span>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ color: 'var(--muted)', fontSize: 14 }}>@{d.b}</div>
                      <div style={{ fontFamily: 'var(--font-display, "Anton", sans-serif)', fontSize: 40, lineHeight: 1.1 }}>
                        {d.sb}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      type="button"
                      onClick={() => setSharing({ kind: 'ch', ch: d })}
                      style={{
                        flex: 1,
                        height: 40,
                        borderRadius: 12,
                        border: '1px solid var(--border)',
                        background: 'transparent',
                        color: 'var(--fg)',
                        fontWeight: 600,
                        fontSize: 14,
                        cursor: 'pointer',
                      }}
                    >
                      Compartilhar card
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setComposing(true);
                        setCtype('desafio');
                        setOpp('@' + d.b);
                        setText('Revanche: ' + d.title);
                      }}
                      style={{
                        flex: 1,
                        height: 40,
                        borderRadius: 12,
                        border: '1px solid var(--border)',
                        background: 'transparent',
                        color: 'var(--fg)',
                        fontWeight: 600,
                        fontSize: 14,
                        cursor: 'pointer',
                      }}
                    >
                      Revanche
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ==========================================
              ABA 5: PERFIL DO USUÁRIO
              ========================================== */}
          {tab === 'perfil' && (
            <div style={{ minHeight: 'calc(100vh - 53px)', display: 'flex', flexDirection: 'column' }}>
              {/* Capa do Perfil (colada diretamente abaixo do header sticky) */}
              <div style={{ height: 140, background: 'var(--surface-2)', width: '100%', flex: 'none' }} />

              {/* Informações do Arrotador */}
              <div style={{ padding: '0 16px 16px', borderBottom: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: -44 }}>
                  <div
                    style={{
                      width: 88,
                      height: 88,
                      borderRadius: '50%',
                      background: 'var(--surface)',
                      border: '4px solid var(--bg)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontFamily: 'var(--font-display, "Anton", sans-serif)',
                      fontSize: 32,
                      color: 'var(--fg)',
                    }}
                  >
                    VC
                  </div>
                  <button
                    type="button"
                    onClick={() => say('Edição de perfil chega na v2.')}
                    style={{
                      height: 40,
                      padding: '0 20px',
                      borderRadius: 999,
                      border: '1px solid var(--border)',
                      background: 'transparent',
                      color: 'var(--fg)',
                      fontWeight: 600,
                      fontSize: 14,
                      cursor: 'pointer',
                    }}
                  >
                    Editar perfil
                  </button>
                </div>
                <div style={{ marginTop: 12 }}>
                  <b style={{ fontSize: 20 }}>Você</b>
                  <div style={{ color: 'var(--muted)', fontSize: 15 }}>@voce_arrota</div>
                  <div style={{ fontSize: 15, marginTop: 8, lineHeight: 1.4 }}>
                    Rio de Janeiro. No bonde desde 2026.
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 20, marginTop: 14, fontSize: 14, flexWrap: 'wrap' }}>
                  <span>
                    <b>{Math.max(arenaBest, ...posts.filter((p) => p.mine && p.audio).map((p) => p.score || 0))}</b>{' '}
                    <span style={{ color: 'var(--muted)' }}>melhor nota</span>
                  </span>
                  <span>
                    <b>7V · 3D</b> <span style={{ color: 'var(--muted)' }}>no X1</span>
                  </span>
                  <span>
                    <b>{joined.length}</b> <span style={{ color: 'var(--muted)' }}>bondes</span>
                  </span>
                </div>
              </div>

              {/* Abas do Perfil (Causos / X1 / Curtidas) */}
              <div style={{ display: 'flex', borderBottom: '1px solid var(--border)' }}>
                {(['causos', 'x1', 'curtidas'] as const).map((sub) => {
                  const label = sub === 'causos' ? 'Causos' : sub === 'x1' ? 'Duelos X1' : 'Curtidas';
                  const on = profileTab === sub;
                  return (
                    <button
                      key={sub}
                      type="button"
                      onClick={() => setProfileTab(sub)}
                      style={{
                        flex: 1,
                        height: 52,
                        border: 0,
                        background: 'none',
                        color: on ? 'var(--fg)' : 'var(--muted)',
                        fontWeight: on ? 700 : 500,
                        fontSize: 15,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <span
                        style={{
                          height: 52,
                          display: 'flex',
                          alignItems: 'center',
                          borderBottom: on ? '4px solid var(--accent)' : '4px solid transparent',
                          boxSizing: 'border-box',
                        }}
                      >
                        {label}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Conteúdo da Aba Ativa do Perfil */}
              {profileTab === 'causos' && (
                <div style={{ flex: 1 }}>
                  {posts.filter((p) => p.mine).length > 0 ? (
                    posts.filter((p) => p.mine).map(renderPostCard)
                  ) : (
                    <div style={{ padding: '48px 24px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                      <span style={{ fontSize: 40 }}>🦍</span>
                      <b style={{ fontSize: 18 }}>Nenhum arroto no histórico ainda</b>
                      <p style={{ color: 'var(--muted)', fontSize: 15, maxWidth: 320, lineHeight: 1.4, margin: 0 }}>
                        Solta o primeiro na Arena pra registrar sua maior nota ou puxa assunto num bonde.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          if (onArrotar) onArrotar();
                          setTab('arena');
                        }}
                        style={{
                          marginTop: 8,
                          height: 44,
                          padding: '0 24px',
                          borderRadius: 999,
                          background: 'var(--accent)',
                          color: 'var(--accent-on)',
                          border: 0,
                          fontWeight: 700,
                          fontSize: 15,
                          cursor: 'pointer',
                        }}
                      >
                        Ir para a Arena
                      </button>
                    </div>
                  )}
                </div>
              )}

              {profileTab === 'x1' && (
                <div style={{ flex: 1 }}>
                  {challenges.map((d) => (
                    <div
                      key={d.id}
                      style={{
                        padding: 16,
                        borderBottom: '1px solid var(--border)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 10,
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                        <b style={{ fontSize: 15 }}>{d.title}</b>
                        <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase' }}>
                          {d.status}
                        </span>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: 12 }}>
                        <div>
                          <div style={{ color: 'var(--muted)', fontSize: 14 }}>@{d.a}</div>
                          <div style={{ fontFamily: 'var(--font-display, "Anton", sans-serif)', fontSize: 40, lineHeight: 1.1 }}>
                            {d.sa}
                          </div>
                        </div>
                        <span style={{ fontFamily: 'var(--font-display, "Anton", sans-serif)', fontSize: 16, color: 'var(--muted)' }}>
                          X1
                        </span>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ color: 'var(--muted)', fontSize: 14 }}>@{d.b}</div>
                          <div style={{ fontFamily: 'var(--font-display, "Anton", sans-serif)', fontSize: 40, lineHeight: 1.1 }}>
                            {d.sb}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {profileTab === 'curtidas' && (
                <div style={{ flex: 1 }}>
                  {posts.filter((p) => p.liked).length > 0 ? (
                    posts.filter((p) => p.liked).map(renderPostCard)
                  ) : (
                    <div style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--muted)', fontSize: 15 }}>
                      Você ainda não curtiu nenhum arroto. Manda fogo nos causos do bonde!
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Espaçador inferior no mobile */}
          <div style={{ height: mobile ? 120 : 40 }} />
        </main>

        {/* ========================================================
            COLUNA DIREITA: ASIDE (FEED: EM ALTA / ARENA: RANKING)
            ======================================================== */}
        {showRight && (
          <aside
            style={{
              width: 320,
              flex: 'none',
              position: 'sticky',
              top: 0,
              padding: '12px 0 12px 24px',
              boxSizing: 'border-box',
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
              maxHeight: '100vh',
              overflowY: 'auto',
            }}
          >
            {tab === 'arena' ? (
              <>
                {/* Ranking de Hoje (Arena) */}
                <section style={{ background: 'var(--surface)', borderRadius: 16, overflow: 'hidden' }}>
                  <div style={{ padding: '12px 16px', fontWeight: 700, fontSize: 20 }}>Ranking de hoje</div>
                  {arenaRankings.map((r) => (
                    <div
                      key={r.name}
                      style={{
                        padding: '10px 16px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                      }}
                    >
                      <span style={{ width: 20, fontFamily: 'ui-monospace, monospace', fontSize: 12, color: 'var(--muted)' }}>
                        {r.pos}
                      </span>
                      <span style={{ flex: 1, fontSize: 15, fontWeight: r.w }}>{r.name}</span>
                      <span style={{ fontFamily: 'var(--font-display, "Anton", sans-serif)', fontSize: 22 }}>
                        {r.nota}
                      </span>
                    </div>
                  ))}
                </section>

                {/* X1 Abertos (Arena) */}
                <section style={{ background: 'var(--surface)', borderRadius: 16, overflow: 'hidden' }}>
                  <div style={{ padding: '12px 16px', fontWeight: 700, fontSize: 20 }}>X1 abertos</div>
                  {arenaOpens.map((o) => (
                    <div key={o.a + o.b} style={{ padding: '10px 16px', lineHeight: 1.35 }}>
                      <b style={{ fontSize: 15 }}>
                        @{o.a} x @{o.b}
                      </b>
                      <div style={{ color: 'var(--muted)', fontSize: 13 }}>{o.t}</div>
                    </div>
                  ))}
                </section>
              </>
            ) : (
              <>
                {/* Campo de Busca no Bonde */}
                <input
                  placeholder="Buscar no bonde"
                  style={{
                    height: 44,
                    borderRadius: 999,
                    border: '1px solid var(--border)',
                    background: 'var(--surface)',
                    color: 'var(--fg)',
                    padding: '0 18px',
                    fontSize: 15,
                    fontFamily: 'inherit',
                    outline: 'none',
                  }}
                />

                {/* Em Alta no Bonde */}
                <section style={{ background: 'var(--surface)', borderRadius: 16, overflow: 'hidden' }}>
                  <div style={{ padding: '12px 16px', fontWeight: 700, fontSize: 20 }}>Em alta no Bonde</div>
                  {trends.map((t) => (
                    <div
                      key={t.tag}
                      style={{ padding: '10px 16px', cursor: 'pointer' }}
                    >
                      <div
                        style={{
                          fontFamily: 'ui-monospace, monospace',
                          fontSize: 11,
                          color: 'var(--muted)',
                          textTransform: 'uppercase',
                          letterSpacing: '.06em',
                        }}
                      >
                        {t.cat}
                      </div>
                      <div style={{ fontWeight: 700, fontSize: 15 }}>{t.tag}</div>
                      <div style={{ color: 'var(--muted)', fontSize: 13 }}>{t.n} posts</div>
                    </div>
                  ))}
                </section>

                {/* Quem Seguir */}
                <section style={{ background: 'var(--surface)', borderRadius: 16, overflow: 'hidden' }}>
                  <div style={{ padding: '12px 16px', fontWeight: 700, fontSize: 20 }}>Quem seguir</div>
                  {suggest.map((u) => {
                    const isF = following.includes(u.handle);
                    return (
                      <div
                        key={u.handle}
                        style={{
                          padding: '10px 16px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                        }}
                      >
                        <div
                          style={{
                            width: 40,
                            height: 40,
                            flex: 'none',
                            borderRadius: '50%',
                            background: 'var(--surface-2)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            fontSize: 13,
                          }}
                        >
                          {u.ini}
                        </div>
                        <div style={{ flex: 1, minWidth: 0, lineHeight: 1.3 }}>
                          <b style={{ fontSize: 15 }}>{u.name}</b>
                          <div style={{ color: 'var(--muted)', fontSize: 14 }}>@{u.handle}</div>
                        </div>
                        <button
                          type="button"
                          onClick={() => toggleFollow(u.handle)}
                          style={{
                            height: 32,
                            padding: '0 16px',
                            borderRadius: 999,
                            cursor: 'pointer',
                            fontWeight: 700,
                            fontSize: 14,
                            border: isF ? '1px solid var(--border)' : 0,
                            background: isF ? 'transparent' : 'var(--fg)',
                            color: isF ? 'var(--fg)' : 'var(--bg)',
                          }}
                        >
                          {isF ? 'Seguindo' : 'Seguir'}
                        </button>
                      </div>
                    );
                  })}
                </section>
              </>
            )}
          </aside>
        )}
      </div>

      {/* ========================================================
          NAVEGAÇÃO MOBILE (1:1 Protótipo: 5 Abas + Botão Flutuante +)
          ======================================================== */}
      {mobile && (
        <>
          <nav
            style={{
              position: 'fixed',
              left: 0,
              right: 0,
              bottom: 0,
              height: 56,
              display: 'grid',
              gridTemplateColumns: 'repeat(5, 1fr)',
              borderTop: '1px solid var(--border)',
              background: 'var(--bg)',
              zIndex: 6,
            }}
          >
            {tabsNav.map((t) => {
              const isActive = tab === t.key;
              return (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => {
                    if (t.key === 'arena' && onArrotar) {
                      onArrotar();
                    }
                    setTab(t.key as any);
                  }}
                  aria-label={t.key === 'arena' ? 'Ir para a Arena e arrotar' : t.label}
                  style={{
                    border: 0,
                    background: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: isActive ? 'var(--fg)' : 'var(--muted)',
                  }}
                >
                  <svg
                    width="26"
                    height="26"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={isActive ? 2.4 : 1.8}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d={t.path} />
                  </svg>
                </button>
              );
            })}
          </nav>

          <button
            type="button"
            onClick={() => {
              setComposing(true);
              setCtype('texto');
            }}
            aria-label="Novo post"
            style={{
              position: 'fixed',
              right: 16,
              bottom: 72,
              zIndex: 6,
              width: 56,
              height: 56,
              borderRadius: '50%',
              border: 0,
              background: 'var(--accent)',
              color: 'var(--accent-on)',
              fontSize: 28,
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 4px 16px rgba(0,0,0,.35)',
            }}
          >
            +
          </button>
        </>
      )}

      {/* ========================================================
          MODAL DE COMPOSIÇÃO (TEXTO / ÁUDIO / DESAFIO)
          ======================================================== */}
      {composing && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'var(--overlay-scrim)',
            backdropFilter: 'blur(2px)',
            display: 'flex',
            alignItems: mobile ? 'flex-end' : 'center',
            justifyContent: 'center',
            zIndex: 20,
            padding: mobile ? 0 : 16,
            boxSizing: 'border-box',
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: 560,
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: mobile ? '24px 24px 0 0' : 24,
              padding: '20px 16px 24px',
              boxSizing: 'border-box',
              display: 'flex',
              flexDirection: 'column',
              gap: 14,
              boxShadow: '0 8px 32px rgba(0,0,0,.35)',
              maxHeight: '92vh',
              overflowY: 'auto',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontFamily: 'var(--font-display, "Anton", sans-serif)', fontSize: 22, margin: 0 }}>
                {ctype === 'texto' && 'Soltar Causo no Mural'}
                {ctype === 'audio' && 'ARROTAR'}
                {ctype === 'desafio' && 'CHAMAR PRO X1'}
              </h2>
              <button
                type="button"
                onClick={() => {
                  clearInterval(timerRec.current);
                  setComposing(false);
                  setRec(false);
                }}
                style={{ background: 'none', border: 0, color: 'var(--muted)', fontSize: 14, cursor: 'pointer' }}
              >
                Fechar
              </button>
            </div>

            {/* Alternância de Tipo de Post */}
            <div style={{ display: 'flex', gap: 8 }}>
              {(['texto', 'audio', 'desafio'] as const).map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setCtype(k)}
                  style={{
                    height: 36,
                    padding: '0 16px',
                    borderRadius: 999,
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: 14,
                    border: '1px solid var(--border)',
                    background: ctype === k ? 'var(--fg)' : 'transparent',
                    color: ctype === k ? 'var(--bg)' : 'var(--fg)',
                  }}
                >
                  {k === 'texto' ? 'Texto' : k === 'audio' ? 'Áudio' : 'Desafio'}
                </button>
              ))}
            </div>

            {/* Campo Oponente (Apenas em Desafio) */}
            {ctype === 'desafio' && (
              <input
                value={opp}
                onChange={(e) => setOpp(e.target.value)}
                placeholder="@amigo que vai levar ferro"
                style={{
                  height: 44,
                  borderRadius: 12,
                  border: '1px solid var(--border)',
                  background: 'var(--bg)',
                  color: 'var(--fg)',
                  padding: '0 14px',
                  fontSize: 15,
                  fontFamily: 'inherit',
                  outline: 'none',
                }}
              />
            )}

            {/* Campo Apelido */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label htmlFor="apelido-input" style={{ fontSize: 13, fontWeight: 600, color: 'var(--fg)' }}>
                Seu Apelido
              </label>
              <input
                id="apelido-input"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                style={{
                  height: 40,
                  borderRadius: 12,
                  border: '1px solid var(--border)',
                  background: 'var(--bg)',
                  color: 'var(--fg)',
                  padding: '0 12px',
                  fontSize: 14,
                  fontFamily: 'inherit',
                  outline: 'none',
                }}
              />
            </div>

            {/* Área de Texto */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label htmlFor="causo-textarea" style={{ fontSize: 13, fontWeight: 600, color: 'var(--fg)' }}>
                O Causo / Contexto
              </label>
              <textarea
                id="causo-textarea"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={
                  ctype === 'desafio'
                    ? 'Qual é o desafio?'
                    : ctype === 'audio'
                    ? 'Conta o contexto do arroto'
                    : 'Conta a história. Sem fingir moral.'
                }
                rows={3}
                style={{
                  minHeight: 90,
                  borderRadius: 12,
                  border: '1px solid var(--border)',
                  background: 'var(--bg)',
                  color: 'var(--fg)',
                  padding: '12px 14px',
                  fontSize: 15,
                  fontFamily: 'inherit',
                  resize: 'none',
                  outline: 'none',
                }}
              />
            </div>

            {/* Gravador de Áudio (Até 15s) */}
            {ctype !== 'texto' && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  background: 'var(--bg)',
                  border: '1px solid var(--border)',
                  borderRadius: 999,
                  padding: '8px 16px 8px 8px',
                }}
              >
                <button
                  type="button"
                  onClick={toggleRec}
                  style={{
                    width: 40,
                    height: 40,
                    flex: 'none',
                    borderRadius: '50%',
                    border: 0,
                    cursor: 'pointer',
                    fontSize: 14,
                    background: rec ? 'var(--accent)' : 'var(--fg)',
                    color: rec ? 'var(--accent-on)' : 'var(--bg)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {rec ? '■' : '●'}
                </button>
                <span style={{ flex: 1, fontSize: 14, color: 'var(--muted)' }}>
                  {rec ? 'Gravando. Solta.' : recorded ? 'Gravado. Toca pra refazer.' : 'Toca e arrota (até 15s)'}
                </span>
                <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: 13 }}>
                  {fmt(rec ? secs : recorded)}
                </span>
              </div>
            )}

            {/* Seleção de Bonde e Botão de Publicar */}
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <select
                value={commSel}
                onChange={(e) => setCommSel(e.target.value)}
                style={{
                  flex: 1,
                  height: 44,
                  borderRadius: 12,
                  border: '1px solid var(--border)',
                  background: 'var(--bg)',
                  color: 'var(--fg)',
                  padding: '0 10px',
                  fontSize: 14,
                  fontFamily: 'inherit',
                }}
              >
                {communities.map((c) => (
                  <option key={c.name} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={publish}
                style={{
                  height: 44,
                  padding: '0 24px',
                  border: 0,
                  borderRadius: 18,
                  background: 'var(--accent)',
                  color: 'var(--accent-on)',
                  fontWeight: 700,
                  fontSize: 15,
                  cursor: 'pointer',
                }}
              >
                Publicar Causo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL DE COMPARTILHAMENTO (CARD VERTICAL 9:16 + TIKTOK)
          ======================================================== */}
      {sharing && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'var(--overlay-scrim)',
            backdropFilter: 'blur(2px)',
            display: 'flex',
            alignItems: mobile ? 'flex-end' : 'center',
            justifyContent: 'center',
            zIndex: 21,
            padding: mobile ? 0 : 16,
            boxSizing: 'border-box',
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: 560,
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: mobile ? '24px 24px 0 0' : 24,
              padding: '20px 16px 24px',
              boxSizing: 'border-box',
              display: 'flex',
              flexDirection: 'column',
              gap: 14,
              boxShadow: '0 8px 32px rgba(0,0,0,.35)',
              maxHeight: '92vh',
              overflowY: 'auto',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontFamily: 'var(--font-display, "Anton", sans-serif)', fontSize: 22, margin: 0 }}>
                CARD 9:16
              </h2>
              <button
                type="button"
                onClick={() => {
                  clearInterval(timerGen.current);
                  setSharing(null);
                  setGen(-1);
                }}
                style={{ background: 'none', border: 0, color: 'var(--muted)', fontSize: 14, cursor: 'pointer' }}
              >
                Fechar
              </button>
            </div>

            {/* Prévia do Card 9:16 */}
            <div
              style={{
                aspectRatio: '9/12',
                width: 225,
                alignSelf: 'center',
                background: 'var(--bg)',
                border: '1px solid var(--border)',
                borderRadius: 18,
                padding: 18,
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <span
                style={{
                  fontFamily: 'var(--font-display, "Anton", sans-serif)',
                  fontSize: 14,
                  color: 'var(--muted)',
                  letterSpacing: '.04em',
                }}
              >
                BONDE DO ARROTO
              </span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span style={{ fontSize: 12, color: 'var(--muted)' }}>{cardKicker}</span>
                <span
                  style={{
                    fontFamily: 'var(--font-display, "Anton", sans-serif)',
                    fontSize: 64,
                    lineHeight: 1,
                    background: 'var(--accent)',
                    color: 'var(--accent-on)',
                    alignSelf: 'flex-start',
                    padding: '4px 12px',
                    borderRadius: 12,
                  }}
                >
                  {cardScore}
                </span>
                <span style={{ fontFamily: 'var(--font-display, "Anton", sans-serif)', fontSize: 20, lineHeight: 1.15 }}>
                  {cardLine}
                </span>
              </div>
              <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: 10, color: 'var(--muted)' }}>
                {ORIGEM_CANONICA}/b/{cardCode}
              </span>
            </div>

            {/* Barra de Progresso do Vídeo TikTok */}
            {gen >= 0 && (
              <div
                style={{
                  height: 44,
                  borderRadius: 12,
                  background: 'var(--bg)',
                  border: '1px solid var(--border)',
                  position: 'relative',
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 14,
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    bottom: 0,
                    background: 'var(--surface-2)',
                    width: `${Math.min(100, gen)}%`,
                  }}
                />
                <span style={{ position: 'relative' }}>
                  Gerando vídeo 9:16... {Math.min(99, Math.round(gen))}%
                </span>
              </div>
            )}

            {/* Opções de Compartilhamento */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <button
                type="button"
                onClick={startGen}
                style={{
                  height: 40,
                  borderRadius: 12,
                  border: '1px solid var(--border)',
                  background: 'transparent',
                  color: 'var(--fg)',
                  fontWeight: 600,
                  fontSize: 14,
                  cursor: 'pointer',
                }}
              >
                Vídeo pro TikTok
              </button>
              <button
                type="button"
                onClick={() => say('Card salvo.')}
                style={{
                  height: 40,
                  borderRadius: 12,
                  border: '1px solid var(--border)',
                  background: 'transparent',
                  color: 'var(--fg)',
                  fontWeight: 600,
                  fontSize: 14,
                  cursor: 'pointer',
                }}
              >
                Baixar card (PNG)
              </button>
              <button
                type="button"
                onClick={() => say('Link copiado.')}
                style={{
                  height: 40,
                  borderRadius: 12,
                  border: '1px solid var(--border)',
                  background: 'transparent',
                  color: 'var(--fg)',
                  fontWeight: 600,
                  fontSize: 14,
                  cursor: 'pointer',
                }}
              >
                COPIAR LINK DO DESAFIO
              </button>
              <a
                href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`Bate esse arroto no X1: ${ORIGEM_CANONICA}/b/${cardCode}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  height: 40,
                  borderRadius: 12,
                  border: '1px solid var(--border)',
                  background: 'transparent',
                  color: 'var(--fg)',
                  fontWeight: 600,
                  fontSize: 14,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textDecoration: 'none',
                }}
              >
                MANDAR NO WHATSAPP
              </a>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          TOAST FEEDBACK
          ======================================================== */}
      {toast && (
        <div
          style={{
            position: 'fixed',
            left: '50%',
            transform: 'translateX(-50%)',
            bottom: 80,
            zIndex: 30,
            background: 'var(--fg)',
            color: 'var(--bg)',
            borderRadius: 12,
            padding: '12px 20px',
            fontSize: 14,
            fontWeight: 600,
            maxWidth: '90vw',
            boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
          }}
        >
          {toast}
        </div>
      )}
    </div>
  );
};
