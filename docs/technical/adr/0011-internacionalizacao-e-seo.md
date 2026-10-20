# ADR 0011 — Idiomas, tradução e descoberta internacional

**Status:** proposto — exige Gate Arquitetural de Camillo/Lucas e aceite do Luiz
**Data:** 2026-10-19
**Vale para:** páginas públicas, comunidade, perfil público e SEO

## Decisão em uma frase

> Idioma é uma versão pública com URL própria; tradução automática ajuda a
> preparar conteúdo, mas nunca substitui o original nem vira fábrica de páginas
> indexáveis.

## URLs e descoberta

- As páginas localizáveis usam prefixo por idioma, como `/pt-br/...`, `/en/...`
  e `/es/...`. PT-BR é a origem; inglês e espanhol são candidatos para a
  primeira leva e exigem confirmação do Luiz antes de publicação. O endereço
  sem idioma é uma porta de escolha (`x-default`) e não decide pela localização/IP.
- Cada versão publica `lang`, canonical próprio e links `hreflang` para todas
  as versões existentes, inclusive ela mesma e `x-default`.
- O sitemap lista somente URLs públicas, reais e já revisadas de cada idioma.
  Link privado, rota autenticada, duelo e rascunho continuam fora.
- O seletor de idioma é link comum para a URL equivalente. Ele não esconde
  versões do Google atrás de cookie, `Accept-Language` ou JavaScript.

## Conteúdo e comunidade

- Páginas institucionais e guias têm tradução publicada por idioma, revisão
  humana e metadados próprios.
- Tópico, resposta e perfil preservam o texto original e seu idioma de origem.
  A pessoa pode pedir **Traduzir**; vê a tradução marcada com idioma, provedor
  e opção de voltar ao original.
- Tradução de conteúdo de usuário não ganha URL, canonical, sitemap, contagem
  própria nem indexação. Ela é uma ajuda de leitura, não conteúdo novo.
- Se a tradução falhar, o original segue legível e a interface diz a verdade.

## Papel do n8n

O n8n pode orquestrar uma fila assíncrona de tradução: recebe texto permitido,
idioma de origem, idioma alvo e identificador opaco; chama o provedor escolhido;
devolve rascunho para revisão/publicação. Ele não roda quando a página abre,
não usa `service_role`, não guarda áudio e não é autoridade de permissão.

Credenciais ficam no ambiente de automação ou servidor. O frontend chama uma
porta do Auê; nunca chama webhook secreto direto.

## O que não entra

- traduzir HTML inteiro no cliente;
- redirecionar por IP ou idioma do navegador sem escolha explícita;
- criar páginas indexáveis de tradução automática em massa;
- tratar tradução como moderação, reescrita ou alteração do post original.

## Prova exigida antes de aceitar

1. PT-BR e cada idioma aprovado servidos em URLs distintas com links alternativos
   completos e sitemap válido.
2. Inspeção de URL no Search Console confirma canonical e idioma de pelo menos
   uma página por variante.
3. Um tópico real prova original, tradução pedida, erro e retorno ao original.
4. Revisão de segredo, RLS e retenção aprova a automação n8n.
