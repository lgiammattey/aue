---
name: garantir-web
description: Procedimento para garantir funcionamento do Auê! exclusivamente online via Desktop (3 colunas) e Webapp Mobile (PWA).
---

# Skill: garantir-web (Desktop e Webapp)

Procedimento do **Kayky**, **Camillo** e **Marcelo** para o Auê! rodar com fluidez impecável exclusivamente pela web — tanto no **Desktop** quanto no **Webapp Mobile** (iOS Safari e Android Chrome).

> O Auê! vive 100% online no navegador web moderno. Lojas nativas (Google Play / App Store) estão fora de escopo.

---

## 1. No Desktop (Chrome, Firefox, Safari, Edge)

- **Layout de 3 Colunas:** Coluna esquerda 275px fixa, coluna central de 600px com bordas `--border`, coluna direita 320px com ranking e tendências.
- **Teclado & Acessibilidade:** Foco visível com contorno `--accent`, suporte a tecla `Espaço` para arrotar na Arena e `Esc` para fechar modais/sheets.
- **Áudio no Feed:** Reprodução instantânea de causos com player leve, interrompendo qualquer áudio anterior ao iniciar outro.
- **Tema:** Transição suave entre tema escuro (`#0a0a08`) e claro (`#f5f3ea`).

---

## 2. No Webapp Mobile (iOS Safari & Android Chrome)

- **Unidades Dinâmicas:** Uso estrito de `100dvh` / `100svh` para evitar pulos de layout com o recolhimento da barra de navegação do browser móvel.
- **Safe Area Insets:** Respeito absoluto a `--safe-top`, `--safe-bottom`, `--safe-left` e `--safe-right` derivados de `env(safe-area-inset-*)`. O menu inferior (56px) soma o padding inferior.
- **Piso de Alvo Tocável:** Piso de 44px (`--hit-target-min`) para qualquer botão, ícone ou elemento acionável por toque.
- **Desbloqueio de Áudio:** O `AudioContext` só é iniciado após gesto do usuário (`user interaction`).
- **Resiliência de Microfone:**
  - `MIC_ERROR`: Apresentar instrução amigável de como autorizar o microfone no navegador.
  - `NO_SOUND`: Quando o silêncio for detectado pelo algoritmo, convidar a arrotar novamente sem penalizar pontuação.
  - Liberação imediata de `MediaStreamTrack` ao encerrar ou abortar a captura.

---

## 3. Performance & Game Feel

- Respeito à flag `@media (prefers-reduced-motion: reduce)`: desabilitar animações pesadas e transições de overshoot caso o usuário tenha configurado.
- Feedback tátil via Vibration API (`navigator.vibrate`) nos gatilhos de impacto e confirmação quando suportado.
- Zero vazamento de memória com waveforms e timers do cronômetro.
