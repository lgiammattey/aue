import { forwardRef, useEffect, useRef, useState, type RefObject } from 'react';
import { Link, useLocation } from 'react-router-dom';
import type { ComunidadeDoForum } from '../../portas/forum';
import { ConviteDeVisitante } from './ConviteDeVisitante';
import { enderecoDaComunidade } from './enderecos';
import { SLUG_DO_BONDE_GERAL, usePapel } from './papel';
import { useParticiparDaComunidade } from './useParticiparDaComunidade';

/** O botão "Participar". Quem usa decide o que acontece depois (foco, mensagem). */
export const BotaoParticipar = forwardRef<
  HTMLButtonElement,
  {
    readonly pendente: boolean;
    readonly aoClicar: () => void;
    readonly acento?: boolean;
  }
>(function BotaoParticipar({ pendente, aoClicar, acento = true }, ref) {
  return (
    <button
      ref={ref}
      type="button"
      className={`forum-botao ${acento ? 'forum-botao--acento' : 'forum-botao--contorno'}`}
      onClick={() => {
        if (!pendente) aoClicar();
      }}
      aria-disabled={pendente || undefined}
    >
      {pendente ? 'Entrando…' : 'Participar'}
    </button>
  );
});

interface PropsDasAcoes {
  readonly comunidade: ComunidadeDoForum;
  readonly souMembro: boolean;
  /** O link "Novo tópico": o dialog devolve o foco a ele ao fechar. */
  readonly gatilho: RefObject<HTMLAnchorElement | null>;
  readonly aoMudarParticipacao: () => void;
}

/**
 * A ação do cabeçalho da comunidade, por papel (spec 5 e 8.2). Uma só ação
 * primária, nunca um botão que falha:
 * - visitante e conta sem promoção: convite ("Criar conta para participar");
 * - conta que ainda não participa: "Participar";
 * - membro: "Novo tópico" e, embaixo, "Você participa · Sair da comunidade".
 * Enquanto não se sabe quem está vendo, não aparece nada (nem convite de visitante
 * para quem pode estar logado).
 */
export function AcoesDaComunidade({ comunidade, souMembro, gatilho, aoMudarParticipacao }: PropsDasAcoes) {
  const papel = usePapel();
  const local = useLocation();
  const { pendente, erro, entrar, sair } = useParticiparDaComunidade(comunidade, aoMudarParticipacao);
  const botaoDeParticipar = useRef<HTMLButtonElement>(null);
  const [focoPara, setFocoPara] = useState<'novo' | 'participar' | null>(null);

  // O botão que some cede o foco ao que o substitui (spec 15).
  useEffect(() => {
    if (focoPara === 'novo' && souMembro) gatilho.current?.focus();
    else if (focoPara === 'participar' && !souMembro) botaoDeParticipar.current?.focus();
    else return;
    setFocoPara(null);
  }, [focoPara, souMembro, gatilho]);

  if (papel.tipo === 'carregando' || papel.tipo === 'desconhecido') {
    return souMembro ? <p className="forum-meta forum-meta--forte">Você participa</p> : null;
  }
  if (papel.tipo === 'visitante') {
    return <ConviteDeVisitante rotuloDeCriar="Criar conta para participar" />;
  }

  if (!souMembro) {
    return (
      <div className="forum-acoes">
        <BotaoParticipar
          ref={botaoDeParticipar}
          pendente={pendente === 'entrar'}
          aoClicar={() => {
            void entrar().then((ok) => ok && setFocoPara('novo'));
          }}
        />
        {erro && (
          <p className="forum-campo__erro" role="alert">
            {erro}
          </p>
        )}
      </div>
    );
  }

  const podeSair = comunidade.slug !== SLUG_DO_BONDE_GERAL;
  return (
    <div className="forum-acoes">
      <Link
        ref={gatilho}
        className="forum-botao forum-botao--acento"
        to={{ pathname: `${enderecoDaComunidade(comunidade.slug)}/novo`, search: local.search }}
        state={{ daLista: true }}
      >
        Novo tópico
      </Link>
      <p className="forum-meta forum-meta--forte forum-acoes__participa">
        <span>Você participa</span>
        {podeSair && (
          <>
            <span aria-hidden="true"> · </span>
            <button
              type="button"
              className="forum-botao-texto"
              onClick={() => {
                void sair().then((ok) => ok && setFocoPara('participar'));
              }}
              aria-disabled={pendente === 'sair' || undefined}
            >
              {pendente === 'sair' ? 'Saindo…' : 'Sair da comunidade'}
            </button>
          </>
        )}
      </p>
      {erro && (
        <p className="forum-campo__erro" role="alert">
          {erro}
        </p>
      )}
    </div>
  );
}
