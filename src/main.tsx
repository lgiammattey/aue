import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { configuracaoAusente } from './db/supabase'
import { garantirSessao } from './shared/auth/sessaoAnonima'
import { EntradaArenaLocalV2 } from './arena/v2/EntradaArenaLocalV2'
import { FLAGS } from './shared/flags'
import { entradaLocalArenaV2 } from './plataforma/web/entradaLocalArenaV2'
import { TelaDeConfiguracaoAusente } from './shared/components/TelaDeConfiguracaoAusente'

const raiz = createRoot(document.getElementById('root')!)

// O PWA só existe no build publicado. Se uma sessão mobile de desenvolvimento
// ficou controlada por um worker antigo, ela veria a casca anterior mesmo com o
// Vite já entregando módulos novos. Limpa apenas a origem local, uma vez que a
// pessoa recarregar, para o feedback de UI sempre refletir o código atual.
if (import.meta.env.DEV && 'serviceWorker' in navigator) {
  void Promise.all([
    navigator.serviceWorker.getRegistrations().then((registros) =>
      Promise.all(registros.map((registro) => registro.unregister())),
    ),
    caches.keys().then((chaves) => Promise.all(chaves.map((chave) => caches.delete(chave)))),
  ])
}

/*
  Barreira de configuração, ANTES de montar o app.

  `db/supabase` deixou de lançar com credencial vazia justamente para chegar
  até aqui: antes, o import explodia e o navegador ficava com a página em
  branco, sem uma palavra sobre o motivo. Agora ele relata e a tela explica.

  Exceto pela entrada local explícita da Arena v2, `App` não é montado neste caminho — então nenhuma requisição sai
  para o endereço de placeholder.

  ------------------------------------------------------------------------
  CONSEQUÊNCIA DE BUILD QUE VOCÊ PRECISA CONHECER ANTES DE PUBLICAR
  ------------------------------------------------------------------------
  `configuracaoAusente` deriva de `import.meta.env.VITE_SUPABASE_*`, que são
  substituídas em TEMPO DE BUILD. O empacotador pode eliminar ramos mortos:

    - Build COM as variáveis  -> `App` entra no bundle, esta tela some dele.
    - Build SEM as variáveis  -> esta tela ou a Arena local opt-in; o `App` não é montado.

  Ou seja: um deploy feito sem as variáveis configuradas publica um bundle que
  mostra a mensagem de erro nas rotas que precisam do serviço. Configurar o
  painel depois não altera o bundle: é preciso um build novo.

  Isso não é um defeito a corrigir, é a natureza de `VITE_*`. Está escrito aqui
  porque o sintoma ("publiquei e só aparece a tela de erro, mesmo depois de
  configurar") é confuso, e a saída é sempre a mesma: configure as variáveis em
  Production E Preview, e rode um NOVO build.
*/
if (configuracaoAusente && FLAGS.arenaV2 && entradaLocalArenaV2()) {
  // Só a gravação local: sem App, sessão anônima ou acesso ao Supabase.
  raiz.render(<StrictMode><EntradaArenaLocalV2 /></StrictMode>)
} else if (configuracaoAusente) {
  raiz.render(
    <StrictMode>
      <TelaDeConfiguracaoAusente variavel={configuracaoAusente} />
    </StrictMode>,
  )
} else {
  /*
    Sessão anônima ANTES do primeiro render, e sem `await`.

    Sem await de propósito: a criação da sessão é uma ida à rede e o app não
    depende dela para desenhar o primeiro quadro. `App` e `AudioRecorder` já
    assinam `onAuthStateChange` desde antes — os dois recebem o `SIGNED_IN`
    quando ele chegar, sem nenhuma mudança neles.

    Fora de qualquer efeito de React de propósito: sob StrictMode os efeitos
    rodam duas vezes em desenvolvimento, e aqui isso significaria dois usuários
    criados por recarga. Ver `sessaoAnonima.ts`.
  */
  void garantirSessao()

  raiz.render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}
