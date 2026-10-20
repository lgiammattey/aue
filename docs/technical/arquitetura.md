# Arquitetura do Auê

O GDD [`../jogo/AUÊ!-2.md`](../jogo/AUÊ!-2.md) e o Art Bible
[`../design/AUÊ!.md`](../design/AUÊ!.md) descrevem o comportamento e a direção
visual alvo. Este documento continua descrevendo a arquitetura implementada:
nenhum detalhe de produto ou de arte aqui cria backend, rota ou estado por si só.

**Status:** descrição da arquitetura implementada e publicada
**Revisado em:** 2026-10-20 (produção conferida em `aue.web.app`)

> Este arquivo explica a arquitetura **como ela é hoje**. Ele não amplia escopo:
> o que pertence ao produto está em
> [`../escopo/ESCOPO_ATUAL.md`](../escopo/ESCOPO_ATUAL.md) e o mapeamento de telas está em
> [`../design/MAPA_DE_PAGINAS_E_FLUXOS.md`](../design/MAPA_DE_PAGINAS_E_FLUXOS.md).
>
> E quando este documento discordar do código ou das migrações, o código e as
> migrações ganham. Documento não executa query.

> **Aqui é descrição, não decisão.** A arquitetura decidida — stack, camadas,
> fronteira com o aparelho, backend e o que exige revisão formal — está em
> [`adr/0001-arquitetura-oficial-do-aue.md`](adr/0001-arquitetura-oficial-do-aue.md),
> [`adr/0004-arquitetura-aue-3-comunidades-e-feed.md`](adr/0004-arquitetura-aue-3-comunidades-e-feed.md) e
> [`adr/0010-comunidades-topicos-e-respostas.md`](adr/0010-comunidades-topicos-e-respostas.md).
> Hospedagem no Firebase é decidida pelo [ADR 0006](adr/0006-hospedagem-somente-firebase.md).

---

## 0. Como a arquitetura do Auê está organizada hoje

O Auê é uma **rede social para arrotadores, exclusivamente online via desktop e webapp mobile**:
combina a adrenalina da **Arena** (máquina de captura, julgamento acústico YAMNet e Auê Score) à dinâmica do **Bonde do Arroto** (timeline estilo Twitter/X) e **comunidades temáticas** (estilo Orkut/Reddit).

A arquitetura do frontend é dividida em módulos com responsabilidades bem definidas:

1. **`src/arena/` (A Arena):** Superfície única contínua de 10 estados (`IDLE`, `RECORDING`, `ORIGIN`, `JUDGING`, `RESULT`, `CHALLENGE`, `VERSUS`, `SCOREBOARD`, `REMATCH`, `ERROR`). Não são rotas separadas, mas transições reativas com captura Web Audio e animação da bolha.
2. **`src/features/novo-aue/` (OpenDesign Canônico do Bonde e Comunidades):** Implementação ativa da rede social (`InicioOpenDesign`, `CardDoPost`, `ThreadDeComentarios`, `ModalCompositor`, `TelaComunidadeOpenDesign`, `TelaPerfilOpenDesign`). A home publicada mostra o Bonde; a migração para tópico e resposta é uma decisão aceita, ainda não uma declaração de entrega.
3. **`src/features/publico/` e `src/features/legal/`:** Páginas institucionais, SEO e legais com tema claro fixo (`ComoJogar`, `ComoArrotar`, `TiposDeArroto`, `RankingDeArrotos`, `TermosDeUso`, `PoliticaDePrivacidade`).
4. **`src/features/comunidade/` (Camada Legada / Compatibilidade):** Casca anterior mantida temporariamente para compatibilidade de rotas secundárias (`/feed`, `/desafios`) e testes legados. Novas funcionalidades de feed e postagens são desenvolvidas exclusivamente em `novo-aue` (ver [`MAPA_DE_PAGINAS_E_FLUXOS.md`](../design/MAPA_DE_PAGINAS_E_FLUXOS.md)).
5. **`src/nucleo/` (Lógica Pura):** Regras de negócio, cálculo de Auê Score, limites e formatação em TypeScript puro, sem acoplamento com React ou DOM.
6. **`src/plataforma/web/` e `src/portas/`:** Fronteira obrigatória com o navegador (`AudioContext`, `MediaRecorder`, `localStorage`) e cliente Supabase. Todo acesso externo passa pelas portas.

