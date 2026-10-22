import type { ReactNode } from 'react';
import './PautaDaComunidade.css';

/**
 * Superfície visual para uma pauta editorial da comunidade. A pauta não muda
 * a identidade dos posts: cada entrada continua apontando para o ID original.
 */
interface PautaAbertaProps {
  readonly titulo: string;
  readonly descricao?: string | null;
  readonly entradas: readonly ReactNode[];
  readonly carregando?: boolean;
  readonly erro?: boolean;
  readonly aoVoltar: () => void;
}

/**
 * A pauta organiza a leitura; os cartões são os posts originais, renderizados
 * pelo componente canônico de cada tela.
 */
export function PautaAbertaDaComunidade({ titulo, descricao, entradas, carregando = false, erro = false, aoVoltar }: PautaAbertaProps) {
  return (
    <section className="community-agenda" aria-label={`Tópico: ${titulo}`}>
      <header className="community-agenda__header">
        <button className="community-agenda__back" type="button" onClick={aoVoltar}>Voltar</button>
        <div>
          <p className="community-agenda__eyebrow">Tópico da comunidade</p>
          <h2>{titulo}</h2>
          {descricao && <p>{descricao}</p>}
        </div>
      </header>
      {carregando && <p className="community-agenda__state" role="status">Carregando as publicações…</p>}
      {erro && <p className="community-agenda__state" role="alert">Não foi possível abrir esta pauta agora.</p>}
      {!carregando && !erro && entradas.length === 0 && <p className="community-agenda__state">Ainda não há publicações nesta pauta.</p>}
      {!carregando && !erro && entradas.length > 0 && <div className="community-agenda__entries">{entradas}</div>}
    </section>
  );
}
