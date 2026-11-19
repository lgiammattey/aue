import { useState } from 'react';
import type { DueloV2 } from '../../../portas/dueloV2';
import { criarDueloV2 } from '../../../plataforma/web/dueloV2';
import { lerTokenConviteDueloV2 } from '../../../plataforma/web/tokenConviteDueloV2';
import { ResponderDueloV2, type TentativaDoDuelo } from './DueloV2';

export interface EntradaDueloV2Props {
  /** A Arena devolve a gravação apenas depois da revisão. */
  readonly tentativa: TentativaDoDuelo | null;
  readonly aoGravar: () => void;
  readonly aoVoltar: () => void;
  /** Dependências opcionais para testes e ambientes isolados. */
  readonly duelo?: DueloV2;
  readonly lerToken?: () => string | null;
}

/** A entrada não inicia captura nem envia áudio sem a ação da pessoa. */
export function EntradaDueloV2({ tentativa, aoGravar, aoVoltar, duelo, lerToken = lerTokenConviteDueloV2 }: EntradaDueloV2Props) {
  const [token] = useState(() => lerToken());
  const [cliente] = useState(() => duelo ?? criarDueloV2());
  if (!token || !/^[0-9a-f]{64}$/.test(token)) {
    return <section className="duelo-v2" aria-labelledby="convite-invalido-titulo">
      <h2 id="convite-invalido-titulo">CONVITE INDISPONÍVEL</h2>
      <p>O link está incompleto ou é inválido. Peça um novo convite.</p>
      <button type="button" onClick={aoVoltar}>Voltar</button>
    </section>;
  }
  return <ResponderDueloV2 duelo={cliente} token={token} tentativa={tentativa} aoGravar={aoGravar} aoVoltar={aoVoltar} />;
}
