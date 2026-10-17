import React, { useCallback, useEffect, useState } from 'react';
import { criarComunidadeWeb } from '../../plataforma/web/comunidade';
import type {
  CausoPostado,
  Comunidade,
  PedidoDePostagemDeCauso,
  PortaDeComunidade,
  TipoDeReacao,
} from '../../portas/comunidade';
import { CardDeCauso } from './CardDeCauso';
import { ModalNovoCauso } from './ModalNovoCauso';
import './Comunidade.css';

interface TelaComunidadeProps {
  porta?: PortaDeComunidade;
  onArrotar?: () => void;
  onDuvidar?: (causo: CausoPostado) => void;
  resultadoRecente?: { id: string; nota: number };
}

export const TelaComunidade: React.FC<TelaComunidadeProps> = ({
  porta,
  onArrotar,
  onDuvidar,
  resultadoRecente,
}) => {
  const [adaptador] = useState<PortaDeComunidade>(() => porta ?? criarComunidadeWeb());
  const [comunidades, setComunidades] = useState<readonly Comunidade[]>([]);
  const [comunidadeAtiva, setComunidadeAtiva] = useState<string>('todos');
  const [causos, setCausos] = useState<readonly CausoPostado[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);

  const carregarFeed = useCallback(
    async (slug: string) => {
      setCarregando(true);
      try {
        const itens = await adaptador.listarFeed({
          comunidadeSlug: slug === 'todos' ? undefined : slug,
        });
        setCausos(itens);
      } finally {
        setCarregando(false);
      }
    },
    [adaptador],
  );

  useEffect(() => {
    let montado = true;
    async function inicializar() {
      const listaComus = await adaptador.listarComunidades();
      if (!montado) return;
      setComunidades(listaComus);
      await carregarFeed('todos');
    }
    inicializar();
    return () => {
      montado = false;
    };
  }, [adaptador, carregarFeed]);

  const handleMudarComunidade = (slug: string) => {
    setComunidadeAtiva(slug);
    carregarFeed(slug);
  };

  const handleReagir = async (causoId: string, reacao: TipoDeReacao) => {
    const res = await adaptador.alternarReacao(causoId, reacao);
    if (res.ok) {
      setCausos((anteriores) =>
        anteriores.map((c) => {
          if (c.id !== causoId) return c;
          const eraMinha = c.minhaReacao === reacao;
          return {
            ...c,
            reacoes: res.reacoes,
            minhaReacao: eraMinha ? null : reacao,
          };
        }),
      );
    }
  };

  const handleDenunciar = async (causoId: string) => {
    const ok = await adaptador.denunciarCauso(causoId, 'Denunciado pelo usuário');
    if (ok) {
      setCausos((anteriores) => anteriores.filter((c) => c.id !== causoId));
    }
  };

  const handlePublicarCauso = async (pedido: PedidoDePostagemDeCauso) => {
    const res = await adaptador.postarCauso(pedido);
    if (res.ok) {
      setCausos((anteriores) => [res.causo, ...anteriores]);
    }
  };

  return (
    <div className="comunidade-shell">
      {/* Header Superior */}
      <header className="comunidade-header">
        <div className="logo-group">
          <span className="wordmark">
            Auê<i>3.0</i>
          </span>
        </div>

        {onArrotar && (
          <button
            type="button"
            className="btn-arrotar-top"
            onClick={onArrotar}
            aria-label="Ir para a Arena e arrotar"
          >
            💨 ARROTAR
          </button>
        )}
      </header>

      {/* Chips de Comunidades */}
      <nav className="comunidades-bar" aria-label="Comunidades">
        <button
          type="button"
          className={`community-chip ${comunidadeAtiva === 'todos' ? 'active' : ''}`}
          onClick={() => handleMudarComunidade('todos')}
        >
          🌐 Todos os Causos
        </button>
        {comunidades.map((c) => (
          <button
            key={c.slug}
            type="button"
            className={`community-chip ${comunidadeAtiva === c.slug ? 'active' : ''}`}
            onClick={() => handleMudarComunidade(c.slug)}
          >
            {c.icone} {c.nome}
          </button>
        ))}
      </nav>

      {/* Caixa de Entrada Rápida de Causo */}
      <section className="novo-causo-prompt">
        <div className="avatar" aria-hidden="true" style={{ width: 34, height: 34, fontSize: 16 }}>
          💬
        </div>
        <button
          type="button"
          className="novo-causo-btn"
          onClick={() => setModalAberto(true)}
        >
          {resultadoRecente
            ? `Postar meu arroto (Nota ${resultadoRecente.nota}) no mural...`
            : 'Qual foi seu último arroto histórico? Conte aqui...'}
        </button>
      </section>

      {/* Feed de Causos */}
      <main className="feed-container" aria-live="polite">
        {carregando ? (
          <p style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--muted)' }}>
            Carregando causos da comunidade...
          </p>
        ) : causos.length === 0 ? (
          <p style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--muted)' }}>
            Nenhum causo publicado aqui ainda. Seja o primeiro a mandar ver!
          </p>
        ) : (
          causos.map((causo) => (
            <CardDeCauso
              key={causo.id}
              causo={causo}
              onReagir={handleReagir}
              onDuvidar={onDuvidar}
              onDenunciar={handleDenunciar}
            />
          ))
        )}
      </main>

      {/* Botão Flutuante da Arena */}
      {onArrotar && (
        <button
          type="button"
          className="fab-arrotar"
          onClick={onArrotar}
          aria-label="Arrotar agora na Arena"
        >
          <span>💨</span>
          <span>ARROTAR AGORA</span>
        </button>
      )}

      {/* Modal de Novo Causo */}
      <ModalNovoCauso
        aberto={modalAberto}
        comunidades={comunidades}
        comunidadeAtualSlug={comunidadeAtiva === 'todos' ? undefined : comunidadeAtiva}
        resultadoId={resultadoRecente?.id}
        notaResultado={resultadoRecente?.nota}
        onFechar={() => setModalAberto(false)}
        onSubmit={handlePublicarCauso}
      />
    </div>
  );
};
