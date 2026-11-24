/**
 * Textos da Arena v2 nos dois idiomas.
 *
 * O idioma segue a rota: `/` fala português, `/en` fala inglês. Não há detecção
 * por navegador nem por IP, e não há biblioteca de tradução: a Arena usa um
 * dicionário tipado. `Record<Idioma, TextosDaArena>` obriga os dois lados a ter
 * exatamente as mesmas chaves, então faltar tradução derruba a build.
 *
 * O português abaixo é o texto que a Arena já tinha, sem mudança nenhuma. O
 * inglês é escrito para quem joga, não traduzido palavra por palavra. A régua da
 * nota continua experimental: nenhum texto promete decibel, medição científica
 * ou prova de que o som é um arroto.
 */
export type Idioma = 'pt' | 'en';

interface Link { readonly href: string; readonly rotulo: string }

export interface TextosDaArena {
  readonly falha: {
    readonly permissaoNegada: string;
    readonly microfoneIndisponivel: string;
    readonly pcmIndisponivel: string;
    readonly limiteExcedido: string;
    readonly cancelada: string;
    readonly padrao: string;
  };
  readonly inconclusivo: {
    readonly clipping: string;
    readonly ambienteAlto: string;
    readonly ambienteInstavel: string;
    readonly ambienteNaoMedido: string;
    readonly emissaoInsuficiente: string;
    readonly padrao: string;
  };
  readonly interrompida: string;
  readonly naoAbriuMicrofone: string;
  readonly naoIniciouGravacao: string;
  readonly naoConcluiuGravacao: string;
  readonly calibracaoSemAudio: string;
  readonly compartilhamento: {
    readonly aberto: string;
    readonly cancelado: string;
    readonly indisponivel: string;
    readonly falhou: string;
  };
  readonly download: { readonly solicitado: string; readonly falhou: string };
  readonly titulo: { readonly revisao: string; readonly gravando: string; readonly pronto: string };
  readonly gatilho: {
    readonly gravando: string;
    readonly calibrando: string;
    readonly permissao: string;
    readonly finalizando: string;
    readonly erro: string;
    readonly pronto: string;
  };
  readonly identificador: string;
  readonly meusDesafios: string;
  /** `null` esconde o atalho: a tela cheia só existe em português. */
  readonly telaCheia: string | null;
  readonly instrucaoX1: (handle: string) => string;
  readonly instrucao: string;
  readonly gravandoRotulo: string;
  readonly tempoQuaseEsgotado: string;
  readonly revisao: {
    readonly titulo: string;
    readonly texto: string;
    readonly calibracaoAusente: string;
  };
  readonly playerRotulo: string;
  readonly player: {
    readonly regiao: (rotulo: string) => string;
    readonly pausar: string;
    readonly reproduzir: string;
    readonly posicao: string;
    readonly tempoDe: (atual: string, total: string) => string;
  };
  readonly laudo: {
    readonly titulo: string;
    readonly aria: string;
    readonly nota: string;
    readonly notaAria: (nota: number) => string;
    readonly duracao: string;
    readonly duracaoValor: (segundos: number) => string;
    readonly potencia: string;
    readonly frequencia: string;
    readonly indisponivel: string;
    readonly aviso: string;
    readonly semLaudo: string;
    readonly naoMedida: string;
  };
  readonly continuarDesafio: string;
  readonly publicarNoMural: string;
  readonly compartilhar: string;
  readonly compartilhando: string;
  readonly baixar: string;
  readonly descartar: string;
  readonly voltar: string;
  readonly gravarSemLaudo: string;
  readonly dicaDuelo: (criar: boolean) => string;
  readonly privacidade: { readonly embutida: string; readonly completa: string };
  readonly status: {
    readonly permissao: string;
    readonly calibrando: string;
    readonly finalizando: string;
  };
  readonly cabecalho: {
    readonly navegacaoAria: string;
    readonly itens: readonly Link[];
    readonly seuDesafioAria: string;
    readonly modoArena: string;
    readonly contra: (handle: string) => string;
    readonly puxaOAr: string;
  };
  readonly rodape: readonly Link[];
  readonly arenaAria: string;
  readonly beta: string;
}

