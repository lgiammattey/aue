import { useCallback, useEffect, useState } from 'react';
import { criarAdministracaoWeb } from '../../plataforma/web/administracao';
import type { MonetizacaoAdministrativa, PortaDeAdministracao, ResumoAdministrativo } from '../../portas/administracao';
import './TelaAdministracao.css';

interface Props {
  readonly porta?: PortaDeAdministracao;
}

const EVENTOS: ReadonlyArray<readonly [string, string]> = [
  ['abriu_arena', 'Abriu a Arena'],
  ['iniciou_arroto', 'Começou um arroto'],
  ['recebeu_nota', 'Recebeu uma nota'],
  ['compartilhou', 'Compartilhou'],
  ['criou_x1', 'Criou um X1'],
  ['respondeu_x1', 'Respondeu um X1'],
  ['pediu_revanche', 'Pediu revanche'],
];

function numero(valor: number): string {
  return new Intl.NumberFormat('pt-BR').format(valor);
}

function dataCurta(valor: string): string {
  const data = new Date(`${valor}T12:00:00`);
  return Number.isNaN(data.getTime()) ? valor : new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' }).format(data);
}

function CartaoDeMetrica({ titulo, valor, apoio }: { readonly titulo: string; readonly valor: number; readonly apoio: string }) {
  return <article className="admin-metrica">
    <p>{titulo}</p>
    <strong>{numero(valor)}</strong>
    <span>{apoio}</span>
  </article>;
}

