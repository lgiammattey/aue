import React, { useState } from 'react';
import type { CausoPostado } from '../../../portas/comunidade';
import { CardDeCauso } from './CardDeCauso';

export interface ComunidadeInfo {
  slug: string;
  nome: string;
  ini: string;
  cat: string;
  desc: string;
  members: string;
  ano: number;
}

interface DetalheComunidadeProps {
  comunidade: ComunidadeInfo;
  estaDentro: boolean;
  aoAlternarParticipacao: () => void;
  aoVoltar: () => void;
  causosDaComunidade: readonly CausoPostado[];
  aoPostarCauso: (texto: string) => Promise<boolean>;
  aoCurtirCauso: (id: string) => void;
  aoRepostarCauso: (id: string) => void;
  aoDuvidarCauso: (causo: CausoPostado) => void;
  aoCompartilharCauso: (causo: CausoPostado) => void;
  aoResponderCauso: (id: string, texto: string) => void;
  aoDenunciarCauso: (id: string) => void;
  aoAbrirPerfil?: (handle: string, nome?: string) => void;
}

const REGRAS_PADRAO: Record<string, string[]> = {
  'bonde-do-arroto': [
    'Todo arroto vale nota.',
    'Zoeira com o arroto, nunca com a pessoa.',
    'Post sem áudio só se for causo de respeito.',
  ],
  'cerveja-gelada': [
    'Long neck, lata ou chope — declara a origem.',
    'Não vale arroto forçado com ar da boca.',
    'O juiz de IA não perdoa áudio mudo.',
  ],
  'refri-e-cia': [
    'Dois litros sem respirar vale dobrado.',
    'Grave vale mais que fôlego.',
    'Não vale cuspir refrigerante.',
  ],
  'historias-de-arroto': [
    'Causos reais de vergonha em público.',
    'Não vale inventar história de primo.',
    'Se tiver testemunha, marca o @.',
  ],
  'churrasco-raiz': [
    'Pós-picanha e linguiça.',
    'Respeita quem tá na churrasqueira.',
    'O mestre do churrasco julga primeiro.',
  ],
};

const RANKING_SEMENTE = [
  { pos: 1, name: 'Iury da Oficina', handle: 'iury_oficina', ini: 'IO', nota: 98 },
  { pos: 2, name: 'Tiago do Bonde', handle: 'tiagobonde', ini: 'TB', nota: 96 },
  { pos: 3, name: 'Dani Gás', handle: 'danigas', ini: 'DG', nota: 94 },
  { pos: 4, name: 'Tio Beto', handle: 'tiobeto', ini: 'TB', nota: 91 },
  { pos: 5, name: 'Rian da Bolha', handle: 'rian_design', ini: 'RD', nota: 89 },
];

