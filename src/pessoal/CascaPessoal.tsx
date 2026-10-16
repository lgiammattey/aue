import { useCallback, useMemo, useState } from 'react';
import { Arena } from '../arena/Arena';
import type { AdaptadoresDaArena } from '../arena/adaptadores';
import { guardarRegistro, lerRegistros, meusNumeros, CHAVE_DOS_REGISTROS, type RegistroPessoal } from '../nucleo/pessoal/registros';
import type { Nota } from '../portas/pontuacao';
import { formatarNota } from '../shared/formato/nota';

type Aba = 'arena' | 'historico' | 'x1' | 'mais';
const ESCONDEM_BARRA = new Set(['RECORDING', 'JUDGING', 'REMATCH']);
const CHAVE_X1 = 'aue.x1-local.v1';

export function CascaPessoal({ adaptadores }: { adaptadores: AdaptadoresDaArena }) {
  const [aba, setAba] = useState<Aba>('arena');
  const [estado, setEstado] = useState('IDLE');
  const [pedidoArrotar, setPedidoArrotar] = useState(0);
  const [x1, setX1] = useState<readonly { codigo: string; link: string }[]>(() => {
    try { const valor: unknown = JSON.parse(adaptadores.armazenamento.ler(CHAVE_X1) ?? '[]'); return Array.isArray(valor) ? valor.filter((item): item is { codigo: string; link: string } => !!item && typeof item.codigo === 'string' && typeof item.link === 'string') : []; } catch { return []; }
  });
  const [registros, setRegistros] = useState<readonly RegistroPessoal[]>(() => lerRegistros(adaptadores.armazenamento.ler(CHAVE_DOS_REGISTROS)));
  const registrar = useCallback((nota: Nota, origem: string, instante: number) => {
    setRegistros((atuais) => {
      const proximo = guardarRegistro(atuais, { id: `${instante}:${nota.nota}`, instante, nota: nota.nota, origem, medidas: nota.medidas });
      adaptadores.armazenamento.gravar(CHAVE_DOS_REGISTROS, JSON.stringify(proximo));
      return proximo;
    });
  }, [adaptadores]);
  const numeros = useMemo(() => meusNumeros(registros), [registros]);
  const semBarra = ESCONDEM_BARRA.has(estado);
  const guardarX1 = useCallback((codigo: string, link: string) => setX1((atuais) => { const proximo = atuais.some((item) => item.codigo === codigo) ? atuais : [{ codigo, link }, ...atuais]; adaptadores.armazenamento.gravar(CHAVE_X1, JSON.stringify(proximo)); return proximo; }), [adaptadores]);
  return <main className="casca-pessoal">
    {aba === 'arena' ? <Arena adaptadores={adaptadores} aoConcluirNota={registrar} aoMudarEstado={setEstado} pedidoParaArrotar={pedidoArrotar} aoX1Local={guardarX1} /> : null}
    {aba === 'historico' ? <section className="painel-pessoal"><h1>Seus arrotos</h1>{registros.length ? <ol className="historico-pessoal">{registros.map((r) => <li key={r.id}><time dateTime={new Date(r.instante).toISOString()}>{new Date(r.instante).toLocaleDateString('pt-BR')} · {new Date(r.instante).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</time><b>{formatarNota(r.nota)}</b><span>{r.origem}</span></li>)}</ol> : <p>Ainda não tem arroto salvo neste aparelho.</p>}</section> : null}
    {aba === 'x1' ? <section className="painel-pessoal"><h1>X1</h1>{x1.length ? <ul>{x1.map((item) => <li key={item.codigo}><a href={`/b/${item.codigo}`}>{item.codigo}</a></li>)}</ul> : <p>Nenhuma briga criada ou aberta neste aparelho.</p>}</section> : null}
    {aba === 'mais' ? <section className="painel-pessoal"><h1>Mais</h1>{numeros ? <dl className="numeros-pessoais"><div><dt>Melhor score</dt><dd>{formatarNota(numeros.melhor)}</dd></div><div><dt>Maior fôlego</dt><dd>{numeros.maiorFolego}</dd></div><div><dt>Mais grave</dt><dd>{numeros.maisGrave}</dd></div><div><dt>Total</dt><dd>{numeros.total}</dd></div><div><dt>Origem mais usada</dt><dd>{numeros.origemMaisUsada}</dd></div></dl> : <p>Seus números aparecem depois do primeiro arroto.</p>}<a href="/como-jogar">Como jogar</a><a href="/privacidade">Privacidade</a><a href="/termos">Termos</a></section> : null}
    {!semBarra ? <nav aria-label="Navegação principal" className="tabs-pessoais"><button type="button" aria-current={aba === 'arena' ? 'page' : undefined} onClick={() => setAba('arena')}>Arena</button><button type="button" aria-current={aba === 'historico' ? 'page' : undefined} onClick={() => setAba('historico')}>Histórico</button>{aba === 'arena' ? <span className="tab-centro" aria-hidden="true" /> : <button type="button" className="tab-arrotar" onClick={() => { setAba('arena'); setPedidoArrotar((atual) => atual + 1); }}>ARROTAR</button>}<button type="button" aria-current={aba === 'x1' ? 'page' : undefined} onClick={() => setAba('x1')}>X1</button><button type="button" aria-current={aba === 'mais' ? 'page' : undefined} onClick={() => setAba('mais')}>Mais</button></nav> : null}
  </main>;
}
