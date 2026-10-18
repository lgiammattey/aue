import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { criarComunidadeWeb } from '../../plataforma/web/comunidade';
import { criarContaWeb } from '../../plataforma/web/conta';
import { criarPerfilRemoto } from '../../plataforma/web/perfilRemoto';
import type { CausoPostado, PortaDeComunidade } from '../../portas/comunidade';
import type { EstadoDaConta, PortaDeConta } from '../../portas/conta';
import type { DadosDoPerfil, PerfilPublico, PortaDePerfil } from '../../portas/perfil';
import { CardDeCauso } from '../comunidade/components/CardDeCauso';

interface TelaPerfilProps {
  /** Sem handle, mostra o perfil de quem está jogando. */
  handle?: string;
  portaPerfil?: PortaDePerfil;
  portaComunidade?: PortaDeComunidade;
  portaConta?: PortaDeConta;
  aoVoltar: () => void;
  aoArrotar: () => void;
  aoAbrirHistoria: (id: string) => void;
  aoAbrirPerfil: (handle: string) => void;
  aoEntrar: (modo: 'cadastro' | 'entrar') => void;
}

type Aba = 'causos' | 'audios' | 'curtidos';

const MENSAGENS_DE_EDICAO = {
  handleEmUso: 'Esse @ já é de outra pessoa. Escolhe outro.',
  semConta: 'Entra no jogo primeiro.',
  semRede: 'Não deu para salvar agora. Nada mudou.',
} as const;

