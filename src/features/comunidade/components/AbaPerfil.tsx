import React, { useState } from 'react';
import type { PerfilUsuario } from '../../../nucleo/usuario/perfil';
import type { CausoPostado } from '../../../portas/comunidade';
import { CardDeCauso } from './CardDeCauso';

interface AbaPerfilProps {
  perfil: PerfilUsuario;
  ehMeuPerfil?: boolean;
  aoSalvarPerfil: (novo: PerfilUsuario) => void;
  meusCausos: readonly CausoPostado[];
  minhasComunidades: readonly string[];
  aoCurtirCauso: (id: string) => void;
  aoRepostarCauso: (id: string) => void;
  aoDuvidarCauso: (causo: CausoPostado) => void;
  aoCompartilharCauso: (causo: CausoPostado) => void;
  aoResponderCauso: (id: string, texto: string) => void;
  aoDenunciarCauso: (id: string) => void;
  aoVoltar?: () => void;
  aoChamarX1?: (perfil: PerfilUsuario) => void;
  aoAbrirPerfil?: (handle: string, nome?: string) => void;
}

export const AbaPerfil: React.FC<AbaPerfilProps> = ({
  perfil,
  ehMeuPerfil = true,
  aoSalvarPerfil,
  meusCausos,
  minhasComunidades,
  aoCurtirCauso,
  aoRepostarCauso,
  aoDuvidarCauso,
  aoCompartilharCauso,
  aoResponderCauso,
  aoDenunciarCauso,
  aoVoltar,
  aoChamarX1,
  aoAbrirPerfil,
}) => {
  const [editando, setEditando] = useState(false);
  const [edNome, setEdNome] = useState(perfil.nome);
  const [edHandle, setEdHandle] = useState(perfil.handle);
  const [edBio, setEdBio] = useState(perfil.bio || 'Arroto de respeito, sem moral.');
  const [edCidade, setEdCidade] = useState(perfil.cidade || 'Rio de Janeiro');
  const [ptab, setPtab] = useState<'posts' | 'audios' | 'curtidas'>('posts');
  // Seguir não existe no servidor (escopo atual): o botão fica desabilitado.
  const euSigo = false;

  const iniciais = (perfil.nome?.trim().split(/\s+/).length > 1
    ? (perfil.nome.trim().split(/\s+/)[0][0] + perfil.nome.trim().split(/\s+/)[1][0])
    : (perfil.nome?.slice(0, 2) || 'VC')
  ).toUpperCase();

  const handleSalvar = (e: React.FormEvent) => {
    e.preventDefault();
    aoSalvarPerfil({
      ...perfil,
      nome: edNome.trim() || 'Você',
      handle: edHandle.trim().toLowerCase().replace(/[^\w]/g, '') || 'voce_arrota',
      bio: edBio.trim(),
      cidade: edCidade.trim(),
    });
    setEditando(false);
  };

  const handleUploadFoto = (e: React.ChangeEvent<HTMLInputElement>, tipo: 'avatar' | 'banner') => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        aoSalvarPerfil({
          ...perfil,
          [tipo === 'avatar' ? 'avatarUrl' : 'bannerUrl']: reader.result,
        });
      }
    };
    reader.readAsDataURL(file);
  };

  // Melhor nota
  const notasComAudio = meusCausos.filter((p) => p.nota !== undefined).map((p) => p.nota as number);
  const melhorNota = notasComAudio.length > 0 ? Math.max(...notasComAudio) : (perfil.maiorScore || '—');

  // Filtragem por sub-aba
  const postsFiltrados = meusCausos.filter((p) => {
    if (ptab === 'curtidas') return p.curtidoPorMim;
    if (ptab === 'audios') return p.nota !== undefined || p.temAudio;
    return true;
  });

  const ptabs = [
    { id: 'posts' as const, label: 'Posts' },
    { id: 'audios' as const, label: 'Áudios' },
    { id: 'curtidas' as const, label: 'Curtidas' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {/* Botão Voltar se for perfil de terceiro ou tiver ação de voltar */}
      {aoVoltar && (
        <div
          style={{
            height: '48px',
            display: 'flex',
            alignItems: 'center',
            padding: '0 16px',
            borderBottom: '1px solid var(--border)',
            gap: '12px',
          }}
        >
          <button
            type="button"
            onClick={aoVoltar}
            aria-label="Voltar"
            style={{
              background: 'none',
              border: 0,
              color: 'var(--fg)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '15px',
              fontWeight: 600,
              padding: '6px 0',
            }}
          >
            ← Voltar
          </button>
          <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--fg)' }}>
            @{perfil.handle}
          </span>
        </div>
      )}

      {/* Capa de 160px */}
      {ehMeuPerfil ? (
        <label
          style={{
            position: 'relative',
            display: 'block',
            height: '160px',
            background: 'var(--surface-2)',
            overflow: 'hidden',
            cursor: 'pointer',
          }}
          title="Trocar capa"
        >
          {perfil.bannerUrl && (
            <img
              src={perfil.bannerUrl}
              alt="Capa"
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
            />
          )}
          <input
            type="file"
            accept="image/*"
            onChange={(e) => handleUploadFoto(e, 'banner')}
            style={{ display: 'none' }}
          />
        </label>
      ) : (
        <div
          style={{
            position: 'relative',
            display: 'block',
            height: '160px',
            background: 'var(--surface-2)',
            overflow: 'hidden',
          }}
        >
          {perfil.bannerUrl && (
            <img
              src={perfil.bannerUrl}
              alt="Capa"
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
            />
          )}
        </div>
      )}

      {/* Bloco de Perfil */}
      <div style={{ padding: '0 16px 16px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '-40px' }}>
          {/* Avatar 80x80 com margem negativa -40px e borda 4px */}
          {ehMeuPerfil ? (
            <label
              style={{
                width: '80px',
                height: '80px',
                flex: 'none',
                borderRadius: '50%',
                background: 'var(--surface)',
                border: '4px solid var(--bg)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: 'var(--font-display)',
                fontSize: '30px',
                position: 'relative',
                overflow: 'hidden',
                cursor: 'pointer',
                color: 'var(--fg)',
              }}
              title="Trocar foto"
            >
              {perfil.avatarUrl ? (
                <img
                  src={perfil.avatarUrl}
                  alt={perfil.nome}
                  style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                iniciais
              )}
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleUploadFoto(e, 'avatar')}
                style={{ display: 'none' }}
              />
            </label>
          ) : (
            <div
              style={{
                width: '80px',
                height: '80px',
                flex: 'none',
                borderRadius: '50%',
                background: 'var(--surface)',
                border: '4px solid var(--bg)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: 'var(--font-display)',
                fontSize: '30px',
                position: 'relative',
                overflow: 'hidden',
                color: 'var(--fg)',
              }}
            >
              {perfil.avatarUrl ? (
                <img
                  src={perfil.avatarUrl}
                  alt={perfil.nome}
                  style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                iniciais
              )}
            </div>
          )}

          {/* Botões de Ação do Cabeçalho */}
          {ehMeuPerfil ? (
            <button
              type="button"
              onClick={() => setEditando(!editando)}
              style={{
                height: '40px',
                borderRadius: '12px',
                border: '1px solid var(--border-strong)',
                background: 'transparent',
                color: 'var(--fg)',
                fontWeight: 600,
                fontSize: '14px',
                cursor: 'pointer',
                flex: 'none',
                padding: '0 20px',
              }}
            >
              {editando ? 'Cancelar' : 'Editar perfil'}
            </button>
          ) : (
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                disabled
                title="Seguir chega junto com as contas. Ainda não existe no servidor."
                style={{
                  height: '40px',
                  borderRadius: '12px',
                  border: euSigo ? '1px solid var(--border-strong)' : 0,
                  background: euSigo ? 'transparent' : 'var(--fg)',
                  color: euSigo ? 'var(--fg)' : 'var(--bg)',
                  fontWeight: 700,
                  fontSize: '14px',
                  cursor: 'not-allowed',
                  opacity: 0.5,
                  flex: 'none',
                  padding: '0 18px',
                }}
              >
                {euSigo ? 'Seguindo' : 'Seguir'}
              </button>
              {aoChamarX1 && (
                <button
                  type="button"
                  onClick={() => aoChamarX1(perfil)}
                  style={{
                    height: '40px',
                    borderRadius: '12px',
                    border: 0,
                    background: 'var(--accent)',
                    color: 'var(--accent-on)',
                    fontWeight: 700,
                    fontSize: '14px',
                    cursor: 'pointer',
                    flex: 'none',
                    padding: '0 16px',
                  }}
                >
                  Chamar pro X1
                </button>
              )}
            </div>
          )}
        </div>

        {/* Modal/Form inline de edição de perfil se ativo */}
        {editando ? (
          <form onSubmit={handleSalvar} style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '13px', color: 'var(--muted)' }}>
              Nome
              <input
                value={edNome}
                onChange={(e) => setEdNome(e.target.value)}
                maxLength={30}
                style={{
                  height: '44px',
                  borderRadius: '12px',
                  border: '1px solid var(--border-strong)',
                  background: 'var(--bg)',
                  color: 'var(--fg)',
                  padding: '0 14px',
                  fontSize: '15px',
                  fontFamily: 'inherit',
                  outline: 'none',
                }}
              />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '13px', color: 'var(--muted)' }}>
              @usuário
              <input
                value={edHandle}
                onChange={(e) => setEdHandle(e.target.value)}
                maxLength={20}
                style={{
                  height: '44px',
                  borderRadius: '12px',
                  border: '1px solid var(--border-strong)',
                  background: 'var(--bg)',
                  color: 'var(--fg)',
                  padding: '0 14px',
                  fontSize: '15px',
                  fontFamily: 'inherit',
                  outline: 'none',
                }}
              />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '13px', color: 'var(--muted)' }}>
              Cidade
              <input
                value={edCidade}
                onChange={(e) => setEdCidade(e.target.value)}
                maxLength={30}
                style={{
                  height: '44px',
                  borderRadius: '12px',
                  border: '1px solid var(--border-strong)',
                  background: 'var(--bg)',
                  color: 'var(--fg)',
                  padding: '0 14px',
                  fontSize: '15px',
                  fontFamily: 'inherit',
                  outline: 'none',
                }}
              />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '13px', color: 'var(--muted)' }}>
              Bio
              <textarea
                value={edBio}
                onChange={(e) => setEdBio(e.target.value)}
                maxLength={120}
                rows={3}
                style={{
                  borderRadius: '12px',
                  border: '1px solid var(--border-strong)',
                  background: 'var(--bg)',
                  color: 'var(--fg)',
                  padding: '12px 14px',
                  fontSize: '15px',
                  fontFamily: 'inherit',
                  outline: 'none',
                  resize: 'none',
                }}
              />
            </label>
            <button
              type="submit"
              style={{
                height: '48px',
                border: 0,
                borderRadius: '18px',
                background: 'var(--accent)',
                color: 'var(--accent-on)',
                fontWeight: 700,
                fontSize: '16px',
                cursor: 'pointer',
              }}
            >
              Salvar
            </button>
          </form>
        ) : (
          <div style={{ marginTop: '8px' }}>
            <b style={{ fontSize: '20px', color: 'var(--fg)' }}>{perfil.nome}</b>
            <div style={{ color: 'var(--muted)', fontSize: '15px' }}>@{perfil.handle}</div>
            <div style={{ fontSize: '15px', marginTop: '8px', textWrap: 'pretty', color: 'var(--fg)' }}>
              {perfil.bio || 'Arroto de respeito, sem moral.'}
            </div>
            <div style={{ color: 'var(--muted)', fontSize: '14px', marginTop: '4px' }}>
              {perfil.cidade || 'Rio de Janeiro'} · no bonde desde 2026
            </div>
          </div>
        )}

        {/* Linha Canônica: Melhor Nota, Cartel X1, Comunidades */}
        <div style={{ display: 'flex', gap: '20px', marginTop: '8px', fontSize: '14px' }}>
          <span>
            <b>{melhorNota}</b> <span style={{ color: 'var(--muted)' }}>melhor nota</span>
          </span>
          <span>
            <b>{perfil.vitoriasX1}V · {perfil.derrotasX1}D</b> <span style={{ color: 'var(--muted)' }}>no X1</span>
          </span>
          <span>
            <b>{minhasComunidades.length}</b> <span style={{ color: 'var(--muted)' }}>comunidades</span>
          </span>
        </div>
      </div>

      {/* Abas Internas do Perfil */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)' }}>
        {ptabs.map((pt) => {
          const ativo = ptab === pt.id;
          return (
            <button
              key={pt.id}
              type="button"
              onClick={() => setPtab(pt.id)}
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
                {pt.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Conteúdo da aba selecionada usando CardDeCauso completo */}
      {postsFiltrados.length > 0 ? (
        postsFiltrados.map((p) => (
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
        <div style={{ padding: '40px 32px', textAlign: 'center' }}>
          <div style={{ fontWeight: 800, fontSize: '28px', lineHeight: 1.1, color: 'var(--fg)' }}>
            Nada por aqui ainda
          </div>
          <div style={{ color: 'var(--muted)', fontSize: '15px', marginTop: '8px' }}>
            Quando rolar, aparece aqui.
          </div>
        </div>
      )}
    </div>
  );
};
