# Cartão de Missão 0016 — Fundação do fórum de comunidades: banco aditivo de tópicos e respostas

> Direção dada pelo Luiz em 19/10/2026: focar nas issues de comunidade (#251 e filhas). Esta entrega é a primeira camada, a de baixo: o banco. Cartão aberto como proposta; só vira execução quando o Gate Arquitetural abaixo for aprovado.

## 1. Enquadramento (Tiago)

- **Dor / Problema da pessoa:** o Auê vai virar rede de comunidades, e a conversa vai morar dentro de tópicos. Hoje o banco não sabe o que é um tópico. O que existe é um causo solto, e a coluna `topic` guarda o nome da comunidade, não uma discussão. Sem a base certa, a tela nova só mudaria a embalagem do feed, e o acervo que o pessoal já postou (histórias, áudios, notas, comentários) ficaria sem casa.
- **Comportamento esperado na tela:** nenhum, de propósito. Esta entrega não muda nada que a pessoa vê. O feed antigo continua no ar, igualzinho. O que muda é o chão: o banco passa a ter comunidade, tópico e resposta, com a regra de quem pode fazer o quê já travada no servidor. Os causos antigos viram tópicos de verdade, sem perder autor, data, áudio, nota, comentário nem link compartilhado.
- **Fora de escopo (Não vira):** qualquer tela, rota ou porta no frontend; apagar ou renomear coisa do modelo antigo; remover o feed; chat, DM, recomendação, ranking inventado; criar comunidades vazias para encher o diretório; moderação por papéis (#260); busca, paginação de UI e perfil (acabamento).
- **Pista (Lane):** Full flow sistêmica.
- **Por que esta pista:** mexe em schema, RLS, RPCs, migração de dados e contrato compartilhado entre banco e adaptador. Passa pelo Gate Arquitetural de Camillo e Lucas antes de qualquer SQL. Rian não entra: não tem tela nesta PR.
- **Fonte de verdade afetada:** ADR 0010 (proposto), ADR 0004 §1 e §3 (que o 0010 pretende substituir, mas seguem valendo até o aceite), ADR 0001, `ESCOPO_ATUAL.md`, `docs/schema/nomenclatura.md`. Issues de origem: #251 (épico), #254 (entidades e regras), #255 (acervo).

## 2. Donos e Fronteiras (Iury)

- **Braço direito e Aceite Final:** Tiago
- **Orquestração e Mesa Limpa:** Iury. Uma entrega por vez: a segunda PR só abre depois de a primeira estar aplicada e conferida.
- **Responsável pela implementação:** Lucas (migração SQL, RPCs, RLS, backfill, rollback e testes SQL). Kayky só entra na 2ª PR, com novo cartão ou aditivo a este.
- **Especificação e Auditoria Visual:** não aplicável nesta PR (só banco). Rian volta na 2ª PR, junto com o desenho de #253.
- **Gate Arquitetural (Camillo / Lucas):** pendente. Será aprovado pelo parecer dos dois sobre o ADR 0010 e sobre o plano da migração (nomes, chaves, trigger espelho, estratégia de backfill, grants). Sem esse parecer escrito, Lucas não abre branch de SQL.
- **Auditoria e Prova Real:** Marcelo
- **Decisão pendente do Luiz:** o Luiz já deu a direção (focar nas issues de comunidade, 19/10/2026) e a decisão de produto do #251. Isso não aceita o ADR 0010. O aceite formal do ADR é de Camillo e Lucas, que são o Gate. Falta o Luiz decidir o que é nome público: o nome da comunidade de acervo e o texto que ela mostra. Isso não bloqueia o gate nem a 1ª PR (a migração pode criar a comunidade com nome provisório marcado como tal e o Luiz troca depois), mas o nome definitivo não sai daqui sem ele. Moderação por papéis e tópico fixado ficam fora desta entrega.

## 3. Comportamento, Plataformas e Risco

- **Plataformas afetadas:** nenhuma de tela. Banco compartilhado por Desktop e Webapp Mobile, que seguem usando o feed antigo sem mudança.
- **Estados obrigatórios da Arena:** não aplicável. A Arena não é tocada, e publicar dela continua exigindo consentimento explícito (ADR 0004 §2).
- **Estratégia de entrega, em duas PRs, nesta ordem:**
  1. **PR 1 (esta missão):** só migração aditiva, teste de SQL e rollback. Não toca frontend, porta nem adaptador. Depois do merge, confirmar que a migração foi aplicada no Supabase usando `list_migrations` em modo leitura (nada de `apply_migration` na mão), e conferir a contagem do backfill.
  2. **PR 2 (cartão próprio):** porta, adaptador em `src/plataforma/web/` e telas. Só abre depois que a PR 1 estiver aplicada e conferida.

  O motivo: o merge na `main` aplica a migração na produção e sobe o frontend ao mesmo tempo, sem ordem garantida. Se banco e código novos fossem na mesma PR, existiria uma janela com um sem o outro.
- **Maior risco de quebra ou mentira visual:**
  - O feed antigo continua vivo e escrevendo. Nenhuma RPC, coluna ou tabela existente pode mudar de forma. Se a migração alterar o que o frontend no ar usa, o Bonde quebra na produção.
  - Post criado entre a migração e o deploy da 2ª PR. O trigger espelho precisa copiar o post novo para tópico sem nunca derrubar o `INSERT` antigo. Se o espelho falhar e engolir o erro, tem causo que nasce e não vira tópico; se falhar e derrubar o insert, a pessoa não consegue postar.
  - Backfill. Rodar duas vezes não pode duplicar; apagado e oculto não podem reaparecer; causo sem comunidade vai para o acervo sem atribuição falsa; a contagem antes e depois precisa bater, e se não bater a migração aborta inteira.
  - Repetir o erro do seed de grupos da migração `20261018000010` (`ON CONFLICT (nome) DO UPDATE` sobrescreve slug e descrição). Aqui não pode sobrescrever nada de grupo existente.
  - Áudio privado vazando por uma leitura pública nova.
- **Limite da promessa:** o teste de SQL local e o `list_migrations` só provam que o arquivo foi aplicado e que as regras valem no ambiente testado. Não provam, sozinhos, que as policies e os grants estão certos no projeto vivo; isso exige a matriz de RLS rodada contra o ambiente aplicado. O `validacao.yml` não executa SQL, então `typecheck`, `lint`, `test` e `build` verdes não dizem nada sobre o banco. Também não prometemos nada sobre tela, desempenho em escala ou moderação: esta entrega só garante que o servidor recusa o que tem que recusar e que o acervo atravessa inteiro.

## 4. Matriz de Aceite e Evidência (Marcelo → Tiago)

Os critérios vêm de #254 e #255. "Teste SQL" quer dizer rodado com usuários reais de papéis diferentes (visitante, conta promovida membro, conta promovida não-membro, dono do conteúdo), não só leitura do arquivo.

| Critério observável | Dono da prova | Ambiente exigido | Estado |
|---|---|---|---|
| Plano arquitetural do Gate (nomes, chaves, trigger espelho, backfill, grants) aprovado por escrito antes do SQL | Camillo / Lucas | Documento (parecer no ADR ou no cartão) | pendente |
| Não existe write path que aceite causo social sem comunidade e tópico no modelo novo | Lucas / Marcelo | Código / Teste SQL | pendente |
| Conta promovida que não é membro da comunidade tenta criar tópico ou responder: servidor nega com código de erro que a UI consegue traduzir | Marcelo | Teste SQL / Supabase aplicado | pendente |
| Criar tópico ou responder em tópico fechado, oculto, removido ou de outra comunidade: servidor nega | Marcelo | Teste SQL / Supabase aplicado | pendente |
| Falsificação de autor: tentar gravar com outro `autor_id` ou nickname livre; o autor gravado é sempre `auth.uid()` | Marcelo | Teste SQL / Supabase aplicado | pendente |
| Resposta cujo pai pertence a outro tópico: servidor nega (cross-topic) | Marcelo | Teste SQL / Supabase aplicado | pendente |
| Visitante (sem cadastro) lê comunidades, tópicos e respostas públicas; não escreve nada | Marcelo | Teste SQL / Supabase aplicado | pendente |
| Leitura pública não expõe áudio privado nem caminho de storage assinado indevido | Marcelo / Lucas | Teste SQL / Supabase aplicado | pendente |
| Limite de título e de corpo validado na RPC, com código de erro estável | Lucas / Marcelo | Teste SQL | pendente |
| Contagem de respostas e "última atividade" saem de fonte real e se atualizam com resposta nova, apagada e oculta; cursor de paginação estável (sem repetir nem pular item entre páginas) | Lucas / Marcelo | Teste SQL | pendente |
| Índices existem para tópicos por comunidade e última atividade, e respostas por tópico | Lucas / Camillo | Código / Supabase aplicado | pendente |
| Migração é 100% aditiva: nenhum `DROP`, rename ou mudança de retorno em RPC existente; o frontend atual no ar segue funcionando | Camillo / Marcelo | Código (revisão do SQL) / Navegador no feed antigo após aplicar | pendente |
| Rollback em `supabase/rollback/*.down.sql` remove só os objetos novos e foi ensaiado (sobe, desce, sobe de novo) | Lucas / Marcelo | Teste SQL em ambiente descartável | pendente |
| `SECURITY DEFINER`, grants e RLS das funções novas auditados: ninguém executa o que não devia | Camillo / Marcelo | Código / Supabase aplicado | pendente |
| Backfill idempotente: rodar duas vezes não cria tópico duplicado (`legado_post_id` único, `ON CONFLICT DO NOTHING`) | Lucas / Marcelo | Teste SQL | pendente |
| Conferência de contagem antes e depois, por comunidade, tópico, comentário, áudio, oculto e conteúdo da casa; se divergir, a migração aborta | Lucas / Marcelo | Teste SQL / Supabase aplicado | pendente |
| Apagado e oculto não reaparecem; causo sem comunidade vai para o acervo; nenhum post é atribuído a comunidade externa | Marcelo | Teste SQL | pendente |
| Cobertura dos casos do #255: três perfis, posts da casa, áudio sem nota, comentário aninhado, post oculto | Marcelo | Teste SQL | pendente |
| Título de tópico antigo é determinístico (mesmo post, mesmo título, sempre) e vem do conteúdo existente, sem texto inventado | Lucas / Marcelo | Teste SQL | pendente |
| Cada link `/historia/:id` e `/resenha/:id` antigo é mapeável para um tópico via `legado_post_id`, sem revelar conteúdo moderado | Marcelo | Teste SQL (mapa id antigo para novo) | pendente |
| Post criado depois da migração, pelo caminho antigo, aparece como tópico (trigger espelho) e o insert antigo nunca falha por causa dele | Marcelo | Teste SQL / Supabase aplicado | pendente |
| Migração conferida como aplicada no Supabase de produção, só em leitura (`list_migrations`), e contagem pós-aplicação bate com o inventário | Marcelo / Lucas | Supabase aplicado | pendente |
| Seed não sobrescreve grupo existente (slug e descrição intactos) | Marcelo | Teste SQL | pendente |
| `typecheck`, `lint`, `test` e `build` verdes (necessário, não suficiente) | Marcelo | CI | pendente |

> "Compilou" não é "funcionou". Teste SQL local não substitui a conferência no Supabase aplicado.

## 5. Encerramento e Parecer Final

- **Arquivos/módulos alterados:** pendente (a PR 1 deve tocar só `supabase/migrations/`, `supabase/rollback/` e os testes de SQL; qualquer arquivo em `src/` é sinal de que a PR saiu do escopo).
- **Parecer do Marcelo:** pendente
- **Veredito Final do Tiago:** pendente
- **Pendências ou decisão necessária do Luiz:** nome público e texto da comunidade de acervo. O aceite do ADR 0010 é de Camillo e Lucas. O feed antigo só sai depois que #254, #255, #256, #257, #258, #259 e #248 provarem a jornada nova ponta a ponta; este cartão não autoriza desligar nada.