export const TelaPerfil: React.FC<TelaPerfilProps> = ({
  handle,
  portaPerfil,
  portaComunidade,
  portaConta,
  aoVoltar,
  aoArrotar,
  aoAbrirHistoria,
  aoAbrirPerfil,
  aoEntrar,
}) => {
  const [perfilPort] = useState<PortaDePerfil>(() => portaPerfil ?? criarPerfilRemoto());
  const [comunidade] = useState<PortaDeComunidade>(() => portaComunidade ?? criarComunidadeWeb());
  const [contaPort] = useState<PortaDeConta>(() => portaConta ?? criarContaWeb());

  const [perfil, setPerfil] = useState<PerfilPublico | null>(null);
  const [conta, setConta] = useState<EstadoDaConta | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [aba, setAba] = useState<Aba>('causos');
  const [causos, setCausos] = useState<readonly CausoPostado[]>([]);
  const [carregandoCausos, setCarregandoCausos] = useState(false);
  const [aviso, setAviso] = useState('');
  const [editando, setEditando] = useState(false);
  const [form, setForm] = useState<Required<DadosDoPerfil>>({ apelido: '', handle: '', bio: '', cidade: '' });
  const [erroDoForm, setErroDoForm] = useState('');
  const [salvando, setSalvando] = useState(false);

  const avisar = useCallback((msg: string) => {
    setAviso(msg);
    setTimeout(() => setAviso((atual) => (atual === msg ? '' : atual)), 2400);
  }, []);

  useEffect(() => {
    let ativo = true;
    setCarregando(true);
    (async () => {
      const [p, c] = await Promise.all([
        handle ? perfilPort.obterPerfil(handle) : perfilPort.obterMeuPerfil(),
        contaPort.estado(),
      ]);
      if (!ativo) return;
      setPerfil(p);
      setConta(c);
      setCarregando(false);
    })();
    return () => {
      ativo = false;
    };
  }, [handle, perfilPort, contaPort]);

  useEffect(() => {
    if (!perfil) return;
    let ativo = true;
    setCarregandoCausos(true);
    comunidade
      .listarFeed({
        limite: 50,
        ...(aba === 'curtidos' ? { curtidosPor: perfil.id } : { autorId: perfil.id }),
      })
      .then((lista) => {
        if (!ativo) return;
        setCausos(aba === 'audios' ? lista.filter((c) => c.temAudio) : lista);
        setCarregandoCausos(false);
      });
    return () => {
      ativo = false;
    };
  }, [perfil, aba, comunidade]);

  const abas = useMemo(
    () =>
      [
        { id: 'causos' as const, rotulo: 'Causos' },
        { id: 'audios' as const, rotulo: 'Com áudio' },
        ...(perfil?.souEu ? [{ id: 'curtidos' as const, rotulo: 'Curtidos' }] : []),
      ],
    [perfil?.souEu],
  );

  const seguir = async () => {
    if (!perfil) return;
    const res = await perfilPort.alternarSeguir(perfil.id);
    if (!res.ok) {
      avisar('Não deu para seguir agora.');
      return;
    }
    setPerfil({
      ...perfil,
      euSigo: res.seguindo,
      totalSeguidores: Math.max(0, perfil.totalSeguidores + (res.seguindo ? 1 : -1)),
    });
  };

  const abrirEdicao = () => {
    if (!perfil) return;
    setForm({
      apelido: perfil.apelido,
      handle: perfil.handle,
      bio: perfil.bio ?? '',
      cidade: perfil.cidade ?? '',
    });
    setErroDoForm('');
    setEditando(true);
  };

  const salvar = async (e: React.FormEvent) => {
    e.preventDefault();
    setSalvando(true);
    setErroDoForm('');
    const res = await perfilPort.atualizarMeuPerfil(form);
    setSalvando(false);
    if (res.ok) {
      setPerfil(res.perfil);
      setEditando(false);
      avisar('Perfil salvo.');
      if (res.perfil.handle !== handle && handle) aoAbrirPerfil(res.perfil.handle);
      return;
    }
    setErroDoForm(res.motivo === 'invalido' ? res.detalhe : MENSAGENS_DE_EDICAO[res.motivo]);
  };

  const sair = async () => {
    const ok = await contaPort.sair();
    if (ok) aoEntrar('entrar');
    else avisar('Não deu para sair agora.');
  };

  // Ações do card: tudo passa pela porta, e falha vira aviso.
  const atualizar = (id: string, mudanca: Partial<CausoPostado>) =>
    setCausos((prev) => prev.map((c) => (c.id === id ? { ...c, ...mudanca } : c)));

  const curtir = async (id: string) => {
    const r = await comunidade.alternarCurtida(id);
    if (r.ok) atualizar(id, { curtidas: r.curtidas, curtidoPorMim: r.curtido });
    else avisar('Não deu para curtir agora.');
  };
  const repostar = async (id: string) => {
    const r = await comunidade.alternarRepost(id);
    if (r.ok) atualizar(id, { reposts: r.reposts, repostadoPorMim: r.repostado });
    else avisar('Não deu para repostar agora.');
  };
  const abrirConversa = async (id: string) => {
    const lista = await comunidade.listarRespostas(id);
    atualizar(id, { comentarios: lista });
  };
  const responder = async (id: string, texto: string, respostaAId?: string) => {
    const causo = causos.find((c) => c.id === id);
    const nova = await comunidade.adicionarResposta(id, texto, perfil?.apelido ?? 'Você', perfil?.handle, respostaAId);
    if (!nova) {
      avisar('Não deu para enviar a resposta.');
      return;
    }
    atualizar(id, {
      comentarios: [...(causo?.comentarios ?? []), nova],
      totalComentarios: (causo?.totalComentarios ?? 0) + 1,
    });
  };
  const apagar = async (causo: CausoPostado) => {
    const comAudio = Boolean(causo.temAudio);
    if (!window.confirm(comAudio ? 'Apagar este causo e o áudio do arroto? Não tem como desfazer.' : 'Apagar este causo? Não tem como desfazer.')) return;
    const ok = await comunidade.apagarCauso(causo.id, { apagarAudio: comAudio });
    if (!ok) {
      avisar('Não deu para apagar agora. Nada foi apagado.');
      return;
    }
    setCausos((prev) => prev.filter((c) => c.id !== causo.id));
    setPerfil((p) => (p ? { ...p, totalCausos: Math.max(0, p.totalCausos - 1) } : p));
    avisar('Causo apagado.');
  };
  const denunciar = async (id: string) => {
    const ok = await comunidade.denunciarCauso(id, 'Denúncia de usuário');
    if (!ok) {
      avisar('Não deu para registrar a denúncia.');
      return;
    }
    setCausos((prev) => prev.filter((c) => c.id !== id));
    avisar('Denúncia registrada.');
  };

  const inicial = (perfil?.apelido ?? 'A').slice(0, 2).toUpperCase();
  const desde = perfil ? new Date(perfil.criadoEm).getFullYear() : undefined;

  const campo: React.CSSProperties = {
    width: '100%',
    boxSizing: 'border-box',
    minHeight: '44px',
    padding: '0 12px',
    borderRadius: '12px',
    border: '1px solid var(--border-strong)',
    background: 'var(--bg)',
    color: 'var(--fg)',
    fontSize: '16px',
    fontFamily: 'inherit',
  };
  const botaoSecundario: React.CSSProperties = {
    minHeight: '44px',
    padding: '0 18px',
    borderRadius: '12px',
    border: '1px solid var(--border-strong)',
    background: 'transparent',
    color: 'var(--fg)',
    fontWeight: 700,
    fontSize: '14px',
    cursor: 'pointer',
  };

  return (
    <div style={{ minHeight: '100svh', background: 'var(--bg)', color: 'var(--fg)', display: 'flex', justifyContent: 'center' }}>
      <main
        style={{
          width: '100%',
          maxWidth: '600px',
          borderLeft: '1px solid var(--border)',
          borderRight: '1px solid var(--border)',
          paddingBottom: 'max(40px, env(safe-area-inset-bottom))',
        }}
      >
        <header
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 5,
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '8px 16px',
            paddingTop: 'max(8px, env(safe-area-inset-top))',
            background: 'var(--bg)',
            borderBottom: '1px solid var(--border)',
          }}
        >
          <button type="button" onClick={aoVoltar} aria-label="Voltar" style={{ ...botaoSecundario, border: 0, padding: 0, width: '44px' }}>
            ←
          </button>
          <b style={{ fontSize: '18px' }}>{perfil ? `@${perfil.handle}` : 'Perfil'}</b>
        </header>

        {aviso && (
          <div role="status" style={{ padding: '10px 16px', background: 'var(--surface)', borderBottom: '1px solid var(--border)', fontSize: '14px' }}>
            {aviso}
          </div>
        )}

        {carregando && <p style={{ padding: 24, color: 'var(--muted)' }}>Carregando perfil…</p>}

        {!carregando && !perfil && (
          <div style={{ padding: 24, display: 'grid', gap: 12 }}>
            <b style={{ fontSize: 18 }}>{handle ? 'Esse arrotador não existe.' : 'Seu perfil não abriu.'}</b>
            <span style={{ color: 'var(--muted)' }}>
              {handle
                ? 'O @ pode ter mudado. Procura pelo causo no Bonde.'
                : 'Precisa de conexão com o servidor. Tenta de novo daqui a pouco.'}
            </span>
            <button type="button" onClick={aoArrotar} style={botaoSecundario}>
              Ir arrotar
            </button>
          </div>
        )}

        {perfil && (
          <>
            <section style={{ padding: '16px', display: 'grid', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                <div
                  aria-hidden="true"
                  style={{
                    width: 72,
                    height: 72,
                    borderRadius: '50%',
                    background: 'var(--surface-2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: 'var(--font-display)',
                    fontSize: 28,
                  }}
                >
                  {inicial}
                </div>
                {perfil.souEu ? (
                  <button type="button" onClick={editando ? () => setEditando(false) : abrirEdicao} style={botaoSecundario}>
                    {editando ? 'Cancelar' : 'Editar perfil'}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={seguir}
                    style={{
                      ...botaoSecundario,
                      background: perfil.euSigo ? 'transparent' : 'var(--fg)',
                      color: perfil.euSigo ? 'var(--fg)' : 'var(--bg)',
                    }}
                  >
                    {perfil.euSigo ? 'Seguindo' : 'Seguir'}
                  </button>
                )}
              </div>

              <div>
                <div style={{ fontSize: 22, fontWeight: 800 }}>{perfil.apelido}</div>
                <div style={{ color: 'var(--muted)' }}>@{perfil.handle}</div>
                {perfil.titulo && <div style={{ color: 'var(--muted)', fontSize: 13, marginTop: 2 }}>{perfil.titulo}</div>}
              </div>

              {perfil.bio && <p style={{ margin: 0, lineHeight: 1.4 }}>{perfil.bio}</p>}
              <div style={{ color: 'var(--muted)', fontSize: 14 }}>
                {[perfil.cidade, desde ? `no bonde desde ${desde}` : null].filter(Boolean).join(' · ')}
              </div>

              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 14 }}>
                <span><b>{perfil.totalCausos}</b> <span style={{ color: 'var(--muted)' }}>causos</span></span>
                <span><b>{perfil.melhorNota ?? '—'}</b> <span style={{ color: 'var(--muted)' }}>melhor nota publicada</span></span>
                <span><b>{perfil.totalSeguidores}</b> <span style={{ color: 'var(--muted)' }}>seguidores</span></span>
                <span><b>{perfil.totalSeguindo}</b> <span style={{ color: 'var(--muted)' }}>seguindo</span></span>
              </div>

              {perfil.souEu && editando && (
                <form onSubmit={salvar} style={{ display: 'grid', gap: 10, padding: 12, border: '1px solid var(--border)', borderRadius: 16 }}>
                  <label style={{ display: 'grid', gap: 4, fontSize: 13, color: 'var(--muted)' }}>
                    Apelido
                    <input style={campo} value={form.apelido} maxLength={30} onChange={(e) => setForm({ ...form, apelido: e.target.value })} />
                  </label>
                  <label style={{ display: 'grid', gap: 4, fontSize: 13, color: 'var(--muted)' }}>
                    @ (3 a 20: letras minúsculas, números e _)
                    <input style={campo} value={form.handle} maxLength={20} autoCapitalize="none" onChange={(e) => setForm({ ...form, handle: e.target.value })} />
                  </label>
                  <label style={{ display: 'grid', gap: 4, fontSize: 13, color: 'var(--muted)' }}>
                    Bio ({160 - form.bio.length})
                    <textarea style={{ ...campo, minHeight: 80, padding: 12 }} value={form.bio} maxLength={160} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
                  </label>
                  <label style={{ display: 'grid', gap: 4, fontSize: 13, color: 'var(--muted)' }}>
                    Cidade
                    <input style={campo} value={form.cidade} maxLength={60} onChange={(e) => setForm({ ...form, cidade: e.target.value })} />
                  </label>
                  {erroDoForm && <span role="alert" style={{ color: 'var(--danger, #ff4d4f)', fontSize: 14 }}>{erroDoForm}</span>}
                  <button
                    type="submit"
                    disabled={salvando}
                    style={{ minHeight: 44, border: 0, borderRadius: 12, background: 'var(--accent)', color: 'var(--accent-on)', fontWeight: 700, cursor: 'pointer' }}
                  >
                    {salvando ? 'Salvando…' : 'Salvar'}
                  </button>
                </form>
              )}

              {perfil.souEu && conta && (
                <div style={{ display: 'grid', gap: 8, padding: 12, border: '1px solid var(--border)', borderRadius: 16 }}>
                  {conta.anonima || !conta.temSessao ? (
                    <>
                      <b>Sua conta é anônima</b>
                      <span style={{ color: 'var(--muted)', fontSize: 14 }}>
                        Ela existe só neste navegador. Se você limpar os dados, perde seus causos. Cadastre e-mail e
                        senha para guardar tudo.
                      </span>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <button type="button" style={botaoSecundario} onClick={() => aoEntrar('cadastro')}>
                          Criar conta
                        </button>
                        <button type="button" style={botaoSecundario} onClick={() => aoEntrar('entrar')}>
                          Já tenho conta
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <b>Conta</b>
                      <span style={{ color: 'var(--muted)', fontSize: 14 }}>{conta.email}</span>
                      <div>
                        <button type="button" style={botaoSecundario} onClick={sair}>
                          Sair
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </section>

            <nav role="tablist" style={{ display: 'flex', borderBottom: '1px solid var(--border)' }}>
              {abas.map((a) => (
                <button
                  key={a.id}
                  role="tab"
                  aria-selected={aba === a.id}
                  type="button"
                  onClick={() => setAba(a.id)}
                  style={{
                    flex: 1,
                    minHeight: 48,
                    border: 0,
                    background: 'none',
                    color: aba === a.id ? 'var(--fg)' : 'var(--muted)',
                    fontWeight: aba === a.id ? 700 : 500,
                    fontSize: 15,
                    cursor: 'pointer',
                  }}
                >
                  {a.rotulo}
                </button>
              ))}
            </nav>

            {carregandoCausos && <p style={{ padding: 24, color: 'var(--muted)' }}>Carregando…</p>}
            {!carregandoCausos && causos.length === 0 && (
              <p style={{ padding: 24, color: 'var(--muted)' }}>
                {aba === 'curtidos' ? 'Nada curtido ainda.' : perfil.souEu ? 'Você ainda não postou nenhum causo.' : 'Sem causos por aqui ainda.'}
              </p>
            )}
            {causos.map((c) => (
              <CardDeCauso
                key={c.id}
                causo={c}
                aoCurtir={curtir}
                aoRepostar={repostar}
                aoDuvidar={aoArrotar}
                aoCompartilhar={(item) => aoAbrirHistoria(item.id)}
                aoResponder={responder}
                aoAbrirConversa={abrirConversa}
                aoDenunciar={denunciar}
                aoApagar={apagar}
                aoAbrirPerfil={(h) => aoAbrirPerfil(h)}
                aoAbrirHistoria={aoAbrirHistoria}
              />
            ))}
          </>
        )}
      </main>
    </div>
  );
};
