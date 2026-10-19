import { Link, useLocation } from 'react-router-dom';
import { enderecoDoLoginComVolta } from '../../nucleo/comunidade/caminhoDeVolta';
import { ordenarComunidades } from '../../nucleo/forum/apresentacao';
import type { ComunidadeDoForum } from '../../portas/forum';
import { EstadoDeErro, EstadoVazio, Esqueleto, LinhaDeComunidade } from './componentes';
import { useDependenciasDoForum } from './contexto';
import { useLeitura, useOnline } from './hooks';
import { usePapel } from './papel';
import { TopoDaTela } from './ShellDoForum';
import { useTituloDoDocumento } from './encaixes';

function ListaDeComunidades({ comunidades, agora }: { readonly comunidades: readonly ComunidadeDoForum[]; readonly agora: number }) {
  return (
    <ul className="forum-lista forum-lista--comunidades">
      {comunidades.map((c) => (
        <LinhaDeComunidade key={c.id} comunidade={c} agora={agora} />
      ))}
    </ul>
  );
}

/** Tela 1 (spec 7): o diretório. Visitante lê tudo; conta vê as dela separadas. */
export function TelaDiretorio() {
  const { forum, ambiente } = useDependenciasDoForum();
  const papel = usePapel();
  const online = useOnline(ambiente);
  const local = useLocation();
  useTituloDoDocumento('Comunidades');

  const { estado, recarregar } = useLeitura(() => forum.listarComunidadesDoForum(), 'diretorio');
  const agora = ambiente.agora();

  let corpo;
  if (estado.fase === 'erro') {
    corpo = <EstadoDeErro titulo="Deu ruim pra carregar as comunidades." offline={!online} aoTentar={recarregar} />;
  } else if (estado.fase === 'carregando' || papel.tipo === 'carregando') {
    corpo = <Esqueleto forma="lista" anuncio="Carregando comunidades" />;
  } else if (estado.valor.length === 0) {
    corpo = <EstadoVazio titulo="Nenhuma comunidade aberta ainda." linha="Volta daqui a pouco." />;
  } else {
    const ordenadas = ordenarComunidades(estado.valor);
    if (papel.tipo === 'conta') {
      const dela = ordenadas.filter((c) => c.souMembro || papel.slugsDeMembro.has(c.slug));
      const outras = ordenadas.filter((c) => !(c.souMembro || papel.slugsDeMembro.has(c.slug)));
      corpo = (
        <>
          <section aria-labelledby="forum-suas">
            <h2 id="forum-suas" className="forum-secao">
              Suas comunidades
            </h2>
            {dela.length > 0 ? (
              <ListaDeComunidades comunidades={dela} agora={agora} />
            ) : (
              <p className="forum-aviso">
                Você ainda não participa de nenhuma comunidade. Escolhe uma turma aqui embaixo.
              </p>
            )}
          </section>
          {outras.length > 0 && (
            <section aria-labelledby="forum-conhecer">
              <h2 id="forum-conhecer" className="forum-secao">
                Para conhecer
              </h2>
              <ListaDeComunidades comunidades={outras} agora={agora} />
            </section>
          )}
        </>
      );
    } else {
      // Visitante, ou não deu para saber quem é: uma lista só, sem fingir separação.
      corpo = (
        <section aria-labelledby="forum-todas">
          <h2 id="forum-todas" className="forum-secao">
            Comunidades
          </h2>
          <ListaDeComunidades comunidades={ordenadas} agora={agora} />
        </section>
      );
    }
  }

  return (
    <>
      <TopoDaTela titulo="Comunidades" />
      {papel.tipo === 'visitante' && (
        <section className="forum-abertura" aria-label="Boas-vindas">
          <p className="forum-abertura__lead">Encontre sua turma. Entre nas comunidades e participe da resenha.</p>
          <p className="forum-abertura__apoio">Só quer ouvir? Fica à vontade. Dá pra ler tudo sem conta.</p>
          <div className="forum-abertura__acoes">
            <Link
              className="forum-botao forum-botao--acento"
              to={enderecoDoLoginComVolta(local.pathname + local.search, 'cadastro')}
            >
              Criar conta
            </Link>
            <Link className="forum-link-texto" to={enderecoDoLoginComVolta(local.pathname + local.search, 'entrar')}>
              Já tenho conta
            </Link>
          </div>
        </section>
      )}
      {corpo}
      <p className="forum-rodape-externo">
        Procurando grupo de WhatsApp ou Telegram? Eles ficam fora do Auê.{' '}
        <Link to="/grupos">Ver grupos externos</Link>
      </p>
    </>
  );
}