export function TelaAdministracao({ porta }: Props) {
  const [portaDeAdministracao] = useState(() => porta ?? criarAdministracaoWeb());
  const [resumo, setResumo] = useState<ResumoAdministrativo | null>(null);
  const [monetizacao, setMonetizacao] = useState<MonetizacaoAdministrativa | null>(null);
  const [estadoDaMonetizacao, setEstadoDaMonetizacao] = useState<'carregando' | 'pronto' | 'indisponivel'>('carregando');
  const [estado, setEstado] = useState<'carregando' | 'pronto' | 'indisponivel'>('carregando');

  const carregar = useCallback(async () => {
    setEstado('carregando');
    try {
      const res = await portaDeAdministracao.obterResumo();
      setResumo(res);
      setEstado('pronto');
      setEstadoDaMonetizacao('carregando');
      try {
        setMonetizacao(await portaDeAdministracao.obterMonetizacao());
        setEstadoDaMonetizacao('pronto');
      } catch {
        setMonetizacao(null);
        setEstadoDaMonetizacao('indisponivel');
      }
    } catch {
      // A resposta é intencionalmente neutra: não revela se a rota existe ou
      // se a pessoa autenticada não tem permissão no banco.
      setResumo(null);
      setEstado('indisponivel');
    }
  }, [portaDeAdministracao]);

  useEffect(() => { void carregar(); }, [carregar]);

  if (estado === 'carregando') {
    return <main className="admin" aria-busy="true"><p className="admin__state">Carregando painel…</p></main>;
  }

  if (estado === 'indisponivel' || !resumo) {
    return <main className="admin">
      <section className="admin__state" aria-live="polite">
        <h1>Esta página não está disponível agora.</h1>
        <p>Tente de novo em instantes.</p>
        <button type="button" className="admin__button admin__button--outline" onClick={() => void carregar()}>Tentar novamente</button>
      </section>
    </main>;
  }

  return <main className="admin">
    <header className="admin__header">
      <div>
        <p className="admin__eyebrow">Administração</p>
        <h1>Como está a roda</h1>
        <p>Dados do período: {dataCurta(resumo.inicio)} a {dataCurta(resumo.fim)}.</p>
      </div>
      <button type="button" className="admin__button admin__button--outline" onClick={() => void carregar()}>Atualizar</button>
    </header>

    <section className="admin__metricas" aria-label="Resumo de cadastros">
      <CartaoDeMetrica titulo="Contas de e-mail" valor={resumo.totalContasDeEmailAtual} apoio="total agora" />
      <CartaoDeMetrica titulo="Cadastros acompanhados" valor={resumo.cadastrosNoPeriodo} apoio={resumo.acompanhamentoDeCadastrosIniciadoEm ? `desde ${dataCurta(resumo.acompanhamentoDeCadastrosIniciadoEm)}` : 'acompanhamento ainda não iniciado'} />
      <CartaoDeMetrica titulo="Perfis concluídos" valor={resumo.perfisConcluidosNoPeriodo} apoio="no período" />
      <CartaoDeMetrica titulo="Ficha pendente" valor={resumo.perfisPendentesAtuais} apoio="agora" />
    </section>

    <section className="admin__section" aria-labelledby="admin-eventos">
      <div className="admin__section-head"><h2 id="admin-eventos">Movimento na Arena</h2><span>sessões, não pessoas únicas</span></div>
      <div className="admin__eventos">
        {EVENTOS.map(([chave, rotulo]) => <div key={chave}><span>{rotulo}</span><strong>{numero(resumo.eventos[chave] ?? 0)}</strong></div>)}
      </div>
      <p className="admin__note">A telemetria é anônima e best-effort. Ela não mede retenção nem pessoas únicas.</p>
    </section>

    <section className="admin__section" aria-labelledby="admin-dias">
      <div className="admin__section-head"><h2 id="admin-dias">Últimos dias</h2><span>eventos recebidos</span></div>
      {resumo.eventosPorDia.length === 0 ? <p className="admin__empty">Ainda não há eventos no período.</p> : (
        <div className="admin__dias" role="list">
          {resumo.eventosPorDia.map((dia) => <div role="listitem" key={dia.data}>
            <time dateTime={dia.data}>{dataCurta(dia.data)}</time>
            <span>Arena {numero(dia.abriuArena)}</span><span>Notas {numero(dia.recebeuNota)}</span><span>X1 {numero(dia.criouX1 + dia.respondeuX1)}</span>
          </div>)}
        </div>
      )}
    </section>

    <section className="admin__section" aria-labelledby="admin-monetizacao">
      <div className="admin__section-head"><h2 id="admin-monetizacao">Monetização</h2><span>Adsterra, últimos 30 dias</span></div>
      {estadoDaMonetizacao === 'carregando' && <p className="admin__empty">Carregando métricas de monetização…</p>}
      {estadoDaMonetizacao === 'indisponivel' && <p className="admin__empty">Não foi possível carregar as métricas de monetização agora.</p>}
      {estadoDaMonetizacao === 'pronto' && monetizacao && <div className="admin__metricas" style={{ margin: '14px 0 0' }}>
        <article className="admin-metrica"><p>Receita estimada</p><strong>$ {monetizacao.receitaTotal.toFixed(2)}</strong><span>{dataCurta(monetizacao.inicio)} a {dataCurta(monetizacao.fim)}</span></article>
        <article className="admin-metrica"><p>Impressões</p><strong>{numero(monetizacao.totalImpressoes)}</strong><span>visualizações de anúncios</span></article>
        <article className="admin-metrica"><p>Cliques e CPM</p><strong>{numero(monetizacao.totalCliques)}</strong><span>CPM: $ {monetizacao.cpmMedio.toFixed(2)}</span></article>
      </div>}
    </section>

    <section className="admin__section" aria-labelledby="admin-pessoas">
      <div className="admin__section-head"><h2 id="admin-pessoas">Entradas recentes</h2><span>sem e-mail, ID ou áudio</span></div>
      {resumo.pessoas.length === 0 ? <p className="admin__empty">Ainda não há cadastros para mostrar.</p> : (
        <ul className="admin__pessoas">
          {resumo.pessoas.map((pessoa, indice) => <li key={`${pessoa.handle ?? pessoa.apelido ?? 'conta'}-${pessoa.criadoEm}-${indice}`}>
            <div><strong>{pessoa.apelido ?? 'Sem apelido'}</strong>{pessoa.handle && <span>@{pessoa.handle}</span>}</div>
            <time dateTime={pessoa.criadoEm}>{dataCurta(pessoa.criadoEm.slice(0, 10))}</time>
            <em>{pessoa.estado === 'perfil_pronto' ? 'Perfil pronto' : 'Ficha pendente'}</em>
          </li>)}
        </ul>
      )}
    </section>
  </main>;
}
