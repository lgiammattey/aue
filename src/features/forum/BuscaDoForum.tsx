import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { ResultadoDeBusca, TipoDeBusca } from '../../portas/forum';
import { EstadoDeErro, EstadoVazio } from './componentes';
import { useDependenciasDoForum } from './contexto';
import { useOnline } from './hooks';

export const TAMANHO_MINIMO_DA_BUSCA = 2;

const ABAS: ReadonlyArray<{ readonly tipo: TipoDeBusca; readonly rotulo: string }> = [
  { tipo: 'pessoas', rotulo: 'Pessoas' },
  { tipo: 'comunidades', rotulo: 'Rodas' },
  { tipo: 'topicos', rotulo: 'Publicações' },
];

export function tipoDaBuscaNaUrl(valor: string | null): TipoDeBusca {
  return valor === 'comunidades' || valor === 'topicos' ? valor : 'pessoas';
}

function destino(r: ResultadoDeBusca): string {
  if (r.tipo === 'pessoa') return `/u/${encodeURIComponent(r.handle ?? '')}`;
  if (r.tipo === 'comunidade') return `/c/${encodeURIComponent(r.comunidadeSlug ?? '')}`;
  return `/c/${encodeURIComponent(r.comunidadeSlug ?? '')}/t/${encodeURIComponent(r.id)}`;
}

type Estado =
  | { readonly fase: 'carregando' }
  | { readonly fase: 'erro' }
  | { readonly fase: 'pronto'; readonly itens: readonly ResultadoDeBusca[]; readonly proximo: number | null; readonly carregandoMais: boolean; readonly erroAoCarregarMais: boolean };

/** Resultados do servidor para um termo, separados em Pessoas / Rodas / Publicações. */
export function BuscaDoForum({
  termo,
  tipo,
  aoMudarTipo,
}: {
  readonly termo: string;
  readonly tipo: TipoDeBusca;
  readonly aoMudarTipo: (tipo: TipoDeBusca) => void;
}) {
  const { forum, ambiente } = useDependenciasDoForum();
  const online = useOnline(ambiente);
  const [estado, setEstado] = useState<Estado>({ fase: 'carregando' });
  const [tentativa, setTentativa] = useState(0);

  useEffect(() => {
    let ativo = true;
    setEstado({ fase: 'carregando' });
    const buscar = forum.buscarNoAue;
    if (!buscar) {
      setEstado({ fase: 'erro' });
      return;
    }
    buscar.call(forum, { termo, tipo }).then(
      (r) => {
        if (!ativo) return;
        setEstado(
          r.ok
            ? { fase: 'pronto', itens: r.valor.itens, proximo: r.valor.proximo, carregandoMais: false, erroAoCarregarMais: false }
            : { fase: 'erro' },
        );
      },
      () => ativo && setEstado({ fase: 'erro' }),
    );
    return () => {
      ativo = false;
    };
  }, [forum, termo, tipo, tentativa]);

  const carregarMais = useCallback(async () => {
    if (estado.fase !== 'pronto' || estado.proximo === null || estado.carregandoMais) return;
    const { itens, proximo } = estado;
    setEstado({ ...estado, carregandoMais: true, erroAoCarregarMais: false });
    const r = await forum.buscarNoAue?.({ termo, tipo, deslocamento: proximo }).catch(() => null);
    setEstado((atual) => {
      if (atual.fase !== 'pronto') return atual;
      if (!r || !r.ok) return { ...atual, carregandoMais: false, erroAoCarregarMais: true };
      return { fase: 'pronto', itens: [...itens, ...r.valor.itens], proximo: r.valor.proximo, carregandoMais: false, erroAoCarregarMais: false };
    });
  }, [estado, forum, termo, tipo]);

  return (
    <section aria-label={`Resultados para ${termo}`}>
      <div className="forum-busca__abas" role="tablist" aria-label="Tipo de resultado">
        {ABAS.map((aba) => (
          <button
            key={aba.tipo}
            type="button"
            role="tab"
            aria-selected={aba.tipo === tipo}
            className="forum-botao forum-botao--contorno"
            onClick={() => aoMudarTipo(aba.tipo)}
          >
            {aba.rotulo}
          </button>
        ))}
      </div>

      <div aria-live="polite">
        {estado.fase === 'carregando' && <p className="forum-busca__nota">Buscando…</p>}
        {estado.fase === 'erro' && (
          <EstadoDeErro titulo="Não deu pra buscar agora." offline={!online} aoTentar={() => setTentativa((n) => n + 1)} />
        )}
        {estado.fase === 'pronto' && estado.itens.length === 0 && (
          <EstadoVazio
            titulo={`Nada encontrado para “${termo}”.`}
            linha="Confere a grafia ou tenta outra palavra. Nome e @ funcionam na aba Pessoas."
          />
        )}
        {estado.fase === 'pronto' && estado.itens.length > 0 && (
          <>
            <ul className="forum-lista">
              {estado.itens.map((r) => (
                <li key={`${r.tipo}-${r.id}`} className="forum-linha">
                  <Link className="forum-busca__link" to={destino(r)}>
                    {r.tipo === 'pessoa' && (
                      <span>
                        <strong>{r.apelido ?? r.handle}</strong> <span>@{r.handle}</span>
                      </span>
                    )}
                    {r.tipo === 'comunidade' && <strong>{r.titulo}</strong>}
                    {r.tipo === 'topico' && (
                      <span>
                        <strong>{r.titulo}</strong>
                        <br />
                        <span>
                          em {r.comunidadeNome} · por {r.apelido ?? r.handle}
                        </span>
                      </span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
            {estado.erroAoCarregarMais && <p role="alert" className="forum-busca__nota">Não deu pra carregar mais. Tenta de novo.</p>}
            {estado.proximo !== null && (
              <div className="forum-ver-mais"><button type="button" className="forum-botao forum-botao--contorno" onClick={() => void carregarMais()} disabled={estado.carregandoMais}>
                {estado.carregandoMais ? 'Carregando…' : 'Ver mais'}
              </button></div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
