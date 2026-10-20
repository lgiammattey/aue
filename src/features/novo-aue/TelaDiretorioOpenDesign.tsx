import { InicioOpenDesign } from './InicioOpenDesign';
import type { PortaDeForum } from '../../portas/forum';
import type { PortaDeComunidade } from '../../portas/comunidade';
import type { PortaDeConta } from '../../portas/conta';
import type { PortaDePerfil } from '../../portas/perfil';

interface Props {
  readonly portaForum?: PortaDeForum;
  readonly portaComunidade?: PortaDeComunidade;
  readonly portaPerfil?: PortaDePerfil;
  readonly portaConta?: PortaDeConta;
}

export function TelaDiretorioOpenDesign({
  portaForum,
  portaComunidade,
  portaPerfil,
  portaConta,
}: Props) {
  return (
    <InicioOpenDesign
      portaForum={portaForum}
      portaComunidade={portaComunidade}
      portaPerfil={portaPerfil}
      portaConta={portaConta}
      viewInicial="comunidades"
    />
  );
}
