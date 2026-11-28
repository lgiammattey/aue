import { supabase } from '../../db/supabase';
import { garantirSessao } from '../../shared/auth/sessaoAnonima';
import type { ConviteProprioV2, DueloV2, EstadoCancelamentoV2, EstadoConviteV2, EstadoRespostaV2, FalhaDueloV2, MeuDueloV2, ResultadoDueloV2, RevelacaoV2 } from '../../portas/dueloV2';

const BUCKET = 'duelos_v2';
const REGUA = 'experimental-2';
const TOKEN = /^[0-9a-f]{64}$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_BYTES = 5 * 1024 * 1024;

type Resposta = { data: unknown; error: unknown };
/** Dependências injetáveis para testes sem acesso à rede. */
export interface TransporteDueloV2 {
  sessao(): Promise<{ user: { id: string } } | null>;
  rpc(nome: string, parametros?: Record<string, unknown>): Promise<Resposta>;
  upload(caminho: string, audio: Blob): Promise<Resposta>;
  download(dueloId: string, lado: 'criador' | 'desafiante'): Promise<Resposta>;
  remover(caminho: string): Promise<Resposta>;
  novoToken(): string;
}
const transporteWeb: TransporteDueloV2 = {
  sessao: garantirSessao,
  novoToken() {
    const bytes = new Uint8Array(32);
    crypto.getRandomValues(bytes);
    return Array.from(bytes, (valor) => valor.toString(16).padStart(2, '0')).join('');
  },
  async rpc(nome, parametros) { const { data, error } = await supabase.rpc(nome, parametros); return { data, error }; },
  async upload(caminho, audio) { const { data, error } = await supabase.storage.from(BUCKET).upload(caminho, audio, { contentType: 'audio/wav', upsert: false }); return { data, error }; },
  async download(dueloId, lado) { const { data, error } = await supabase.functions.invoke('duelo-audio-v2', { body: { dueloId, lado } }); return { data: data instanceof Blob ? new Blob([data], { type: 'audio/wav' }) : data, error }; },
  async remover(caminho) { const { data, error } = await supabase.storage.from(BUCKET).remove([caminho]); return { data, error }; },
};

function objeto(valor: unknown): Record<string, unknown> | null {
  return valor !== null && typeof valor === 'object' && !Array.isArray(valor) ? valor as Record<string, unknown> : null;
}
function falha<T>(motivo: FalhaDueloV2): ResultadoDueloV2<T> { return { ok: false, motivo }; }
function sucesso<T>(valor: T): ResultadoDueloV2<T> { return { ok: true, valor }; }
function uuid(valor: unknown): valor is string { return typeof valor === 'string' && UUID.test(valor); }
function duracao(valor: unknown): valor is number { return typeof valor === 'number' && Number.isInteger(valor) && valor >= 100 && valor <= 10500; }
function caminhoProprio(caminho: unknown, id: string, usuario: string): caminho is string {
  return typeof caminho === 'string' && caminho === `${usuario}/${id}.wav`;
}
function caminhoValido(caminho: unknown): caminho is string {
  if (typeof caminho !== 'string') return false;
  const partes = caminho.split('/');
  return partes.length === 2 && uuid(partes[0]) && partes[1].endsWith('.wav') && uuid(partes[1].slice(0, -4));
}
function interpretarConvite(valor: unknown): ConviteProprioV2 | null {
  const r = objeto(valor);
  if (r?.estado === 'indisponivel') return { estado: 'indisponivel' };
  if (!r || (r.estado !== 'aguardando_resposta' && r.estado !== 'respondido' && r.estado !== 'revogado' && r.estado !== 'expirado' && r.estado !== 'conflito') ||
      !uuid(r.id) || typeof r.versao !== 'number' || !Number.isInteger(r.versao) || r.versao < 1 ||
      typeof r.prazo !== 'string' || !Number.isFinite(Date.parse(r.prazo))) return null;
  return { estado: r.estado, id: r.id, versao: r.versao, prazo: r.prazo };
}
type RevelacaoInterna = { id: string; publico: RevelacaoV2; caminhos: { criador: string; desafiante: string } };
function interpretarRevelacao(valor: unknown): RevelacaoInterna | null {
  const r = objeto(valor); const a = objeto(r?.criador); const b = objeto(r?.desafiante);
  if (r?.estado !== 'revelado' || !uuid(r.id) || r.bucket !== BUCKET || r.versao_regua !== REGUA || r.origem_medicao !== 'cliente_nao_verificada' || r.efeito_competitivo === true ||
      !a || !b || !duracao(a.duracao_ms) || !duracao(b.duracao_ms) || !caminhoValido(a.caminho) || !caminhoValido(b.caminho) ||
      (r.efeito_competitivo !== undefined && typeof r.efeito_competitivo !== 'boolean')) return null;
  return { id: r.id as string, publico: { ...(r.lado_sessao === 'criador' || r.lado_sessao === 'desafiante' ? { ladoSessao: r.lado_sessao } : {}), criador: { duracaoMs: a.duracao_ms }, desafiante: { duracaoMs: b.duracao_ms }, efeitoCompetitivo: false, versaoRegua: REGUA, origemMedicao: 'cliente_nao_verificada' }, caminhos: { criador: a.caminho, desafiante: b.caminho } };
}

