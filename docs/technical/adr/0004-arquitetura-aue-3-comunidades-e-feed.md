# ADR 0004 — Auê 3.0: Arquitetura de Comunidades, Feed de Causos e Jogo

**Status:** aceito
**Data:** 2026-10-17
**Decidiu:** Giam & Camillo (aprovado pelo Luiz)
**Substitui:** nada
**Complementa:** ADR 0001 e ADR 0002
**Vale para:** todo o repositório

---

## O problema

O Auê 2.0 consolidou o jogo em 1 toque na Arena (arrotar, receber nota de 0 a 100 com IA e desafiar no WhatsApp via link efêmero). Essa mecânica é rápida e viciante, mas o arroto solto e isolado esbarra no teto da repetição individual. O que torna a zoeira memorável é o **contexto** — a história e a vergonha por trás do som (*"arrotei na reunião da diretoria"*, *"arrotei no primeiro encontro"*).

O Luiz decidiu a virada para o **Auê 3.0**: unir a força mecânica da Arena à essência comunitária do Orkut (*"Eu arroto, e daí?"*) com a agilidade de consumo de um feed moderno estilo Twitter/Reddit.

Este ADR define como essa comunidade e feed se conectam ao motor do jogo **sem quebrar a fronteira dura do ADR 0001**, sem transformar o jogo num monobloco pesado e garantindo privacidade estrita e moderação de áudio.

---

## A decisão em uma frase

**O Auê 3.0 mantém a Arena como motor de captura e julgamento de 1 toque, expondo os causos e duelos através de portas desacopladas (`src/portas/comunidade.ts` e `src/portas/feed.ts`), consumindo as tabelas já existentes no Supabase com autorização explícita de publicação (opt-in) e moderação ativa.**

---

## 1. As Três Camadas do Auê 3.0

```text
┌────────────────────────────────────────────────────────┐
│  ARENA (UI) & NAVEGAÇÃO                                │  React 19.
│  Arena rápida (1 toque) · Feed de Causos · Comunidades │  Design System unificado.
├────────────────────────────────────────────────────────┤
│  NÚCLEO (Regra Pura)                                   │  TypeScript puro.
│  Motor do score (0-100) · veredito de arroto (YAMNet)  │  Sem DOM, sem React,
│  · validação de texto de causo e regras de duelo       │  sem APIs de navegador.
├────────────────────────────────────────────────────────┤
│  PORTAS                                                │  Só interfaces:
│  Captura · Reprodução · Armazenamento · CicloDeVida    │  src/portas/feed.ts
│  · Feed · Comunidades · Moderação                      │  src/portas/comunidade.ts
├────────────────────────────────────────────────────────┤
│  ADAPTADORES (plataforma/web)                          │  Único lugar que toca
│  Supabase client (posts_comunidade, comentarios,       │  banco, Web Audio
│  reacoes, denuncias) · Web Audio · localStorage        │  e navigator.
└────────────────────────────────────────────────────────┘
```

---

## 2. A Fronteira do Áudio e Consentimento (Regra de Ouro LGPD)

> **"Gravou para jogar NÃO significa autorizou publicar."**

No duelo privado (X1 via WhatsApp), o áudio é temporário (7 dias) e acessível apenas por capability URL imprevisível.

No Auê 3.0, para um arroto aparecer no **Mural de Causos / Comunidade**:
1. **Opt-in Consciente e Ativo:** A tela de resultado da Arena exibe a opção *"Postar causo na Comunidade"*. O jogador precisa escrever a história curta e marcar a confirmação de publicação pública.
2. **Vínculo com Resultado:** O post (`posts_comunidade`) armazena a referência `result_id` para herdar a nota oficial e o áudio validado pelo juiz de IA.
3. **Moderação e Denúncia Imediata:** Todo card do feed possui o botão de denúncia. Ao denunciar, o áudio é marcado na tabela `denuncias` e ocultado da sessão do usuário via RLS e filtros da porta.

---

## 3. Modelo de Dados no Supabase

O banco do Auê já possui as tabelas criadas nas migrações anteriores (`banco-sem-consumidor.md`), que agora passam a ter consumidores oficiais:

- `posts_comunidade`: armazena o causo (`content`), o autor (`user_id`), o vínculo com o arroto (`result_id`), a comunidade/tópico (`topic` / `group_id`) e carimbo de tempo.
- `comentarios`: comentários aninhados em cada post.
- `reacoes`: reações rápidas (fogo, nojo, troféu).
- `denuncias`: gatilho de moderação que oculta áudio e conteúdo denunciado.

As RPCs `criar_post_social`, `alternar_reacao` e `criar_comentario` serão consumidas exclusivamente pelos adaptadores em `src/plataforma/web/feed.ts`.

---

## 4. Identidade Leve (Fricção Zero)

- Para ler o feed e ouvir arrotos: **Zero login** (usuário anônimo público).
- Para postar um causo ou reagir: a sessão anônima do Supabase Auth já existente é utilizada, exigindo apenas a definição de um **Apelido de Guerra** (*Nickname*), sem obrigatoriedade de e-mail ou senha na primeira experiência.

---

## 5. Experiência e UI (Diretrizes da Priscila)

- **Estética:** Dark theme do Auê (`#0a0a08`), toques em verde-limão (`#c6ff00`), tipografia pesada (Anton & Archivo).
- **Feed Moderno:** Cards dinâmicos com player de áudio com formato de onda compacto, nota do juiz em badge destacado, texto do causo e botão de ação rápida: **"DUVIDO"** (que abre a Arena para tentar bater a nota daquele causo no X1).
- **A Comunidade Raiz:** A comunidade padrão de abertura chama-se **"Eu arroto, e daí?"**, inspirada na comunidade lendária do Orkut, com espaço para categorias temáticas adicionais.
