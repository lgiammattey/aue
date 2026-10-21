/**
 * Cabeçalho e abas do perfil (`/perfil` e `/u/:handle`), no desenho do protótipo
 * `Bonde do Arroto.dc.html` (classes `pf-*`). Só apresenta: dado, estado e ação
 * chegam por props. Nenhuma API de navegador aqui.
 */
import { useRef, useState, type KeyboardEvent, type Ref } from 'react';
import { linkDaRede } from '../../nucleo/perfil/redesSociais';
import './PerfilDoUsuario.css';
import type { PerfilPublico } from '../../portas/perfil';

const TRACO = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' } as const;

/** Acima disso a bio ganha "ver mais" (a mesma medida do protótipo). */
const BIO_LONGA = 90;

const REDES = [
  ['instagram', 'Instagram'],
  ['tiktok', 'TikTok'],
  ['youtube', 'YouTube'],
  ['twitter', 'X'],
] as const;

function IconeDaRede({ rede }: { readonly rede: (typeof REDES)[number][0] }) {
  if (rede === 'instagram') {
    return (
      <svg width="22" height="22" viewBox="0 0 24 24" {...TRACO} aria-hidden="true" focusable="false">
        <rect x="3.5" y="3.5" width="17" height="17" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.2" cy="6.8" r=".6" />
      </svg>
    );
  }
  if (rede === 'tiktok') {
    return (
      <svg width="22" height="22" viewBox="0 0 24 24" {...TRACO} aria-hidden="true" focusable="false">
        <path d="M14 3v11a3.5 3.5 0 11-3.5-3.5M14 3c.4 2.4 2 4 4.5 4.2" />
      </svg>
    );
  }
  if (rede === 'youtube') {
    return (
      <svg width="22" height="22" viewBox="0 0 24 24" {...TRACO} aria-hidden="true" focusable="false">
        <rect x="2.5" y="5.5" width="19" height="13" rx="4" /><path d="M10 9.5v5l4.5-2.5z" />
      </svg>
    );
  }
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" {...TRACO} aria-hidden="true" focusable="false">
      <path d="M4 4l16 16M20 4L4 20" />
    </svg>
  );
}

interface CabecalhoProps {
  readonly perfil: PerfilPublico;
  readonly dono: boolean;
  readonly iniciais: string;
  readonly seguindo: boolean;
  readonly alternandoSeguir: boolean;
  readonly fotoEnviando: boolean;
  readonly capaEnviando: boolean;
  readonly refDoAvatar?: Ref<HTMLButtonElement>;
  readonly aoEditar: () => void;
  readonly aoSeguir: () => void;
  readonly aoCompartilhar: () => void;
  readonly aoAbrirFoto: () => void;
  readonly aoTrocarCapa: () => void;
  readonly aoRemoverCapa: () => void;
  readonly aoAbrirConexoes: (tipo: 'seguidores' | 'seguindo') => void;
}

