import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { criarContaWeb } from '../../plataforma/web/conta';
import { criarAmbienteDoForumWeb } from '../../plataforma/web/ambienteDoForum';
import { criarForumWeb } from '../../plataforma/web/forum';
import { criarPerfilRemoto } from '../../plataforma/web/perfilRemoto';
import type { AmbienteDoForum } from '../../portas/ambienteDoForum';
import type { ComunidadeDoForum, CursorDoForum, OrdemDosTopicos, PortaDeForum, ResultadoDeBusca, TipoDeBusca, TopicoDoExplorar } from '../../portas/forum';
import type { PortaDeConta } from '../../portas/conta';
import type { PerfilPublico, PortaDePerfil } from '../../portas/perfil';
import { BarraLateral } from './BarraLateral';
import { BarraSuperior } from './BarraSuperior';
import { PainelDireito } from './PainelDireito';
import { useOnline } from '../forum/hooks';
import './casca.css';
import './TelaExplorarOpenDesign.css';

const TAMANHO_MINIMO_DA_BUSCA = 2;
type Fase = 'carregando' | 'pronto' | 'erro';

function ordemDaUrl(valor: string | null): OrdemDosTopicos {
  return valor === 'novos' ? 'recentes' : 'atividade';
}

function tipoDaUrl(valor: string | null): TipoDeBusca {
  return valor === 'comunidades' || valor === 'topicos' ? valor : 'pessoas';
}

function nomeDoAutor(topico: TopicoDoExplorar): string {
  return topico.autor.apelido ?? (topico.autor.handle ? `@${topico.autor.handle}` : 'Pessoa da roda');
}

function metaDeTopico(topico: TopicoDoExplorar): string {
  const quando = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' }).format(new Date(topico.ultimaAtividadeEm));
  return `${nomeDoAutor(topico)} · ${topico.respostasTotal} ${topico.respostasTotal === 1 ? 'resposta' : 'respostas'} · atividade ${quando}`;
}

function destinoDaBusca(resultado: ResultadoDeBusca): string {
  if (resultado.tipo === 'pessoa') return `/u/${encodeURIComponent(resultado.handle ?? '')}`;
  if (resultado.tipo === 'comunidade') return `/c/${encodeURIComponent(resultado.comunidadeSlug ?? '')}`;
  return `/c/${encodeURIComponent(resultado.comunidadeSlug ?? '')}/t/${encodeURIComponent(resultado.id)}`;
}

interface Props {
  readonly portaForum?: PortaDeForum;
  readonly portaConta?: PortaDeConta;
  readonly portaPerfil?: PortaDePerfil;
  readonly ambiente?: AmbienteDoForum;
}

