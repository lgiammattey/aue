# Produção atual — Auê

**Referência:** commit `dc83657589294fb45e28f7b5753712044e709b08` na main.
**Conferência:** 23/11/2026, por código e execução do GitHub Actions.
**Endereço configurado:** https://aue.web.app/

A execução [Publicar no Firebase](https://github.com/lgiammattey/aue/actions/runs/45114720736) para esse commit terminou com sucesso no canal live. A execução independente [Validação](https://github.com/lgiammattey/aue/actions/runs/45114720565) do mesmo commit falhou. A publicação bem-sucedida não prova aprovação da validação, operação do banco ou funcionamento de cada jornada.

Não foi possível conferir a página em navegador nesta revisão. Portanto, os itens abaixo são o comportamento configurado no código publicado, não aceite funcional ou visual. Migrações do Supabase efetivamente aplicadas, configurações do projeto, dados, permissões e fluxos reais ainda precisam de conferência no ambiente.

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
| `/admin` | Entrada administrativa; acesso efetivo depende das autorizações do backend. |

As rotas de comunidades e tópicos no roteador React redirecionam para `/`. O Firebase configura redirecionamentos próprios para `/comunidade`, `/videos` e `/videos-de-arroto`; a resposta final depende também da precedência de Hosting e deve ser verificada ao vivo. Não apresentar hubs de comunidades como navegação ativa sem prova.

## Limites e próximos checks

- Validar abertura, gravação, nota, publicação consentida e erros em desktop e celular real.
- Validar criação, resposta e revelação do duelo, incluindo acesso e retenção no backend. Não assumir que regras legadas valem para v2.
- Verificar recursos de perfil, mural, ranking, grupos e anúncios no navegador e no Supabase.
- Investigar a falha de validação e verificar migrações aplicadas antes de afirmar paridade do banco.
- A conferência anterior de 22/10/2026 está no histórico Git; dados e impressões daquela data não descrevem o momento atual.

Fontes: [roteador](../src/App.tsx), [flags](../src/shared/flags.ts), [workflow de publicação](../.github/workflows/publicar-firebase.yml) e [configuração do Hosting](../firebase.json). Planejamento e propostas não são evidência de entrega.
