/**
 * O roteiro do elenco da casa, transcrito de
 * `docs/historias/burpzilla/cronograma.md`.
 *
 * Os textos são os do cronograma, sem reescrever. Os horários são de Brasília.
 * Se o cronograma mudar, este arquivo muda junto: `elenco.paridade.test.ts`
 * confere os dois.
 *
 * O que falta para aplicar (e por isso o backfill está travado):
 * - `AUDIO_PENDENTE` marca onde o cronograma pede `[áudio]` e ninguém escolheu
 *   o arquivo ainda. Trocar por `{ arquivo: '1234_file_1234_0.ogg' }`;
 * - `pendenteAvalAutor` marca comentário em que o cronograma pedia um arroto e
 *   o comentário da casa é só texto. A onomatopeia é provisória.
 */
import { AUDIO_PENDENTE } from '../../src/nucleo/elenco/tipos.ts';
import type { ComentarioDeRoteiro, PostDeRoteiro, Roteiro } from '../../src/nucleo/elenco/tipos.ts';

export const POOL_DE_AGENTES = ['tiago', 'iury', 'rian', 'kayky', 'camillo', 'rodrigo', 'marcelo'] as const;

const BIO_DOS_PERSONAGENS = 'personagem da casa, Burpzilla';
const BIO_DOS_AGENTES = 'conta da casa, Auê';

const POSTS: readonly PostDeRoteiro[] = [
  // Arco 1: o novo vizinho (contos 1 e 2)
  {
    chave: 'p01',
    autor: 'lima',
    quando: '2026-09-01T23:12',
    texto: 'quase meia noite e alguém aqui do lado acabou de soltar um arroto que dava pra ouvir da rua',
    audio: AUDIO_PENDENTE,
    descricaoDoAudio: 'grave, longo, abafado, de longe',
  },
  {
    chave: 'p02',
    autor: 'lima',
    quando: '2026-09-01T23:20',
    texto: 'de novo. a casa ao lado tá alugada, só pode ser o inquilino antigo de volta',
    audio: null,
  },
  {
    chave: 'p03',
    autor: 'lima',
    quando: '2026-09-08T21:47',
    texto: 'a casa do lado vive fechada. e mesmo assim todo dia tem arroto de madrugada. não faz sentido',
    audio: null,
  },
  {
    chave: 'p04',
    autor: 'lima',
    quando: '2026-09-15T22:30',
    texto: 'descobri nada ainda. o vizinho novo nem aparece',
    audio: null,
  },
  {
    chave: 'p05',
    autor: 'lima',
    quando: '2026-09-22T08:15',
    texto: 'dei de cara com o vizinho novo saindo pra padaria. tímido demais, nem parece',
    audio: null,
  },
  {
    chave: 'p06',
    autor: 'lima',
    quando: '2026-09-22T08:40',
    texto: 'o nome dele é Giam, veio do Rio. trocamos zap. ainda não é ele, ele nem olha pra ninguém',
    audio: null,
  },
  {
    chave: 'p07',
    autor: 'giam',
    quando: '2026-09-23T20:05',
    texto:
      'me mudei tem umas semanas. quis um lugar mais tranquilo e até agora tá sendo. o Lima da casa do lado já me chamou pra conhecer o bairro',
    audio: null,
  },
  {
    chave: 'p08',
    autor: 'lima',
    quando: '2026-09-26T17:40',
    texto: 'voltando da praça com o Giam. o cara solta as histórias aos poucos mas tá ficando mais leve',
    audio: null,
  },
  {
    chave: 'p09',
    autor: 'giam',
    quando: '2026-09-26T18:22',
    texto: 'passamos num boteco e eu soltei um. saiu fraco, sem refri não rola',
    audio: AUDIO_PENDENTE,
    descricaoDoAudio: 'médio, sem graça',
  },
  {
    chave: 'p10',
    autor: 'lima',
    quando: '2026-09-26T18:25',
    texto: 'fraco nada. o cara do boteco olhou',
    audio: null,
  },
  {
    chave: 'p11',
    autor: 'giam',
    quando: '2026-09-26T18:40',
    texto: 'esse aqui foi natural',
    audio: AUDIO_PENDENTE,
    descricaoDoAudio: 'natural, solto',
  },
  {
    chave: 'p12',
    autor: 'lima',
    quando: '2026-09-27T12:10',
    texto: 'alguém gritou "suspende o veterinário" lá de dentro. to rindo até agora',
    audio: null,
  },

  // Ponte
  {
    chave: 'p13',
    autor: 'giam',
    quando: '2026-09-30T19:30',
    texto: 'meu primo avisou que vem passar uns dias. aí o Lima vai ver o que é arroto de verdade',
    audio: null,
  },

  // Arco 2: o churrasco (contos 3 e 4)
  {
    chave: 'p14',
    autor: 'lima',
    quando: '2026-10-10T15:20',
    texto: 'levando o Giam pro jogo e depois churrasco. ele não joga, vai assistir',
    audio: null,
  },
  {
    chave: 'p15',
    autor: 'giam',
    quando: '2026-10-10T20:50',
    texto: 'cheguei no churrasco sem conhecer ninguém. fiquei na minha',
    audio: null,
  },
  {
    chave: 'p16',
    autor: 'lima',
    quando: '2026-10-10T21:30',
    texto: 'o Lucas soltou um e já ficou se achando. o Giam só bebendo a dele',
    audio: AUDIO_PENDENTE,
    descricaoDoAudio: 'o do Lucas: médio/alto, convencido',
  },
  {
    chave: 'p17',
    autor: 'giam',
    quando: '2026-10-10T21:41',
    texto: 'calma gente, eu só queria beber',
    audio: AUDIO_PENDENTE,
    descricaoDoAudio: 'o maior: longo e grave. Ponto alto do arco',
  },
  {
    chave: 'p18',
    autor: 'lima',
    quando: '2026-10-10T21:42',
    texto: 'o Lucas acabou de perder o posto',
    audio: null,
  },
  {
    chave: 'p19',
    autor: 'lima',
    quando: '2026-10-11T10:15',
    texto: 'voltando com o Giam. ele humilhou o Lucas, fiquei feliz demais',
    audio: null,
  },
  {
    chave: 'p20',
    autor: 'giam',
    quando: '2026-10-11T10:50',
    texto: 'soltei um no mercado. o cara do estoque fez uma cara e saiu do corredor',
    audio: AUDIO_PENDENTE,
    descricaoDoAudio: '"arroto social", grave mas contido',
  },
  {
    chave: 'p21',
    autor: 'lima',
    quando: '2026-10-11T11:00',
    texto: 'expulsamos o homem. coitado',
    audio: null,
  },
  {
    chave: 'p22',
    autor: 'lima',
    quando: '2026-10-15T20:05',
    texto: 'alguém aí tem dica de arroto pra eu treinar? o Giam só diz treina',
    audio: null,
  },
];

