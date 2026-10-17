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
import { ModalCardCompartilhamento } from './ModalCardCompartilhamento';
import './Comunidade.css';

type AbaNavegacao = 'feed' | 'bondes' | 'desafios' | 'perfil';

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
  const [abaAtiva, setAbaAtiva] = useState<AbaNavegacao>('feed');

  // Estado para o Modal 9:16 de Compartilhamento
  const [causoCompartilhando, setCausoCompartilhando] = useState<CausoPostado | null>(null);

  // Desafios simulados para a aba de Duelos
  const [desafios] = useState([
    { id: 'd-1', titulo: 'Churrasco de domingo', desafiante: 'voce_arrota', desafiado: 'tiobeto', notaA: 88, notaB: 91, status: 'Perdeu', codigo: 'k4x9' },
    { id: 'd-2', titulo: 'Quem aguenta 10s', desafiante: 'voce_arrota', desafiado: 'rafafolego', notaA: 94, notaB: 81, status: 'Ganhou', codigo: 'p2m7' },
  ]);

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
    setAbaAtiva('feed');
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
          <span style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: 600, letterSpacing: '0.04em' }}>
            BONDE DO ARROTO
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

      {/* Chips de Comunidades (visíveis no Feed) */}
      {abaAtiva === 'feed' && (
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
      )}

      {/* ABA 1: FEED DE CAUSOS */}
      {abaAtiva === 'feed' && (
        <>
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

          {/* Lista de Causos */}
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
                  onCompartilhar={(c) => setCausoCompartilhando(c)}
                />
              ))
            )}
          </main>
        </>
      )}

      {/* ABA 2: BONDES (COMUNIDADES ESTILO ORKUT) */}
      {abaAtiva === 'bondes' && (
        <section style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '24px', margin: '4px 0 12px', textTransform: 'uppercase' }}>
            Ache seu Bonde
          </h2>
          <p style={{ fontSize: '14px', color: 'var(--muted)', margin: '0 0 16px' }}>
            Cada bonde tem seu tipo de gás, suas lendas e suas maiores vergonhas.
          </p>
          {comunidades.map((c) => (
            <div
              key={c.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                padding: '14px',
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: '16px',
                cursor: 'pointer',
              }}
              onClick={() => handleMudarComunidade(c.slug)}
            >
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  background: 'var(--surface-2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '24px',
                  flex: 'none',
                }}
              >
                {c.icone}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <b style={{ fontSize: '16px', display: 'block' }}>{c.nome}</b>
                <span style={{ fontSize: '13px', color: 'var(--muted)', display: 'block', marginTop: '2px' }}>
                  {c.descricao}
                </span>
                {c.totalMembros && (
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--accent)', marginTop: '4px', display: 'block' }}>
                    {c.totalMembros.toLocaleString('pt-BR')} membros
                  </span>
                )}
              </div>
              <button
                type="button"
                className="btn-salvar-causo"
                style={{ height: '36px', padding: '0 16px', fontSize: '13px' }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleMudarComunidade(c.slug);
                }}
              >
                Ver
              </button>
            </div>
          ))}
        </section>
      )}

      {/* ABA 3: DESAFIOS (CENTRAL DO X1) */}
      {abaAtiva === 'desafios' && (
        <section style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '24px', margin: 0, textTransform: 'uppercase' }}>
              Duelos no X1
            </h2>
            {onArrotar && (
              <button
                type="button"
                className="btn-salvar-causo"
                onClick={onArrotar}
                style={{ height: '40px', padding: '0 18px', fontSize: '14px' }}
              >
                Chamar pro X1
              </button>
            )}
          </div>
          <p style={{ fontSize: '14px', color: 'var(--muted)', margin: 0 }}>
            Seus duelos com amigos pelo link do WhatsApp.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '8px' }}>
            {desafios.map((d) => (
              <div
                key={d.id}
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: '16px',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <b style={{ fontSize: '15px' }}>{d.titulo}</b>
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '11px',
                      textTransform: 'uppercase',
                      color: d.status === 'Ganhou' ? 'var(--accent)' : 'var(--danger)',
                      fontWeight: 700,
                    }}
                  >
                    {d.status}
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: '12px', textAlign: 'center' }}>
                  <div style={{ textAlign: 'left' }}>
                    <span style={{ fontSize: '13px', color: 'var(--muted)' }}>@{d.desafiante}</span>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: '36px', color: 'var(--accent)' }}>
                      {d.notaA}
                    </div>
                  </div>
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: '18px', color: 'var(--muted)' }}>
                    X1
                  </span>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '13px', color: 'var(--muted)' }}>@{d.desafiado}</span>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: '36px' }}>
                      {d.notaB}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    className="btn-cancelar-causo"
                    style={{ flex: 1, fontSize: '13px' }}
                    onClick={() => {
                      setCausoCompartilhando({
                        id: d.id,
                        comunidadeId: 'geral',
                        comunidadeSlug: 'bonde-geral',
                        autorNome: d.desafiante,
                        conteudo: `Duelo: @${d.desafiante} vs @${d.desafiado}`,
                        nota: d.notaA,
                        reacoes: { fogo: 10, nojo: 1, trofeu: 5 },
                        totalComentarios: 2,
                        criadoEm: new Date().toISOString(),
                      });
                    }}
                  >
                    Compartilhar card
                  </button>
                  {onArrotar && (
                    <button
                      type="button"
                      className="btn-salvar-causo"
                      style={{ flex: 1, fontSize: '13px' }}
                      onClick={onArrotar}
                    >
                      Revanche
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ABA 4: PERFIL */}
      {abaAtiva === 'perfil' && (
        <section style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ height: '90px', background: 'var(--surface-2)', borderBottom: '1px solid var(--border)' }} />
          <div style={{ padding: '0 16px 16px', borderBottom: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '-36px' }}>
              <div
                style={{
                  width: '72px',
                  height: '72px',
                  borderRadius: '50%',
                  background: 'var(--surface)',
                  border: '3px solid var(--bg)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: 'var(--font-display)',
                  fontSize: '26px',
                  color: 'var(--accent)',
                }}
              >
                VC
              </div>
              <button
                type="button"
                className="btn-cancelar-causo"
                style={{ padding: '6px 14px', fontSize: '13px' }}
                onClick={() => setModalAberto(true)}
              >
                Novo causo
              </button>
            </div>

            <div style={{ marginTop: '10px' }}>
              <b style={{ fontSize: '18px' }}>Você</b>
              <div style={{ color: 'var(--muted)', fontSize: '14px' }}>@voce_arrota</div>
              <div style={{ fontSize: '14px', marginTop: '6px' }}>No bonde desde 2026. Arroto com honra e sem perdão.</div>
            </div>

            {/* Estatísticas Ogras */}
            <div style={{ display: 'flex', gap: '20px', marginTop: '16px', fontSize: '14px' }}>
              <span>
                <b style={{ color: 'var(--accent)' }}>94</b> <span style={{ color: 'var(--muted)' }}>melhor nota</span>
              </span>
              <span>
                <b>7V · 3D</b> <span style={{ color: 'var(--muted)' }}>no X1</span>
              </span>
              <span>
                <b>{comunidades.length}</b> <span style={{ color: 'var(--muted)' }}>bondes</span>
              </span>
            </div>
          </div>

          <div style={{ padding: '16px' }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', textTransform: 'uppercase', margin: '0 0 12px' }}>
              Seus Causos Publicados
            </h3>
            <p style={{ color: 'var(--muted)', fontSize: '14px' }}>
              {causos.length > 0 ? 'Aqui estão seus causos e áudios que foram pra praça pública.' : 'Você ainda não postou nenhum causo. Arrote e compartilhe!'}
            </p>
          </div>
        </section>
      )}

      {/* Barra de Navegação Inferior (Mobile Friendly) */}
      <nav
        style={{
          position: 'fixed',
          left: 0,
          right: 0,
          bottom: 0,
          height: '60px',
          background: 'color-mix(in oklch, var(--bg) 92%, transparent)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderTop: '1px solid var(--border)',
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          alignItems: 'center',
          zIndex: 50,
          maxWidth: '480px',
          margin: '0 auto',
        }}
        aria-label="Navegação do Bonde"
      >
        <button
          type="button"
          onClick={() => setAbaAtiva('feed')}
          style={{
            background: 'none',
            border: 'none',
            color: abaAtiva === 'feed' ? 'var(--accent)' : 'var(--muted)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '2px',
            fontSize: '11px',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          <span style={{ fontSize: '18px' }}>📢</span>
          <span>Feed</span>
        </button>

        <button
          type="button"
          onClick={() => setAbaAtiva('bondes')}
          style={{
            background: 'none',
            border: 'none',
            color: abaAtiva === 'bondes' ? 'var(--accent)' : 'var(--muted)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '2px',
            fontSize: '11px',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          <span style={{ fontSize: '18px' }}>🦍</span>
          <span>Bondes</span>
        </button>

        <button
          type="button"
          onClick={() => setAbaAtiva('desafios')}
          style={{
            background: 'none',
            border: 'none',
            color: abaAtiva === 'desafios' ? 'var(--accent)' : 'var(--muted)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '2px',
            fontSize: '11px',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          <span style={{ fontSize: '18px' }}>⚔️</span>
          <span>Desafios</span>
        </button>

        <button
          type="button"
          onClick={() => setAbaAtiva('perfil')}
          style={{
            background: 'none',
            border: 'none',
            color: abaAtiva === 'perfil' ? 'var(--accent)' : 'var(--muted)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '2px',
            fontSize: '11px',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          <span style={{ fontSize: '18px' }}>👤</span>
          <span>Perfil</span>
        </button>
      </nav>

      {/* Botão Flutuante da Arena */}
      {onArrotar && (
        <button
          type="button"
          className="fab-arrotar"
          onClick={onArrotar}
          aria-label="Arrotar agora na Arena"
          style={{ bottom: '74px' }}
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

      {/* Modal do Card 9:16 de Compartilhamento */}
      {causoCompartilhando && (
        <ModalCardCompartilhamento
          aberto={Boolean(causoCompartilhando)}
          nota={causoCompartilhando.nota ?? 88}
          autorNome={causoCompartilhando.autorNome}
          comunidadeNome={causoCompartilhando.comunidadeSlug}
          textoCauso={causoCompartilhando.conteudo}
          codigoDesafio={causoCompartilhando.id.slice(0, 6)}
          onFechar={() => setCausoCompartilhando(null)}
        />
      )}
    </div>
  );
};
