import { useCallback, useEffect, useLayoutEffect, useState } from 'react';

/** Mesmos breakpoints da TelaComunidade: celular < 700, lateral direita >= 1000. */
export const LARGURA_CELULAR = 700;
export const LARGURA_COLUNA_DIREITA = 1000;

type Tema = 'dark' | 'light';

function larguraAtual(): number {
  return typeof window !== 'undefined' ? window.innerWidth : 1200;
}

/** Largura da janela, atualizada no resize. */
export function useLarguraJanela(): number {
  const [largura, setLargura] = useState(larguraAtual);
  useEffect(() => {
    const aoRedimensionar = () => setLargura(window.innerWidth);
    window.addEventListener('resize', aoRedimensionar);
    return () => window.removeEventListener('resize', aoRedimensionar);
  }, []);
  return largura;
}

/** Tema escuro/claro compartilhado com a TelaComunidade (`bda-theme`). */
export function useTema(): [Tema, () => void] {
  const [tema, setTema] = useState<Tema>(() => {
    try {
      return localStorage.getItem('bda-theme') === 'light' ? 'light' : 'dark';
    } catch {
      return 'dark';
    }
  });

  // Antes da primeira pintura: quem entra por link com tema claro não vê um quadro escuro.
  useLayoutEffect(() => {
    try {
      document.documentElement.setAttribute('data-theme', tema);
      localStorage.setItem('bda-theme', tema);
    } catch {
      // sem armazenamento: o tema vale só nesta sessão
    }
  }, [tema]);

  const alternar = useCallback(() => setTema((t) => (t === 'dark' ? 'light' : 'dark')), []);
  return [tema, alternar];
}
