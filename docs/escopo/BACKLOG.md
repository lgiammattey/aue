# Backlog do Auê

**Atualizado em 27/11/2026.** Este arquivo é o registro versionado das pendências; as [issues abertas](https://github.com/lgiammattey/aue/issues) podem acompanhar execução, mas não autorizam missão nem comprovam prioridade ou conclusão. Valide antes de iniciar.

## Pendências identificadas nesta revisão

- Validar em aparelhos reais o caminho gravação, laudo, criação e resposta do duelo, publicação consentida e tratamento de erro. Conferir permissões e entrega de áudio no backend.
- Conferir a seção Liga e especificar separadamente o que já existe e o que seria liga privada semanal; não presumir entrega a partir do nome visual.
- Reavaliar issues antigas à luz da mudança de mural, comunidades e Arena v2. Achados de segurança antigos, como [#313](https://github.com/lgiammattey/aue/issues/313) e [#314](https://github.com/lgiammattey/aue/issues/314), exigem investigação atual; não são declaração de vulnerabilidade vigente nem de correção.
- Investigar as funções remotas `og-preview`, `teste-content-type` e `uso-unico-imagens-oficiais`, ativas no Supabase e ausentes de `supabase/functions/`; preservar até determinar uso e dependências.
- Verificar regras de cache e atualização do PWA, incluindo o relato em [#315](https://github.com/lgiammattey/aue/issues/315).
- Versão em inglês: a Fase 1 (home `/en`) saiu em 23/11/2026. A Fase 2 (Arena e mural em inglês, termos e privacidade, páginas por intenção de busca) depende de decisão do Luiz e não está priorizada.

Estas são pendências de verificação, não uma nova priorização aprovada. A direção de produto está em [escopo atual](ESCOPO_ATUAL.md) e as evidências em [produção atual](../PRODUCAO_ATUAL.md). O backlog anterior, com fila e afirmações de agosto que conflitavam com o corte atual, permanece no histórico do Git.

## M00 — backlog técnico transferido para M01

Estado em 27/11/2026: **todos abertos**. A prioridade abaixo é a da auditoria; não representa missão iniciada. A prova, SHA e limites estão no [baseline M00](../technical/auditorias/M00-BASELINE.md). Os relatórios completos foram preservados fora do repositório em `~/AUE-AUDITORIA/` no ambiente que executou a auditoria; os principais resultados sintéticos foram copiados ao baseline versionado. Revalidar fatos e prioridade antes de executar.

| ID | Prioridade M00 | Assunto e critério de prova futuro | Evidência M00 |
|---|---|---|---|
| AUE-T01 | P1 | Integridade da pontuação: não dar consequência competitiva a sinais manipuláveis; validar contrato, autoria e vínculo com áudio. | SEC-01 / S01; [nota local](../technical/auditorias/evidencias/pglite-execucao-reproduzida.json) |
| AUE-T02 | P1 | Limite do cadastro de grupos sob concorrência, falha de contador e tamanho antes do parse. | SEC-02 / S02; [handler com dublê](../technical/auditorias/evidencias/cadastrar-grupo-concorrencia.json) |
| AUE-T03 | P1 proposta | Triar advisories por alcance, correção compatível e testes, sem presumir exploração. | S03; npm audit na M00, 13 totais; zero no recorte `--omit=dev` |
| AUE-T04 | P1 | Validar gravação, reprodução, envio, resultado e duelo em iPhone/Android reais autorizados. | S04; testes com mídia simulada não substituem aparelho |
| AUE-T05 | P2 | Verificar fila de notas e RPC revogada; demonstrar worker e contrato em staging fiel. | DB-03 / S06; `notas-worker` e migrations versionadas |
| AUE-T06 | P2 | Mapear consumidores de Arenas e links históricos antes de consolidar. | LEG-01 / S07; `src/App.tsx`, `src/arena/` e `src/arena/v2/` |
| AUE-T07 | P2 | Validar liberação de Object URLs de anexos em remoção, falha e desmontagem. | S08; `src/features/novo-aue/InicioOpenDesign.tsx` |
| AUE-T08 | P2 | Validar domínio, workers e redirects em aparelhos e deploy identificado. | S09; `firebase.json`, `firebase.legado-redirect.json`, `vercel.json` |
| AUE-T09 | P1 para fechar auditoria | Aprofundar inventário e grafo, referências dinâmicas e SQL além das amostras. | M00 relatórios 02, 04 e 17; parcial por método |
| AUE-T10 | P2 | Reproduzir avatar, busca, vídeo e layout em ambiente autorizado; conferir policy/helper sem presumir grants. | M00 07/08/11; [avatar PGlite](../technical/auditorias/evidencias/avatar-pglite-probe.json) |
| AUE-T11 | P2 | Corrigir runner para parar na primeira migration inválida e provar erro sem falso sucesso em banco descartável. | DB-05; `supabase/tests/local/rodar.sh:26` |
| AUE-T12 | P2 | Corrigir contraste do rodapé mobile e verificar temas em navegador. | M00 UX/a11y: 4,27:1 contra 4,5:1 em laboratório |
| AUE-T13 | P2 | Investigar instabilidade da suíte de fórum e expectativas de flags nos E2E; repetir sem transformar retry em estabilidade. | M00 10; falhas distintas sem retry |
| AUE-T14 | P2 | Reconciliar testes SQL sociais com assinaturas/grants versionados e executá-los até o fim em ambiente compatível descartável. | M00 testes-sociais-pglite; interrupções na primeira asserção |
| AUE-T15 | P2 | Revisar fronteira de APIs web e planejar portas sem quebrar ciclo de microfone/storage/share. | ADR 0001; `useGravacao.ts`, `ultimaBatalha.ts`, `CardDoPost.tsx`, `MenuDoPost.tsx` |

### SEO e rastreabilidade

| ID | Prioridade M00 | Pendente e evidência |
|---|---|---|
| SEO-01 | P2 | `vite.config.ts` gera 404 com canonical e `index, follow` herdados da home, apesar de HTTP 404; validar metadados e resposta futura. |
| SEO-02 | P2 | Expor e conferir identificador de revisão do artefato publicado; CI verde não comprova o SHA servido. |
| OPS-SEO-01 | P2 | Definir critério mensurável para retirada dos hosts/workers legados, preservando redirects e PWA antiga até prova. |
| SEO-03 | P3 | Rever comentário de host antigo em `public/ads.txt`; não inferir problema de entrega do arquivo. |
| SEO-04 | P3 | Antes de mudar home, manter conteúdo útil, links e prova de indexação/renderização; não presumir indexação das 13 URLs do sitemap. |
| AUE-OPS-RLS | P1 proposta | Em ambiente autorizado e fiel, verificar RLS, papéis, Auth, Storage e Edge implantados; o PGlite com stubs não prova grants reais. |
| AUE-UX-MOBILE | P2 proposta | Investigar desempenho de campo, acessibilidade, leitores de tela e dispositivos; Lighthouse local de uma amostra não é Core Web Vitals real. |

### M01.1 — ressalvas encaminhadas

- **Histórico de ADRs:** a direção vigente é web e a publicação oficial é Firebase. O status histórico do ADR 0002 referencia `AGENTS.md` em vez de outro ADR. O ADR 0006 prevê retirar `vercel.json`, que permanece como ponte de redirecionamento. A reconciliação formal e qualquer mudança no redirect exigem decisão própria com a prova aplicável. A Foundation preserva a configuração.

- **M01-R01, validação dos perfis:** verificada na sessão compatível testada. Os quatro perfis responderam como agentes distintos e acessaram suas skills; a falha na sessão efêmera continua documentada como limitação de ambiente, sem diagnóstico interno definitivo. Se o mecanismo estiver indisponível no futuro, registrar execução por papéis sem alegar independência.
- **M01-R02, classificação:** concluída, sem tratar avisos ou skips como corrigidos. Os 23 avisos preexistem à M01; os sete avisos de efeitos/limpeza de refs pedem investigação em M04 ou M05 conforme o consumidor e o risco, sem inferir falha ou correção imediata. Os nove testes de fórum foram ignorados por opt-in/ambiente ausente: validar contratos em M02 somente em ambiente fiel e autorizado, ou reavaliar em M03 após mapa de consumidores. Detalhes por ocorrência e histórico em [M01.1-QUALIDADE.md](../missoes/M01.1-QUALIDADE.md).
