# Arquitetura do Auê

## Registro da M01 — Foundation

**Revisado em:** 27/11/2026, no SHA `ba161a10c50ffa8b7d7c060043e435a8deb59ea1`.

Este arquivo descreve a arquitetura versionada. Ele não amplia escopo, não prova
o runtime implantado e não substitui uma migração, policy, configuração de
serviço ou teste em aparelho. O produto é definido por [`../jogo/AUE.md`](../jogo/AUE.md),
o recorte atual por [`../escopo/ESCOPO_ATUAL.md`](../escopo/ESCOPO_ATUAL.md) e
as telas por [`../design/MAPA_DE_PAGINAS_E_FLUXOS.md`](../design/MAPA_DE_PAGINAS_E_FLUXOS.md).

Decisões aceitas vivem no [índice de ADRs](adr/README.md). Quando esta descrição
discordar do código ou das migrations, código e migrations prevalecem. Quando
uma decisão aceita precisar mudar, abre-se novo ADR: este documento não muda
decisão por conta própria.

### O que a M01 decidiu sobre arquitetura

A M01 não muda stack, dados, políticas, hospedagem, flags nem comportamento de
produto. Ela cria a base documental para que cada mudança sistêmica tenha
Cartão de Missão, Gate Arquitetural, prova no ambiente declarado e rollback
registrado. A M02 continua bloqueada até autorização do Product Owner; os itens
T01 e T02 são candidatos de trabalho dessa missão, não pré-requisitos que já
precisem estar resolvidos para a sua abertura.

### Arquitetura observada no código versionado

| Área | Implementação no SHA | Limite da evidência |
|---|---|---|
| Interface e rotas | React 19, TypeScript e Vite. [`src/App.tsx`](../../src/App.tsx) monta Arena V2 por flags, preserva entradas antigas de duelo e redireciona comunidades/tópicos para `/`. | Rota no código não prova que a mesma versão esteja publicada. |
| Arena e áudio | `src/arena/v2/` compõe a Arena, enquanto `src/arena/` e `src/features/audio/` preservam compatibilidade de fluxos e links anteriores. | Navegador local não substitui prova de microfone, codec ou aparelho real. |
| Regras | `src/nucleo/` concentra regras puras; `src/portas/` declara contratos; `src/plataforma/web/` contém adaptadores de browser e Supabase. | Há divergências de fronteira registradas abaixo. |
| Dados | Supabase Auth, Postgres, RLS, RPC, Storage e Edge Functions. A fonte de schema versionado é `supabase/migrations/`. | As 117 migrations foram reconstituídas em PGlite no M00, com Auth/Storage simulados; isso não prova grants, buckets ou drift da instância. |
| Publicação | `firebase.json` aponta o alvo `aue-oficial`; o workflow `publicar-firebase.yml` constrói e publica. Flags `VITE_*` entram no build, e `src/shared/flags.ts` mantém ausência como desligada. | Uma execução bem-sucedida do CI não identifica sozinha o SHA servido agora. |
| Compatibilidade de domínio/PWA | `vercel.json` só constrói `sw.js` de migração e redireciona ao domínio oficial; Firebase atende o app. | A coexistência é transição operacional, não segunda aplicação ativa. Retirada exige prova de instalações legadas e redirects vivos. |

### Divergências abertas, sem correção nesta missão

1. **Fronteira web.** O ADR 0001 limita APIs de navegador e o cliente Supabase a
   `src/plataforma/web`. O M00 confirmou usos fora dela em
   `features/audio/hooks/useGravacao.ts`, `features/audio/ultimaBatalha.ts`,
   `features/novo-aue/CardDoPost.tsx` e `features/novo-aue/MenuDoPost.tsx`.
   Isso é desvio do ADR, não prova de vazamento ou falha de usuário. A correção
   é o item AUE-T15 e requer Gate Arquitetural com prova de captura, storage e
   compartilhamento.
2. **Integridade competitiva e grupos.** A reconstituição local do M00 aceitou
   métricas fornecidas pelo cliente no resultado e reproduziu corrida no limite
   de cadastro de grupos. São evidências de lógica versionada sob dublês, não
   fraude ou exploração confirmada em produção. AUE-T01 e AUE-T02 seguem
   abertos para a M02 quando autorizada.
3. **Contrato remoto.** RLS, Auth, Storage, Edge Functions, worker e dados
   implantados não foram validados contra o ambiente real. Testes SQL sociais e
   parte das suítes de duelo pararam em incompatibilidades da reconstituição
   PGlite. Isso mantém AUE-T05, T10, T11 e T14 abertos.
