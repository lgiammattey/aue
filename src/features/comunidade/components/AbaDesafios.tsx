import React, { useState, type ComponentProps } from 'react';
import type { PerfilUsuario } from '../../../nucleo/usuario/perfil';
import type { DesafioSocialRegistro } from '../../../plataforma/web/desafios';
import { Arena } from '../../../arena/Arena';

export type DesafioSocialItem = DesafioSocialRegistro;

interface AbaDesafiosProps {
  desafios?: readonly DesafioSocialItem[];
  aoCriarDesafio: () => void;
  aoRevanche?: (desafio: DesafioSocialItem) => void;
  aoCompartilhar: (desafio: DesafioSocialItem) => void;
  perfil?: PerfilUsuario;
  onPostarNoBonde?: ComponentProps<typeof Arena>['onPostarNoBonde'];
  desafioAtivoCodigo?: string;
  iniciarNoJogo?: boolean;
}

export const AbaDesafios: React.FC<AbaDesafiosProps> = ({
  desafios,
  aoCriarDesafio,
  aoRevanche,
  aoCompartilhar,
  onPostarNoBonde,
  desafioAtivoCodigo,
  iniciarNoJogo = true,
}) => {
  const [subAba, setSubAba] = useState<'jogo' | 'duelos'>(iniciarNoJogo ? 'jogo' : 'duelos');
  const [codigoDesafioAtual, setCodigoDesafioAtual] = useState<string | undefined>(desafioAtivoCodigo);
  const lista = desafios ?? [];

  const handleRevanche = (d: DesafioSocialItem) => {
    setCodigoDesafioAtual(d.codigo);
    setSubAba('jogo');
    aoRevanche?.(d);
  };


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
      {/* Seletor de Sub-abas em Desafios: O Jogo Auê | Duelos X1 */}
      <div
        style={{
          display: 'flex',
          borderBottom: '1px solid var(--border)',
          background: 'var(--surface)',
        }}
      >
        <button
          type="button"
          onClick={() => {
            setCodigoDesafioAtual(undefined);
            setSubAba('jogo');
          }}
          style={{
            flex: 1,
            height: '48px',
            border: 0,
            background: 'none',
            color: subAba === 'jogo' ? 'var(--fg)' : 'var(--muted)',
            fontWeight: subAba === 'jogo' ? 800 : 500,
            fontSize: '15px',
            cursor: 'pointer',
            borderBottom: subAba === 'jogo' ? '3px solid var(--accent)' : '3px solid transparent',
          }}
        >
          ⚡ O Jogo Auê
        </button>
        <button
          type="button"
          onClick={() => setSubAba('duelos')}
          style={{
            flex: 1,
            height: '48px',
            border: 0,
            background: 'none',
            color: subAba === 'duelos' ? 'var(--fg)' : 'var(--muted)',
            fontWeight: subAba === 'duelos' ? 800 : 500,
            fontSize: '15px',
            cursor: 'pointer',
            borderBottom: subAba === 'duelos' ? '3px solid var(--accent)' : '3px solid transparent',
          }}
        >
          ⚔️ Duelos X1 ({lista.length})
        </button>
      </div>

      {/* SUB-ABA 1: O JOGO AUÊ (ARENA) */}
      {subAba === 'jogo' && (
        <div style={{ padding: '16px' }}>
          <Arena
            codigoDoDesafio={codigoDesafioAtual}
            onPostarNoBonde={onPostarNoBonde}
          />
        </div>
      )}

      {/* SUB-ABA 2: DUELOS X1 */}
      {subAba === 'duelos' && (
        <div>
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

          {lista.length === 0 && (
            <p style={{ padding: '24px 16px', color: 'var(--muted)', fontSize: '15px' }}>
              Nenhum X1 por aqui ainda. Arrote, receba a nota e chame alguém: o link do duelo sai da Arena.
            </p>
          )}

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
                  onClick={() => handleRevanche(d)}
                  style={outBtnStyle}
                >
                  Revanche
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
