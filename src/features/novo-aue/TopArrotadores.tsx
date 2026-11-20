import { Link } from 'react-router-dom';
import type { ArrotadorDoTop } from '../../portas/forum';

interface Props {
  readonly estado: 'carregando' | 'pronto' | 'erro';
  readonly pessoas: readonly ArrotadorDoTop[];
  readonly audioTocandoId: string | null;
  readonly aoOuvir: (pessoa: ArrotadorDoTop) => void;
  readonly aoTentar: () => void;
}

export function TopArrotadores({ estado, pessoas, audioTocandoId, aoOuvir, aoTentar }: Props) {
  return <section className="top-arrotadores" aria-label="Top arrotadores">
    <div className="top-arrotadores__heading"><span>OS MELHORES ARROTOS</span><h2>Top arrotadores</h2></div>
    {estado === 'carregando' && <p>Carregando o ranking…</p>}
    {estado === 'erro' && <p>Não deu para carregar o ranking. <button type="button" onClick={aoTentar}>Tentar de novo</button></p>}
    {estado === 'pronto' && pessoas.length === 0 && <p>Ainda não há arrotos públicos com nota no ranking.</p>}
    {estado === 'pronto' && pessoas.length > 0 && <ol className="top-arrotadores__lista">{pessoas.map((pessoa, indice) => {
      const nome = pessoa.apelido || pessoa.handle;
      const tocando = audioTocandoId === `top-${pessoa.alvoTipo}-${pessoa.alvoId}`;
      return <li key={pessoa.handle}>
        <span className="top-arrotadores__posicao">{String(indice + 1).padStart(2, '0')}</span>
        <Link className="top-arrotadores__pessoa" to={`/u/${encodeURIComponent(pessoa.handle)}`}>
          {pessoa.avatarUrl ? <img src={pessoa.avatarUrl} alt="" /> : <span aria-hidden="true">{nome.slice(0, 1).toUpperCase()}</span>}
          <strong>{nome}</strong>
        </Link>
        <b>{Math.round(pessoa.nota)}</b>
        <button type="button" aria-label={`${tocando ? 'Pausar' : 'Ouvir'} arroto de ${nome}`} onClick={() => aoOuvir(pessoa)}>{tocando ? '❚❚' : '▶'}</button>
      </li>;
    })}</ol>}
  </section>;
}
