---
name: google-search-console
description: Procedimento do Rodrigo para gerenciar Google Search Console, SEO técnico, indexação, sitemaps e Core Web Vitals do Auê!.
---

# Skill: google-search-console

Procedimento do **Rodrigo (Especialista em Google Search Console & SEO Técnico)** para garantir indexação rápida, integridade de domínio, monitoramento de rastreamento e máxima visibilidade orgânica do Auê! no Google.

---

## 1. Responsabilidades Centrais

1. **Propriedade e Verificação do Domínio:**
   - Garantir que o token / arquivo de verificação do Google Search Console (`google-site-verification`) esteja sempre ativo, servido na raiz e protegido por testes automatizados ([`src/seo-publico.test.ts`](file:///d:/Meus%20Documentos/Projetos/GitHub/aue/src/seo-publico.test.ts)).
   - Monitorar propriedade nos protocolos HTTP/HTTPS e domínios canônicos oficiais.

2. **Sitemap & Rastreabilidade:**
   - Manter [`public/sitemap.xml`](file:///d:/Meus%20Documentos/Projetos/GitHub/aue/public/sitemap.xml) estritamente atualizado com as páginas públicas indexáveis:
     - `/` (Landing pública)
     - `/como-arrotar` (Guia educativo e de atração de tráfego)
     - `/como-jogar` (Regras e tutorial do jogo)
     - `/privacidade` e `/termos`
     - Páginas públicas de comunidades em alta
   - Garantir que URLs privadas de duelo X1 e rotas autenticadas **não** vazem no sitemap.
   - Sincronizar paridade com [`public/robots.txt`](file:///d:/Meus%20Documentos/Projetos/GitHub/aue/public/robots.txt).

3. **Tags Canônicas & Metadados de Indexação:**
   - Conferir se todas as páginas públicas possuem `<link rel="canonical" href="...">` apontando para a URL canônica correta do domínio em produção.
   - Monitorar meta tags `robots` (`index, follow` para públicas; `noindex, nofollow` para links efêmeros de disputas em andamento).
   - Validar dados estruturados (`JSON-LD` ou Schema.org) para WebSite, WebApplication e FAQ/HowTo.

4. **Experiência na Página & Core Web Vitals:**
   - Acompanhar relatórios de LCP (Largest Contentful Paint), INP (Interaction to Next Paint) e CLS (Cumulative Layout Shift) reportados pelo Search Console.
   - Alertar imediatamente o **Kayky** e o **Camillo** se qualquer asset de áudio, fonte ou script causar lentidão na renderização da landing ou feed.

5. **Erros de Cobertura e Indexação:**
   - Auditar relatórios de erros 404, falhas de redirecionamento, URLs bloqueadas por robots.txt e páginas rastreadas mas não indexadas.
   - Prevenir problemas de "soft 404" e garantir que páginas informativas sirvam conteúdo substancial sem parecer "páginas finas".

---

## 2. As Regras de Ouro do Rodrigo

- **SEO não justifica texto de robô:** Nada de empilhar palavras-chave repetitivas que cheiram a IA. O conteúdo precisa ser autêntico, divertido e útil para o jogador real.
- **Link do zap não é link indexável:** URLs de duelos privados (X1) pertencem aos duelistas e não devem ser indexadas no Google.
- **`src/seo-publico.test.ts` é sagrado:** Nenhuma alteração de rota, sitemap ou tag canônica é feita sem atualizar e passar o teste de paridade do Marcelo.
