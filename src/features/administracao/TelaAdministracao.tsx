import { useCallback, useEffect, useRef, useState } from 'react';

import { criarAdministracaoWeb } from '../../plataforma/web/administracao';
import type { EventosDiariosDoPainel, MonetizacaoAdministrativa, PortaDeAdministracao, ResumoAdministrativo } from '../../portas/administracao';
import './TelaAdministracao.css';

interface Props { readonly porta?: PortaDeAdministracao; }

const PERIODOS = [7, 30, 90] as const;
const NOMES_DAS_PAGINAS: Readonly<Record<string, string>> = {
  feed: 'Feed', comunidades: 'Diretório', comunidade: 'Comunidades', topico: 'Tópicos', explorar: 'Explorar', arena: 'Arena', perfil: 'Perfis', entrada: 'Entrada', publica: 'Páginas públicas',
};

function numero(valor: number): string { return new Intl.NumberFormat('pt-BR').format(valor); }
function dataCurta(valor: string): string {
  const data = new Date(`${valor.slice(0, 10)}T12:00:00`);
  return Number.isNaN(data.getTime()) ? valor : new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' }).format(data);
}
function dataLocal(data: Date): string { return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}-${String(data.getDate()).padStart(2, '0')}`; }
function intervalo(dias: number): { inicio: string; fim: string } {
  const fim = new Date(); fim.setHours(12, 0, 0, 0);
  const inicio = new Date(fim); inicio.setDate(inicio.getDate() - (dias - 1));
  return { inicio: dataLocal(inicio), fim: dataLocal(fim) };
}
function percentual(numerador: number, denominador: number): string { return denominador === 0 ? '—' : `${Math.round((numerador / denominador) * 100)}%`; }

function CartaoDeMetrica({ titulo, valor, apoio, destaque = false }: { readonly titulo: string; readonly valor: number; readonly apoio: string; readonly destaque?: boolean }) {
  return <article className={`admin-metrica${destaque ? ' admin-metrica--destaque' : ''}`}><p>{titulo}</p><strong>{numero(valor)}</strong><span>{apoio}</span></article>;
}

function GraficoDeAtividade({ dias }: { readonly dias: readonly EventosDiariosDoPainel[] }) {
  const tamanhoDaFaixa = Math.max(1, Math.ceil(dias.length / 14));
  const serie = [];
  for (let inicio = 0; inicio < dias.length; inicio += tamanhoDaFaixa) {
    const faixa = dias.slice(inicio, inicio + tamanhoDaFaixa);
    const somar = (campo: Exclude<keyof EventosDiariosDoPainel, 'data'>) => faixa.reduce((total, dia) => total + dia[campo], 0);
    serie.push({
      data: faixa[0].data, fim: faixa[faixa.length - 1].data,
      abriuArena: somar('abriuArena'), acessosDePaginas: somar('acessosDePaginas'),
      topicosPublicados: somar('topicosPublicados'), respostasPublicadas: somar('respostasPublicadas'),
    });
  }
  const maximo = Math.max(1, ...serie.map((dia) => dia.abriuArena + dia.acessosDePaginas + dia.topicosPublicados + dia.respostasPublicadas));
  const houveAtividade = serie.some((dia) => dia.abriuArena + dia.acessosDePaginas + dia.topicosPublicados + dia.respostasPublicadas > 0);
  if (!houveAtividade) return <p className="admin__empty">Ainda não entrou atividade nesse intervalo.</p>;
  return <div className="admin-grafico" role="img" aria-label="Atividade no período: Arena, acessos de página, tópicos e respostas">
    <div className="admin-grafico__legenda"><span><i className="admin-grafico__ponto admin-grafico__ponto--arena" />Arena</span><span><i className="admin-grafico__ponto admin-grafico__ponto--acesso" />Acessos</span><span><i className="admin-grafico__ponto admin-grafico__ponto--topico" />Tópicos</span><span><i className="admin-grafico__ponto admin-grafico__ponto--resposta" />Respostas</span></div>
    <div className="admin-grafico__barras">{serie.map((dia) => {
      const total = dia.abriuArena + dia.acessosDePaginas + dia.topicosPublicados + dia.respostasPublicadas;
      const rotulo = dia.data === dia.fim ? dataCurta(dia.data) : `${dataCurta(dia.data)} a ${dataCurta(dia.fim)}`;
      return <div className="admin-grafico__dia" key={dia.data} title={`${rotulo} · ${numero(dia.abriuArena)} Arena · ${numero(dia.acessosDePaginas)} acessos · ${numero(dia.topicosPublicados)} tópicos · ${numero(dia.respostasPublicadas)} respostas`}>
        <div className="admin-grafico__pilha" style={{ height: `${Math.max(3, (total / maximo) * 100)}%` }}>
          {dia.abriuArena > 0 && <i className="admin-grafico__barra admin-grafico__barra--arena" style={{ flexGrow: dia.abriuArena }} />}
          {dia.acessosDePaginas > 0 && <i className="admin-grafico__barra admin-grafico__barra--acesso" style={{ flexGrow: dia.acessosDePaginas }} />}
          {dia.topicosPublicados > 0 && <i className="admin-grafico__barra admin-grafico__barra--topico" style={{ flexGrow: dia.topicosPublicados }} />}
          {dia.respostasPublicadas > 0 && <i className="admin-grafico__barra admin-grafico__barra--resposta" style={{ flexGrow: dia.respostasPublicadas }} />}
        </div><time dateTime={dia.data}>{rotulo}</time>
      </div>;
    })}</div>
  </div>;
}

function AcessosPorPagina({ resumo }: { readonly resumo: ResumoAdministrativo }) {
  const maior = Math.max(1, ...resumo.acessosPorPagina.map((item) => item.acessos));
  if (resumo.acessosPorPagina.length === 0) return <p className="admin__empty">{resumo.acompanhamentoDeAcessosIniciadoEm ? 'Nenhum acesso registrado neste período.' : 'A coleta de acessos ainda não está disponível.'}</p>;
  return <ol className="admin-ranking">{resumo.acessosPorPagina.map((item) => <li key={item.pagina}><span>{NOMES_DAS_PAGINAS[item.pagina] ?? item.pagina}</span><div aria-hidden="true"><i style={{ width: `${Math.max(4, (item.acessos / maior) * 100)}%` }} /></div><strong>{numero(item.acessos)}</strong></li>)}</ol>;
}

export function TelaAdministracao({ porta }: Props) {
  const [portaDeAdministracao] = useState(() => porta ?? criarAdministracaoWeb());
  const [resumo, setResumo] = useState<ResumoAdministrativo | null>(null);
  const [monetizacao, setMonetizacao] = useState<MonetizacaoAdministrativa | null>(null);
  const [estadoDaMonetizacao, setEstadoDaMonetizacao] = useState<'carregando' | 'pronto' | 'indisponivel'>('carregando');
  const [estado, setEstado] = useState<'carregando' | 'pronto' | 'indisponivel'>('carregando');
  const [periodo, setPeriodo] = useState<(typeof PERIODOS)[number]>(30);
  const consultaAtual = useRef(0);
  const carregar = useCallback(async (dias: (typeof PERIODOS)[number]) => {
    const consulta = ++consultaAtual.current;
    setEstado('carregando');
    try {
      const faixa = intervalo(dias);
      const proximoResumo = await portaDeAdministracao.obterResumo(faixa.inicio, faixa.fim);
      if (consulta !== consultaAtual.current) return;
      setResumo(proximoResumo); setEstado('pronto'); setEstadoDaMonetizacao('carregando');
      try {
        const proximaMonetizacao = await portaDeAdministracao.obterMonetizacao();
        if (consulta !== consultaAtual.current) return;
        setMonetizacao(proximaMonetizacao); setEstadoDaMonetizacao('pronto');
      } catch {
        if (consulta !== consultaAtual.current) return;
        setMonetizacao(null); setEstadoDaMonetizacao('indisponivel');
      }
    } catch {
      if (consulta !== consultaAtual.current) return;
      setResumo(null); setEstado('indisponivel');
    }
  }, [portaDeAdministracao]);
  useEffect(() => { void carregar(30); }, [carregar]);
  const selecionarPeriodo = (dias: (typeof PERIODOS)[number]) => { setPeriodo(dias); void carregar(dias); };

  if (estado === 'carregando' && !resumo) return <main className="admin" aria-busy="true"><p className="admin__state">Carregando o pulso do Auê…</p></main>;
  if (estado === 'indisponivel' || !resumo) return <main className="admin"><section className="admin__state" aria-live="polite"><h1>Este painel não está disponível agora.</h1><p>Tente de novo em instantes.</p><button type="button" className="admin__button admin__button--outline" onClick={() => void carregar(periodo)}>Tentar novamente</button></section></main>;

  const abriuArena = resumo.eventos.abriu_arena ?? 0;
  const recebeuNota = resumo.eventos.recebeu_nota ?? 0;
  const x1 = (resumo.eventos.criou_x1 ?? 0) + (resumo.eventos.respondeu_x1 ?? 0);
  const larguraDoFunil = (valor: number) => `${abriuArena === 0 ? 0 : Math.min(100, Math.round((valor / abriuArena) * 100))}%`;
  return <main className="admin">
    <header className="admin__header"><div><p className="admin__eyebrow">Administração · dados agregados</p><h1>O pulso do Auê</h1><p>{dataCurta(resumo.inicio)} a {dataCurta(resumo.fim)} · atualização manual</p></div><div className="admin__acoes"><div className="admin__periodos" aria-label="Intervalo do painel">{PERIODOS.map((dias) => <button key={dias} type="button" className={dias === periodo ? 'ativo' : ''} onClick={() => selecionarPeriodo(dias)}>{dias}d</button>)}</div><button type="button" className="admin__button admin__button--outline" onClick={() => void carregar(periodo)}>Atualizar</button></div></header>
    <section className="admin__metricas" aria-label="Números principais"><CartaoDeMetrica titulo="Acessos de página" valor={resumo.acessosDePaginasNoPeriodo} destaque apoio={resumo.acompanhamentoDeAcessosIniciadoEm ? `coleta desde ${dataCurta(resumo.acompanhamentoDeAcessosIniciadoEm)}` : 'coleta ainda não iniciada'} /><CartaoDeMetrica titulo="Cadastros" valor={resumo.cadastrosNoPeriodo} apoio={resumo.acompanhamentoDeCadastrosIniciadoEm ? `coleta desde ${dataCurta(resumo.acompanhamentoDeCadastrosIniciadoEm)}` : 'coleta ainda não iniciada'} /><CartaoDeMetrica titulo="Tópicos publicados" valor={resumo.topicosPublicadosNoPeriodo} apoio={`${numero(resumo.comunidadesAtivasNoPeriodo)} comunidades ativas`} /><CartaoDeMetrica titulo="Respostas" valor={resumo.respostasPublicadasNoPeriodo} apoio="conversas visíveis no período" /></section>
    <section className="admin__grade admin__grade--movimento" aria-label="Atividade e páginas"><article className="admin__bloco"><div className="admin__section-head"><div><p className="admin__eyebrow">Movimento</p><h2>Atividade no período</h2></div><span>alcance + conversa</span></div><GraficoDeAtividade dias={resumo.eventosPorDia} /></article><article className="admin__bloco"><div className="admin__section-head"><div><p className="admin__eyebrow">Alcance</p><h2>Páginas acessadas</h2></div><span>por sessão</span></div><AcessosPorPagina resumo={resumo} /></article></section>
    <section className="admin__grade" aria-label="Arena e base"><article className="admin__bloco"><div className="admin__section-head"><div><p className="admin__eyebrow">Arena</p><h2>Funil de arroto</h2></div><span>eventos recebidos</span></div><div className="admin-funil" role="img" aria-label={`Funil da Arena: ${abriuArena} aberturas, ${recebeuNota} notas e ${x1} movimentos em X1`}><div><span>Abriu a Arena</span><strong>{numero(abriuArena)}</strong><i className="admin-funil__barra" style={{ width: larguraDoFunil(abriuArena) }} /><em>base</em></div><div><span>Recebeu nota</span><strong>{numero(recebeuNota)}</strong><i className="admin-funil__barra" style={{ width: larguraDoFunil(recebeuNota) }} /><em>{percentual(recebeuNota, abriuArena)} da abertura</em></div><div><span>Movimento em X1</span><strong>{numero(x1)}</strong><i className="admin-funil__barra" style={{ width: larguraDoFunil(x1) }} /><em>{percentual(x1, recebeuNota)} das notas</em></div></div><p className="admin__note">Telemetria anônima e best-effort. Não mede pessoas únicas nem retenção.</p></article><article className="admin__bloco"><div className="admin__section-head"><div><p className="admin__eyebrow">Base</p><h2>Contas e perfis</h2></div><span>agora</span></div><dl className="admin-base admin-base--cinco"><div><dt>Contas de e-mail</dt><dd>{numero(resumo.totalContasDeEmailAtual)}</dd></div><div><dt>Ativas no período</dt><dd>{numero(resumo.contasAtivasNoPeriodo)}</dd></div><div><dt>Anônimas agora</dt><dd>{numero(resumo.contasAnonimasAtuais)}</dd></div><div><dt>Concluídos no período</dt><dd>{numero(resumo.perfisConcluidosNoPeriodo)}</dd></div><div><dt>Ficha pendente</dt><dd>{numero(resumo.perfisPendentesAtuais)}</dd></div></dl><p className="admin__note">Ativa = entrou ou participou no período. Anônima = identidade atual sem cadastro.</p></article></section>
    <section className="admin__grade admin__grade--final" aria-label="Monetização e entradas recentes"><article className="admin__bloco"><div className="admin__section-head"><div><p className="admin__eyebrow">Monetização</p><h2>Anúncios</h2></div><span>últimos 30 dias</span></div>{estadoDaMonetizacao === 'carregando' && <p className="admin__empty">Carregando métricas de monetização…</p>}{estadoDaMonetizacao === 'indisponivel' && <p className="admin__empty">Métricas de monetização indisponíveis agora.</p>}{estadoDaMonetizacao === 'pronto' && monetizacao && <dl className="admin-base admin-base--monetizacao"><div><dt>Receita estimada</dt><dd>$ {monetizacao.receitaTotal.toFixed(2)}</dd></div><div><dt>Impressões</dt><dd>{numero(monetizacao.totalImpressoes)}</dd></div><div><dt>Cliques</dt><dd>{numero(monetizacao.totalCliques)}</dd></div></dl>}</article><article className="admin__bloco"><div className="admin__section-head"><div><p className="admin__eyebrow">Entradas recentes</p><h2>Gente chegando</h2></div><span>sem e-mail ou ID</span></div>{resumo.pessoas.length === 0 ? <p className="admin__empty">Ainda não há cadastros para mostrar.</p> : <ul className="admin__pessoas">{resumo.pessoas.slice(0, 5).map((pessoa, indice) => <li key={`${pessoa.handle ?? pessoa.apelido ?? 'conta'}-${pessoa.criadoEm}-${indice}`}><div><strong>{pessoa.apelido ?? 'Sem apelido'}</strong>{pessoa.handle && <span>@{pessoa.handle}</span>}</div><time dateTime={pessoa.criadoEm}>{dataCurta(pessoa.criadoEm)}</time><em>{pessoa.estado === 'perfil_pronto' ? 'Perfil pronto' : 'Ficha pendente'}</em></li>)}</ul>}</article></section>
  </main>;
}
