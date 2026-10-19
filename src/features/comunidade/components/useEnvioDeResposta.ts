import { useRef, useState } from 'react';

/** `false` (ou uma exceção) quer dizer que a resposta NÃO foi enviada. */
export type ResultadoDoEnvio = void | boolean | Promise<void | boolean>;

/**
 * Envio de resposta sem perder o que a pessoa escreveu.
 *
 * Quem usa só limpa o campo quando `enviar` devolve `true`. Enquanto uma
 * resposta está indo, um segundo envio é ignorado (duplo toque não posta duas
 * vezes), e falha vira `erro` visível em vez de sumir em silêncio.
 */
export function useEnvioDeResposta() {
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState(false);
  const emVoo = useRef(false);

  const enviar = async (acao: () => ResultadoDoEnvio): Promise<boolean> => {
    if (emVoo.current) return false;
    emVoo.current = true;
    setEnviando(true);
    setErro(false);
    try {
      const resultado = await acao();
      const ok = resultado !== false;
      if (!ok) setErro(true);
      return ok;
    } catch {
      setErro(true);
      return false;
    } finally {
      emVoo.current = false;
      setEnviando(false);
    }
  };

  return { enviando, erro, enviar, limparErro: () => setErro(false) };
}

export const MENSAGEM_DE_ERRO_DE_RESPOSTA = 'Não deu para enviar. Seu texto continua aqui, tenta de novo.';
