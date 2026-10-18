import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import { POOL_DE_AGENTES, ROTEIRO } from '../../../scripts/elenco-burpzilla/dados';
import { SORTEIO } from '../../../scripts/elenco-burpzilla/sorteio.gerado';
import { SEMENTE_DO_SORTEIO, textoDoSorteio } from '../../../scripts/elenco-burpzilla/sortear';
import { obterComunidadePorSlug } from '../comunidade/comunidadesPadrao';
import { diaDaSemana } from './horario';
import { sortear } from './sorteio';

/**
 * Paridade entre o cronograma (o que o autor aprovou) e o dado que o script
 * grava. Se alguém mexe num dos dois e esquece o outro, isto falha.
 */

const raiz = fileURLToPath(new URL('../../..', import.meta.url));
const cronograma = readFileSync(`${raiz}/docs/historias/burpzilla/cronograma.md`, 'utf8');
const [parteDosPosts, parteDosComentarios] = cronograma.split('## Comentários dos agentes');

const DIAS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];

interface LinhaDePost {
  dia: string;
  quando: string;
  autor: string;
  texto: string;
  audio: string;
}

const linhasDePosts: LinhaDePost[] = [
  ...parteDosPosts.matchAll(/^\| (\S+) (\d{2})\/(\d{2}), (\d{2}):(\d{2}) \| (Giam|Lima) \| (.*) \| (.*) \|$/gm),
].map((m) => ({
  dia: m[1],
  quando: `2026-${m[3]}-${m[2]}T${m[4]}:${m[5]}`,
  autor: m[6].toLowerCase(),
  texto: m[7],
  audio: m[8],
}));

const linhasDeComentarios = [
  ...parteDosComentarios.matchAll(
    /^\| (\S+) (\d{2})\/(\d{2}), (\d{2}):(\d{2}) \((Giam|Lima)\) \| (.*) \| agente ([A-E]) \|$/gm,
  ),
].map((m) => ({
  quandoDoPai: `2026-${m[3]}-${m[2]}T${m[4]}:${m[5]}`,
  autorDoPai: m[6].toLowerCase(),
  texto: m[7],
  agente: m[8],
}));

describe('o roteiro bate com o cronograma', () => {
  it('o parser achou o cronograma inteiro (22 posts, 6 comentários)', () => {
    expect(linhasDePosts).toHaveLength(22);
    expect(linhasDeComentarios).toHaveLength(6);
  });

  it('mesmos posts, na mesma ordem, com autor, horário e texto exatos', () => {
    expect(ROTEIRO.posts).toHaveLength(linhasDePosts.length);
    linhasDePosts.forEach((l, i) => {
      const p = ROTEIRO.posts[i];
      expect(p.autor, `autor de ${p.chave}`).toBe(l.autor);
      expect(p.quando, `horário de ${p.chave}`).toBe(l.quando);
      expect(p.texto, `texto de ${p.chave}`).toBe(l.texto);
    });
  });

  it('o dia da semana do cronograma bate com a data', () => {
    for (const l of linhasDePosts) expect(DIAS[diaDaSemana(l.quando)], l.quando).toBe(l.dia);
  });

  it('[áudio] vira arquivo escolhido (ou pendente) e traço vira null', () => {
    linhasDePosts.forEach((l, i) => {
      const p = ROTEIRO.posts[i];
      if (l.audio.includes('[áudio]')) expect(p.audio, p.chave).not.toBeNull();
      else expect(p.audio, p.chave).toBeNull();
    });
  });

  it('a descrição do áudio é a do cronograma', () => {
    linhasDePosts.forEach((l, i) => {
      const p = ROTEIRO.posts[i];
      if (p.audio !== null) {
        const esperado = l.audio.replace('`[áudio]`', '').trim();
        expect(esperado, p.chave).toContain(p.descricaoDoAudio ?? '(sem descrição)');
      }
    });
  });

  it('cada comentário cai no post pai certo, com o rótulo do agente do cronograma', () => {
    expect(ROTEIRO.comentarios).toHaveLength(linhasDeComentarios.length);
    linhasDeComentarios.forEach((l, i) => {
      const c = ROTEIRO.comentarios[i];
      const pai = ROTEIRO.posts.find((p) => p.chave === c.postChave);
      expect(pai?.quando, `pai de ${c.chave}`).toBe(l.quandoDoPai);
      expect(pai?.autor, `autor do pai de ${c.chave}`).toBe(l.autorDoPai);
      expect(c.agente, c.chave).toBe(l.agente);
    });
  });

  it('comentário em texto é igual ao cronograma; arroto vira onomatopeia marcada', () => {
    linhasDeComentarios.forEach((l, i) => {
      const c = ROTEIRO.comentarios[i];
      if (l.texto.startsWith('`[arroto')) {
        expect(c.pendenteAvalAutor, c.chave).toBe(true);
        expect(c.texto, c.chave).toMatch(/^b[u]+r+p$/);
      } else {
        expect(c.pendenteAvalAutor ?? false, c.chave).toBe(false);
        expect(c.texto, c.chave).toBe(l.texto);
      }
    });
  });

  it('o cronograma não ganhou post ou comentário que o dado desconhece', () => {
    expect(cronograma.match(/^\| \S+ \d{2}\/\d{2}, \d{2}:\d{2} /gm)).toHaveLength(
      linhasDePosts.length + linhasDeComentarios.length,
    );
  });
});

describe('a comunidade do roteiro', () => {
  it('é a "Eu arroto, e daí?" de COMUNIDADES_PADRAO, com o mesmo nome do feed', () => {
    const comunidade = obterComunidadePorSlug(ROTEIRO.comunidadeSlug);
    expect(comunidade?.slug).toBe('eu-arroto-e-dai');
    expect(ROTEIRO.comunidadeNome).toBe(comunidade?.nome);
  });
});

describe('o sorteio registrado', () => {
  it('é o que a semente 20261018 produz hoje', () => {
    expect(SORTEIO.semente).toBe(SEMENTE_DO_SORTEIO);
    expect(SORTEIO.semente).toBe(20261018);
    expect({ ...SORTEIO, status: 'PENDENTE_REVISAO' }).toEqual(sortear(ROTEIRO, SEMENTE_DO_SORTEIO));
  });

  it('o arquivo gerado tem exatamente o texto que o script escreveria', () => {
    const arquivo = readFileSync(`${raiz}/scripts/elenco-burpzilla/sorteio.gerado.ts`, 'utf8');
    expect(arquivo).toBe(textoDoSorteio(SORTEIO));
  });

  it('só sorteia gente do pool, e nunca o Lucas', () => {
    for (const nome of Object.values(SORTEIO.agentes).filter(Boolean)) {
      expect(POOL_DE_AGENTES).toContain(nome);
      expect(nome.toLowerCase()).not.toContain('lucas');
    }
    expect(POOL_DE_AGENTES).toEqual(['tiago', 'iury', 'rian', 'kayky', 'camillo', 'rodrigo', 'marcelo']);
  });
});
