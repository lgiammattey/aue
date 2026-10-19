# Cartão de Missão — perfil conectado no padrão público

## 1. Enquadramento (Tiago)

- **Dor / Problema da pessoa:** quem entra no próprio perfil cai numa tela com a estética velha do Bonde, desconectada da nova porta de Comunidades e das páginas públicas.
- **Comportamento esperado na tela:** uma conta conectada abre `/perfil`, lê a ficha que já está no Supabase e vê nome, @, foto, bio, números verdadeiros e resenhas no mesmo idioma visual público.
- **Fora de escopo (Não vira):** novo banco, nova RPC, migração de perfil, Arena, contagem inventada ou uma versão paralela de seguidores e resenhas.
- **Pista (Lane):** Full flow comum.
- **Por que esta pista:** reaproveita portas e contratos existentes; a mudança é na apresentação e na entrada da página.
- **Fonte de verdade afetada:** `docs/design/forum-comunidades.md` (decisão vigente) e `src/portas/perfil.ts`.

## 2. Donos e Fronteiras (Iury)

- **Braço direito e Aceite Final:** Tiago
- **Orquestração e Mesa Limpa:** Iury
- **Responsável pela implementação:** Kayky
- **Especificação e Auditoria Visual:** Rian
- **Gate Arquitetural (Camillo / Lucas):** Camillo/Lucas confirmam reaproveitamento da porta já existente; sem alteração de contrato.
- **Auditoria e Prova Real:** Marcelo
- **Decisão pendente do Luiz:** nenhuma

## 3. Comportamento, Plataformas e Risco

- **Plataformas afetadas:** web desktop, Safari iOS e Chrome Android.
- **Maior risco de quebra ou mentira visual:** trocar a tela e exibir perfil, contagens ou sessão que não vieram do servidor.
- **Limite da promessa:** dados dependem das RPCs existentes (`meu_handle_social`, `obter_perfil_publico`, `listar_feed_de_causos`); sem servidor a tela mostra falha, não perfil inventado.

## 4. Matriz de Aceite e Evidência

| Critério observável | Dono da prova | Ambiente exigido | Estado |
|---|---|---|---|
| Conta conectada consulta o perfil próprio pela porta existente | Marcelo | Teste | pendente |
| Nome, @, foto, números e resenhas vêm do retorno existente | Marcelo | Teste e Supabase | pendente |
| Página segue a casca pública em desktop e mobile | Rian | Código e navegador | pendente |
| Editar, sair e compartilhar continuam acessíveis | Marcelo | Teste e navegador | pendente |

## 5. Encerramento e Parecer Final

- **Arquivos/módulos alterados:** `TelaPerfil.tsx`, testes de perfil e estilos locais.
- **Parecer do Marcelo:** pendente
- **Veredito Final do Tiago:** NÃO VALIDADO
- **Pendências ou decisão necessária do Luiz:** prova de conta real no Supabase e Safari/Chrome reais.
