import { useCallback, useEffect, useRef, useState } from 'react';
import type { Compartilhamento } from '../../../portas/compartilhamento';
import type { DueloV2, EnvioGravacaoV2, EstadoCancelamentoV2, RevelacaoV2 } from '../../../portas/dueloV2';
import { criarEnderecoLocal, soltarEnderecoLocal } from '../../../plataforma/web/enderecoDeAudio';
import { PlayerDeAudio } from '../PlayerDeAudio';
import { ProximosPassosDuelo } from './ProximosPassosDuelo';
import './dueloV2.css';

/** Áudio já revisado e com uma medição experimental disponível. */
export interface TentativaDoDuelo {
  readonly audio: Blob;
  readonly duracaoMs: number;
}

interface CriarProps {
  readonly duelo: DueloV2;
  readonly compartilhar: Compartilhamento;
  /** Origem explícita do ambiente em teste: nunca enviar um convite local para produção por engano. */
  readonly origem: string;
  readonly tentativa: TentativaDoDuelo;
  readonly aoVoltar: () => void;
}

type EstadoCriar = 'pronto' | 'enviando' | 'falhou_envio' | 'criando' | 'falhou_criacao' | 'falhou_descarte' | 'convite' | 'descarte' | 'encerrado';

function textoDoDescarte(valor: EstadoCancelamentoV2): string {
  if (valor === 'cancelada_local') return 'A tentativa foi cancelada antes do envio.';
  if (valor === 'preparacao_incerta') return 'Não foi possível confirmar o cancelamento no servidor. A tentativa pode precisar de limpeza posterior.';
  if (valor === 'removida') return 'A tentativa foi removida.';
  if (valor === 'bloqueio_nao_confirmado') return 'Não foi possível confirmar o bloqueio. Tente excluir novamente quando a conexão voltar.';
  return 'A exclusão ainda está pendente. Para pedir ajuda, use o contato na política de privacidade.';
}

