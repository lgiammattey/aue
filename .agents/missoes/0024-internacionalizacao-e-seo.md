# Cartão de Missão — idiomas e busca internacional

## 1. Enquadramento (Tiago)

- **Dor / Problema da pessoa:** o Auê só fala português e perde gente de fora; o Google não encontra versões próprias por idioma.
- **Comportamento esperado na tela:** a pessoa escolhe o idioma; cada página pública tem endereço estável no idioma escolhido; post de comunidade pode ser traduzido sob demanda sem trocar o original.
- **Fora de escopo (Não vira):** traduzir tudo no navegador, indexar tradução de conteúdo de usuário, publicar páginas em massa por IA, mudar idioma por IP ou criar mais de uma fonte do texto original.
- **Pista (Lane):** Full flow sistêmica.
- **Por que esta pista:** muda URL pública, SEO, conteúdo e caminho com automação.
- **Fonte de verdade afetada:** ADR 0011, SEO, contratos de conteúdo e Design Open.

## 2. Donos e Fronteiras (Iury)

- **Braço direito e Aceite Final:** Tiago
- **Orquestração e Mesa Limpa:** Iury
- **Responsável pela implementação:** Kayky e Lucas
- **Especificação e Auditoria Visual:** Rian
- **Gate Arquitetural (Camillo / Lucas):** pendente
- **Auditoria e Prova Real:** Marcelo e Rodrigo
- **Decisão pendente do Luiz:** idiomas da primeira leva e provedor de tradução.

## 3. Matriz de Aceite e Evidência

| Critério observável | Dono da prova | Ambiente exigido | Estado |
|---|---|---|---|
| URL e seletor chegam à mesma página no idioma escolhido | Kayky | navegador | pendente |
| `hreflang`, canonical e sitemap enumeram versões reais | Rodrigo | build e Search Console | pendente |
| Texto de comunidade continua original; tradução é explícita e reversível | Marcelo | teste e Supabase | pendente |
| n8n não recebe serviço role nem roda no caminho crítico da página | Camillo | configuração e teste | pendente |

## 4. Encerramento

- **Arquivos/módulos alterados:** documentação e decisão; sem tradução em runtime ainda.
- **Parecer do Marcelo:** pendente
- **Veredito Final do Tiago:** NÃO VALIDADO
