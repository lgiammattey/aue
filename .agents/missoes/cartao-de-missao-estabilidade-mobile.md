# Cartão de Missão — estabilidade da navegação mobile

## 1. Enquadramento (Tiago)

- **Dor / Problema da pessoa:** No webapp, o botão central ARROTAR cai na Arena em breve e diálogos de publicação e edição deixam o conteúdo de fundo deslizar ou voltar para outro ponto.
- **Comportamento esperado na tela:** ARROTAR abre o gravador direto sem navegação; a barra mostra Feed, Comunidades, ARROTAR, Tropa e Eu; abrir e fechar qualquer diálogo canônico mantém a leitura no mesmo lugar.
- **Causa encontrada na validação em rede:** o service worker do Vite preservava a casca anterior em desenvolvimento; em HTTP local, a telemetria assumia `crypto.randomUUID` e podia derrubar a árvore React.
- **Fora de escopo (Não vira):** Construir a Arena, alterar contratos de publicação ou mudar dados de perfil.
- **Pista (Lane):** Full flow comum.
- **Por que esta pista:** Muda navegação e coordenação de diálogos em mais de uma superfície visual, mas preserva contratos existentes.
- **Fonte de verdade afetada:** `MAPA_DE_PAGINAS_E_FLUXOS.md`, `Bonde do Arroto.dc.html`, `ADR 0001`.

## 2. Donos e Fronteiras (Iury)

- **Braço direito e Aceite Final:** Tiago
- **Orquestração e Mesa Limpa:** Iury
- **Responsável pela implementação:** Kayky
- **Especificação e Auditoria Visual:** Rian
- **Gate Arquitetural (Camillo / Lucas):** não aplicável
- **Auditoria e Prova Real:** Marcelo
- **Decisão pendente do Luiz:** nenhuma

## 3. Matriz de Aceite

| Critério observável | Ambiente exigido | Estado |
|---|---|---|
| ARROTAR mobile abre o gravador sem trocar de rota | código e navegador 390 × 844 | aprovado — URL permaneceu `/` e o gravador abriu |
| Tropa substitui X1 na barra inferior | código e navegador 390 × 844 | aprovado — cinco alvos: Feed, Comunidades, ARROTAR, Tropa e Eu |
| Composer, gravador e edição de perfil preservam a posição da leitura | teste e navegador 390 × 844 | aprovado — corpo fixado enquanto o diálogo está aberto e posição restaurada ao fechar |
| Servidor LAN carrega a casca atual sem cache de desenvolvimento | navegador em `192.168.1.70:5173` | aprovado — menu exibiu Tropa, sem X1, após recarga limpa |
| HTTP local sem `crypto.randomUUID` não quebra a tela | teste e navegador em `192.168.1.70:5173` | aprovado — UUID compatível gerado e telemetria segue best-effort |
