import { useState } from 'react';
import type { Compartilhamento } from '../../../portas/compartilhamento';
import type { RevelacaoV2 } from '../../../portas/dueloV2';

interface Props {
  readonly resultado: RevelacaoV2;
  readonly compartilhar?: Compartilhamento;
  readonly origem?: string;
  readonly aoNovoDesafio?: () => void;
}

/** A revanche começa um desafio novo; a escolha de destinatário continua com a pessoa. */
export function ProximosPassosDuelo({ resultado, compartilhar, origem, aoNovoDesafio }: Props) {
  const [previaAberta, setPreviaAberta] = useState(false);
  const [aviso, setAviso] = useState('');
  const tempo = (ms: number) => `${(ms / 1000).toFixed(2).replace('.', ',')} s`;
  const vencedor = resultado.resultadoProvisorio === 'empate' ? 'Empate.' : resultado.resultadoProvisorio === 'criador' ? 'Quem criou venceu.' : 'Quem respondeu venceu.';
  const texto = `Resultado provisório no Auê: quem criou ${tempo(resultado.criador.duracaoMs)} × ${tempo(resultado.desafiante.duracaoMs)} quem respondeu. ${vencedor} Medições ainda não verificadas.`;
  const enviar = async () => {
    if (!compartilhar) return;
    try {
      const resposta = await compartilhar.compartilhar({ titulo: 'Resultado do desafio Auê', texto, url: origem });
      setAviso(resposta.ok ? 'Opções de compartilhamento abertas.' : resposta.motivo === 'cancelado' ? 'Compartilhamento cancelado.' : 'Não foi possível abrir o compartilhamento. Copie o texto.');
    } catch { setAviso('Não foi possível abrir o compartilhamento. Copie o texto.'); }
  };
  const copiar = async () => {
    try { setAviso(await compartilhar?.copiar(texto) ? 'Texto copiado.' : 'Não foi possível copiar o texto.'); }
    catch { setAviso('Não foi possível copiar o texto.'); }
  };
  if (!aoNovoDesafio && !compartilhar) return null;
  return <section className="duelo-v2__proximos" aria-label="Depois do resultado">
    {aoNovoDesafio && <><button type="button" className="duelo-v2__principal" onClick={aoNovoDesafio}>Pedir revanche</button><p>Grave um novo desafio e envie para a mesma pessoa. A nova disputa não fica ligada a este placar.</p></>}
    {compartilhar && <><button type="button" onClick={() => { setPreviaAberta(!previaAberta); setAviso(''); }} aria-expanded={previaAberta}>Compartilhar resultado</button>
      {previaAberta && <div className="duelo-v2__previa"><p>Texto para compartilhar:</p><p>{texto}</p>{origem && <p>Link: {origem}</p>}<button type="button" onClick={() => void enviar()}>Abrir compartilhamento</button><button type="button" onClick={() => void copiar()}>Copiar texto</button></div>}
    </>}
    {aviso && <p role="status">{aviso}</p>}
  </section>;
}
