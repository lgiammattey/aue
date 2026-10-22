# Cartão de Missão — Entrar e criar conta pelo X

## 1. Enquadramento (Tiago)

- **Dor / Problema da pessoa:** quem já usa o X precisa entrar no Auê sem inventar outra senha; quem acabou de arrotar como visitante precisa poder criar uma conta sem perder o que já fez.
- **Comportamento esperado na tela:** com a flag de lançamento ligada, a tela de entrar oferece `Entrar com X`; a de criar conta oferece `Criar com X`. O retorno volta ao perfil: conta nova completa apelido e `@`; conta existente volta à própria conta.
- **Fora de escopo (Não vira):** TikTok, importação de dados do X, publicar no X, sincronizar seguidores, ou ligar o botão sem a configuração real do provedor.
- **Pista (Lane):** Full flow sistêmica.
- **Por que esta pista:** muda a promoção da identidade anônima e toca num contrato persistente de conta.
- **Fonte de verdade afetada:** `docs/technical/adr/0001-arquitetura-oficial-do-aue.md`, `docs/technical/adr/0005-conta-opcional-e-perfil-publico.md`, `docs/design/MAPA_DE_PAGINAS_E_FLUXOS.md`.

## 2. Donos e Fronteiras (Iury)

- **Braço direito e Aceite Final:** Tiago
- **Orquestração e Mesa Limpa:** Iury
- **Responsável pela implementação:** Lucas (contrato de identidade) e Kayky (tela), integrados neste cartão
- **Especificação e Auditoria Visual:** Rian
- **Gate Arquitetural (Camillo / Lucas):** aprovado: `linkIdentity` preserva o mesmo `uid` no cadastro; `signInWithOAuth` fica só para entrada de uma conta X já existente.
- **Auditoria e Prova Real:** Marcelo
- **Decisão pendente do Luiz:** nenhuma no produto; falta a configuração externa do app X e do provedor no Supabase.

## 3. Comportamento, Plataformas e Risco

- **Plataformas afetadas:** Desktop e Webapp mobile.
- **Maior risco de quebra ou mentira visual:** tratar OAuth como sucesso antes do retorno ou criar um segundo `uid` no cadastro. A tela fica escondida pela flag até X e Supabase estarem configurados.
- **Limite da promessa:** o código não cria credenciais do X. O provedor precisa solicitar e-mail, usar o callback do Supabase e autorizar `https://aue.web.app/perfil?via=x` como retorno do Auê.

## 4. Matriz de Aceite e Evidência (Marcelo & Rian → Tiago)

| Critério observável | Dono da prova | Ambiente exigido | Estado |
|---|---|---|---|
| Entrada existente abre OAuth nativo do X com retorno ao perfil | Lucas | teste unitário | passou |
| Cadastro vincula X via `linkIdentity`, sem trocar o `uid` anônimo | Lucas | teste unitário | passou |
| Botões só aparecem com flag explícita | Kayky | teste/build | passou |
| Retorno real cria ou entra na conta correta e preserva publicações | Marcelo | X + Supabase + navegador | pendente externo |

## 5. Encerramento e Parecer Final

- **Arquivos/módulos alterados:** `portas/conta`, `plataforma/web/conta`, tela canônica de autenticação, testes e documentação de ambiente.
- **Parecer do Marcelo:** adaptação, typecheck, lint e build passaram; `NÃO VALIDADO` até existir um app X configurado.
- **Veredito Final do Tiago:** `NÃO VALIDADO` até o fluxo real de callback ser conferido.
- **Pendências ou decisão necessária do Luiz:** cadastrar o app OAuth no X, preencher Client ID/Secret no Supabase e só então ligar `VITE_FEATURE_LOGIN_SOCIAL=1` no build. Até lá, a tela mostra X e TikTok apenas como `Em breve`, desabilitados.
