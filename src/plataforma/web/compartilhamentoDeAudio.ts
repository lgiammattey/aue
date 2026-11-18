import type { CompartilhamentoDeAudio } from '../../portas/compartilhamentoDeAudio';

function nomeDoAudio(tipo: string): string {
  const mime = tipo.split(';', 1)[0].trim().toLowerCase();
  const extensoes: Record<string, string> = {
    'audio/wav': 'wav', 'audio/x-wav': 'wav', 'audio/webm': 'webm',
    'audio/ogg': 'ogg', 'audio/mp4': 'm4a', 'audio/x-m4a': 'm4a',
    'audio/mpeg': 'mp3', 'audio/aac': 'aac',
  };
  return `aue-gravacao.${extensoes[mime] ?? 'bin'}`;
}

export function criarCompartilhamentoDeAudioWeb(): CompartilhamentoDeAudio {
  return {
    async compartilhar(audio) {
      try {
        if (!navigator.share || !navigator.canShare || typeof File === 'undefined') return 'indisponivel';
        const arquivo = new File([audio], nomeDoAudio(audio.type), { type: audio.type });
        const pedido = { files: [arquivo], title: 'Minha gravação no Auê' };
        if (!navigator.canShare(pedido)) return 'indisponivel';
        // A chamada acontece diretamente no gesto, antes de qualquer espera.
        await navigator.share(pedido);
        return 'aberto';
      } catch (erro) {
        return typeof erro === 'object' && erro !== null && 'name' in erro && erro.name === 'AbortError' ? 'cancelado' : 'falhou';
      }
    },
    baixar(audio) {
      let url: string | undefined;
      try {
        url = URL.createObjectURL(audio);
        const link = document.createElement('a');
        link.href = url;
        link.download = nomeDoAudio(audio.type);
        link.click();
        // A navegação do navegador pode começar depois de click retornar.
        const endereco = url;
        setTimeout(() => URL.revokeObjectURL(endereco), 60_000);
        return true;
      } catch {
        if (url) URL.revokeObjectURL(url);
        return false;
      }
    },
  };
}
