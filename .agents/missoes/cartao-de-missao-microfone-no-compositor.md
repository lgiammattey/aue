# Gravação precisa acompanhar a publicação

Luiz autorizou reproduzir, corrigir e publicar em 22/10/2026. Tiago aprovou a entrada pela pista full flow sistêmica: ciclo do microfone, anexo e envio. Root/Iury integra; Kayky cuida dos compositores; Lucas cuida da captura; Camillo fecha o gate; Marcelo audita; Tiago aceita.

O post do Tiago `6d99ca10-d676-4640-b261-a910dd5e1cd8` foi criado com anexo nulo, sem tentativa de upload nem arquivo de áudio no servidor. A pessoa confirmou uso do microfone. Esse áudio não pode ser reconstruído. O fluxo suspeito precisa de reprodução antes da correção.

- Depois de iniciar uma gravação, publicar fica bloqueado durante preparação, captura e finalização.
- Áudio concluído precisa chegar como Blob válido no envio e permanecer disponível se o upload falhar.
- Falha não libera texto sozinho em silêncio: tentar novamente, descartar explicitamente ou cancelar são escolhas da pessoa.
- Parar normalmente finaliza a gravação; descartar é uma ação separada.
- Fechar ou desmontar não pode reabrir microfone nem anexar conclusão atrasada.
- Corrigir o mesmo caminho de gravação nas respostas se reproduzir a falha.
- Preservar layout, conteúdo, consentimento e limites. Não tocar em `android/` nem alterar o post existente.

Provas: teste vermelho antes do patch, fluxo de microfone pendente e concluído, falha/descarte/retry, upload sem sucesso não cria post, desktop/mobile e contrato visual, typecheck/lint/test/build, CI e smoke da versão publicada. Teste com áudio gerado ou simulado deve ser identificado como tal; não publicar gravação ambiente de pessoa sem autorização.

Reprodução antes do patch: os três testes de formulário com `iniciar()` pendente falharam, pois chamaram publicação/resposta uma vez com `anexo: null` (9 testes existentes passaram). Log privado: `.git/repro-microfone-antes.log`. Lucas reproduziu também a captura que começava tardiamente após cancelar durante `getUserMedia`, sem encerrar a trilha. Gate aprovado para travar o envio desde o início, invalidar continuações e encerrar streams tardios; nenhuma mudança no banco.

Implementação conferida por Camillo e Marcelo: hook compartilhado de intenção e geração, sem novas APIs de navegador fora da plataforma; falha exige nova tentativa ou descarte; fechamento/troca de post/Voltar invalidam conclusões e limpam timers. Upload recusado mantém o mesmo Blob e não cria publicação; retry envia anexo confirmado.

Validação local: 2.272 testes passaram, 9 pulados; 51 testes no recorte crítico; typecheck, lint e build verdes. O navegador Chromium com MediaRecorder real e fonte de áudio gerada para teste comprovou preparação pendente, bloqueio de submit, Blob não vazio, reprodução da prévia e envio à fixture de persistência explicitamente simulada. Mobile recebeu somente aviso de preparação visível e alvo Publicar de 44px. O rerun final de navegador/contrato visual, CI e smoke publicado serão registrados na PR. Não se publicou áudio de pessoa nem se reconstruiu o arquivo ausente.
