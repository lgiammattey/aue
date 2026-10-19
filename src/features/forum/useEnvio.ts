import { useCallback, useRef, useState } from 'react';
import type { ResultadoDaEscrita } from '../../portas/forum';

/**
 * Envio de escrita com proteção de duplo toque (spec 6.7).
 *
 * - Enquanto um envio está no ar, um segundo é ignorado (`null`), no mesmo tique:
 *   a trava é uma ref, não um estado que só vale depois da próxima pintura.
 * - Exceção da porta (não devia acontecer) vira `semConfirmacao`: pode ter gravado.
 * - `travarSeOk`: depois de um envio que deu certo e que vai tirar a tela do ar
 *   (criar tópico navega), a trava NÃO solta. Entre o `ok` e a tela sumir ainda cabe
 *   um toque, e ele criaria o segundo tópico.
 */
export function useEnvio() {
  const [enviando, setEnviando] = useState(false);
  const emVoo = useRef(false);

  const enviar = useCallback(
    async <T,>(
      acao: () => Promise<ResultadoDaEscrita<T>>,
      opcoes: { readonly travarSeOk?: boolean } = {},
    ): Promise<ResultadoDaEscrita<T> | null> => {
      if (emVoo.current) return null;
      emVoo.current = true;
      setEnviando(true);
      let resultado: ResultadoDaEscrita<T>;
      try {
        resultado = await acao();
      } catch {
        resultado = { ok: false, motivo: 'semConfirmacao' };
      }
      if (resultado.ok && opcoes.travarSeOk) return resultado;
      emVoo.current = false;
      setEnviando(false);
      return resultado;
    },
    [],
  );

  return { enviando, enviar };
}
