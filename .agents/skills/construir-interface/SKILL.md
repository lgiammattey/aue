---
name: construir-interface
description: Diretrizes do Kayky para construir a interface do Auê em React 19 com fidelidade ao Open Design.
---

# Skill: construir-interface

Para comunidade, feed, perfil e acesso, construa contra
[`DESIGN_OPEN.md`](../../../docs/design/design-system/system/DESIGN_OPEN.md) e
[`Aue Open Design.md`](../../../docs/design/prototipo/Aue%20Open%20Design.md).

## Regras de construção

1. Use tokens nomeados: `--bg`, `--surface`, `--surface-2`, `--line`, `--text`,
   `--muted`, `--subtle`, `--purple`, `--coral`, `--lime` e `--radius`.
2. A casca é escura: desktop 250px / miolo / 292px; até 1100px sem lateral
   direita; até 760px uma coluna com navegação inferior e safe area.
3. Cards funcionais: 12px, superfície grafite e linha de 1px. Capas podem usar
   o gradiente do protótipo. Blur e sombra só em modal.
4. Todo controle visível precisa de comportamento real, estar desabilitado ou
   não existir. Dados demonstrativos nunca entram no componente.
5. APIs do navegador e Supabase continuam só em `src/plataforma/`; tela fala por
   porta tipada.
6. Arena conserva as diretrizes próprias até uma revisão explícita.
