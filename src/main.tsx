import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { configuracaoAusente } from './db/supabase'
import { garantirSessao } from './shared/auth/sessaoAnonima'
import { EntradaArenaLocalV2 } from './arena/v2/EntradaArenaLocalV2'
import { ConteudoDaHome } from './arena/v2/ConteudoDaHome'
import { InicioM05 } from './features/m05/InicioM05'
import { MolduraM05, NavegacaoM05 } from './features/m05/NavegacaoM05'
import { ArenaV2 } from './arena/v2/ArenaV2'
import { analyticsArenaV2Em } from './plataforma/web/analyticsArenaV2'
import { FLAGS } from './shared/flags'
import { entradaLocalArenaV2 } from './plataforma/web/entradaLocalArenaV2'
import { TelaDeConfiguracaoAusente } from './shared/components/TelaDeConfiguracaoAusente'
import { configurarExclusaoTelemetria } from './plataforma/web/exclusaoTelemetria'
import { ComAvisoExclusaoTelemetria } from './plataforma/web/AvisoExclusaoTelemetria'
import { ComoArrotar } from './features/publico/ComoArrotar'
import { HomeEn } from './features/publico/HomeEn'
import { ComoJogar } from './features/publico/ComoJogar'
import { TiposDeArroto } from './features/publico/TiposDeArroto'
import { PoliticaDePrivacidade } from './features/legal/PoliticaDePrivacidade'
import { TermosDeUso } from './features/legal/TermosDeUso'

const estadoExclusao = configurarExclusaoTelemetria()

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
const rotasEstaticasSemBanco = new Set([
  '/en',
  '/como-arrotar',
  '/como-jogar',
  '/tipos-de-arroto',
  '/privacidade',
  '/termos',
])

if (configuracaoAusente && import.meta.env.DEV && window.location.pathname === '/') {
  // A Home abre sem banco em dev. A Resenha precisa de um ambiente configurado.
  raiz.render(
    <StrictMode>
      <ComAvisoExclusaoTelemetria estado={estadoExclusao}>
        <BrowserRouter>
          <div className="m05-app">
            <MolduraM05><InicioM05 comResenha={false}><ConteudoDaHome comAnuncio={false} /></InicioM05></MolduraM05>
            <NavegacaoM05 mobile />
          </div>
        </BrowserRouter>
      </ComAvisoExclusaoTelemetria>
    </StrictMode>,
  )
} else if (configuracaoAusente && import.meta.env.DEV && rotasEstaticasSemBanco.has(window.location.pathname)) {
  // Em dev sem .env, permite visualizar páginas estáticas públicas sem montar o App nem chamar o Supabase.
  raiz.render(
    <StrictMode>
      <ComAvisoExclusaoTelemetria estado={estadoExclusao}>
        <BrowserRouter>
          <Routes>
            <Route path="/en" element={<div className="m05-app"><MolduraM05 idioma="en"><HomeEn comResenha={false} /></MolduraM05><NavegacaoM05 idioma="en" mobile /></div>} />
            <Route path="/como-arrotar" element={<ComoArrotar />} />
            <Route path="/como-jogar" element={<ComoJogar />} />
            <Route path="/tipos-de-arroto" element={<TiposDeArroto />} />
            <Route path="/privacidade" element={<PoliticaDePrivacidade />} />
            <Route path="/termos" element={<TermosDeUso />} />
          </Routes>
        </BrowserRouter>
      </ComAvisoExclusaoTelemetria>
    </StrictMode>,
  )
} else if (configuracaoAusente && import.meta.env.DEV && window.location.pathname === '/arena') {
  const emIngles = new URLSearchParams(window.location.search).get('lang') === 'en'
  raiz.render(
    <StrictMode>
      <ComAvisoExclusaoTelemetria estado={estadoExclusao}>
        <BrowserRouter>
          <div className="m05-app">
            <MolduraM05 idioma={emIngles ? 'en' : 'pt'}>
              {emIngles ? <ArenaV2 experienciaM05 idioma="en" telemetria={analyticsArenaV2Em} /> : <EntradaArenaLocalV2 experienciaM05 />}
            </MolduraM05>
            <NavegacaoM05 idioma={emIngles ? 'en' : 'pt'} mobile />
          </div>
        </BrowserRouter>
      </ComAvisoExclusaoTelemetria>
    </StrictMode>,
  )
} else if (configuracaoAusente && FLAGS.arenaV2 && entradaLocalArenaV2()) {
  // Só a gravação local: sem App, sessão anônima ou acesso ao Supabase.
  raiz.render(<StrictMode><ComAvisoExclusaoTelemetria estado={estadoExclusao}><EntradaArenaLocalV2 /></ComAvisoExclusaoTelemetria></StrictMode>)
} else if (configuracaoAusente) {
  raiz.render(
    <StrictMode>
      <ComAvisoExclusaoTelemetria estado={estadoExclusao}><TelaDeConfiguracaoAusente variavel={configuracaoAusente} /></ComAvisoExclusaoTelemetria>
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
      <ComAvisoExclusaoTelemetria estado={estadoExclusao}><App /></ComAvisoExclusaoTelemetria>
    </StrictMode>,
  )
}
