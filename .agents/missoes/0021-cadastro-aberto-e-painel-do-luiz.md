# Cartão de Missão 0021 — Cadastro aberto e painel do Luiz

## 1. Enquadramento (Tiago)

- **Dor / Problema da pessoa:** quem quer entrar no Bonde encontra uma porta de convite que não existe; Luiz não enxerga quantas contas chegaram nem se o jogo está rodando.
- **Comportamento esperado na tela:** a pessoa cria a conta com e-mail e senha, escolhe apelido e `@`, conclui a ficha curta antes do Bonde e cai no próprio perfil. O jogo e o X1 continuam abertos para visitante. Luiz entra em `/admin` e vê apenas números reais do cadastro, da ficha e do funil já coletado.
- **Fora de escopo (Não vira):** obrigar conta para Arena/X1, expor e-mail/senha/áudio/identificadores de sessão, liberar telemetria ou segredo de fornecedor para cliente comum, inventar usuários ativos ou enviar relatório periódico por e-mail.
- **Pista (Lane):** Full flow sistêmica.
- **Por que esta pista:** muda identidade, persistência, autorização e uma superfície privada de dados.
- **Fonte de verdade afetada:** `JORNADA.md`, `Login.dc.html`, ADR 0001, ADR 0009 e migrações Supabase.

## 2. Donos e Fronteiras (Iury)

- **Braço direito e Aceite Final:** Tiago
- **Orquestração e Mesa Limpa:** Iury
- **Responsável pela implementação:** Kayky (telas), Lucas (dados e acesso)
- **Especificação e Auditoria Visual:** Rian
- **Gate Arquitetural (Camillo / Lucas):** aprovado — acesso administrativo chega por porta e RPC agregada; autorização nasce no banco.
- **Auditoria e Prova Real:** Marcelo
- **Decisão pendente do Luiz:** nenhuma. Conta administradora: `luizgiammattey@icloud.com`, resolvida no servidor para o usuário autenticado correspondente.

## 3. Comportamento, Plataformas e Risco

- **Plataformas afetadas:** desktop e webapp mobile.
- **Estados obrigatórios:** cadastro válido/inválido, confirmação pendente, perfil pendente, perfil concluído, painel autorizado, acesso negado, sem dados e falha de rede.
- **Maior risco de quebra ou mentira visual:** tratar uma rota escondida como autorização, vazar telemetria/dados pessoais ou prometer confirmação de e-mail que ainda não aconteceu.
- **Limite da promessa:** telemetria de Arena/X1 é anônima, best-effort e por sessão; não mede pessoas únicas nem retenção.
- **Monetização:** receita, impressões e cliques só chegam ao painel por função de servidor autenticada e autorizada; chave da Adsterra fica exclusivamente em segredo do Supabase. Scripts e links de anúncio não entram no login, onboarding, Arena, resultado ou outra ação essencial, e placement que entregue conteúdo enganoso fica desligado.

## 4. Matriz de Aceite e Evidência

| Critério observável | Dono da prova | Ambiente exigido | Estado |
|---|---|---|---|
| A pessoa cria conta e segue para a ficha, sem convite falso | Kayky / Marcelo | código e teste | pendente |
| Visitante continua jogando Arena e X1 sem cadastro | Marcelo | código e teste | pendente |
| `@` e apelido só liberam Bonde após confirmação do servidor | Lucas / Marcelo | SQL e teste | pendente |
| Só Luiz recebe os agregados do painel; usuário comum e anônimo não recebem dado nenhum | Lucas / Marcelo | SQL/RLS e teste | pendente |
| Painel não exibe PII, áudio, IDs ou métricas inventadas | Marcelo | código e teste | pendente |
| Receita e métricas da Adsterra só chegam ao Luiz sem segredo no bundle; falha fica explícita, nunca vira zero | Camillo / Marcelo | função, código e teste | pendente |
| Nenhum placement externo atravessa login, onboarding, Arena, nota ou ação essencial | Rian / Marcelo | código e navegador | pendente |
| Painel e cadastro permanecem usáveis em desktop e webapp mobile | Rian / Marcelo | navegador | pendente |

## 5. Encerramento e Parecer Final

- **Arquivos/módulos alterados:** pendente
- **Parecer do Marcelo:** pendente
- **Veredito Final do Tiago:** pendente
