# Missão 0058: guia de arroto, passo a passo por tipo

> Aberta a pedido do Luiz em 23/11/2026. **Pista: Exploração.** Zero código até o Luiz fechar as decisões abertas abaixo.

## 1. Enquadramento (Tiago)

- **Dor / Problema da pessoa:** `/como-arrotar` e `/tipos-de-arroto` são curtas. Quem busca "como arrotar" ou "tipos de arroto" no Google não encontra um guia que resolva. O Luiz decidiu **não remover** as duas páginas e **criar uma página especializada**, mais detalhada, pensada para ser indexada, com passo a passo por tipo. A página principal referencia essa página.
- **Comportamento esperado na tela:** um guia com, para cada um dos cinco estilos (O Trovão, O Trator, A Rajada, O Fraseado, O Sopro Oco): o que é, como o som se forma, passo a passo para fazer, erros comuns e como a Arena enxerga o estilo. A home aponta para o guia. As páginas atuais também apontam para ele.
- **Fora de escopo (Não vira):** remover ou redirecionar `/como-arrotar` e `/tipos-de-arroto`; mexer em Arena, nota ou pontuação; prometer que a Arena mede o estilo (ela não mede, ver `REGRAS.md`); versão em inglês nesta missão.
- **Pista (Lane):** Exploração agora. Depois, Full flow comum (página nova e contida, sem contrato nem banco).
- **Por que esta pista:** é conteúdo e rota nova dentro do padrão informativo existente. Mas a rota nova mexe em SEO (sitemap, página estática, `firebase.json`), então o Rodrigo entra.
- **Fonte de verdade afetada:** `MAPA_DE_PAGINAS_E_FLUXOS.md` (rota nova), `VOZ.md` (copy), `sitemap.xml`.

## 2. Donos e Fronteiras (Iury)

- **Braço direito e Aceite Final:** Tiago
- **Orquestração e Mesa Limpa:** Iury (uma entrega por vez; entra depois da missão 0057 fechar)
- **Responsável pela implementação:** Kayky
- **Especificação e Auditoria Visual:** Rian (estrutura do guia, hierarquia, ilustrações)
- **SEO:** Rodrigo (URL, título, descrição, dados estruturados, sitemap, página estática, links internos)
- **Gate Arquitetural (Camillo / Lucas):** não aplicável
- **Auditoria e Prova Real:** Marcelo
- **Decisão pendente do Luiz:** ver §3

## 3. Decisões abertas para o Luiz

1. **Uma página longa ou um conjunto?** Recomendação do Tiago: **começar com uma página só**, com seção e âncora por tipo, e quebrar em uma página por tipo (`/guia-de-arroto/trovao` etc.) só se o Search Console mostrar procura por tipo. Segue o "testa a hipótese antes de construir a igreja". Se o Luiz já quer uma página por tipo desde o início, o custo é maior (cinco páginas estáticas, sitemap, links cruzados), mas o SEO de cauda longa vem mais cedo.
2. **URL.** Sugestão: `/guia-de-arroto`. Alternativa: `/guia-do-arrotador`. Precisa ser uma, definitiva, porque vira endereço indexado.
3. **Conteúdo de saúde.** Passo a passo de arrotar envolve engolir ar e forçar o corpo. O guia precisa de um aviso curto e honesto (parar se doer, não forçar, não é orientação médica). O Luiz confirma o tom, sem virar texto jurídico.
4. **Ilustrações.** `public/ilustracoes/` tem três imagens do `/como-arrotar`. Um guia por tipo pede imagens novas no mesmo estilo (cartoon editorial flat, sem rosto reconhecível). Quem produz? Sem imagem nova, o guia sai só com texto e as três existentes.
5. **Quem escreve o conteúdo base.** O Tiago e o Rian rascunham pela `VOZ.md`, o Luiz revisa a parte técnica de como cada estilo funciona. Sem travessão na copy.

## 4. Comportamento, Plataformas e Risco

- **Plataformas afetadas:** Web Mobile e Desktop.
- **Maior risco de quebra ou mentira visual:** (1) o guia prometer que a Arena mede cada estilo, o que não é verdade; (2) cardificação: o guia segue `DESIGN.md` §4.1, passos e tipos como seção chapada com filete, não grade de cards; (3) página fantasma no sitemap antes de existir publicada; (4) conteúdo de saúde irresponsável.
- **Limite da promessa:** o guia ensina e descreve. A nota da Arena segue `REGRAS.md`.

## 5. Matriz de Aceite e Evidência (Marcelo & Rian → Tiago)

| Critério observável | Dono da prova | Ambiente exigido | Estado |
|---|---|---|---|
| Decisões do §3 fechadas pelo Luiz | Tiago | Registro nesta missão | pendente |
| Guia com os cinco tipos, cada um com passo a passo | Rian | Navegador 390px e 1440px | pendente |
| Home e as duas páginas atuais apontam para o guia | Rian | Navegador | pendente |
| Página estática com título, descrição, canonical e dados estruturados; entrada no sitemap só depois de publicada | Rodrigo | Código e `sitemap.xml` | pendente |
| Sem cardificação e sem overflow lateral em 390px | Rian + Marcelo | Navegador | pendente |
| Sem travessão e sem promessa da Arena | Tiago | Leitura do conteúdo | pendente |
| `typecheck`, `lint`, `test`, `build` e contrato visual E2E | Marcelo | CI | pendente |

## 6. Encerramento e Parecer Final

- **Arquivos/módulos alterados:**
- **Parecer do Marcelo:**
- **Veredito Final do Tiago:**
- **Pendências ou decisão necessária do Luiz:** fechar as cinco decisões do §3.