4. **Produto e documentação.** Comunidades temáticas, tópicos, Tropa como
   produto separado, tema claro fixo para páginas públicas, lojas nativas e
   topologias antigas de hospedagem não são orientação vigente. O produto atual
   é Arena, Mural, Perfil e gravador transversal; as telas seguem o mapa e o
   design system. Links e componentes legados permanecem sujeitos a análise de
   uso e compatibilidade, não a expansão funcional. A fonte é
   [`../jogo/AUE.md`](../jogo/AUE.md),
   [`../escopo/ESCOPO_ATUAL.md`](../escopo/ESCOPO_ATUAL.md),
   [`../design/MAPA_DE_PAGINAS_E_FLUXOS.md`](../design/MAPA_DE_PAGINAS_E_FLUXOS.md),
   ADR 0006 e ADR 0015.

### Gate Arquitetural

É obrigatório para mudança de motor de áudio, schema, RLS, Storage, RPC, Edge
Function, contrato compartilhado, fronteira web, performance crítica ou outra
matéria do §8 do ADR 0001. Antes do código, o plano registra: problema e
invariante; camadas e consumidores afetados; compatibilidade; dados/migração e
rollback; impacto de bundle e operação; provas exigidas. A prova independente
precisa declarar o ambiente usado. Código local, PGlite, staging, aparelho e
produção são níveis distintos de evidência.

### Arquitetura vigente por camada

O Auê processa no navegador o que requer resposta imediata e usa o Supabase para
estado compartilhado, persistência e políticas do servidor. A divisão vigente
é a do ADR 0001:

| Camada | Responsabilidade no código versionado | Regra de fronteira |
|---|---|---|
| `src/nucleo/` | regras de domínio que podem ser puras e testáveis | não conhece React, DOM ou SDKs externos |
| `src/portas/` | contratos que o núcleo e os casos de uso consomem | expressa dependências, não escolhe browser ou Supabase |
| `src/plataforma/` | adaptadores de browser e Supabase | única camada autorizada a falar diretamente com APIs de navegador e cliente Supabase |
| UI, Arena e `src/features/` | apresentação, composição de fluxo e estados de interface | usa casos de uso/portas; não torna falha de infraestrutura um sucesso visual |

O repositório ainda contém implementações fora dessa fronteira; elas são o
desvio AUE-T15, não uma exceção a ela. A Arena V2, o áudio, o Mural, o Perfil e
os caminhos legados coexistem no código por compatibilidade. A decisão de quais
rotas e componentes estão ativos pertence ao mapa de páginas e ao código, não a
este arquivo.

### Browser, áudio e erro honesto

Captura, `MediaRecorder`, Web Audio, `localStorage`, compartilhamento e ciclo de
vida do `MediaStream` pertencem a adaptadores de plataforma. Uma implementação
que toque microfone precisa prever parar, descartar, timeout, erro e desmontagem
sem vazar a stream. Mídia sintética e navegador local são prova do cenário
declarado, não de um aparelho físico ou da permissão real do usuário.

A nota é um laudo experimental. O M00 mostrou que métricas recebidas do cliente
podem ser manipuladas na reconstituição local; logo, dados do cliente não podem
ganhar nova consequência competitiva sem uma missão autorizada e prova de
integridade proporcional. Isso não afirma fraude ou exploração em produção.

### Dados, sessão, mídia e segurança

`supabase/migrations/` é a fonte do schema versionado. Auth, RLS, RPC, Storage,
triggers e Edge Functions são contratos remotos que exigem prova no ambiente
declarado antes de se afirmar política efetiva. Variáveis `VITE_*` são
incorporadas ao artefato no build; alterar painel ou segredo não muda um bundle
já publicado.

Dados e áudio só devem ser persistidos quando o fluxo exigir. Consentimento para
gravar não é consentimento para publicação. O design de acesso precisa considerar
papéis, URLs compartilháveis, expiração, retenção, tamanho/formato de upload e
falhas explícitas; a policy efetiva e a retenção implantada não são inferidas
somente das migrations.

### PWA, publicação e observabilidade

O PWA e o cache de assets não tornam a jornada offline-first. Não há prova nesta
M01 de fila de upload, persistência offline ou funcionamento de gravação/batalha
sem rede. Firebase é o alvo de publicação observado; o SW de migração e os
redirects em Vercel existem para compatibilidade de domínio. A remoção de
legado exige evidência operacional, conforme AUE-T08 e OPS-SEO-01.

Telemetria deve responder à jornada sem coletar áudio por padrão. Evento, build
local, CI verde, HTTP 200 ou deploy concluído são evidências diferentes; nenhum
deles sozinho prova comportamento de microfone, autorização, banco, indexação
ou versão efetivamente servida. O procedimento e a evidência de release vivem
em [`operacao/RELEASE.md`](operacao/RELEASE.md).

### Encerramento técnico de uma mudança

O critério e o ambiente de prova são definidos no Cartão de Missão e em
[`QUALIDADE.md`](QUALIDADE.md). Para alteração de motor, dados, contrato,
plataforma ou performance, o Gate Arquitetural acima é parte do trabalho. Uma
falha, retry ou lacuna de ambiente continua visível no parecer; ela não pode
ser convertida em sucesso por documentação ou interface.
