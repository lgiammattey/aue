import type {
  GravacaoLivreDoForum,
  InicioDaGravacaoLivreDoForum,
  ResultadoDaGravacaoLivreDoForum,
} from '../../portas/forum';

/** O teto de produto vale para tópico e resposta, sem exceção. */
export const DURACAO_MAXIMA_DA_GRAVACAO_LIVRE_MS = 60_000;

/** O Storage aceita a base MIME; `formato` preserva o valor cru do gravador. */
export function normalizarMimeDaGravacaoLivre(formato: string): string {
  return formato.trim().toLowerCase().split(';', 1)[0] ?? '';
}

/**
 * Captura curta do composer. Não conhece Arena, score ou detector: é voz livre
 * autorizada para uma conversa. Este módulo é o dono exclusivo de stream,
 * MediaRecorder e timer; a UI recebe só a promessa de conclusão.
 */
export function criarGravacaoLivreDoForum(): GravacaoLivreDoForum {
  let stream: MediaStream | null = null;
  let gravador: MediaRecorder | null = null;
  let pedacos: Blob[] = [];
  let iniciouEm = 0;
  let temporizador: ReturnType<typeof setTimeout> | null = null;
  let intencao: 'manual' | 'limite' | 'cancelado' | null = null;
  let concluir: ((resultado: ResultadoDaGravacaoLivreDoForum) => void) | null = null;
  let inicioPendente = false;
  let cancelamentoDuranteInicio = false;

  function liberarStream() {
    if (temporizador !== null) {
      clearTimeout(temporizador);
      temporizador = null;
    }
    if (stream) {
      for (const trilha of stream.getTracks()) trilha.stop();
      stream = null;
    }
    gravador = null;
    pedacos = [];
    iniciouEm = 0;
    intencao = null;
    inicioPendente = false;
    cancelamentoDuranteInicio = false;
  }

  function resolver(resultado: ResultadoDaGravacaoLivreDoForum) {
    const proximo = concluir;
    concluir = null;
    liberarStream();
    proximo?.(resultado);
  }

  function encerrar(motivo: 'manual' | 'limite' | 'cancelado') {
    const atual = gravador;
    if (!atual || atual.state === 'inactive' || intencao !== null) return;
    intencao = motivo;
    if (temporizador !== null) {
      clearTimeout(temporizador);
      temporizador = null;
    }
    try {
      atual.stop();
    } catch (erro) {
      resolver({ ok: false, motivo: 'falhou', detalhe: detalhe(erro) });
    }
  }

  return {
    async iniciar(): Promise<InicioDaGravacaoLivreDoForum> {
      if (inicioPendente || gravador?.state === 'recording') {
        return { ok: false, motivo: 'falhou', detalhe: 'A gravação livre já está em andamento.' };
      }
      // Navegadores não expõem microfone para um IP servido em HTTP. `localhost`
      // é a única exceção segura para desenvolvimento.
      if (typeof window !== 'undefined' && window.isSecureContext === false) {
        return { ok: false, motivo: 'inseguro' };
      }
      const midia = typeof navigator === 'undefined' ? undefined : navigator.mediaDevices;
      if (!midia?.getUserMedia || typeof MediaRecorder === 'undefined') {
        return { ok: false, motivo: 'indisponivel' };
      }
      inicioPendente = true;
      cancelamentoDuranteInicio = false;
      let novoStream: MediaStream;
      try {
        novoStream = await midia.getUserMedia({ audio: true });
      } catch (erro) {
        const cancelado = cancelamentoDuranteInicio;
        inicioPendente = false;
        cancelamentoDuranteInicio = false;
        if (cancelado) return { ok: false, motivo: 'cancelado' };
        return traduzirPermissao(erro);
      }

      if (cancelamentoDuranteInicio) {
        for (const trilha of novoStream.getTracks()) trilha.stop();
        inicioPendente = false;
        cancelamentoDuranteInicio = false;
        return { ok: false, motivo: 'cancelado' };
      }

      stream = novoStream;
      inicioPendente = false;

      try {
        const novo = new MediaRecorder(stream);
        gravador = novo;
        pedacos = [];
        iniciouEm = Date.now();
        intencao = null;
        const conclusao = new Promise<ResultadoDaGravacaoLivreDoForum>((resolve) => { concluir = resolve; });

        novo.ondataavailable = (evento) => {
          if (evento.data.size > 0) pedacos.push(evento.data);
        };
        novo.onerror = () => resolver({ ok: false, motivo: 'falhou', detalhe: 'O gravador de áudio falhou.' });
        novo.onstop = () => {
          const encerramento = intencao;
          if (encerramento === 'cancelado') {
            resolver({ ok: false, motivo: 'cancelado' });
            return;
          }
          if (encerramento !== 'manual' && encerramento !== 'limite') {
            resolver({ ok: false, motivo: 'falhou', detalhe: 'A gravação foi encerrada sem confirmação.' });
            return;
          }
          const formato = novo.mimeType || 'audio/webm';
          const mimeParaEnvio = normalizarMimeDaGravacaoLivre(formato);
          const dados = new Blob(pedacos, { type: mimeParaEnvio });
          if (dados.size < 1) {
            resolver({ ok: false, motivo: 'falhou', detalhe: 'A gravação terminou sem dados de áudio.' });
            return;
          }
          const duracaoMs = Math.min(DURACAO_MAXIMA_DA_GRAVACAO_LIVRE_MS, Math.max(0, Date.now() - iniciouEm));
          resolver({ ok: true, encerramento, audio: { dados, formato, mimeParaEnvio, duracaoMs } });
        };
        novo.start();
        temporizador = setTimeout(() => encerrar('limite'), DURACAO_MAXIMA_DA_GRAVACAO_LIVRE_MS);
        return { ok: true, conclusao };
      } catch (erro) {
        liberarStream();
        return { ok: false, motivo: 'falhou', detalhe: detalhe(erro) };
      }
    },

    parar() {
      encerrar('manual');
    },

    cancelar() {
      if (inicioPendente) {
        cancelamentoDuranteInicio = true;
        return;
      }
      encerrar('cancelado');
    },

    estaGravando() {
      return gravador?.state === 'recording';
    },
  };
}

function traduzirPermissao(erro: unknown): Exclude<InicioDaGravacaoLivreDoForum, { readonly ok: true }> {
  const nome = erro instanceof Error ? erro.name : '';
  if (nome === 'NotAllowedError' || nome === 'SecurityError' || nome === 'PermissionDeniedError') {
    return { ok: false, motivo: 'negado' };
  }
  if (nome === 'NotFoundError' || nome === 'DevicesNotFoundError' || nome === 'OverconstrainedError') {
    return { ok: false, motivo: 'indisponivel' };
  }
  return { ok: false, motivo: 'falhou', detalhe: detalhe(erro) };
}

function detalhe(erro: unknown): string {
  return erro instanceof Error ? erro.message : String(erro);
}
