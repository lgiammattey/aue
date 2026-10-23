import { useParams } from 'react-router-dom';
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

export function TelaPerfilOpenDesign({
  portaForum,
  portaComunidade,
  portaPerfil,
  portaConta,
}: Props) {
  const { handle } = useParams<{ handle?: string }>();
  return (
    <InicioOpenDesign
      portaForum={portaForum}
      portaComunidade={portaComunidade}
      portaPerfil={portaPerfil}
      portaConta={portaConta}
      viewInicial="perfil"
      handleInicial={handle}
    />
  );
}
