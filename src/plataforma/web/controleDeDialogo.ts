import type { ControleDeDialogo } from '../../portas/controleDeDialogo';

type EstiloSalvo = Readonly<{
  readonly nome: string;
  readonly valor: string;
  readonly prioridade: string;
}>;

type BloqueioAtivo = Readonly<{
  readonly rolagemY: number;
  readonly estilos: readonly EstiloSalvo[];
}>;

const PROPRIEDADES_BLOQUEADAS = ['position', 'top', 'left', 'right', 'width', 'overflow'] as const;

/**
 * Adaptador do bloqueio de rolagem para diálogos web.
 *
 * `overflow: hidden` sozinho deixa o Safari reajustar a página quando o
 * teclado ou a barra do navegador muda. Fixar o `body` no deslocamento atual
 * mantém o conteúdo atrás do diálogo no mesmo pixel. Ao soltar o último
 * bloqueio, os estilos inline anteriores e a rolagem original voltam.
 */
export function criarControleDeDialogoWeb(): ControleDeDialogo {
  let quantidadeDeBloqueios = 0;
  let bloqueio: BloqueioAtivo | null = null;

  return {
    bloquearRolagemDoDocumento(): () => void {
      if (quantidadeDeBloqueios === 0) {
        const corpo = document.body;
        const rolagemY = window.scrollY;
        bloqueio = {
          rolagemY,
          estilos: PROPRIEDADES_BLOQUEADAS.map((nome) => ({
            nome,
            valor: corpo.style.getPropertyValue(nome),
            prioridade: corpo.style.getPropertyPriority(nome),
          })),
        };

        // O próprio app pode ter estilo inline `!important`; o bloqueio é
        // temporário, mas enquanto estiver vivo não pode ser derrotado por ele.
        corpo.style.setProperty('position', 'fixed', 'important');
        corpo.style.setProperty('top', `-${rolagemY}px`, 'important');
        corpo.style.setProperty('left', '0', 'important');
        corpo.style.setProperty('right', '0', 'important');
        corpo.style.setProperty('width', '100%', 'important');
        corpo.style.setProperty('overflow', 'hidden', 'important');
      }

      quantidadeDeBloqueios += 1;
      let ativo = true;

      return () => {
        if (!ativo) return;
        ativo = false;
        quantidadeDeBloqueios -= 1;

        if (quantidadeDeBloqueios !== 0 || !bloqueio) return;

        const { rolagemY, estilos } = bloqueio;
        const corpo = document.body;
        for (const estilo of estilos) {
          if (estilo.valor) {
            corpo.style.setProperty(estilo.nome, estilo.valor, estilo.prioridade);
          } else {
            corpo.style.removeProperty(estilo.nome);
          }
        }
        bloqueio = null;
        // Ao soltar `position: fixed`, o Chromium ainda pode enxergar o
        // documento com altura zero nesta mesma instrução. Forçar a leitura
        // de layout devolve o range de rolagem antes de restaurar o Y; sem
        // isso `scrollTo` é clampado para 0 e a pessoa volta ao topo.
        void corpo.offsetHeight;
        window.scrollTo(0, rolagemY);
      };
    },

    manterCampoVisivelAoAbrirTeclado(idDoCampo: string): () => void {
      let ativo = true;
      let timer: number | null = null;
      const viewport = window.visualViewport;

      const centralizarSeNecessario = () => {
        if (!ativo) return;
        const campo = document.getElementById(idDoCampo);
        if (!campo) return;
        const altura = viewport?.height ?? window.innerHeight;
        const retangulo = campo.getBoundingClientRect();
        // Se já cabe no viewport, rolar seria um salto gratuito sob o dedo.
        if (retangulo.top >= 0 && retangulo.bottom <= altura) return;
        campo.scrollIntoView({ block: 'center', behavior: 'instant' });
      };

      const encerrar = () => {
        if (!ativo) return;
        ativo = false;
        if (viewport) viewport.removeEventListener('resize', aoRedimensionar);
        if (timer !== null) window.clearTimeout(timer);
        timer = null;
      };

      const aoRedimensionar = () => {
        centralizarSeNecessario();
        encerrar();
      };

      if (!viewport) {
        centralizarSeNecessario();
        encerrar();
        return encerrar;
      }

      // No iPhone o foco chega antes do teclado; espera o resize ou, se ele
      // não vier, faz uma única verificação depois da janela de abertura.
      viewport.addEventListener('resize', aoRedimensionar);
      timer = window.setTimeout(aoRedimensionar, 350);
      return encerrar;
    },
  };
}
