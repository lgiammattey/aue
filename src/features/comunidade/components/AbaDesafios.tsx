import React from 'react';
import type { PerfilUsuario } from '../../../nucleo/usuario/perfil';

export interface DesafioSocialItem {
  id: string;
  titulo: string;
  jogadorA: string;
  jogadorB: string;
  notaA: number | string;
  notaB: number | string;
  status: 'Venceu' | 'Perdeu' | 'Empatou' | 'Esperando';
  codigo: string;
  criadoEm: string;
}

interface AbaDesafiosProps {
  desafios: readonly DesafioSocialItem[];
  aoCriarDesafio: () => void;
  aoRevanche: (codigo: string) => void;
  aoCompartilhar: (desafio: DesafioSocialItem) => void;
  perfil: PerfilUsuario;
}

export const AbaDesafios: React.FC<AbaDesafiosProps> = ({
  desafios,
  aoCriarDesafio,
  aoRevanche,
  aoCompartilhar,
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {/* Topo: Criar Desafio */}
      <div style={{ padding: '16px', borderBottom: '1px solid var(--border)', background: 'var(--surface)' }}>
        <h2 style={{ margin: '0 0 14px', fontSize: '20px', fontWeight: 800 }}>Duelos no X1</h2>
        <button
          type="button"
          onClick={aoCriarDesafio}
          style={{
            width: '100%',
            height: '52px',
            border: 'none',
            borderRadius: '16px',
            background: 'var(--accent)',
            color: 'var(--accent-on)',
            fontWeight: 800,
            fontSize: '16px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            boxShadow: '0 4px 14px rgba(198, 255, 0, 0.3)',
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 01-10 0zM17 5h3v2a3 3 0 01-3 3M7 5H4v2a3 3 0 003 3" />
          </svg>
          <span>Chamar Alguém pro X1</span>
        </button>
      </div>

      {/* Lista de Duelos */}
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {desafios.length > 0 ? (
          desafios.map((d) => {
            const statusColor =
              d.status === 'Venceu'
                ? 'var(--accent)'
                : d.status === 'Perdeu'
                ? 'var(--muted)'
                : d.status === 'Empatou'
                ? 'var(--fg)'
                : 'var(--accent)';

            return (
              <div
                key={d.id}
                style={{
                  padding: '16px',
                  borderBottom: '1px solid var(--border)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <b style={{ fontSize: '15px', color: 'var(--fg)' }}>{d.titulo}</b>
                  <span
                    style={{
                      fontFamily: 'ui-monospace, monospace',
                      fontSize: '12px',
                      color: statusColor,
                      fontWeight: 700,
                      textTransform: 'uppercase',
                    }}
                  >
                    {d.status}
                  </span>
                </div>

                {/* Grid Versus */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr auto 1fr',
                    alignItems: 'center',
                    gap: '16px',
                    padding: '12px',
                    borderRadius: '14px',
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                  }}
                >
                  {/* Jogador A */}
                  <div>
                    <div style={{ color: 'var(--muted)', fontSize: '13px' }}>@{d.jogadorA}</div>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: '36px', lineHeight: 1.1, color: 'var(--fg)' }}>
                      {d.notaA}
                    </div>
                  </div>

                  {/* VS */}
                  <span
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: '18px',
                      color: 'var(--muted)',
                      letterSpacing: '0.04em',
                    }}
                  >
                    X1
                  </span>

                  {/* Jogador B */}
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ color: 'var(--muted)', fontSize: '13px' }}>@{d.jogadorB}</div>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: '36px', lineHeight: 1.1, color: 'var(--fg)' }}>
                      {d.notaB}
                    </div>
                  </div>
                </div>

                {/* Ações */}
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => aoCompartilhar(d)}
                    style={{
                      flex: 1,
                      height: '38px',
                      borderRadius: '999px',
                      border: '1px solid var(--border)',
                      background: 'transparent',
                      color: 'var(--fg)',
                      fontWeight: 600,
                      fontSize: '13px',
                      cursor: 'pointer',
                    }}
                  >
                    Compartilhar card
                  </button>
                  <button
                    type="button"
                    onClick={() => aoRevanche(d.codigo)}
                    style={{
                      flex: 1,
                      height: '38px',
                      borderRadius: '999px',
                      border: 'none',
                      background: 'var(--surface-2)',
                      color: 'var(--fg)',
                      fontWeight: 700,
                      fontSize: '13px',
                      cursor: 'pointer',
                    }}
                  >
                    Revanche
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--muted)' }}>
            <div style={{ fontSize: '36px', marginBottom: '8px' }}>⚔️</div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--fg)' }}>Nenhum duelo aberto ainda</div>
            <p style={{ fontSize: '14px', margin: '6px 0 0', lineHeight: 1.4 }}>
              Toque no botão acima para gravar seu arroto e mandar o link pro zap dos seus amigos.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
