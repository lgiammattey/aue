# Cartão de Missão 3: Arena em inglês

> Rascunho do enquadramento, saído da exploração com o Luiz em 24/11/2026. Ainda não aprovado pelo Tiago. Nenhum código foi alterado. É a missão 3 da sequência do [cartão da Fase 1](cartao-de-missao.md) e destrava a [missão 4, conteúdo de busca em português e inglês](missao-4-conteudo-de-busca.md).

## 0. Contexto e decisão

O plano era deixar a Arena desligada no site em inglês. O Luiz decidiu traduzir a Arena, porque o visitante que chega pelo Google em inglês precisa de um destino que fale a língua dele. Sem isso, todo o funil em inglês quebra no último passo.

A tradução é viável, mas não é trivial:

- O projeto não tem camada de idioma. Só a faixa +18 já troca de idioma pela rota (`/en`).
- As telas da Arena e do duelo (`src/arena/v2/`, cerca de 3 mil linhas) têm da ordem de 400 textos em português soltos no código, fora o texto do laudo, as mensagens de erro e o pedido de microfone. O número real do loop v2 é menor: cerca de 60 textos em `ArenaV2.tsx`.
- A voz do Auê (`VOZ.md`) é brasileira e de rua. A versão em inglês não pode ser tradução literal, precisa ser escrita.

Por isso a missão corta o escopo: **o loop mínimo primeiro** (gravar, nota, compartilhar o áudio, tentar de novo), e o resto em entregas seguintes.

> **Achado da implementação (24/11/2026):** o loop da Arena v2 de hoje é gravar, receber o laudo com a nota, ouvir, compartilhar ou baixar o áudio, e descartar para tentar de novo. O cartão 9:12 com a nota (`CartaoDaImagem`) é da Arena antiga e não está no loop v2. Por isso o loop mínimo desta missão não inclui cartão. Ligar o cartão ao resultado da v2 é outra decisão e fica fora daqui. Também não há "fala do juiz por faixa" no loop v2: ela é da Arena antiga.

## 1. Pré-requisitos

