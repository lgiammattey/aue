# Cartão de Missão — diretório no padrão público

## 1. Enquadramento (Tiago)

- **Dor / Problema da pessoa:** Comunidades abre o novo fluxo, mas ainda parece um fórum separado do resto do Auê público.
- **Comportamento esperado na tela:** em `/comunidades`, a pessoa vê a marca, a navegação e a paleta das páginas públicas; a lista continua levando para as comunidades de verdade e visitante continua podendo entrar ou criar conta.
- **Fora de escopo (Não vira):** Arena, motor de áudio, contratos do fórum, banco, criação de comunidade e a reconstrução das telas de tópico.
- **Pista (Lane):** Full flow comum.
- **Por que esta pista:** muda a entrada e a casca visual de uma área já funcional, sem mudar contratos.
- **Fonte de verdade afetada:** `docs/design/forum-comunidades.md` (decisão vigente) e `docs/design/prototipo/Comunidades.dc.html`.

## 2. Donos e Fronteiras (Iury)

- **Braço direito e Aceite Final:** Tiago
- **Orquestração e Mesa Limpa:** Iury
- **Responsável pela implementação:** Kayky
- **Especificação e Auditoria Visual:** Rian
- **Gate Arquitetural (Camillo / Lucas):** não aplicável
- **Auditoria e Prova Real:** Marcelo
- **Decisão pendente do Luiz:** nenhuma

## 3. Comportamento, Plataformas e Risco

- **Plataformas afetadas:** web desktop, Safari iOS e Chrome Android.
- **Maior risco de quebra ou mentira visual:** trocar a casca e tirar da pessoa o caminho de entrar, voltar ou abrir uma comunidade.
- **Limite da promessa:** a troca é visual; dados, permissões e interação continuam vindo das portas atuais.

## 4. Matriz de Aceite e Evidência

| Critério observável | Dono da prova | Ambiente exigido | Estado |
|---|---|---|---|
| Diretório usa marca, cores e cabeçalho públicos | Rian | Código e navegador | pendente |
| Visitante abre comunidade e chega em entrar/criar conta | Marcelo | Teste e navegador | pendente |
| Lista e links existentes seguem funcionais | Marcelo | Teste | pendente |
| Sem regressão de build, lint, typecheck e testes | Marcelo | Código | pendente |

## 5. Encerramento e Parecer Final

- **Arquivos/módulos alterados:** `ShellDoForum.tsx`, `TelaDiretorio.tsx`, `forum.css`, protótipo de Comunidades.
- **Parecer do Marcelo:** pendente
- **Veredito Final do Tiago:** NÃO VALIDADO
- **Pendências ou decisão necessária do Luiz:** prova em Safari iOS e Chrome Android reais.
