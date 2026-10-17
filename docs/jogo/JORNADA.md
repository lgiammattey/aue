# Bonde do Arroto · Jornada do Jogador

> **Fluxo de referência canônico para produto, design e engenharia.**  
> Cada caixa representa uma tela ou estado; as ramificações mostram as decisões do usuário.  
> O loop de revanche nunca termina em "pronto".

Fonte visual viva: [`docs/design/prototipo/Jornada.dc.html`](../design/prototipo/Jornada.dc.html)

---

## O Loop Contínuo

```text
DESCOBERTA → BONDE (FEED) → ARENA → RESILIÊNCIA → DEPOIS DA NOTA → X1 (DUELO)
    ▲                                                                   │
    └────────────────────── REVANCHE (LOOP INFINITO) ───────────────────┘
```

---

## Fase 1: Descoberta
**Objetivo:** Chegar e entender o jogo em segundos.

1. **Landing Desktop (`Landing.dc.html`):**
   - Headline: *"Tá rolando agora / Entra no bonde hoje"*.
   - Explica o jogo em segundos e manda para o celular ou webapp. Nunca tenta ser a Arena no desktop de forma capenga.
   - Opções de login social (Google, Apple) e criação de conta.
   - Botão direto: *"Arrotar sem conta"* (vai direto para `Arena.dc.html`).
2. **Decisão de Dispositivo:**
   - Celular segue direto na experiência otimizada de Webapp.
   - Desktop consome o produto em layout de 3 colunas completas ou direciona via QR / link para o celular.
3. **Login / Cadastro (`Login.dc.html`):**
   - Entrar ou criar conta sem burocracia ou questionários longos.
   - Campos: Apelido (`@voce_arrota`), E-mail e Senha.
   - Suporte a Convidado: *"Não quer conta agora? Arrota como convidado. Pra postar no feed e salvar placar, precisa de conta."*

---

## Fase 2: Bonde (Feed & Comunidades)
**Objetivo:** Ver o que está rolando na comunidade e escolher a próxima ação.

1. **Feed Central (`Bonde do Arroto.dc.html`):**
   - Posts de texto (causos engraçados de arroto) e posts com áudio e nota anexada.
   - Abas de filtro: **Todos** e **Seguindo**.
   - Composer rápido: *"O que tá rolando no bonde?"*, com botões para Arrotar, Desafiar ou Postar.
   - Ações em cada post: Responder (threads), Repostar, Curtir (coração com preenchimento), Desafiar autor e Compartilhar.
2. **Decisão de Ação:**
   - Postar causo de arroto no feed;
   - Explorar comunidades temáticas;
   - Visualizar e aceitar desafios X1;
   - Acessar o perfil com histórico;
   - Ir diretamente para a **Arena** arrotar.
3. **Comunidades (`Comunidades.dc.html`):**
   - Praça central: **Bonde do Arroto** (comunidade oficial com mais de 48k membros).
   - Categorias: Cerveja Gelada, Refri & Cia, Histórias de Arroto, etc.
   - Ações: Entrar / Sair com 1 clique, feeds dedicados por comunidade, regras e moderação visíveis.
4. **Perfil do Jogador:**
   - Melhores marcas históricas (maior Auê Score).
   - Cartel de X1 (ex: *7V · 3D no X1*).
   - Comunidades participantes.
   - Upload de foto de perfil e capa diretamente no navegador.

---

## Fase 3: Arena de Arroto
**Objetivo:** Arrotar e receber a nota. O núcleo acústico do jogo.

1. **Estado `IDLE`:**
   - Bolha Auê em repouso com pulso calmo.
   - Título: *"Bora?"* / Subtítulo: *"Solta o primeiro e vê quanto dá."*
   - Uma única ação dominante: botão / gatilho de microfone *"Arrotar"*.
2. **Estado `RECORDING`:**
   - Bolha viva e pulsante, áudio-reativa aos decibéis reais do jogador.
   - Cronômetro ativo com limite máximo de 9 segundos.
   - Botão de contorno: *"Parar"*.
