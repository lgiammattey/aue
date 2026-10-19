import React, { useState } from 'react';
import type { CausoPostado, Comunidade } from '../../../portas/comunidade';
import { DetalheComunidade, type ComunidadeInfo } from './DetalheComunidade';
import { SecaoDeGrupos } from '../../grupos/SecaoDeGrupos';

interface AbaComunidadesProps {
  comunidades: readonly Comunidade[];
  /** A lista de comunidades ainda está vindo do servidor. */
  carregando?: boolean;
  minhasComunidades: readonly string[];
  aoAlternarParticipacao: (slug: string) => void;
  aoFiltrarPorComunidade: (slug: string) => void;
  comunidadeAtivaSlug?: string | null;
  causos?: readonly CausoPostado[];
  aoPostarCauso?: (comunidadeSlug: string, texto: string) => Promise<boolean>;
  aoCurtirCauso?: (id: string) => void;
  /** Repassado ao detalhe legado; o card não oferece repost enquanto não houver distribuição real. */
  aoRepostarCauso?: (id: string) => void;
  aoDuvidarCauso?: (causo: CausoPostado) => void;
  aoCompartilharCauso?: (causo: CausoPostado) => void;
  aoResponderCauso?: (id: string, texto: string, respostaAId?: string) => void;
  aoAbrirConversaCauso?: (id: string) => void | Promise<void>;
  aoDenunciarCauso?: (id: string) => void;
  aoAbrirPerfil?: (handle: string, nome?: string) => void;
}

const COMUNIDADE_RAIZ: ComunidadeInfo = {
  slug: 'eu-arroto-e-dai',
  nome: 'Eu Arroto, e Daí?',
  ini: 'EA',
  cat: 'Oficial',
  desc: 'A histórica comunidade mãe dos arrotadores. Orgulho do estrago e zero pudor social.',
  ano: 2004,
};

/** Dados de exibição de uma comunidade da lista. Só a oficial tem ano e categoria próprios. */
function infoDaComunidade(c: Comunidade): ComunidadeInfo {
  if (c.slug.toLowerCase() === COMUNIDADE_RAIZ.slug) return COMUNIDADE_RAIZ;
  return {
    slug: c.slug,
    nome: c.nome,
    ini: c.nome.slice(0, 2).toUpperCase(),
    cat: 'Comunidade',
    desc: c.descricao,
    ano: 0,
  };
}

const TELEGRAM_GRUPO_URL = 'https://t.me/+KQjRJFCibjliYzRh';

