import { useRef, useState } from 'react';

/**
 * O que quem envia devolve. Só `true` conta como enviado.
 * - `false` ou exceção: tentou e falhou; a tela mostra erro e mantém o texto;
 * - `'sem-conta'`: não tentou (visitante foi mandado criar conta); mantém o texto, sem erro.
 * Não há `void` de propósito: quem esquecer de devolver o resultado não compila.
 */
export type RespostaDoEnvio = boolean | 'sem-conta';
export type ResultadoDoEnvio = RespostaDoEnvio | Promise<RespostaDoEnvio>;

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
      if (resultado === 'sem-conta') return false;
      if (resultado !== true) {
        setErro(true);
        return false;
      }
      return true;
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
