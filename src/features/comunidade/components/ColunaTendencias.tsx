import React from 'react';
import type { CausoPostado, Comunidade } from '../../../portas/comunidade';

interface ColunaTendenciasProps {
  causos: readonly CausoPostado[];
  comunidades: readonly Comunidade[];
  minhasComunidades: readonly string[];
  aoEntrarComunidade: (slug: string) => void;
  aoAbrirDesafio: () => void;
}

export const ColunaTendencias: React.FC<ColunaTendenciasProps> = ({
  causos,
  comunidades,
  minhasComunidades,
  aoEntrarComunidade,
  aoAbrirDesafio,
}) => {
  // Ranking de hoje extraído dos causos reais que possuem nota
  const ranking = causos
    .filter((c) => c.nota !== undefined)
    .sort((a, b) => (b.nota || 0) - (a.nota || 0))
    .slice(0, 5)
    .map((c, i) => ({
      pos: `${i + 1}º`,
      nome: c.autorNome,
      nota: c.nota,
      destaque: i === 0,
    }));

  return (
    <aside
      style={{
        width: '320px',
        flex: 'none',
        position: 'sticky',
        top: 0,
        height: '100vh',
        padding: '12px 0 12px 20px',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        overflowY: 'auto',
      }}
    >
      {/* Bloco 1: Ranking de Hoje */}
      <section
        style={{
          background: 'var(--surface)',
          borderRadius: '16px',
          border: '1px solid var(--border)',
          overflow: 'hidden',
        }}
      >
        <div style={{ padding: '14px 16px', fontWeight: 800, fontSize: '18px', borderBottom: '1px solid var(--border)' }}>
          Ranking do Bonde
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {ranking.length > 0 ? (
            ranking.map((r, i) => (
              <div
                key={i}
                style={{
                  padding: '10px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  borderBottom: i < ranking.length - 1 ? '1px solid var(--border)' : 'none',
                }}
              >
                <span
                  style={{
                    width: '24px',
                    fontFamily: 'ui-monospace, monospace',
                    fontSize: '13px',
                    fontWeight: 700,
                    color: r.destaque ? 'var(--accent)' : 'var(--muted)',
                  }}
                >
                  {r.pos}
                </span>
                <span style={{ flex: 1, fontSize: '14px', fontWeight: r.destaque ? 700 : 500, color: 'var(--fg)' }}>
                  {r.nome}
                </span>
                <span
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '20px',
                    color: r.destaque ? 'var(--accent)' : 'var(--fg)',
                  }}
                >
                  {r.nota}
                </span>
              </div>
            ))
          ) : (
            <div style={{ padding: '16px', color: 'var(--muted)', fontSize: '13px' }}>
              Nenhum arroto com nota hoje. Arrote na Arena e lidere o bonde!
            </div>
          )}
        </div>
      </section>

      {/* Bloco 2: Desafio X1 Chamada Rápida */}
      <section
        style={{
          background: 'var(--surface)',
          borderRadius: '16px',
          border: '1px solid var(--border)',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
        }}
      >
        <div style={{ fontWeight: 800, fontSize: '18px' }}>Duelos X1</div>
        <p style={{ margin: 0, color: 'var(--muted)', fontSize: '13px', lineHeight: 1.4 }}>
          Mande seu link pra humilhar aquele amigo que jura que arrota mais alto.
        </p>
        <button
          type="button"
          onClick={aoAbrirDesafio}
          style={{
            height: '42px',
            borderRadius: '999px',
            background: 'var(--accent)',
            color: 'var(--accent-on)',
            border: 'none',
            fontWeight: 800,
            fontSize: '14px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
          }}
        >
          <span>Criar Desafio X1</span>
        </button>
      </section>

      {/* Bloco 3: Comunidades para Explorar */}
      <section
        style={{
          background: 'var(--surface)',
          borderRadius: '16px',
          border: '1px solid var(--border)',
          overflow: 'hidden',
        }}
      >
        <div style={{ padding: '14px 16px', fontWeight: 800, fontSize: '18px', borderBottom: '1px solid var(--border)' }}>
          Comunidades em Alta
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {comunidades.slice(0, 4).map((c, i) => {
            const participa = minhasComunidades.includes(c.slug);
            return (
              <div
                key={c.slug}
                style={{
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '10px',
                  borderBottom: i < 3 ? '1px solid var(--border)' : 'none',
                }}
              >
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--fg)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>{c.icone}</span>
                    <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{c.nome}</span>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '2px' }}>
                    {c.totalMembros ? `${(Math.round(c.totalMembros / 100) / 10).toString().replace('.', ',')}k arrotadores` : 'Ativa'}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => aoEntrarComunidade(c.slug)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '999px',
                    background: participa ? 'var(--surface-2)' : 'var(--fg)',
                    color: participa ? 'var(--muted)' : 'var(--bg)',
                    border: 'none',
                    fontWeight: 700,
                    fontSize: '12px',
                    cursor: 'pointer',
                    flex: 'none',
                  }}
                >
                  {participa ? 'Seguindo' : 'Entrar'}
                </button>
              </div>
            );
          })}
        </div>
      </section>
    </aside>
  );
};
