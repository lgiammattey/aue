import React from 'react';
import type { Comunidade } from '../../../portas/comunidade';

interface AbaComunidadesProps {
  comunidades: readonly Comunidade[];
  minhasComunidades: readonly string[];
  aoAlternarParticipacao: (slug: string) => void;
  aoFiltrarPorComunidade: (slug: string) => void;
}

export const AbaComunidades: React.FC<AbaComunidadesProps> = ({
  comunidades,
  minhasComunidades,
  aoAlternarParticipacao,
  aoFiltrarPorComunidade,
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '16px', borderBottom: '1px solid var(--border)', background: 'var(--surface)' }}>
        <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 800 }}>Ache seu Bonde</h2>
        <p style={{ margin: '6px 0 0', color: 'var(--muted)', fontSize: '14px', lineHeight: 1.4 }}>
          Entre nos bondes temáticos para postar seus causos específicos e ver as melhores notas de cada categoria.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {comunidades.map((c) => {
          const participa = minhasComunidades.includes(c.slug);

          return (
            <div
              key={c.slug}
              style={{
                padding: '16px',
                borderBottom: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                cursor: 'pointer',
                transition: 'background-color .15s ease',
              }}
              onClick={() => aoFiltrarPorComunidade(c.slug)}
            >
              {/* Ícone */}
              <div
                style={{
                  width: '52px',
                  height: '52px',
                  flex: 'none',
                  borderRadius: '14px',
                  background: 'var(--surface-2)',
                  border: '1px solid var(--border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '24px',
                }}
              >
                {c.icone}
              </div>

              {/* Informações da Comunidade */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <b style={{ fontSize: '16px', color: 'var(--fg)' }}>{c.nome}</b>
                </div>
                <div style={{ color: 'var(--muted)', fontSize: '14px', marginTop: '2px', lineHeight: 1.35 }}>
                  {c.descricao}
                </div>
                <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: '12px', color: 'var(--muted)', marginTop: '4px' }}>
                  {c.totalMembros ? `${c.totalMembros.toLocaleString('pt-BR')} arrotadores` : 'Comunidade ativa'}
                </div>
              </div>

              {/* Botão Entrar/Sair */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  aoAlternarParticipacao(c.slug);
                }}
                style={{
                  padding: '8px 18px',
                  borderRadius: '999px',
                  border: participa ? '1px solid var(--border)' : 'none',
                  background: participa ? 'transparent' : 'var(--accent)',
                  color: participa ? 'var(--fg)' : 'var(--accent-on)',
                  fontWeight: 700,
                  fontSize: '13px',
                  cursor: 'pointer',
                  flex: 'none',
                  transition: 'background-color .15s ease, transform .1s ease',
                }}
              >
                {participa ? 'Participando' : 'Entrar'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