1. **Comportamento novo é quase sempre um estado ou uma transição**, não uma
   rota nova. Não acrescente tela ao caminho antigo se der para preparar o
   estado.
2. **Motor separado da tela.** Áudio (`features/audio/engine.ts`,
   `features/audio/juiz/`) e score (`features/audio/rules.ts`) não podem
   depender de componente. É o que mantém a Arena testável e a web responsiva.

A migração está fatiada no [backlog](../escopo/BACKLOG.md) e **não deve
reescrever motor de áudio, score nem backend**.

---

## 1. A ideia arquitetural em uma frase

O Auê faz o trabalho que precisa ser rápido no navegador e usa o Supabase para
o que precisa existir entre aparelhos, sobreviver à sessão ou ter regra de
segurança no servidor.

```text
Celular
  │
  ├─ captura áudio
  ├─ analisa características
  ├─ mostra feedback imediato
  │
  ▼
Supabase
  ├─ sessão anônima
  ├─ resultados persistentes
  ├─ regras oficiais/RPCs
  ├─ batalhas por link
  └─ storage de áudio quando o fluxo exige
```

Nada de inventar uma arquitetura distribuída de banco espacial para julgar um
arroto de três segundos.

---

## 2. Stack implementada

### Frontend

- React 19
- TypeScript
- Vite
- `vite-plugin-pwa`
- Web Audio API
- MediaRecorder API
- Web Share API quando disponível

### Backend

- Supabase Auth
- PostgreSQL
- Row Level Security
- RPCs e triggers
- Supabase Storage
- Edge Functions para fluxos que realmente exigem execução server-side

### Qualidade

- Vitest
- typecheck TypeScript
- lint
- build Vite

---

## 3. O que NÃO existe hoje

A arquitetura antiga descrevia IndexedDB e uma jornada offline-first completa.
Isso **não foi implementado**.

Hoje:

- o PWA possui service worker/cache de assets;
- isso não significa que a jornada inteira de gravação, batalha e persistência
  funcione offline;
- não existe uma camada canônica de IndexedDB para resultados, filas de upload
  e competições presenciais;
- nenhuma feature deve ser descrita como offline-first só porque o app é PWA.

Se offline completo virar prioridade futura, entra como projeto próprio. Não
aparece por osmose em documentação.

---

## 4. Entrada e sessão

Quem chega pode navegar sem conta; participação e identidade social seguem as
regras do fluxo publicado.

No boot, o cliente tenta criar/recuperar uma **sessão anônima do Supabase**.
Isso dá identidade técnica sem transformar a entrada em formulário.

```text
abre o Auê
   ↓
Supabase Auth anônimo
   ↓
sessão existe nos bastidores
   ↓
fluxo continua sem tela de login
```

A sessão anônima é importante para:

- aplicar RLS;
- associar operações do backend;
- permitir upload/persistência controlada;
- evitar que "sem login visual" vire "backend aberto para qualquer coisa".

### Dependência de deploy

`Anonymous sign-ins` precisa estar habilitado no projeto Supabase.

As variáveis `VITE_SUPABASE_*` entram no bundle em tempo de build. Alterá-las no
painel sem rebuild não muda o JavaScript já publicado.

---

## 5. Gravação

A captura de áudio fica isolada da lógica de persistência.

Fluxo conceitual:

```text
getUserMedia
   ↓
MediaRecorder
   ↓
blob de áudio
   ↓
análise local
   ↓
resultado provisório/UI
   ↓
persistência quando necessária
```

O hook de gravação é responsável por um invariante crítico:

> todo caminho de saída precisa liberar o `MediaStream`.

