import React, { useMemo, useState } from 'react';
import { ordenarEmNiveis } from '../../../nucleo/comunidade/comentarios';
import type { RespostaDeCauso } from '../../../portas/comunidade';
import { MENSAGEM_DE_ERRO_DE_RESPOSTA, useEnvioDeResposta, type ResultadoDoEnvio } from './useEnvioDeResposta';

interface ArvoreDeComentariosProps {
  comentarios: readonly RespostaDeCauso[];
  /** `respostaAId` vem preenchido quando a pessoa responde outro comentário. */
  aoResponder: (texto: string, respostaAId?: string) => ResultadoDoEnvio;
  aoAbrirPerfil?: (handle: string, nome?: string) => void;
}

export const ArvoreDeComentarios: React.FC<ArvoreDeComentariosProps> = ({
  comentarios,
  aoResponder,
  aoAbrirPerfil,
}) => {
  const itens = useMemo(() => ordenarEmNiveis(comentarios), [comentarios]);
  const [respondendoId, setRespondendoId] = useState<string | null>(null);
  const [texto, setTexto] = useState('');

  const envio = useEnvioDeResposta();

  const enviar = async (e: React.FormEvent, respostaAId: string) => {
    e.preventDefault();
    if (!texto.trim()) return;
    const ok = await envio.enviar(() => aoResponder(texto.trim(), respostaAId));
    if (!ok) return;
    setTexto('');
    setRespondendoId(null);
  };

  if (itens.length === 0) {
    return (
      <span style={{ color: 'var(--muted)', fontSize: '14px' }}>Sem respostas. Seja o primeiro.</span>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {itens.map(({ resposta: r, nivel }) => {
        const ini = (r.autorNome?.slice(0, 2) || 'VC').toUpperCase();
        return (
          <div
            key={r.id}
            data-nivel={nivel}
            style={{ display: 'flex', gap: '10px', marginLeft: `${nivel * 20}px` }}
          >
            <button
              type="button"
              onClick={() => aoAbrirPerfil?.(r.autorHandle, r.autorNome)}
              aria-label={`Ver perfil de @${r.autorHandle}`}
              style={{
                width: '32px',
                height: '32px',
                flex: 'none',
                borderRadius: '50%',
                border: 0,
                background: 'var(--surface-2)',
                color: 'var(--fg)',
                fontWeight: 700,
                fontSize: '11px',
                cursor: aoAbrirPerfil ? 'pointer' : 'default',
              }}
            >
              {ini}
            </button>
            <div style={{ minWidth: 0, lineHeight: 1.4, flex: 1 }}>
              <b style={{ fontSize: '14px' }}>{r.autorNome}</b>{' '}
              <span style={{ color: 'var(--muted)', fontSize: '13px' }}>
                @{r.autorHandle} · {new Date(r.criadoEm).toLocaleDateString('pt-BR')}
              </span>
              <div style={{ fontSize: '14px', textWrap: 'pretty', color: 'var(--fg)' }}>{r.conteudo}</div>
              <button
                type="button"
                onClick={() => {
                  envio.limparErro();
                  setRespondendoId(respondendoId === r.id ? null : r.id);
                }}
                style={{
                  background: 'none',
                  border: 0,
                  padding: '4px 0',
                  minHeight: '44px',
                  color: 'var(--muted)',
                  fontSize: '13px',
                  cursor: 'pointer',
                }}
              >
                Responder
              </button>
              {respondendoId === r.id && (
                <form onSubmit={(e) => enviar(e, r.id)} style={{ display: 'flex', gap: '8px' }}>
                  <input
                    autoFocus
                    value={texto}
                    maxLength={500}
                    onChange={(e) => setTexto(e.target.value)}
                    placeholder={`Responder a @${r.autorHandle}`}
                    aria-label={`Responder a @${r.autorHandle}`}
                    style={{
                      flex: 1,
                      minWidth: 0,
                      height: '40px',
                      borderRadius: '999px',
                      border: '1px solid var(--border-strong)',
                      background: 'var(--bg)',
                      color: 'var(--fg)',
                      padding: '0 14px',
                      fontSize: '14px',
                      fontFamily: 'inherit',
                      boxSizing: 'border-box',
                    }}
                  />
                  <button
                    type="submit"
                    disabled={envio.enviando}
                    style={{
                      height: '40px',
                      padding: '0 16px',
                      border: 0,
                      borderRadius: '18px',
                      background: 'var(--accent)',
                      color: 'var(--accent-on)',
                      fontWeight: 700,
                      fontSize: '14px',
                      cursor: 'pointer',
                    }}
                  >
                    {envio.enviando ? 'Enviando…' : 'Enviar'}
                  </button>
                </form>
              )}
              {respondendoId === r.id && envio.erro && (
                <p role="alert" style={{ margin: '4px 0 0', color: 'var(--muted)', fontSize: '13px' }}>
                  {MENSAGEM_DE_ERRO_DE_RESPOSTA}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
