import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { enderecoDoLoginComVolta } from '../../nucleo/comunidade/caminhoDeVolta';
import { consultarEnquantoVisivel } from '../../plataforma/web/atividadeDaPagina';
import { criarComunidadeWeb } from '../../plataforma/web/comunidade';
import { criarContaWeb } from '../../plataforma/web/conta';
import { criarForumWeb } from '../../plataforma/web/forum';
import type { ArrotadorDoTop } from '../../portas/forum';
import { CardDoPost } from '../novo-aue/CardDoPost';
import { criarPaginacaoDoMural } from '../novo-aue/paginacaoDoMural';
import { hidratarPaginaDaResenha } from '../novo-aue/publicacoesDaResenha';
import type { ItemDoFeed } from '../novo-aue/tipos';
import { useAudioDaResenha } from '../novo-aue/useAudioDaResenha';
import { useEngajamento } from '../novo-aue/useEngajamento';
import type { IdiomaM05 } from './NavegacaoM05';

const LIMITE = 5;
const INTERVALO_MS = 90_000;
const mensagens = {
  pt: {
    destaques: 'Destaques', nota: 'nota', titulo: 'Na Resenha', abrir: 'Abrir Resenha', novos: 'Novos na Resenha', vazio: 'Ainda não tem publicação na Resenha.',
    erro: 'Não deu para carregar a Resenha.', atualizar: 'Não deu para atualizar a Resenha.', tentar: 'Tentar de novo',
    carregando: 'Carregando a Resenha…', pause: 'Pause o áudio para atualizar.', audio: 'Não deu para ouvir esse áudio.',
  },
  en: {
    destaques: 'Highlights', nota: 'score', titulo: 'In the Hangout', abrir: 'Open the Hangout', novos: 'New in the Hangout', vazio: 'There are no posts in the Hangout yet.',
    erro: 'Could not load the Hangout.', atualizar: 'Could not refresh the Hangout.', tentar: 'Try again',
    carregando: 'Loading the Hangout…', pause: 'Pause the audio to refresh.', audio: 'Could not play this audio.',
  },
} as const;