Isso inclui parar, descartar, timeout, erro e desmontagem da tela. Vazamento de
microfone é defeito de segurança/privacidade, não detalhe cosmético.

---

## 6. Auê Judgement Engine

O motor extrai características digitais do áudio e produz as parciais usadas no
Auê Score.

Dimensões atuais do produto:

- duração;
- potência;
- profundidade;
- textura;
- origem declarada.

A interface pode ser engraçada. A matemática precisa ser determinística e
versionada.

### Duas camadas de confiança

O navegador calcula para resposta rápida, mas o cliente não deve ter autoridade
para escrever qualquer nota arbitrária como resultado oficial.

A regra oficial é protegida no backend por RPC/constraints/triggers versionados.
`enviar_resultado` é parte desse caminho.

Existe teste de coerência entre a fórmula TypeScript e a versão SQL no
repositório. Isso protege os **arquivos versionados**, mas não prova que o banco
remoto recebeu a mesma migração.

---

## 7. Resultado individual

O resultado liga três coisas:

1. análise;
2. apresentação;
3. decisão do que persistir/compartilhar.

A interface não deve misturar essas responsabilidades num componente gigante.

O resultado pode existir sem feed, ranking, XP ou conta social. Essas features
são complementares e ficam atrás de flags quando fora do corte.

---

## 8. Batalha por link — `/b/CODIGO`

A batalha é a mecânica viral principal do MVP1.

Não é feed público e não depende de perfil social.

```text
resultado
   ↓
criar batalha
   ↓
código imprevisível
   ↓
/b/CODIGO
   ↓
amigo abre
   ↓
consulta sequência pelo código
   ↓
ouve / grava / recebe nota
   ↓
nova rodada entra na batalha
```

### Modelo de acesso

As tabelas `batalhas` e `rodadas_batalha` usam RLS e o acesso da aplicação passa
por RPCs que recebem o código da batalha.

O código funciona como uma **capability URL**: quem possui o link consegue
participar enquanto a sessão estiver válida.

Consequências:

- o código precisa ser imprevisível e não enumerável;
- não deve existir listagem pública de batalhas;
- logs e analytics não devem vazar o código sem necessidade;
- expiração precisa ser validada no backend, não só escondida na UI.

### Expiração

O acesso público da batalha expira em até 7 dias.

O acesso pelo link expira em até 7 dias. O arquivo é mantido, sem expurgo
automático, conforme [`../jogo/REGRAS.md`](../jogo/REGRAS.md) §8; nenhuma tela
deve sugerir o contrário.

---

## 9. Desafio legado — `/d/CODIGO`

O fluxo antigo de desafio 1v1 continua no código por compatibilidade com links
já criados.

Estado: **LEGADO**.

Regras:

- não direcionar novas jornadas para `/d/`;
- não ampliar funcionalidade ali;
- correções de segurança/compatibilidade continuam permitidas;
- novas mecânicas competitivas usam `/b/`.

---

## 10. Disputa local

A disputa presencial usa um único aparelho como juiz.

No MVP1:

- 2 a 5 participantes;
- 1 a 3 rounds;
- turnos sequenciais;
- origem por tentativa;
- placar durante a disputa;
- pódio no final;
- compartilhamento do resultado.

A lógica de turnos deve permanecer separada da tela para ser testável sem
renderizar o app inteiro.

A feature fica atrás de `VITE_FEATURE_DISPUTA_LOCAL` até passar pelo fluxo de
ponta a ponta num aparelho real.

---

## 11. Feature flags

`src/shared/flags.ts` é a fonte única de flags de produto no frontend.

Regra:

> ausente = desligada.

Isso é deliberado. Um ambiente sem configuração extra precisa publicar o corte
mais conservador, não desbloquear feature velha por acidente.

Áreas como feed, ranking, perfil, XP, login social, ligas, assinatura e push
podem existir em código sem fazer parte do MVP1.

Flag não transforma feature quebrada em roadmap pronto. Ela só impede exposição.

---

## 12. Storage de áudio

O Storage entra quando um fluxo precisa que outro aparelho consiga acessar o
áudio ou que o resultado seja persistido.