export function criarDueloV2(transporte: TransporteDueloV2 = transporteWeb): DueloV2 {
  type Pendente = { id: string; caminho: string; usuario: string; audio: Blob | null; duracao: number; cancelada: boolean; emVoo: Promise<ResultadoDueloV2<{ readonly id: string }>> | null };
  // Não persistir caminho, Blob ou token em localStorage, URL ou telemetria.
  const pendentes = new Map<string, Pendente>();
  // IDs sem conteúdo permitem tentar a exclusão novamente após falha de rede.
  const descartadas = new Map<string, Promise<unknown> | null>();
  async function sessao() { try { return await transporte.sessao(); } catch { return null; } }
  function falhaNoEnvio(
    etapa: 'sessao' | 'upload' | 'persistencia',
    motivo: FalhaDueloV2,
    tentativaId: string,
  ): ResultadoDueloV2<never> {
    console.warn('[duelo-v2] Falha no envio', etapa, motivo);
    return { ok: false, motivo, tentativaId };
  }

  async function baixarAudioDoServidor(dueloId: string, lado: 'criador' | 'desafiante'): Promise<ResultadoDueloV2<Blob>> {
    try {
      const { data, error } = await transporte.download(dueloId, lado);
      if (!error) {
        if (data instanceof Blob && data.size >= 44 && data.size <= MAX_BYTES) return sucesso(data);
        console.warn('[duelo-v2] Falha na reprodução', 'resposta_invalida');
        return falha('resposta_invalida');
      }
    } catch {
      // A rede pode falhar pelo retorno do serviço ou pela rejeição da chamada.
    }
    console.warn('[duelo-v2] Falha na reprodução', 'falha_rede');
    return falha('falha_rede');
  }

  async function executarEnvio(p: Pendente): Promise<ResultadoDueloV2<{ readonly id: string }>> {
    const atual = await sessao();
    if (p.cancelada || !p.audio) return falha('cancelada');
    if (!atual || atual.user.id !== p.usuario) return falhaNoEnvio('sessao', 'sem_sessao', p.id);
    let falhouEnvio = false;
    try { falhouEnvio = Boolean((await transporte.upload(p.caminho, p.audio)).error); }
    catch { falhouEnvio = true; }
    if (p.cancelada) return falha('cancelada');
    try {
      // O servidor só confirma se o objeto existir. Mesmo quando upload perde a
      // resposta, é seguro verificar antes de afirmar que o envio falhou.
      const confirmacao = await transporte.rpc('aue_v2_confirmar_gravacao', { p_id: p.id, p_duracao_ms: p.duracao, p_versao_regua: REGUA });
      if (p.cancelada) return falha('cancelada');
      if (confirmacao.error) {
        return falhouEnvio
          ? falhaNoEnvio('upload', 'envio_falhou', p.id)
          : falhaNoEnvio('persistencia', 'falha_rede', p.id);
      }
      const confirmado = objeto(confirmacao.data);
      if (confirmado?.id !== p.id || confirmado.estado !== 'confirmada') {
        return falhaNoEnvio('persistencia', 'resposta_invalida', p.id);
      }
      pendentes.delete(p.id);
      return sucesso({ id: p.id });
    } catch {
      return p.cancelada ? falha('cancelada') : falhaNoEnvio('persistencia', 'falha_rede', p.id);
    }
  }
  function enviarPendente(p: Pendente): Promise<ResultadoDueloV2<{ readonly id: string }>> {
    if (p.emVoo) return p.emVoo;
    const tentativa = executarEnvio(p);
    p.emVoo = tentativa;
    void tentativa.then(() => { if (p.emVoo === tentativa) p.emVoo = null; });
    return tentativa;
  }
  const ESGOTOU = Symbol('esgotou');
  async function comPrazo<T>(promessa: Promise<T>): Promise<T | typeof ESGOTOU> {
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      return await Promise.race([promessa, new Promise<typeof ESGOTOU>((resolve) => { timer = setTimeout(() => resolve(ESGOTOU), 3000); })]);
    } finally { if (timer !== undefined) clearTimeout(timer); }
  }
  async function bloquearTentativa(id: string): Promise<boolean> {
    const atual = await sessao();
    if (!atual || !uuid(atual.user.id)) return false;
    try {
      const r = await transporte.rpc('aue_v2_solicitar_exclusao', { p_id: id });
      if (r.error) return false;
      const dados = objeto(r.data);
      return dados?.estado === 'removida' || (dados?.estado === 'remocao_pendente' && dados.bucket === BUCKET && caminhoProprio(dados.caminho, id, atual.user.id));
    } catch { return false; }
  }
  async function lerRevelacao(token: string): Promise<ResultadoDueloV2<RevelacaoInterna>> {
    if (!TOKEN.test(token)) return falha('entrada_invalida');
    if (!await sessao()) return falha('sem_sessao');
    try {
      const { data, error } = await transporte.rpc('aue_v2_revelar_duelo', { p_token: token });
      if (error) return falha('falha_rede');
      if (objeto(data)?.estado === 'indisponivel') return falha('resultado_indisponivel');
      const resultado = interpretarRevelacao(data);
      return resultado ? sucesso(resultado) : falha('resposta_invalida');
    } catch { return falha('falha_rede'); }
  }
  const api: DueloV2 = {
    iniciarEnvioGravacao(audio, duracaoMs) {
      let audioLocal: Blob | null = audio;
      let cancelada = false;
      let preparoIniciado = false;
      let pendenteAtual: Pendente | null = null;
      let limparEmVoo: Promise<ResultadoDueloV2<EstadoCancelamentoV2>> | null = null;
      let concluirPreparo!: (valor: Pendente | 'local' | 'incerta') => void;
      const preparo = new Promise<Pendente | 'local' | 'incerta'>((resolve) => { concluirPreparo = resolve; });
      function limpar(p: Pendente): Promise<ResultadoDueloV2<EstadoCancelamentoV2>> {
        if (limparEmVoo) return limparEmVoo;
        // A tentativa pode já ter terminado quando o cancelamento chega.
        if (!pendentes.has(p.id) && !descartadas.has(p.id)) descartadas.set(p.id, null);
        const tarefa = api.descartarTentativa(p.id);
        limparEmVoo = tarefa;
        void tarefa.then(() => { if (limparEmVoo === tarefa) limparEmVoo = null; });
        return tarefa;
      }
      const resultado = (async (): Promise<ResultadoDueloV2<{ readonly id: string }>> => {
        if (!(audioLocal instanceof Blob) || audioLocal.type !== 'audio/wav' || audioLocal.size < 44 || audioLocal.size > MAX_BYTES || !duracao(duracaoMs)) {
          audioLocal = null; concluirPreparo('local'); return falha('entrada_invalida');
        }
        const atual = await sessao();
        if (cancelada) { concluirPreparo('local'); return falha('cancelada'); }
        if (!atual || !uuid(atual.user.id)) { audioLocal = null; concluirPreparo('local'); return falha('sem_sessao'); }
        preparoIniciado = true;
        try {
          const preparado = await transporte.rpc('aue_v2_preparar_gravacao');
          if (preparado.error) { audioLocal = null; concluirPreparo('incerta'); return falha(cancelada ? 'cancelada' : 'falha_rede'); }
          const dados = objeto(preparado.data);
          if (!dados || !uuid(dados.id) || dados.bucket !== BUCKET || !caminhoProprio(dados.caminho, dados.id, atual.user.id)) {
            audioLocal = null; concluirPreparo('incerta'); return falha(cancelada ? 'cancelada' : 'resposta_invalida');
          }
          const pendente: Pendente = { id: dados.id, caminho: dados.caminho, usuario: atual.user.id, audio: audioLocal, duracao: duracaoMs, cancelada: false, emVoo: null };
          audioLocal = null;
          pendentes.set(dados.id, pendente);
          pendenteAtual = pendente;
          concluirPreparo(pendente);
          if (cancelada) { void limpar(pendente); return falha('cancelada'); }
          return enviarPendente(pendente);
        } catch { audioLocal = null; concluirPreparo('incerta'); return falha(cancelada ? 'cancelada' : 'falha_rede'); }
      })();
      return {
        resultado,
        async cancelar() {
          cancelada = true;
          audioLocal = null;
          if (pendenteAtual) return limpar(pendenteAtual);
          if (!preparoIniciado) return sucesso('cancelada_local');
          const preparado = await comPrazo(preparo);
          if (preparado === ESGOTOU || preparado === 'incerta') return sucesso('preparacao_incerta');
          if (preparado === 'local') return sucesso('cancelada_local');
          return limpar(preparado);
        },
      };
    },
    enviarGravacao(audio, duracaoMs) {
      return api.iniciarEnvioGravacao(audio, duracaoMs).resultado;
    },
    async retomarEnvio(tentativaId) {
      const pendente = pendentes.get(tentativaId);
      if (!pendente) return falha('entrada_invalida');
      return enviarPendente(pendente);
    },
    async descartarTentativa(tentativaId) {
      if (!uuid(tentativaId)) return falha('entrada_invalida');
      const pendente = pendentes.get(tentativaId);
      if (!pendente && !descartadas.has(tentativaId)) return falha('entrada_invalida');
      if (pendente) {
        pendente.cancelada = true;
        pendente.audio = null;
        pendentes.delete(tentativaId);
        // Uma requisição do SDK já iniciada pode reter o Blob até terminar.
        descartadas.set(tentativaId, pendente.emVoo);
      }
      const emVoo = descartadas.get(tentativaId);
      let bloqueado = false;
      if (emVoo) {
        // Fecha o acesso antes de esperar; não se afirma bloqueio enquanto o
        // servidor não responder. Depois espera o upload para só então remover.
        const bloqueio = await comPrazo(bloquearTentativa(tentativaId));
        if (bloqueio !== true) return sucesso('bloqueio_nao_confirmado');
        bloqueado = true;
        const fim = await comPrazo(emVoo.then(() => true, () => true));
        if (fim === ESGOTOU) {
          // A resposta tardia ainda pode carregar o objeto; só tente removê-lo depois dela.
          void emVoo.then(() => api.descartarTentativa(tentativaId), () => api.descartarTentativa(tentativaId));
          return sucesso('remocao_pendente');
        }
        descartadas.set(tentativaId, null);
      }
      const removida = await comPrazo(api.removerGravacao(tentativaId));
      if (removida === ESGOTOU || !removida.ok) return sucesso(bloqueado ? 'remocao_pendente' : 'bloqueio_nao_confirmado');
      if (removida.valor === 'removida') descartadas.delete(tentativaId);
      return removida;
    },
    novoToken() {
      try { const token = transporte.novoToken(); return TOKEN.test(token) ? sucesso(token) : falha('resposta_invalida'); }
      catch { return falha('falha_rede'); }
    },
    async criar(gravacaoId, token) {
      if (!uuid(gravacaoId) || !TOKEN.test(token)) return falha('entrada_invalida');
      if (!await sessao()) return falha('sem_sessao');
      try {
        const { data, error } = await transporte.rpc('aue_v2_criar_duelo', { p_gravacao_id: gravacaoId, p_token: token });
        if (error) return falha('criacao_incerta');
        const convite = interpretarConvite(data);
        return convite ? sucesso(convite) : falha('criacao_incerta');
      } catch { return falha('criacao_incerta'); }
    },
    async reemitir(gravacaoId, tokenNovo, versaoEsperada) {
      if (!uuid(gravacaoId) || !TOKEN.test(tokenNovo) || !Number.isInteger(versaoEsperada) || versaoEsperada < 1) return falha('entrada_invalida');
      if (!await sessao()) return falha('sem_sessao');
      try {
        const { data, error } = await transporte.rpc('aue_v2_reemitir_convite', { p_gravacao_id: gravacaoId, p_token_novo: tokenNovo, p_versao_esperada: versaoEsperada });
        if (error) return falha('criacao_incerta');
        const convite = interpretarConvite(data);
        return convite ? sucesso(convite) : falha('criacao_incerta');
      } catch { return falha('criacao_incerta'); }
    },
    async revogar(gravacaoId, versaoEsperada) {
      if (!uuid(gravacaoId) || !Number.isInteger(versaoEsperada) || versaoEsperada < 1) return falha('entrada_invalida');
      if (!await sessao()) return falha('sem_sessao');
      try {
        const { data, error } = await transporte.rpc('aue_v2_revogar_convite', { p_gravacao_id: gravacaoId, p_versao_esperada: versaoEsperada });
        if (error) return falha('falha_rede');
        const convite = interpretarConvite(data);
        return convite ? sucesso(convite) : falha('resposta_invalida');
      } catch { return falha('falha_rede'); }
    },
    async listarMeusDuelos(deslocamento) {
      if (!Number.isSafeInteger(deslocamento) || deslocamento < 0 || deslocamento > 2_147_483_647) return falha('entrada_invalida');
      if (!await sessao()) return falha('sem_sessao');
      try {
        const { data, error } = await transporte.rpc('aue_v2_listar_meus_duelos', { p_deslocamento: deslocamento });
        if (error) return falha('falha_rede');
        const pagina = objeto(data);
        if (!pagina || !Array.isArray(pagina.itens) || pagina.itens.length > 50 || typeof pagina.tem_mais !== 'boolean') return falha('resposta_invalida');
        const itens: MeuDueloV2[] = [];
        for (const item of pagina.itens) {
          const bruto = objeto(item);
          if (!bruto || !uuid(bruto.id) || !uuid(bruto.gravacao_propria_id) || (bruto.lado !== 'criador' && bruto.lado !== 'desafiante') ||
              (bruto.estado !== 'indisponivel' && bruto.estado !== 'aguardando_resposta' && bruto.estado !== 'respondido' && bruto.estado !== 'revogado' && bruto.estado !== 'expirado') ||
              typeof bruto.versao !== 'number' || !Number.isInteger(bruto.versao) || bruto.versao < 1 ||
              typeof bruto.prazo !== 'string' || !Number.isFinite(Date.parse(bruto.prazo))) return falha('resposta_invalida');
          itens.push({ id: bruto.id, estado: bruto.estado, versao: bruto.versao, prazo: bruto.prazo, gravacaoPropriaId: bruto.gravacao_propria_id, lado: bruto.lado });
        }
        return sucesso({ itens, temMais: pagina.tem_mais });
      } catch { return falha('falha_rede'); }
    },
    async recuperar(dueloId) {
      if (!uuid(dueloId)) return falha('entrada_invalida');
      if (!await sessao()) return falha('sem_sessao');
      try {
        const { data, error } = await transporte.rpc('aue_v2_recuperar_duelo', { p_duelo_id: dueloId });
        if (error) return falha('falha_rede');
        const convite = interpretarConvite(data);
        if (convite) return sucesso(convite);
        const revelacao = interpretarRevelacao(data);
        return revelacao ? sucesso({ estado: 'revelado' as const, resultado: revelacao.publico }) : falha('resposta_invalida');
      } catch { return falha('falha_rede'); }
    },
    async baixarAudioRecuperado(dueloId, lado) {
      if (!uuid(dueloId) || (lado !== 'criador' && lado !== 'desafiante')) return falha('entrada_invalida');
      if (!await sessao()) return falha('sem_sessao');
      try {
        const resposta = await transporte.rpc('aue_v2_recuperar_duelo', { p_duelo_id: dueloId });
        if (resposta.error) return falha('falha_rede');
        const r = interpretarRevelacao(resposta.data);
        if (!r) return falha('resultado_indisponivel');
        return baixarAudioDoServidor(dueloId, lado);
      } catch { return falha('falha_rede'); }
    },
    async abrir(token) {
      if (!TOKEN.test(token)) return falha('entrada_invalida');
      try {
        const { data, error } = await transporte.rpc('aue_v2_abrir_duelo', { p_token: token });
        if (error) return falha('falha_rede');
        const r = objeto(data);
        if (r?.estado === 'aguardando_resposta' && r.categoria === 'duracao') return sucesso<EstadoConviteV2>('aguardando_resposta');
        if (r?.estado === 'respondido' || r?.estado === 'indisponivel') return sucesso<EstadoConviteV2>(r.estado);
        return falha('resposta_invalida');
      } catch { return falha('falha_rede'); }
    },
    async responder(token, gravacaoId) {
      if (!TOKEN.test(token) || !uuid(gravacaoId)) return falha('entrada_invalida');
      if (!await sessao()) return falha('sem_sessao');
      try {
        const { data, error } = await transporte.rpc('aue_v2_responder_duelo', { p_token: token, p_gravacao_id: gravacaoId });
        if (error) return falha('falha_rede');
        const estado = objeto(data)?.estado;
        if (estado === 'respondido' || estado === 'ocupado' || estado === 'indisponivel' || estado === 'criador') return sucesso<EstadoRespostaV2>(estado);
        return falha('resposta_invalida');
      } catch { return falha('falha_rede'); }
    },
    async revelar(token) {
      const r = await lerRevelacao(token);
      return r.ok ? sucesso(r.valor.publico) : r;
    },
    async removerGravacao(id) {
      if (!uuid(id)) return falha('entrada_invalida');
      const atual = await sessao();
      if (!atual || !uuid(atual.user.id)) return falha('sem_sessao');
      try {
        const pedido = await transporte.rpc('aue_v2_solicitar_exclusao', { p_id: id });
        if (pedido.error) return falha('falha_rede');
        const dados = objeto(pedido.data);
        // O estado SQL sozinho não prova que o Storage apagou o arquivo físico.
        if (dados?.estado === 'removida') {
          const confirmacao = await transporte.rpc('aue_v2_confirmar_exclusao', { p_id: id });
          if (confirmacao.error) return sucesso('remocao_nao_verificada');
          return sucesso(objeto(confirmacao.data)?.estado === 'removida_pelo_servico' ? 'removida' : 'remocao_nao_verificada');
        }
        if (dados?.estado !== 'remocao_pendente' || dados.bucket !== BUCKET || !caminhoProprio(dados.caminho, id, atual.user.id)) return falha('resposta_invalida');
        // A solicitação bloqueia a leitura primeiro. Falha de remoção permanece
        // pendente para retry; nunca fingimos que o objeto desapareceu.
        let remocao: Resposta;
        try { remocao = await transporte.remover(dados.caminho); }
        catch { return sucesso('remocao_pendente'); }
        if (remocao.error) return sucesso('remocao_pendente');
        // A API retorna FileObjects removidos. Resposta vazia não comprova a
        // remoção física, mesmo que o catálogo não tenha mais o registro.
        const itens = Array.isArray(remocao.data) ? remocao.data : [];
        const nome = itens.length === 1 ? objeto(itens[0])?.name : undefined;
        const apiConfirmou = nome === dados.caminho || nome === `${id}.wav`;
        let confirmacao: Resposta;
        try { confirmacao = await transporte.rpc('aue_v2_confirmar_exclusao', { p_id: id }); }
        catch { return sucesso('remocao_pendente'); }
        if (confirmacao.error) return sucesso('remocao_pendente');
        const estado = objeto(confirmacao.data)?.estado;
        if (estado === 'removida_pelo_servico') return sucesso('removida');
        if (estado === 'removida') return sucesso(apiConfirmou ? 'removida' : 'remocao_nao_verificada');
        if (estado === 'remocao_pendente') return sucesso(estado);
        return falha('resposta_invalida');
      } catch { return falha('falha_rede'); }
    },
    async listarExclusoesPendentes() {
      const atual = await sessao();
      if (!atual || !uuid(atual.user.id)) return falha('sem_sessao');
      try {
        const { data, error } = await transporte.rpc('aue_v2_exclusoes_pendentes');
        if (error) return falha('falha_rede');
        if (!Array.isArray(data)) return falha('resposta_invalida');
        const ids: string[] = [];
        for (const item of data) {
          const valor = objeto(item);
          if (!valor || !uuid(valor.id) || valor.bucket !== BUCKET || !caminhoProprio(valor.caminho, valor.id, atual.user.id)) return falha('resposta_invalida');
          ids.push(valor.id);
        }
        return sucesso(ids);
      } catch { return falha('falha_rede'); }
    },
    async denunciar(token, alvo, motivo) {
      if (!TOKEN.test(token) || (alvo !== 'criador' && alvo !== 'desafiante') || (motivo !== 'ofensivo' && motivo !== 'outro')) return falha('entrada_invalida');
      if (!await sessao()) return falha('sem_sessao');
      try {
        const { data, error } = await transporte.rpc('aue_v2_denunciar_audio', { p_token: token, p_alvo: alvo, p_motivo: motivo });
        if (error) return falha('falha_rede');
        const estado = objeto(data)?.estado;
        if (estado === 'registrada' || estado === 'ja_analisada' || estado === 'indisponivel') return sucesso(estado);
        return falha('resposta_invalida');
      } catch { return falha('falha_rede'); }
    },
    async denunciarPorDuelo(dueloId, alvo, motivo) {
      if (!uuid(dueloId) || (alvo !== 'criador' && alvo !== 'desafiante') || (motivo !== 'ofensivo' && motivo !== 'outro')) return falha('entrada_invalida');
      if (!await sessao()) return falha('sem_sessao');
      try {
        const { data, error } = await transporte.rpc('aue_v2_denunciar_por_duelo', { p_duelo_id: dueloId, p_alvo: alvo, p_motivo: motivo });
        if (error) return falha('falha_rede');
        const estado = objeto(data)?.estado;
        if (estado === 'registrada' || estado === 'ja_analisada' || estado === 'indisponivel') return sucesso(estado);
        return falha('resposta_invalida');
      } catch { return falha('falha_rede'); }
    },
    async baixarAudio(token, lado) {
      if (lado !== 'criador' && lado !== 'desafiante') return falha('entrada_invalida');
      const r = await lerRevelacao(token);
      if (!r.ok) return r;
      return baixarAudioDoServidor(r.valor.id, lado);
    },
  };
  return api;
}
