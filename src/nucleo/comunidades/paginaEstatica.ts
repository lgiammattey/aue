/**
 * Conteúdo sem JavaScript do diretório público de comunidades.
 *
 * A lista não nasce de um catálogo paralelo: o build a obtém pela mesma RPC
 * pública que o diretório usa. Assim o sitemap só apresenta uma porta real de
 * descoberta, sem inventar atividade, membros ou comunidades.
 */

export interface ComunidadeParaPaginaEstatica {
  readonly slug: string;
  readonly nome: string;
  readonly descricao: string;
}

function escaparHtml(texto: string): string {
  return texto
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Itens do diretório para leitores sem JavaScript e rastreadores. */
export function montarListaEstaticaDasComunidades(
  comunidades: readonly ComunidadeParaPaginaEstatica[],
): string {
  if (comunidades.length === 0) {
    return '        <li>As comunidades voltam a aparecer aqui assim que houver uma publicada.</li>';
  }

  return comunidades
    .map(
      (comunidade) => `        <li>
          <a href="/c/${escaparHtml(comunidade.slug)}">${escaparHtml(comunidade.nome)}</a>${
            comunidade.descricao ? ` — ${escaparHtml(comunidade.descricao)}` : ''
          }
        </li>`,
    )
    .join('\n');
}

export const MARCADOR_DAS_COMUNIDADES = '<!--COMUNIDADES_ESTATICAS-->';
