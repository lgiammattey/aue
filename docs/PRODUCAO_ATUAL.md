# Produção atual — Auê

**Verificado em:** 20/10/2026, 17:40 BRT
**Endereço verificado:** `https://aue.web.app/`

Este é o retrato do que foi observado no site publicado. Ele existe para evitar
que uma decisão aceita, um protótipo ou uma rota presente no código seja chamado
de recurso entregue sem prova no navegador.

## O que está publicado

- a home é a comunidade: navegação por Início, Em alta, Seguindo e Meu perfil;
- há feed central de resenhas, com filtros Quentes, Novos e Top;
- cada item mostra a comunidade de origem, autor e ações de comentário,
  reações, salvar e compartilhar;
- o visitante consegue ler o feed; ações que exigem participação pedem entrada;
- existem posts com áudio e posts com mídia externa, quando o conteúdo tem esse
  tipo de mídia;
- o endereço público de produção é `aue.web.app`, servido pelo Firebase Hosting.

## O que esta conferência não prova

Ela não executou publicação, login, reação, comentário, gravação, microfone,
Arena, desafio X1, permissões nem regras do Supabase. Esses comportamentos só
podem ser declarados entregues com evidência própria, sem inventar sucesso.

## Direção já decidida, mas ainda não declarada como entregue

O [ADR 0010](technical/adr/0010-comunidades-topicos-e-respostas.md) aceita a
hierarquia comunidade → tópico → resposta. Ele próprio registra que a migração
e o aceite de implementação ainda precisam de prova. Enquanto isso, o feed
publicado continua sendo a descrição correta da home.

## Uso desta página

Quando houver choque entre uma referência de produto e a produção, trate este
registro como evidência datada da superfície pública e confira o navegador de
novo antes de atualizar o texto. Código, migrações e comportamento publicado
continuam vencendo documentos de intenção.
