# ADR 0009 — Identidade social promovida

**Status:** aceito
**Data:** 2026-10-18
**Decidiu:** Luiz, por meio do Cartão de Missão 0014
**Altera:** ADR 0001 §8 item 12 e ADR 0004 §4
**Vale para:** perfil público, Bonde, comunidades e todas as ações sociais

## Decisão

A sessão anônima continua sendo a identidade técnica da Arena e do X1, mas não
é identidade social. Ela não recebe perfil público, `@`, foto, presença no
feed nem permissão para publicar, seguir, reagir, comentar, denunciar ou entrar
em comunidade.

O cadastro com e-mail e senha promove o mesmo `uid`. Só uma conta promovida
participa da rede social. A promoção preserva resultados e desafios privados;
ela nunca publica retroativamente áudio, nota ou causo.

## Consequências

- O banco, e não a tela, determina quem é participante social.
- As operações sociais passam por RPCs que exigem conta promovida; DML direto
  das tabelas sociais não é contrato de cliente.
- Perfil público e feed nunca devolvem autor anônimo.
- A aba **Seguindo** é derivada de relações de seguir reais; não há filtro
  local que simule esse comportamento.
- Comunidade é vínculo persistido e post novo guarda a comunidade real.
- Curtidos são privados no perfil: somente a própria pessoa pode solicitar a
  lista.

## O que não muda

Ler o Bonde, tocar conteúdo público, gravar, receber nota e disputar X1 continuam
sem cadastro. O opt-in de publicação de áudio permanece obrigatório e separado
da gravação para o jogo.
