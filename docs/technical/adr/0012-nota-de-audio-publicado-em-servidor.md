# ADR 0012 — Nota de áudio publicado em serviço confiável

**Status:** aceito — decisão de produto de 20/11/2026: cada arroto publicado pode receber nota mesmo sem jogar na Arena e alimentar perfil e ranking.

## O problema

Uma nota enviada pelo navegador pode ser escolhida por quem publica. A base histórica foi avaliada em lote, mas novas publicações precisam de avaliação automática independente para alimentar o perfil e o Top 5.

## Decisão

Manter a avaliação local da Arena e acrescentar uma avaliação assíncrona, em processo controlado pelo Auê, para o áudio publicado. A nota oficial nunca é aceita do navegador.

## Na prática

- O banco descobre áudio elegível e concede trabalho por tempo limitado. Conteúdo removido, oculto ou com arquivo alterado é novamente conferido antes do resultado.
- O processamento usa o juiz e a régua acústica versionada dos áudios históricos, sem presumir origem. Erro ou sinal inconclusivo não vira nota fictícia. A classificação não prova que a emissão ocorreu ao vivo.
- O trabalhador roda em runner padrão de GitHub Actions em agenda, com retentativa e processamento limitado. O agendamento não garante execução imediata nem horário exato.
- Uma função protegida recebe um segredo exclusivo do trabalhador, chama operações restritas ao serviço e entrega apenas o áudio da concessão ativa. A chave de serviço do Supabase permanece na infraestrutura do Supabase e nunca vai para o navegador ou runner.
- O bucket permanece privado quando já era; o ranking e o perfil só mostram o que suas regras de visibilidade permitem. O resultado de uma Arena já publicado não é sobrescrito.
- A mudança amplia a arquitetura do ADR 0001 exclusivamente para avaliar publicação: captura, juiz e interface da Arena continuam no aparelho.

## Alternativas

- Aceitar nota do navegador: permite escolher a nota livremente.
- Executar o modelo em Supabase Edge Function: os limites de CPU, memória e tamanho do pacote exigem comprovação antes de usar inferência nessa plataforma.
- Serviço Cloud Run: permite processamento sob demanda, porém requer nova infraestrutura de execução e pode gerar custo; pode substituir a agenda quando latência ou volume justificarem.

## O custo

A nota pode demorar e precisa de observabilidade, retentativas e manutenção de segredo. O runner padrão é gratuito para este repositório público, mas uploads, armazenamento, rede e outras infraestruturas continuam sujeitos aos seus próprios limites. Agendas de Actions podem atrasar, perder execuções ou ser desativadas por inatividade; fila persistente impede que isso vire sucesso inventado, mas não garante prazo.
