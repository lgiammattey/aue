import { useEffect, useRef, useState } from 'react';
import { criarForumWeb } from '../../plataforma/web/forum';
import { criarReprodutorDoTop } from '../../plataforma/web/reprodutorDoTop';
import type { ArrotadorDoTop, PortaDeForum } from '../../portas/forum';
import { TopArrotadores } from './TopArrotadores';
import './TopArrotadores.css';

/** O ranking é público. Busca uma URL curta para cada áudio somente ao ouvi-lo. */
export function TopArrotadoresDaHome({ porta: fornecida }: { readonly porta?: PortaDeForum }) {
  const [porta] = useState(() => fornecida ?? criarForumWeb());
  const [estado, setEstado] = useState<'carregando' | 'pronto' | 'erro'>('carregando');
  const [pessoas, setPessoas] = useState<readonly ArrotadorDoTop[]>([]);
  const [tentativa, setTentativa] = useState(0);
  const [tocando, setTocando] = useState<string | null>(null);
  const [erroAudio, setErroAudio] = useState(false);
  const pedido = useRef(0);
  const reprodutor = useRef<ReturnType<typeof criarReprodutorDoTop> | null>(null);
  useEffect(() => {
    let ativo = true;
    setEstado('carregando');
    void porta.listarTopArrotadores?.().then((res) => {
      if (!ativo) return;
      if (res.ok) { setPessoas(res.valor); setEstado('pronto'); }
      else setEstado('erro');
    }).catch(() => { if (ativo) setEstado('erro'); });
    if (!porta.listarTopArrotadores) setEstado('erro');
    return () => { ativo = false; };
  }, [porta, tentativa]);
  useEffect(() => () => { pedido.current++; reprodutor.current?.soltar(); }, []);
  async function ouvir(pessoa: ArrotadorDoTop) {
    const chave = `top-${pessoa.alvoTipo}-${pessoa.alvoId}`;
    const atual = ++pedido.current;
    setErroAudio(false);
    if (chave === tocando) { reprodutor.current?.pausar(); setTocando(null); return; }
    reprodutor.current?.pausar();
    setTocando(null);
    try {
      let endereco: string | null = null;
      if (pessoa.fonte === 'arena') {
        const audios = await porta.listarAudioDosTopicos?.([pessoa.alvoId]);
        const caminho = audios?.ok ? audios.valor.find((a) => a.topicoId === pessoa.alvoId)?.audio.caminhoDoAudio : null;
        if (caminho && porta.assinarAudioDoResultado) endereco = await porta.assinarAudioDoResultado(caminho);
      } else {
        const anexos = await porta.listarAnexosDoForum?.(pessoa.alvoTipo === 'topico'
          ? { topicoIds: [pessoa.alvoId] } : { respostaIds: [pessoa.alvoId] });
        const anexo = anexos?.ok ? anexos.valor.find((a) => a.alvo === pessoa.alvoTipo && a.alvoId === pessoa.alvoId && a.tipo === 'audio') : null;
        if (anexo?.tipo === 'audio' && porta.assinarAnexoDoForum) {
          const url = await porta.assinarAnexoDoForum(anexo.caminho);
          if (url.ok) endereco = url.valor;
        }
      }
      if (!endereco) throw new Error('Áudio indisponível');
      if (atual !== pedido.current) return;
      reprodutor.current ??= criarReprodutorDoTop(() => setTocando(null));
      await reprodutor.current.tocar(endereco);
      if (atual === pedido.current) setTocando(chave);
    } catch { if (atual === pedido.current) setErroAudio(true); }
  }
  return <div className="top-arrotadores-home">
    <TopArrotadores estado={estado} pessoas={pessoas} audioTocandoId={tocando} aoOuvir={(pessoa) => void ouvir(pessoa)} aoTentar={() => setTentativa((n) => n + 1)} />
    {erroAudio && <p role="status">Não deu para ouvir esse arroto agora. Tente novamente.</p>}
  </div>;
}
