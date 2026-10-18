import React, { useState } from 'react';
import type { CausoPostado, Comunidade } from '../../../portas/comunidade';
import { DetalheComunidade, type ComunidadeInfo } from './DetalheComunidade';

interface AbaComunidadesProps {
  comunidades: readonly Comunidade[];
  minhasComunidades: readonly string[];
  aoAlternarParticipacao: (slug: string) => void;
  aoFiltrarPorComunidade: (slug: string) => void;
  comunidadeAtivaSlug?: string | null;
  causos?: readonly CausoPostado[];
  aoPostarCauso?: (comunidadeSlug: string, texto: string) => Promise<boolean>;
  aoCurtirCauso?: (id: string) => void;
  aoRepostarCauso?: (id: string) => void;
  aoDuvidarCauso?: (causo: CausoPostado) => void;
  aoCompartilharCauso?: (causo: CausoPostado) => void;
  aoResponderCauso?: (id: string, texto: string) => void;
  aoDenunciarCauso?: (id: string) => void;
  aoAbrirPerfil?: (handle: string, nome?: string) => void;
}

const COMUNIDADES_CANONICAS: ComunidadeInfo[] = [
  {
    slug: 'bonde-do-arroto',
    nome: 'Bonde do Arroto',
    ini: 'BA',
    cat: 'Oficial',
    desc: 'A comunidade oficial do Auê!. A praça central: todo mundo arrota aqui.',
    members: '48,2 mil',
    ano: 2026,
  },
  {
    slug: 'cerveja-gelada',
    nome: 'Cerveja Gelada',
    ini: 'CG',
    cat: 'Cerveja',
    desc: 'Arroto de long neck, chope e lata.',
    members: '12,9 mil',
    ano: 2026,
  },
  {
    slug: 'refri-e-cia',
    nome: 'Refri & Cia',
    ini: 'RC',
    cat: 'Refri',
    desc: 'Gás de refrigerante. Grave é lei.',
    members: '9,4 mil',
    ano: 2026,
  },
  {
    slug: 'historias-de-arroto',
    nome: 'Histórias de Arroto',
    ini: 'HA',
    cat: 'Histórias',
    desc: 'Casos, vexames e lendas de família.',
    members: '21,7 mil',
    ano: 2026,
  },
  {
    slug: 'churrasco-raiz',
    nome: 'Churrasco Raiz',
    ini: 'CR',
    cat: 'Comida',
    desc: 'Pós-picanha. Respeito.',
    members: '7,1 mil',
    ano: 2026,
  },
];

const CATEGORIAS = ['Todas', 'Oficial', 'Cerveja', 'Refri', 'Histórias', 'Comida'];