O princípio é:

- não subir áudio sem necessidade funcional;
- não tornar bucket público por conveniência;
- usar controle de acesso compatível com o fluxo;
- separar "precisa ficar disponível durante a batalha" de "pode ser guardado
  indefinidamente".

A política de retenção está **decidida** e registrada em
[`../jogo/REGRAS.md`](../jogo/REGRAS.md) §8: passados os 7 dias, o acesso pelo
link é bloqueado e o arquivo é mantido, sem expurgo automático. Tecnicamente
isso significa que a expiração vive nas RPCs (`obter_batalha`,
`responder_batalha`) e **não** no Storage — não existe rotina que apague objeto
do bucket, e a limpeza oportunista de batalhas mortas remove a linha, não o
arquivo.

---

## 13. Banco de dados

A fonte de verdade do schema versionado é:

```text
supabase/migrations/
```

Documentos de schema servem para explicar domínio e convenções. Eles não
substituem as migrações.

Antes de criar tabela, coluna, policy ou RPC, leia
[`../schema/nomenclatura.md`](../schema/nomenclatura.md).

---

## 14. Segurança

Princípios obrigatórios:

- RLS em dados expostos ao cliente;
- server-side para decisões competitivas que não podem confiar no browser;
- IDs/códigos imprevisíveis;
- validação de tamanho e formato de upload;
- nenhuma feature pode fingir autorização por esconder botão;
- erro precisa ser explícito;
- dados falsos nunca aparecem como se fossem produção.

Segurança prevalece sobre o tom do produto. Uma mensagem pode dizer "deu ruim";
a policy não pode ser engraçadinha.

---

## 15. PWA e desktop

### Mobile

É onde a brincadeira acontece.

A prioridade é:

- abrir rápido;
- pedir microfone no momento certo;
- gravar;
- julgar;
- compartilhar/desafiar.

### Desktop

Desktop e webapp mobile são superfícies do produto. A home publicada tem layout
social de desktop; a Arena e qualquer caminho sensível continuam exigindo prova
no navegador-alvo antes de serem chamados de validados.

---

## 16. Observabilidade

Telemetria deve responder perguntas de produto sem coletar áudio por padrão.

Eventos úteis:

- abriu;
- iniciou gravação;
- concluiu gravação;
- recebeu score;
- compartilhou;
- criou batalha;
- abriu batalha;
- respondeu batalha;
- iniciou/concluiu disputa local.

Métrica não precisa virar infraestrutura de Big Data antes de existir tráfego.

---

## 17. O que permanece FORA de escopo no produto

No Auê 3.0, o Bonde do Arroto (feed), as comunidades temáticas, a Arena e o X1 estão **ativos no escopo oficial**.

Permanecem rigorosamente **fora do produto** nesta fase (ver [`../escopo/ESCOPO_ATUAL.md`](../escopo/ESCOPO_ATUAL.md)):

- algoritmos opacos de recomendação viciante;
- seguidores obrigatórios para navegar;
- campeonatos e ligas formais de e-sports;
- temporadas com expiração de progresso;
- paywalls, assinaturas ou monetização predatória;
- XP, barras de nível e conquistas genéricas de gamificação;
- mensagens privadas fechadas (chat 1:1);
- login social obrigatório apenas para arrotar ou olhar o feed;
- empacotamento em lojas nativas (Google Play / App Store) — o Auê é exclusivamente online via desktop e webapp mobile.

---

## 18. Definition of Done técnico

Uma fatia só está pronta quando:

- funciona no navegador real alvo;
- falhas têm estado de erro verdadeiro;
- recurso sensível é liberado corretamente;
- persistência não duplica efeito;
- regra server-side não pode ser burlada pelo caminho óbvio;
- typecheck, lint, testes e build passam;
- configuração de produção necessária está documentada;
- nenhuma tela afirma que algo aconteceu se o backend não confirmou.

No Auê, "parece que funcionou" não é arquitetura. É bug esperando churrasco.
