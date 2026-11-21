# Missão 0052 — Anúncios em todas as telas, aviso +18, Analytics e capa viva

- **Problema:** o Auê estava com poucos anúncios visíveis (só o primeiro espaço do Mural carregava, a lateral sumiu no Mural/Perfil, e Arena, capa, perfis e guias tinham zero anúncio), sem aviso de maioridade (+18), com Analytics restrito à Arena e com a capa parecendo slide institucional estático.
- **Comportamento:**
  1. Integrar todos os formatos da Adsterra enviados pelo Luiz (Native Banner, Banner 300×250, Social Bar e Smartlink) sem caixas vazias na rolagem e com distribuição na capa, revisão da Arena, Mural, Seguindo, Perfis e guias públicos;
  2. Exibir aviso fixo discreto de +18 anos com confirmação salva localmente e registrada no Analytics;
  3. Expandir o Google Analytics 4 para o Mural e páginas públicas (mantendo links privados de duelo fora da coleta) e medir confirmação +18, reprodução de arroto e clique em anúncio;
  4. Trocar os blocos estáticos da capa por chamada direta pro Mural unificado (que já reúne todo o conteúdo das antigas comunidades), anúncio 300×250, Grupos de WhatsApp e faixa compacta de guias SEO com links diretos pra todas as páginas indexáveis.
- **Pista:** full flow comum + revisão de fronteiras arquiteturais (`arquitetura.fronteira.test.ts` e `seo-publico.test.ts`).
- **Donos:** Tiago (aceite), Iury (coordenação), Rian e Kayky (UX/UI), Camillo (plataforma/Analytics/Adsterra), Marcelo (qualidade).
- **Aceite:** `typecheck`, `lint`, `test` e `build` verdes; novos testes unitários cobrindo todos os placements da Adsterra, Social Bar, aviso +18 e expansão do Analytics.
- **Estado:** concluída.