export const DetalheComunidade: React.FC<DetalheComunidadeProps> = ({
  comunidade,
  estaDentro,
  aoAlternarParticipacao,
  aoVoltar,
  causosDaComunidade,
  aoPostarCauso,
  aoCurtirCauso,
  aoRepostarCauso,
  aoDuvidarCauso,
  aoCompartilharCauso,
  aoResponderCauso,
  aoDenunciarCauso,
  aoAbrirPerfil,
}) => {
  const [dtab, setDtab] = useState<'posts' | 'ranking' | 'sobre'>('posts');
  const [draft, setDraft] = useState('');
  const [enviando, setEnviando] = useState(false);

  const regras = REGRAS_PADRAO[comunidade.slug] || [
    'Respeite o gás e a nota do juiz.',
    'Zoeira sem ofensa pessoal.',
    'Arroto de verdade é sagrado.',
  ];

  // Mescla ranking de causos reais com semente
  const causosComNota = causosDaComunidade
    .filter((c) => typeof c.nota === 'number')
    .sort((a, b) => ((b.nota as number) || 0) - ((a.nota as number) || 0));

  const rankingLista = causosComNota.length > 0
    ? causosComNota.map((c, idx) => ({
        pos: idx + 1,
        name: c.autorNome,
        handle: c.autorHandle || c.autorNome.toLowerCase().replace(/\s+/g, '_'),
        ini: c.autorNome.slice(0, 2).toUpperCase(),
        nota: c.nota as number,
      }))
    : RANKING_SEMENTE;

  const handleEnviarPost = async () => {
    if (!draft.trim() || enviando) return;
    setEnviando(true);
    const ok = await aoPostarCauso(draft.trim());
    if (ok) {
      setDraft('');
    }
    setEnviando(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {/* Header Sticky com Voltar e contagem */}
      <div
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 5,
          background: 'var(--bg)',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          padding: '0 16px',
          height: '53px',
        }}
      >
        <button
          type="button"
          onClick={aoVoltar}
          aria-label="Voltar"
          style={{
            width: '36px',
            height: '36px',
            marginLeft: '-8px',
            borderRadius: '50%',
            border: 0,
            background: 'none',
            color: 'var(--fg)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>
        <div style={{ lineHeight: 1.2 }}>
          <div style={{ fontWeight: 700, fontSize: '18px', color: 'var(--fg)' }}>{comunidade.nome}</div>
          <div style={{ color: 'var(--muted)', fontSize: '13px' }}>{comunidade.members}</div>
        </div>
      </div>

      {/* Capa de 140px com iniciais gigantes Anton */}
      <div
        style={{
          height: '140px',
          background: 'var(--surface-2)',
          display: 'flex',
          alignItems: 'flex-end',
          padding: '16px',
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '64px',
            lineHeight: 1,
            color: 'var(--muted)',
            userSelect: 'none',
          }}
        >
          {comunidade.ini}
        </span>
      </div>

      {/* Resumo da Comunidade */}
      <div style={{ padding: '16px', borderBottom: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
          <div>
            <b style={{ fontSize: '22px', color: 'var(--fg)' }}>{comunidade.nome}</b>
            <div style={{ color: 'var(--muted)', fontSize: '14px', marginTop: '2px' }}>
              {comunidade.cat} · {comunidade.members} · criada em {comunidade.ano}
            </div>
          </div>
          <button
            type="button"
            onClick={aoAlternarParticipacao}
            style={{
              height: '36px',
              padding: '0 20px',
              borderRadius: '999px',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '14px',
              border: estaDentro ? '1px solid var(--border-strong)' : '0',
              background: estaDentro ? 'transparent' : 'var(--fg)',
              color: estaDentro ? 'var(--fg)' : 'var(--bg)',
              flex: 'none',
            }}
          >
            {estaDentro ? 'Dentro' : 'Entrar'}
          </button>
        </div>
        <p style={{ margin: 0, fontSize: '15px', lineHeight: 1.4, textWrap: 'pretty', color: 'var(--fg)' }}>
          {comunidade.desc}
        </p>
      </div>

      {/* Abas Internas: Posts | Ranking | Sobre */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)' }}>
        {[
          { id: 'posts' as const, label: 'Posts' },
          { id: 'ranking' as const, label: 'Ranking' },
          { id: 'sobre' as const, label: 'Sobre' },
        ].map((tab) => {
          const ativo = dtab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setDtab(tab.id)}
              style={{
                flex: 1,
                height: '52px',
                border: 0,
                background: 'none',
                color: ativo ? 'var(--fg)' : 'var(--muted)',
                fontWeight: ativo ? 700 : 500,
                fontSize: '15px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <span
                style={{
                  height: '52px',
                  display: 'flex',
                  alignItems: 'center',
                  borderBottom: ativo ? '4px solid var(--ind)' : '4px solid transparent',
                  boxSizing: 'border-box',
                }}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* ABA 1: POSTS */}
      {dtab === 'posts' && (
        <div>
          {estaDentro && (
            <div style={{ display: 'flex', gap: '12px', padding: '16px', borderBottom: '1px solid var(--border)' }}>
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  flex: 'none',
                  borderRadius: '50%',
                  background: 'var(--surface-2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '14px',
                  color: 'var(--fg)',
                }}
              >
                VC
              </div>
              <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder={`Postar em ${comunidade.nome}`}
                  rows={2}
                  style={{
                    background: 'none',
                    border: 0,
                    outline: 'none',
                    resize: 'none',
                    color: 'var(--fg)',
                    fontFamily: 'inherit',
                    fontSize: '17px',
                    padding: '8px 0',
                  }}
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--border)', paddingTop: '10px' }}>
                  <button
                    type="button"
                    onClick={handleEnviarPost}
                    disabled={enviando || !draft.trim()}
                    style={{
                      height: '36px',
                      padding: '0 20px',
                      border: 0,
                      borderRadius: '999px',
                      background: 'var(--accent)',
                      color: 'var(--accent-on)',
                      fontWeight: 700,
                      fontSize: '15px',
                      cursor: draft.trim() ? 'pointer' : 'not-allowed',
                      opacity: draft.trim() ? 1 : 0.6,
                    }}
                  >
                    Postar
                  </button>
                </div>
              </div>
            </div>
          )}

          {causosDaComunidade.length > 0 ? (
            causosDaComunidade.map((p) => (
              <CardDeCauso
                key={p.id}
                causo={p}
                aoCurtir={aoCurtirCauso}
                aoRepostar={aoRepostarCauso}
                aoDuvidar={aoDuvidarCauso}
                aoCompartilhar={aoCompartilharCauso}
                aoResponder={aoResponderCauso}
                aoDenunciar={aoDenunciarCauso}
                aoAbrirPerfil={aoAbrirPerfil}
              />
            ))
          ) : (
            <div style={{ padding: '48px 32px', textAlign: 'center' }}>
              <div style={{ fontWeight: 800, fontSize: '24px', color: 'var(--fg)' }}>
                Nenhum causo nesta comunidade ainda
              </div>
              <div style={{ color: 'var(--muted)', fontSize: '15px', marginTop: '8px' }}>
                Seja o primeiro a arrotar ou contar história aqui!
              </div>
            </div>
          )}
        </div>
      )}

      {/* ABA 2: RANKING */}
      {dtab === 'ranking' && (
        <div>
          {rankingLista.map((r) => (
            <div
              key={r.handle + r.pos}
              style={{
                padding: '14px 16px',
                borderBottom: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
              }}
            >
              <span
                style={{
                  width: '24px',
                  fontFamily: 'ui-monospace, monospace',
                  fontSize: '14px',
                  fontWeight: 700,
                  color: r.pos <= 3 ? 'var(--accent)' : 'var(--muted)',
                }}
              >
                {r.pos}º
              </span>
              <div
                onClick={() => aoAbrirPerfil?.(r.handle, r.name)}
                style={{
                  width: '40px',
                  height: '40px',
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
                title={`Ver perfil de @${r.handle}`}
              >
                {r.ini}
              </div>
              <div
                onClick={() => aoAbrirPerfil?.(r.handle, r.name)}
                style={{ flex: 1, lineHeight: 1.3, cursor: aoAbrirPerfil ? 'pointer' : 'default' }}
              >
                <b style={{ fontSize: '15px', color: 'var(--fg)' }}>{r.name}</b>
                <div style={{ color: 'var(--muted)', fontSize: '14px' }}>@{r.handle}</div>
              </div>
              <span
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '28px',
                  color: 'var(--fg)',
                }}
              >
                {r.nota}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* ABA 3: SOBRE */}
      {dtab === 'sobre' && (
        <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <b style={{ fontSize: '20px', color: 'var(--fg)' }}>Regras da Comunidade</b>
            <ol style={{ margin: '8px 0 0', paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '15px', lineHeight: 1.4, color: 'var(--fg)' }}>
              {regras.map((regra, i) => (
                <li key={i}>{regra}</li>
              ))}
            </ol>
          </div>
          <div>
            <b style={{ fontSize: '20px', color: 'var(--fg)' }}>Moderação</b>
            <div style={{ color: 'var(--muted)', fontSize: '15px', marginTop: '6px' }}>
              @danigas e @marigrave · com apoio da squad Auê
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
