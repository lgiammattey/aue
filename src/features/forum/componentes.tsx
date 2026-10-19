import { useEffect, useRef, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import {
  metaDeComunidade,
  metaDeTopico,
  monograma,
  horarioCompleto,
  tempoRelativo,
  urlDeImagemSegura,
} from '../../nucleo/forum/apresentacao';
import type { ComunidadeDoForum } from '../../portas/forum';
import { enderecoDaComunidade, enderecoDoTopico } from './enderecos';
import { IconeFechado, IconeFixado } from './Icones';
import { useAnunciar } from './encaixes';


// ---------------------------------------------------------------------------
// Carregando, vazio, erro
// ---------------------------------------------------------------------------

/**
 * Esqueleto parado (sem brilho). O container é `aria-busy`; as formas são
 * `aria-hidden`; quem fala é a região de status da casca.
 */
export function Esqueleto({ forma, anuncio }: { readonly forma: 'lista' | 'cabecalho' | 'topico'; readonly anuncio: string }) {
  const anunciar = useAnunciar();
  useEffect(() => {
    anunciar(anuncio);
  }, [anunciar, anuncio]);

  if (forma === 'cabecalho') {
    return (
      <div className="forum-esqueleto forum-esqueleto--cabecalho" aria-busy="true">
        <div className="forum-esqueleto__forma" aria-hidden="true">
          <span className="forum-esqueleto__quadrado" />
          <span className="forum-esqueleto__barra" style={{ width: '55%' }} />
          <span className="forum-esqueleto__barra" style={{ width: '80%' }} />
        </div>
      </div>
    );
  }
  if (forma === 'topico') {
    return (
      <div className="forum-esqueleto forum-esqueleto--topico" aria-busy="true">
        <div className="forum-esqueleto__forma" aria-hidden="true">
          <span className="forum-esqueleto__barra forum-esqueleto__barra--titulo" style={{ width: '90%' }} />
          <span className="forum-esqueleto__barra forum-esqueleto__barra--titulo" style={{ width: '60%' }} />
          <span className="forum-esqueleto__barra" style={{ width: '40%' }} />
          {[100, 95, 90, 70].map((l) => (
            <span key={l} className="forum-esqueleto__barra" style={{ width: `${l}%` }} />
          ))}
        </div>
      </div>
    );
  }
  return (
    <div className="forum-esqueleto" aria-busy="true">
      {[85, 70, 90, 75, 80, 70].map((l, i) => (
        <div key={i} className="forum-esqueleto__linha" aria-hidden="true">
          <span className="forum-esqueleto__barra forum-esqueleto__barra--titulo" style={{ width: `${l}%` }} />
          <span className="forum-esqueleto__barra" style={{ width: '40%' }} />
        </div>
      ))}
    </div>
  );
}

interface PropsDoMolde {
  readonly titulo: string;
  readonly linha?: string;
  readonly acao?: ReactNode;
  readonly alerta?: boolean;
  /** Estado que ocupa a tela inteira (comunidade que não existe, tópico indisponível). */
  readonly tela?: boolean;
}

/** Molde único de vazio, erro e "não achei": sem ilustração, sem cartão. */
export function EstadoDeMolde({ titulo, linha, acao, alerta, tela }: PropsDoMolde) {
  return (
    <div className={`forum-estado${tela ? ' forum-estado--tela' : ''}`} role={alerta ? 'alert' : undefined}>
      <h2 className="forum-estado__titulo">{titulo}</h2>
      {linha && <p className="forum-estado__linha">{linha}</p>}
      {acao}
    </div>
  );
}

/** Vazio de verdade: o servidor respondeu e não há nada. */
export function EstadoVazio(props: { readonly titulo: string; readonly linha?: string; readonly acao?: ReactNode }) {
  return <EstadoDeMolde {...props} />;
}

/**
 * Falha de leitura, com "Tentar de novo". Nunca se parece com o vazio. Sem rede, o
 * título diz isso (6.3).
 */
export function EstadoDeErro({
  titulo,
  offline,
  aoTentar,
  tela,
}: {
  readonly titulo: string;
  readonly offline: boolean;
  readonly aoTentar: () => void;
  readonly tela?: boolean;
}) {
  return (
    <EstadoDeMolde
      alerta
      tela={tela}
      titulo={offline ? 'Sem internet.' : titulo}
      linha={offline ? 'Confere a conexão e tenta de novo.' : 'Nada foi perdido. Tenta de novo.'}
      acao={
        <button type="button" className="forum-botao forum-botao--contorno" onClick={aoTentar}>
          Tentar de novo
        </button>
      }
    />
  );
}

export function BotaoComoLink({ para, children }: { readonly para: string; readonly children: ReactNode }) {
  return (
    <Link className="forum-botao forum-botao--contorno" to={para}>
      {children}
    </Link>
  );
}

// ---------------------------------------------------------------------------
// Identidade
// ---------------------------------------------------------------------------

export function Monograma({ nome, tamanho }: { readonly nome: string; readonly tamanho: 'mini' | 'lista' | 'cabecalho' }) {
  return (
    <span className={`forum-monograma forum-monograma--${tamanho}`} aria-hidden="true">
      {monograma(nome)}
    </span>
  );
}

/** Foto em círculo ou, sem foto, as duas primeiras letras. `alt` vazio: o nome vem ao lado. */
export function Avatar({ nome, url, pequeno }: { readonly nome: string; readonly url: string | null; readonly pequeno?: boolean }) {
  const segura = urlDeImagemSegura(url);
  const letras = Array.from(nome.replace(/^@/, '')).slice(0, 2).join('').toUpperCase() || '?';
  return (
    <span className={`forum-avatar${pequeno ? ' forum-avatar--pequeno' : ''}`} aria-hidden="true">
      {segura ? <img src={segura} alt="" loading="lazy" referrerPolicy="no-referrer" /> : letras}
    </span>
  );
}

export function Tempo({ iso, agora }: { readonly iso: string; readonly agora: number }) {
  const texto = tempoRelativo(iso, agora);
  if (!texto) return null;
  return (
    <time dateTime={iso} title={horarioCompleto(iso)}>
      {texto}
    </time>
  );
}

export function Marcadores({ fixado, fechado }: { readonly fixado: boolean; readonly fechado: boolean }) {
  if (!fixado && !fechado) return null;
  return (
    <>
      {fixado && (
        <span className="forum-marcador">
          <IconeFixado /> Fixado
        </span>
      )}
      {fixado && fechado && ' · '}
      {fechado && (
        <span className="forum-marcador">
          <IconeFechado /> Fechado
        </span>
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// Linhas
// ---------------------------------------------------------------------------

export interface DadosDaLinhaDeTopico {
  readonly id: string;
  readonly titulo: string;
  readonly fixado: boolean;
  readonly status: 'aberto' | 'fechado';
  readonly criadoEm: string;
  readonly ultimaAtividadeEm: string;
  readonly respostasTotal: number;
  readonly comunidade: { readonly slug: string; readonly nome: string };
  readonly autorNome: string;
}

/**
 * Uma linha de tópico: título (2 linhas no máximo) e meta. A linha toda é o
 * link do título; no Explorar a comunidade vem em cima, como link próprio.
 */
export function LinhaDeTopico({
  topico,
  comComunidade,
  focar,
  agora,
}: {
  readonly topico: DadosDaLinhaDeTopico;
  readonly comComunidade?: boolean;
  readonly focar?: boolean;
  readonly agora: number;
}) {
  const link = useRef<HTMLAnchorElement>(null);
  useEffect(() => {
    if (focar) link.current?.focus();
  }, [focar]);

  return (
    <li className={`forum-linha${comComunidade ? ' forum-linha--com-comunidade' : ''}`}>
      <h2 className="forum-linha__titulo">
        <Link ref={link} to={enderecoDoTopico(topico.comunidade.slug, topico.id)}>
          {topico.titulo}
        </Link>
      </h2>
      <p className="forum-linha__meta">
        <Marcadores fixado={topico.fixado} fechado={topico.status === 'fechado'} />
        {(topico.fixado || topico.status === 'fechado') && ' · '}
        {metaDeTopico(
          {
            autorNome: topico.autorNome,
            respostasTotal: topico.respostasTotal,
            criadoEm: topico.criadoEm,
            ultimaAtividadeEm: topico.ultimaAtividadeEm,
          },
          agora,
        )}
      </p>
      {comComunidade && (
        <p className="forum-linha__comunidade">
          <Link to={enderecoDaComunidade(topico.comunidade.slug)}>{topico.comunidade.nome}</Link>
        </p>
      )}
    </li>
  );
}

export function LinhaDeComunidade({ comunidade, agora }: { readonly comunidade: ComunidadeDoForum; readonly agora: number }) {
  return (
    <li className="forum-linha-comunidade">
      <Link className="forum-linha-comunidade__link" to={enderecoDaComunidade(comunidade.slug)}>
        <Monograma nome={comunidade.nome} tamanho="lista" />
        <div className="forum-linha-comunidade__texto">
          <h3 className="forum-linha-comunidade__nome">{comunidade.nome}</h3>
          {comunidade.descricao && <p className="forum-linha-comunidade__descricao">{comunidade.descricao}</p>}
          <p className="forum-linha-comunidade__meta">{metaDeComunidade(comunidade, agora)}</p>
        </div>
      </Link>
    </li>
  );
}

// ---------------------------------------------------------------------------
// Ordem e "Ver mais"
// ---------------------------------------------------------------------------

export function AlternarOrdem({
  ordem,
  aoMudar,
}: {
  readonly ordem: 'atividade' | 'recentes';
  readonly aoMudar: (nova: 'atividade' | 'recentes') => void;
}) {
  return (
    <div className="forum-ordem" role="group" aria-label="Ordem dos tópicos">
      <button type="button" aria-pressed={ordem === 'atividade'} onClick={() => aoMudar('atividade')}>
        Atividade recente
      </button>
      <button type="button" aria-pressed={ordem === 'recentes'} onClick={() => aoMudar('recentes')}>
        Novos
      </button>
    </div>
  );
}

export function BotaoVerMais({
  rotulo,
  carregando,
  falhou,
  aoClicar,
}: {
  readonly rotulo: string;
  readonly carregando: boolean;
  readonly falhou: boolean;
  readonly aoClicar: () => void;
}) {
  return (
    <div className="forum-ver-mais">
      <button
        type="button"
        className="forum-botao forum-botao--contorno forum-botao--cheio"
        onClick={aoClicar}
        disabled={carregando}
        aria-busy={carregando || undefined}
      >
        {carregando ? 'Carregando…' : falhou ? 'Não deu pra carregar mais. Tentar de novo' : rotulo}
      </button>
    </div>
  );
}