/** Criação só começa após ação explícita. O token nunca contém marca nem áudio. */
export function CriarDueloV2({ duelo, compartilhar, origem, tentativa, aoVoltar }: CriarProps) {
  const [estado, setEstado] = useState<EstadoCriar>('pronto');
  const [mensagem, setMensagem] = useState('');
  const [link, setLink] = useState('');
  const [consentiu, setConsentiu] = useState(false);
  const gravacao = useRef<string | null>(null);
  const tentativaPendente = useRef<string | null>(null);
  const token = useRef<string | null>(null);
  const ocupado = useRef(false);
  const cancelando = useRef(false);
  const envioAtual = useRef<EnvioGravacaoV2 | null>(null);
  const montado = useRef(true);
  const geracaoEnvio = useRef(0);
  const envioEmCurso = useRef(false);
  useEffect(() => {
    montado.current = true;
    return () => {
      montado.current = false; geracaoEnvio.current++;
      if (envioEmCurso.current) {
        if (envioAtual.current) void envioAtual.current.cancelar().catch(() => {});
        else if (tentativaPendente.current) void duelo.descartarTentativa(tentativaPendente.current).catch(() => {});
      }
    };
  }, [duelo]);

  const criar = useCallback(async (id: string) => {
    if (!token.current) {
      const gerado = duelo.novoToken();
      if (!gerado.ok) { setMensagem('Não foi possível preparar o convite. Tente novamente.'); setEstado('falhou_criacao'); return; }
      token.current = gerado.valor;
    }
    setEstado('criando');
    const resultado = await duelo.criar(id, token.current);
    if (!montado.current) return;
    if (!resultado.ok) {
      setMensagem('Não foi possível confirmar o convite. Tente novamente com o mesmo link.');
      setEstado('falhou_criacao');
      return;
    }
    if (resultado.valor.estado !== 'aguardando_resposta') {
      setMensagem(resultado.valor.estado === 'respondido' ? 'Este duelo já foi respondido.' : 'Este convite não está disponível.');
      setEstado('encerrado');
      return;
    }
    setLink(`${origem.replace(/\/$/, '')}/duelo#t=${token.current}`);
    setMensagem('');
    setEstado('convite');
  }, [duelo, origem]);

  const enviar = useCallback(async () => {
    if (ocupado.current || !consentiu) return;
    ocupado.current = true;
    const atual = geracaoEnvio.current;
    setMensagem('');
    try {
      if (gravacao.current) { await criar(gravacao.current); return; }
      setEstado('enviando');
      const operacao = tentativaPendente.current ? null : duelo.iniciarEnvioGravacao(tentativa.audio, tentativa.duracaoMs);
      envioAtual.current = operacao; envioEmCurso.current = true;
      const resultado = operacao ? await operacao.resultado : await duelo.retomarEnvio(tentativaPendente.current!);
      if (!montado.current || atual !== geracaoEnvio.current) return;
      envioEmCurso.current = false; envioAtual.current = null;
      if (!resultado.ok) {
        tentativaPendente.current = resultado.tentativaId ?? null;
        setMensagem('Não foi possível confirmar o envio. Sua tentativa continua nesta tela.');
        setEstado('falhou_envio');
        return;
      }
      tentativaPendente.current = null;
      gravacao.current = resultado.valor.id;
      await criar(resultado.valor.id);
    } catch {
      if (montado.current && atual === geracaoEnvio.current) { envioEmCurso.current = false; setMensagem('Não foi possível concluir. Tente novamente.'); setEstado(gravacao.current ? 'falhou_criacao' : 'falhou_envio'); }
    } finally { ocupado.current = false; }
  }, [consentiu, criar, duelo, tentativa]);

  const cancelarEnvio = async () => {
    if (cancelando.current) return;
    cancelando.current = true; geracaoEnvio.current++; envioEmCurso.current = false; ocupado.current = false;
    setEstado('descarte');
    try {
      const resposta = envioAtual.current
        ? await envioAtual.current.cancelar()
        : tentativaPendente.current ? await duelo.descartarTentativa(tentativaPendente.current) : null;
      if (!montado.current) return;
      if (!resposta || !resposta.ok) { setMensagem('Não foi possível confirmar o cancelamento.'); setEstado('falhou_descarte'); return; }
      setMensagem(textoDoDescarte(resposta.valor));
      if (resposta.valor === 'cancelada_local' || resposta.valor === 'removida') {
        envioAtual.current = null; tentativaPendente.current = null; setEstado('encerrado');
      } else if (resposta.valor === 'preparacao_incerta') {
        // Sem ID confirmado não é possível dizer que o servidor apagou algo.
        setEstado('encerrado');
      } else setEstado('falhou_descarte');
    } catch { if (montado.current) { setMensagem('Não foi possível confirmar o cancelamento.'); setEstado('falhou_descarte'); } }
    finally { cancelando.current = false; }
  };

  const descartar = async () => {
    if (envioAtual.current) { await cancelarEnvio(); return; }
    if (ocupado.current) return;
    const idPendente = tentativaPendente.current;
    const idGravacao = gravacao.current;
    if (!idPendente && !idGravacao) { aoVoltar(); return; }
    ocupado.current = true;
    setEstado('descarte');
    try {
      const resultado = idPendente ? await duelo.descartarTentativa(idPendente) : await duelo.removerGravacao(idGravacao!);
      if (!montado.current) return;
      if (!resultado.ok) { setMensagem('Não foi possível confirmar a exclusão. Tente novamente.'); setEstado('falhou_descarte'); return; }
      setMensagem(textoDoDescarte(resultado.valor));
      if (resultado.valor === 'removida') {
        tentativaPendente.current = null; gravacao.current = null; token.current = null; setLink(''); setEstado('encerrado');
      } else { setEstado('falhou_descarte'); }
    } catch {
      if (montado.current) { setMensagem('Não foi possível confirmar a exclusão. Tente novamente.'); setEstado('falhou_descarte'); }
    } finally { ocupado.current = false; }
  };

  const copiar = async () => {
    try { setMensagem(await compartilhar.copiar(link) ? 'Link copiado.' : 'Não foi possível copiar.'); }
    catch { setMensagem('Não foi possível copiar.'); }
  };
  const mandar = async () => {
    try {
      const resultado = await compartilhar.compartilhar({ url: link, titulo: 'Desafio Auê', texto: 'Você foi desafiado no Auê. Grave sua resposta para revelar o confronto.' });
      setMensagem(resultado.ok ? 'A opção de compartilhar foi aberta.' : resultado.motivo === 'cancelado' ? 'Compartilhamento cancelado.' : 'Não foi possível abrir o compartilhamento. Copie o link.');
    } catch { setMensagem('Não foi possível abrir o compartilhamento. Copie o link.'); }
  };

  return <section className="duelo-v2" aria-labelledby="criar-duelo-titulo">
    <h2 id="criar-duelo-titulo">CHAME PARA O X1</h2>
    {estado === 'pronto' && <><p>Seu adversário grava antes de ouvir sua tentativa ou ver sua marca.</p><label><input type="checkbox" checked={consentiu} onChange={(evento) => setConsentiu(evento.target.checked)} /> Autorizo enviar minha gravação para o Auê e permitir que meu adversário a ouça após responder.</label><button type="button" className="duelo-v2__principal" disabled={!consentiu} onClick={() => void enviar()}>Criar desafio</button><button type="button" onClick={aoVoltar}>Voltar</button></>}
    {(estado === 'enviando' || estado === 'criando' || estado === 'descarte') && <p role="status">{estado === 'descarte' ? 'Solicitando exclusão…' : 'Preparando o desafio…'}</p>}
    {estado === 'enviando' && <button type="button" onClick={() => void cancelarEnvio()}>Cancelar envio</button>}
    {estado === 'falhou_descarte' && <button type="button" onClick={() => void descartar()}>Tentar excluir novamente</button>}
    {(estado === 'falhou_envio' || estado === 'falhou_criacao') && <><button type="button" onClick={() => void enviar()}>Tentar novamente</button><button type="button" onClick={() => void descartar()}>Desistir e excluir</button></>}
    {estado === 'convite' && <><p>Convite pronto. Só compartilhe com quem você quer desafiar.</p><label>Link do desafio<input readOnly value={link} /></label><button type="button" className="duelo-v2__principal" onClick={() => void mandar()}>Compartilhar convite</button><button type="button" onClick={() => void copiar()}>Copiar link</button><button type="button" onClick={() => void descartar()}>Excluir minha gravação</button></>}
    {estado === 'encerrado' && <button type="button" onClick={aoVoltar}>Voltar</button>}
    {mensagem && <p role="status">{mensagem}</p>}
  </section>;
}

