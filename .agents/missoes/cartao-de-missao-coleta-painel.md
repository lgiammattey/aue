# Coleta de acessos e números do painel

Tiago aprovou a missão em 22/10/2026. Luiz autorizou corrigir e publicar a coleta, a mensagem vazia e os demais números incorretos do painel. Pista: full flow sistêmica.

- Registrar visitas reais por categoria e sessão, sem inventar histórico ou pessoas únicas.
- Conferir envio, permissões, banco, agregação e painel; preservar privacidade e RLS.
- Corrigir texto de ausência de dados, rótulos e números que representem incorretamente a atividade.
- Preservar o layout aprovado; nenhuma mudança na Arena ou em conteúdo dos usuários.

Root integra a entrega e a publicação. Lucas/Camillo fecham o diagnóstico e o gate de persistência; Marcelo audita; Tiago dá o aceite final. Não tocar no diretório local `android/`.

Prova exigida: visita pelo site entra no banco e no painel; recarga respeita deduplicação; demais métricas conferem com as fontes; desktop/mobile sem regressão; typecheck, lint, testes e build verdes. Histórico de visitas que falharam não será reconstruído.

Gate Lucas/Camillo aprovado: o trigger de limite consulta a tabela como visitante e falha por falta de SELECT, apesar de INSERT permitido. A função do trigger passa a executar com privilégios do dono e search_path fixo, mantendo o limite e sem abrir leitura pública. A sessão só confirma visita após persistência com sucesso. A RPC exclui agrupadores sintéticos das publicações; o adaptador rejeita respostas incompletas.

Outros achados na mesma tela: o gráfico descartava dias em vez de somar faixas; o rótulo de perfis concluídos não dizia que era do período; a API Adsterra devolve `impression` (singular), mas a função somava `impressions`, transformando a contagem em zero. A correção mantém layout e fontes atuais.

Servidor aplicado: migração `20261022165204`, Edge Function versão 34 com JWT mantido. Visita pública real gerou um acesso de perfil e o painel exibiu o mesmo registro; monetização exibiu 308 impressões e US$ 0,05. Em transação com rollback: INSERT anon/auth passou; SELECT negado aos dois; 120 eventos aceitos e o 121º bloqueado. Métricas conferidas no mesmo período: 12 tópicos, 10 respostas e 1 acesso, incluindo publicações concorrentes reais.

Provas locais: 2.260 testes passaram e 9 foram pulados; revisão final dos módulos alterados com 44 testes passou; typecheck, lint e build passaram; 2 E2E do painel e 9 contratos visuais passaram em 390px/1440px. Marcelo liberou o gate de estrutura e implementação. A publicação da interface e o smoke final serão registrados na PR antes do aceite de encerramento.
