# Produção atual — Auê

**Referência:** commit `d541e3162e6f1e6a488f92f16d1cf17791b57cbf` na main.
**Conferência:** 23/11/2026, por código, GitHub Actions, histórico de migrações e observação em navegador desktop da página inicial e de cinco rotas públicas.
**Endereço oficial atual:** https://arrotaaue.com.br/; `aue.web.app` é host legado. O restante deste retrato é histórico, de 23/11/2026. A M00 observou um deploy posterior sem conseguir identificar com certeza o SHA servido hoje; veja [baseline M00](technical/auditorias/M00-BASELINE.md).

A execução [Publicar no Firebase](https://github.com/lgiammattey/aue/actions/runs/45280078724) para esse commit terminou com sucesso no canal live, e a execução independente [Validação](https://github.com/lgiammattey/aue/actions/runs/45280078824) do mesmo commit também passou. Uma não substitui a outra: a publicação bem-sucedida não prova operação do banco nem funcionamento de cada jornada.

A página inicial foi aberta em navegador desktop e mostrou aviso 18+, Arena com botão de gravar, seção Liga com cinco posições carregadas, links de mural, ranking, grupos e desafios, e as seções de guia de como arrotar e tipos de arroto na própria página. `/`, `/en`, `/como-arrotar`, `/tipos-de-arroto` e `/sitemap.xml` responderam 200, e `/en` abriu com título em inglês. A verificação não acionou microfone, confirmação de idade, login ou gravação e não prova jornadas de ponta a ponta. As rotas abaixo descrevem o código; configuração efetiva, permissões e recursos no backend exigem testes próprios.

## Corte do build publicado

O workflow `.github/workflows/publicar-firebase.yml` liga `VITE_FEATURE_ARENA_EXPERIMENTAL`, `VITE_FEATURE_DUELO_PRIVADO`, `VITE_FEATURE_DISPUTA_LOCAL`, `VITE_FEATURE_DISPUTA_NA_ARENA` e `VITE_FEATURE_ADSTERRA`. Login pelo X não é ligado nesse workflow. Flags são incorporadas no build; ausência da variável significa desligado.

## Rotas no código

| Entrada | Comportamento configurado |
|---|---|
| `/` | Arena v2 com conteúdo de repouso e ranking; com as duas flags ligadas usa a entrada integrada de duelo. |
| `/arena` | Entrada da Arena v2; sem a flag, tela de indisponibilidade. |
| `/feed`, `/seguindo` | Casca social; a entrada em `/feed` pode incluir a Arena. |
| `/duelo` | Resposta ao duelo v2 quando ambas as flags estão ligadas. |
| `/x1/:code`, `/b/:code`, `/d/:id` | Entradas de fluxos anteriores, preservadas no roteador. Não presumir que têm as mesmas regras do duelo v2. |
| `/perfil`, `/u/:handle`, `/login` | Perfil e autenticação. |
| `/grupos` | Diretório de grupos externos. |
| `/como-jogar`, `/como-arrotar`, `/tipos-de-arroto`, `/ranking-de-arrotos` | Páginas públicas. |
| `/en` | Home em inglês, indexável, com `hreflang` recíproco com `/`. O código auditado pela M00 passa `idioma=en` para a Arena v2; comportamento publicado atual não foi comprovado por esta linha histórica. |
| `/admin` | Entrada administrativa; acesso efetivo depende das autorizações do backend. |

As rotas de comunidades e tópicos no roteador React redirecionam para `/`. O Firebase configura redirecionamentos próprios para `/comunidade`, `/videos` e `/videos-de-arroto`; a resposta final depende também da precedência de Hosting e deve ser verificada ao vivo. Não apresentar hubs de comunidades como navegação ativa sem prova.

## Backend conferido

O projeto Supabase `Auê` estava ativo e saudável. A listagem mostrou ativas as funções `duelo-audio-v2`, `notas-worker`, `painel-administrativo` e `cadastrar-grupo`, presentes no repositório, além de `og-preview`, `teste-content-type` e `uso-unico-imagens-oficiais`, ausentes da pasta versionada `supabase/functions/`. A listagem confirma presença e estado, não equivalência do código implantado, necessidade atual ou segurança; não apague funções sem investigação específica.

## Limites e próximos checks

- Validar abertura, gravação, nota, publicação consentida e erros em desktop e celular real.
- Validar criação, resposta e revelação do duelo, incluindo acesso e retenção no backend. Não assumir que regras legadas valem para v2.
- Verificar recursos de perfil, mural, ranking, grupos e anúncios no navegador e no Supabase.
- O histórico do projeto `Auê` e a pasta local têm as mesmas 117 versões de migração. A comparação foi apenas de versões: conteúdo do schema, policies, configuração e execução real não foram verificados.
- A Validação do commit anterior (`dc83657`) falhou no teste de fronteira arquitetural, porque `src/arena/v2/ConteudoDaHome.tsx` importava `AdsterraNativeBanner` de `features/novo-aue`. A [#370](https://github.com/lgiammattey/aue/pull/370) moveu o componente para `src/shared/components/`, e a Validação passa na referência atual.
- A conferência anterior de 22/10/2026 está no histórico Git; dados e impressões daquela data não descrevem o momento atual.

Fontes: [roteador](../src/App.tsx), [flags](../src/shared/flags.ts), [workflow de publicação](../.github/workflows/publicar-firebase.yml) e [configuração do Hosting](../firebase.json). Planejamento e propostas não são evidência de entrega.
