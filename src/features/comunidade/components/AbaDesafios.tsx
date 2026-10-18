import React from 'react';
import type { PerfilUsuario } from '../../../nucleo/usuario/perfil';
import { obterDesafiosSociaisLocais, type DesafioSocialRegistro } from '../../../plataforma/web/desafios';

export type DesafioSocialItem = DesafioSocialRegistro;

interface AbaDesafiosProps {
  desafios?: readonly DesafioSocialItem[];
  aoCriarDesafio: () => void;
  aoRevanche: (desafio: DesafioSocialItem) => void;
  aoCompartilhar: (desafio: DesafioSocialItem) => void;
  perfil?: PerfilUsuario;
}

export const AbaDesafios: React.FC<AbaDesafiosProps> = ({
  desafios,
  aoCriarDesafio,
  aoRevanche,
  aoCompartilhar,
}) => {
  const lista = desafios && desafios.length > 0 ? desafios : obterDesafiosSociaisLocais();


  const outBtnStyle: React.CSSProperties = {
    flex: 1,
    height: '40px',
    borderRadius: '12px',
    border: '1px solid var(--border-strong)',
    background: 'transparent',
    color: 'var(--fg)',
    fontWeight: 600,
    fontSize: '14px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {/* Botão Topo Chamar pro X1 */}
      <div style={{ padding: '16px', borderBottom: '1px solid var(--border)' }}>
        <button
          type="button"
          onClick={aoCriarDesafio}
          style={{
            width: '100%',
            height: '56px',
            border: 0,
            borderRadius: '18px',
            background: 'var(--accent)',
            color: 'var(--accent-on)',
            fontWeight: 700,
            fontSize: '16px',
            cursor: 'pointer',
          }}
        >
          Chamar pro X1
        </button>
      </div>

      {/* Lista de Desafios */}
      {lista.map((d) => (
        <div
          key={d.id}
          style={{
            padding: '16px',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <b style={{ fontSize: '15px', color: 'var(--fg)' }}>{d.titulo}</b>
            <span
              style={{
                fontFamily: 'ui-monospace, monospace',
                fontSize: '11px',
                color: 'var(--muted)',
                textTransform: 'uppercase',
              }}
            >
              {d.status}
            </span>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr auto 1fr',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <div>
              <div style={{ color: 'var(--muted)', fontSize: '14px' }}>@{d.jogadorA}</div>
              <div
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '40px',
                  lineHeight: 1.1,
                  color: 'var(--fg)',
                }}
              >
                {d.notaA}
              </div>
            </div>

            <span
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '16px',
                color: 'var(--muted)',
              }}
            >
              X1
            </span>

            <div style={{ textAlign: 'right' }}>
              <div style={{ color: 'var(--muted)', fontSize: '14px' }}>@{d.jogadorB}</div>
              <div
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '40px',
                  lineHeight: 1.1,
                  color: 'var(--fg)',
                }}
              >
                {d.notaB}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              onClick={() => aoCompartilhar(d)}
              style={outBtnStyle}
            >
              Compartilhar card
            </button>
            <button
              type="button"
              onClick={() => aoRevanche(d)}
              style={outBtnStyle}
            >
              Revanche
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};
