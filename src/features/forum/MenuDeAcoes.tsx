import { useEffect, useId, useRef, useState, type KeyboardEvent, type RefObject } from 'react';
import { IconeMaisOpcoes } from './Icones';

export interface ItemDoMenu {
  readonly id: string;
  readonly rotulo: string;
  readonly aoEscolher: () => void;
}

interface Props {
  /** Nome do botão: "Ações do tópico", "Ações da resposta de Bia Lima". */
  readonly rotulo: string;
  readonly itens: readonly ItemDoMenu[];
  /** O dialog que o item abre devolve o foco a este botão ao fechar. */
  readonly botaoRef?: RefObject<HTMLButtonElement | null>;
}

/**
 * Menu de ações (três pontos), padrão APG de menu (spec 9.6 e 15): `aria-haspopup`,
 * `aria-expanded`, setas, Home, End, Esc devolve o foco ao botão, Tab fecha. Sem
 * ouvinte global: o toque fora é um fundo transparente (funciona no Safari, onde
 * botão não recebe foco ao ser tocado). Sem itens, nem o botão existe.
 */
export function MenuDeAcoes({ rotulo, itens, botaoRef }: Props) {
  const [aberto, setAberto] = useState(false);
  const interno = useRef<HTMLButtonElement>(null);
  const botao = botaoRef ?? interno;
  const itensRef = useRef<(HTMLButtonElement | null)[]>([]);
  const idDaLista = useId();

  useEffect(() => {
    if (aberto) itensRef.current[0]?.focus();
  }, [aberto]);

  if (itens.length === 0) return null;

  const fechar = (devolverFoco: boolean) => {
    setAberto(false);
    if (devolverFoco) botao.current?.focus();
  };

  const irPara = (indice: number) => {
    const n = itens.length;
    itensRef.current[((indice % n) + n) % n]?.focus();
  };

  const aoTeclarNaLista = (e: KeyboardEvent<HTMLUListElement>) => {
    const atual = itensRef.current.findIndex((el) => el === e.target);
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      irPara(atual + 1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      irPara(atual - 1);
    } else if (e.key === 'Home') {
      e.preventDefault();
      irPara(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      irPara(itens.length - 1);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      fechar(true);
    } else if (e.key === 'Tab') {
      fechar(false);
    }
  };

  return (
    <div className="forum-menu">
      <button
        ref={botao}
        type="button"
        className="forum-menu__botao"
        aria-label={rotulo}
        aria-haspopup="menu"
        aria-expanded={aberto}
        aria-controls={aberto ? idDaLista : undefined}
        onClick={() => setAberto((a) => !a)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown' && !aberto) {
            e.preventDefault();
            setAberto(true);
          }
        }}
      >
        <IconeMaisOpcoes />
      </button>
      {aberto && (
        <>
          <div className="forum-menu__fundo" onClick={() => fechar(false)} aria-hidden="true" />
          <ul id={idDaLista} className="forum-menu__lista" role="menu" aria-label={rotulo} onKeyDown={aoTeclarNaLista}>
            {itens.map((item, i) => (
              <li key={item.id} role="none">
                <button
                  ref={(el) => {
                    itensRef.current[i] = el;
                  }}
                  type="button"
                  role="menuitem"
                  tabIndex={-1}
                  className="forum-menu__item"
                  onClick={() => {
                    setAberto(false);
                    item.aoEscolher();
                  }}
                >
                  {item.rotulo}
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