export function ResenhaNoInicio({ idioma }: { readonly idioma: IdiomaM05 }) {
  const texto = mensagens[idioma];
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [forum] = useState(criarForumWeb);
  const [comunidadePort] = useState(criarComunidadeWeb);
  const [conta] = useState(criarContaWeb);
  const [estaAutenticado, setEstaAutenticado] = useState(false);
  const [destaques, setDestaques] = useState<readonly ArrotadorDoTop[]>([]);
  const [publicacoes, setPublicacoes] = useState<readonly ItemDoFeed[]>([]);
  const [estado, setEstado] = useState<'carregando' | 'pronto' | 'erro'>('carregando');
  const [novos, setNovos] = useState(false);
  const [aviso, setAviso] = useState('');
  const [tentativa, setTentativa] = useState(0);
  const [atualizando, setAtualizando] = useState(false);
  const audio = useAudioDaResenha();
  const bloquearAtualizacao = useRef(false);
  const maisRecente = useRef<{ id: string; criadoEm: string } | null>(null);
  const carregada = useRef(false);
  bloquearAtualizacao.current = Boolean(audio.audioTocandoId);

  useEffect(() => {
    let ativo = true;
    void conta.estado().then((sessao) => {
      if (ativo) setEstaAutenticado(sessao.temSessao && !sessao.anonima && !sessao.perfilSocialPendente);
    }).catch(() => undefined);
    return () => { ativo = false; };
  }, [conta]);

  useEffect(() => {
    let ativo = true;
    void forum.listarTopArrotadores?.().then((resultado) => {
      if (ativo && resultado.ok) setDestaques(resultado.valor);
    }).catch(() => undefined);
    return () => { ativo = false; };
  }, [forum]);

  const pedirEntrada = useCallback(() => {
    navigate(enderecoDoLoginComVolta(pathname));
  }, [navigate, pathname]);
  const { propsDeEngajamento } = useEngajamento({
    forum, comunidadePort, estaAutenticado, aoPedirEntrada: pedirEntrada, exibirToast: setAviso, itens: publicacoes,
  });

  useEffect(() => {
    let ativo = true;
    let consultando = false;

    async function ler(atualizar: boolean) {
      if (consultando || (!atualizar && !carregada.current)) return;
      consultando = true;
      if (atualizar) setAtualizando(true);
      try {
        const { entradas } = await criarPaginacaoDoMural(forum, LIMITE).proxima();
        if (!ativo) return;
        const primeiro = entradas[0]?.valor ?? null;
        if (!atualizar) {
          const anterior = maisRecente.current;
          setNovos(Boolean(primeiro && (!anterior || (
            primeiro.id !== anterior.id && primeiro.criadoEm >= anterior.criadoEm
          ))));
          return;
        }
        const resultado = await hidratarPaginaDaResenha(forum, entradas);
        if (!ativo) return;
        if (bloquearAtualizacao.current || audio.tentandoTocar.current) {
          setAviso(texto.pause);
          return;
        }
        maisRecente.current = primeiro;
        carregada.current = true;
        setPublicacoes(resultado);
        setNovos(false);
        setEstado('pronto');
        setAviso('');
      } catch {
        if (!ativo || !atualizar) return;
        if (carregada.current) setAviso(texto.atualizar);
        else setEstado('erro');
      } finally {
        consultando = false;
        if (ativo && atualizar) setAtualizando(false);
      }
    }

    // A consulta periódica compara IDs. Detalhes/mídia só são lidos quando a pessoa atualiza.
    const parar = consultarEnquantoVisivel(() => void ler(false), INTERVALO_MS);
    void ler(true);
    return () => { ativo = false; parar(); };
  }, [audio.tentandoTocar, forum, tentativa, texto.atualizar, texto.pause]);

  function recarregar() {
    if (audio.audioTocandoId || audio.tentandoTocar.current) {
      setAviso(texto.pause);
      return;
    }
    setTentativa((atual) => atual + 1);
  }

  return (
    <div className="m05-home__conteudo">
      <section className="m05-home__resenha" aria-labelledby="m05-na-resenha">
        <header>
          <h2 id="m05-na-resenha">{texto.titulo}</h2>
          <Link to="/feed">{texto.abrir} <span aria-hidden="true">→</span></Link>
        </header>
        <div className="m05-home__atualizacoes">
          <button className="m05-home__novos" type="button" disabled={atualizando || !novos} aria-hidden={!novos} onClick={recarregar}>
            {aviso === texto.pause ? texto.pause : texto.novos}
          </button>
          {aviso === texto.pause && <span className="sr-only" role="status">{aviso}</span>}
        </div>
        {estado === 'carregando' && <p className="m05-home__estado" role="status">{texto.carregando}</p>}
        {estado === 'erro' && (
          <div className="m05-home__estado" role="status">
            <p>{texto.erro}</p>
            <button type="button" disabled={atualizando} onClick={recarregar}>{texto.tentar}</button>
          </div>
        )}
        {estado === 'pronto' && publicacoes.length === 0 && <p className="m05-home__estado">{texto.vazio}</p>}
        {aviso && aviso !== texto.pause && <p role="status" className="m05-home__estado">{aviso}</p>}
        {audio.falhaNoAudio && <p role="status" className="m05-home__estado">{texto.audio}</p>}

        {publicacoes.map((post) => (
          <CardDoPost
            key={post.id}
            post={post}
            idioma={idioma}
            compacto
            {...propsDeEngajamento(post)}
            audioTocando={audio.audioTocandoId === post.id}
            tempoAtualDoAudio={audio.audioSelecionadoId === post.id ? audio.tempoAtualDoAudio : 0}
            duracaoDoAudio={audio.audioSelecionadoId === post.id ? audio.duracaoDoAudio : null}
            aoTocarAudio={(fonte) => void audio.alternarAudio(fonte, post.id)}
            aoAbrirComentarios={() => navigate(`/feed?conversa=${encodeURIComponent(post.id)}`)}
          />
        ))}
      </section>
      {destaques.length > 0 && (
        <aside className="m05-home__destaques" aria-labelledby="m05-destaques">
          <h2 id="m05-destaques">{texto.destaques}</h2>
          <ul>
            {destaques.map((destaque) => (
              <li key={destaque.handle}>
                <Link to={`/u/${encodeURIComponent(destaque.handle)}`} aria-label={`${destaque.apelido || destaque.handle}, ${texto.nota} ${destaque.nota}`}>
                  <strong>{destaque.apelido || destaque.handle}</strong>
                  <span>{destaque.nota}</span>
                </Link>
              </li>
            ))}
          </ul>
        </aside>
      )}
    </div>
  );
}
