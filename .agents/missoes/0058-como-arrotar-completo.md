# Missão 0058: `/como-arrotar` completo, com várias técnicas

> Aberta a pedido do Luiz em 23/11/2026. **Pista: Exploração.** Zero código até o Luiz fechar as decisões abertas abaixo.

## 1. Enquadramento (Tiago)

- **Dor / Problema da pessoa:** `/como-arrotar` é curta. Quem busca "como arrotar" no Google não encontra um guia que resolva.
- **Decisão do Luiz (23/11/2026):** a **página principal (`/`) mantém só o básico para o SEO**. A página **completa e detalhada, com diversas técnicas, é a `/como-arrotar`**, expandida. Não existe URL nova: a `/como-arrotar` já está no `sitemap.xml`, então o endereço e o histórico dele são aproveitados. A home continua apontando para ela. `/tipos-de-arroto` fica como está.
- **Comportamento esperado na tela:** `/como-arrotar` vira o guia de referência: várias técnicas, cada uma com o que é, como o som se forma, passo a passo, erros comuns e como a Arena enxerga o estilo. Os cinco estilos que a Arena reconhece (O Trovão, O Trator, A Rajada, O Fraseado, O Sopro Oco) entram como parte do guia, não como página separada.
- **Fora de escopo (Não vira):** remover ou redirecionar `/como-arrotar` ou `/tipos-de-arroto`; criar URL nova; mexer em Arena, nota ou pontuação; prometer que a Arena mede a técnica (ela não mede, ver `REGRAS.md`); versão em inglês nesta missão.
- **Pista (Lane):** Exploração agora. Depois, Full flow comum (conteúdo e estrutura de uma página existente, sem contrato nem banco).
- **Por que esta pista:** é conteúdo dentro do padrão informativo existente. A página estática (`paginas/como-arrotar.html`) precisa ficar igual ao conteúdo renderizado, então o Rodrigo entra.
- **Fonte de verdade afetada:** `MAPA_DE_PAGINAS_E_FLUXOS.md` (descrição da rota), `VOZ.md` (copy), `lastmod` no `sitemap.xml`.

## 2. Donos e Fronteiras (Iury)

- **Braço direito e Aceite Final:** Tiago
- **Orquestração e Mesa Limpa:** Iury (uma entrega por vez; entra depois da missão 0057 fechar)
- **Responsável pela implementação:** Kayky
- **Especificação e Auditoria Visual:** Rian (estrutura do guia, hierarquia, ilustrações)
- **SEO:** Rodrigo (título, descrição, dados estruturados, página estática igual ao conteúdo, links internos, `lastmod`)
- **Gate Arquitetural (Camillo / Lucas):** não aplicável
- **Auditoria e Prova Real:** Marcelo
- **Decisão pendente do Luiz:** ver §3

## 3. Decisões

**Fechadas pelo Luiz (23/11/2026):**
1. A home mantém só o básico para o SEO.
2. O guia completo é a `/como-arrotar`, com várias técnicas. Sem URL nova, sem página por tipo.

**Abertas:**
3. **Quais técnicas entram.** O Tiago propõe partir das duas formas que a `/tipos-de-arroto` já descreve (ar engolido e fermentação) e dos cinco estilos da Arena. O Luiz diz se quer outras técnicas conhecidas (por exemplo ar inalado, ar com a língua, com bebida gaseificada) e quais ficam de fora.
4. **Conteúdo de saúde.** O passo a passo mexe com engolir ar e forçar o corpo. O guia precisa de um aviso curto e honesto (parar se doer, não forçar, não é orientação médica). O Luiz confirma o tom, sem virar texto jurídico.
5. **Ilustrações.** `public/ilustracoes/` tem três imagens do `/como-arrotar`. Mais técnicas pedem imagens novas no mesmo estilo (cartoon editorial flat, sem rosto reconhecível). Quem produz? Sem imagem nova, o guia cresce em texto e usa as três existentes.
6. **Quem escreve.** O Tiago e o Rian rascunham pela `VOZ.md` e o Luiz revisa a parte técnica de como cada técnica funciona. Sem travessão na copy.

## 4. Comportamento, Plataformas e Risco

- **Plataformas afetadas:** Web Mobile e Desktop.
- **Maior risco de quebra ou mentira visual:** (1) o guia prometer que a Arena mede a técnica, o que não é verdade; (2) cardificação: o guia segue `DESIGN.md` §4.1, técnicas e passos como seção chapada com filete, e hoje a `/como-arrotar` tem os `.como-arrotar-passo` e `.como-arrotar-card` em caixa, que saem nesta missão; (3) página estática divergir do conteúdo renderizado; (4) conteúdo de saúde irresponsável; (5) a página crescer e alargar a tela no mobile.
- **Limite da promessa:** o guia ensina e descreve. A nota da Arena segue `REGRAS.md`.

## 5. Matriz de Aceite e Evidência (Marcelo & Rian → Tiago)

| Critério observável | Dono da prova | Ambiente exigido | Estado |
|---|---|---|---|
| Decisões abertas do §3 (3 a 6) fechadas pelo Luiz | Tiago | Registro nesta missão | pendente |
| `/como-arrotar` com as técnicas aprovadas, cada uma com passo a passo | Rian | Navegador 390px e 1440px | pendente |
| Home mantém só o básico e aponta para `/como-arrotar`; `/tipos-de-arroto` continua ligada | Rian | Navegador | pendente |
| `paginas/como-arrotar.html` com título, descrição, canonical e dados estruturados iguais ao conteúdo renderizado; `lastmod` atualizado | Rodrigo | Código e `sitemap.xml` | pendente |
| Sem cardificação e sem overflow lateral em 390px | Rian + Marcelo | Navegador | pendente |
| Sem travessão e sem promessa da Arena | Tiago | Leitura do conteúdo | pendente |
| `typecheck`, `lint`, `test`, `build` e contrato visual E2E | Marcelo | CI | pendente |

## 6. Encerramento e Parecer Final

- **Arquivos/módulos alterados:**
- **Parecer do Marcelo:**
- **Veredito Final do Tiago:**
- **Pendências ou decisão necessária do Luiz:** fechar as decisões 3 a 6 do §3.
