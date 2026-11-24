# Cartão de Missão 4: conteúdo de busca em português e inglês

> Rascunho do enquadramento, saído da exploração com o Luiz em 24/11/2026. Ainda não aprovado pelo Tiago. Nenhum código foi alterado. Esta é a missão 4 da sequência do [cartão da Fase 1](cartao-de-missao.md) e depende da [missão 3, Arena em inglês](missao-3-arena-em-ingles.md).

## 0. Contexto e decisões já tomadas

O Luiz quer atrair tráfego do Google com gente curiosa, não com gente que procura uma comunidade. Quem pesquisa "como arrotar", "maior arroto do mundo" ou "campeonato de arroto" quer aprender, ouvir, comparar ou desafiar alguém. O Auê responde a essa curiosidade com a Arena.

Decisões desta conversa:

- **Pergunta da home em português:** "Qual é a potência do seu arroto?" no lugar de "medidor de arroto". A palavra "medidor" fica fora, porque a nota é um laudo experimental e não mede decibéis.
- **Arena traduzida para inglês** na missão 3. Com ela, as páginas em inglês levam a uma Arena em inglês e podem prometer o que ela faz.
- **Todo o restante do conteúdo nasce pronto em português e inglês**, em pares com `hreflang` recíproco.
- Sem artigos genéricos. Cada página entrega uma utilidade e tem uma intenção de busca clara.
- Fora do plano: conteúdo de saúde e problemas digestivos (intenção médica, nenhuma afinidade com a Arena).

## 1. Pré-requisitos