interface ResponderProps {
  readonly duelo: DueloV2;
  readonly token: string;
  /** O pai abre a Arena para gravar; só passa a tentativa após revisão. */
  readonly tentativa: TentativaDoDuelo | null;
  readonly aoGravar: () => void;
  readonly aoVoltar: () => void;
  readonly compartilhar?: Compartilhamento;
  readonly origem?: string;
  readonly aoNovoDesafio?: () => void;
}

type EstadoResposta = 'abrindo' | 'aberto' | 'enviando' | 'falhou_envio' | 'respondendo' | 'falhou_resposta' | 'revelando' | 'falhou_revelacao' | 'revelado' | 'indisponivel' | 'descarte' | 'falhou_descarte';

/** O convite não lê o áudio do criador antes de uma resposta confirmada. */
export function ResponderDueloV2({ duelo, token, tentativa, aoGravar, aoVoltar, compartilhar, origem, aoNovoDesafio }: ResponderProps) {
  const [estado, setEstado] = useState<EstadoResposta>('abrindo');
  const [mensagem, setMensagem] = useState('');
  const [resultado, setResultado] = useState<RevelacaoV2 | null>(null);
  const [resultadoNeutro, setResultadoNeutro] = useState(false);
  const [consentiu, setConsentiu] = useState(false);
  const gravacao = useRef<string | null>(null);
  const tentativaPendente = useRef<string | null>(null);
  const ocupado = useRef(false);
  const cancelando = useRef(false);
  const envioAtual = useRef<EnvioGravacaoV2 | null>(null);
  const geracao = useRef(0);
  const envioEmCurso = useRef(false);

  const abrir = useCallback(async () => {
    const atual = ++geracao.current;
    setEstado('abrindo'); setMensagem('');
    try {
      const resposta = await duelo.abrir(token);
      if (atual !== geracao.current) return;
      if (!resposta.ok) { setEstado('indisponivel'); setMensagem('Não foi possível abrir o convite. Tente novamente.'); return; }
      if (resposta.valor === 'aguardando_resposta') { setEstado('aberto'); return; }
      if (resposta.valor === 'respondido') {
        setResultadoNeutro(true); setEstado('revelando');
        const revelacao = await duelo.revelar(token);
        if (atual !== geracao.current) return;
        if (!revelacao.ok) { setEstado('falhou_revelacao'); setMensagem('Não foi possível abrir o resultado. Tente novamente.'); return; }
        setResultadoNeutro(!revelacao.valor.ladoSessao); setResultado(revelacao.valor); setMensagem(''); setEstado('revelado');
        return;
      }
      setEstado('indisponivel'); setMensagem('Este convite expirou ou está indisponível.');
    } catch { if (atual === geracao.current) { setEstado('indisponivel'); setMensagem('Não foi possível abrir o convite. Tente novamente.'); } }
  }, [duelo, token]);
  useEffect(() => {
    void abrir();
    return () => {
      geracao.current++;
      if (envioEmCurso.current) {
        if (envioAtual.current) void envioAtual.current.cancelar().catch(() => {});
        else if (tentativaPendente.current) void duelo.descartarTentativa(tentativaPendente.current).catch(() => {});
      }
    };
  }, [abrir, duelo]);

  const revelar = useCallback(async () => {
    const atual = geracao.current;
    setEstado('revelando');
    try {
      const resposta = await duelo.revelar(token);
      if (atual !== geracao.current) return;
      if (!resposta.ok) { setEstado('falhou_revelacao'); setMensagem('Não foi possível abrir o resultado. Tente novamente.'); return; }
      setResultadoNeutro(!resposta.valor.ladoSessao && resultadoNeutro); setResultado(resposta.valor); setMensagem(''); setEstado('revelado');
    } catch { if (atual === geracao.current) { setEstado('falhou_revelacao'); setMensagem('Não foi possível abrir o resultado. Tente novamente.'); } }
  }, [duelo, token, resultadoNeutro]);

  const responder = useCallback(async () => {
    if (ocupado.current || !tentativa || !consentiu) return;
    ocupado.current = true; setMensagem('');
    const atual = geracao.current;
    try {
      if (!gravacao.current) {
        setEstado('enviando');
        const operacao = tentativaPendente.current ? null : duelo.iniciarEnvioGravacao(tentativa.audio, tentativa.duracaoMs);
        envioAtual.current = operacao; envioEmCurso.current = true;
        const envio = operacao ? await operacao.resultado : await duelo.retomarEnvio(tentativaPendente.current!);
        if (atual !== geracao.current) return;
        envioEmCurso.current = false; envioAtual.current = null;
        if (!envio.ok) { tentativaPendente.current = envio.tentativaId ?? null; setMensagem('Não foi possível confirmar sua gravação. Tente novamente.'); setEstado('falhou_envio'); return; }
        gravacao.current = envio.valor.id; tentativaPendente.current = null;
      }
      setEstado('respondendo');
      const resposta = await duelo.responder(token, gravacao.current);
      if (atual !== geracao.current) return;
      if (!resposta.ok) { setMensagem('Não foi possível confirmar sua resposta. Tente novamente.'); setEstado('falhou_resposta'); return; }
      if (resposta.valor !== 'respondido') {
        setEstado('indisponivel');
        setMensagem(resposta.valor === 'ocupado' ? 'Outra pessoa respondeu primeiro.' : resposta.valor === 'criador' ? 'Quem criou o duelo não pode responder ao próprio convite.' : 'Este convite expirou ou está indisponível.');
        return;
      }
      await revelar();
    } catch { if (atual === geracao.current) { envioEmCurso.current = false; setMensagem('Não foi possível concluir. Tente novamente.'); setEstado(gravacao.current ? 'falhou_resposta' : 'falhou_envio'); } }
    finally { ocupado.current = false; }
  }, [consentiu, duelo, revelar, tentativa, token]);

  const cancelarEnvio = async () => {
    if (cancelando.current) return;
    cancelando.current = true; geracao.current++; envioEmCurso.current = false; ocupado.current = false;
    const atual = geracao.current;
    setEstado('descarte');
    try {
      const resposta = envioAtual.current
        ? await envioAtual.current.cancelar()
        : tentativaPendente.current ? await duelo.descartarTentativa(tentativaPendente.current) : null;
      if (atual !== geracao.current) return;
      if (!resposta || !resposta.ok) { setMensagem('Não foi possível confirmar o cancelamento.'); setEstado('falhou_descarte'); return; }
      setMensagem(textoDoDescarte(resposta.valor));
      if (resposta.valor === 'cancelada_local' || resposta.valor === 'removida') {
        envioAtual.current = null; tentativaPendente.current = null; setEstado('indisponivel');
      } else if (resposta.valor === 'preparacao_incerta') setEstado('indisponivel');
      else setEstado('falhou_descarte');
    } catch { if (atual === geracao.current) { setMensagem('Não foi possível confirmar o cancelamento.'); setEstado('falhou_descarte'); } }
    finally { cancelando.current = false; }
  };

  const desistir = async () => {
    if (envioAtual.current) { await cancelarEnvio(); return; }
    if (ocupado.current) return;
    const id = tentativaPendente.current ?? gravacao.current;
    if (!id) { aoVoltar(); return; }
    ocupado.current = true; setEstado('descarte');
    try {
      const resposta = tentativaPendente.current ? await duelo.descartarTentativa(id) : await duelo.removerGravacao(id);
      if (!resposta.ok) { setMensagem('Não foi possível confirmar a exclusão. Tente novamente.'); setEstado('falhou_descarte'); return; }
      setMensagem(textoDoDescarte(resposta.valor));
      if (resposta.valor === 'removida') { tentativaPendente.current = null; gravacao.current = null; setEstado('indisponivel'); }
      else setEstado('falhou_descarte');
    } catch { setMensagem('Não foi possível confirmar a exclusão. Tente novamente.'); setEstado('falhou_descarte'); }
    finally { ocupado.current = false; }
  };

  return <section className="duelo-v2" aria-labelledby="responder-duelo-titulo">
    <h2 id="responder-duelo-titulo">{estado === 'revelado' ? 'PLACAR DO DESAFIO' : 'VOCÊ FOI DESAFIADO'}</h2>
    {estado === 'aberto' && <><p>Grave sua resposta para revelar o confronto.</p>{tentativa ? <><label><input type="checkbox" checked={consentiu} onChange={(evento) => setConsentiu(evento.target.checked)} /> Autorizo enviar minha gravação para o Auê e permitir que quem criou o desafio a ouça após minha resposta.</label><button type="button" className="duelo-v2__principal" disabled={!consentiu} onClick={() => void responder()}>Confirmar resposta</button></> : <button type="button" className="duelo-v2__principal" onClick={aoGravar}>Aceitar e gravar</button>}<button type="button" onClick={aoVoltar}>Voltar</button></>}
    {(estado === 'abrindo' || estado === 'enviando' || estado === 'respondendo' || estado === 'revelando' || estado === 'descarte') && <p role="status">{estado === 'descarte' ? 'Solicitando exclusão…' : 'Um instante…'}</p>}
    {estado === 'enviando' && <button type="button" onClick={() => void cancelarEnvio()}>Cancelar envio</button>}
    {estado === 'falhou_descarte' && <button type="button" onClick={() => void desistir()}>Tentar excluir novamente</button>}
    {(estado === 'falhou_envio' || estado === 'falhou_resposta') && <><button type="button" onClick={() => void responder()}>Tentar novamente</button><button type="button" onClick={() => void desistir()}>Desistir e excluir</button></>}
    {estado === 'falhou_revelacao' && <button type="button" onClick={() => void revelar()}>Tentar abrir resultado</button>}
    {estado === 'revelado' && resultado && <ResultadoDoDuelo duelo={duelo} token={token} resultado={resultado} neutro={resultadoNeutro} aoVoltar={aoVoltar} compartilhar={compartilhar} origem={origem} aoNovoDesafio={aoNovoDesafio} />}
    {estado === 'indisponivel' && <>{gravacao.current && <button type="button" onClick={() => void desistir()}>Excluir minha gravação</button>}{!gravacao.current && <button type="button" onClick={() => void abrir()}>Tentar novamente</button>}<button type="button" onClick={aoVoltar}>Voltar</button></>}
    {mensagem && <p role="status">{mensagem}</p>}
  </section>;
}

