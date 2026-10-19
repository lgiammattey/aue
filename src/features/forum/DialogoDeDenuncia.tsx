import { useId, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { enderecoDoLoginComVolta } from '../../nucleo/comunidade/caminhoDeVolta';
import { LIMITE_MOTIVO_DE_DENUNCIA } from '../../nucleo/comunidade/limites';
import { erroDeEnvio, lerCampo, TEXTO_SEM_INTERNET_SEM_TEXTO, type ErroDeEnvio } from '../../nucleo/forum/escrita';
import type { ResultadoDaEscrita } from '../../portas/forum';
import { CampoComContador } from './CampoComContador';
import { useDependenciasDoForum } from './contexto';
import { DialogoDoForum } from './DialogoDoForum';
import { useOnline } from './hooks';
import { useEnvio } from './useEnvio';

interface Props {
  readonly alvo: 'tópico' | 'resposta';
  readonly denunciar: (motivo: string) => Promise<ResultadoDaEscrita<unknown>>;
  /** Só roda depois do `ok` do servidor. */
  readonly aoSucesso: () => void;
  readonly aoCancelar: () => void;
  readonly aoFechar: () => void;
  readonly caminhoDeVolta: string;
}

/**
 * Denúncia (spec 9.6): motivo em texto livre e opcional, até 500. A tela NÃO promete que o
 * conteúdo some, nem diz quantas denúncias escondem. Falha nunca diz "denunciado".
 */
export function DialogoDeDenuncia({ alvo, denunciar, aoSucesso, aoCancelar, aoFechar, caminhoDeVolta }: Props) {
  const { ambiente } = useDependenciasDoForum();
  const online = useOnline(ambiente);
  const { enviando, enviar } = useEnvio();
  const [motivo, setMotivo] = useState('');
  const [erro, setErro] = useState<ErroDeEnvio | null>(null);
  const campo = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);
  const idBase = useId();
  const idDoTitulo = `${idBase}-titulo`;
  const idDoCampo = `${idBase}-motivo`;

  async function aoEnviar(e: { preventDefault: () => void }) {
    e.preventDefault();
    if (enviando) return;
    if (lerCampo(motivo, LIMITE_MOTIVO_DE_DENUNCIA).estourou) {
      campo.current?.focus();
      setErro({
        texto: `Passou do limite em ${-lerCampo(motivo, LIMITE_MOTIVO_DE_DENUNCIA).restante} caracteres.`,
        onde: 'corpo',
        acao: null,
        ambiguo: false,
      });
      return;
    }
    if (!online) {
      setErro({ texto: TEXTO_SEM_INTERNET_SEM_TEXTO, onde: 'geral', acao: null, ambiguo: false });
      return;
    }
    setErro(null);
    const r = await enviar(() => denunciar(motivo.trim()), { travarSeOk: true });
    if (r === null) return;
    if (r.ok) {
      aoSucesso();
      return;
    }
    setErro(erroDeEnvio(r.motivo, 'denuncia'));
  }

  const erroNoCampo = erro?.onde === 'corpo' ? erro.texto : null;
  const erroGeral = erro && erro.onde !== 'corpo' ? erro : null;

  return (
    <DialogoDoForum
      idDoTitulo={idDoTitulo}
      classe="forum-dialogo--pequeno"
      aoCancelar={aoCancelar}
      bloqueado={enviando}
      focoInicial={campo}
      aoFechar={aoFechar}
    >
      <form className="forum-confirmacao" onSubmit={aoEnviar} noValidate>
        <h2 id={idDoTitulo} className="forum-confirmacao__titulo">
          Denunciar {alvo}
        </h2>
        {erroGeral && (
          <div className="forum-form__alerta" role="alert">
            <p>{erroGeral.texto}</p>
            {erroGeral.acao === 'entrar' && (
              <Link className="forum-botao forum-botao--contorno" to={enderecoDoLoginComVolta(caminhoDeVolta, 'entrar')}>
                Entrar
              </Link>
            )}
          </div>
        )}
        <CampoComContador
          id={idDoCampo}
          rotulo="O que está errado? (opcional)"
          tipo="area"
          linhas={3}
          valor={motivo}
          aoMudar={(v) => {
            setMotivo(v);
            if (erro?.onde === 'corpo') setErro(null);
          }}
          limite={LIMITE_MOTIVO_DE_DENUNCIA}
          erro={erroNoCampo}
          somenteLeitura={enviando}
          campoRef={campo}
          aoFocar={() => ambiente.centralizarCampo(idDoCampo)}
        />
        <div className="forum-confirmacao__acoes">
          <button type="button" className="forum-botao forum-botao--contorno" onClick={aoCancelar} disabled={enviando}>
            Cancelar
          </button>
          <button type="submit" className="forum-botao forum-botao--escuro" aria-busy={enviando || undefined}>
            {enviando ? 'Enviando…' : 'Denunciar'}
          </button>
        </div>
      </form>
    </DialogoDoForum>
  );
}