3. **Estado `VALIDATING`:**
   - Conferência rápida com inteligência (YAMNet) se o áudio capturado foi realmente um arroto humano ou apenas conversa/ruído de fundo.
   - Feedback: *"Conferindo..."*.
4. **Estado `JUDGING`:**
   - A espera é o suspense e parte da piada.
   - Frase típica do juiz em `Anton`: *"Tô julgando essa porra."*.
5. **Estado `RESULT_REVEAL`:**
   - Impacto visual: revelação do **Auê Score** (0 a 100) com overshoot de animação.
   - Fala do juiz proporcional à nota:
     - `>= 85`: *"Tá maluco."*
     - `60 a 84`: *"Caralho, veio forte."*
     - `< 60`: *"Foi isso?"*
6. **Estado `RESULT`:**
   - Auê Score cravado na tela.
   - Player de áudio com waveform do arroto para escutar o próprio feito.
   - Três métricas avaliadas: **Força**, **Fôlego** e **Grave**.
   - Pílula de escolha de origem do arroto (Cerveja, Refri, Almoço, etc.).

---

## Fase 4: Resiliência
**Objetivo:** Falar a verdade primeiro quando algo falhar, sem inventar sucesso falso e sem culpar a pessoa.

1. **`MIC_ERROR`:**
   - Microfone bloqueado ou sem permissão.
   - Explicação transparente e amigável de como liberar permissão no navegador ou sistema, com botão de tentar novamente.
2. **`NO_SOUND`:**
   - Nenhum som detectado pelo microfone.
   - Mensagem: *"Não ouvi nada"*, convidando a tentar de novo sem penalizar a nota nem gerar frustração.
3. **Falha no Envio / Rede:**
   - Mensagem direta: *"Deu ruim no envio. Desafio não criado. Tenta de novo."*.
   - Zero simulação de sucesso quando a rede falha.

---

## Fase 5: Depois da Nota
**Objetivo:** Transformar o resultado em causo social, duelo ou nova tentativa.

1. **Decisão:**
   - Postar no Bonde;
   - Chamar alguém pro X1;
   - Compartilhar card;
   - Arrotar de novo (*"Mandar outro"*).
2. **Postar no Bonde:**
   - Escolhe a comunidade alvo.
   - A nota e a gravação de áudio acompanham automaticamente o causo.
   - Cai direto no feed de causos do Auê!.
3. **Compartilhar Card (PNG 9:12):**
   - Geração de cartão vertical padronizado: marca `AUÊ!`, nota gigante, fala do juiz e link `aue.app/x1/[code]`.
   - Compatível com WhatsApp, Instagram Stories e downloads de imagem.

---

## Fase 6: X1 (Duelo de Arrotadores)
**Objetivo:** Duelo 1 contra 1 por link na internet ou presencial.

1. **`CHALLENGE_CREATED`:**
   - Link único do X1 gerado (ex: `aue.gg/x1/9f2a`).
   - Botão de copiar link e botão principal: *"Mandar pro infeliz"*.
2. **`WAITING_OPPONENT`:**
   - Sala de espera: cronômetro e aviso de espera pelo oponente arrotar e responder.
3. **`SCOREBOARD`:**
   - Placar versus lado a lado: jogador vs oponente.
   - Mostra o nome, a nota de cada um e player para ouvir os dois arrotos.
4. **Decisão de Resultado (Vitória, Derrota ou Empate):**
   - **Vitória:** Destaque com cor `--gold` / `--accent`.
   - **Empate (`DRAW`):** Frase de impacto *"Ninguém ganhou."* em `Anton`.
   - **Derrota:** **Nunca usa vermelho** para a pontuação ou card do perdedor; preserva dignidade em tom neutro `--muted`. Vermelho é exclusivo de erro técnico.
5. **`REMATCH` (Loop Infinito da Revanche):**
   - Botão *"Revanche"* aciona uma contagem regressiva visceral `3, 2, 1`.
   - Volta imediatamente para a Arena `IDLE` / gravação com o mesmo oponente, reiniciando o ciclo de rivalidade.