/*
  Os comentários da casa são só texto. Onde o cronograma pede `[arroto curto]`
  ou `[arroto grave]`, vai uma onomatopeia e a marca `pendenteAvalAutor`.
*/
const COMENTARIOS: readonly ComentarioDeRoteiro[] = [
  { chave: 'c01', postChave: 'p01', agente: 'A', texto: 'pior que parece o vizinho antigo mesmo' },
  { chave: 'c02', postChave: 'p09', agente: 'B', texto: 'buurp', pendenteAvalAutor: true },
  { chave: 'c03', postChave: 'p17', agente: 'C', texto: 'calma, o que foi isso' },
  { chave: 'c04', postChave: 'p17', agente: 'D', texto: 'buuuurrrp', pendenteAvalAutor: true },
  { chave: 'c05', postChave: 'p20', agente: 'E', texto: 'o estoquista não aguentou' },
  { chave: 'c06', postChave: 'p22', agente: 'A', texto: 'treina com refri, ajuda muito' },
];

export const ROTEIRO: Roteiro = {
  comunidadeSlug: 'eu-arroto-e-dai',
  contasFixas: [
    { handle: 'giam', apelido: 'Giam', bio: BIO_DOS_PERSONAGENS },
    { handle: 'lima', apelido: 'Lima', bio: BIO_DOS_PERSONAGENS },
  ],
  poolDeAgentes: POOL_DE_AGENTES,
  bioDosAgentes: BIO_DOS_AGENTES,
  posts: POSTS,
  comentarios: COMENTARIOS,
};
