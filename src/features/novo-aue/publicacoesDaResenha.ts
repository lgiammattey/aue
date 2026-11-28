import type { AnexoDeAudioDoTopico, AnexoDoForum, ComunidadeDoForum, NotaRetrospectiva, PortaDeForum, PublicacaoPessoal } from '../../portas/forum';
import type { EntradaDaResenha } from './paginacaoDoMural';
import type { ItemDoFeed } from './tipos';

/**
 * O acervo da casa só chega pela leitura autorizada do tópico. A URL pública
 * é resolvida pela plataforma, para a tela não conhecer o Storage.
 */
export function audioDoTopico(audio: AnexoDeAudioDoTopico | null | undefined, forum: PortaDeForum) {
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

export function paraItemDePublicacaoPessoal(publicacao: PublicacaoPessoal, anexo?: AnexoDoForum, urlDoAnexo?: string): ItemDoFeed {
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

export function aplicarNotaAoTopico(
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

export async function hidratarPublicacoesPessoais(
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

export async function hidratarPaginaDaResenha(
  forum: PortaDeForum,
  entradas: readonly EntradaDaResenha[],
  comunidades: readonly ComunidadeDoForum[] = [],
): Promise<ItemDoFeed[]> {
  const topicos = entradas.flatMap((entrada) => entrada.tipo === 'comunidade' ? [entrada.valor] : []);
  const pessoais = entradas.flatMap((entrada) => entrada.tipo === 'pessoal' ? [entrada.valor] : []);
  const anexosPorTopico = new Map<string, AnexoDoForum>();
  const audioPorTopico = new Map<string, AnexoDeAudioDoTopico>();
  const notasRetrospectivas = new Map<string, NotaRetrospectiva>();
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
    const leitura = await forum.listarNotasRetrospectivas(entradas.map((entrada) => entrada.valor.id));
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
  const avatares = new Map(comunidades.map((c) => [c.slug, c.avatarUrl ?? undefined]));
  const itens: ItemDoFeed[] = [];
  for (const entrada of entradas) {
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
  return itens;
}
