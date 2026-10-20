---
name: "Auê — sistema Open Design"
category: Brands
surface: Comunidade web para arrotadores
status: "Referência visual vigente — Open Design, 19/10/2026"
canonical_refs:
  - "docs/design/prototipo/Aue Open Design.md"
---

# Sistema visual vigente — Open Design

Este documento substitui o `DESIGN.md` v5 para **comunidade, feed, perfil,
autenticação e navegação**. A Arena conserva sua máquina de estados e seus
requisitos de áudio até uma revisão própria.

## Referência navegável

- Fonte: [snapshot Open Design](https://amr-api.open-design.ai/api/v1/public/snapshots/bbj33o1mr8mm6sedlt4rk8bg/files/index.html)
- Snapshot: `bbj33o1mr8mm6sedlt4rk8bg`
- SHA-256 conferido em 19/10/2026: `81039089419f298955ba69a4d0ae9652bdb6b9bdfd6031f0d47ed88330cdd3b5`

O HTML externo demonstra geometria e estados. Ele **não** é contrato de dados:
números, comunidades, perfis, votos, login e publicação exibidos nele podem ser
fictícios. No produto, só aparece o que uma porta e o servidor devolvem.

## Tokens

| Token | Valor | Uso |
|---|---|---|
| `--bg` | `#101114` | fundo contínuo |
| `--surface` | `#191b20` | cards, campos e painéis |
| `--surface-2` | `#23262d` | controles secundários |
| `--line` | `#323640` | divisores e contornos |
| `--text` | `#f5f4ef` | texto principal |
| `--muted` | `#a9adb8` | texto secundário |
| `--subtle` | `#727782` | metadados discretos |
| `--purple` | `#9b6cff` | navegação ativa e ação de comunidade |
| `--purple-soft` | `#352958` | seleção suave |
| `--coral` | `#ff765e` | marca, avatar e voto |
| `--lime` | `#b7e35a` | ação principal e foco |
| `--radius` | `12px` | raio padrão |

Sem alternância claro/escuro para estas superfícies até nova decisão. Fundo,
cards e gradientes de capa seguem o protótipo; sombra fica restrita a modal.

## Casca e responsividade

- Desktop: grade `250px minmax(0, 1fr) 292px`, até 1540px. Laterais sticky.
- Até 1100px: some a lateral direita; a esquerda fica em 220px.
- Até 760px: uma coluna e navegação inferior fixa, com área de respiro e alvo
  mínimo de 44px.
- Navegação ativa usa roxo suave. Criar/publicar usa roxo; ação principal de
  jogo usa lima, sempre com contraste legível.

## Tipografia e componentes

- Interface: `ui-rounded`, Avenir Next, Trebuchet MS e `system-ui`.
- Marca: `auê` em peso 900, detalhe coral/roxo conforme o protótipo.
- Cards usam `12px`, `--surface` e `1px solid --line`.
- Perfil tem capa, avatar, ações, bio, metadados e números do servidor. Sem
  conquistas, ranking ou métricas que o backend não devolve.

## O que não se copia do snapshot

- contagens, votos e comunidades de exemplo;
- publicação, entrar em comunidade, login, convite e editar perfil simulados;
- busca local que filtra elementos já desenhados;
- regras, moderadores, ranking e categorias sem contrato de dados.

Cada tela nova compara o layout aberto com a porta de dados. Se o desenho pede
algo inexistente, mostra ausência honesta ou abre um Cartão novo.
