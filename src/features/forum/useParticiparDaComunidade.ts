import { useCallback, useRef, useState } from 'react';
import { useDependenciasDoForum } from './contexto';
import { useAnunciar } from './encaixes';
import { useParticipacao } from './papel';
import { useToast } from './toast';

type Pendente = 'entrar' | 'sair' | null;

/**
 * Entrar e sair da comunidade (spec 8.2). A tela só muda DEPOIS que o servidor
 * respondeu `true`: nada de otimismo. Falha mostra a frase honesta e deixa tudo
 * como estava. Segundo toque durante a chamada é ignorado.
 */
export function useParticiparDaComunidade(comunidade: { readonly slug: string; readonly nome: string }, aoMudar?: () => void) {
  const { comunidade: porta } = useDependenciasDoForum();
  const participacao = useParticipacao();
  const anunciar = useAnunciar();
  const toast = useToast();
  const [pendente, setPendente] = useState<Pendente>(null);
  const [erro, setErro] = useState<string | null>(null);
  const emVoo = useRef(false);
  const ultimoAoMudar = useRef(aoMudar);
  ultimoAoMudar.current = aoMudar;
  const { slug, nome } = comunidade;

  const executar = useCallback(
    async (acao: 'entrar' | 'sair'): Promise<boolean> => {
      if (emVoo.current) return false;
      emVoo.current = true;
      setPendente(acao);
      setErro(null);
      let ok = false;
      try {
        ok = acao === 'entrar' ? await porta.entrarComunidade(slug) : await porta.sairComunidade(slug);
      } catch {
        ok = false;
      }
      emVoo.current = false;
      setPendente(null);
      if (!ok) {
        setErro(acao === 'entrar' ? 'Não deu pra entrar agora. Tenta de novo.' : 'Não deu pra sair agora. Tenta de novo.');
        return false;
      }
      participacao.definirMembro(slug, acao === 'entrar');
      if (acao === 'entrar') anunciar(`Você entrou em ${nome}.`);
      else toast(`Você saiu de ${nome}.`);
      // Os números (membros) vêm do servidor, não do cliente: lê de novo.
      ultimoAoMudar.current?.();
      return true;
    },
    [porta, slug, nome, participacao, anunciar, toast],
  );

  const entrar = useCallback(() => executar('entrar'), [executar]);
  const sair = useCallback(() => executar('sair'), [executar]);
  const limparErro = useCallback(() => setErro(null), []);
  return { pendente, erro, entrar, sair, limparErro };
}