1. Missão 1 mesclada e `arrotaaue.com.br` no ar (PR #376).
2. Missão 2 concluída: o fluxo gravar, nota e cartão provado em celular real, em português. Traduzir um fluxo não provado multiplica o problema por dois.
3. Decisão do Luiz sobre a voz em inglês (seção 8).

## 2. Enquadramento (Tiago)

- **Dor / Problema da pessoa:** quem fala inglês e chega ao Auê não consegue jogar. A página `/en` existe, mas a Arena que ela linka está em português.
- **Comportamento esperado na tela:** a pessoa abre `/en`, vê a Arena em inglês, grava, recebe o laudo com a nota em inglês, ouve, compartilha ou baixa o áudio e pode tentar de novo. O idioma segue a rota. A pessoa em português não vê mudança nenhuma.
- **Fora de escopo (Não vira):**
  - desafio X1 em inglês (entrega seguinte, ver seção 3);
  - mural, grupos de WhatsApp, perfil, login e ranking em inglês;
  - tradução de privacidade e termos (missão própria, com revisão);
  - troca de idioma automática por navegador ou por IP;
  - mudança de tema, paleta, tipografia ou layout.
- **Pista (Lane):** Full flow comum. Sobe para sistêmica se a camada de idioma tocar contrato compartilhado, o que não se espera.
- **Por que esta pista:** mexe em telas e textos existentes, sem alterar o motor de nota nem o banco. A régua `experimental-2` não muda.
- **Fonte de verdade afetada:** `AUE.md`, `VOZ.md` (versão em inglês), `ARENA.md` (estados não mudam), `PRODUCAO_ATUAL.md`, `MAPA_DE_PAGINAS_E_FLUXOS.md`.

## 3. Entregas dentro da missão (uma por vez)

| Entrega | O que traduz | Observação |
|---|---|---|
| 3a | Camada mínima de idioma, restrita à Arena v2 e ao laudo, com idioma pela rota | Dicionário tipado, sem biblioteca nova se der. Nada de abstração para além do que a Arena usa |
| 3b | Loop completo em `/en`: Arena, laudo, erros, microfone negado, compartilhar e baixar o áudio | É o critério da missão |
| 3c | Duelo X1 em inglês e convite compartilhável | Só depois de 3b provado. O link do convite precisa carregar o idioma |
| 3d | Navegação em inglês: esconder ou marcar o que não existe em inglês (mural, grupos) | Decisão do Luiz na seção 8 |

Onde a Arena em inglês mora também é decisão de desenho: `/en` espelhando a home em português (Arena em cima e guia embaixo) é a proposta, porque mantém o par `hreflang` entre `/` e `/en`. O Diego especifica e o Luiz aprova antes do código.

## 4. Regras desta missão

- **A régua não muda.** A nota continua experimental, em dBFS relativo, sem prometer decibéis, sem provar que o som é um arroto. O texto em inglês diz isso na mesma medida que o português ("experimental", nunca "meter", "decibels" ou "scientific").
- **Voz em inglês:** informal e direta, de gente que joga e conversa com amigo, sem sotaque forçado, sem emoji, sem tom corporativo. Escrita para o público de língua inglesa e não traduzida palavra por palavra, como já foi feito na `/en`.
- **Zero travessão** na copy pública, nos dois idiomas.
- **O idioma segue a rota.** Português continua em `/`. Inglês em `/en`. A pessoa em português não pode ver uma palavra em inglês por engano, e o contrário também.
- **Texto de compartilhar e de baixar** sai no idioma da rota onde a gravação foi feita.
- **Faixa +18** já fala o idioma da rota e continua.
- **Sem texto misto:** onde faltar tradução, o teste reprova a build em vez de cair em português calado.

## 5. Donos e fronteiras

- **Orquestração, mesa limpa e aceite final:** Tiago
- **Responsável pela implementação:** Diego (telas, textos, cartão) com o Camillo na camada de idioma e na fronteira com o navegador (`src/plataforma/`)
- **Especificação visual:** Diego
- **Gate Arquitetural (Camillo):** não aplicável, a menos que a camada de idioma peça ADR (§8 do ADR 0001). O Camillo confirma antes de começar.
- **Auditoria e Prova Real:** Camillo audita o que o Diego entregou (testes, estados de erro, paridade de chaves, aparelho real). Diego confere o que o Camillo entregou na parte visível.
- **Decisão pendente do Luiz:** ver seção 8.

## 6. Comportamento, plataformas e risco

- **Plataformas afetadas:** Web Mobile (Safari iOS e Chrome Android), Desktop, documentação.
- **Estados obrigatórios da Arena:** inicial, gravando, analisando áudio, resultado, erro e microfone negado, todos em inglês em `/en` e iguais em português em `/`.
- **Maior risco de quebra ou mentira visual:**
  - texto em português vazando na Arena em inglês (erro, laudo inconclusivo, microfone negado);
  - frase de nota que soa bem em português e vira ofensa ou piada ruim em inglês;
  - texto maior em inglês ou em português estourando botão ou alargando a página no mobile;
  - service worker servindo o `index.html` em português para `/en` (já tratado na `/en` atual, precisa continuar valendo com a Arena).
- **Limite da promessa:** a missão entrega a Arena em inglês, não um produto internacional. Mural, grupos, login e ranking seguem em português.

## 7. Medição

- gravações concluídas e compartilhamentos de áudio em `/en`, separados dos de `/` (o evento leva `idioma: 'en'`);
- taxa de abandono por estado (microfone negado, erro) por idioma;
- comparar com o português para saber se o inglês tem comportamento parecido.

Os eventos de GA4 da Arena v2 já existem. O idioma entra como propriedade do evento, sem dado pessoal.

## 8. Decisões pendentes do Luiz

1. **Voz em inglês:** aprovar um guia curto de voz em inglês, a ser acrescentado à `VOZ.md`, e revisar os textos do laudo e dos erros em inglês. É texto de produto, não técnico.
2. **Onde a Arena em inglês mora:** `/en` espelhando a home (proposta) ou uma rota própria como `/en/arena`.
3. **Duelo X1 em inglês:** entra em 3c depois do loop provado, ou fica para depois da missão 4?
4. **Navegação em inglês:** esconder mural e grupos quando o idioma for inglês, ou mostrar com aviso de que são em português?
5. **Privacidade e termos em inglês:** missão própria depois desta, com revisão?

## 9. Matriz de aceite e evidência (auditor → Tiago)

| Critério observável | Dono da prova | Ambiente exigido | Estado |
|---|---|---|---|
| O loop gravar, nota, cartão e tentar de novo funciona em `/en` do início ao fim | Camillo | Safari iOS e Chrome Android | pendente |
| Todos os estados da Arena aparecem em inglês em `/en`, sem nenhuma palavra em português | Camillo | Código, teste e aparelho | pendente |
| O português em `/` não muda: mesmos textos, capturas de antes e depois idênticas | Camillo | Desktop e Safari iOS | pendente |
| Teste de paridade: toda chave existe nos dois idiomas e a build reprova se faltar | Camillo | Código e teste | pendente |
| Teste barra travessão e as palavras proibidas ("meter", "decibels", "medidor", "decibéis") na copy dos dois idiomas | Camillo | Código e teste | pendente |
| Textos do laudo e dos erros em inglês revisados pelo Luiz | Luiz | Revisão do texto | pendente |
| Compartilhar e baixar o áudio saem em inglês quando a gravação é feita em `/en` | Diego | Aparelho real | pendente |
| `scrollWidth === innerWidth` na Arena em inglês, com os textos mais longos | Diego | Safari iOS e Chrome Android | pendente |
| Microfone negado e erro de gravação em inglês, com o mesmo comportamento do português | Diego | Aparelho real | pendente |
| Faixa +18 e `lang` do documento corretos em `/en` | Diego | Código e página publicada | pendente |
| `typecheck`, `lint`, `test` e `build` verdes | Camillo | Código | pendente |

> Um nível de evidência nunca substitui o seguinte ("compilou" não é "funcionou na tela").

## 10. Encerramento e parecer final

- **Arquivos/módulos alterados:** a preencher.
- **Parecer do auditor:** a preencher.
- **Veredito Final do Tiago:** a preencher.
- **Pendências ou decisão necessária do Luiz:** ver seção 8.
