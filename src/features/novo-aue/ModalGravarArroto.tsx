import { useEffect, useId, useRef, useState } from 'react';
import type { ControleDeDialogo } from '../../portas/controleDeDialogo';

export type EstadoDaGravacaoDireta = 'ocioso' | 'solicitando' | 'gravando' | 'pronto' | 'erro';

export interface ComunidadeParaArroto {
  readonly slug: string;
  readonly nome: string;
}

export type DestinoDoArrotoDireto =
  | { readonly tipo: 'perfil-proprio' }
  | { readonly tipo: 'perfil-marcado'; readonly handle: string }
  | { readonly tipo: 'comunidade'; readonly comunidadeSlug: string };

interface Props {
  readonly aberto: boolean;
  readonly controleDeDialogo: ControleDeDialogo;
  readonly estado: EstadoDaGravacaoDireta;
  readonly erro?: string | null;
  readonly enviando?: boolean;
  readonly comunidades?: readonly ComunidadeParaArroto[];
  readonly permitirComunidade?: boolean;
  /** Entrada contextual do próprio perfil: o destino não pode ser trocado. */
  readonly destinoFixo?: 'perfil-proprio';
  readonly duracaoEmSegundos?: number | null;
  readonly aoFechar: () => void;
  readonly aoIniciarGravacao: () => Promise<void> | void;
  readonly aoPararGravacao: () => Promise<void> | void;
  readonly aoRegravar: () => void;
  readonly aoEnviar: (destino: DestinoDoArrotoDireto) => Promise<void> | void;
}

type EscolhaDeDestino = 'perfil-proprio' | 'perfil-marcado' | 'comunidade';

