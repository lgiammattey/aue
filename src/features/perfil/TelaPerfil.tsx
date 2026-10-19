import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { criarComunidadeWeb } from '../../plataforma/web/comunidade';
import { criarCompartilhamentoWeb } from '../../plataforma/web/compartilhamento';
import { criarContaWeb } from '../../plataforma/web/conta';
import { criarPerfilRemoto } from '../../plataforma/web/perfilRemoto';
import { obterPerfilLocal } from '../../plataforma/web/perfil';
import type { PerfilUsuario } from '../../nucleo/usuario/perfil';
import type { CausoPostado, PortaDeComunidade } from '../../portas/comunidade';
import type { EstadoDaConta, PortaDeConta } from '../../portas/conta';
import type { Compartilhamento } from '../../portas/compartilhamento';
import type { Conexao, DadosDoPerfil, PerfilPublico, PortaDePerfil } from '../../portas/perfil';
import { SimboloBurpzilla } from './SimboloBurpzilla';
import { CardDeCauso } from '../comunidade/components/CardDeCauso';
import { BarraLateralNavegacao } from '../comunidade/components/BarraLateralNavegacao';
import { BarraInferiorMobile } from '../comunidade/components/BarraInferiorMobile';
import { ColunaTendencias } from '../comunidade/components/ColunaTendencias';