const PT: TextosDaArena = {
  falha: {
    permissaoNegada: 'O microfone está bloqueado. Libere o acesso nas configurações do navegador e tente de novo.',
    microfoneIndisponivel: 'Não encontramos um microfone disponível neste navegador ou aparelho.',
    pcmIndisponivel: 'A medição experimental de áudio não está disponível agora. Tente novamente ou use outro navegador.',
    limiteExcedido: 'A gravação passou do limite. Tente novamente.',
    cancelada: 'A gravação foi interrompida. Tente novamente.',
    padrao: 'Não foi possível concluir a gravação. Tente novamente.',
  },
  inconclusivo: {
    clipping: 'O áudio saturou e a medição ficou inconclusiva. Afaste um pouco o microfone e tente novamente.',
    ambienteAlto: 'O ruído do ambiente impediu a medição. Tente novamente em um lugar mais silencioso.',
    ambienteInstavel: 'O ambiente mudou durante a medição. Fique em silêncio e tente novamente.',
    ambienteNaoMedido: 'Não foi possível medir o ambiente. Tente novamente e aguarde a calibração.',
    emissaoInsuficiente: 'Não conseguimos medir a duração desta tentativa. Grave novamente após aparecer GRAVANDO.',
    padrao: 'Não foi possível medir esta tentativa com confiança. Tente novamente.',
  },
  interrompida: 'A gravação foi interrompida. Tente novamente.',
  naoAbriuMicrofone: 'Não foi possível abrir o microfone. Tente novamente.',
  naoIniciouGravacao: 'Não foi possível iniciar a gravação. Tente novamente.',
  naoConcluiuGravacao: 'Não foi possível concluir a gravação. Tente novamente.',
  calibracaoSemAudio: 'Não recebemos áudio suficiente para calibrar. Tente novamente.',
  compartilhamento: {
    aberto: 'Opções de compartilhamento abertas.',
    cancelado: 'Compartilhamento cancelado.',
    indisponivel: 'Este aparelho não compartilha este arquivo. Você pode baixá-lo.',
    falhou: 'Não foi possível compartilhar. Tente novamente ou baixe o arquivo.',
  },
  download: {
    solicitado: 'Download solicitado ao navegador.',
    falhou: 'Não foi possível iniciar o download.',
  },
  titulo: { revisao: 'TÁ GRAVADO.', gravando: 'SOLTA AGORA.', pronto: 'SOLTA O ARROTO.' },
  gatilho: {
    gravando: 'Finalizar gravação',
    calibrando: 'Cancelar gravação',
    permissao: 'Cancelar pedido',
    finalizando: 'Finalizando',
    erro: 'Tentar novamente',
    pronto: 'Gravar agora',
  },
  identificador: 'ARENA · 0 A 100',
  meusDesafios: 'Meus desafios',
  telaCheia: 'Tela cheia ↗',
  instrucaoX1: (handle) => `X1 contra @${handle}.`,
  instrucao: 'Grava no microfone, vê a nota e manda nos grupos.',
  gravandoRotulo: 'GRAVANDO',
  tempoQuaseEsgotado: 'Tempo quase esgotado.',
  revisao: {
    titulo: 'SUA GRAVAÇÃO',
    texto: 'Ouve aí. Só vai pro ar se você quiser — ela não foi publicada no Auê.',
    calibracaoAusente: ' A calibração não está neste áudio.',
  },
  playerRotulo: 'Sua gravação',
  player: {
    regiao: (rotulo) => `Reprodutor: ${rotulo}`,
    pausar: 'Pausar gravação',
    reproduzir: 'Reproduzir gravação',
    posicao: 'Posição da gravação',
    tempoDe: (atual, total) => `${atual} de ${total}`,
  },
  laudo: {
    titulo: 'LAUDO EXPERIMENTAL',
    aria: 'Laudo experimental',
    nota: 'Nota do arroto',
    notaAria: (nota) => `Nota: ${nota} de 100`,
    duracao: 'Duração detectada',
    duracaoValor: (segundos) => `${segundos.toFixed(2).replace('.', ',')} s`,
    potencia: 'Potência relativa',
    frequencia: 'Frequência',
    indisponivel: 'Indisponível',
    aviso: 'Medição experimental — varia com o aparelho e o lugar. Não é decibel.',
    semLaudo: 'Esta gravação não tem laudo nem nota.',
    naoMedida: 'Não foi possível medir esta tentativa.',
  },
  continuarDesafio: 'Para continuar o desafio, grave outra tentativa com medição disponível.',
  publicarNoMural: 'Publicar no Mural',
  compartilhar: 'Compartilhar áudio',
  compartilhando: 'Abrindo compartilhamento…',
  baixar: 'Baixar áudio',
  descartar: 'Descartar e gravar outra',
  voltar: 'Voltar',
  gravarSemLaudo: 'Gravar sem laudo',
  dicaDuelo: (criar) => `Grave uma tentativa para ${criar ? 'criar um desafio' : 'continuar o desafio'}.`,
  privacidade: {
    embutida: 'Sem cadastro. Mic só liga no clique.',
    completa: 'Sem cadastro. Mic só liga no clique. Medição experimental após calibração.',
  },
  status: {
    permissao: 'Libera o mic aí.',
    calibrando: 'Calibrando. Fica quieto 1s.',
    finalizando: 'Fechando o áudio…',
  },
  cabecalho: {
    navegacaoAria: 'Navegação principal',
    itens: [
      { href: '/feed', rotulo: 'Mural' },
      { href: '/ranking-de-arrotos', rotulo: 'Ranking' },
      { href: '/grupos', rotulo: 'Grupos Zap' },
    ],
    seuDesafioAria: 'Seu desafio',
    modoArena: 'MODO ARENA',
    contra: (handle) => `CONTRA @${handle}`,
    puxaOAr: 'PUXA O AR.',
  },
  rodape: [
    { href: '/como-jogar', rotulo: 'Como jogar' },
    { href: '/privacidade', rotulo: 'Privacidade' },
    { href: '/termos', rotulo: 'Termos' },
  ],
  arenaAria: 'Arena de Arrotos',
  beta: 'BETA',
};

