---
name: design-ux
description: Procedimento do Rian para desenhar a UX do Auê!, Bonde do Arroto e Arena em 6 fases de jornada para desktop e webapp.
---

# Skill: design-ux

Procedimento do **Rian** para desenhar a experiência do usuário do Auê! baseada nas **6 fases canônicas da Jornada** (`Jornada.dc.html`), integrando o Bonde do Arroto (feed social estilo Twitter/X), comunidades e a Arena de arrotos.

---

## 1. As 6 Fases da Jornada do Jogador

A experiência do Auê não é um conjunto de telas estáticas nem um emaranhado de rotas — é um fluxo guiado por decisões do usuário:

### Fase 1: Descoberta
- **Landing Desktop (`Landing.dc.html`):** Recepção imediata com o gancho *"Tá rolando agora / Entra no bonde hoje"*. Explica o jogo em segundos e direciona para o celular ou webapp. Oferece botão direto *"Arrotar sem conta"*.
- **Decisão:** Desktop direciona para leitura e QR/acesso mobile; Celular segue direto na webapp.
- **Login Rápido (`Login.dc.html`):** Autenticação em 1 clique (Google, Apple) ou criação simples (Apelido, E-mail, Senha). Modo convidado para testar sem cadastro.

### Fase 2: Bonde (Feed & Comunidades)
- **Feed Social (`Bonde do Arroto.dc.html`):** Posts curtos de texto e áudio com a nota do arroto. Abas de filtro: **Todos** e **Seguindo**. Composer rápido para postar ou desafiar.
- **Decisão:** Escolha clara entre postar causo, navegar em comunidades, duelar no X1, inspecionar perfil ou entrar na Arena.
- **Comunidades (`Comunidades.dc.html`):** Praça central **Bonde do Arroto** (oficial, 48k membros) e nichos temáticos (Cerveja Gelada, Refri & Cia, Histórias de Arroto). Entrar/sair com 1 toque.
- **Perfil:** Apelido, biografia, melhor nota histórica, cartel no X1 (ex: *7V · 3D*) e causos postados.

### Fase 3: Arena de Arroto
- **IDLE:** Bolha calada esperando iniciativa. Título: *"Bora?"*.
- **RECORDING:** Bolha viva, dirigida por áudio real capturado no microfone, cronômetro até 9s.
- **VALIDATING:** Checagem acústica se houve arroto de fato.
- **JUDGING:** Juiz avaliando (*"Tô julgando essa porra."*). A espera é a piada.
- **RESULT_REVEAL & RESULT:** Revelação brutal do Auê Score (0 a 100), fala contextual do juiz e métricas (Força, Fôlego, Grave).

### Fase 4: Resiliência
- **MIC_ERROR:** Microfone bloqueado. Explicar como liberar no navegador sem jargão e permitir nova tentativa.
- **NO_SOUND:** *"Não ouvi nada"*. Incentivo a arrotar com gosto sem punir a pontuação.
- **Falha no Envio:** Comunicação franca sobre instabilidade de conexão. Zero fingimento de envio.

### Fase 5: Depois da Nota
- **Decisão:** Postar no Bonde, Chamar pro X1, Compartilhar card ou arrotar de novo.
- **Postar no Bonde:** Vincula comunidade alvo, anexa áudio e nota automaticamente.
- **Compartilhar Card (9:12):** Gera imagem vertical pronta para WhatsApp e Stories com nota em destaque e link.

### Fase 6: X1 (Duelo)
- **CHALLENGE_CREATED:** Link único gerado para mandar pro adversário (*"Mandar pro infeliz"*).
- **WAITING_OPPONENT:** Espera ansiosa pelo oponente responder.
- **SCOREBOARD:** Placar versus com áudios dos dois oponentes para audição comparativa.
- **Decisão de Resultado:** Vitória, derrota ou empate (`DRAW`). **Nunca usa cor vermelha** para a nota do perdedor.
- **REMATCH (Loop Infinito):** Contagem regressiva 3, 2, 1 da revanche que volta direto para IDLE com o mesmo rival.

---

## 2. Padrões de Layout Responsivo (3 Larguras)

1. **Desktop (>= 1060px):**
   - 3 colunas: Barra de navegação esquerda (275px), Área central com feed ou Arena (600px), Barra lateral de tendências e ranking (320px).
2. **Tablet (700px a 1059px):**
   - Menu esquerdo encolhido em ícones (76px) para privilegiar o conteúdo.
3. **Webapp Mobile (< 700px):**
   - Header minimalista superior (53px).
   - Barra de navegação inferior (56px) para troca entre Início, Comunidades, Desafios e Perfil.
   - Botão flutuante (FAB) verde para nova postagem ou arroto rápido.
   - Respeito à safe area e piso de 44px para qualquer alvo tocável.

---

## 3. As 4 Trava-Regras de UX do Rian

1. **O áudio toca num clique só:** Sem redirects nem telas intermediárias para escutar o causo do colega.
2. **Da abertura ao arroto em menos de 10 segundos:** Zero atrito para quem quer arrotar na hora.
3. **O perdedor nunca é humilhado com vermelho:** Vermelho é erro de sistema; a zoeira de jogo se sustenta na nota e na revanche.
4. **Revanche sem tela de fim:** O resultado do X1 nunca diz "acabou"; diz "vai deixar assim?" e engatilha o próximo arroto.
