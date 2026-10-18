import React, { useState } from 'react';
import type { CausoPostado, Comunidade } from '../../../portas/comunidade';
import { alternarSeguirLocal, obterSeguindoLocais } from '../../../plataforma/web/perfil';

interface ColunaTendenciasProps {
  causos?: readonly CausoPostado[];
  comunidades?: readonly Comunidade[];
  minhasComunidades?: readonly string[];
  aoEntrarComunidade?: (slug: string) => void;
  aoAbrirDesafio?: () => void;
  aoAbrirPerfil?: (handle: string, nome?: string) => void;
  termoBusca?: string;
  aoMudarBusca?: (termo: string) => void;
  aoSelecionarTrend?: (tagOuCategoria: string) => void;
}

export const ColunaTendencias: React.FC<ColunaTendenciasProps> = ({
  aoAbrirPerfil,
  termoBusca = '',
  aoMudarBusca,
  aoSelecionarTrend,
}) => {
  const [buscaInterna, setBuscaInterna] = useState('');
  const valorBusca = aoMudarBusca ? termoBusca : buscaInterna;
  const setBusca = (val: string) => {
    if (aoMudarBusca) {
      aoMudarBusca(val);
    } else {
      setBuscaInterna(val);
    }
  };
  const [seguindo, setSeguindo] = useState<string[]>(() => obterSeguindoLocais());

  const trends = [
    { cat: 'Cerveja Gelada', tag: '#LongNeckChallenge', n: '12,4 mil' },
    { cat: 'Arroto trovão', tag: '#TremeuAJanela', n: '8,9 mil' },
    { cat: 'Na reunião da firma', tag: '#MutadoNoTeams', n: '6,2 mil' },
    { cat: 'Primeiro encontro', tag: '#VexameNoJapa', n: '4,5 mil' },
    { cat: 'Refri & Cia', tag: '#GraveDeElevador', n: '3,1 mil' },
  ];

  const sugestoes = [
    { name: 'Tiago do Bonde', handle: 'tiagobonde', ini: 'TB' },
    { name: 'Iury da Oficina', handle: 'iury_oficina', ini: 'IO' },
    { name: 'Rian da Bolha', handle: 'rian_design', ini: 'RD' },
    { name: 'Dani Gás', handle: 'danigas', ini: 'DG' },
    { name: 'Lucas do Áudio', handle: 'lucas_audio', ini: 'LA' },
  ];

  const alternarSeguir = (handle: string) => {
    alternarSeguirLocal(handle);
    setSeguindo(obterSeguindoLocais());
  };

  return (
    <aside
      style={{
        width: '320px',
        flex: 'none',
        position: 'sticky',
        top: 0,
        padding: '12px 0 12px 24px',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        maxHeight: '100vh',
        overflowY: 'auto',
      }}
    >
      {/* Busca Pill */}
      <input
        value={valorBusca}
        onChange={(e) => setBusca(e.target.value)}
        placeholder="Buscar no bonde"
        style={{
          height: '44px',
          borderRadius: '999px',
          border: '1px solid var(--border-strong)',
          background: 'var(--surface)',
          color: 'var(--fg)',
          padding: '0 18px',
          fontSize: '15px',
          fontFamily: 'inherit',
          outline: 'none',
          boxSizing: 'border-box',
          width: '100%',
        }}
      />

      {/* Em alta no Bonde */}
      <section
        style={{
          background: 'var(--surface)',
          borderRadius: '16px',
          overflow: 'hidden',
          border: '1px solid var(--border)',
        }}
      >
        <div style={{ padding: '12px 16px', fontWeight: 700, fontSize: '20px', color: 'var(--fg)' }}>
          Em alta no Bonde
        </div>
        {trends.map((t, i) => (
          <div
            key={i}
            onClick={() => {
              if (aoSelecionarTrend) {
                aoSelecionarTrend(t.tag);
              } else {
                setBusca(t.tag);
              }
            }}
            style={{
              padding: '10px 16px',
              cursor: 'pointer',
            }}
          >
            <div
              style={{
                fontFamily: 'ui-monospace, monospace',
                fontSize: '11px',
                color: 'var(--muted)',
                textTransform: 'uppercase',
                letterSpacing: '.06em',
              }}
            >
              {t.cat}
            </div>
            <div style={{ fontWeight: 700, fontSize: '15px', color: 'var(--fg)' }}>{t.tag}</div>
            <div style={{ color: 'var(--muted)', fontSize: '13px' }}>{t.n} posts</div>
          </div>
        ))}
        <div
          style={{
            padding: '14px 16px',
            fontSize: '15px',
            cursor: 'pointer',
            fontWeight: 600,
            color: 'var(--fg)',
          }}
        >
          Mostrar mais
        </div>
      </section>

      {/* Quem seguir */}
      <section
        style={{
          background: 'var(--surface)',
          borderRadius: '16px',
          overflow: 'hidden',
          border: '1px solid var(--border)',
        }}
      >
        <div style={{ padding: '12px 16px', fontWeight: 700, fontSize: '20px', color: 'var(--fg)' }}>
          Quem seguir
        </div>
        {sugestoes.map((u) => {
          const isSeguindo = seguindo.includes(u.handle);
          return (
            <div
              key={u.handle}
              style={{
                padding: '10px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
              }}
            >
              <div
                onClick={() => aoAbrirPerfil?.(u.handle, u.name)}
                style={{
                  width: '40px',
                  height: '40px',
                  flex: 'none',
                  borderRadius: '50%',
                  background: 'var(--surface-2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '13px',
                  color: 'var(--fg)',
                  cursor: aoAbrirPerfil ? 'pointer' : 'default',
                }}
                title={`Ver perfil de @${u.handle}`}
              >
                {u.ini}
              </div>
              <div
                onClick={() => aoAbrirPerfil?.(u.handle, u.name)}
                style={{
                  flex: 1,
                  minWidth: 0,
                  lineHeight: 1.3,
                  cursor: aoAbrirPerfil ? 'pointer' : 'default',
                }}
                title={`Ver perfil de @${u.handle}`}
              >
                <b style={{ fontSize: '15px', color: 'var(--fg)' }}>{u.name}</b>
                <div style={{ color: 'var(--muted)', fontSize: '14px' }}>@{u.handle}</div>
              </div>
              <button
                type="button"
                onClick={() => alternarSeguir(u.handle)}
                style={{
                  height: '32px',
                  padding: '0 16px',
                  borderRadius: '999px',
                  cursor: 'pointer',
                  fontWeight: 700,
                  fontSize: '14px',
                  border: isSeguindo ? '1px solid var(--border)' : '0',
                  background: isSeguindo ? 'transparent' : 'var(--fg)',
                  color: isSeguindo ? 'var(--fg)' : 'var(--bg)',
                  flex: 'none',
                }}
              >
                {isSeguindo ? 'Seguindo' : 'Seguir'}
              </button>
            </div>
          );
        })}
      </section>
    </aside>
  );
};
