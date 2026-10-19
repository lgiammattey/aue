import { Link, useLocation } from 'react-router-dom';
import { enderecoDoLoginComVolta } from '../../nucleo/comunidade/caminhoDeVolta';

/**
 * O convite no lugar da ação (spec 5): visitante e conta sem promoção não veem um
 * botão que falha; veem o caminho para entrar, que volta para este mesmo lugar.
 * "Criar conta" é o verde da tela; "Já tenho conta" é link de texto.
 */
export function ConviteDeVisitante({
  rotuloDeCriar,
  volta,
}: {
  readonly rotuloDeCriar: string;
  /** Para onde voltar depois de entrar. Sem isso, o endereço de agora. */
  readonly volta?: string;
}) {
  const local = useLocation();
  const caminho = volta ?? local.pathname + local.search;
  return (
    <div className="forum-convite">
      <Link className="forum-botao forum-botao--acento" to={enderecoDoLoginComVolta(caminho, 'cadastro')}>
        {rotuloDeCriar}
      </Link>
      <Link className="forum-link-texto" to={enderecoDoLoginComVolta(caminho, 'entrar')}>
        Já tenho conta
      </Link>
    </div>
  );
}
