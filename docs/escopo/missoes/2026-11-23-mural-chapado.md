# Cartão de Missão — mural chapado, arroto no centro

## 1. Enquadramento (Tiago)

- **Dor / Problema da pessoa:** o mural parece um Twitter. O post é avatar, nome, @ e texto. O arroto, que é o motivo de o Auê existir, não aparece. As 7 reações ocupam duas linhas e não mostram contagem. O comentário some num ícone solto. Há cerca de 12 molduras numa tela só, com card dentro de card.
- **Comportamento esperado na tela:** o mural mostra os arrotos que a galera mandou, seja pela Arena, seja direto no mural, com as reações e os comentários em cima deles. Cada post tem player com waveform e, quando veio da Arena, a nota. Reação vira emoji com contagem, só as que existem, e um `＋` abre as 7. O último comentário aparece na prévia, e tocar abre um sheet com o player fixo no topo. Um botão de ação fecha o loop: "Bater 70", "Revanche" ou "Levar pra Arena".
- **Fora de escopo (Não vira):** tema claro, nova paleta, nova família tipográfica, comentário em áudio, post só de texto, mudança na Arena, mudança nas páginas públicas.
- **Pista (Lane):** Full flow comum, com gate arquitetural se a consulta do feed mudar de contrato (contagem por reação e último comentário).
- **Por que esta pista:** tela existente com componentes canônicos (`CardDoPost`, `ThreadDeComentarios`). Pode virar sistêmica se o contrato do feed mudar.
- **Fonte de verdade afetada:** `ADR 0004` (texto puro deixa de ser post). Precisa de ADR novo antes de aceitar post sem arroto como regra.

## 2. Donos e Fronteiras (Iury)

- **Braço direito e Aceite Final:** Tiago
- **Orquestração e Mesa Limpa:** Iury
- **Responsável pela implementação:** Kayky (telas); Lucas e Camillo se o contrato do feed mudar
- **Especificação e Auditoria Visual:** Rian, a partir de [`docs/design/propostas/mural-chapado.html`](../../design/propostas/mural-chapado.html)
- **Gate Arquitetural (Camillo / Lucas):** pendente (contrato do feed e waveform)
- **Auditoria e Prova Real:** Marcelo
- **ADR:** [0013, Mural: todo post tem arroto](../../technical/adr/0013-mural-todo-post-tem-arroto.md), aberto como proposto em 23/11/2026. Implementação só depois de aceito e com o Gate aprovado.
- **Decisão pendente do Luiz:** aceitar o ADR 0013 depois do Gate do Camillo e do Lucas.

### Decisões já tomadas pelo Luiz em 23/11/2026

1. Mural chapado, sem card, só tema escuro.
2. Todo post tem arroto. O texto é legenda opcional.
3. Botão "Bater X" entra nesta rodada.
4. Barra inferior mobile entra, com o botão de arrotar no centro. O botão "+ Postar" e o título "MURAL" saem.
5. Paleta: vale o que está implementado. Laranja `#ff5500` sobre `#0a0b0e`, como em `src/styles/designSystem.css`. O verde `#c6ff00` do `DESIGN.md` e do mapa de telas não vale para esta missão.

### Divergência de documentação

O `DESIGN.md` (§2) e o mapa de telas (§4) ainda descrevem verde `#c6ff00` sobre `#0a0a08` e raios de 12 a 24px. O código usa laranja, `#0a0b0e` e raios de 2 a 8px. Alinhar esses dois documentos ao código fica como missão própria, fora desta.

## 3. Comportamento, Plataformas e Risco

- **Plataformas afetadas:** Web Mobile (Safari iOS / Chrome Android) e Desktop
- **Estados obrigatórios da Arena:** não aplicável, a Arena não muda
- **Maior risco de quebra ou mentira visual:** nota exibida em post sem arroto julgado. Post gravado direto no mural não nasce com nota. A nota só aparece quando a avaliação assíncrona do ADR 0012 devolver, e nunca é provisória. Segundo risco: vários áudios carregando ao mesmo tempo no feed.
- **Limite da promessa (o que o motor de áudio/API não mede):** a waveform é desenho da forma do som, não medida de qualidade. A nota só existe para arroto que passou pela Arena. Publicar no mural continua exigindo consentimento explícito.

### Regras de desenho da proposta

- Uma superfície por post, o player. Nada dentro dela. Popover de reação e sheet de comentários são molduras funcionais.
- `--accent` em 2 lugares: o `!` do logo e o botão de arrotar. Tocar áudio não acende accent.
- Anton só em wordmark e notas. Nome do autor em Archivo 700.
- Escala e espaçamento estão no botão "Medidas" do protótipo.

## 4. Matriz de Aceite e Evidência (Marcelo & Rian → Tiago)

| Critério observável | Dono da prova | Ambiente exigido (Código / Teste / Safari iOS / Chrome Android) | Estado |
|---|---|---|---|
| Cada post tem no máximo 1 elemento com borda ou fundo, o player | Marcelo | Teste E2E que conta molduras por post | pendente |
| Reação sem moldura, com contagem, só as existentes | Rian | Rota real em 390 e 1440 | pendente |
| Comentário com prévia e sheet com player fixo | Marcelo | Safari iOS e Chrome Android | pendente |
| Post sem arroto julgado nunca mostra nota | Marcelo | Teste unitário e rota real com dado real | pendente |
| Um áudio por vez, carga só ao entrar na tela | Camillo | Teste e perfil de rede no celular | pendente |
| `scrollWidth === innerWidth` em 390 com dados reais | Marcelo | Rota real | pendente |
| Antes e depois comparados, contrato visual E2E verde | Rian | Capturas desktop e mobile | pendente |
| Alvos de toque >= 44px e safe area na barra inferior | Marcelo | Safari iOS | pendente |

## 5. Encerramento e Parecer Final

- **Arquivos/módulos alterados:** nenhum código nesta rodada. Entram só o protótipo e este cartão.
- **Parecer do Marcelo:** pendente
- **Veredito Final do Tiago:** pendente
- **Pendências ou decisão necessária do Luiz:** aceitar o ADR 0013 depois do Gate.
