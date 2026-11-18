import type { CapturaPcmV2, FalhaCapturaPcmV2, InicioCapturaPcmV2, ResultadoCapturaPcmV2 } from '../../portas/capturaPcmV2';

const PRAZO_INICIALIZACAO_MS = 3000;
const PRAZO_CALIBRACAO_MS = 3000;
const PRAZO_FINALIZACAO_MS = 3000;
const FORMATOS_PREFERIDOS = ['audio/mp4', 'audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus'];
const URL_DO_WORKLET = new URL('./coletorPcmV2.worklet.js', import.meta.url).href;

type DadosPcm = { tipo: 'dados'; ambiente: Float32Array; emissao: Float32Array; sampleRate: number; excedeu: boolean };
type MensagemPcm = { tipo: 'calibrado' } | { tipo: 'limite' } | DadosPcm;
type Eventos = Parameters<CapturaPcmV2['iniciar']>[0];

/** Uma fonte, um gravador e uma cadeia de PCM; saída de áudio sempre muda. */
export function criarCapturaPcmV2(): CapturaPcmV2 {
  let geracao = 0;
  let fase: 'ociosa' | 'abrindo' | 'gravando' | 'finalizando' = 'ociosa';
  let contexto: AudioContext | null = null;
  let stream: MediaStream | null = null;
  let fonte: MediaStreamAudioSourceNode | null = null;
  let coletor: AudioWorkletNode | null = null;
  let mudo: GainNode | null = null;
  let analisador: AnalyserNode | null = null;
  let buffer: Float32Array<ArrayBuffer> | null = null;
  let gravador: MediaRecorder | null = null;
  let pedacos: Blob[] = [];
  let eventos: Eventos | null = null;
  let timeout: ReturnType<typeof setTimeout> | null = null;
  let resolverFim: ((resultado: ResultadoCapturaPcmV2) => void) | null = null;
  let aoFimDaTrilha: (() => void) | null = null;

  function limparTimer() {
    if (timeout !== null) clearTimeout(timeout);
    timeout = null;
  }

  function limpar() {
    limparTimer();
    if (stream) {
      for (const trilha of stream.getTracks()) {
        if (aoFimDaTrilha) trilha.removeEventListener('ended', aoFimDaTrilha);
        trilha.stop();
      }
    }
    aoFimDaTrilha = null;
    stream = null;
    if (gravador) {
      gravador.ondataavailable = null;
      gravador.onstop = null;
      gravador.onerror = null;
      if (gravador.state !== 'inactive') {
        try { gravador.stop(); } catch { /* Já encerrou. */ }
      }
    }
    gravador = null;
    if (coletor) {
      coletor.onprocessorerror = null;
      coletor.port.onmessage = null;
      coletor.disconnect();
      coletor.port.close();
    }
    fonte?.disconnect();
    analisador?.disconnect();
    mudo?.disconnect();
    fonte = null;
    coletor = null;
    mudo = null;
    analisador = null;
    buffer = null;
    if (contexto) {
      contexto.onstatechange = null;
      void contexto.close().catch(() => {});
    }
    contexto = null;
    pedacos = [];
    eventos = null;
    fase = 'ociosa';
  }

  function encerrarComFalha(motivo: FalhaCapturaPcmV2, avisar: boolean) {
    const callback = eventos?.aoErro;
    const resolver = resolverFim;
    resolverFim = null;
    geracao++;
    limpar();
    resolver?.({ ok: false, motivo });
    if (avisar) callback?.(motivo);
  }

  return {
    async iniciar(novosEventos): Promise<InicioCapturaPcmV2> {
      if (fase !== 'ociosa') return { ok: false, motivo: 'pcm_indisponivel' };
      const versao = ++geracao;
      fase = 'abrindo';
      eventos = novosEventos;
      try {
        if (!navigator.mediaDevices?.getUserMedia || typeof AudioContext === 'undefined' || typeof AudioWorkletNode === 'undefined') {
          encerrarComFalha('pcm_indisponivel', false);
          return { ok: false, motivo: 'pcm_indisponivel' };
        }
        // Iniciado no gesto da pessoa; o navegador pode recusar o resume.
        const novoContexto = new AudioContext();
        contexto = novoContexto;
        const retomada = novoContexto.resume().then(() => true, () => false);
        const recebido = await navigator.mediaDevices.getUserMedia({ audio: { autoGainControl: false, echoCancellation: false, noiseSuppression: false } });
        if (versao !== geracao) {
          recebido.getTracks().forEach((trilha) => trilha.stop());
          return { ok: false, motivo: 'cancelada' };
        }
        stream = recebido;
        if (!novoContexto.audioWorklet) throw new Error('AudioWorklet indisponível');
        // O navegador pode deixar resume/addModule pendente mesmo após conceder
        // o microfone. Nunca manter a trilha aberta indefinidamente nesse caso.
        let limiteInicializacao: ReturnType<typeof setTimeout> | undefined;
        const iniciou = await Promise.race([
          Promise.all([retomada, novoContexto.audioWorklet.addModule(URL_DO_WORKLET)]).then(([retomou]) => retomou),
          new Promise<false>((resolve) => { limiteInicializacao = setTimeout(() => resolve(false), PRAZO_INICIALIZACAO_MS); }),
        ]).finally(() => clearTimeout(limiteInicializacao));
        if (versao !== geracao) return { ok: false, motivo: 'cancelada' };
        if (!iniciou || novoContexto.state !== 'running') throw new Error('Contexto de áudio suspenso');
        if (!recebido.getTracks().length || recebido.getTracks().every((trilha) => trilha.readyState === 'ended')) {
          throw new Error('Microfone encerrou antes da gravação');
        }

        const novoColetor = new AudioWorkletNode(novoContexto, 'aue-coletor-pcm-v2');
        coletor = novoColetor;
        fonte = novoContexto.createMediaStreamSource(recebido);
        analisador = novoContexto.createAnalyser();
        analisador.fftSize = 2048;
        buffer = new Float32Array(new ArrayBuffer(analisador.fftSize * Float32Array.BYTES_PER_ELEMENT));
        mudo = novoContexto.createGain();
        mudo.gain.value = 0;
        fonte.connect(novoColetor);
        fonte.connect(analisador);
        novoColetor.connect(mudo);
        mudo.connect(novoContexto.destination);
        const formato = typeof MediaRecorder.isTypeSupported === 'function'
          ? FORMATOS_PREFERIDOS.find((tipo) => MediaRecorder.isTypeSupported(tipo))
          : undefined;
        try {
          gravador = formato ? new MediaRecorder(recebido, { mimeType: formato }) : new MediaRecorder(recebido);
        } catch {
          // Suporte declarado não garante recursos para criar o gravador.
          gravador = new MediaRecorder(recebido);
        }
        const atual = gravador;
        atual.ondataavailable = (evento) => { if (evento.data.size > 0) pedacos.push(evento.data); };
        atual.onerror = () => encerrarComFalha('gravacao_incompleta', true);
        atual.onstop = () => { if (fase === 'gravando') encerrarComFalha('gravacao_incompleta', true); };
        novoColetor.onprocessorerror = () => encerrarComFalha('pcm_indisponivel', true);
        novoColetor.port.onmessage = (evento: MessageEvent<MensagemPcm>) => {
          if (versao !== geracao || fase !== 'gravando') return;
          if (evento.data.tipo === 'calibrado') { limparTimer(); eventos?.aoCalibrar(); }
          if (evento.data.tipo === 'limite') eventos?.aoLimite();
        };
        aoFimDaTrilha = () => { if (fase === 'gravando') encerrarComFalha('gravacao_incompleta', true); };
        recebido.getTracks().forEach((trilha) => trilha.addEventListener('ended', aoFimDaTrilha!));
        novoContexto.onstatechange = () => {
          if (fase === 'gravando' && novoContexto.state !== 'running') encerrarComFalha('pcm_indisponivel', true);
        };
        atual.start();
        fase = 'gravando';
        timeout = setTimeout(() => encerrarComFalha('pcm_indisponivel', true), PRAZO_CALIBRACAO_MS);
        return { ok: true };
      } catch (erro) {
        if (versao !== geracao) return { ok: false, motivo: 'cancelada' };
        const nome = erro instanceof Error ? erro.name : '';
        const motivo: FalhaCapturaPcmV2 = nome === 'NotAllowedError' || nome === 'SecurityError'
          ? 'permissao_negada'
          : nome === 'NotFoundError' || nome === 'NotReadableError' ? 'microfone_indisponivel' : 'pcm_indisponivel';
        encerrarComFalha(motivo, false);
        return { ok: false, motivo };
      }
    },

    parar(): Promise<ResultadoCapturaPcmV2> {
      const atual = gravador;
      const no = coletor;
      if (fase !== 'gravando' || !atual || !no || atual.state === 'inactive') {
        encerrarComFalha('gravacao_incompleta', false);
        return Promise.resolve({ ok: false, motivo: 'gravacao_incompleta' });
      }
      fase = 'finalizando';
      limparTimer();
      return new Promise((resolve) => {
        resolverFim = resolve;
        let pcm: DadosPcm | null = null;
        let arquivo: Blob | null = null;
        function concluirSePronto() {
          if (!pcm || !arquivo) return;
          const resultado: ResultadoCapturaPcmV2 = pcm.excedeu ? { ok: false, motivo: 'limite_excedido' }
            : !Number.isFinite(pcm.sampleRate) || pcm.sampleRate <= 0 ||
              !(pcm.ambiente instanceof Float32Array) || !(pcm.emissao instanceof Float32Array) ||
              pcm.ambiente.length < Math.round(pcm.sampleRate * 0.5) || pcm.emissao.length === 0 || arquivo.size === 0
              ? { ok: false, motivo: 'gravacao_incompleta' }
              : { ok: true, audio: arquivo, formato: arquivo.type, ambiente: pcm.ambiente, emissao: pcm.emissao, sampleRate: pcm.sampleRate };
          resolverFim = null;
          geracao++;
          limpar();
          resolve(resultado);
        }
        no.port.onmessage = (evento: MessageEvent<MensagemPcm>) => {
          if (evento.data.tipo !== 'dados') return;
          pcm = evento.data;
          concluirSePronto();
        };
        atual.onstop = () => {
          const formato = atual.mimeType || pedacos.find((parte) => parte.type)?.type || '';
          arquivo = new Blob(pedacos, { type: formato });
          concluirSePronto();
        };
        timeout = setTimeout(() => encerrarComFalha('pcm_indisponivel', false), PRAZO_FINALIZACAO_MS);
        try {
          atual.stop();
          no.port.postMessage('finalizar');
          // Mantemos apenas o grafo vivo até receber PCM; a track para já.
          stream?.getTracks().forEach((trilha) => trilha.stop());
        } catch {
          encerrarComFalha('gravacao_incompleta', false);
        }
      });
    },

    cancelar() { encerrarComFalha('cancelada', false); },
    nivelAtual() {
      if (!analisador || !buffer) return 0;
      analisador.getFloatTimeDomainData(buffer);
      let soma = 0;
      for (const valor of buffer) soma += valor * valor;
      return Math.min(1, Math.sqrt(Math.sqrt(soma / buffer.length) * 8));
    },
    estaGravando() { return fase === 'gravando' && gravador?.state === 'recording'; },
  };
}
