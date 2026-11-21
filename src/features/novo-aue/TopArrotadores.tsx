import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { ArrotadorDoTop } from '../../portas/forum';

interface Props {
  readonly estado: 'carregando' | 'pronto' | 'erro';
  readonly pessoas: readonly ArrotadorDoTop[];
  readonly audioTocandoId: string | null;
  readonly aoOuvir: (pessoa: ArrotadorDoTop) => void;
  readonly aoTentar: () => void;
  readonly variante?: 'painel' | 'faixa-mobile';
  readonly ocultarCabecalho?: boolean;
}

function classeDaPosicao(indice: number): string {
  if (indice === 0) return 'top-arrotadores__posicao is-ouro';
  if (indice === 1) return 'top-arrotadores__posicao is-prata';
  if (indice === 2) return 'top-arrotadores__posicao is-bronze';
  return 'top-arrotadores__posicao';
}

export function TopArrotadores({
  estado,
  pessoas,
  audioTocandoId,
  aoOuvir,
  aoTentar,
  variante = 'painel',
  ocultarCabecalho = false,
}: Props) {
  const [expandida, setExpandida] = useState(false);

  if (variante === 'faixa-mobile') {
    const lider = pessoas[0] ?? null;
    const liderNome = lider ? (lider.apelido || lider.handle) : '';
    const liderTocando = lider ? audioTocandoId === `top-${lider.alvoTipo}-${lider.alvoId}` : false;

    return (
      <section className="top-arrotadores top-arrotadores--faixa" aria-label="Top arrotadores">
        <div className="top-arrotadores__faixa-topo">
          <div className="top-arrotadores__heading">
            <span>TOP 5</span>
            <h2>Top arrotadores</h2>
          </div>
          <div className="top-arrotadores__faixa-acoes">
            {estado === 'pronto' && pessoas.length > 1 && (
              <button
                type="button"
                className="top-arrotadores__expandir"
                aria-expanded={expandida}
                onClick={() => setExpandida((atual) => !atual)}
              >
                {expandida ? 'Fechar Top 5' : 'Ver Top 5'}
              </button>
            )}
            <Link className="top-arrotadores__ver-todos" to="/ranking-de-arrotos">
              Ranking →
            </Link>
          </div>
        </div>

        {estado === 'carregando' && <p>Carregando o ranking…</p>}
        {estado === 'erro' && (
          <p>
            Não deu para carregar o ranking.{' '}
            <button type="button" onClick={aoTentar}>Recarregar ranking</button>
          </p>
        )}
        {estado === 'pronto' && pessoas.length === 0 && (
          <p>Ainda não há arrotos públicos com nota no ranking.</p>
        )}

        {estado === 'pronto' && lider && !expandida && (
          <div className="top-arrotadores__destaque">
            <span className="top-arrotadores__posicao is-ouro">01</span>
            <Link className="top-arrotadores__pessoa" to={`/u/${encodeURIComponent(lider.handle)}`}>
              {lider.avatarUrl ? <img src={lider.avatarUrl} alt="" /> : <span aria-hidden="true">{liderNome.slice(0, 1).toUpperCase()}</span>}
              <strong>{liderNome}</strong>
            </Link>
            <b>{Math.round(lider.nota)}</b>
            <button
              type="button"
              className={liderTocando ? 'is-tocando' : undefined}
              aria-label={`${liderTocando ? 'Pausar' : 'Ouvir'} arroto de ${liderNome}`}
              onClick={() => aoOuvir(lider)}
            >
              {liderTocando ? '❚❚' : '▶'}
            </button>
          </div>
        )}

        {estado === 'pronto' && pessoas.length > 0 && expandida && (
          <ol className="top-arrotadores__lista">
            {pessoas.map((pessoa, indice) => {
              const nome = pessoa.apelido || pessoa.handle;
              const tocando = audioTocandoId === `top-${pessoa.alvoTipo}-${pessoa.alvoId}`;
              return (
                <li key={pessoa.handle}>
                  <span className={classeDaPosicao(indice)}>{String(indice + 1).padStart(2, '0')}</span>
                  <Link className="top-arrotadores__pessoa" to={`/u/${encodeURIComponent(pessoa.handle)}`}>
                    {pessoa.avatarUrl ? <img src={pessoa.avatarUrl} alt="" /> : <span aria-hidden="true">{nome.slice(0, 1).toUpperCase()}</span>}
                    <strong>{nome}</strong>
                  </Link>
                  <b>{Math.round(pessoa.nota)}</b>
                  <button
                    type="button"
                    className={tocando ? 'is-tocando' : undefined}
                    aria-label={`${tocando ? 'Pausar' : 'Ouvir'} arroto de ${nome}`}
                    onClick={() => aoOuvir(pessoa)}
                  >
                    {tocando ? '❚❚' : '▶'}
                  </button>
                </li>
              );
            })}
          </ol>
        )}
      </section>
    );
  }

  return (
    <section className="top-arrotadores" aria-label="Top arrotadores">
      {!ocultarCabecalho && (
        <div className="top-arrotadores__heading">
          <span>TOP 5</span>
          <h2>Top arrotadores</h2>
        </div>
      )}
      {estado === 'carregando' && <p>Carregando o ranking…</p>}
      {estado === 'erro' && (
        <p>
          Não deu para carregar o ranking.{' '}
          <button type="button" onClick={aoTentar}>Recarregar ranking</button>
        </p>
      )}
      {estado === 'pronto' && pessoas.length === 0 && (
        <p>Ainda não há arrotos públicos com nota no ranking.</p>
      )}
      {estado === 'pronto' && pessoas.length > 0 && (
        <ol className="top-arrotadores__lista">
          {pessoas.map((pessoa, indice) => {
            const nome = pessoa.apelido || pessoa.handle;
            const tocando = audioTocandoId === `top-${pessoa.alvoTipo}-${pessoa.alvoId}`;
            return (
              <li key={pessoa.handle}>
                <span className={classeDaPosicao(indice)}>{String(indice + 1).padStart(2, '0')}</span>
                <Link className="top-arrotadores__pessoa" to={`/u/${encodeURIComponent(pessoa.handle)}`}>
                  {pessoa.avatarUrl ? <img src={pessoa.avatarUrl} alt="" /> : <span aria-hidden="true">{nome.slice(0, 1).toUpperCase()}</span>}
                  <strong>{nome}</strong>
                </Link>
                <b>{Math.round(pessoa.nota)}</b>
                <button
                  type="button"
                  className={tocando ? 'is-tocando' : undefined}
                  aria-label={`${tocando ? 'Pausar' : 'Ouvir'} arroto de ${nome}`}
                  onClick={() => aoOuvir(pessoa)}
                >
                  {tocando ? '❚❚' : '▶'}
                </button>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
