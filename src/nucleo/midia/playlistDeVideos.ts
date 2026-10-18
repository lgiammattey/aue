/**
 * Playlist curada de vídeos de arroto do YouTube para o Auê.
 * Alimenta a página pública `/videos-de-arroto` para SEO e entretenimento.
 */

export interface VideoCurado {
  readonly id: string;
  readonly titulo: string;
  readonly autor: string;
  readonly plataforma: 'youtube';
  readonly videoId: string;
  readonly urlOriginal: string;
  readonly embedUrl: string;
  readonly thumbnailUrl: string;
  readonly descricao: string;
  readonly categoria: 'trovao' | 'trator' | 'rajada' | 'resenha';
}

export const PLAYLIST_VIDEOS_ARROTO: readonly VideoCurado[] = [
  {
    id: 'yt-gamer-burps',
    titulo: 'Gamer Burps 38',
    autor: '@ethantompson23',
    plataforma: 'youtube',
    videoId: 'n2kD2qIshnY',
    urlOriginal: 'https://youtu.be/n2kD2qIshnY',
    embedUrl: 'https://www.youtube-nocookie.com/embed/n2kD2qIshnY?rel=0&playsinline=1',
    thumbnailUrl: 'https://i.ytimg.com/vi/n2kD2qIshnY/hqdefault.jpg',
    descricao: 'Arroto colado no microfone do headset durante a partida. Frequência grave e sustentação de respeito.',
    categoria: 'trator',
  },
  {
    id: 'yt-sirbzrk',
    titulo: 'SirBzrk — O estrondo no microfone',
    autor: '@Oslometry',
    plataforma: 'youtube',
    videoId: 'czYHjMNtJzU',
    urlOriginal: 'https://youtu.be/czYHjMNtJzU',
    embedUrl: 'https://www.youtube-nocookie.com/embed/czYHjMNtJzU?rel=0&playsinline=1',
    thumbnailUrl: 'https://i.ytimg.com/vi/czYHjMNtJzU/hqdefault.jpg',
    descricao: 'Distorção acústica no ganho da gravação. Se passasse na Arena, pontuava fácil na faixa 85+.',
    categoria: 'trovao',
  },
  {
    id: 'yt-garoto-arroto',
    titulo: 'Garoto Arroto',
    autor: '@theoscarfilho',
    plataforma: 'youtube',
    videoId: 'EgRmHFsiK6A',
    urlOriginal: 'https://youtu.be/EgRmHFsiK6A',
    embedUrl: 'https://www.youtube-nocookie.com/embed/EgRmHFsiK6A?rel=0&playsinline=1',
    thumbnailUrl: 'https://i.ytimg.com/vi/EgRmHFsiK6A/hqdefault.jpg',
    descricao: 'O clássico histórico de Oscar Filho. A zoeira que inspirou uma geração inteira de arrotadores.',
    categoria: 'resenha',
  },
  {
    id: 'yt-aula-prof-moises',
    titulo: 'Aula de Arroto com Professor Moises',
    autor: '@dcaetano2007',
    plataforma: 'youtube',
    videoId: 'ZCBGRL_UGO0',
    urlOriginal: 'https://youtu.be/ZCBGRL_UGO0',
    embedUrl: 'https://www.youtube-nocookie.com/embed/ZCBGRL_UGO0?rel=0&playsinline=1',
    thumbnailUrl: 'https://i.ytimg.com/vi/ZCBGRL_UGO0/hqdefault.jpg',
    descricao: 'Didática pura de como projetar o som com o diafragma. Aula magna de física acústica do estômago.',
    categoria: 'trator',
  },
  {
    id: 'yt-arroto-supersonico',
    titulo: 'O Arroto Supersônico',
    autor: '@Letícia Rosa',
    plataforma: 'youtube',
    videoId: 'XHu6ERu0e7c',
    urlOriginal: 'https://youtu.be/XHu6ERu0e7c',
    embedUrl: 'https://www.youtube-nocookie.com/embed/XHu6ERu0e7c?rel=0&playsinline=1',
    thumbnailUrl: 'https://i.ytimg.com/vi/XHu6ERu0e7c/hqdefault.jpg',
    descricao: 'Frequência que quebra a barreira do som no quarto. Se tivesse decibelímetro na hora, batia 90+.',
    categoria: 'trovao',
  },
  {
    id: 'yt-gta5-burping',
    titulo: 'GTA 5 Online Burping — Extreme Funny',
    autor: '@Donkey Kong',
    plataforma: 'youtube',
    videoId: 'jfQ9Lkzy0RM',
    urlOriginal: 'https://youtu.be/jfQ9Lkzy0RM',
    embedUrl: 'https://www.youtube-nocookie.com/embed/jfQ9Lkzy0RM?rel=0&playsinline=1',
    thumbnailUrl: 'https://i.ytimg.com/vi/jfQ9Lkzy0RM/hqdefault.jpg',
    descricao: 'Trollando o lobby do GTA Online com o microfone aberto. A reação da galera no headset é impagável.',
    categoria: 'resenha',
  },
  {
    id: 'yt-rap-eructos',
    titulo: 'Concurso de Rap em Arrotos',
    autor: '@jose gamaliel chavez',
    plataforma: 'youtube',
    videoId: 'nXazacLACYw',
    urlOriginal: 'https://youtu.be/nXazacLACYw',
    embedUrl: 'https://www.youtube-nocookie.com/embed/nXazacLACYw?rel=0&playsinline=1',
    thumbnailUrl: 'https://i.ytimg.com/vi/nXazacLACYw/hqdefault.jpg',
    descricao: 'Rima, flow e arrotos ritmados. O verdadeiro freestyle da digestão.',
    categoria: 'rajada',
  },
  {
    id: 'yt-arroto-demonio',
    titulo: 'O Arroto do Demônio',
    autor: '@Lothian Andrade',
    plataforma: 'youtube',
    videoId: 'psINs2wRvbE',
    urlOriginal: 'https://youtu.be/psINs2wRvbE',
    embedUrl: 'https://www.youtube-nocookie.com/embed/psINs2wRvbE?rel=0&playsinline=1',
    thumbnailUrl: 'https://i.ytimg.com/vi/psINs2wRvbE/hqdefault.jpg',
    descricao: 'Grave gutural de filme de terror. O amigo quase cai da cadeira com o susto.',
    categoria: 'trovao',
  },
  {
    id: 'yt-psd-oakley-p1',
    titulo: 'P*S*D* Arrotos Oakley (Parte 1)',
    autor: '@viniciuskbeca',
    plataforma: 'youtube',
    videoId: 'aP8KXALnAGA',
    urlOriginal: 'https://youtu.be/aP8KXALnAGA',
    embedUrl: 'https://www.youtube-nocookie.com/embed/aP8KXALnAGA?rel=0&playsinline=1',
    thumbnailUrl: 'https://i.ytimg.com/vi/aP8KXALnAGA/hqdefault.jpg',
    descricao: 'A relíquia dos anos 2000 gravada com câmera de baixa resolução e zoeira de sobra.',
    categoria: 'resenha',
  },
  {
    id: 'yt-psd-oakley-p2',
    titulo: 'P*S*D* Arrotos (Parte 2)',
    autor: '@viniciuskbeca',
    plataforma: 'youtube',
    videoId: '8eLSMcbQDBo',
    urlOriginal: 'https://youtu.be/8eLSMcbQDBo',
    embedUrl: 'https://www.youtube-nocookie.com/embed/8eLSMcbQDBo?rel=0&playsinline=1',
    thumbnailUrl: 'https://i.ytimg.com/vi/8eLSMcbQDBo/hqdefault.jpg',
    descricao: 'A continuação da resenha clássica. Risada sincera de quem não tem medo de ser expulso da sala.',
    categoria: 'resenha',
  },
  {
    id: 'yt-psd-oakley',
    titulo: 'P*S*D* La Nu Clidaao',
    autor: '@viniciuskbeca',
    plataforma: 'youtube',
    videoId: 'Gidcdw9uqdA',
    urlOriginal: 'https://youtu.be/Gidcdw9uqdA',
    embedUrl: 'https://www.youtube-nocookie.com/embed/Gidcdw9uqdA?rel=0&playsinline=1',
    thumbnailUrl: 'https://i.ytimg.com/vi/Gidcdw9uqdA/hqdefault.jpg',
    descricao: 'A máquina de arrotos da galera nos velhos tempos.',
    categoria: 'resenha',
  },
  {
    id: 'yt-comunicacao-habitat',
    titulo: 'Arroto: Comunicação Fora do Habitat Natural',
    autor: '@duparkdudu',
    plataforma: 'youtube',
    videoId: 'oxzvxLkwAkU',
    urlOriginal: 'https://youtu.be/oxzvxLkwAkU',
    embedUrl: 'https://www.youtube-nocookie.com/embed/oxzvxLkwAkU?rel=0&playsinline=1',
    thumbnailUrl: 'https://i.ytimg.com/vi/oxzvxLkwAkU/hqdefault.jpg',
    descricao: 'Diálogo entre espécies usando a linguagem universal do arroto.',
    categoria: 'rajada',
  },
];
