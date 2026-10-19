import type { ResultadoDoEnvio } from './useEnvioDeResposta';
import React, { useState } from 'react';
import type { CausoPostado } from '../../../portas/comunidade';
import { CardDeCauso } from './CardDeCauso';

export interface ComunidadeInfo {
  slug: string;
  nome: string;
  ini: string;
  cat: string;
  desc: string;
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
  aoResponderCauso: (id: string, texto: string, respostaAId?: string) => ResultadoDoEnvio;
  aoAbrirConversaCauso?: (id: string) => void | Promise<void>;
  aoDenunciarCauso: (id: string) => void;
  aoAbrirPerfil?: (handle: string, nome?: string) => void;
}

const REGRAS_PADRAO: Record<string, string[]> = {
  'bonde-do-arroto': [
    'Todo arroto vale nota.',
    'Zoeira com o arroto, nunca com a pessoa.',
    'Post sem áudio só se for resenha de respeito.',
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
    'Resenhas reais de vergonha em público.',
    'Não vale inventar história de primo.',
    'Se tiver testemunha, marca o @.',
  ],
  'churrasco-raiz': [
    'Pós-picanha e linguiça.',
    'Respeita quem tá na churrasqueira.',
    'O mestre do churrasco julga primeiro.',
  ],
};

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
  aoAbrirConversaCauso,
  aoDenunciarCauso,
  aoAbrirPerfil,
}) => {
  const [dtab, setDtab] = useState<'posts' | 'sobre'>('posts');
  const [draft, setDraft] = useState('');
  const [enviando, setEnviando] = useState(false);

  const regras = REGRAS_PADRAO[comunidade.slug] || [
    'Respeite o gás e a nota do juiz.',
    'Zoeira sem ofensa pessoal.',
    'Arroto de verdade é sagrado.',
  ];

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
          <div style={{ color: 'var(--muted)', fontSize: '13px' }}>{comunidade.cat}</div>
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
              {comunidade.ano > 0 ? `${comunidade.cat} · criada em ${comunidade.ano}` : comunidade.cat}
            </div>
          </div>
          <button
            type="button"
            onClick={aoAlternarParticipacao}
            aria-pressed={estaDentro}
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

        {/* Botão Oficial Telegram */}
        <a
          href="https://t.me/+KQjRJFCibjliYzRh"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            marginTop: '8px',
            height: '44px',
            borderRadius: '999px',
            background: 'var(--accent, #c6ff00)',
            color: 'var(--accent-on, #000)',
            fontWeight: 800,
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            textDecoration: 'none',
            gap: '8px',
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.75-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.15.27-.01.06.01.24 0 .37z" />
          </svg>
          Entrar no grupo do Telegram
        </a>
      </div>

      {/* Abas Internas: Posts | Sobre */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)' }}>
        {[
          { id: 'posts' as const, label: 'Posts' },
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
                aoAbrirConversa={aoAbrirConversaCauso}
                aoDenunciar={aoDenunciarCauso}
                aoAbrirPerfil={aoAbrirPerfil}
              />
            ))
          ) : (
            <div style={{ padding: '48px 32px', textAlign: 'center' }}>
              <div style={{ fontWeight: 800, fontSize: '24px', color: 'var(--fg)' }}>
                Nenhuma resenha nesta comunidade ainda
              </div>
              <div style={{ color: 'var(--muted)', fontSize: '15px', marginTop: '8px' }}>
                Seja o primeiro a arrotar ou soltar a resenha aqui!
              </div>
            </div>
          )}
        </div>
      )}

      {/* ABA 2: SOBRE */}
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