const EN: TextosDaArena = {
  falha: {
    permissaoNegada: 'The microphone is blocked. Allow access in your browser settings and try again.',
    microfoneIndisponivel: "We couldn't find a microphone on this browser or device.",
    pcmIndisponivel: "The experimental audio reading isn't available right now. Try again or use another browser.",
    limiteExcedido: 'The recording went over the limit. Try again.',
    cancelada: 'The recording was interrupted. Try again.',
    padrao: "We couldn't finish the recording. Try again.",
  },
  inconclusivo: {
    clipping: 'The audio clipped, so the reading came out inconclusive. Hold the mic a bit farther away and try again.',
    ambienteAlto: 'Background noise got in the way of the reading. Try again somewhere quieter.',
    ambienteInstavel: 'The room changed during the reading. Stay quiet and try again.',
    ambienteNaoMedido: "We couldn't read the room. Try again and wait for the calibration.",
    emissaoInsuficiente: "We couldn't measure how long this attempt lasted. Record again after it says RECORDING.",
    padrao: "We couldn't measure this attempt with confidence. Try again.",
  },
  interrompida: 'The recording was interrupted. Try again.',
  naoAbriuMicrofone: "We couldn't open the microphone. Try again.",
  naoIniciouGravacao: "We couldn't start the recording. Try again.",
  naoConcluiuGravacao: "We couldn't finish the recording. Try again.",
  calibracaoSemAudio: "We didn't get enough audio to calibrate. Try again.",
  compartilhamento: {
    aberto: 'Share options opened.',
    cancelado: 'Sharing canceled.',
    indisponivel: "This device can't share this file. You can download it instead.",
    falhou: "We couldn't share it. Try again or download the file.",
  },
  download: {
    solicitado: 'Download requested from your browser.',
    falhou: "We couldn't start the download.",
  },
  titulo: { revisao: 'GOT IT.', gravando: 'BURP NOW.', pronto: 'BURP IT OUT.' },
  gatilho: {
    gravando: 'Stop recording',
    calibrando: 'Cancel recording',
    permissao: 'Cancel request',
    finalizando: 'Finishing',
    erro: 'Try again',
    pronto: 'Record now',
  },
  identificador: 'ARENA · 0 TO 100',
  meusDesafios: 'My challenges',
  telaCheia: null,
  instrucaoX1: (handle) => `1v1 against @${handle}.`,
  instrucao: 'Record on your mic, see your score and send it to your friends.',
  gravandoRotulo: 'RECORDING',
  tempoQuaseEsgotado: 'Almost out of time.',
  revisao: {
    titulo: 'YOUR RECORDING',
    texto: "Give it a listen. It only goes public if you want it to, and it hasn't been posted on Auê.",
    calibracaoAusente: " The calibration isn't part of this audio.",
  },
  playerRotulo: 'Your recording',
  player: {
    regiao: (rotulo) => `Player: ${rotulo}`,
    pausar: 'Pause recording',
    reproduzir: 'Play recording',
    posicao: 'Recording position',
    tempoDe: (atual, total) => `${atual} of ${total}`,
  },
  laudo: {
    titulo: 'EXPERIMENTAL READOUT',
    aria: 'Experimental readout',
    nota: 'Burp score',
    notaAria: (nota) => `Score: ${nota} out of 100`,
    duracao: 'Detected length',
    duracaoValor: (segundos) => `${segundos.toFixed(2)} s`,
    potencia: 'Relative power',
    frequencia: 'Frequency',
    indisponivel: 'Unavailable',
    aviso: 'Experimental reading. It changes with your device and your room. It is not decibels.',
    semLaudo: 'This recording has no readout or score.',
    naoMedida: "We couldn't measure this attempt.",
  },
  continuarDesafio: 'To keep the challenge going, record another attempt that can be measured.',
  publicarNoMural: 'Post to the Wall',
  compartilhar: 'Share audio',
  compartilhando: 'Opening share options…',
  baixar: 'Download audio',
  descartar: 'Discard and record another',
  voltar: 'Back',
  gravarSemLaudo: 'Record without readout',
  dicaDuelo: (criar) => `Record an attempt to ${criar ? 'create a challenge' : 'keep the challenge going'}.`,
  privacidade: {
    embutida: 'No sign-up. The mic only turns on when you click.',
    completa: 'No sign-up. The mic only turns on when you click. Experimental reading after calibration.',
  },
  status: {
    permissao: 'Allow the mic when your browser asks.',
    calibrando: 'Calibrating. Stay quiet for 1 second.',
    finalizando: 'Wrapping up the audio…',
  },
  cabecalho: {
    navegacaoAria: 'Main navigation',
    itens: [],
    seuDesafioAria: 'Your challenge',
    modoArena: 'ARENA MODE',
    contra: (handle) => `VS @${handle}`,
    puxaOAr: 'TAKE A BREATH.',
  },
  rodape: [
    { href: '/privacidade', rotulo: 'Privacy (in Portuguese)' },
    { href: '/termos', rotulo: 'Terms (in Portuguese)' },
  ],
  arenaAria: 'Burp Arena',
  beta: 'BETA',
};

export const TEXTOS_DA_ARENA: Record<Idioma, TextosDaArena> = { pt: PT, en: EN };

/** O idioma de uma rota: `/en` e tudo abaixo dela falam inglês. */
export function idiomaDoCaminho(caminho: string): Idioma {
  return caminho === '/en' || caminho.startsWith('/en/') ? 'en' : 'pt';
}
