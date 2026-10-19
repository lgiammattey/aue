import { useEffect, type ReactNode } from 'react';
import { useAnunciar } from './ShellDoForum';
import type { ListaPaginada } from './hooks';
import {
  BotaoVerMais,
  EstadoDeErro,
  Esqueleto,
  LinhaDeTopico,
  type DadosDaLinhaDeTopico,
} from './componentes';

/**
 * A lista de tópicos de `/c/:slug` e de `/explorar`: carregando, erro (com
 * "Tentar de novo"), vazio (só quando o servidor respondeu e não há nada) e
 * "Ver mais". Falha NUNCA cai no vazio.
 */
export function ListaDeTopicos<C>({
  lista,
  comComunidade,
  vazio,
  tituloDoErro,
  offline,
  agora,
}: {
  readonly lista: ListaPaginada<DadosDaLinhaDeTopico, C>;
  readonly comComunidade?: boolean;
  readonly vazio: ReactNode;
  readonly tituloDoErro: string;
  readonly offline: boolean;
  readonly agora: number;
}) {
  const anunciar = useAnunciar();
  const anuncio = lista.anuncio;
  useEffect(() => {
    if (anuncio) anunciar(anuncio.texto);
  }, [anuncio, anunciar]);

  if (lista.fase === 'carregando') return <Esqueleto forma="lista" anuncio="Carregando tópicos" />;
  if (lista.fase === 'erro') {
    return <EstadoDeErro titulo={tituloDoErro} offline={offline} aoTentar={lista.recarregar} />;
  }
  if (lista.itens.length === 0) return <>{vazio}</>;

  return (
    <>
      <ul className="forum-lista">
        {lista.itens.map((t) => (
          <LinhaDeTopico
            key={t.id}
            topico={t}
            comComunidade={comComunidade}
            focar={lista.idParaFocar === t.id}
            agora={agora}
          />
        ))}
      </ul>
      {lista.proximo !== null && (
        <BotaoVerMais
          rotulo="Ver mais tópicos"
          carregando={lista.carregandoMais}
          falhou={lista.falhouAoCarregarMais}
          aoClicar={lista.verMais}
        />
      )}
    </>
  );
}