export const AbaComunidades: React.FC<AbaComunidadesProps> = ({
  comunidades,
  carregando = false,
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
  aoAbrirConversaCauso,
  aoDenunciarCauso = () => {},
  aoAbrirPerfil: _aoAbrirPerfil,
}) => {
  const [slugSelecionado, setSlugSelecionado] = useState<string | null>(comunidadeAtivaSlug ?? null);

  // A comunidade vem da lista real, por slug exato. Slug desconhecido NÃO cai na oficial.
  const comuDaLista = slugSelecionado
    ? comunidades.find((c) => c.slug.toLowerCase() === slugSelecionado.toLowerCase())
    : undefined;
  const comuAtiva: ComunidadeInfo | null = comuDaLista ? infoDaComunidade(comuDaLista) : null;

  if (slugSelecionado && !comuAtiva) {
    return (
      <div role="status" style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--muted)' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '28px', color: 'var(--fg)', marginBottom: '8px' }}>
          {carregando ? 'Carregando a comunidade…' : 'Comunidade não encontrada'}
        </div>
        {!carregando && <div style={{ marginBottom: '16px' }}>Esse endereço não leva a nenhuma comunidade do Auê.</div>}
        <button
          type="button"
          onClick={() => setSlugSelecionado(null)}
          style={{ minHeight: '44px', padding: '0 20px', borderRadius: '999px', border: '1px solid var(--border-strong)', background: 'transparent', color: 'var(--fg)', fontWeight: 600, cursor: 'pointer' }}
        >
          Ver comunidades
        </button>
      </div>
    );
  }

  if (comuAtiva) {
    const estaDentro =
      minhasComunidades.includes(comuAtiva.slug) || minhasComunidades.includes(comuAtiva.nome);
    // Só o que pertence a ESTA comunidade, pelo slug que o servidor mandou.
    const causosDestaComu = causos.filter(
      (p) => p.comunidadeSlug?.toLowerCase() === comuAtiva.slug.toLowerCase(),
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
          return await aoPostarCauso(comuAtiva.slug, texto);
        }}
        aoCurtirCauso={aoCurtirCauso}
        aoRepostarCauso={aoRepostarCauso}
        aoDuvidarCauso={aoDuvidarCauso}
        aoCompartilharCauso={aoCompartilharCauso}
        aoResponderCauso={aoResponderCauso}
        aoAbrirConversaCauso={aoAbrirConversaCauso}
        aoDenunciarCauso={aoDenunciarCauso}
      />
    );
  }

  const c = COMUNIDADE_RAIZ;
  const estaDentro = minhasComunidades.includes(c.slug) || minhasComunidades.includes(c.nome);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '16px' }}>
      {/* Banner de Destaque Oficial Telegram */}
      <div
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: '20px',
          padding: '24px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '16px',
              background: 'var(--surface-2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '32px',
              flex: 'none',
            }}
          >
            🦍
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <b style={{ fontSize: '20px', color: 'var(--fg)' }}>{c.nome}</b>
              <span
                style={{
                  fontSize: '11px',
                  fontFamily: 'ui-monospace, monospace',
                  color: 'var(--muted)',
                  background: 'var(--surface-2)',
                  padding: '2px 8px',
                  borderRadius: '6px',
                  textTransform: 'uppercase',
                }}
              >
                {c.cat}
              </span>
            </div>
            <div style={{ color: 'var(--muted)', fontSize: '13px', marginTop: '2px' }}>
              Desde 2004 no Orkut, agora no Telegram
            </div>
          </div>
        </div>

        <p style={{ margin: 0, fontSize: '15px', lineHeight: 1.5, color: 'var(--fg)' }}>
          {c.desc} Este é o ponto de encontro único dos maiores arrotadores da internet. Entre no grupo oficial do Telegram para trocar resenhas, mandar áudios e participar dos campeonatos.
        </p>

        {/* Botão Oficial do Grupo Telegram */}
        <a
          href={TELEGRAM_GRUPO_URL}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            height: '48px',
            borderRadius: '999px',
            background: 'var(--accent, #c6ff00)',
            color: 'var(--accent-on, #000)',
            fontWeight: 800,
            fontSize: '15px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            textDecoration: 'none',
            gap: '10px',
            boxShadow: '0 4px 12px rgba(198, 255, 0, 0.25)',
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.75-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.15.27-.01.06.01.24 0 .37z" />
          </svg>
          Entrar no grupo do Telegram
        </a>

        {/* Botão de Ver Causos da Comunidade */}
        <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
          <button
            type="button"
            onClick={() => setSlugSelecionado(c.slug)}
            style={{
              flex: 1,
              height: '40px',
              borderRadius: '999px',
              border: '1px solid var(--border-strong)',
              background: 'transparent',
              color: 'var(--fg)',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Ver resenhas no mural
          </button>
          <button
            type="button"
            onClick={() => aoAlternarParticipacao(c.slug)}
            aria-pressed={estaDentro}
            style={{
              height: '40px',
              padding: '0 20px',
              borderRadius: '999px',
              border: estaDentro ? '1px solid var(--border-strong)' : '0',
              background: estaDentro ? 'transparent' : 'var(--fg)',
              color: estaDentro ? 'var(--fg)' : 'var(--bg)',
              fontSize: '14px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            {estaDentro ? 'Dentro' : 'Participar'}
          </button>
        </div>
      </div>

      <SecaoDeGrupos />
    </div>
  );
};
