import { useCallback, useEffect, useRef, useState } from 'react';
import type { DueloV2, MeuDueloV2, RecuperacaoV2 } from '../../../portas/dueloV2';
import type { Compartilhamento } from '../../../portas/compartilhamento';
import { criarEnderecoLocal, soltarEnderecoLocal } from '../../../plataforma/web/enderecoDeAudio';
import './dueloV2.css';

interface Props { readonly duelo: DueloV2; readonly aoVoltar: () => void; readonly compartilhar?: Compartilhamento; readonly origem?: string }
type Lado = 'criador' | 'desafiante';

const rotuloEstado: Record<MeuDueloV2['estado'], string> = {
  aguardando_resposta: 'Aguardando resposta', respondido: 'Respondido', revogado: 'Convite revogado',
  expirado: 'Convite expirado', indisponivel: 'Indisponível',
};
const prazo = (data: string) => new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(data));
const duracao = (ms: number) => `${(ms / 1000).toFixed(2).replace('.', ',')} s`;

/** Tela isolada; usa apenas a identidade atual e nunca recupera o token do convite. */
export function MeusDuelosV2({ duelo, aoVoltar, compartilhar, origem }: Props) {
  const [itens, setItens] = useState<readonly MeuDueloV2[]>([]);
  const [mais, setMais] = useState(false);
  const [lista, setLista] = useState<'carregando' | 'pronta' | 'falha'>('carregando');
  const [selecionado, setSelecionado] = useState<MeuDueloV2 | null>(null);
  const [recuperacao, setRecuperacao] = useState<RecuperacaoV2 | null>(null);
  const [abrindo, setAbrindo] = useState(false);
  const [erro, setErro] = useState('');
  const [aviso, setAviso] = useState('');
  const [ocupado, setOcupado] = useState(false);
  const [link, setLink] = useState('');
  const [confirmarExclusao, setConfirmarExclusao] = useState(false);
  const [denunciaAberta, setDenunciaAberta] = useState(false);
  const [motivo, setMotivo] = useState<'' | 'ofensivo' | 'outro'>('');
  const operacao = useRef(false);
  const reemissao = useRef<{ token: string; versao: number } | null>(null);
  const [audio, setAudio] = useState<{ lado: Lado; dados: Blob } | null>(null);
  const [endereco, setEndereco] = useState<string | null>(null);
  const geracao = useRef(0);
  const listaEmVoo = useRef(false);
  const audioGeracao = useRef(0);

  const carregar = useCallback(async (deslocamento: number) => {
    if (listaEmVoo.current) return;
    listaEmVoo.current = true;
    const atual = geracao.current;
    setLista('carregando');
    try {
      const resposta = await duelo.listarMeusDuelos(deslocamento);
      if (atual !== geracao.current) return;
      if (!resposta.ok) { setLista('falha'); return; }
      setItens(anteriores => deslocamento === 0 ? resposta.valor.itens : [...anteriores, ...resposta.valor.itens]);
      setMais(resposta.valor.temMais); setLista('pronta');
    } catch { if (atual === geracao.current) setLista('falha'); }
    finally { listaEmVoo.current = false; }
  }, [duelo]);

  useEffect(() => {
    geracao.current++; listaEmVoo.current = false;
    void carregar(0);
    return () => { geracao.current++; audioGeracao.current++; };
  }, [carregar]);
  useEffect(() => {
    if (!audio) return;
    const url = criarEnderecoLocal(audio.dados); setEndereco(url);
    return () => soltarEnderecoLocal(url);
  }, [audio]);

  const abrir = async (item: MeuDueloV2) => {
    const atual = ++geracao.current; audioGeracao.current++;
    reemissao.current = null; setLink(''); setAviso(''); setConfirmarExclusao(false); setDenunciaAberta(false); setMotivo('');
    setSelecionado(item); setRecuperacao(null); setAudio(null); setEndereco(null); setErro(''); setAbrindo(true);
    try {
      const resposta = await duelo.recuperar(item.id);
      if (atual !== geracao.current) return;
      if (!resposta.ok) { setErro('Não foi possível abrir o desafio. Tente novamente.'); return; }
      setRecuperacao(resposta.valor);
    } catch { if (atual === geracao.current) setErro('Não foi possível abrir o desafio. Tente novamente.'); }
    finally { if (atual === geracao.current) setAbrindo(false); }
  };
  const voltarParaLista = () => {
    geracao.current++; audioGeracao.current++;
    reemissao.current = null; setLink(''); setAviso(''); setSelecionado(null); setRecuperacao(null); setAudio(null); setEndereco(null); setErro(''); setAbrindo(false);
    void carregar(0);
  };
  const ouvir = async (lado: Lado) => {
    if (!selecionado || recuperacao?.estado !== 'revelado') return;
    const atual = ++audioGeracao.current;
    setErro('');
    try {
      const resposta = await duelo.baixarAudioRecuperado(selecionado.id, lado);
      if (atual !== audioGeracao.current) return;
      if (!resposta.ok) { setErro('Não foi possível carregar esse áudio. Tente novamente.'); return; }
      setAudio({ lado, dados: resposta.valor }); setEndereco(null);
    } catch { if (atual === audioGeracao.current) setErro('Não foi possível carregar esse áudio. Tente novamente.'); }
  };

  const executar = async (acao: () => Promise<void>) => {
    if (operacao.current) return;
    operacao.current = true; setOcupado(true); setAviso('');
    try { await acao(); } catch { setAviso('Não foi possível confirmar. Tente novamente.'); }
    finally { operacao.current = false; setOcupado(false); }
  };
  const reemitir = () => void executar(async () => {
    if (!selecionado || !recuperacao || !('versao' in recuperacao) || !origem) return;
    if (!reemissao.current) {
      const token = duelo.novoToken();
      if (!token.ok) { setAviso('Não foi possível preparar o convite. Tente novamente.'); return; }
      reemissao.current = { token: token.valor, versao: recuperacao.versao };
    }
    const pedido = reemissao.current;
    // O servidor pode girar o token mesmo se a resposta se perder.
    setLink('');
    const resposta = await duelo.reemitir(selecionado.gravacaoPropriaId, pedido.token, pedido.versao);
    if (!resposta.ok) { setAviso('Não foi possível confirmar o novo convite. O link anterior pode ter deixado de funcionar. Tente novamente.'); return; }
    setRecuperacao(resposta.valor);
    if (resposta.valor.estado === 'aguardando_resposta') {
      setLink(`${origem.replace(/\/$/, '')}/duelo#t=${pedido.token}`);
      setAviso('Novo convite pronto. O link anterior deixou de funcionar.');
    } else setAviso('O estado do desafio mudou. Abra novamente para atualizar.');
    reemissao.current = null;
  });
  const revogar = () => void executar(async () => {
    if (!selecionado || !recuperacao || !('versao' in recuperacao)) return;
    const resposta = await duelo.revogar(selecionado.gravacaoPropriaId, recuperacao.versao);
    if (!resposta.ok) { setAviso('Não foi possível confirmar a revogação. Tente novamente.'); return; }
    setRecuperacao(resposta.valor); setLink(''); reemissao.current = null;
    setAviso(resposta.valor.estado === 'revogado' ? 'Convite revogado.' : 'O estado do desafio mudou. Abra novamente para atualizar.');
  });
  const excluir = () => void executar(async () => {
    if (!selecionado) return;
    const resposta = await duelo.removerGravacao(selecionado.gravacaoPropriaId);
    if (!resposta.ok) { setAviso('Não foi possível confirmar a exclusão. Tente novamente.'); return; }
    setLink(''); setAudio(null); setEndereco(null); audioGeracao.current++;
    if (resposta.valor === 'removida') { setRecuperacao({ estado: 'indisponivel' }); setConfirmarExclusao(false); setAviso('Gravação excluída.'); }
    else setAviso('Exclusão pendente. Para pedir ajuda, use o contato na política de privacidade.');
  });
  const denunciar = () => void executar(async () => {
    if (!selecionado || !motivo) return;
    const alvo = selecionado.lado === 'criador' ? 'desafiante' : 'criador';
    const resposta = await duelo.denunciarPorDuelo(selecionado.id, alvo, motivo);
    if (!resposta.ok) { setAviso('Não foi possível confirmar a denúncia. Tente novamente.'); return; }
    if (resposta.valor === 'registrada') { audioGeracao.current++; setAudio(null); setEndereco(null); }
    setDenunciaAberta(false);
    setAviso(resposta.valor === 'registrada' ? 'Denúncia registrada. O áudio ficará indisponível enquanto for analisado.' : resposta.valor === 'ja_analisada' ? 'Você já denunciou este áudio e a denúncia foi analisada.' : 'Este áudio está indisponível para denúncia.');
  });
  const copiar = () => void executar(async () => { setAviso(await compartilhar?.copiar(link) ? 'Link copiado.' : 'Não foi possível copiar o link.'); });
  const mandar = () => void executar(async () => {
    if (!compartilhar) return;
    const resposta = await compartilhar.compartilhar({ url: link, titulo: 'Desafio Auê', texto: 'Você foi desafiado no Auê. Grave sua resposta para revelar o confronto.' });
    setAviso(resposta.ok ? 'A opção de compartilhar foi aberta.' : resposta.motivo === 'cancelado' ? 'Compartilhamento cancelado.' : 'Não foi possível abrir o compartilhamento. Copie o link.');
  });

  const proprio = selecionado?.lado;
  const outro = proprio === 'criador' ? 'desafiante' : 'criador';
  const resultado = recuperacao?.estado === 'revelado' ? recuperacao.resultado : null;
  return <section className="duelo-v2" aria-labelledby="meus-duelos-titulo">
    <h2 id="meus-duelos-titulo">MEUS DESAFIOS</h2>
    <p>Mostramos os desafios da sessão atual. Se você usa uma sessão anônima, limpar os dados do navegador ou trocar de aparelho pode fazer você perder o acesso.</p>
    {!selecionado && <>
      {lista === 'carregando' && <p role="status">Carregando desafios…</p>}
      {lista === 'falha' && <><p role="alert">Não foi possível carregar seus desafios. Tente novamente.</p><button type="button" onClick={() => void carregar(itens.length)}>Tentar novamente</button></>}
      {lista === 'pronta' && itens.length === 0 && <p>Nenhum desafio encontrado nesta sessão.</p>}
      {itens.length > 0 && <ol>{itens.map((item, indice) => <li key={item.id}>
        <p>Desafio {indice + 1} · {rotuloEstado[item.estado]}</p><p>Prazo do convite: {prazo(item.prazo)}</p>
        <button type="button" disabled={lista === 'carregando'} onClick={() => void abrir(item)}>Abrir desafio {indice + 1}</button>
      </li>)}</ol>}
      {mais && lista === 'pronta' && <button type="button" onClick={() => void carregar(itens.length)}>Carregar mais</button>}
      <button type="button" onClick={aoVoltar}>Voltar</button>
    </>}
    {selecionado && <>
      {abrindo && <p role="status">Abrindo desafio…</p>}
      {recuperacao?.estado === 'indisponivel' && <p>Este desafio está indisponível.</p>}
      {recuperacao && recuperacao.estado !== 'revelado' && recuperacao.estado !== 'indisponivel' && <>
        <p>{recuperacao.estado === 'aguardando_resposta' ? 'Aguardando resposta.' : recuperacao.estado === 'respondido' ? 'Respondido.' : recuperacao.estado === 'revogado' ? 'Convite revogado.' : recuperacao.estado === 'expirado' ? 'Convite expirado.' : 'O estado do desafio mudou. Atualize e tente novamente.'}</p>
        <p>Prazo do convite: {prazo(recuperacao.prazo)}</p>
        {recuperacao.estado === 'aguardando_resposta' && !link && <p>O link original não pode ser recuperado aqui.</p>}
        {selecionado.lado === 'criador' && (recuperacao.estado === 'aguardando_resposta' || recuperacao.estado === 'revogado') && origem && compartilhar && <>
          <p>Um novo convite desativa o link anterior.</p><button type="button" disabled={ocupado} onClick={reemitir}>Gerar novo convite</button>
          {recuperacao.estado === 'aguardando_resposta' && <button type="button" disabled={ocupado} onClick={revogar}>Revogar convite</button>}
        </>}
        {link && <><label>Link do desafio<input readOnly value={link} /></label><button type="button" disabled={ocupado} onClick={mandar}>Compartilhar convite</button><button type="button" disabled={ocupado} onClick={copiar}>Copiar link</button></>}
      </>}
      {resultado && proprio && <>
        <h3>RESULTADO PROVISÓRIO</h3><p>As medições são informadas pelos aparelhos e ainda não foram verificadas.</p>
        <dl><div><dt>Você</dt><dd>{duracao(resultado[proprio].duracaoMs)}</dd></div><div><dt>Adversário</dt><dd>{duracao(resultado[outro].duracaoMs)}</dd></div></dl>
        <p>{resultado.resultadoProvisorio === 'empate' ? 'Empate.' : resultado.resultadoProvisorio === proprio ? 'Você levou esta rodada.' : 'Seu adversário levou esta rodada.'}</p>
        <button type="button" onClick={() => void ouvir(proprio)}>Ouvir minha tentativa</button><button type="button" onClick={() => void ouvir(outro)}>Ouvir adversário</button>
        {!denunciaAberta && <button type="button" disabled={ocupado} onClick={() => setDenunciaAberta(true)}>Denunciar áudio do adversário</button>}
        {denunciaAberta && <fieldset disabled={ocupado}><legend>Por que você quer denunciar este áudio?</legend><label><input type="radio" name="motivo-recuperado" value="ofensivo" checked={motivo === 'ofensivo'} onChange={() => setMotivo('ofensivo')} />Conteúdo ofensivo</label><label><input type="radio" name="motivo-recuperado" value="outro" checked={motivo === 'outro'} onChange={() => setMotivo('outro')} />Outro motivo</label><button type="button" disabled={!motivo} onClick={denunciar}>Enviar denúncia</button><button type="button" onClick={() => setDenunciaAberta(false)}>Cancelar denúncia</button></fieldset>}
        {audio && endereco && <audio aria-label={audio.lado === proprio ? 'Sua gravação' : 'Áudio do adversário'} controls preload="metadata" src={endereco} />}
      </>}
      {recuperacao && <>{!confirmarExclusao ? <button type="button" disabled={ocupado} onClick={() => setConfirmarExclusao(true)}>Excluir minha gravação</button> : <><p>Excluir sua gravação impede o acesso a ela e pode tornar o desafio indisponível.</p><button type="button" disabled={ocupado} onClick={excluir}>Confirmar exclusão</button><button type="button" disabled={ocupado} onClick={() => setConfirmarExclusao(false)}>Cancelar exclusão</button></>}</>}
      {aviso && <p role="status">{aviso}</p>}
      {erro && <><p role="alert">{erro}</p>{!recuperacao && <button type="button" onClick={() => void abrir(selecionado)}>Tentar novamente</button>}</>}
      <button type="button" disabled={ocupado} onClick={voltarParaLista}>Voltar para desafios</button>
    </>}
  </section>;
}
