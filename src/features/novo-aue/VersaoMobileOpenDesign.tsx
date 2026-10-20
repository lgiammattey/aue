import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ADSTERRA_CONFIG, anunciosAdsterraHabilitados } from '../../plataforma/web/adsterra';
import { AdsterraNativeBanner } from './AdsterraNativeBanner';
import { criarComunidadeWeb } from '../../plataforma/web/comunidade';
import { criarContaWeb } from '../../plataforma/web/conta';
import { criarForumWeb } from '../../plataforma/web/forum';
import { criarPerfilRemoto } from '../../plataforma/web/perfilRemoto';
import type { CausoPostado, PortaDeComunidade } from '../../portas/comunidade';
import { CardDoPost } from './CardDoPost';
import type { ItemDoFeed } from './tipos';
import type { PortaDeConta } from '../../portas/conta';
import type { ComunidadeDoForum, PortaDeForum } from '../../portas/forum';
import type { PerfilPublico, PortaDePerfil } from '../../portas/perfil';
import './casca.css';

interface Props {
  readonly portaForum?: PortaDeForum;
  readonly portaComunidade?: PortaDeComunidade;
  readonly portaPerfil?: PortaDePerfil;
  readonly portaConta?: PortaDeConta;
  readonly aoEntrar?: () => void;
}

