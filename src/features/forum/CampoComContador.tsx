import { useEffect, useLayoutEffect, useRef, useState, type RefObject } from 'react';
import { avisoDeContador, excessoDoCampo, lerCampo, type LeituraDoCampo } from '../../nucleo/forum/escrita';

interface Props {
  readonly id: string;
  readonly rotulo: string;
  /** Rótulo só para leitor de tela (composer de resposta: o título da seção já diz). */
  readonly rotuloOculto?: boolean;
  readonly valor: string;
  readonly aoMudar: (novo: string) => void;
  /** Limite em caracteres como o Postgres conta (code points). Nunca vai para `maxLength`. */
  readonly limite: number;
  readonly tipo: 'linha' | 'area';
  /** Linhas mínimas da área; ela cresce até `linhasMaximas` e depois rola por dentro. */
  readonly linhas?: number;
  readonly linhasMaximas?: number;
  readonly placeholder?: string;
  /** Erro desta tela (antes de ir ao servidor ou o que o servidor devolveu por HINT). */
  readonly erro?: string | null;
  /** Durante o envio o campo só lê. */
  readonly somenteLeitura?: boolean;
  readonly campoRef?: RefObject<HTMLInputElement | HTMLTextAreaElement | null>;
  readonly enterKeyHint?: 'next' | 'send' | 'done';
  readonly aoFocar?: () => void;
  /** Enter num campo de uma linha (o título passa para a mensagem em vez de enviar). */
  readonly aoEnter?: () => void;
}

/**
 * Campo de texto com o contador por caractere da spec 6.9: sempre visível, à
 * direita, `87/120`; a 90% do limite o número ganha peso; passou do limite vira
 * `--danger` com "N caracteres a mais" e o envio é bloqueado pela tela (nunca por
 * `maxLength`, que conta UTF-16). O contador não fala; uma região de status fala só
 * ao cruzar 20 restantes e ao estourar.
 */
export function CampoComContador({
  id,
  rotulo,
  rotuloOculto,
  valor,
  aoMudar,
  limite,
  tipo,
  linhas = 2,
  linhasMaximas = 8,
  placeholder,
  erro,
  somenteLeitura,
  campoRef,
  enterKeyHint,
  aoFocar,
  aoEnter,
}: Props) {
  const leitura = lerCampo(valor, limite);
  const anterior = useRef<LeituraDoCampo | null>(null);
  const [aviso, setAviso] = useState('');
  const area = useRef<HTMLTextAreaElement | null>(null);

  // Aviso falado só ao cruzar um marco. A primeira leitura (rascunho recuperado) não fala.
  useEffect(() => {
    const agora = lerCampo(valor, limite);
    const dito = avisoDeContador(anterior.current, agora);
    anterior.current = agora;
    setAviso(dito ?? '');
  }, [valor, limite]);

  // A área cresce com o texto até o teto; depois rola por dentro.
  useLayoutEffect(() => {
    const el = area.current;
    if (!el || tipo !== 'area') return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [valor, tipo, linhasMaximas]);

  const idDoErro = `${id}-erro`;
  const idDoContador = `${id}-contador`;
  const invalido = Boolean(erro) || leitura.estourou;
  const descritoPor = [erro ? idDoErro : null, idDoContador].filter(Boolean).join(' ');
  const excesso = excessoDoCampo(leitura);
  const perto = leitura.usados >= limite * 0.9;

  const guardarRef = (el: HTMLInputElement | HTMLTextAreaElement | null) => {
    area.current = tipo === 'area' ? (el as HTMLTextAreaElement | null) : null;
    if (campoRef) campoRef.current = el;
  };

  const comuns = {
    id,
    value: valor,
    onChange: (e: { target: { value: string } }) => aoMudar(e.target.value),
    onFocus: aoFocar,
    readOnly: somenteLeitura,
    placeholder,
    'aria-invalid': invalido || undefined,
    'aria-describedby': descritoPor,
    autoComplete: 'off',
    autoCapitalize: 'sentences',
    // Sem `maxLength`: ele conta UTF-16 e cortaria o emoji no meio. O limite é da tela.
    className: 'forum-campo__entrada',
  } as const;

  return (
    <div className="forum-campo" data-invalido={invalido || undefined}>
      <label htmlFor={id} className={rotuloOculto ? 'forum-sr' : 'forum-campo__rotulo'}>
        {rotulo}
      </label>
      {tipo === 'linha' ? (
        <input
          ref={guardarRef}
          type="text"
          enterKeyHint={enterKeyHint}
          onKeyDown={
            aoEnter
              ? (e) => {
                  if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
                    e.preventDefault();
                    aoEnter();
                  }
                }
              : undefined
          }
          {...comuns}
        />
      ) : (
        <textarea
          ref={guardarRef}
          rows={linhas}
          style={{ maxHeight: `calc(${linhasMaximas} * 1.5em + 24px)` }}
          {...comuns}
        />
      )}
      <div className="forum-campo__rodape">
        {erro ? (
          <p id={idDoErro} className="forum-campo__erro" role="alert">
            {erro}
          </p>
        ) : (
          <span />
        )}
        <p
          id={idDoContador}
          className={`forum-campo__contador${perto ? ' forum-campo__contador--perto' : ''}${
            leitura.estourou ? ' forum-campo__contador--estourou' : ''
          }`}
          aria-live="off"
        >
          {excesso && <span className="forum-campo__excesso">{excesso} </span>}
          <span>
            {leitura.usados}/{limite}
          </span>
        </p>
      </div>
      <span className="forum-sr" role="status">
        {aviso}
      </span>
    </div>
  );
}
