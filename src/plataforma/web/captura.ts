import type {
  AudioCapturado,
  CapturaDeAudio,
  FalhaAoParar,
  PedidoDeMicrofone,
} from '../../portas/captura';
import type { ResumoDoSinal } from '../../nucleo/gravacao/regras';

/**
 * O microfone no navegador: permissão, gravador e medidor, com um dono só.
 *
 * Este arquivo é um dos poucos autorizados a chamar API de navegador
 * (`docs/technical/adr/0001-arquitetura-oficial-do-aue.md` §2). O resto do
 * jogo fala com a porta.
 *
 * O QUE ELE GARANTE:
 *
 * 1. **Um stream por vez.** Pedir duas vezes sem soltar devolve o mesmo — dois
 *    streams vivos significam dois indicadores de microfone no sistema e um
 *    deles sem dono.
 * 2. **Soltar é idempotente e solta TUDO.** Trilhas paradas, gravador parado,
 *    medidor parado, contexto de áudio fechado. Todo caminho de saída chama, e
 *    caminho de saída não tem tempo de conferir se o outro já chamou.
 * 3. **Parar a trilha, não só largar a referência.** Coletor de lixo não apaga
 *    a luzinha do microfone; `track.stop()` apaga.
 * 4. **O formato nunca é cravado.** O `MediaRecorder` nasce sem `mimeType`
 *    escolhido por nós e o tipo sai do que ele diz ter gravado. Cravar `webm`
 *    mataria o iPhone, que grava AAC — e só passou a aceitar Opus no 18.4.
 */

/** De quanto em quanto tempo o medidor tira uma amostra do sinal. */
const INTERVALO_DE_MEDICAO_MS = 50;

