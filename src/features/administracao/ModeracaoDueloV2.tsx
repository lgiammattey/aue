import { useCallback, useEffect, useRef, useState } from 'react';
import { criarModeracaoDueloV2 } from '../../plataforma/web/moderacaoDueloV2';
import { criarEnderecoLocal, soltarEnderecoLocal } from '../../plataforma/web/enderecoDeAudio';
import type { DenunciaDueloV2, ModeracaoDueloV2 as Porta } from '../../portas/moderacaoDueloV2';

export function ModeracaoDueloV2({ porta }: { readonly porta?: Porta }) {
  const [servico] = useState(() => porta ?? criarModeracaoDueloV2());
  const [lista, setLista] = useState<readonly DenunciaDueloV2[]>([]);
  const [estado, setEstado] = useState<'carregando' | 'pronto' | 'erro'>('carregando');
  const [aviso, setAviso] = useState('');
  const [ocupado, setOcupado] = useState(false);
  const [audio, setAudio] = useState<{ id: string; dados: Blob } | null>(null);
  const [endereco, setEndereco] = useState<string | null>(null);
  const [confirmacao, setConfirmacao] = useState<{ id: string; decisao: 'mantida' | 'restaurada' } | null>(null);
  const geracao = useRef(0); const emVoo = useRef(false);
  const carregar = useCallback(async () => {
    const atual = ++geracao.current; setEstado('carregando'); setAudio(null); setEndereco(null);
    try { const itens = await servico.listar(); if (atual === geracao.current) { setLista(itens); setEstado('pronto'); } }
    catch { if (atual === geracao.current) setEstado('erro'); }
  }, [servico]);
  useEffect(() => { void carregar(); return () => { geracao.current++; }; }, [carregar]);
  useEffect(() => { if (!audio) return; const local = criarEnderecoLocal(audio.dados); setEndereco(local); return () => soltarEnderecoLocal(local); }, [audio]);
  const ouvir = async (id: string) => {
    if (emVoo.current) return;
    emVoo.current = true; setOcupado(true); setAviso(''); setAudio(null); setEndereco(null);
    const atual = ++geracao.current;
    try { const dados = await servico.ouvir(id); if (atual === geracao.current) setAudio({ id, dados }); }
    catch { if (atual === geracao.current) setAviso('Não foi possível abrir o áudio. Ele pode ter sido excluído.'); }
    finally { emVoo.current = false; if (atual === geracao.current) setOcupado(false); }
  };
  const decidir = async () => {
    if (!confirmacao || emVoo.current) return;
    emVoo.current = true; setOcupado(true); setAviso(''); setAudio(null); setEndereco(null);
    try {
      await servico.decidir(confirmacao.id, confirmacao.decisao);
      setConfirmacao(null); setAviso('Decisão registrada.'); await carregar();
    } catch { setAviso('Não foi possível confirmar a decisão. Atualize a fila antes de tentar de novo.'); }
    finally { emVoo.current = false; setOcupado(false); }
  };
  return <section className="admin__bloco" aria-labelledby="moderacao-duelo-titulo">
    <h2 id="moderacao-duelo-titulo">Denúncias de desafios</h2>
    <p>Ouça apenas para revisar. A exclusão solicitada pelo dono prevalece.</p>
    {estado === 'carregando' && <p role="status">Carregando denúncias…</p>}
    {estado === 'erro' && <p role="alert">Não foi possível carregar as denúncias.</p>}
    {estado === 'pronto' && lista.length === 0 && <p>Nenhuma denúncia pendente.</p>}
    {estado === 'pronto' && lista.length > 0 && <ol>{lista.map((item, indice) => <li key={item.id}>
      <p>Denúncia {indice + 1} · {item.motivo === 'ofensivo' ? 'Conteúdo ofensivo' : 'Outro motivo'} · <time dateTime={item.criadoEm}>{new Date(item.criadoEm).toLocaleString('pt-BR')}</time></p>
      <button type="button" className="admin__button admin__button--outline" disabled={ocupado || !item.audioDisponivel} onClick={() => void ouvir(item.id)}>Ouvir áudio {indice + 1}</button>
      {!item.audioDisponivel && <p>Áudio indisponível ou excluído.</p>}
      {audio?.id === item.id && endereco && <audio controls preload="metadata" aria-label={`Áudio denunciado ${indice + 1}`} src={endereco} />}
      <button type="button" disabled={ocupado} onClick={() => setConfirmacao({ id: item.id, decisao: 'mantida' })}>Manter oculto</button>
      <button type="button" disabled={ocupado || !item.audioDisponivel} onClick={() => setConfirmacao({ id: item.id, decisao: 'restaurada' })}>Restaurar áudio</button>
      {confirmacao?.id === item.id && <div><p>{confirmacao.decisao === 'mantida' ? 'Manter este áudio oculto?' : 'Restaurar o acesso a este áudio? Outras denúncias ainda podem mantê-lo oculto.'}</p><button type="button" disabled={ocupado} onClick={() => void decidir()}>Confirmar decisão</button><button type="button" disabled={ocupado} onClick={() => setConfirmacao(null)}>Cancelar</button></div>}
    </li>)}</ol>}
    {aviso && <p role="status">{aviso}</p>}
    <button type="button" className="admin__button admin__button--outline" disabled={ocupado} onClick={() => void carregar()}>Atualizar denúncias</button>
  </section>;
}