interface TelaPerfilProps {
  /** Sem handle, mostra o perfil de quem está jogando. */
  handle?: string;
  /** Primeira parada depois de criar conta: uma ficha curta, antes do feed. */
  boasVindas?: boolean;
  portaPerfil?: PortaDePerfil;
  portaComunidade?: PortaDeComunidade;
  portaConta?: PortaDeConta;
  compartilhamento?: Compartilhamento;
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

const NOMES_DAS_REDES = { instagram: 'Instagram', tiktok: 'TikTok', youtube: 'YouTube', twitter: 'X' } as const;

/** O servidor só guarda `[A-Za-z0-9._-]`, então o usuário entra no link sem escape extra. */
function urlDaRede(rede: keyof typeof NOMES_DAS_REDES, usuario: string): string {
  const u = encodeURIComponent(usuario);
  switch (rede) {
    case 'instagram':
      return `https://instagram.com/${u}`;
    case 'tiktok':
      return `https://www.tiktok.com/@${u}`;
    case 'youtube':
      return `https://www.youtube.com/@${u}`;
    default:
      return `https://x.com/${u}`;
  }
}

export const TelaPerfil: React.FC<TelaPerfilProps> = ({
  handle,
  boasVindas = false,
  portaPerfil,
  portaComunidade,
  portaConta,
  compartilhamento,
  aoVoltar,
  aoArrotar,
  aoAbrirHistoria,
  aoAbrirPerfil,
  aoEntrar,
}) => {
  const [larguraJanela, setLarguraJanela] = useState(() => (typeof window !== 'undefined' ? window.innerWidth : 1200));

  useEffect(() => {
    const onResize = () => setLarguraJanela(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const isMobile = larguraJanela < 700;
  const isWide = larguraJanela >= 1060;

  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    if (typeof localStorage !== 'undefined') {
      const salvo = localStorage.getItem('bda-theme');
      if (salvo === 'light' || salvo === 'dark') return salvo;
    }
    return 'dark';
  });

  const toggleTheme = () => {
    const novo = theme === 'dark' ? 'light' : 'dark';
    setTheme(novo);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('bda-theme', novo);
    }
    document.documentElement.setAttribute('data-theme', novo);
  };

  const [perfilPort] = useState<PortaDePerfil>(() => portaPerfil ?? criarPerfilRemoto());
  const [comunidade] = useState<PortaDeComunidade>(() => portaComunidade ?? criarComunidadeWeb());
  const [contaPort] = useState<PortaDeConta>(() => portaConta ?? criarContaWeb());
  const [compartilhar] = useState<Compartilhamento>(() => compartilhamento ?? criarCompartilhamentoWeb());

  const [perfil, setPerfil] = useState<PerfilPublico | null>(null);
  const [conta, setConta] = useState<EstadoDaConta | null>(null);
  // A ficha inaugural não é um perfil navegável: a pessoa termina o básico
  // antes de entrar no Bonde. O guard de rota reforça isso fora da tela.
  const bloqueiaSaidaDaFicha = !handle && (boasVindas || Boolean(conta?.perfilSocialPendente));
  const showLeft = larguraJanela >= 700 && !bloqueiaSaidaDaFicha;
  const showRight = larguraJanela >= 1000 && !bloqueiaSaidaDaFicha;
  const [carregando, setCarregando] = useState(true);
  const [falhou, setFalhou] = useState(false);
  const [tentativa, setTentativa] = useState(0);
  const [aba, setAba] = useState<Aba>('causos');
  const [causos, setCausos] = useState<readonly CausoPostado[]>([]);
  const [carregandoCausos, setCarregandoCausos] = useState(false);
  const [aviso, setAviso] = useState('');
  const [editando, setEditando] = useState(false);
  const [hoverFoto, setHoverFoto] = useState(false);
  const [form, setForm] = useState<Required<DadosDoPerfil>>({
    apelido: '',
    handle: '',
    bio: '',
    cidade: '',
    instagram: '',
    tiktok: '',
    youtube: '',
    twitter: '',
  });
  const [conexoes, setConexoes] = useState<{ tipo: 'seguidores' | 'seguindo'; lista: readonly Conexao[] } | null>(null);
  const [enviandoFoto, setEnviandoFoto] = useState(false);
  const [erroDoForm, setErroDoForm] = useState('');
  const [salvando, setSalvando] = useState(false);

  const avisar = useCallback((msg: string) => {
    setAviso(msg);
    setTimeout(() => setAviso((atual) => (atual === msg ? '' : atual)), 2400);
  }, []);

  useEffect(() => {
    let ativo = true;
    setCarregando(true);
    setFalhou(false);
    (async () => {
      const c = await contaPort.estado();
      if (!ativo) return;
      // A identidade anônima é da Arena, não é um perfil público nem "meu perfil".
      if (!handle && !c.perfilSocialPendente && !(c.podeParticiparSocialmente ?? (c.temSessao && !c.anonima))) {
        setPerfil(null);
        setConta(c);
        setFalhou(false);
        setCarregando(false);
        return;
      }
      // A ficha pendente ainda não é pública. Ela só pode ser lida pela porta
      // privada de edição, nunca pela resolução do perfil público.
      if (!handle && c.perfilSocialPendente) {
        try {
          const dados = await perfilPort.obterMeuPerfilParaEdicao();
          if (!ativo) return;
          if (dados) {
            setForm({
              apelido: dados.apelido ?? '',
              handle: dados.handle ?? '',
              bio: dados.bio ?? '',
              cidade: dados.cidade ?? '',
              instagram: dados.instagram ?? '',
              tiktok: dados.tiktok ?? '',
              youtube: dados.youtube ?? '',
              twitter: dados.twitter ?? '',
            });
          }
          setPerfil(null);
          setConta(c);
          setFalhou(!dados);
          setCarregando(false);
          return;
        } catch {
          if (!ativo) return;
          setPerfil(null);
          setConta(c);
          setFalhou(true);
          setCarregando(false);
          return;
        }
      }
      // Perfil de outra pessoa: `null` é "não existe", exceção é "não deu para abrir".
      const buscar = async (): Promise<{ p: PerfilPublico | null; deuErro: boolean }> => {
        try {
          return { p: await (handle ? perfilPort.obterPerfil(handle) : perfilPort.obterMeuPerfil()), deuErro: false };
        } catch {
          return { p: null, deuErro: true };
        }
      };
      const { p, deuErro } = await buscar();
      if (!ativo) return;
      setPerfil(p);
      if (boasVindas && !handle && p) {
        setForm({
          apelido: p.apelido,
          handle: p.handle,
          bio: p.bio ?? '',
          cidade: p.cidade ?? '',
          instagram: p.instagram ?? '',
          tiktok: p.tiktok ?? '',
          youtube: p.youtube ?? '',
          twitter: p.twitter ?? '',
        });
      }
      setConta(c);
      setFalhou(deuErro);
      setCarregando(false);
    })();
    return () => {
      ativo = false;
    };
  }, [handle, perfilPort, contaPort, tentativa, boasVindas]);

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

  const [meuPerfilLocal] = useState<PerfilUsuario>(() => obterPerfilLocal());

  const souEu = Boolean(
    perfil?.souEu ||
      (!handle && (conta ? conta.temSessao : true)) ||
      (perfil &&
        meuPerfilLocal &&
        ((perfil.handle &&
          meuPerfilLocal.handle &&
          perfil.handle.toLowerCase().replace(/^@/, '') === meuPerfilLocal.handle.toLowerCase().replace(/^@/, '')) ||
          (perfil.id && meuPerfilLocal.id && perfil.id === meuPerfilLocal.id))),
  );

  const abas = useMemo(
    () => [
      { id: 'causos' as const, rotulo: 'Resenhas' },
      { id: 'audios' as const, rotulo: 'Com áudio' },
      ...(souEu ? [{ id: 'curtidos' as const, rotulo: 'Curtidos' }] : []),
    ],
    [souEu],
  );

  const primeiraChegada = Boolean(
    !handle &&
      ((conta?.perfilSocialPendente && form.apelido && form.handle) || (boasVindas && souEu && perfil)),
  );

  const seguir = async () => {
    if (!perfil) return;
    if (!(conta?.podeParticiparSocialmente ?? (conta?.temSessao && !conta?.anonima))) {
      avisar('Crie sua conta para seguir arrotadores.');
      aoEntrar('cadastro');
      return;
    }
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
      instagram: perfil.instagram ?? '',
      tiktok: perfil.tiktok ?? '',
      youtube: perfil.youtube ?? '',
      twitter: perfil.twitter ?? '',
    });
    setErroDoForm('');
    setEditando(true);
  };

  const salvar = async (e: React.FormEvent, entrarNoBonde = false) => {
    e.preventDefault();
    setSalvando(true);
    setErroDoForm('');
    try {
      const res = await (entrarNoBonde ? perfilPort.concluirMeuPerfilSocial(form) : perfilPort.atualizarMeuPerfil(form));
      if (res.ok) {
        setPerfil(res.perfil);
        setEditando(false);
        if (entrarNoBonde) {
          aoVoltar();
          return;
        }
        avisar('Perfil salvo.');
        if (res.perfil.handle !== handle && handle) aoAbrirPerfil(res.perfil.handle);
        return;
      }
      setErroDoForm(res.motivo === 'invalido' ? res.detalhe : MENSAGENS_DE_EDICAO[res.motivo]);
    } catch {
      setErroDoForm('Não deu para salvar agora. Nada mudou.');
    } finally {
      setSalvando(false);
    }
  };

  const trocarFoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const arquivo = e.target.files?.[0];
    e.target.value = '';
    if (!arquivo) return;
    setEnviandoFoto(true);
    const res = await perfilPort.enviarFoto(arquivo);
    setEnviandoFoto(false);
    if (res.ok) {
      setPerfil(res.perfil);
      avisar('Foto atualizada.');
      return;
    }
    avisar(
      res.motivo === 'formatoInvalido'
        ? 'Use uma foto JPG, PNG ou WebP.'
        : res.motivo === 'grandeDemais'
          ? 'Essa foto é grande demais. Escolhe uma de até 15 MB.'
          : 'Não deu para trocar a foto agora. Nada mudou.',
    );
  };

  const tirarFoto = async () => {
    const res = await perfilPort.removerFoto();
    if (res.ok) {
      setPerfil(res.perfil);
      avisar('Foto removida.');
    } else {
      avisar('Não deu para remover a foto agora.');
    }
  };

  const abrirConexoes = async (tipo: 'seguidores' | 'seguindo') => {
    if (!perfil) return;
    setConexoes({ tipo, lista: [] });
    const lista = await perfilPort.listarConexoes(perfil.handle, tipo);
    setConexoes({ tipo, lista });
  };

  const compartilharPerfil = async () => {
    if (!perfil) return;
    const url = `${window.location.origin}/u/${perfil.handle}`;
    const res = await compartilhar.compartilhar({
      url,
      titulo: `${perfil.apelido} no Auê`,
      texto: `Olha o perfil de ${perfil.apelido} no Auê.`,
    });
    if (res.ok || (!res.ok && res.motivo === 'cancelado')) return;
    // Sem folha de compartilhar: copia o link, e diz se não conseguiu.
    avisar((await compartilhar.copiar(url)) ? 'Link do perfil copiado.' : 'Não deu para copiar o link.');
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
    if (!(conta?.podeParticiparSocialmente ?? (conta?.temSessao && !conta?.anonima))) {
      avisar('Crie sua conta para curtir resenhas.');
      aoEntrar('cadastro');
      return;
    }
    const r = await comunidade.alternarCurtida(id);
    if (r.ok) atualizar(id, { curtidas: r.curtidas, curtidoPorMim: r.curtido });
    else avisar('Não deu para curtir agora.');
  };
  const repostar = async (id: string) => {
    if (!(conta?.podeParticiparSocialmente ?? (conta?.temSessao && !conta?.anonima))) {
      avisar('Crie sua conta para entrar no Bonde.');
      aoEntrar('cadastro');
      return;
    }
    const r = await comunidade.alternarRepost(id);
    if (r.ok) atualizar(id, { reposts: r.reposts, repostadoPorMim: r.repostado });
    else avisar('Não deu para repostar agora.');
  };
  const abrirConversa = async (id: string) => {
    const lista = await comunidade.listarRespostas(id);
    atualizar(id, { comentarios: lista });
  };
  const responder = async (id: string, texto: string, respostaAId?: string) => {
    if (!(conta?.podeParticiparSocialmente ?? (conta?.temSessao && !conta?.anonima))) {
      avisar('Crie sua conta para responder no Bonde.');
      aoEntrar('cadastro');
      return;
    }
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
    if (
      !window.confirm(
        comAudio
          ? 'Apagar esta resenha e o áudio do arroto? Não tem como desfazer.'
          : 'Apagar esta resenha? Não tem como desfazer.',
      )
    )
      return;
    const ok = await comunidade.apagarCauso(causo.id, { apagarAudio: comAudio });
    if (!ok) {
      avisar('Não deu para apagar a resenha agora. Nada foi apagado.');
      return;
    }
    setCausos((prev) => prev.filter((c) => c.id !== causo.id));
    setPerfil((p) => (p ? { ...p, totalCausos: Math.max(0, p.totalCausos - 1) } : p));
    avisar('Resenha apagada.');
  };
  const denunciar = async (id: string) => {
    if (!(conta?.podeParticiparSocialmente ?? (conta?.temSessao && !conta?.anonima))) {
      avisar('Crie sua conta para denunciar uma resenha.');
      aoEntrar('cadastro');
      return;
    }
    const ok = await comunidade.denunciarCauso(id, 'Denúncia de usuário');
    if (!ok) {
      avisar('Não deu para registrar a denúncia.');
      return;
    }
    setCausos((prev) => prev.filter((c) => c.id !== id));
    avisar('Denúncia registrada.');
  };

  const inicial = (perfil?.apelido || form.apelido || 'A').slice(0, 2).toUpperCase();
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
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
  };

  const estiloAvatar: React.CSSProperties = {
    width: 80,
    height: 80,
    flex: 'none',
    borderRadius: '50%',
    background: 'var(--surface)',
    border: '4px solid var(--bg)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: 'var(--font-display)',
    fontSize: 30,
    position: 'relative',
    overflow: 'hidden',
    color: 'var(--fg)',
  };
  const estiloFoto: React.CSSProperties = { position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' };
  const botaoTexto: React.CSSProperties = {
    background: 'none',
    border: 0,
    padding: 0,
    color: 'var(--fg)',
    fontSize: 14,
    fontFamily: 'inherit',
    cursor: 'pointer',
  };
  const redes = perfil
    ? (['instagram', 'tiktok', 'youtube', 'twitter'] as const)
        .filter((r) => Boolean(perfil[r]))
        .map((r) => ({ nome: NOMES_DAS_REDES[r], usuario: perfil[r] as string, url: urlDaRede(r, perfil[r] as string) }))
    : [];
  const visitanteSemPerfil = Boolean(
    !handle && conta && !(conta.podeParticiparSocialmente ?? (conta.temSessao && !conta.anonima)),
  );

  const perfilParaBarra = meuPerfilLocal;

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--bg)',
        color: 'var(--fg)',
        fontFamily: 'var(--font-body)',
        boxSizing: 'border-box',
      }}
    >
      <div
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'flex-start',
        }}
      >
        {/* Coluna Esquerda: Navegação Canônica (275px / 76px) */}
        {showLeft && (
          <BarraLateralNavegacao
            abaAtiva="perfil"
            aoMudarAba={(nova) => {
              if (nova === 'feed') aoVoltar();
              else if (nova === 'arena') {
                if (aoArrotar) aoArrotar();
                else window.location.href = '/arena';
              } else {
                window.location.href = nova === 'comm' ? '/comunidades' : '/desafios';
              }
            }}
            aoAbrirComposer={aoArrotar}
            compacto={!isWide}
            tema={theme}
            aoAlternarTema={toggleTheme}
            perfil={perfilParaBarra}
            aoAbrirPerfil={() => {
              if (handle) {
                aoAbrirPerfil(meuPerfilLocal.handle);
              }
            }}
            contaLogada={Boolean(conta?.podeParticiparSocialmente ?? (conta?.temSessao && !conta?.anonima))}
            aoSair={sair}
          />
        )}

        {/* Coluna Central: Perfil (Max 600px) */}
        <main
          style={{
            width: '100%',
            maxWidth: '600px',
            flex: '1 1 0',
            minWidth: 0,
            borderLeft: '1px solid var(--border)',
            borderRight: '1px solid var(--border)',
            minHeight: '100vh',
            boxSizing: 'border-box',
            paddingBottom: isMobile ? '120px' : '40px',
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
            {!bloqueiaSaidaDaFicha && (
              <button
                type="button"
                onClick={aoVoltar}
                aria-label="Voltar"
                style={{ ...botaoSecundario, border: 0, padding: 0, width: '44px' }}
              >
                ←
              </button>
            )}
            <b style={{ fontSize: '18px' }}>{primeiraChegada ? 'Seu perfil' : perfil ? `@${perfil.handle}` : 'Perfil'}</b>
          </header>

          {aviso && (
            <div
              role="status"
              style={{
                padding: '10px 16px',
                background: 'var(--surface)',
                borderBottom: '1px solid var(--border)',
                fontSize: '14px',
              }}
            >
              {aviso}
            </div>
          )}

          {carregando && (
            <p role="status" aria-live="polite" style={{ padding: 24, color: 'var(--muted)' }}>
              Carregando perfil…
            </p>
          )}

          {!carregando && !perfil && falhou && (
            <div role="alert" style={{ padding: 24, display: 'grid', gap: 12 }}>
              <b style={{ fontSize: 18 }}>Não deu para abrir o perfil. Tenta de novo.</b>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button type="button" onClick={() => setTentativa((n) => n + 1)} style={botaoSecundario}>
                  Tentar de novo
                </button>
                <button type="button" onClick={aoVoltar} style={botaoSecundario}>
                  Voltar
                </button>
              </div>
            </div>
          )}

          {!carregando && !perfil && !falhou && visitanteSemPerfil && (
            <section style={{ padding: 24, display: 'grid', gap: 12 }} aria-labelledby="titulo-promocao-perfil">
              <b id="titulo-promocao-perfil" style={{ fontSize: 22 }}>
                Seu perfil público começa com uma conta
              </b>
              <p style={{ margin: 0, color: 'var(--muted)', lineHeight: 1.45 }}>
                Como visitante você pode jogar, desafiar e ler o Bonde. Crie uma conta para escolher seu @ e participar da rede.
              </p>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => aoEntrar('cadastro')}
                  style={{ ...botaoSecundario, background: 'var(--accent)', color: 'var(--accent-on)', border: 0 }}
                >
                  Criar conta
                </button>
                <button type="button" onClick={aoVoltar} style={botaoSecundario}>
                  Voltar ao Bonde
                </button>
              </div>
            </section>
          )}

          {!carregando && !perfil && !falhou && !visitanteSemPerfil && (
            <div style={{ padding: 24, display: 'grid', gap: 12 }}>
              <b style={{ fontSize: 18 }}>{handle ? 'Esse arrotador não existe.' : 'Seu perfil não abriu.'}</b>
              <span style={{ color: 'var(--muted)' }}>
                {handle
                  ? 'O @ pode ter mudado. Procura pelo causo no Bonde.'
                  : 'Precisa de conexão com o servidor. Tenta de novo daqui a pouco.'}
              </span>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {handle && (
                  <button type="button" onClick={aoVoltar} style={botaoSecundario}>
                    Voltar ao Bonde
                  </button>
                )}
                <button type="button" onClick={aoArrotar} style={botaoSecundario}>
                  Ir arrotar
                </button>
              </div>
            </div>
          )}

          {primeiraChegada && (
            <section
              aria-labelledby="titulo-seu-perfil"
              style={{
                width: '100%',
                maxWidth: 480,
                margin: isMobile ? '0 auto' : '40px auto',
                padding: isMobile ? '24px 20px' : '32px',
                boxSizing: 'border-box',
                display: 'grid',
                gap: 24,
              }}
            >
              <div style={{ display: 'grid', gap: 8 }}>
                <p style={{ margin: 0, color: 'var(--muted)', fontSize: 13, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase' }}>
                  Sua ficha no Bonde
                </p>
                <h1 id="titulo-seu-perfil" style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: 34, fontWeight: 400, lineHeight: 1 }}>
                  Seu perfil
                </h1>
                <p style={{ margin: 0, color: 'var(--muted)', lineHeight: 1.45 }}>
                  É assim que a galera vai te reconhecer. O básico já está aqui; o resto é opcional.
                </p>
              </div>

              <form onSubmit={(e) => salvar(e, true)} style={{ display: 'grid', gap: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <label
                    title="Adicionar foto"
                    style={{ ...estiloAvatar, width: 72, height: 72, cursor: enviandoFoto ? 'progress' : 'pointer', border: '1px solid var(--border-strong)' }}
                  >
                    {perfil?.avatarUrl ? <img src={perfil.avatarUrl} alt={perfil.apelido} style={estiloFoto} /> : inicial}
                    <span aria-hidden="true" style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', background: 'rgba(0,0,0,.42)', color: '#fff', fontSize: 22 }}>
                      +
                    </span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      aria-label="Adicionar foto ao perfil"
                      onChange={trocarFoto}
                      disabled={enviandoFoto}
                      style={{ display: 'none' }}
                    />
                  </label>
                  <div style={{ display: 'grid', gap: 2 }}>
                    <b>Foto de perfil</b>
                    <span style={{ color: 'var(--muted)', fontSize: 14 }}>{enviandoFoto ? 'Enviando foto…' : 'Opcional. JPG, PNG ou WebP.'}</span>
                  </div>
                </div>

                <fieldset style={{ margin: 0, padding: 0, border: 0, display: 'grid', gap: 12 }}>
                  <legend style={{ marginBottom: 8, fontWeight: 700 }}>Quem é você</legend>
                  <label style={{ display: 'grid', gap: 6, fontSize: 14 }}>
                    Apelido
                    <input aria-label="Apelido" required style={campo} value={form.apelido} maxLength={30} onChange={(e) => setForm({ ...form, apelido: e.target.value })} />
                  </label>
                  <label style={{ display: 'grid', gap: 6, fontSize: 14 }}>
                    @
                    <input aria-label="Seu @" required style={campo} value={form.handle} maxLength={20} autoCapitalize="none" onChange={(e) => setForm({ ...form, handle: e.target.value.toLowerCase() })} />
                  </label>
                </fieldset>

                <fieldset style={{ margin: 0, padding: 0, border: 0, display: 'grid', gap: 12 }}>
                  <legend style={{ marginBottom: 8, fontWeight: 700 }}>Um pouco mais, se quiser</legend>
                  <label style={{ display: 'grid', gap: 6, fontSize: 14 }}>
                    Bio <span style={{ color: 'var(--muted)', fontWeight: 400 }}>({160 - form.bio.length} restantes)</span>
                    <textarea aria-label="Bio" style={{ ...campo, minHeight: 84, padding: 12, resize: 'vertical' }} value={form.bio} maxLength={160} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
                  </label>
                  <label style={{ display: 'grid', gap: 6, fontSize: 14 }}>
                    Cidade
                    <input aria-label="Cidade" style={campo} value={form.cidade} maxLength={60} onChange={(e) => setForm({ ...form, cidade: e.target.value })} />
                  </label>
                </fieldset>

                {erroDoForm && <p role="alert" style={{ margin: 0, color: 'var(--danger, #ff4d4f)', lineHeight: 1.4 }}>{erroDoForm}</p>}
                <button type="submit" disabled={salvando || enviandoFoto} style={{ minHeight: 48, border: 0, borderRadius: 14, background: 'var(--accent)', color: 'var(--accent-on)', fontWeight: 800, fontSize: 16, cursor: salvando ? 'progress' : 'pointer' }}>
                  {salvando ? 'Salvando…' : 'Entrar no Bonde'}
                </button>
              </form>
            </section>
          )}

          {perfil && !primeiraChegada && (
            <>
              {/* Capa Canônica: 160px */}
              <div
                aria-hidden="true"
                style={{
                  height: 160,
                  background: 'var(--surface-2)',
                  borderBottom: '1px solid var(--border)',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              />

              <section style={{ padding: '0 16px 16px', display: 'grid', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12, marginTop: -40 }}>
                  {souEu ? (
                    <label
                      title="Trocar foto"
                      onMouseEnter={() => setHoverFoto(true)}
                      onMouseLeave={() => setHoverFoto(false)}
                      style={{ ...estiloAvatar, cursor: enviandoFoto ? 'progress' : 'pointer' }}
                    >
                      {perfil.avatarUrl ? <img src={perfil.avatarUrl} alt={perfil.apelido} style={estiloFoto} /> : inicial}
                      <span
                        style={{
                          position: 'absolute',
                          inset: 0,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: 'rgba(0,0,0,0.55)',
                          color: '#fff',
                          opacity: hoverFoto ? 1 : 0,
                          transition: 'opacity 0.15s ease',
                        }}
                      >
                        <svg
                          width="22"
                          height="22"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden="true"
                        >
                          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                          <circle cx="12" cy="13" r="4" />
                        </svg>
                      </span>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        aria-label="Trocar foto do perfil"
                        onChange={trocarFoto}
                        disabled={enviandoFoto}
                        style={{ display: 'none' }}
                      />
                    </label>
                  ) : (
                    <div style={estiloAvatar}>
                      {perfil.avatarUrl ? <img src={perfil.avatarUrl} alt={perfil.apelido} style={estiloFoto} /> : inicial}
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                    <button type="button" onClick={compartilharPerfil} style={botaoSecundario}>
                      Compartilhar
                    </button>
                    {souEu ? (
                      <button
                        type="button"
                        onClick={() => (editando ? setEditando(false) : abrirEdicao())}
                        style={botaoSecundario}
                      >
                        Editar perfil
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={seguir}
                        style={{
                          ...botaoSecundario,
                          border: perfil.euSigo ? '1px solid var(--border-strong)' : 0,
                          background: perfil.euSigo ? 'transparent' : 'var(--fg)',
                          color: perfil.euSigo ? 'var(--fg)' : 'var(--bg)',
                        }}
                      >
                        {perfil.euSigo ? 'Seguindo' : 'Seguir'}
                      </button>
                    )}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: 22, fontWeight: 800, display: 'flex', alignItems: 'center' }}>
                    <span>{perfil.apelido}</span>
                    {perfil.daCasa === true && <SimboloBurpzilla />}
                  </div>
                  <div style={{ color: 'var(--muted)', fontSize: 15 }}>@{perfil.handle}</div>
                  {perfil.titulo && <div style={{ color: 'var(--muted)', fontSize: 13, marginTop: 2 }}>{perfil.titulo}</div>}
                </div>

                {perfil.bio && <p style={{ margin: 0, lineHeight: 1.45, fontSize: 15, textWrap: 'pretty' }}>{perfil.bio}</p>}

                <div style={{ color: 'var(--muted)', fontSize: 14 }}>
                  {[perfil.cidade, desde ? `no bonde desde ${desde}` : null].filter(Boolean).join(' · ')}
                </div>

                {redes.length > 0 && (
                  <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', fontSize: 14 }}>
                    {redes.map((r) => (
                      <a
                        key={r.nome}
                        href={r.url}
                        target="_blank"
                        rel="noopener noreferrer nofollow"
                        style={{ color: 'var(--fg)', textDecoration: 'underline' }}
                      >
                        {r.nome} @{r.usuario}
                      </a>
                    ))}
                  </div>
                )}

                {/* Estatísticas Hierarquizadas: Social e Jogo */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
                  <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', fontSize: 14 }}>
                    <button type="button" onClick={() => abrirConexoes('seguindo')} style={botaoTexto}>
                      <b>{perfil.totalSeguindo}</b> <span style={{ color: 'var(--muted)' }}>seguindo</span>
                    </button>
                    <button type="button" onClick={() => abrirConexoes('seguidores')} style={botaoTexto}>
                      <b>{perfil.totalSeguidores}</b> <span style={{ color: 'var(--muted)' }}>seguidores</span>
                    </button>
                  </div>
                  <div style={{ display: 'flex', gap: 18, alignItems: 'center', flexWrap: 'wrap', fontSize: 14 }}>
                    <span>
                      <b>{perfil.totalCausos}</b> <span style={{ color: 'var(--muted)' }}>resenhas</span>
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ color: 'var(--muted)' }}>melhor nota:</span>
                      <b
                        style={{
                          fontFamily: 'var(--font-display)',
                          fontSize: 18,
                          letterSpacing: '0.02em',
                          background: perfil.melhorNota !== undefined ? 'var(--accent)' : 'var(--surface-2)',
                          color: perfil.melhorNota !== undefined ? 'var(--accent-on)' : 'var(--muted)',
                          padding: '1px 8px',
                          borderRadius: '6px',
                        }}
                      >
                        {perfil.melhorNota ?? '—'}
                      </b>
                    </span>
                  </div>
                </div>

                {/* Card de Conta Anônima / Promoção */}
                {souEu && conta && (
                  <div
                    style={{
                      display: 'grid',
                      gap: 8,
                      padding: 14,
                      background: 'var(--surface)',
                      border: '1px solid var(--border)',
                      borderRadius: 16,
                      marginTop: 4,
                    }}
                  >
                    {conta.anonima || !conta.temSessao ? (
                      <>
                        <b style={{ fontSize: 15 }}>Sua conta é anônima</b>
                        <span style={{ color: 'var(--muted)', fontSize: 14, lineHeight: 1.4 }}>
                          Ela existe só neste navegador. Se você limpar os dados, perde suas resenhas. Cadastre e-mail
                          e senha para guardar tudo.
                        </span>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
                          <button
                            type="button"
                            style={{ ...botaoSecundario, background: 'var(--fg)', color: 'var(--bg)', border: 0 }}
                            onClick={() => aoEntrar('cadastro')}
                          >
                            Criar conta
                          </button>
                          <button type="button" style={botaoSecundario} onClick={() => aoEntrar('entrar')}>
                            Já tenho conta
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <b style={{ fontSize: 15 }}>Conta</b>
                        <span style={{ color: 'var(--muted)', fontSize: 14 }}>{conta.email}</span>
                        <div style={{ marginTop: 2 }}>
                          <button type="button" style={botaoSecundario} onClick={sair}>
                            Sair
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </section>

              {/* Abas com Indicador Ativo --ind */}
              <nav role="tablist" style={{ display: 'flex', borderBottom: '1px solid var(--border)' }}>
                {abas.map((a) => {
                  const ativo = aba === a.id;
                  return (
                    <button
                      key={a.id}
                      role="tab"
                      aria-selected={ativo}
                      type="button"
                      onClick={() => setAba(a.id)}
                      style={{
                        flex: 1,
                        minHeight: 48,
                        border: 0,
                        background: 'none',
                        color: ativo ? 'var(--fg)' : 'var(--muted)',
                        fontWeight: ativo ? 700 : 500,
                        fontSize: 15,
                        cursor: 'pointer',
                        position: 'relative',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <span>{a.rotulo}</span>
                      {ativo && (
                        <span
                          style={{
                            position: 'absolute',
                            bottom: 0,
                            width: '48px',
                            height: '3px',
                            borderRadius: '999px',
                            background: 'var(--ind)',
                          }}
                        />
                      )}
                    </button>
                  );
                })}
              </nav>

              {carregandoCausos && <p style={{ padding: 24, color: 'var(--muted)' }}>Carregando…</p>}
              {!carregandoCausos && causos.length === 0 && (
                <p style={{ padding: 24, color: 'var(--muted)', textAlign: 'center' }}>
                  {aba === 'curtidos'
                    ? 'Nada curtido ainda.'
                    : souEu
                      ? 'Você ainda não postou nenhuma resenha.'
                      : 'Sem resenhas por aqui ainda.'}
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

        {/* Coluna Direita: Tendências e Busca (320px) */}
        {showRight && (
          <ColunaTendencias
            termoBusca=""
            aoMudarBusca={() => aoVoltar()}
            aoSelecionarTrend={() => aoVoltar()}
          />
        )}
      </div>

      {/* Navegação Mobile Inferior */}
      {isMobile && !bloqueiaSaidaDaFicha && (
        <BarraInferiorMobile
          abaAtiva="feed"
          aoMudarAba={(nova) => {
            if (nova === 'feed') aoVoltar();
            else if (nova === 'arena') {
              if (aoArrotar) aoArrotar();
              else window.location.href = '/arena';
            } else {
              window.location.href = nova === 'comm' ? '/comunidades' : '/desafios';
            }
          }}
          aoAbrirPerfil={() => {}}
          aoAbrirComposer={aoArrotar}
        />
      )}

      {/* Modal / Bottom Sheet: Editar Perfil */}
      {souEu && editando && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Editar perfil"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 50,
            background: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: isMobile ? 'flex-end' : 'center',
            justifyContent: 'center',
            padding: isMobile ? 0 : '16px',
            boxSizing: 'border-box',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setEditando(false);
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '560px',
              background: 'var(--surface)',
              border: '1px solid var(--border-strong)',
              borderRadius: isMobile ? '24px 24px 0 0' : '24px',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
              boxShadow: '0 8px 32px rgba(0,0,0,.5)',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxSizing: 'border-box',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: '22px' }}>EDITAR PERFIL</span>
              <button
                type="button"
                onClick={() => setEditando(false)}
                style={{ minHeight: 44, padding: '0 8px', background: 'none', border: 0, color: 'var(--muted)', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}
              >
                Fechar
              </button>
            </div>

            <form onSubmit={salvar} style={{ display: 'grid', gap: 20 }}>
              <p style={{ margin: '-6px 0 0', color: 'var(--muted)', lineHeight: 1.4 }}>
                Primeiro o que aparece no Bonde. Depois, só o que você quiser mostrar.
              </p>
              <fieldset style={{ margin: 0, padding: 0, border: 0, display: 'grid', gap: 12 }}>
                <legend style={{ marginBottom: 8, fontWeight: 800 }}>Identidade</legend>
                <label style={{ display: 'grid', gap: 4, fontSize: 13, color: 'var(--muted)' }}>
                  Apelido
                <input
                  aria-label="Apelido"
                  style={campo}
                  value={form.apelido}
                  required
                  maxLength={30}
                  onChange={(e) => setForm({ ...form, apelido: e.target.value })}
                />
                </label>
                <label style={{ display: 'grid', gap: 4, fontSize: 13, color: 'var(--muted)' }}>
                  @ (3 a 20: letras minúsculas, números e _)
                <input
                  aria-label="Seu @"
                  style={campo}
                  value={form.handle}
                  required
                  maxLength={20}
                  autoCapitalize="none"
                  onChange={(e) => setForm({ ...form, handle: e.target.value.toLowerCase() })}
                />
                </label>
              </fieldset>
              <fieldset style={{ margin: 0, padding: 0, border: 0, display: 'grid', gap: 12 }}>
                <legend style={{ marginBottom: 8, fontWeight: 800 }}>Sobre você <span style={{ color: 'var(--muted)', fontWeight: 400 }}>(opcional)</span></legend>
                <label style={{ display: 'grid', gap: 4, fontSize: 13, color: 'var(--muted)' }}>
                  Bio ({160 - form.bio.length})
                <textarea
                  aria-label="Bio"
                  style={{ ...campo, minHeight: 80, padding: 12, resize: 'none' }}
                  value={form.bio}
                  maxLength={160}
                  onChange={(e) => setForm({ ...form, bio: e.target.value })}
                />
                </label>
                <label style={{ display: 'grid', gap: 4, fontSize: 13, color: 'var(--muted)' }}>
                  Cidade
                <input
                  aria-label="Cidade"
                  style={campo}
                  value={form.cidade}
                  maxLength={60}
                  onChange={(e) => setForm({ ...form, cidade: e.target.value })}
                />
                </label>
              </fieldset>
              <details>
                <summary style={{ cursor: 'pointer', fontWeight: 700, minHeight: 44, display: 'flex', alignItems: 'center' }}>Redes sociais <span style={{ color: 'var(--muted)', fontWeight: 400, marginLeft: 6 }}>(opcional)</span></summary>
                <div style={{ display: 'grid', gap: 12, paddingTop: 8 }}>
                  {(['instagram', 'tiktok', 'youtube', 'twitter'] as const).map((rede) => (
                    <label key={rede} style={{ display: 'grid', gap: 4, fontSize: 13, color: 'var(--muted)' }}>
                      {NOMES_DAS_REDES[rede]} (só o @, sem link)
                      <input aria-label={NOMES_DAS_REDES[rede]} style={campo} value={form[rede]} maxLength={31} autoCapitalize="none" onChange={(e) => setForm({ ...form, [rede]: e.target.value })} />
                    </label>
                  ))}
                </div>
              </details>
              {perfil?.avatarUrl && (
                <button type="button" onClick={tirarFoto} style={botaoSecundario}>
                  Remover foto
                </button>
              )}
              {erroDoForm && (
                <span role="alert" style={{ color: 'var(--danger, #ff4d4f)', fontSize: 14 }}>
                  {erroDoForm}
                </span>
              )}
              <button
                type="submit"
                disabled={salvando}
                style={{
                  minHeight: 48,
                  border: 0,
                  borderRadius: 14,
                  background: 'var(--accent)',
                  color: 'var(--accent-on)',
                  fontWeight: 700,
                  fontSize: 16,
                  cursor: 'pointer',
                  marginTop: 4,
                }}
              >
                {salvando ? 'Salvando…' : 'Salvar'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal / Bottom Sheet: Seguidores e Seguindo */}
      {conexoes && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={conexoes.tipo === 'seguidores' ? 'Seguidores' : 'Seguindo'}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 50,
            background: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: isMobile ? 'flex-end' : 'center',
            justifyContent: 'center',
            padding: isMobile ? 0 : '16px',
            boxSizing: 'border-box',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setConexoes(null);
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '480px',
              background: 'var(--surface)',
              border: '1px solid var(--border-strong)',
              borderRadius: isMobile ? '24px 24px 0 0' : '24px',
              padding: '18px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              maxHeight: '80vh',
              overflowY: 'auto',
              boxSizing: 'border-box',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <b style={{ fontSize: '18px' }}>{conexoes.tipo === 'seguidores' ? 'Seguidores' : 'Seguindo'}</b>
              <button type="button" onClick={() => setConexoes(null)} style={botaoTexto} aria-label="Fechar lista">
                Fechar
              </button>
            </div>
            {conexoes.lista.length === 0 && (
              <span style={{ color: 'var(--muted)', fontSize: 14, padding: '12px 0' }}>
                {conexoes.tipo === 'seguidores' ? 'Ninguém segue ainda.' : 'Não segue ninguém ainda.'}
              </span>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {conexoes.lista.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => {
                    setConexoes(null);
                    aoAbrirPerfil(c.handle);
                  }}
                  style={{
                    ...botaoTexto,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    textAlign: 'left',
                    minHeight: 48,
                    padding: '6px 0',
                  }}
                >
                  <span
                    aria-hidden="true"
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: '50%',
                      background: 'var(--surface-2)',
                      overflow: 'hidden',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 13,
                      fontWeight: 700,
                      flex: 'none',
                      position: 'relative',
                    }}
                  >
                    {c.avatarUrl ? <img src={c.avatarUrl} alt="" style={estiloFoto} /> : c.apelido.slice(0, 2).toUpperCase()}
                  </span>
                  <span>
                    <b>{c.apelido}</b> <span style={{ color: 'var(--muted)' }}>@{c.handle}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