export function CabecalhoDoPerfil({
  perfil, dono, iniciais, seguindo, alternandoSeguir, fotoEnviando, capaEnviando, refDoAvatar,
  aoEditar, aoSeguir, aoCompartilhar, aoAbrirFoto, aoTrocarCapa, aoRemoverCapa, aoAbrirConexoes,
}: CabecalhoProps) {
  const [bioAberta, setBioAberta] = useState(false);
  const bio = perfil.bio?.trim() ?? '';
  const bioLonga = bio.length > BIO_LONGA;
  const ano = new Date(perfil.criadoEm).getFullYear();
  const meta = [perfil.cidade?.trim(), Number.isFinite(ano) ? `na roda desde ${ano}` : ''].filter(Boolean).join(' · ');
  const redes = REDES.flatMap(([rede, nome]) => {
    const href = linkDaRede(rede, perfil[rede]);
    return href ? [{ rede, nome, href }] : [];
  });
  const avatar = perfil.avatarUrl
    ? { style: { backgroundImage: `url("${perfil.avatarUrl}")` }, conteudo: null }
    : { style: undefined, conteudo: iniciais };

  return (
    <article className="pf">
      {/* Capa: só de 700px para cima. No celular "Trocar capa" e "Remover" ficam no Editar perfil. */}
      <div
        className={`pf-cover${perfil.capaUrl ? ' pf-cover--photo' : ''}`}
        style={perfil.capaUrl ? { backgroundImage: `url("${perfil.capaUrl}")` } : undefined}
        aria-label={perfil.capaUrl ? `Capa de ${perfil.apelido}` : 'Capa neutra do perfil'}
      >
        {!perfil.capaUrl && <span aria-hidden="true">AUÊ!</span>}
        {dono && (
          <div className="pf-cover-acts">
            <button type="button" onClick={aoTrocarCapa} disabled={capaEnviando}>{capaEnviando ? 'Enviando…' : 'Trocar capa'}</button>
            {perfil.capaUrl && <button type="button" onClick={aoRemoverCapa} disabled={capaEnviando}>Remover capa</button>}
          </div>
        )}
      </div>

      <div className="pf-head">
        {dono ? (
          <button
            ref={refDoAvatar}
            type="button"
            className="pf-av pf-av--botao"
            style={avatar.style}
            aria-label="Trocar foto do perfil"
            aria-haspopup="dialog"
            disabled={fotoEnviando}
            onClick={aoAbrirFoto}
          >
            {avatar.conteudo}
          </button>
        ) : (
          <div className="pf-av" style={avatar.style} role="img" aria-label={`Foto de ${perfil.apelido}`}>
            {avatar.conteudo}
          </div>
        )}

        <div className="pf-id">
          <h1 className="pf-name" title={perfil.apelido}>{perfil.apelido}</h1>
          <p className="pf-handle">@{perfil.handle}</p>
        </div>

        <div className="pf-acts">
          {dono ? (
            <button type="button" className="pf-btn" onClick={aoEditar}>
              <svg width="16" height="16" viewBox="0 0 24 24" {...TRACO} aria-hidden="true" focusable="false">
                <path d="M4 20h4L19 9l-4-4L4 16zM13.5 6.5l4 4" />
              </svg>
              Editar perfil
            </button>
          ) : (
            <button type="button" className="pf-btn pf-btn--solid" onClick={aoSeguir} disabled={alternandoSeguir}>
              {alternandoSeguir ? 'Atualizando…' : seguindo ? 'Seguindo' : 'Seguir'}
            </button>
          )}
          <button type="button" className="pf-btn pf-btn--icon" aria-label="Compartilhar" onClick={aoCompartilhar}>
            <svg width="18" height="18" viewBox="0 0 24 24" {...TRACO} aria-hidden="true" focusable="false">
              <path d="M12 3v13M7 8l5-5 5 5M5 14v6h14v-6" />
            </svg>
          </button>
        </div>
      </div>

      {/* Campo vazio não ocupa espaço nem ganha texto de enchimento. */}
      {(bio || meta || redes.length > 0) && (
        <div className="pf-about">
          {bio && (
            <>
              <p id="profileBio" className={`pf-bio${bioAberta ? ' is-open' : ''}`}>{bio}</p>
              {bioLonga && (
                <button type="button" className="pf-more" aria-expanded={bioAberta} aria-controls="profileBio" onClick={() => setBioAberta((v) => !v)}>
                  {bioAberta ? 'ver menos' : 'ver mais'}
                </button>
              )}
            </>
          )}
          {meta && <p className="pf-meta">{meta}</p>}
          {redes.length > 0 && (
            <div className="pf-social" aria-label="Redes sociais">
              {redes.map(({ rede, nome, href }) => (
                <a key={rede} href={href} target="_blank" rel="noreferrer" aria-label={nome} title={nome}>
                  <IconeDaRede rede={rede} />
                </a>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="pf-stats">
        <div className="pf-stat"><b>{perfil.totalCausos}</b><span>Posts</span></div>
        <button type="button" className="pf-stat" aria-label={`Ver quem segue (${perfil.totalSeguidores})`} onClick={() => aoAbrirConexoes('seguidores')}>
          <b>{perfil.totalSeguidores}</b><span>Seguidores</span>
        </button>
        <button type="button" className="pf-stat" aria-label={`Ver quem é seguido (${perfil.totalSeguindo})`} onClick={() => aoAbrirConexoes('seguindo')}>
          <b>{perfil.totalSeguindo}</b><span>Seguindo</span>
        </button>
      </div>
    </article>
  );
}

export interface AbaDoPerfil {
  readonly id: string;
  readonly rotulo: string;
}

interface AbasProps {
  readonly abas: readonly AbaDoPerfil[];
  readonly ativa: string;
  readonly aoMudar: (id: string) => void;
}

const idDaAbaDoPerfil = (id: string) => `aba-perfil-${id}`;
const idDoPainelDoPerfil = (id: string) => `painel-perfil-${id}`;

/** Abas com setas, Home e End; só a ativa entra na ordem do Tab. Sem contador no rótulo. */
export function AbasDoPerfil({ abas, ativa, aoMudar }: AbasProps) {
  const botoes = useRef(new Map<string, HTMLButtonElement>());
  const aoTeclar = (e: KeyboardEvent<HTMLDivElement>) => {
    const atual = abas.findIndex((a) => a.id === ativa);
    let destino = -1;
    if (e.key === 'ArrowRight') destino = (atual + 1) % abas.length;
    else if (e.key === 'ArrowLeft') destino = (atual - 1 + abas.length) % abas.length;
    else if (e.key === 'Home') destino = 0;
    else if (e.key === 'End') destino = abas.length - 1;
    if (destino < 0) return;
    e.preventDefault();
    aoMudar(abas[destino].id);
    botoes.current.get(abas[destino].id)?.focus();
  };

  return (
    <div className="pf-tabs" role="tablist" aria-label="Abas do perfil" onKeyDown={aoTeclar}>
      {abas.map((aba) => (
        <button
          key={aba.id}
          ref={(botao) => {
            if (botao) botoes.current.set(aba.id, botao);
            else botoes.current.delete(aba.id);
          }}
          id={idDaAbaDoPerfil(aba.id)}
          type="button"
          role="tab"
          className="pf-tab"
          aria-selected={ativa === aba.id}
          aria-controls={idDoPainelDoPerfil(aba.id)}
          tabIndex={ativa === aba.id ? 0 : -1}
          onClick={() => aoMudar(aba.id)}
        >
          <span>{aba.rotulo}</span>
        </button>
      ))}
    </div>
  );
}
