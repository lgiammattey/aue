/** Fixture visual: dados sintéticos e operações em memória, sem rede. */
import { createRoot } from 'react-dom/client';
import { CriarDueloV2, ResponderDueloV2 } from '../src/arena/v2/duelo/DueloV2';
import { MeusDuelosV2 } from '../src/arena/v2/duelo/MeusDuelosV2';
import type { DueloV2 } from '../src/portas/dueloV2';
import type { Compartilhamento } from '../src/portas/compartilhamento';
import '../src/index.css';

const parametros = new URLSearchParams(window.location.search);
const estado = parametros.get('estado') ?? 'criar';
const token = 'a'.repeat(64);
const resultado = { criador: { duracaoMs: 1200 }, desafiante: { duracaoMs: 1830 }, resultadoProvisorio: 'desafiante', ladoSessao: 'desafiante', versaoRegua: 'experimental-2', origemMedicao: 'cliente_nao_verificada' } as const;
function audioSintetico() {
  const taxa = 8000; const amostras = taxa; const dados = new ArrayBuffer(44 + amostras * 2); const visao = new DataView(dados);
  const texto = (offset: number, valor: string) => [...valor].forEach((letra, i) => visao.setUint8(offset + i, letra.charCodeAt(0)));
  texto(0, 'RIFF'); visao.setUint32(4, 36 + amostras * 2, true); texto(8, 'WAVE'); texto(12, 'fmt '); visao.setUint32(16, 16, true); visao.setUint16(20, 1, true); visao.setUint16(22, 1, true); visao.setUint32(24, taxa, true); visao.setUint32(28, taxa * 2, true); visao.setUint16(32, 2, true); visao.setUint16(34, 16, true); texto(36, 'data'); visao.setUint32(40, amostras * 2, true);
  for (let i = 0; i < amostras; i++) visao.setInt16(44 + i * 2, Math.sin(i * 0.2) * 8000, true);
  return new Blob([dados], { type: 'audio/wav' });
}
const duelo = {
  abrir: async () => ({ ok: true, valor: estado === 'placar' ? 'respondido' : 'aguardando_resposta' }),
  revelar: async () => ({ ok: true, valor: resultado }),
  baixarAudio: async () => ({ ok: true, valor: audioSintetico() }),
  novoToken: () => ({ ok: true, valor: token }),
  iniciarEnvioGravacao: () => ({ resultado: Promise.resolve({ ok: true, valor: { id: 'sintetico' } }), cancelar: async () => ({ ok: true, valor: 'cancelada_local' }) }),
  criar: async () => ({ ok: true, valor: { estado: 'aguardando_resposta', id: 'duelo-sintetico', versao: 1, prazo: '2027-01-01' } }),
  listarMeusDuelos: async () => ({ ok: true, valor: { itens: [], temMais: false } }),
} as unknown as DueloV2;
const compartilhar = { compartilhar: async () => ({ ok: false, motivo: 'cancelado' }), copiar: async () => true, sabeMandarImagem: () => false } as Compartilhamento;
const props = { duelo, compartilhar, origem: 'https://exemplo.invalid', aoNovoDesafio: () => {}, aoVoltar: () => {} };

createRoot(document.getElementById('root')!).render(<div className="duelo-v2__pagina"><header className="duelo-v2__cabecalho"><a href="/">AUÊ!</a><span>PRÉVIA · DADOS SIMULADOS</span></header>
  {estado === 'criar' ? <CriarDueloV2 duelo={duelo} compartilhar={compartilhar} origem="https://exemplo.invalid" tentativa={{ audio: new Blob(['exemplo']), duracaoMs: 1200 }} aoVoltar={() => {}} />
    : estado === 'meus' ? <MeusDuelosV2 {...props} />
      : <ResponderDueloV2 {...props} token={token} tentativa={null} aoGravar={() => {}} />}
</div>);