export function criarCapturaWeb(): CapturaDeAudio {
  let stream: MediaStream | null = null;
  let gravador: MediaRecorder | null = null;
  let pedidoPendente: Promise<PedidoDeMicrofone> | null = null;
  let geracao = 0;
  let contexto: AudioContext | null = null;
  let analisador: AnalyserNode | null = null;
  let amostrador: ReturnType<typeof setInterval> | null = null;
  /*
    `Float32Array<ArrayBuffer>` explícito: o `getFloatTimeDomainData` recusa um
    array que possa estar sobre `SharedArrayBuffer`, e `new Float32Array(n)`
    tem o tipo largo. Daí o buffer nascer de um `ArrayBuffer` de verdade lá
    embaixo.
  */
  let buffer: Float32Array<ArrayBuffer> | null = null;

  let pedacos: Blob[] = [];
  let nivel = 0;
  let somaDosQuadrados = 0;
  let amostras = 0;
  let pico = 0;
  let comecouEm = 0;

  /**
   * O medidor roda no ritmo dele, e não no da tela.
   *
   * Se a acumulação dependesse de alguém chamar `nivelAtual()`, uma pessoa com
   * movimento reduzido — cuja Bolha não anima e portanto não pergunta nada —
   * gravaria e receberia "não veio som" com o microfone funcionando
   * perfeitamente. Acessibilidade virando bug de gameplay.
   */
  function medir() {
    if (!analisador || !buffer) return;

    analisador.getFloatTimeDomainData(buffer);

    let soma = 0;
    let maior = 0;
    for (const amostra of buffer) {
      soma += amostra * amostra;
      const absoluto = Math.abs(amostra);
      if (absoluto > maior) maior = absoluto;
    }

    const rmsDaJanela = Math.sqrt(soma / buffer.length);

    somaDosQuadrados += rmsDaJanela * rmsDaJanela;
    amostras += 1;
    if (maior > pico) pico = maior;

    /*
      O nível que a Bolha lê é comprimido: um arroto forte fica perto de 0,3 de
      RMS, e mapear 0..1 linearmente deixaria a Bolha quase parada o tempo todo.
      A raiz abre a parte de baixo da escala, que é onde a vida acontece.
    */
    nivel = Math.min(1, Math.sqrt(rmsDaJanela * 8));
  }

  function resumo(): ResumoDoSinal {
    return {
      rms: amostras > 0 ? Math.sqrt(somaDosQuadrados / amostras) : 0,
      pico,
    };
  }

  function pararOMedidor() {
    if (amostrador !== null) {
      clearInterval(amostrador);
      amostrador = null;
    }
    analisador = null;
    buffer = null;
    if (contexto) {
      /*
        `close()` devolve promessa e pode rejeitar se o contexto já estiver
        fechado. Não há o que fazer com esse erro, e deixá-lo escapar viraria
        rejeição não tratada no console de quem está jogando.
      */
      void contexto.close().catch(() => {});
      contexto = null;
    }
    nivel = 0;
  }

  function soltar(): void {
    geracao += 1;
    pedidoPendente = null;
    if (gravador && gravador.state !== 'inactive') {
      try {
        gravador.stop();
      } catch {
        /* Gravador já morto. Não é problema de ninguém. */
      }
    }
    gravador = null;

    pararOMedidor();

    if (stream) {
      for (const trilha of stream.getTracks()) {
        trilha.stop();
      }
      stream = null;
    }
  }

  return {
    pedir(): Promise<PedidoDeMicrofone> {
      if (stream) return Promise.resolve({ ok: true });
      if (pedidoPendente) return pedidoPendente;
      if (gravador) {
        return Promise.resolve({ ok: false, motivo: 'falhou', detalhe: 'A gravação anterior ainda está terminando.' });
      }

      const midia = navigator.mediaDevices;
      if (!midia?.getUserMedia) {
        return Promise.resolve({ ok: false, motivo: 'semAparelho' });
      }

      const versao = geracao;
      const pedido = (async (): Promise<PedidoDeMicrofone> => {
        try {
          // São preferências: o navegador ou o aparelho podem não respeitá-las.
          const recebido = await midia.getUserMedia({
            audio: { autoGainControl: false, echoCancellation: false, noiseSuppression: false },
          });
          if (versao !== geracao) {
            recebido.getTracks().forEach((trilha) => trilha.stop());
            return { ok: false, motivo: 'falhou', detalhe: 'O pedido de microfone foi cancelado.' };
          }
          stream = recebido;
          return { ok: true };
        } catch (erro) {
          if (versao !== geracao) {
            return { ok: false, motivo: 'falhou', detalhe: 'O pedido de microfone foi cancelado.' };
          }
          return traduzir(erro);
        } finally {
          if (versao === geracao) pedidoPendente = null;
        }
      })();
      pedidoPendente = pedido;
      return pedido;
    },

    comecar(): boolean {
      if (!stream) return false;
      if (gravador) return true;

      pedacos = [];
      somaDosQuadrados = 0;
      amostras = 0;
      pico = 0;
      nivel = 0;

      try {
        /*
          SEM `mimeType`. O navegador escolhe o que sabe gravar, e o tipo do
          resultado sai de `gravador.mimeType` lá embaixo. É o que faz o mesmo
          código gravar Opus no Android e AAC no iPhone.
        */
        gravador = new MediaRecorder(stream);
        const pedacosDestaGravacao = pedacos;
        gravador.ondataavailable = (evento) => {
          if (evento.data.size > 0) pedacosDestaGravacao.push(evento.data);
        };
        gravador.start();

        /*
          O contexto de áudio precisa nascer DENTRO do gesto que pediu o
          microfone. No iPhone ele nasce suspenso fora de gesto, e um contexto
          suspenso mede zero — a Bolha ficaria parada com a pessoa arrotando na
          cara do telefone, que é exatamente o medo que ela existe para matar.
        */
        contexto = new AudioContext();
        void contexto.resume().catch(() => {});

        analisador = contexto.createAnalyser();
        analisador.fftSize = 2048;
        buffer = new Float32Array(
          new ArrayBuffer(analisador.fftSize * Float32Array.BYTES_PER_ELEMENT),
        );
        contexto.createMediaStreamSource(stream).connect(analisador);

        amostrador = setInterval(medir, INTERVALO_DE_MEDICAO_MS);
        comecouEm = Date.now();
        return true;
      } catch {
        // Nasceu pela metade: desfaz tudo em vez de deixar meio gravador vivo.
        soltar();
        return false;
      }
    },

    parar(): Promise<AudioCapturado | FalhaAoParar> {
      const emUso = gravador;
      if (!emUso || emUso.state === 'inactive') {
        soltar();
        return Promise.resolve({ motivo: 'naoEstavaGravando' } as FalhaAoParar);
      }

      const duracaoMs = Date.now() - comecouEm;
      const medido = resumo();
      const pedacosDestaGravacao = pedacos;

      return new Promise<AudioCapturado | FalhaAoParar>((resolve) => {
        /*
          O `onstop` é o único momento em que o último pedaço já chegou. Sair
          antes dele devolveria um áudio cortado no fim — justamente onde mora
          o final do arroto.
        */
        emUso.onstop = () => {
          if (gravador !== emUso) {
            resolve({ motivo: 'quebrou', detalhe: 'A gravação foi cancelada.' });
            return;
          }
          const formato = emUso.mimeType || pedacosDestaGravacao.find((p) => p.type)?.type || '';
          const dados = new Blob(pedacosDestaGravacao, { type: formato });
          pedacos = [];
          soltar();
          resolve({ dados, formato, duracaoMs, resumo: medido });
        };

        emUso.onerror = () => {
          if (gravador === emUso) {
            pedacos = [];
            soltar();
          }
          resolve({ motivo: 'quebrou', detalhe: 'o gravador falhou ao fechar' });
        };

        try {
          emUso.stop();
          // O último dataavailable ainda chega no onstop; a trilha não precisa
          // permanecer ativa enquanto o navegador finaliza o arquivo.
          pararOMedidor();
          if (stream) {
            for (const trilha of stream.getTracks()) trilha.stop();
            stream = null;
          }
        } catch (erro) {
          soltar();
          resolve({
            motivo: 'quebrou',
            detalhe: erro instanceof Error ? erro.message : String(erro),
          });
        }
      });
    },

    nivelAtual(): number {
      return nivel;
    },

    soltar,

    estaVivo(): boolean {
      return stream !== null;
    },

    estaGravando(): boolean {
      return gravador !== null && gravador.state === 'recording';
    },
  };
}

/**
 * O que o navegador levanta, traduzido para o que o jogo precisa saber.
 *
 * Os nomes vêm do padrão e são os mesmos nos três navegadores que importam.
 * `SecurityError` entra junto de `NotAllowedError` porque, do lado de quem
 * está jogando, política de permissão bloqueando e pessoa dizendo não são a
 * mesma frustração: não tem microfone.
 */
function traduzir(erro: unknown): PedidoDeMicrofone {
  const nome = erro instanceof Error ? erro.name : '';

  if (nome === 'NotAllowedError' || nome === 'SecurityError' || nome === 'PermissionDeniedError') {
    return { ok: false, motivo: 'negado' };
  }
  if (nome === 'NotFoundError' || nome === 'DevicesNotFoundError' || nome === 'OverconstrainedError') {
    return { ok: false, motivo: 'semAparelho' };
  }

  return {
    ok: false,
    motivo: 'falhou',
    detalhe: erro instanceof Error ? erro.message : String(erro),
  };
}
