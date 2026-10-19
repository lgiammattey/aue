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

    aoRolar(ouvinte) {
      const aoRolar = () => ouvinte(window.scrollY);
      window.addEventListener('scroll', aoRolar, { passive: true });
      return () => window.removeEventListener('scroll', aoRolar);
    },

    rolarPara(y) {
      try {
        window.scrollTo(0, y);
      } catch {
        // jsdom e navegadores antigos: sem rolagem programática
      }
    },

    aoMudarFocoEmCampo(ouvinte) {
      const ehCampo = (alvo: EventTarget | null): boolean => {
        if (!(alvo instanceof HTMLElement)) return false;
        if (alvo.isContentEditable) return true;
        if (alvo instanceof HTMLTextAreaElement || alvo instanceof HTMLSelectElement) return true;
        if (alvo instanceof HTMLInputElement) {
          return !['button', 'submit', 'reset', 'checkbox', 'radio', 'file', 'image', 'range', 'color'].includes(alvo.type);
        }
        return false;
      };
      const aoFocar = (e: FocusEvent) => ouvinte(ehCampo(e.target));
      // Ao sair, `relatedTarget` é para onde o foco vai: campo para campo não pisca.
      const aoSair = (e: FocusEvent) => ouvinte(ehCampo(e.relatedTarget));
      document.addEventListener('focusin', aoFocar);
      document.addEventListener('focusout', aoSair);
      return () => {
        document.removeEventListener('focusin', aoFocar);
        document.removeEventListener('focusout', aoSair);
      };
    },

    centralizarCampo(idDoCampo) {
      try {
        const centralizar = () =>
          document.getElementById(idDoCampo)?.scrollIntoView({ block: 'center', behavior: 'instant' });
        const vv = window.visualViewport;
        if (!vv) {
          centralizar();
          return;
        }
        // O teclado do iPhone demora a abrir: espera o viewport encolher (ou 350ms) e então centraliza.
        let feito = false;
        const uma = () => {
          if (feito) return;
          feito = true;
          vv.removeEventListener('resize', uma);
          centralizar();
        };
        vv.addEventListener('resize', uma);
        setTimeout(uma, 350);
      } catch {
        // sem visualViewport ou scrollIntoView: o navegador faz o que sabe
      }
    },

    agora() {
      return Date.now();
    },
  };
}
