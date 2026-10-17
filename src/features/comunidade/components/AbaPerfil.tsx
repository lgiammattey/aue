import React, { useState } from 'react';
import type { PerfilUsuario } from '../../../nucleo/usuario/perfil';
import type { CausoPostado } from '../../../portas/comunidade';
import { CardDeCauso } from './CardDeCauso';

interface AbaPerfilProps {
  perfil: PerfilUsuario;
  aoSalvarPerfil: (novo: PerfilUsuario) => void;
  meusCausos: readonly CausoPostado[];
  minhasComunidades: readonly string[];
  aoCurtirCauso: (id: string) => void;
  aoRepostarCauso: (id: string) => void;
  aoDuvidarCauso: (causo: CausoPostado) => void;
  aoCompartilharCauso: (causo: CausoPostado) => void;
  aoResponderCauso: (id: string, texto: string) => void;
  aoDenunciarCauso: (id: string) => void;
}

export const AbaPerfil: React.FC<AbaPerfilProps> = ({
  perfil,
  aoSalvarPerfil,
  meusCausos,
  minhasComunidades,
  aoCurtirCauso,
  aoRepostarCauso,
  aoDuvidarCauso,
  aoCompartilharCauso,
  aoResponderCauso,
  aoDenunciarCauso,
}) => {
  const [editando, setEditando] = useState(false);
  const [nome, setNome] = useState(perfil.nome);
  const [handle, setHandle] = useState(perfil.handle);
  const [bio, setBio] = useState(perfil.bio);
  const [abaInterna, setAbaInterna] = useState<'causos' | 'comunidades'>('causos');

  const salvarEdicao = (e: React.FormEvent) => {
    e.preventDefault();
    aoSalvarPerfil({
      ...perfil,
      nome: nome.trim() || 'Você',
      handle: handle.trim().toLowerCase().replace(/[^a-z0-9_]/g, '') || 'voce_arrota',
      bio: bio.trim(),
    });
    setEditando(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {/* Banner / Header do Perfil */}
      <div
        style={{
          padding: '24px 16px',
          borderBottom: '1px solid var(--border)',
          background: 'var(--surface)',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Avatar Grande */}
          <div
            style={{
              width: '72px',
              height: '72px',
              borderRadius: '50%',
              background: 'var(--surface-2)',
              border: '3px solid var(--accent)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '24px',
              color: 'var(--fg)',
              overflow: 'hidden',
            }}
          >
            {perfil.avatarUrl ? (
              <img src={perfil.avatarUrl} alt={perfil.nome} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              perfil.nome.slice(0, 2).toUpperCase()
            )}
          </div>

          <button
            type="button"
            onClick={() => setEditando(!editando)}
            style={{
              padding: '8px 18px',
              borderRadius: '999px',
              border: '1px solid var(--border)',
              background: 'transparent',
              color: 'var(--fg)',
              fontWeight: 700,
              fontSize: '13px',
              cursor: 'pointer',
            }}
          >
            {editando ? 'Cancelar' : 'Editar perfil'}
          </button>
        </div>

        {/* Formulário de Edição */}
        {editando ? (
          <form onSubmit={salvarEdicao} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div>
              <label style={{ fontSize: '12px', color: 'var(--muted)', display: 'block', marginBottom: '4px' }}>Nome</label>
              <input
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                style={{
                  width: '100%',
                  height: '38px',
                  borderRadius: '8px',
                  border: '1px solid var(--border)',
                  background: 'var(--bg)',
                  color: 'var(--fg)',
                  padding: '0 12px',
                  boxSizing: 'border-box',
                }}
              />
            </div>
            <div>
              <label style={{ fontSize: '12px', color: 'var(--muted)', display: 'block', marginBottom: '4px' }}>@handle</label>
              <input
                type="text"
                value={handle}
                onChange={(e) => setHandle(e.target.value)}
                style={{
                  width: '100%',
                  height: '38px',
                  borderRadius: '8px',
                  border: '1px solid var(--border)',
                  background: 'var(--bg)',
                  color: 'var(--fg)',
                  padding: '0 12px',
                  boxSizing: 'border-box',
                }}
              />
            </div>
            <div>
              <label style={{ fontSize: '12px', color: 'var(--muted)', display: 'block', marginBottom: '4px' }}>Bio</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={2}
                style={{
                  width: '100%',
                  borderRadius: '8px',
                  border: '1px solid var(--border)',
                  background: 'var(--bg)',
                  color: 'var(--fg)',
                  padding: '8px 12px',
                  boxSizing: 'border-box',
                  resize: 'none',
                }}
              />
            </div>
            <button
              type="submit"
              style={{
                height: '40px',
                borderRadius: '999px',
                background: 'var(--accent)',
                color: 'var(--accent-on)',
                border: 'none',
                fontWeight: 800,
                fontSize: '14px',
                cursor: 'pointer',
                marginTop: '6px',
              }}
            >
              Salvar Alterações
            </button>
          </form>
        ) : (
          <div>
            <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 800, color: 'var(--fg)' }}>{perfil.nome}</h2>
            <div style={{ color: 'var(--muted)', fontSize: '14px', marginTop: '2px' }}>@{perfil.handle}</div>
            <p style={{ margin: '8px 0 0', fontSize: '14px', lineHeight: 1.4, color: 'var(--fg)' }}>{perfil.bio}</p>
          </div>
        )}

        {/* Estatísticas de Arrotador */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '12px',
            marginTop: '4px',
          }}
        >
          <div
            style={{
              padding: '12px',
              borderRadius: '12px',
              background: 'var(--surface-2)',
              border: '1px solid var(--border)',
            }}
          >
            <div style={{ color: 'var(--muted)', fontSize: '12px', fontWeight: 600 }}>MAIOR AUÊ SCORE</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '32px', color: 'var(--accent)', marginTop: '2px' }}>
              {perfil.maiorScore || '—'}
            </div>
          </div>
          <div
            style={{
              padding: '12px',
              borderRadius: '12px',
              background: 'var(--surface-2)',
              border: '1px solid var(--border)',
            }}
          >
            <div style={{ color: 'var(--muted)', fontSize: '12px', fontWeight: 600 }}>CARTEL NO X1</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '32px', color: 'var(--fg)', marginTop: '2px' }}>
              {`${perfil.vitoriasX1}V · ${perfil.derrotasX1}D`}
            </div>
          </div>
        </div>
      </div>

      {/* Sub-abas do Perfil */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)' }}>
        <button
          type="button"
          onClick={() => setAbaInterna('causos')}
          style={{
            flex: 1,
            height: '44px',
            border: 'none',
            background: 'transparent',
            color: abaInterna === 'causos' ? 'var(--fg)' : 'var(--muted)',
            fontWeight: abaInterna === 'causos' ? 700 : 500,
            fontSize: '14px',
            cursor: 'pointer',
            borderBottom: abaInterna === 'causos' ? '2px solid var(--accent)' : 'none',
          }}
        >
          Seus Causos ({meusCausos.length})
        </button>
        <button
          type="button"
          onClick={() => setAbaInterna('comunidades')}
          style={{
            flex: 1,
            height: '44px',
            border: 'none',
            background: 'transparent',
            color: abaInterna === 'comunidades' ? 'var(--fg)' : 'var(--muted)',
            fontWeight: abaInterna === 'comunidades' ? 700 : 500,
            fontSize: '14px',
            cursor: 'pointer',
            borderBottom: abaInterna === 'comunidades' ? '2px solid var(--accent)' : 'none',
          }}
        >
          Comunidades ({minhasComunidades.length})
        </button>
      </div>

      {/* Conteúdo da Sub-aba */}
      <div>
        {abaInterna === 'causos' ? (
          meusCausos.length > 0 ? (
            meusCausos.map((c) => (
              <CardDeCauso
                key={c.id}
                causo={c}
                aoCurtir={aoCurtirCauso}
                aoRepostar={aoRepostarCauso}
                aoDuvidar={aoDuvidarCauso}
                aoCompartilhar={aoCompartilharCauso}
                aoResponder={aoResponderCauso}
                aoDenunciar={aoDenunciarCauso}
              />
            ))
          ) : (
            <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--muted)' }}>
              Você ainda não postou nenhum causo. Arrote na Arena e mande pro bonde!
            </div>
          )
        ) : (
          <div style={{ padding: '16px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {minhasComunidades.map((slug) => (
              <span
                key={slug}
                style={{
                  padding: '6px 14px',
                  borderRadius: '999px',
                  background: 'var(--surface-2)',
                  color: 'var(--fg)',
                  fontSize: '13px',
                  fontWeight: 600,
                  border: '1px solid var(--border)',
                }}
              >
                #{slug}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
