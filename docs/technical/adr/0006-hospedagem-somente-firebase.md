# ADR 0006 — Hospedagem somente Firebase

**Status:** aceito
**Data:** 2026-10-18
**Decidiu:** Luiz, com o Giam
**Substitui:** a linha "Hospedagem | Vercel" do [ADR 0001](0001-arquitetura-oficial-do-aue.md) §3 e a convivência dos dois endereços descrita em
[`hospedagem-firebase.md`](../hospedagem-firebase.md)
**Vale para:** publicação

---

## A decisão em uma frase

**O Auê é publicado só no Firebase Hosting (`https://aue.web.app`), por
`.github/workflows/publicar-firebase.yml`.**

## Por que

Dois publicadores já serviram dois jogos diferentes no mesmo produto sem erro
nenhum (#137). Flag, variável e rewrite viviam em dois lugares. Um endereço, uma
hospedagem.

## O que muda

- `vercel.json` sai do repositório. `firebase.json` é a única fonte de rewrites e
  é travado por `src/seo-publico.test.ts`.
- Flags de lançamento se ligam no workflow do Firebase, e só lá.
- A prévia dinâmica do link continua como no ADR 0003 §10 (fora do ar).

## O que fica fora do repositório (a fazer no painel da Vercel)

1. Desligar a integração do projeto com o GitHub, para parar de publicar a cada
   push.
2. Colocar um redirecionamento de `aue.vercel.app` para `aue.web.app` e só então
   pausar o projeto. Quem já mandou link `aue.vercel.app/b/CODIGO` no zap não pode
   cair em 404.
