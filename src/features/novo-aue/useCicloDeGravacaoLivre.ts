import { useCallback, useEffect, useRef, useState } from 'react';
import type { GravacaoLivreDoForum } from '../../portas/forum';

type EstadoDaGravacaoLivre = 'ociosa' | 'iniciando' | 'gravando' | 'finalizando' | 'falhou' | 'pronta';

/**
 * Guarda de intenção para os três compositores. Ela não conhece microfone ou
 * MediaRecorder: recebe a gravação já criada pela porta e só protege o ciclo
 * assíncrono para que um texto não seja publicado enquanto há áudio pendente.
 */
export function useCicloDeGravacaoLivre(aberto = true) {
  const [estado, setEstado] = useState<EstadoDaGravacaoLivre>('ociosa');
  const estadoRef = useRef<EstadoDaGravacaoLivre>('ociosa');
  const intencaoDeAudioRef = useRef(false);
  const geracaoRef = useRef(0);
  const gravacaoRef = useRef<GravacaoLivreDoForum | null>(null);

  const atualizar = useCallback((proximo: EstadoDaGravacaoLivre) => {
    estadoRef.current = proximo;
    setEstado(proximo);
  }, []);

  const iniciar = useCallback((gravacao: GravacaoLivreDoForum) => {
    if (estadoRef.current !== 'ociosa' && estadoRef.current !== 'falhou') return null;
    const geracao = ++geracaoRef.current;
    intencaoDeAudioRef.current = true;
    gravacaoRef.current = gravacao;
    atualizar('iniciando');
    return geracao;
  }, [atualizar]);

  const aindaAtual = useCallback((geracao: number) => geracao === geracaoRef.current, []);

  const marcouInicio = useCallback((geracao: number) => {
    if (!aindaAtual(geracao)) return false;
    atualizar('gravando');
    return true;
  }, [aindaAtual, atualizar]);

  const parar = useCallback(() => {
    if (estadoRef.current !== 'gravando') return false;
    atualizar('finalizando');
    gravacaoRef.current?.parar();
    return true;
  }, [atualizar]);

  const falhou = useCallback((geracao: number) => {
    if (!aindaAtual(geracao)) return false;
    gravacaoRef.current = null;
    atualizar('falhou');
    return true;
  }, [aindaAtual, atualizar]);

  const audioPronto = useCallback((geracao: number) => {
    if (!aindaAtual(geracao)) return false;
    gravacaoRef.current = null;
    atualizar('pronta');
    return true;
  }, [aindaAtual, atualizar]);

  const descartar = useCallback(() => {
    ++geracaoRef.current;
    gravacaoRef.current?.cancelar();
    gravacaoRef.current = null;
    intencaoDeAudioRef.current = false;
    atualizar('ociosa');
  }, [atualizar]);

  useEffect(() => () => {
    ++geracaoRef.current;
    gravacaoRef.current?.cancelar();
    gravacaoRef.current = null;
  }, []);

  useEffect(() => {
    if (!aberto) descartar();
  }, [aberto, descartar]);

  return {
    estado,
    iniciar,
    aindaAtual,
    marcouInicio,
    parar,
    falhou,
    audioPronto,
    descartar,
    /** Ref síncrona: handlers de submit não dependem de uma renderização. */
    bloqueiaEnvio: () => intencaoDeAudioRef.current && estadoRef.current !== 'pronta',
    bloqueiaTrocaDeMidia: () => intencaoDeAudioRef.current,
  };
}
