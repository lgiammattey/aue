import type { AmbienteDoForum, TemaDoForum } from '../../portas/ambienteDoForum';

const CHAVE_DO_TEMA = 'bda-theme';

/**
 * Adaptador do ambiente do fórum. Nada aqui lança: armazenamento barrado
 * (Safari em aba privada) só quer dizer "a escolha vale nesta sessão".
 */
export function criarAmbienteDoForumWeb(): AmbienteDoForum {
  return {
    estaOnline() {
      return typeof navigator === 'undefined' ? true : navigator.onLine;
    },

    aoMudarConectividade(ouvinte) {
      const aoVoltar = () => ouvinte(true);
      const aoCair = () => ouvinte(false);
      window.addEventListener('online', aoVoltar);
      window.addEventListener('offline', aoCair);
      return () => {
        window.removeEventListener('online', aoVoltar);
        window.removeEventListener('offline', aoCair);
      };
    },

    definirTituloDoDocumento(titulo) {
      document.title = titulo;
    },

    temaEscolhido() {
      try {
        const valor = localStorage.getItem(CHAVE_DO_TEMA);
        if (valor === 'light') return 'claro';
        if (valor === 'dark') return 'escuro';
        return null;
      } catch {
        return null;
      }
    },

    aplicarTema(tema: TemaDoForum, guardar: boolean) {
      const valor = tema === 'claro' ? 'light' : 'dark';
      try {
        document.documentElement.setAttribute('data-theme', valor);
        if (guardar) localStorage.setItem(CHAVE_DO_TEMA, valor);
      } catch {
        // sem armazenamento: o tema vale só nesta sessão
      }
    },

    rolagemAtual() {
      return window.scrollY;
    },

    rolarPara(y) {
      try {
        window.scrollTo(0, y);
      } catch {
        // jsdom e navegadores antigos: sem rolagem programática
      }
    },

    agora() {
      return Date.now();
    },
  };
}
