import { useId, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { enderecoDoLoginComVolta } from '../../nucleo/comunidade/caminhoDeVolta';
import { erroDeEnvio, TEXTO_SEM_INTERNET_SEM_TEXTO, type ErroDeEnvio } from '../../nucleo/forum/escrita';
import type { ResultadoDaEscrita } from '../../portas/forum';
import { useDependenciasDoForum } from './contexto';
import { DialogoDoForum } from './DialogoDoForum';
import { useOnline } from './hooks';
import { useEnvio } from './useEnvio';

interface Props {
  readonly titulo: string;
  readonly corpo: string;
  readonly rotuloDeConfirmar: string;
  readonly rotuloEmAndamento: string;
  readonly confirmar: () => Promise<ResultadoDaEscrita<unknown>>;
  /** Só roda depois do `ok` do servidor. */
  readonly aoSucesso: () => void;
  /** Cancelar e Esc. */
  readonly aoCancelar: () => void;
  /** Depois de fechar: devolve o foco ao gatilho (ou onde fizer sentido, se ele sumiu). */
  readonly aoFechar: () => void;
  readonly caminhoDeVolta: string;
}

/**
 * Confirmação de apagar (spec 9.6): foco inicial em "Cancelar"; vermelho não é usado (o DS o
 * reserva para erro técnico), o botão é `--fg` cheio. Apagar é lógico no servidor, mas daqui
 * a pessoa não desfaz. Falha fica dentro do dialog, com a frase honesta.
 */
export function DialogoDeConfirmacao({
  titulo,
  corpo,
  rotuloDeConfirmar,
  rotuloEmAndamento,
  confirmar,
  aoSucesso,
  aoCancelar,
  aoFechar,
  caminhoDeVolta,
}: Props) {
  const { ambiente } = useDependenciasDoForum();
  const online = useOnline(ambiente);
  const { enviando, enviar } = useEnvio();
  const [erro, setErro] = useState<ErroDeEnvio | null>(null);
  const cancelar = useRef<HTMLButtonElement>(null);
  const idDoTitulo = useId();

  async function aoConfirmar() {
    if (enviando) return;
    if (!online) {
      setErro({ texto: TEXTO_SEM_INTERNET_SEM_TEXTO, onde: 'geral', acao: null, ambiguo: false });
      return;
    }
    setErro(null);
    const r = await enviar(confirmar, { travarSeOk: true });
    if (r === null) return;
    if (r.ok) {
      aoSucesso();
      return;
    }
    setErro(erroDeEnvio(r.motivo, 'apagar'));
  }

  return (
    <DialogoDoForum
      idDoTitulo={idDoTitulo}
      classe="forum-dialogo--pequeno"
      aoCancelar={aoCancelar}
      focoInicial={cancelar}
      aoFechar={aoFechar}
    >
      <div className="forum-confirmacao">
        <h2 id={idDoTitulo} className="forum-confirmacao__titulo">
          {titulo}
        </h2>
        <p className="forum-confirmacao__corpo">{corpo}</p>
        {erro && (
          <div className="forum-form__alerta" role="alert">
            <p>{erro.texto}</p>
            {erro.acao === 'entrar' && (
              <Link className="forum-botao forum-botao--contorno" to={enderecoDoLoginComVolta(caminhoDeVolta, 'entrar')}>
                Entrar
              </Link>
            )}
          </div>
        )}
        <div className="forum-confirmacao__acoes">
          <button ref={cancelar} type="button" className="forum-botao forum-botao--contorno" onClick={aoCancelar}>
            Cancelar
          </button>
          <button
            type="button"
            className="forum-botao forum-botao--escuro"
            onClick={aoConfirmar}
            aria-busy={enviando || undefined}
          >
            {enviando ? rotuloEmAndamento : rotuloDeConfirmar}
          </button>
        </div>
      </div>
    </DialogoDoForum>
  );
}
