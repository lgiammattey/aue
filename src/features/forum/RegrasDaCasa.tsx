import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Monograma } from './componentes';
import { enderecoDaComunidade } from './enderecos';
import { metaDoCabecalho } from './metaDoCabecalho';
import type { ComunidadeDoForum } from '../../portas/forum';

/**
 * Texto provisório, IGUAL em todas as comunidades e rotulado como "da casa":
 * `regras` não existe no banco (spec 8.2). O texto definitivo é decisão do Luiz.
 */
const REGRAS_DA_CASA = [
  'A piada é com o arroto, nunca com a pessoa.',
  'Arroto de verdade. Sem áudio dublado.',
  'Sem spam de link.',
] as const;

function Lista() {
  return (
    <ol className="forum-regras__lista">
      {REGRAS_DA_CASA.map((r) => (
        <li key={r}>{r}</li>
      ))}
    </ol>
  );
}

/** Colapsada no celular e no tablet; no desktop vive expandida no aside. */
export function RegrasEmDetalhes() {
  return (
    <details className="forum-regras forum-regras--no-miolo">
      <summary>Regras da casa</summary>
      <Lista />
    </details>
  );
}

/** Aside do desktop de `/c/:slug`: regras expandidas, sem recolher. */
export function AsideDeRegras() {
  return (
    <section className="forum-aside__bloco" aria-labelledby="forum-aside-regras">
      <h2 id="forum-aside-regras" className="forum-aside__titulo">
        Regras da casa
      </h2>
      <Lista />
    </section>
  );
}

/** Aside do desktop de `/c/:slug/t/:id`: quem é a comunidade e as regras da casa. */
export function AsideSobreAComunidade({
  referencia,
  comunidade,
  acao,
}: {
  readonly referencia: { readonly slug: string; readonly nome: string };
  /** `null` enquanto carrega ou se a leitura falhou: o aside mostra só o que a conversa já sabe. */
  readonly comunidade: ComunidadeDoForum | null;
  /** A ação da pessoa na comunidade (Participar, Você participa · Sair). */
  readonly acao?: ReactNode;
}) {
  return (
    <>
      <section className="forum-aside__bloco" aria-labelledby="forum-aside-sobre">
        <h2 id="forum-aside-sobre" className="forum-aside__titulo">
          Sobre a comunidade
        </h2>
        <div className="forum-aside__comunidade">
          <Monograma nome={referencia.nome} tamanho="lista" />
          <Link to={enderecoDaComunidade(referencia.slug)} className="forum-aside__nome">
            {referencia.nome}
          </Link>
        </div>
        {comunidade?.descricao && <p className="forum-aside__texto">{comunidade.descricao}</p>}
        {comunidade && <p className="forum-aside__meta">{metaDoCabecalho(comunidade)}</p>}
        {acao}
      </section>
      <AsideDeRegras />
    </>
  );
}
