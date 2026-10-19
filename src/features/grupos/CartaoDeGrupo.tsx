import React, { useState } from 'react';
import type { GrupoExterno } from '../../portas/grupos';
import { ROTULO_DA_PLATAFORMA, ROTULO_DO_BOTAO } from './rotulos';

/**
 * `app`: o cartão da aba Comunidade. `publica`: o de `/grupos`, medido em
 * `docs/design/prototipo/Páginas Públicas.dc.html` — sem borda, mais respiro,
 * avatar escuro com as iniciais em Archivo.
 */
export type VarianteDeGrupos = 'app' | 'publica';

interface CartaoDeGrupoProps {
  grupo: GrupoExterno;
  /** Ausente: o botão de denunciar não aparece (ex.: grupo oficial). */
  aoDenunciar?: (grupo: GrupoExterno) => void;
  variante?: VarianteDeGrupos;
}

const LIMITE_DA_DESCRICAO = 180;

function iniciais(nome: string): string {
  const letras = nome.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]);
  return letras.join('').toUpperCase();
}

export const CartaoDeGrupo: React.FC<CartaoDeGrupoProps> = ({ grupo, aoDenunciar, variante = 'app' }) => {
  const publica = variante === 'publica';
  const [aberto, setAberto] = useState(false);
  const longa = grupo.descricao.length > LIMITE_DA_DESCRICAO;
  const texto = !longa || aberto ? grupo.descricao : `${grupo.descricao.slice(0, LIMITE_DA_DESCRICAO).trimEnd()}…`;

  return (
    <article
      aria-label={grupo.nome}
      style={{
        background: 'var(--surface)',
        border: publica ? 0 : '1px solid var(--border)',
        borderRadius: '20px',
        padding: publica ? '24px' : '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: publica ? '14px' : '12px' }}>
        {grupo.imagemUrl ? (
          <img
            src={grupo.imagemUrl}
            alt=""
            width={publica ? 52 : 56}
            height={publica ? 52 : 56}
            loading="lazy"
            style={{ width: publica ? 52 : 56, height: publica ? 52 : 56, borderRadius: 14, objectFit: 'cover', flex: 'none', background: 'var(--surface-2)' }}
          />
        ) : (
          <div
            aria-hidden="true"
            style={
              publica
                ? {
                    width: 52,
                    height: 52,
                    borderRadius: 14,
                    background: 'var(--fg)',
                    color: 'var(--bg)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 900,
                    fontSize: 18,
                    flex: 'none',
                  }
                : {
                    width: 56,
                    height: 56,
                    borderRadius: 14,
                    background: 'var(--surface-2)',
                    color: 'var(--muted)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: 'var(--font-display)',
                    fontSize: 22,
                    flex: 'none',
                  }
            }
          >
            {iniciais(grupo.nome)}
          </div>
        )}
        <div style={{ minWidth: 0 }}>
          <b style={{ display: 'block', fontSize: publica ? 19 : 17, color: 'var(--fg)', overflowWrap: 'anywhere' }}>{grupo.nome}</b>
          <span
            style={{
              display: 'inline-block',
              marginTop: 4,
              fontSize: 11,
              fontFamily: 'ui-monospace, monospace',
              textTransform: 'uppercase',
              color: 'var(--muted)',
              background: 'var(--surface-2)',
              padding: '2px 8px',
              borderRadius: 6,
            }}
          >
            {ROTULO_DA_PLATAFORMA[grupo.plataforma]}
            {grupo.oficial ? ' · Oficial' : ''}
          </span>
        </div>
      </div>

      <p style={{ margin: 0, fontSize: 15, lineHeight: 1.5, color: 'var(--fg)', whiteSpace: 'pre-line', overflowWrap: 'anywhere' }}>
        {texto}
      </p>
      {longa && (
        <button
          type="button"
          onClick={() => setAberto((v) => !v)}
          aria-expanded={aberto}
          style={{
            alignSelf: 'flex-start',
            minHeight: 44,
            background: 'none',
            border: 0,
            padding: 0,
            color: 'var(--muted)',
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          {aberto ? 'Ver menos' : 'Ver tudo'}
        </button>
      )}

      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <a
          href={grupo.linkDoConvite}
          target="_blank"
          rel="nofollow ugc noopener noreferrer"
          style={{
            flex: 1,
            minWidth: 160,
            minHeight: 44,
            borderRadius: 999,
            background: 'var(--fg)',
            color: 'var(--bg)',
            fontWeight: 700,
            fontSize: 15,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            textDecoration: 'none',
          }}
        >
          {ROTULO_DO_BOTAO[grupo.plataforma]}
        </a>
        {aoDenunciar && !grupo.oficial && (
          <button
            type="button"
            onClick={() => aoDenunciar(grupo)}
            aria-label={`Denunciar o grupo ${grupo.nome}`}
            style={{
              minHeight: 44,
              padding: '0 14px',
              borderRadius: 999,
              border: '1px solid var(--border-strong)',
              background: 'transparent',
              color: 'var(--muted)',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Denunciar
          </button>
        )}
      </div>
    </article>
  );
};
