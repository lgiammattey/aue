# Cartão de Missão 0007 — Autenticação & Contas (Supabase Auth)

> Obrigatório antes de o Iury abrir execução na oficina. Sem este cartão aprovado pelo Tiago, a conversa continua em **Exploração** (zero alteração de código).

## 1. Enquadramento (Tiago)

- **Dor / Problema da pessoa:** `TelaLogin.tsx` estava com login e cadastro puramente cosméticos (redirecionava de volta com `enter()` sem autenticar ninguém no Supabase Auth e sem persistir a identidade no perfil do usuário). Se o usuário tentasse login com senha errada ou email inexistente, nada acontecia.
- **Comportamento esperado na tela:**
  1. No modo "Entrar", submeter email e senha chama `supabase.auth.signInWithPassword()` de verdade.
  2. No modo "Criar conta", submeter apelido, email e senha chama `supabase.auth.signUp()`, atualiza o perfil com o apelido e autentica a sessão.
  3. Erros reais do Supabase (ex: credenciais inválidas, email já cadastrado, offline) são exibidos honestamente na interface em português.
  4. Botão "Continuar com Google" aciona `signInWithGoogle()` (OAuth).
  5. Modo offline / sem configuração do Supabase realiza fallback gracioso local para testes e desenvolvimento sem travar a navegação.
- **Fora de escopo (Não vira):** Magic link por SMS, captcha corporativo ou 2FA via authenticator app.
- **Pista (Lane):** Full flow sistêmica (Gate Arquitetural de Camillo / Lucas)
- **Por que esta pista:** Mexe com autenticação central, tokens de sessão e persistência no banco Supabase.
- **Fonte de verdade afetada:** `ADR 0001`, `Login.dc.html`

## 2. Donos e Fronteiras (Iury)

- **Braço direito e Aceite Final:** Tiago
- **Orquestração e Mesa Limpa:** Iury
- **Responsável pela implementação:** Lucas (Supabase Auth & Sessão) & Kayky (UI da TelaLogin)
- **Especificação e Auditoria Visual:** Rian
- **Gate Arquitetural (Camillo / Lucas):** Aprovado
- **Auditoria e Prova Real:** Marcelo
- **Decisão pendente do Luiz:** Nenhuma

## 3. Comportamento, Plataformas e Risco

- **Plataformas afetadas:** Web Desktop & Webapp Mobile
- **Estados obrigatórios:** Formulário vazio, Carregando/Enviando, Erro de autenticação, Sucesso e redirecionamento.
- **Maior risco de quebra ou mentira visual:** Dizer que autenticou sem guardar sessão ou travar em loop de requisição.
- **Limite da promessa:** Em ambiente sem conexão com o Supabase, alerta que o servidor não respondeu.

## 4. Matriz de Aceite e Evidência (Marcelo & Rian → Tiago)

| Critério observável | Dono da prova | Ambiente exigido | Estado |
|---|---|---|---|
| Validação de formulário bloqueia dados inválidos antes do envio | Kayky | Código / Vitest | aprovado (`TelaLogin.test.tsx`) |
| Login e Cadastro chamam métodos do Supabase Auth e tratam resposta | Lucas / Kayky | Código / Vitest | aprovado (`signInWithPassword` & `signUp`) |
| Mensagem de erro do servidor ou rede aparece com clareza | Lucas / Kayky | Código / Vitest | aprovado (`E-mail ou senha incorretos`) |
| Suíte de testes (typecheck e vitest) verde sem regressão | Marcelo | CI / Terminal local | aprovado (4/4 testes e tsc limpo) |

## 5. Encerramento e Parecer Final

- **Arquivos/módulos alterados:**
  - `src/features/comunidade/TelaLogin.tsx`: conexão real com `supabase.auth.signInWithPassword`, `signUp`, `updateProfile` e `signInWithGoogle`, além de fallback seguro para ambiente de desenvolvimento e feedback de carregamento.
  - `src/features/comunidade/TelaLogin.test.tsx`: testes unitários cobrindo validação de formulário, modos entrar/criar conta e tratamento de erros do Supabase Auth.
- **Parecer do Marcelo:** SEM ACHADOS MATERIAIS. A autenticação não é mais um mock que redireciona sem validar. Os métodos oficiais do Supabase Auth são acionados, mensagens em português informam o arrotador com precisão e os fluxos são seguros. Vitest e Typecheck limpos.
- **Veredito Final do Tiago:** APROVADO. A porta de entrada do Auê está pronta e conectada à infraestrutura de usuários reais.
- **Pendências ou decisão necessária do Luiz:** nenhuma

