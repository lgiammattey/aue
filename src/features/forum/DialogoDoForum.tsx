import { useLayoutEffect, useRef, type ReactNode, type RefObject } from 'react';

interface Props {
  /** `id` do título dentro do dialog: vira o nome acessível. */
  readonly idDoTitulo: string;
  readonly classe?: string;
  /** Esc (o `cancel` do navegador). Quem usa decide se fecha; rascunho nunca se perde por isso. */
  readonly aoCancelar: () => void;
  /** Onde o foco entra ao abrir. Sem isso, o navegador escolhe o primeiro item focável. */
  readonly focoInicial?: RefObject<HTMLElement | null>;
  /** Chamado depois de fechar: devolve o foco ao gatilho (ou ao H1, se o gatilho sumiu). */
  readonly aoFechar?: () => void;
  readonly children: ReactNode;
}

/**
 * `<dialog>` modal de verdade (`showModal`): o resto da página fica inerte, o Tab fica
 * preso dentro e o Esc dispara `cancel` (spec 15). Existir é estar aberto: quem usa monta
 * quando quer abrir e desmonta quando quer fechar. No navegador que não tem `showModal`
 * (testes em jsdom), abre como dialog comum e o resto da lógica vale igual.
 */
export function DialogoDoForum({ idDoTitulo, classe, aoCancelar, focoInicial, aoFechar, children }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const ultimoAoFechar = useRef(aoFechar);
  ultimoAoFechar.current = aoFechar;

  useLayoutEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (!d.open) {
      if (typeof d.showModal === 'function') d.showModal();
      else d.setAttribute('open', '');
    }
    focoInicial?.current?.focus();
    return () => {
      if (typeof d.close === 'function') d.close();
      else d.removeAttribute('open');
      // Depois do commit: o gatilho (um `Link`) é desligado e religado na mesma troca de tela, e a ref dele
      // só volta no fim do commit. Se o dialog continua na página (remontagem de desenvolvimento), não mexe.
      queueMicrotask(() => {
        if (!d.isConnected) ultimoAoFechar.current?.();
      });
    };
    // Abre uma vez por montagem: `focoInicial` é uma ref estável.
  }, [focoInicial]);

  return (
    <dialog
      ref={ref}
      className={`forum-dialogo${classe ? ` ${classe}` : ''}`}
      aria-labelledby={idDoTitulo}
      onCancel={(e) => {
        e.preventDefault();
        aoCancelar();
      }}
    >
      {children}
    </dialog>
  );
}