function ResultadoDoDuelo({ duelo, token, resultado, neutro, aoVoltar, compartilhar, origem, aoNovoDesafio }: { duelo: DueloV2; token: string; resultado: RevelacaoV2; neutro: boolean; aoVoltar: () => void; compartilhar?: Compartilhamento; origem?: string; aoNovoDesafio?: () => void }) {
  const [audio, setAudio] = useState<{ lado: 'criador' | 'desafiante'; dados: Blob } | null>(null);
  const [endereco, setEndereco] = useState<string | null>(null);
  const [erro, setErro] = useState('');
  const [denunciaAberta, setDenunciaAberta] = useState(false);
  const [motivo, setMotivo] = useState<'ofensivo' | 'outro' | ''>('');
  const [denuncia, setDenuncia] = useState<'pronta' | 'enviando' | 'registrada' | 'ja_analisada' | 'indisponivel' | 'falha'>('pronta');
  const enviandoDenuncia = useRef(false);
  const geracaoAudio = useRef(0);
  useEffect(() => {
    if (!audio) return;
    const url = criarEnderecoLocal(audio.dados); setEndereco(url);
    return () => { soltarEnderecoLocal(url); };
  }, [audio]);
  const ouvir = async (lado: 'criador' | 'desafiante') => {
    const atual = ++geracaoAudio.current;
    setErro('');
    try {
      const resposta = await duelo.baixarAudio(token, lado);
      if (atual !== geracaoAudio.current) return;
      if (!resposta.ok) { setErro('Não foi possível carregar esse áudio.'); return; }
      setEndereco(null); setAudio({ lado, dados: resposta.valor });
    } catch { if (atual === geracaoAudio.current) setErro('Não foi possível carregar esse áudio.'); }
  };
  const denunciar = async () => {
    if (!motivo || enviandoDenuncia.current) return;
    enviandoDenuncia.current = true;
    setDenuncia('enviando');
    try {
      const resposta = await duelo.denunciar(token, resultado.ladoSessao === 'criador' ? 'desafiante' : 'criador', motivo);
      if (!resposta.ok) { setDenuncia('falha'); return; }
      setDenuncia(resposta.valor);
      if (resposta.valor === 'registrada') {
        geracaoAudio.current++;
        setAudio(null); setEndereco(null);
      }
    } catch { setDenuncia('falha'); }
    finally { enviandoDenuncia.current = false; }
  };
  const duracao = (ms: number) => `${(ms / 1000).toFixed(2).replace('.', ',')} s`;
  return <div className="duelo-v2__resultado">
    <h3>RESULTADO PROVISÓRIO</h3><p>As medições são informadas pelos aparelhos e ainda não foram verificadas.</p>
    <dl><div><dt>{neutro ? 'Quem criou' : resultado.ladoSessao === 'criador' ? 'Você' : 'Adversário'}</dt><dd>{duracao(resultado.criador.duracaoMs)}</dd></div><div><dt>{neutro ? 'Quem respondeu' : resultado.ladoSessao === 'criador' ? 'Adversário' : 'Você'}</dt><dd>{duracao(resultado.desafiante.duracaoMs)}</dd></div></dl>
    <p>{resultado.resultadoProvisorio === 'empate' ? 'Empate.' : neutro ? (resultado.resultadoProvisorio === 'criador' ? 'Quem criou levou esta rodada.' : 'Quem respondeu levou esta rodada.') : resultado.resultadoProvisorio === (resultado.ladoSessao ?? 'desafiante') ? 'Você levou esta rodada.' : 'Seu adversário levou esta rodada.'}</p>
    <button type="button" disabled={denuncia === 'registrada' && resultado.ladoSessao !== 'criador'} onClick={() => void ouvir('criador')}>{neutro ? 'Abrir áudio de quem criou' : resultado.ladoSessao === 'criador' ? 'Abrir minha gravação' : 'Abrir áudio do adversário'}</button><button type="button" disabled={denuncia === 'registrada' && resultado.ladoSessao === 'criador'} onClick={() => void ouvir('desafiante')}>{neutro ? 'Abrir áudio de quem respondeu' : resultado.ladoSessao === 'criador' ? 'Abrir áudio do adversário' : 'Abrir minha gravação'}</button>
    {audio && endereco && <PlayerDeAudio endereco={endereco} rotulo={neutro ? (audio.lado === 'criador' ? 'Áudio de quem criou' : 'Áudio de quem respondeu') : (audio.lado === (resultado.ladoSessao ?? 'desafiante') ? 'Sua gravação' : 'Áudio do adversário')} />}
    {erro && <p role="alert">{erro}</p>}
    {!neutro && !denunciaAberta && <button type="button" onClick={() => setDenunciaAberta(true)}>Denunciar áudio do adversário</button>}
    {denunciaAberta && <section aria-label="Denunciar áudio do adversário">
      {(denuncia === 'pronta' || denuncia === 'falha' || denuncia === 'enviando') && <>
        <fieldset disabled={denuncia === 'enviando'}><legend>Por que você quer denunciar este áudio?</legend>
          <label><input type="radio" name="motivo-denuncia" value="ofensivo" checked={motivo === 'ofensivo'} onChange={() => setMotivo('ofensivo')} />Conteúdo ofensivo</label>
          <label><input type="radio" name="motivo-denuncia" value="outro" checked={motivo === 'outro'} onChange={() => setMotivo('outro')} />Outro motivo</label>
        </fieldset>
        <button type="button" disabled={!motivo || denuncia === 'enviando'} onClick={() => void denunciar()}>{denuncia === 'enviando' ? 'Enviando…' : 'Enviar denúncia'}</button>
        {denuncia !== 'enviando' && <button type="button" onClick={() => { setDenunciaAberta(false); setDenuncia('pronta'); }}>Cancelar</button>}
      </>}
      {denuncia === 'registrada' && <p role="status">Denúncia registrada. O áudio ficará indisponível enquanto for analisado.</p>}
      {denuncia === 'ja_analisada' && <p role="status">Você já denunciou este áudio e a denúncia foi analisada.</p>}
      {denuncia === 'indisponivel' && <p role="status">Não foi possível denunciar este áudio porque ele está indisponível.</p>}
      {denuncia === 'falha' && <p role="alert">Não foi possível confirmar o envio da denúncia. Tente novamente.</p>}
    </section>}
    <ProximosPassosDuelo resultado={resultado} compartilhar={compartilhar} origem={origem} aoNovoDesafio={aoNovoDesafio} />
    <button type="button" onClick={aoVoltar}>Voltar</button>
  </div>;
}
