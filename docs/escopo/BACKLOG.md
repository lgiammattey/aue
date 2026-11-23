# Backlog do Auê

**Revisado em 23/11/2026.** O backlog operacional está nas [issues abertas](https://github.com/lgiammattey/aue/issues). Abertura de issue não confirma que a descrição ou prioridade ainda corresponda ao estado atual: valide antes de iniciar.

## Pendências identificadas nesta revisão

- Validar em aparelhos reais o caminho gravação, laudo, criação e resposta do duelo, publicação consentida e tratamento de erro. Conferir permissões e entrega de áudio no backend.
- Conferir a seção Liga e especificar separadamente o que já existe e o que seria liga privada semanal; não presumir entrega a partir do nome visual.
- Reavaliar issues antigas à luz da mudança de mural, comunidades e Arena v2. Achados de segurança antigos, como [#313](https://github.com/lgiammattey/aue/issues/313) e [#314](https://github.com/lgiammattey/aue/issues/314), exigem investigação atual; não são declaração de vulnerabilidade vigente nem de correção.
- Investigar as funções remotas `og-preview`, `teste-content-type` e `uso-unico-imagens-oficiais`, ativas no Supabase e ausentes de `supabase/functions/`; preservar até determinar uso e dependências.
- Verificar regras de cache e atualização do PWA, incluindo o relato em [#315](https://github.com/lgiammattey/aue/issues/315).
- Versão em inglês: a Fase 1 (home `/en`) saiu em 23/11/2026. A Fase 2 (Arena e mural em inglês, termos e privacidade, páginas por intenção de busca) depende de decisão do Luiz e não está priorizada.

Estas são pendências de verificação, não uma nova priorização aprovada. A direção de produto está em [escopo atual](ESCOPO_ATUAL.md) e as evidências em [produção atual](../PRODUCAO_ATUAL.md). O backlog anterior, com fila e afirmações de agosto que conflitavam com o corte atual, permanece no histórico do Git.
