import React from 'react';
import { Link } from 'react-router-dom';

import { MolduraPublica } from '../publico/LayoutPublico';
import './LayoutLegal.css';

/**
 * A moldura comum das páginas legais.
 *
 * POR QUE DUAS ROTAS E NÃO UMA PÁGINA `/legal` COM AS DUAS SEÇÕES
 * ---------------------------------------------------------------
 * O protótipo antigo (`legal.html`, removido do repositório na troca para o
 * protótipo do lançamento mínimo) juntava "Termos de uso"
 * e "Política de privacidade" numa tela só. Aqui elas são `/privacidade` e
 * `/termos`, por três motivos concretos:
 *
 * 1. `/privacidade` JÁ É UMA URL DO PRODUTO. O aviso de uma linha do
 *    `AudioRecorder` aponta para ela com um `<a href>` de verdade, e a landing
 *    de desktop também. Fundir tudo em `/legal` obrigaria ou a um redirecionamento
 *    (e o link do aviso passaria a levar a pessoa para um documento sobre outra
 *    coisa, com a parte que importa escondida abaixo da dobra) ou a duas URLs
 *    servindo conteúdo idêntico — que é exatamente o problema de canonical que
 *    esta mudança está corrigindo.
 * 2. QUEM PEDE ESSES DOCUMENTOS PEDE OS DOIS, PELO NOME. Revisão de conta do
 *    AdSense, publicação em loja e qualquer formulário de conformidade pedem
 *    "link da política de privacidade" e "link dos termos de uso" em campos
 *    separados. Colar a mesma URL nos dois campos é o tipo de coisa que volta
 *    reprovada.
 * 3. CANONICAL VERDADEIRO. Cada rota tem o seu `.html` de entrada com o próprio
 *    `<link rel="canonical">`, título e descrição — ver `privacidade.html` e
 *    `termos.html` na raiz do projeto. Uma página só com duas âncoras não teria
 *    como declarar isso de forma diferente para cada documento.
 *
 * O preço é a moldura repetida, e é ela que este arquivo elimina.
 */
export const LayoutLegal: React.FC<{
  /** O título do documento (H1) e o que diz em qual dos dois a pessoa está. */
  rotulo: string;
  children: React.ReactNode;
}> = ({ rotulo, children }) => (
  <MolduraPublica>
    <main className="publico-shell publico-legal">
      <section className="publico-hero">
        <span className="publico-eyebrow">Documento</span>
        <h1>{rotulo}</h1>
      </section>
      <div className="publico-legal-corpo">{children}</div>
    </main>
  </MolduraPublica>
);

/** Um bloco com título. A única variação tipográfica destas páginas. */
export const Secao: React.FC<{ titulo: string; children: React.ReactNode }> = ({
  titulo,
  children,
}) => (
  <section className="publico-legal-secao">
    <h2>{titulo}</h2>
    <div className="publico-legal-texto">{children}</div>
  </section>
);

/**
 * O rodapé comum: o caminho de volta e o link para o outro documento.
 *
 * Os dois documentos se apontam de propósito. Quem chega em `/termos` por um
 * formulário de conformidade precisa achar a política sem voltar para a home, e
 * vice-versa.
 */
export const RodapeLegal: React.FC<{ paraOnde: '/privacidade' | '/termos'; rotulo: string }> = ({
  paraOnde,
  rotulo,
}) => (
  <div className="publico-legal-rodape">
    <Link to={paraOnde}>{rotulo}</Link>
    <Link to="/" className="publico-pilula publico-pilula-clara">
      Voltar ao Auê
    </Link>
  </div>
);

/**
 * Quem responde pelo Auê. Aparece nos DOIS documentos — daí morar aqui.
 *
 * DECIDIDO POR LUIZ (2026-08-08): o responsável publicado é a **Buildea Labs**,
 * e o canal é o mesmo e-mail da seção de contato (`VITE_CONTATO_PRIVACIDADE`).
 * Até então esta seção era um aviso vermelho de pendência.
 *
 * O QUE FICOU DE FORA, DE PROPÓSITO: CNPJ e endereço. Não foram informados, e
 * uma política publicada não é lugar para número inventado nem para
 * "[preencher]". Se um dia existirem, entram aqui.
 *
 * O e-mail NÃO é escrito neste arquivo: vem de `VITE_CONTATO_PRIVACIDADE`, a
 * mesma variável usada na seção "Seus direitos" da política. Dois endereços
 * escritos à mão em dois lugares divergem no primeiro dia em que um deles muda.
 * Num build sem a variável, esta seção ainda diz quem responde e admite que o
 * canal não foi publicado, em vez de fingir que existe.
 */
export const QuemResponde: React.FC = () => {
  const contato = import.meta.env.VITE_CONTATO_PRIVACIDADE as string | undefined;

  return (
    <Secao titulo="Quem responde por isto">
      <p>
        O Auê é tocado pela <strong>Buildea Labs</strong>, e é ela quem responde
        pelo que está escrito aqui e pelo tratamento dos dados.
      </p>
      {contato ? (
        <p>
          Não tem central de atendimento nem formulário: é escrever para{' '}
          <a href={`mailto:${contato}`} style={{ color: 'var(--accent)' }}>
            {contato}
          </a>
          , e do outro lado tem gente.
        </p>
      ) : (
        <p style={{ color: 'var(--danger)' }}>
          O canal de contato ainda não foi configurado nesta publicação.
        </p>
      )}
    </Secao>
  );
};
