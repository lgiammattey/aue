---
name: design-ui
description: Procedimento do Rian para especificar a interface do Auê com fidelidade ao Open Design vigente.
---

# Skill: design-ui

Fonte visual obrigatória para comunidade, feed, perfil e acesso:
[`DESIGN_OPEN.md`](../../../docs/design/design-system/system/DESIGN_OPEN.md) e
[`Aue Open Design.md`](../../../docs/design/prototipo/Aue%20Open%20Design.md).

## 1. Antes de desenhar

1. Abra o snapshot navegável ao lado da tela atual.
2. Liste o que a porta de dados realmente entrega. Número, pessoa, comunidade,
   voto ou ação sem contrato não entra no desenho.
3. Separe visual de comportamento: o snapshot é referência de casca, geometria,
   responsividade e hierarquia; o código e os contratos definem o que acontece.

## 2. Regras visuais

- Fundo `#101114`; superfícies `#191b20` e `#23262d`; divisores `#323640`.
- Roxo `#9b6cff` indica comunidade e ação social; coral `#ff765e` marca avatar,
  voto e detalhe de marca; lima `#b7e35a` é ação principal e foco.
- Interface em `ui-rounded`, Avenir Next, Trebuchet MS e system-ui. Anton,
  Archivo e a linguagem v5 ficam na Arena até nova decisão.
- Cards têm função, raio de 12px e borda de 1px. Gradiente é permitido somente
  em capas previstas no protótipo. Sombra só em modal.
- Desktop usa 250px / miolo fluido / 292px até 1540px. Em até 1100px some a
  lateral direita; em até 760px navegação inferior fixa e alvos de 44px.

## 3. Trava de honestidade

O HTML de referência contém dados e interações demonstrativas. Não copiar:
contagens, votos, comunidades, login, convite, publicação, regras, moderadores,
ranking ou busca local simulada. Antes de desenhar um deles, existe Cartão,
porta e prova real.

## 4. Arena

A Arena preserva `ARENA.md`, os estados e o motor existentes. O novo desenho não
autoriza mudar comportamento, pontuação, áudio ou privacidade dela.