export const AbaComunidades: React.FC<AbaComunidadesProps> = ({
  comunidades,
  minhasComunidades,
  aoAlternarParticipacao,
  aoFiltrarPorComunidade: _aoFiltrar,
  comunidadeAtivaSlug,
  causos = [],
  aoPostarCauso,
  aoCurtirCauso = () => {},
  aoRepostarCauso = () => {},
  aoDuvidarCauso = () => {},
  aoCompartilharCauso = () => {},
  aoResponderCauso = () => {},
  aoDenunciarCauso = () => {},
  aoAbrirPerfil,
}) => {
  const [slugSelecionado, setSlugSelecionado] = useState<string | null>(comunidadeAtivaSlug ?? null);
  const [categoriaAtiva, setCategoriaAtiva] = useState<string>('Todas');

  // Mescla comunidades fornecidas ou usa lista canônica
  const listaCompleta: ComunidadeInfo[] = (comunidades.length > 0 ? comunidades : COMUNIDADES_CANONICAS).map((c) => {
    const can = COMUNIDADES_CANONICAS.find(
      (x) => x.slug === c.slug || x.nome.toLowerCase() === c.nome.toLowerCase(),
    );
    const desc = 'descricao' in c && typeof c.descricao === 'string' ? c.descricao : can?.desc || 'Comunidade de arrotadores do Auê.';
    const members = can ? can.members : ('totalMembros' in c && typeof c.totalMembros === 'number' ? `${c.totalMembros} membros` : '1,2 mil membros');
    return {
      slug: c.slug,
      nome: c.nome,
      ini: can ? can.ini : c.nome.slice(0, 2).toUpperCase(),
      cat: can ? can.cat : 'Geral',
      desc,
      members,
      ano: can ? can.ano : 2026,
    };
  });

  const comunidadesFiltradas = listaCompleta.filter((c) => {
    if (categoriaAtiva === 'Todas') return true;
    return c.cat.toLowerCase() === categoriaAtiva.toLowerCase();
  });

  // Se houver uma comunidade selecionada, renderiza o DetalheComunidade
  const comuAtiva = slugSelecionado
    ? listaCompleta.find((c) => c.slug === slugSelecionado || c.nome.toLowerCase() === slugSelecionado.toLowerCase())
    : null;

  if (comuAtiva) {
    const estaDentro =
      minhasComunidades.includes(comuAtiva.slug) || minhasComunidades.includes(comuAtiva.nome);
    const causosDestaComu = causos.filter(
      (p) =>
        p.comunidadeSlug?.toLowerCase() === comuAtiva.slug.toLowerCase() ||
        p.comunidadeSlug?.toLowerCase() === comuAtiva.nome.toLowerCase(),
    );

    return (
      <DetalheComunidade
        comunidade={comuAtiva}
        estaDentro={estaDentro}
        aoAlternarParticipacao={() => aoAlternarParticipacao(comuAtiva.slug)}
        aoVoltar={() => setSlugSelecionado(null)}
        causosDaComunidade={causosDestaComu}
        aoPostarCauso={async (texto) => {
          if (!aoPostarCauso) return false;
          return await aoPostarCauso(comuAtiva.nome, texto);
        }}
        aoCurtirCauso={aoCurtirCauso}
        aoRepostarCauso={aoRepostarCauso}
        aoDuvidarCauso={aoDuvidarCauso}
        aoCompartilharCauso={aoCompartilharCauso}
        aoResponderCauso={aoResponderCauso}
        aoDenunciarCauso={aoDenunciarCauso}
        aoAbrirPerfil={aoAbrirPerfil}
      />
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {/* Pills de Categorias */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          padding: '16px 16px 12px',
          overflowX: 'auto',
          borderBottom: '1px solid var(--border)',
          scrollbarWidth: 'none',
        }}
      >
        {CATEGORIAS.map((cat) => {
          const ativo = categoriaAtiva === cat;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => setCategoriaAtiva(cat)}
              style={{
                height: '34px',
                padding: '0 16px',
                borderRadius: '999px',
                border: ativo ? '1px solid var(--fg)' : '1px solid var(--border)',
                background: ativo ? 'var(--fg)' : 'var(--surface)',
                color: ativo ? 'var(--bg)' : 'var(--fg)',
                fontWeight: ativo ? 700 : 500,
                fontSize: '14px',
                cursor: 'pointer',
                flex: 'none',
              }}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* Lista de Comunidades */}
      {comunidadesFiltradas.map((c) => {
        const j = minhasComunidades.includes(c.slug) || minhasComunidades.includes(c.nome);
        return (
          <div
            key={c.slug}
            style={{
              padding: '16px',
              borderBottom: '1px solid var(--border)',
              display: 'flex',
              gap: '12px',
              alignItems: 'center',
              cursor: 'pointer',
            }}
            onClick={() => setSlugSelecionado(c.slug)}
          >
            <div
              style={{
                width: '52px',
                height: '52px',
                flex: 'none',
                borderRadius: '12px',
                background: 'var(--surface-2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: 'var(--font-display)',
                fontSize: '20px',
                color: 'var(--fg)',
              }}
            >
              {c.ini}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <b style={{ fontSize: '15px', color: 'var(--fg)' }}>{c.nome}</b>
                <span
                  style={{
                    fontSize: '11px',
                    fontFamily: 'ui-monospace, monospace',
                    color: 'var(--muted)',
                    background: 'var(--surface-2)',
                    padding: '2px 6px',
                    borderRadius: '6px',
                  }}
                >
                  {c.cat}
                </span>
              </div>
              <div style={{ color: 'var(--muted)', fontSize: '14px', marginTop: '2px' }}>{c.desc}</div>
              <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: '11px', color: 'var(--muted)', marginTop: '4px' }}>
                {c.members}
              </div>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                aoAlternarParticipacao(c.slug);
              }}
              style={{
                height: '36px',
                padding: '0 18px',
                borderRadius: '999px',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '14px',
                border: j ? '1px solid var(--border-strong)' : '0',
                background: j ? 'transparent' : 'var(--fg)',
                color: j ? 'var(--fg)' : 'var(--bg)',
                flex: 'none',
              }}
            >
              {j ? 'Dentro' : 'Entrar'}
            </button>
          </div>
        );
      })}
    </div>
  );
};
