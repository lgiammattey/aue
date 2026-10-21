import { useEffect, useRef } from 'react';
import { manterFocoNoDialogo } from '../../plataforma/web/focoNoDialogo';
import './FolhaDaFoto.css';

interface Props {
  readonly aberta: boolean;
  /** "Remover foto" só existe quando há foto para remover. */
  readonly temFoto: boolean;
  readonly aoTrocar: () => void;
  readonly aoRemover: () => void;
  readonly aoFechar: () => void;
}

/**
 * Folha de baixo (celular) ou caixa (desktop) aberta ao tocar no avatar do dono.
 * Os dois botões chamam os mesmos handlers de antes; aqui só se escolhe.
 * Esc e toque fora fecham; o foco fica preso na folha enquanto ela está aberta.
 */
export function FolhaDaFoto({ aberta, temFoto, aoTrocar, aoRemover, aoFechar }: Props) {
  const dialogo = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (aberta) dialogo.current?.focus();
  }, [aberta]);

  if (!aberta) return null;

  return (
    <div className="modal open folha-da-foto" role="presentation" onClick={(e) => e.target === e.currentTarget && aoFechar()}>
      <div
        ref={dialogo}
        className="dialog folha-da-foto__corpo"
        role="dialog"
        aria-modal="true"
        aria-labelledby="folhaDaFotoTitulo"
        tabIndex={-1}
        onKeyDown={(e) => {
          if (e.key === 'Escape') aoFechar();
          manterFocoNoDialogo(e.nativeEvent, dialogo.current);
        }}
      >
        <div className="folha-da-foto__topo">
          <h2 id="folhaDaFotoTitulo">Foto do perfil</h2>
          <button type="button" className="folha-da-foto__fechar" onClick={aoFechar}>Fechar</button>
        </div>
        <button type="button" className="folha-da-foto__acao" onClick={aoTrocar}>Trocar foto</button>
        {temFoto && (
          <button type="button" className="folha-da-foto__acao folha-da-foto__acao--perigo" onClick={aoRemover}>Remover foto</button>
        )}
      </div>
    </div>
  );
}