1. Missão 1 mesclada e `arrotaaue.com.br` no ar com HTTPS (PR #376).
2. Search Console cadastrado no domínio novo, com o sitemap reenviado. As impressões levam semanas, então isso não espera o conteúdo.
3. Validação de volume de busca antes de escrever as páginas P0 (seção 6).
4. Missão 2 (prova do fluxo gravar, nota e cartão em celular real) concluída antes de publicar. Tráfego sobre um fluxo não provado queima audiência.
5. **Para publicar as páginas em inglês:** missão 3 (entrega 3b) concluída, porque elas apontam para a Arena em inglês. O texto em inglês pode ser escrito em paralelo, mas não vai ao ar antes.

## 2. Enquadramento (Tiago)

- **Dor / Problema da pessoa:** quem pesquisa sobre arroto no Google não encontra o Auê. As páginas existentes cobrem "como arrotar", "tipos de arroto" e "ranking", mas faltam as páginas que ligam curiosidade a competição, e o site em inglês é uma página só.
- **Comportamento esperado na tela:**
  - **Português:** a pessoa chega por uma busca, lê uma página útil e segue para a Arena com a pergunta "Qual é a potência do seu arroto?".
  - **Inglês:** a mesma jornada, com a pergunta "How powerful is your burp?" e a Arena em inglês.
- **Fora de escopo (Não vira):** a tradução da Arena (é a missão 3), mural, grupos, perfil e login em inglês, XN, vídeo, fórum, mudança de marca, mudança de tema, paleta, tipografia ou layout, tradução de privacidade e termos (missão própria com revisão), conteúdo de saúde.
- **Pista (Lane):** Full flow comum.
- **Por que esta pista:** mexe em páginas públicas, build estático e SEO técnico, sem tocar motor, contrato compartilhado nem migração. Se o Camillo concluir que o gerador de páginas exige ADR (§8 do ADR 0001), a missão sobe para Full flow sistêmica com Gate Arquitetural.
- **Fonte de verdade afetada:** `AUE.md` (posicionamento), `VOZ.md` (copy), `docs/design/MAPA_DE_PAGINAS_E_FLUXOS.md` (rotas novas), `PRODUCAO_ATUAL.md`.

## 3. Páginas do plano

Cada linha é um par com `hreflang` recíproco e um lugar no sitemap.

| Prioridade | Português | Inglês | Intenção | Observação |
|---|---|---|---|---|
| P0 | Home com a pergunta "Qual é a potência do seu arroto?" | Home `/en` com "How powerful is your burp?" | Entrada | Só muda copy, sem redesign |
| P0 | `/como-arrotar` (existe) | `/en/how-to-burp` (novo) | Aprender | Português só recebe ajustes de link e `hreflang` |
| P0 | `/recorde-mundial-de-arroto` (novo) | `/en/loudest-burp` (novo) | Curiosidade | Fatos de terceiros só com fonte conferida |
| P0 | `/campeonato-de-arroto` (novo) | `/en/burp-contest` (novo) | Competição | Como organizar uma disputa entre amigos |
| P1 | `/desafio-de-arroto` (novo) | `/en/burp-challenge` (novo) | Competição | Leva ao X1. Em inglês, só depois da entrega 3c da missão 3 |
| P1 | `/como-arrotar-alto` (novo) | `/en/how-to-burp-louder` (novo) | Aprender | Segurança e limites do corpo, sem promessa médica |
| P1 | `/sons-de-arroto` (novo) | `/en/burp-sounds` (novo) | Entretenimento | Só com áudio que o Auê tem direito de usar (ver §8) |
| P2 | `/tipos-de-arroto` (existe) | `/en/types-of-burps` (novo) | Curiosidade | O `/en` atual já tem parte deste conteúdo |
| P2 | `/arrotar-o-alfabeto` (novo) | `/en/burp-the-alphabet` (novo) | Aprender | |
| P2 | `/ranking-de-arrotos` (existe) | `/en/burp-ranking` (novo) | Competição | O ranking em si segue em português, ver decisão 4 |

A ordem de entrega é por prioridade. Uma página ou um par por vez dentro da missão.

## 4. Regras de copy desta missão

- **Pode falar:** "nota de 0 a 100", "laudo experimental", "arrote e veja a sua nota", "desafie um amigo".
- **Não pode falar:** "medidor", "Burp Meter", "decibéis", "dB", "ranking mundial", "analisador científico", "recorde de terceiros sem fonte conferida", "a maior comunidade". A régua atual é dBFS relativo, não dB SPL, e não prova que o som é um arroto (`docs/jogo/REGRAS.md`).
- **Páginas em inglês:**
  - A promessa é a mesma das páginas em português: "burp, get your score, challenge a friend", sem prometer decibéis nem medir cientificamente. Termos como "burp meter" ficam fora.
  - O título atual do `/en` ("Burping Community: How to Burp & Record Yours") promete comunidade, e comunidade saiu do produto (ADR 0015). Título e descrição passam a falar do guia e da Arena.
  - O botão "Record my burp" passa a levar à Arena em inglês. Enquanto a missão 3 não estiver pronta, as páginas em inglês não vão ao ar com esse botão.
  - Nenhuma página em inglês pode levar a uma tela em português sem aviso.
- **Zero travessão** em toda a copy pública. Voz de gente real, sem tom de blog corporativo (`VOZ.md`).
- **Página de recorde:** conta a história do recorde com a fonte citada e convida a tentar. Nunca diz nem sugere que a nota do Auê equivale ao recorde de terceiros.
- **Imagens:** no estilo atual (cartoon editorial flat sobre o tema escuro), sem rosto reconhecível, versionadas em `public/ilustracoes/`.
- **Sem cardificação** e sem rolagem lateral no mobile.

## 5. Donos e fronteiras

- **Orquestração, mesa limpa e aceite final:** Tiago
- **Responsável pela implementação:**
  - Camillo: gerador de páginas bilíngues, sitemap com `alternates` por par, `hreflang`, JSON-LD (`Article`, `HowTo`, `FAQPage`), rewrites do Firebase, entradas do Vite, testes de SEO.
  - Diego: páginas e copy dentro do molde `MolduraPublica`, ilustrações, home em português, ajuste do `/en`, estado "Arena indisponível em inglês".
- **Especificação visual:** Diego, com a copy aprovada pelo Luiz.
- **Gate Arquitetural (Camillo):** pendente, só se o gerador exigir ADR. Caso contrário, não aplicável.
- **Auditoria e Prova Real:** Diego audita o que o Camillo entregou (HTML, `hreflang`, schema, sitemap). Camillo audita o que o Diego entregou (páginas, mobile, copy proibida).
- **Decisão pendente do Luiz:** ver seção 8.

## 6. Validação antes de escrever (mesa do Luiz)

O volume de busca nunca foi medido. Antes das páginas P0:

1. Google Keyword Planner (exige conta do Google Ads, sem custo de uso) para as palavras do plano, nos mercados Brasil e Estados Unidos.
2. Google Trends, últimos 12 meses, para comparar "como arrotar", "campeonato de arroto", "desafio de arroto" e os termos em inglês.
3. Resultado em uma tabela curta anexada a este cartão. Se uma palavra não tiver volume, a página dela cai de prioridade.

O Auê não vende estimativa como dado: o cenário de aquisição da análise externa é hipótese, não previsão.

## 7. Comportamento, plataformas e risco

- **Plataformas afetadas:** Web Mobile (Safari iOS e Chrome Android), Desktop, documentação.
- **Estados obrigatórios da Arena:** a missão não altera a Arena. Os estados atuais (inicial, gravando, analisando áudio, resultado, erro, microfone negado) precisam continuar iguais.
- **Maior risco de quebra ou mentira visual:**
  - Página em inglês publicada antes de a Arena em inglês estar pronta.
  - Palavra proibida escapando para o título, a descrição ou o JSON-LD (rastreador lê isso mesmo sem JavaScript).
  - `hreflang` sem o par recíproco: o Google ignora os dois lados.
  - Página de recorde com número de terceiros sem fonte.
- **Limite da promessa:** a missão não garante posição no Google nem tráfego. Ela cria as páginas e as medições. A nota continua sendo um laudo experimental em dBFS relativo.

## 8. Decisões pendentes do Luiz

1. **Sons de arroto:** a página só entrega o que a busca pede se tiver áudio. O Auê tem áudio próprio ou com licença para publicar? Sem isso, a página `sons-de-arroto` e `burp-sounds` fica fora desta missão.
2. **Privacidade e termos em inglês:** é texto legal e merece revisão. Entra em missão própria depois desta?
3. **Título e descrição novos do `/en`:** aprovar a troca de "Burping Community: How to Burp & Record Yours" por um texto de guia e Arena.
4. **Ranking em inglês:** a página em inglês mostra um ranking em português (nomes e notas vêm do banco), ou fica fora até existir ranking em inglês?
5. **Quantas páginas por entrega:** o cartão propõe começar pelo P0 e medir antes de seguir para o P1.

## 9. Medição

Janela de 90 dias a partir da publicação do P0, com linha de base antes. Indicadores de comportamento, não de audiência:

- impressões e cliques por página e por país (Search Console);
- visitas às páginas que chegam à Arena (português);
- gravações concluídas e cartões compartilhados vindos dessas páginas (GA4, eventos já existentes);
- nas páginas em inglês, o mesmo, separado por idioma, para comparar com o português.

Se as impressões ficarem perto de zero depois de 90 dias, o aprendizado é que a busca não é o canal, e a missão encerra sem expandir.

## 10. Matriz de aceite e evidência (auditor → Tiago)

| Critério observável | Dono da prova | Ambiente exigido | Estado |
|---|---|---|---|
| Cada página P0 tem título, descrição, H1 e canonical únicos, no domínio novo | Camillo | Código e teste | pendente |
| Cada par tem `hreflang` recíproco (`pt-BR`, `en`, `x-default`) e `alternates` no sitemap | Diego | Código e página publicada | pendente |
| JSON-LD válido (`Article`, `HowTo` ou `FAQPage`) nas páginas P0 | Diego | Teste de resultados avançados do Google | pendente |
| Teste automático barra as palavras proibidas ("medidor", "decibéis", "Burp Meter", "ranking mundial") e o travessão em toda a copy pública | Diego | Código e teste | pendente |
| Toda página em inglês leva à Arena em inglês e nenhuma leva a tela em português sem aviso | Diego | Código, teste e página publicada | pendente |
| Páginas em inglês só vão ao ar depois de a entrega 3b da missão 3 estar aprovada | Tiago | Registro do aceite | pendente |
| Home em português com a nova pergunta, sem mudar tema, tipografia ou layout, com capturas de antes e depois | Camillo | Desktop e Safari iOS | pendente |
| `scrollWidth === innerWidth` em todas as páginas novas | Camillo | Safari iOS e Chrome Android | pendente |
| Recorde de terceiros com fonte citada e conferida pelo auditor | Camillo | Revisão da página | pendente |
| Rewrites do Firebase e entradas do Vite para toda rota nova, sem 404 nem HTML da home servido em URL de conteúdo | Diego | Código e ambiente publicado | pendente |
| Sitemap enviado e aceito no Search Console | Luiz | Search Console | pendente |
| `typecheck`, `lint`, `test` e `build` verdes | Diego | Código | pendente |

> Um nível de evidência nunca substitui o seguinte ("compilou" não é "funcionou na tela").

## 11. Encerramento e parecer final

- **Arquivos/módulos alterados:** a preencher.
- **Parecer do auditor:** a preencher.
- **Veredito Final do Tiago:** a preencher.
- **Pendências ou decisão necessária do Luiz:** ver seção 8.