export function VersaoMobileOpenDesign({
  portaForum,
  portaComunidade,
  portaPerfil,
  portaConta,
  aoEntrar,
}: Props) {
  const navigate = useNavigate();
  const [forum] = useState(() => portaForum ?? criarForumWeb());
  const [comunidadePort] = useState(() => portaComunidade ?? criarComunidadeWeb());
  const [perfilPort] = useState(() => portaPerfil ?? criarPerfilRemoto());
  const [contaPort] = useState(() => portaConta ?? criarContaWeb());

  const [abaAtiva, setAbaAtiva] = useState<'home' | 'communities' | 'activity' | 'profile'>('home');
  const [filtroTipo, setFiltroTipo] = useState<'todos' | 'audio' | 'video' | 'causo'>('todos');
  const [estaAutenticado, setEstaAutenticado] = useState(false);
  const [perfil, setPerfil] = useState<PerfilPublico | null>(null);

  const [comunidades, setComunidades] = useState<readonly ComunidadeDoForum[]>([]);
  const [causos, setCausos] = useState<readonly CausoPostado[]>([]);
  const [comunidadesEntradas, setComunidadesEntradas] = useState<Record<string, boolean>>({});

  // Compositor Mobile Bottom Sheet
  const [compositorAberto, setCompositorAberto] = useState(false);
  const [tituloPost, setTituloPost] = useState('');
  const [textoPost, setTextoPost] = useState('');
  const [publicando, setPublicando] = useState(false);

  // Toast
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const exibirToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2500);
  };

  useEffect(() => {
    let ativo = true;
    contaPort.estado().then(async (e) => {
      if (!ativo) return;
      const logado = e.temSessao && !e.anonima && !e.perfilSocialPendente;
      setEstaAutenticado(logado);
      if (logado) {
        const meu = await perfilPort.obterMeuPerfil();
        if (ativo && meu) setPerfil(meu);
      }
    });

    Promise.all([
      forum.listarComunidadesDoForum(),
      comunidadePort.listarFeed({ limite: 30 }).catch(() => [] as readonly CausoPostado[]),
    ]).then(([resComunidades, listaCausos]) => {
      if (!ativo) return;
      if (resComunidades.ok) setComunidades(resComunidades.valor);
      setCausos(listaCausos);
    });

    return () => {
      ativo = false;
    };
  }, [contaPort, perfilPort, forum, comunidadePort]);

  const alternarEntrarComunidade = async (slug: string) => {
    if (!estaAutenticado) {
      exibirToast('Entre na sua conta para participar.');
      aoEntrar?.();
      return;
    }
    const jaEntrou = comunidadesEntradas[slug];
    setComunidadesEntradas((prev) => ({ ...prev, [slug]: !jaEntrou }));
    try {
      if (jaEntrou) {
        await comunidadePort.sairComunidade(slug);
        exibirToast(`Você saiu da comunidade.`);
      } else {
        await comunidadePort.entrarComunidade(slug);
        exibirToast(`Você entrou na comunidade!`);
      }
    } catch {
      // Reversão
    }
  };

  const interagirNoCauso = async (causoId: string, tipo: 'curtir' | 'fogo' | 'nojo' | 'trofeu') => {
    if (!estaAutenticado) {
      exibirToast('Entre na sua conta para reagir.');
      aoEntrar?.();
      return;
    }

    const resultado = tipo === 'curtir'
      ? await comunidadePort.alternarCurtida(causoId)
      : await comunidadePort.alternarReacao(causoId, tipo);

    exibirToast(resultado.ok
      ? (tipo === 'curtir' ? 'Curtida atualizada.' : 'Reação enviada.')
      : 'Não deu para registrar sua reação agora.');
  };

  const publicarCauso = async (e: FormEvent) => {
    e.preventDefault();
    if (!tituloPost.trim()) return;

    if (!estaAutenticado) {
      exibirToast('Você precisa entrar para publicar.');
      aoEntrar?.();
      return;
    }

    setPublicando(true);
    try {
      const res = await forum.criarTopico({
        comunidadeSlug: comunidades[0]?.slug ?? 'geral',
        titulo: tituloPost.trim(),
        corpo: textoPost.trim(),
      });
      if (res.ok) {
        exibirToast('Publicado. A roda já pode responder.');
        setCompositorAberto(false);
        setTituloPost('');
        setTextoPost('');
        setAbaAtiva('home');
      } else {
        exibirToast('Não foi possível publicar agora.');
      }
    } catch {
      exibirToast('Erro de conexão ao publicar.');
    } finally {
      setPublicando(false);
    }
  };

  const causosFiltrados = causos.filter((c) => {
    if (filtroTipo === 'audio') return Boolean(c.temAudio);
    if (filtroTipo === 'causo') return !c.temAudio;
    return true;
  });

  return (
    <div style={{ display: 'grid', placeItems: 'center', minHeight: '100vh', padding: '16px', background: '#0c0b0f' }}>
      <div className="phone-frame" data-phone-shell data-platform="iphone">
        <span className="hardware-button silent" aria-hidden="true" />
        <span className="hardware-button volume-up" aria-hidden="true" />
        <span className="hardware-button volume-down" aria-hidden="true" />
        <span className="hardware-button power" aria-hidden="true" />

        <section className="phone-screen" data-phone-screen>
          <main className="phone-content" data-phone-content>
            <div className="app od-screen">
              {/* Header */}
              <header className="app-header">
                <Link className="wordmark" to="/" aria-label="Voltar para a versão web do Auê">
                  AUÊ!
                </Link>
                <div className="header-actions">
                  <button
                    className="icon-button od-touch"
                    type="button"
                    aria-label="Abrir atividade"
                    onClick={() => setAbaAtiva('activity')}
                  >
                    ♢
                  </button>
                  <button
                    className="icon-button od-touch"
                    type="button"
                    aria-label="Buscar"
                    onClick={() => navigate('/explorar')}
                  >
                    ⌕
                  </button>
                </div>
              </header>

              {/* Miolo com Scroll */}
              <div className="od-scroll" id="appScroll">
                <div className="content">
                  {/* VIEW INÍCIO */}
                  {abaAtiva === 'home' && (
                    <section className="view active" id="homeView" aria-labelledby="homeTitle">
                      <span className="eyebrow">A roda de agora</span>
                      <h1 className="page-title" id="homeTitle">
                        O que arrotaram hoje?
                      </h1>
                      <p className="page-lead">Posts, áudios e vídeos da galera. Sem cerimônia.</p>

                      <div className="story">
                        <span className="eyebrow">Desafio em alta</span>
                        <h2>Quem solta o som mais longo da roda?</h2>
                        <p>O desafio já juntou respostas de todos os cantos.</p>
                        <button className="primary" type="button" onClick={() => setCompositorAberto(true)}>
                          Responder ao desafio
                        </button>
                      </div>

                      <div className="section-row">
                        <h2>Feed da roda</h2>
                        <button className="text-button" type="button" onClick={() => exibirToast('Feed atualizado.')}>
                          Atualizar
                        </button>
                      </div>

                      <div className="od-rail filter-rail" aria-label="Filtros do feed">
                        <button
                          className={`filter ${filtroTipo === 'todos' ? 'selected' : ''}`}
                          type="button"
                          onClick={() => setFiltroTipo('todos')}
                        >
                          Todos
                        </button>
                        <button
                          className={`filter ${filtroTipo === 'audio' ? 'selected' : ''}`}
                          type="button"
                          onClick={() => setFiltroTipo('audio')}
                        >
                          Áudios
                        </button>
                        <button
                          className={`filter ${filtroTipo === 'video' ? 'selected' : ''}`}
                          type="button"
                          onClick={() => setFiltroTipo('video')}
                        >
                          Vídeos
                        </button>
                        <button
                          className={`filter ${filtroTipo === 'causo' ? 'selected' : ''}`}
                          type="button"
                          onClick={() => setFiltroTipo('causo')}
                        >
                          Posts
                        </button>
                      </div>

                      <div className="feed" id="feed">
                        {causosFiltrados.length === 0 ? (
                          <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--muted)' }}>
                            <p>Sem posts por aqui ainda.</p>
                            <AdsterraNativeBanner />
                          </div>
                        ) : (
                          causosFiltrados.map((c, idx) => {
                            const exibirBannerAqui =
                              causosFiltrados.length >= 3
                                ? idx === 2
                                : idx === causosFiltrados.length - 1;

                            const itemDoFeed: ItemDoFeed = {
                              id: c.id,
                              tipo: 'causo',
                              comunidadeSlug: c.comunidadeSlug || 'arena',
                              titulo: c.conteudo,
                              corpo: '',
                              autorNome: c.autorNome,
                              autorHandle: c.autorHandle,
                              criadoEm: c.criadoEm,
                              votos: c.curtidas ?? 0,
                              respostasTotal: c.totalComentarios ?? 0,
                              temAudio: c.temAudio,
                              enderecoDoAudio: c.enderecoDoAudio,
                              nota: c.nota,
                            };

                            return (
                              <div key={c.id}>
                                <CardDoPost
                                  post={itemDoFeed}
                                  salvo={false}
                                  audioTocando={false}
                                  tempoAtualDoAudio={0}
                                  duracaoDoAudio={null}
                                  aoCurtir={() => void interagirNoCauso(c.id, 'curtir')}
                                  aoReagir={(tipo) => void interagirNoCauso(c.id, tipo)}
                                  aoAlternarSalvar={() => exibirToast('Post salvo nos seus favoritos.')}
                                  aoTocarAudio={() => exibirToast('Reproduzindo arroto…')}
                                  aoAbrirComentarios={() => exibirToast('Resenha do post.')}
                                />
                                {exibirBannerAqui && <AdsterraNativeBanner />}
                              </div>
                            );
                          })
                        )}
                      </div>
                    </section>
                  )}

                  {/* VIEW COMUNIDADES */}
                  {abaAtiva === 'communities' && (
                    <section className="view active" id="communitiesView" aria-labelledby="communitiesTitle">
                      <span className="eyebrow">Escolha sua roda</span>
                      <h1 className="page-title" id="communitiesTitle">
                        Comunidades
                      </h1>
                      <p className="page-lead">Entre nas rodas que combinam com o seu tipo de causo.</p>

                      <div className="community-list" id="communityList">
                        {comunidades.map((c) => {
                          const entrou = Boolean(comunidadesEntradas[c.slug]);
                          return (
                            <div
                              key={c.id}
                              className="community-row"
                              role="button"
                              tabIndex={0}
                              style={{ cursor: 'pointer' }}
                              onClick={() => navigate(`/c/${c.slug}`)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                  e.preventDefault();
                                  navigate(`/c/${c.slug}`);
                                }
                              }}
                            >
                              <span className="community-avatar">{c.nome.slice(0, 1).toUpperCase()}</span>
                              <span className="community-copy">
                                <strong>r/{c.slug}</strong>
                                <small className="od-truncate">{c.nome}</small>
                              </span>
                              <button
                                type="button"
                                className={`join-button ${entrou ? 'joined' : ''}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  void alternarEntrarComunidade(c.slug);
                                }}
                              >
                                {entrou ? 'Entrou' : 'Entrar'}
                              </button>
                            </div>
                          );
                        })}
                      </div>

                      {anunciosAdsterraHabilitados && <div
                        style={{
                          marginTop: 20,
                          padding: 14,
                          borderRadius: 12,
                          border: '1px solid var(--line)',
                          background: 'var(--card-bg, rgba(255, 255, 255, 0.02))',
                        }}
                      >
                        <span
                          style={{
                            fontSize: 11,
                            textTransform: 'uppercase',
                            color: 'var(--aue-accent, #c6ff00)',
                            fontWeight: 700,
                            letterSpacing: '0.05em',
                          }}
                        >
                          Parceiro Oficial
                        </span>
                        <h3 style={{ margin: '6px 0 4px', fontSize: 15 }}>Combustível pro Bonde 🍺</h3>
                        <p style={{ fontSize: 13, color: 'var(--muted)', margin: '0 0 10px' }}>
                          Ofertas parceiras pra manter a pressão em dia e apoiar o Auê!
                        </p>
                        <a
                          href={ADSTERRA_CONFIG.smartlinkUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="join-button"
                          style={{
                            display: 'block',
                            textDecoration: 'none',
                            textAlign: 'center',
                            width: '100%',
                            boxSizing: 'border-box',
                            padding: '10px 0',
                          }}
                        >
                          Conferir ofertas parceiras ↗
                        </a>
                      </div>}
                    </section>
                  )}

                  {/* VIEW ATIVIDADE */}
                  {abaAtiva === 'activity' && (
                    <section className="view active" id="activityView" aria-labelledby="activityTitle">
                      <span className="eyebrow">Sua vez de olhar</span>
                      <h1 className="page-title" id="activityTitle">
                        Atividade
                      </h1>
                      <p className="page-lead">Respostas, votos e novidades das suas comunidades.</p>
                      <div className="activity-list" id="activityList">
                        <article className="notice">
                          <span className="notice-icon">▲</span>
                          <div>
                            <p>Sua comunidade recebeu novos membros hoje.</p>
                            <small>há 10 min</small>
                          </div>
                        </article>
                      </div>
                    </section>
                  )}

                  {/* VIEW PERFIL */}
                  {abaAtiva === 'profile' && (
                    <section className="view active" id="profileView" aria-labelledby="profileTitle">
                      <span className="eyebrow">Você na roda</span>
                      <h1 className="page-title" id="profileTitle">
                        Meu perfil
                      </h1>
                      <div className="profile-card">
                        <div className="profile-cover" />
                        <div className="profile-main">
                          <div className="avatar" id="profileAvatar">
                            {perfil ? perfil.apelido.slice(0, 2).toUpperCase() : 'AU'}
                          </div>
                          <h2>{perfil?.apelido ?? 'Visitante'}</h2>
                          <p className="handle">@{perfil?.handle ?? 'anonimo'}</p>
                          <p className="bio">{perfil?.bio ?? 'Colecionador de causos e arrotos de respeito.'}</p>
                          <div className="od-grid stats">
                            <div className="od-stat">
                              <strong>{perfil?.totalCausos ?? 0}</strong>
                              <span>posts</span>
                            </div>
                            <div className="od-stat">
                              <strong>{perfil?.totalSeguidores ?? 0}</strong>
                              <span>seguidores</span>
                            </div>
                            <div className="od-stat">
                              <strong>{perfil?.totalSeguindo ?? 0}</strong>
                              <span>seguindo</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </section>
                  )}
                </div>
              </div>

              {/* Bottom Nav com 4 abas */}
              <nav className="bottom-nav" aria-label="Navegação principal">
                <button
                  className={`tab ${abaAtiva === 'home' ? 'active' : ''}`}
                  type="button"
                  onClick={() => setAbaAtiva('home')}
                >
                  <span className="tab-icon">⌂</span>Início
                </button>
                <button
                  className={`tab ${abaAtiva === 'communities' ? 'active' : ''}`}
                  type="button"
                  onClick={() => setAbaAtiva('communities')}
                >
                  <span className="tab-icon">◎</span>Rodas
                </button>
                <button
                  className="tab"
                  type="button"
                  data-compose
                  onClick={() => setCompositorAberto(true)}
                >
                  <span className="tab-icon">＋</span>Soltar
                </button>
                <button
                  className={`tab ${abaAtiva === 'profile' ? 'active' : ''}`}
                  type="button"
                  onClick={() => setAbaAtiva('profile')}
                >
                  <span className="tab-icon">◉</span>Perfil
                </button>
              </nav>

              {/* Scrim e Bottom Sheet do Compositor */}
              <div
                className={`scrim ${compositorAberto ? 'open' : ''}`}
                id="scrim"
                onClick={() => setCompositorAberto(false)}
              />
              <section
                className={`sheet ${compositorAberto ? 'open' : ''}`}
                id="composer"
                aria-labelledby="composerTitle"
                aria-hidden={!compositorAberto}
              >
                <div className="sheet-handle" />
                <div className="sheet-head">
                  <h2 id="composerTitle">Soltar um arroto</h2>
                  <button
                    className="close-button od-touch"
                    id="closeComposer"
                    type="button"
                    aria-label="Fechar compositor"
                    onClick={() => setCompositorAberto(false)}
                  >
                    ×
                  </button>
                </div>
                <form id="postForm" onSubmit={(e) => void publicarCauso(e)}>
                  <div className="field">
                    <label htmlFor="postTitleMobile">Título</label>
                    <input
                      id="postTitleMobile"
                      required
                      maxLength={80}
                      placeholder="Conta o que aconteceu"
                      value={tituloPost}
                      onChange={(e) => setTituloPost(e.target.value)}
                    />
                  </div>
                  <div className="field">
                    <label htmlFor="postTextMobile">Post</label>
                    <textarea
                      id="postTextMobile"
                      maxLength={280}
                      placeholder="O contexto deixa tudo melhor."
                      value={textoPost}
                      onChange={(e) => setTextoPost(e.target.value)}
                    />
                  </div>
                  <div className="od-row composer-options">
                    <button
                      className="composer-option"
                      type="button"
                      onClick={() => exibirToast('Áudio pode ser gravado diretamente na Arena.')}
                    >
                      Adicionar áudio
                    </button>
                    <button
                      className="composer-option"
                      type="button"
                      onClick={() => exibirToast('Vídeo disponível para quem tem conta pronta.')}
                    >
                      Adicionar vídeo
                    </button>
                  </div>
                  <button className="primary" type="submit" style={{ width: '100%' }} disabled={publicando}>
                    {publicando ? 'Publicando…' : 'Publicar na roda'}
                  </button>
                </form>
              </section>

              {/* Toast */}
              {toastMsg && (
                <div className="toast show" id="toast" role="status" aria-live="polite">
                  {toastMsg}
                </div>
              )}
            </div>
          </main>

          {/* Status bar & Dynamic island decorativos do protótipo */}
          <div className="status-bar" aria-hidden="true">
            <span>9:41</span>
          </div>
          <div className="dynamic-island" aria-hidden="true" />
          <div className="home-indicator" aria-hidden="true" />
        </section>
      </div>
    </div>
  );
}
