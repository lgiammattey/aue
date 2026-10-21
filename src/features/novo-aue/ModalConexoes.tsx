import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { manterFocoNoDialogo } from '../../plataforma/web/focoNoDialogo';
import type { Conexao } from '../../portas/perfil';

export type EstadoDasConexoes = 'carregando' | 'pronto' | 'erro';

interface Props {
  readonly aberto: boolean;
  readonly titulo: string;
  readonly estado: EstadoDasConexoes;
  readonly conexoes: readonly Conexao[];
  /** O servidor devolve no máximo isso; acima disso a lista diz que é parcial. */
  readonly limite: number;
  readonly aoFechar: () => void;
  readonly aoTentarDeNovo: () => void;
}

/** Quem segue / quem é seguido, lido do servidor. Falha nunca vira "ninguém". */
export function ModalConexoes({ aberto, titulo, estado, conexoes, limite, aoFechar, aoTentarDeNovo }: Props) {
  const dialogo = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (aberto) dialogo.current?.focus();
  }, [aberto]);

  if (!aberto) return null;

  return (
    <div className="modal open" role="presentation" onClick={(e) => e.target === e.currentTarget && aoFechar()}>
      <div
        ref={dialogo}
        className="dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="conexoesTitulo"
        tabIndex={-1}
        onKeyDown={(e) => {
          if (e.key === 'Escape') aoFechar();
          manterFocoNoDialogo(e.nativeEvent, dialogo.current);
        }}
      >
        <div className="dialog-head">
          <h2 id="conexoesTitulo">{titulo}</h2>
          <button type="button" className="close" onClick={aoFechar} aria-label="Fechar lista">✕</button>
        </div>

        <div aria-live="polite">
          {estado === 'carregando' && <p>Carregando…</p>}
          {estado === 'erro' && (
            <div role="alert">
              <p>Não deu para carregar a lista. Nada foi perdido.</p>
              <button type="button" className="tab" onClick={aoTentarDeNovo}>Tentar de novo</button>
            </div>
          )}
          {estado === 'pronto' && conexoes.length === 0 && <p>Ninguém por aqui ainda.</p>}
          {estado === 'pronto' && conexoes.length > 0 && (
            <>
              <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 4 }}>
                {conexoes.map((c) => (
                  <li key={c.id}>
                    <Link
                      to={`/u/${encodeURIComponent(c.handle)}`}
                      onClick={aoFechar}
                      style={{ display: 'flex', alignItems: 'center', gap: 12, minHeight: 44, padding: '6px 0' }}
                    >
                      {c.avatarUrl
                        ? <img src={c.avatarUrl} alt="" width={36} height={36} style={{ borderRadius: '50%', objectFit: 'cover' }} />
                        : <span aria-hidden="true" style={{ width: 36, height: 36, borderRadius: '50%', display: 'grid', placeItems: 'center', background: 'var(--aue-line, #333)' }}>{c.apelido.charAt(0).toUpperCase()}</span>}
                      <span>
                        <strong>{c.apelido}</strong>
                        <br />
                        <span style={{ opacity: 0.7, fontSize: 13 }}>@{c.handle}</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
              {conexoes.length >= limite && <p style={{ opacity: 0.7, fontSize: 13 }}>Mostrando só os {limite} primeiros.</p>}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
