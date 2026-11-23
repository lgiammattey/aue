# Auê: a definição

> **Aprovada pelo Luiz em 23/11/2026.** Esta página é a única definição do produto. Onde outro documento a contradisser, vale esta página, e o outro documento deve ser alinhado, arquivado ou apagado.

## O que é

Auê é um jogo web de arrotar. A pessoa grava um arroto, manda o áudio e recebe uma nota do juiz. Em volta do jogo existe um mural onde os arrotos aparecem e as pessoas conversam.

Os dois existem, mas **o jogo manda**: gravar, mandar e receber a nota é o centro. O mural é o que mantém a pessoa por perto depois da nota.

## Para quem

Quem abre o webapp, no celular ou no desktop. Não precisa de conta para jogar.

## O primeiro minuto

A pessoa entra e vê uma coisa: **gravar o arroto e mandar**. Nada de explicar o produto antes. Depois da nota ela escolhe o que fazer: mandar pra um amigo, tentar de novo ou ver o mural.

## O loop

```text
GRAVAR → MANDAR → RECEBER A NOTA → (DESAFIAR NO X1 | TENTAR DE NOVO | IR AO MURAL)
```

## A nota

A nota é o laudo do juiz sobre o áudio enviado. É uma medição **experimental**: ela avalia o som recebido e não prova de onde ele veio. O texto do produto não promete mais do que isso.

## O que está dentro

| Peça | Situação |
|---|---|
| Arena: gravar, mandar, receber a nota | Centro do produto |
| Duelo (X1) privado | Parte do jogo |
| Mural | Fica; pode virar fórum (decisão aberta) |
| Perfil e ranking (Liga) | Ficam |

## O que está fora

- Comunidades temáticas e tópicos: saem do produto. As rotas já redirecionam para `/`.
- Lojas nativas (Google Play e App Store): fora de escopo, o Auê é só web.

## Decisões abertas

1. **O mural vira fórum?** Ainda não decidido. Até decidir, o mural não ganha estrutura nova de fórum.
2. **Comunidade, tópicos e fórum no código** (`src/features/forum`, `comunidade`): só saem depois da decisão acima, e com OK do Luiz.
3. **Liga:** a seção existe na home, mas a liga privada semanal não está comprovada. Confirmar o que ela é de fato antes de prometer.

## O horizonte

Publicar o jogo e o mural (ou fórum) e ver se atrai gente para a plataforma. É um experimento: o que prova sucesso é comportamento, não visita. Medir quem **gravou, recebeu a nota e voltou ou chamou alguém pro X1**.

## O que ainda não foi provado

O fluxo completo de gravar, enviar, receber a nota, publicar e duelar nunca foi conferido ponta a ponta em celular real (ver [`../PRODUCAO_ATUAL.md`](../PRODUCAO_ATUAL.md)). Antes de publicar para atrair usuário, esse caminho precisa de prova.
