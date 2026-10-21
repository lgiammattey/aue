import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { ItemSalvo, PortaDeForum } from '../../portas/forum';

type Estado =
  | { readonly fase: 'carregando' }
  | { readonly fase: 'erro' }
  | { readonly fase: 'pronto'; readonly itens: readonly ItemSalvo[]; readonly proximo: number | null; readonly carregandoMais: boolean; readonly erroAoCarregarMais: boolean };

const destino = (i: ItemSalvo) =>
  i.tipo === 'topico'
    ? `/c/${encodeURIComponent(i.comunidadeSlug)}/t/${encodeURIComponent(i.id)}`
    : `/historia/${encodeURIComponent(i.id)}`;

/** O que a própria conta salvou. Lido do servidor; nunca de memória da tela. */
export function SalvosDoPerfil({ forum }: { readonly forum: PortaDeForum }) {
  const [estado, setEstado] = useState<Estado>({ fase: 'carregando' });
  const [tentativa, setTentativa] = useState(0);

  useEffect(() => {
    let ativo = true;
    setEstado({ fase: 'carregando' });
    const listar = forum.listarMeusSalvos;
    if (!listar) {
      setEstado({ fase: 'erro' });
      return;
    }
    listar.call(forum, {}).then(
      (r) => ativo && setEstado(r.ok
        ? { fase: 'pronto', itens: r.valor.itens, proximo: r.valor.proximo, carregandoMais: false, erroAoCarregarMais: false }
        : { fase: 'erro' }),
      () => ativo && setEstado({ fase: 'erro' }),
    );
    return () => {
      ativo = false;
    };
  }, [forum, tentativa]);

  const carregarMais = useCallback(async () => {
    if (estado.fase !== 'pronto' || estado.proximo === null || estado.carregandoMais) return;
    const { itens, proximo } = estado;
    setEstado({ ...estado, carregandoMais: true, erroAoCarregarMais: false });
    const r = await forum.listarMeusSalvos?.({ deslocamento: proximo }).catch(() => null);
    setEstado((atual) => {
      if (atual.fase !== 'pronto') return atual;
      if (!r || !r.ok) return { ...atual, carregandoMais: false, erroAoCarregarMais: true };
      return { fase: 'pronto', itens: [...itens, ...r.valor.itens], proximo: r.valor.proximo, carregandoMais: false, erroAoCarregarMais: false };
    });
  }, [estado, forum]);

  return (
    <section className="od-profile__activity" aria-labelledby="profileSalvos">
      <div className="od-profile__activity-head"><h2 id="profileSalvos">Salvos</h2></div>
      {estado.fase === 'carregando' && <p className="od-profile__muted">Carregando salvos…</p>}
      {estado.fase === 'erro' && (
        <div className="od-profile__empty" role="alert">
          <h3>Não deu para carregar seus salvos.</h3>
          <p>Nada foi perdido.</p>
          <button type="button" className="tab" onClick={() => setTentativa((n) => n + 1)}>Tentar de novo</button>
        </div>
      )}
      {estado.fase === 'pronto' && estado.itens.length === 0 && (
        <div className="od-profile__empty">
          <h3>Nenhum post salvo ainda.</h3>
          <p>Toque no marcador de um post para guardar aqui.</p>
        </div>
      )}
      {estado.fase === 'pronto' && estado.itens.length > 0 && (
        <>
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 8 }}>
            {estado.itens.map((i) => (
              <li key={`${i.tipo}-${i.id}`}>
                <Link to={destino(i)} style={{ display: 'block', padding: '10px 0' }}>
                  <strong>{i.titulo || 'Post sem título'}</strong>
                  <br />
                  <span style={{ opacity: 0.7, fontSize: 13 }}>em {i.comunidadeNome} · por {i.autorApelido ?? i.autorHandle ?? 'alguém'}</span>
                </Link>
              </li>
            ))}
          </ul>
          {estado.erroAoCarregarMais && <p role="alert">Não deu pra carregar mais. Tenta de novo.</p>}
          {estado.proximo !== null && (
            <button type="button" className="tab" onClick={() => void carregarMais()} disabled={estado.carregandoMais}>
              {estado.carregandoMais ? 'Carregando…' : 'Ver mais'}
            </button>
          )}
        </>
      )}
    </section>
  );
}