/** Descoberta no mesmo casco da Tropa; apenas a leitura do fórum é compartilhada. */
export function TelaExplorarOpenDesign({ portaForum, portaConta, portaPerfil, ambiente: ambienteProp }: Props) {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [forum] = useState(() => portaForum ?? criarForumWeb());
  const [conta] = useState(() => portaConta ?? criarContaWeb());
  const [perfilPort] = useState(() => portaPerfil ?? criarPerfilRemoto());
  const [ambiente] = useState(() => ambienteProp ?? criarAmbienteDoForumWeb());
  const [comunidades, setComunidades] = useState<readonly ComunidadeDoForum[]>([]);
  const [faseComunidades, setFaseComunidades] = useState<Fase>('carregando');
  const [tentativaComunidades, setTentativaComunidades] = useState(0);
  const [autenticado, setAutenticado] = useState(false);
  const [meuPerfil, setMeuPerfil] = useState<PerfilPublico | null>(null);
  const online = useOnline(ambiente);
  const [rascunho, setRascunho] = useState(params.get('q') ?? '');
  const [topicos, setTopicos] = useState<readonly TopicoDoExplorar[]>([]);
  const [cursor, setCursor] = useState<CursorDoForum | null>(null);
  const [fase, setFase] = useState<Fase>('carregando');
  const [tentativa, setTentativa] = useState(0);
  const [carregandoMais, setCarregandoMais] = useState(false);
  const [falhouAoCarregarMais, setFalhouAoCarregarMais] = useState(false);
  const [busca, setBusca] = useState<readonly ResultadoDeBusca[]>([]);
  const [proximaBusca, setProximaBusca] = useState<number | null>(null);
  const [faseBusca, setFaseBusca] = useState<Fase>('carregando');
  const [tentativaBusca, setTentativaBusca] = useState(0);
  const [carregandoMaisBusca, setCarregandoMaisBusca] = useState(false);
  const [falhouAoCarregarMaisBusca, setFalhouAoCarregarMaisBusca] = useState(false);

  const termo = (params.get('q') ?? '').trim();
  const ordem = ordemDaUrl(params.get('ordem'));
  const tipo = tipoDaUrl(params.get('tipo'));
  const buscaValida = termo.length >= TAMANHO_MINIMO_DA_BUSCA && Boolean(forum.buscarNoAue);

  useEffect(() => {
    let ativo = true;
    setFaseComunidades('carregando');
    void forum.listarComunidadesDoForum().then((resultado) => {
      if (!ativo) return;
      if (!resultado.ok) { setFaseComunidades('erro'); return; }
      setComunidades(resultado.valor);
      setFaseComunidades('pronto');
    }).catch(() => { if (ativo) setFaseComunidades('erro'); });
    return () => { ativo = false; };
  }, [forum, tentativaComunidades]);

  useEffect(() => {
    let ativo = true;
    void conta.estado().then(async (estado) => {
      if (!ativo) return;
      const entrou = estado.temSessao && !estado.anonima && !estado.perfilSocialPendente;
      setAutenticado(entrou);
      if (entrou) setMeuPerfil(await perfilPort.obterMeuPerfil().catch(() => null));
    }).catch(() => { if (ativo) setAutenticado(false); });
    return () => { ativo = false; };
  }, [conta, perfilPort]);

  useEffect(() => {
    setRascunho(params.get('q') ?? '');
  }, [params]);

  useEffect(() => {
    if (buscaValida) return;
    let ativo = true;
    setFase('carregando');
    setTopicos([]);
    setCursor(null);
    setFalhouAoCarregarMais(false);
    void forum.explorarTopicos({ ordem, limite: 30, cursor: null }).then((resultado) => {
      if (!ativo) return;
      if (!resultado.ok) { setFase('erro'); return; }
      setTopicos(resultado.valor.itens);
      setCursor(resultado.valor.proximo);
      setFase('pronto');
    }).catch(() => { if (ativo) setFase('erro'); });
    return () => { ativo = false; };
  }, [forum, ordem, buscaValida, tentativa]);

  useEffect(() => {
    if (!buscaValida || !forum.buscarNoAue) return;
    let ativo = true;
    setFaseBusca('carregando');
    setBusca([]);
    setProximaBusca(null);
    setFalhouAoCarregarMaisBusca(false);
    void forum.buscarNoAue({ termo, tipo }).then((resultado) => {
      if (!ativo) return;
      if (!resultado.ok) { setFaseBusca('erro'); return; }
      setBusca(resultado.valor.itens);
      setProximaBusca(resultado.valor.proximo);
      setFaseBusca('pronto');
    }).catch(() => { if (ativo) setFaseBusca('erro'); });
    return () => { ativo = false; };
  }, [forum, buscaValida, termo, tipo, tentativaBusca]);

  const parametrosDaLista = useMemo(() => (ordem === 'recentes' ? { ordem: 'novos' } : {}), [ordem]);
  const atualizarBusca = (mudanca: Record<string, string | undefined>) => {
    const proximo = new URLSearchParams(params);
    Object.entries(mudanca).forEach(([chave, valor]) => valor ? proximo.set(chave, valor) : proximo.delete(chave));
    setParams(proximo, { replace: false });
  };
  const enviarBusca = (evento: FormEvent) => {
    evento.preventDefault();
    const proximo = rascunho.trim();
    atualizarBusca({ q: proximo || undefined, tipo: proximo.length >= TAMANHO_MINIMO_DA_BUSCA ? tipo : undefined });
  };
  const carregarMais = async () => {
    if (!cursor || carregandoMais) return;
    setCarregandoMais(true);
    setFalhouAoCarregarMais(false);
    try {
      const resultado = await forum.explorarTopicos({ ordem, limite: 30, cursor });
      if (!resultado.ok) { setFalhouAoCarregarMais(true); return; }
      setTopicos((atuais) => [...atuais, ...resultado.valor.itens.filter((item) => !atuais.some((atual) => atual.id === item.id))]);
      setCursor(resultado.valor.proximo);
    } catch { setFalhouAoCarregarMais(true); } finally { setCarregandoMais(false); }
  };
  const carregarMaisBusca = async () => {
    if (proximaBusca === null || carregandoMaisBusca || !forum.buscarNoAue) return;
    setCarregandoMaisBusca(true);
    setFalhouAoCarregarMaisBusca(false);
    try {
      const resultado = await forum.buscarNoAue({ termo, tipo, deslocamento: proximaBusca });
      if (!resultado.ok) { setFalhouAoCarregarMaisBusca(true); return; }
      setBusca((atuais) => [...atuais, ...resultado.valor.itens.filter((item) => !atuais.some((atual) => `${atual.tipo}-${atual.id}` === `${item.tipo}-${item.id}`))]);
      setProximaBusca(resultado.valor.proximo);
    } catch { setFalhouAoCarregarMaisBusca(true); } finally { setCarregandoMaisBusca(false); }
  };

  const mensagemDeErro = online ? 'Deu ruim pra carregar o que está acontecendo.' : 'Sem internet.';
  return (
    <div className="app od-explore" data-testid="explorar-opendesign">
      <BarraLateral viewAtual="explorar" comunidades={comunidades} estaAutenticado={autenticado}
        aoMudarView={() => undefined} aoAbrirCompositor={() => navigate('/arena')} aoSair={async () => { await conta.sair(); navigate('/'); }}
        aoEntrar={() => navigate('/login?modo=entrar')} />
      <main className="od-explore__main">
        <BarraSuperior busca={rascunho} estaAutenticado={autenticado} meuPerfil={meuPerfil} aoBuscar={setRascunho} aoEntrar={() => navigate('/login?modo=entrar')} mostrarBusca={false} />
        <section className="od-explore__content" aria-labelledby="explorar-titulo">
          <header className="od-explore__head">
            <p className="od-explore__eyebrow">Descoberta</p>
            <h1 id="explorar-titulo">Explorar</h1>
            <p>Encontre pessoas, rodas e conversas que já estão acontecendo.</p>
          </header>
          <form className="od-explore__search" role="search" onSubmit={enviarBusca}>
            <label htmlFor="explorar-busca">Buscar pessoas, rodas e publicações</label>
            <div><input id="explorar-busca" type="search" value={rascunho} maxLength={60} onChange={(evento) => setRascunho(evento.target.value)} placeholder="Buscar no Auê" />
              <button type="submit">Buscar</button></div>
            {termo !== '' && termo.length < TAMANHO_MINIMO_DA_BUSCA && <p role="status">Digite pelo menos {TAMANHO_MINIMO_DA_BUSCA} letras.</p>}
          </form>
          {buscaValida ? (
            <section className="od-explore__results" aria-label={`Resultados para ${termo}`}>
              <div className="od-explore__tabs" role="tablist" aria-label="Tipo de resultado">
                {([['pessoas', 'Pessoas'], ['comunidades', 'Rodas'], ['topicos', 'Publicações']] as const).map(([id, rotulo]) => <button key={id} type="button" role="tab" aria-selected={id === tipo} onClick={() => atualizarBusca({ tipo: id })}>{rotulo}</button>)}
              </div>
              {faseBusca === 'carregando' && <p className="od-explore__status" aria-busy="true">Buscando…</p>}
              {faseBusca === 'erro' && <div className="od-explore__state" role="alert"><h2>{online ? 'Não deu pra buscar agora.' : 'Sem internet.'}</h2><p>Nada foi perdido. Tenta de novo.</p><button type="button" onClick={() => setTentativaBusca((atual) => atual + 1)}>Tentar de novo</button></div>}
              {faseBusca === 'pronto' && busca.length === 0 && <div className="od-explore__state"><h2>Nada encontrado para “{termo}”.</h2><p>Confere a grafia ou tenta outra palavra.</p></div>}
              {faseBusca === 'pronto' && busca.length > 0 && <ul className="od-explore__list">{busca.map((resultado) => <li key={`${resultado.tipo}-${resultado.id}`}><Link to={destinoDaBusca(resultado)}>{resultado.tipo === 'pessoa' ? <><strong>{resultado.apelido ?? `@${resultado.handle}`}</strong><span>@{resultado.handle}</span></> : resultado.tipo === 'comunidade' ? <strong>{resultado.titulo}</strong> : <><strong>{resultado.titulo}</strong><span>em {resultado.comunidadeNome} · por {resultado.apelido ?? resultado.handle}</span></>}</Link></li>)}</ul>}
              {faseBusca === 'pronto' && proximaBusca !== null && <div className="od-explore__more-wrap">{falhouAoCarregarMaisBusca && <p role="status">Não deu pra carregar mais. Tenta de novo.</p>}<button className="od-explore__more" type="button" onClick={() => void carregarMaisBusca()} disabled={carregandoMaisBusca}>{carregandoMaisBusca ? 'Carregando…' : falhouAoCarregarMaisBusca ? 'Tentar de novo' : 'Ver mais'}</button></div>}
            </section>
          ) : (
            <>
              <div className="od-explore__toolbar"><Link to="/comunidades">Ver comunidades</Link><div aria-label="Ordenar tópicos"><button type="button" aria-pressed={ordem === 'atividade'} onClick={() => atualizarBusca({ ordem: undefined })}>Atividade recente</button><button type="button" aria-pressed={ordem === 'recentes'} onClick={() => atualizarBusca(parametrosDaLista)}>Mais novos</button></div></div>
              {fase === 'carregando' && <p className="od-explore__status" aria-busy="true">Carregando conversas…</p>}
              {fase === 'erro' && <div className="od-explore__state" role="alert"><h2>{mensagemDeErro}</h2><p>{online ? 'Nada foi perdido. Tenta de novo.' : 'Confere a conexão e tenta de novo.'}</p><button type="button" onClick={() => setTentativa((atual) => atual + 1)}>Tentar de novo</button></div>}
              {fase === 'pronto' && topicos.length === 0 && <div className="od-explore__state"><h2>Nada rolando por aí ainda.</h2><p>Entra numa comunidade e abre o primeiro tópico.</p><Link to="/comunidades">Ver comunidades</Link></div>}
              {fase === 'pronto' && topicos.length > 0 && <ul className="od-explore__list">{topicos.map((topico) => <li key={topico.id}><Link className="od-explore__topic" to={`/c/${encodeURIComponent(topico.comunidade.slug)}/t/${encodeURIComponent(topico.id)}`}><strong>{topico.titulo}</strong></Link><Link className="od-explore__community" to={`/c/${encodeURIComponent(topico.comunidade.slug)}`}>{topico.comunidade.nome}</Link><span>{metaDeTopico(topico)}{topico.status === 'fechado' ? ' · Fechado' : ''}</span></li>)}</ul>}
              {fase === 'pronto' && cursor && <div className="od-explore__more-wrap">{falhouAoCarregarMais && <p role="status">Não deu pra carregar mais tópicos. Tenta de novo.</p>}<button className="od-explore__more" type="button" onClick={() => void carregarMais()} disabled={carregandoMais}>{carregandoMais ? 'Carregando…' : falhouAoCarregarMais ? 'Tentar de novo' : 'Ver mais tópicos'}</button></div>}
            </>
          )}
        </section>
      </main>
      <PainelDireito comunidades={comunidades} viewAtual="explorar" estadoDasComunidades={faseComunidades} aoTentarComunidades={() => setTentativaComunidades((atual) => atual + 1)} aoAbrirComunidade={() => undefined} />
    </div>
  );
}
