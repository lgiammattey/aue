# Tópicos com assunto e áudios preservados

## Enquadramento aprovado pelo Tiago

Luiz autorizou organizar o conteúdo existente e publicar a correção de áudio em comunidade, feed e perfil. O agrupamento de 21 posts chama-se **Mural da vergonha**. A missão segue full flow sistêmica, com gate de Camillo/Lucas antes de implementação.

- Preservar IDs, textos, autores, datas, respostas, reações, salvos, links e áudios.
- Agrupar 21 posts no Mural; manter câmera, dicas, apresentação e gravação; post sem contexto fica pendente, sem exclusão.
- YouTube: 4 relíquias, 6 compilações, 2 jogos, 3 dicas/curiosidades.
- WhatsApp permanece com o tópico existente.
- Consentimento e política de áudio não mudam. Falha de reprodução permanece falha.
- Preservar visual atual, sem redesign.

## Donos e prova

Camillo fecha agrupamento e preservação. Lucas completa áudio nas projeções. Integração e publicação na raiz; Marcelo audita dados, testes e comportamento. Tiago dá aceite final após evidência.

Backup privado local em `.git/aue-backup-pre-agrupamento.json`: 50 posts totais, 16 respostas, 6 reações e 1 item salvo. Recorte aprovado: 42 tópicos das comunidades. Inventário deve ser comparado após aplicação sem sobrescrever conteúdo concorrente.

Aceite: agrupamento correto; links antigos operantes; integridade de posts/respostas/mídias; áudio no feed/perfil/tópicos; typecheck/lint/test/build; navegador desktop/mobile e smoke público após deploy.

## Encerramento

Gate Camillo/Lucas aprovado: associação aditiva, sem converter posts em respostas. Marcelo não encontrou achados materiais na revisão de integridade; Rian conferiu capturas locais em 390px/1440px. A revisão de integração corrigiu abertura de comentários, reações e atualização das entradas agrupadas.

Validação local: 2.247 testes passaram, 15 E2E, typecheck, lint e build verdes. O ensaio transacional no banco preservou os 50/16/6/1 registros, validou os 40 links, 9 pautas, 6 áudios antigos, consentimento e leitura pública. Contadores: 6 tópicos em Eu, 4 no YouTube e 1 no WhatsApp.

Estrutura e projeção de áudio aplicadas; dados administrativos ficam em `supabase/dados/`, para execução somente depois do Hosting publicar a interface. Aceite de produção depende do smoke público e da comparação final do inventário.