function formatarDuracao(duracaoEmSegundos: number | null | undefined): string | null {
  if (duracaoEmSegundos === null || duracaoEmSegundos === undefined || !Number.isFinite(duracaoEmSegundos)) {
    return null;
  }

  const total = Math.max(0, Math.floor(duracaoEmSegundos));
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

export function ModalGravarArroto({
  aberto,
  controleDeDialogo,
  estado,
  erro,
  enviando = false,
  comunidades = [],
  permitirComunidade = false,
  destinoFixo,
  duracaoEmSegundos,
  aoFechar,
  aoIniciarGravacao,
  aoPararGravacao,
  aoRegravar,
  aoEnviar,
}: Props) {
  const tituloId = useId();
  const descricaoId = useId();
  const botaoPrincipal = useRef<HTMLButtonElement>(null);
  const [destino, setDestino] = useState<EscolhaDeDestino>('perfil-proprio');
  const [handle, setHandle] = useState('');
  const [comunidadeSlug, setComunidadeSlug] = useState(comunidades[0]?.slug ?? '');
  const [erroLocal, setErroLocal] = useState<string | null>(null);

  useEffect(() => {
    if (!aberto) return;
    setDestino(destinoFixo ?? 'perfil-proprio');
    setHandle('');
    setComunidadeSlug(comunidades[0]?.slug ?? '');
    setErroLocal(null);
    botaoPrincipal.current?.focus();
  }, [aberto, comunidades, destinoFixo]);

  useEffect(() => {
    if (!aberto) return;
    return controleDeDialogo.bloquearRolagemDoDocumento();
  }, [aberto, controleDeDialogo]);

  useEffect(() => {
    if (!aberto) return;
    const aoApertarTecla = (evento: KeyboardEvent) => {
      if (evento.key === 'Escape' && estado !== 'gravando' && estado !== 'solicitando' && !enviando) {
        aoFechar();
      }
    };
    document.addEventListener('keydown', aoApertarTecla);
    return () => document.removeEventListener('keydown', aoApertarTecla);
  }, [aberto, aoFechar, enviando, estado]);

  if (!aberto) return null;

  const gravando = estado === 'gravando';
  const pronto = estado === 'pronto';
  const ocupado = estado === 'solicitando' || enviando;
  const erroExibido = erroLocal ?? erro;
  const duracao = formatarDuracao(duracaoEmSegundos);
  const destinoValido =
    destino === 'perfil-proprio' ||
    (destino === 'perfil-marcado' && handle.trim().replace(/^@/, '').length > 0) ||
    (destino === 'comunidade' && permitirComunidade && comunidadeSlug.length > 0);

  const executar = async (acao: () => Promise<void> | void) => {
    setErroLocal(null);
    try {
      await acao();
    } catch (causa) {
      setErroLocal(causa instanceof Error ? causa.message : 'Não foi possível concluir essa ação agora.');
    }
  };

  const enviar = () => executar(async () => {
    if (destino === 'perfil-marcado') {
      await aoEnviar({ tipo: 'perfil-marcado', handle: handle.trim().replace(/^@/, '').toLowerCase() });
      return;
    }
    if (destino === 'comunidade' && permitirComunidade) {
      await aoEnviar({ tipo: 'comunidade', comunidadeSlug });
      return;
    }
    await aoEnviar({ tipo: 'perfil-proprio' });
  });

  return (
    <div
      className="modal open modal-gravar-arroto"
      role="dialog"
      aria-modal="true"
      aria-labelledby={tituloId}
      aria-describedby={descricaoId}
      onMouseDown={(evento) => {
        if (evento.target === evento.currentTarget && !gravando && !ocupado) aoFechar();
      }}
    >
      <section className="dialog dialog-gravar-arroto">
        <header className="dialog-head">
          <div>
            <p className="dialog-gravar-arroto__eyebrow">ARROTO DIRETO</p>
            <h2 id={tituloId}>Gravar um arroto</h2>
          </div>
          <button
            type="button"
            className="close"
            onClick={aoFechar}
            aria-label="Fechar gravação"
            disabled={gravando || ocupado}
          >
            ✕
          </button>
        </header>

        <p id={descricaoId} className="dialog-gravar-arroto__descricao">
          Gravação direta: não passa pelo motor e não recebe nota.
        </p>

        <div className={`gravador-direto gravador-direto--${estado}`} aria-live="polite">
          <span className="gravador-direto__luz" aria-hidden="true" />
          <div>
            <strong>
              {estado === 'solicitando' && 'Preparando o microfone…'}
              {estado === 'gravando' && 'Gravando agora'}
              {estado === 'pronto' && 'Arroto pronto para enviar'}
              {estado === 'erro' && 'A gravação não saiu'}
              {estado === 'ocioso' && 'Pronto para gravar'}
            </strong>
            <span>
              {gravando && (duracao ?? 'Ouvindo o ambiente…')}
              {pronto && (duracao ? `Duração: ${duracao}` : 'Você pode regravar antes de enviar.')}
              {estado === 'erro' && 'Tente de novo quando o microfone estiver livre.'}
              {estado === 'ocioso' && 'O áudio fica no grupo Arrotos do perfil escolhido.'}
            </span>
          </div>
        </div>

        {erroExibido && <p className="dialog-gravar-arroto__erro" role="alert">{erroExibido}</p>}

        <div className="dialog-gravar-arroto__acoes-gravacao">
          {(estado === 'ocioso' || estado === 'erro') && (
            <button
              ref={botaoPrincipal}
              type="button"
              className="submit"
              onClick={() => executar(aoIniciarGravacao)}
              disabled={ocupado}
            >
              ● Gravar agora
            </button>
          )}
          {estado === 'solicitando' && (
            <button ref={botaoPrincipal} type="button" className="tab" disabled>
              Preparando…
            </button>
          )}
          {gravando && (
            <button ref={botaoPrincipal} type="button" className="tab dialog-gravar-arroto__parar" onClick={() => executar(aoPararGravacao)}>
              ■ Parar gravação
            </button>
          )}
          {pronto && (
            <button ref={botaoPrincipal} type="button" className="tab" onClick={aoRegravar} disabled={enviando}>
              ↻ Regravar
            </button>
          )}
        </div>

        {pronto && destinoFixo === 'perfil-proprio' && (
          <p className="destino-arroto__aviso">
            Este áudio vai ficar no grupo Arrotos do seu perfil.
          </p>
        )}

        {pronto && !destinoFixo && (
          <fieldset className="destino-arroto" disabled={enviando}>
            <legend>Onde esse arroto vai ficar?</legend>
            <label className="destino-arroto__opcao">
              <input type="radio" name="destino-arroto" checked={destino === 'perfil-proprio'} onChange={() => setDestino('perfil-proprio')} />
              <span><strong>Meu perfil</strong><small>Grupo Arrotos</small></span>
            </label>
            <label className="destino-arroto__opcao">
              <input type="radio" name="destino-arroto" checked={destino === 'perfil-marcado'} onChange={() => setDestino('perfil-marcado')} />
              <span><strong>Perfil de outra pessoa</strong><small>Vai com você indicado como remetente.</small></span>
            </label>
            {destino === 'perfil-marcado' && (
              <label className="destino-arroto__campo">
                Enviar para @
                <input
                  type="text"
                  value={handle}
                  onChange={(evento) => setHandle(evento.target.value)}
                  placeholder="nome-da-pessoa"
                  aria-label="@ de quem vai receber o arroto"
                  autoCapitalize="none"
                  spellCheck={false}
                />
              </label>
            )}
            <label className="destino-arroto__opcao">
              <input type="radio" name="destino-arroto" checked={destino === 'comunidade'} onChange={() => setDestino('comunidade')} disabled={!permitirComunidade || comunidades.length === 0} />
              <span><strong>Feed de uma comunidade</strong><small>{permitirComunidade && comunidades.length ? 'Escolha uma roda abaixo.' : 'Publicação em comunidade chega depois.'}</small></span>
            </label>
            {destino === 'comunidade' && permitirComunidade && comunidades.length > 0 && (
              <label className="destino-arroto__campo">
                Comunidade
                <select value={comunidadeSlug} onChange={(evento) => setComunidadeSlug(evento.target.value)} aria-label="Comunidade para receber o arroto">
                  {comunidades.map((comunidade) => <option key={comunidade.slug} value={comunidade.slug}>r/{comunidade.slug} — {comunidade.nome}</option>)}
                </select>
              </label>
            )}
            <p className="destino-arroto__aviso">
              Ao enviar, o áudio fica visível no grupo Arrotos do perfil escolhido para pessoas autenticadas que abrirem esse perfil.
            </p>
          </fieldset>
        )}

        <footer className="dialog-gravar-arroto__rodape">
          <button type="button" className="tab" onClick={aoFechar} disabled={gravando || ocupado}>Cancelar</button>
          {pronto && (
            <button type="button" className="submit" onClick={enviar} disabled={!destinoValido || enviando}>
              {enviando ? 'Enviando…' : 'Enviar arroto'}
            </button>
          )}
        </footer>
      </section>
    </div>
  );
}
