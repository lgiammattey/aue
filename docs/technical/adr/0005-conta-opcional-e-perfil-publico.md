# ADR 0005 — Conta opcional e perfil público

**Status:** aceito
**Data:** 2026-10-18
**Decidiu:** Luiz (dono do produto), com o Giam
**Substitui:** nada
**Altera:** o [ADR 0001](0001-arquitetura-oficial-do-aue.md) §8 item 12, e só
para o caso descrito aqui
**Vale para:** identidade, perfil e comentário

---

## O problema

A identidade do Auê era só a sessão anônima. Isso bastou para jogar, mas o Bonde
(ADR 0004) precisa de gente com nome, de perfil que outras pessoas abram, de
seguir e de recuperar o que foi feito quando o navegador muda. Sem conta, quem
limpa o armazenamento perde os causos e a chance de apagar o próprio áudio.

## A decisão em uma frase

**A conta com e-mail e senha é opcional e PROMOVE a sessão anônima que já
existe, sem criar segunda identidade; o perfil público tem `@` único e só mostra
o que a pessoa publicou.**

## O que fica decidido

1. **Jogar continua sem conta.** O boot cria a sessão anônima como antes. Nada
   pede cadastro para arrotar, receber nota ou desafiar.
2. **Cadastro promove, não duplica.** Com sessão anônima, o cadastro é
   `updateUser({ email, password })`: o `uid` não muda e o histórico fica. `signUp`
   só roda quando não há sessão nenhuma. Senha mínima de 8 caracteres.
3. **Recuperação por e-mail.** "Esqueci minha senha" manda o link e responde igual
   exista a conta ou não. O link abre `/redefinir-senha`.
4. **Login social segue atrás de `VITE_FEATURE_LOGIN_SOCIAL`** (desligada).
5. **Perfil público** (`/u/:handle`, `/perfil`): apelido, `@` único
   (`^[a-z0-9_]{3,20}$`, com lista de reservados), bio de até 160 caracteres,
   cidade, título, seguidores e seguindo. A "melhor nota" mostrada é só a de causo
   **publicado**: jogo privado não vira vitrine.
6. **O e-mail nunca é público** e não é usado para propaganda.
7. **Seguir existe** (`alternar_seguir`). Mensagem privada, algoritmo de
   recomendação e seguidor obrigatório continuam fora (ESCOPO_ATUAL §3).
8. **Comentário em níveis:** `resposta_a_id` e `nivel` de 0 a 2. Responder o nível 2
   fica no nível 2, apontando para o comentário respondido.
9. **Exclusão da conta é por pedido** pelo contato da política de privacidade. Não
   existe botão ainda, e nenhuma tela sugere que exista.

## O que não muda

A nota oficial continua sendo do servidor (ADR 0001 §8 item 8). A fronteira do §2
continua: a tela fala com `portas/conta.ts` e `portas/perfil.ts`; só
`plataforma/web/` conhece o Supabase. O áudio não vira público sem o aceite da
pessoa na hora de publicar.

## Consequências

- `perfis` ganha `handle` e `cidade`; migração `20261018000004`.
- O que a conta guarda, o que é público e como apagar estão na política de
  privacidade e nos termos, publicados junto.
- Quem já tem causos pela sessão anônima não perde nada ao criar conta.
