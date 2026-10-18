# Cartão de Missão 0010 — Faxina Documental e Remoção de Cascas Nativas

> Missão de saneamento e sincronização da verdade do repositório conforme auditoria completa (Mapa_Aue_2026-10-18.md) e alinhamento com o Luiz.

## 1. Enquadramento (Tiago)

- **Dor / Problema da pessoa:** O repositório contava histórias conflitantes. O README principal negava a existência de feed, comunidades e perfil (dizendo ser apenas arena casual sem rede social), protótipos velhos estavam soltos fora do arquivo histórico, dois ADRs disputavam o número 0004, havia menções obsoletas à Vercel e o projeto carregava cascas nativas (Android e iOS com Capacitor) contrariando a definição de produto exclusivamente web/webapp mobile.
- **Comportamento esperado na tela:** Para quem usa o Auê, a experiência permanece focada 100% no webapp mobile e desktop. Para o time e para qualquer pessoa que abrir o repositório, a documentação reflete com precisão a rede social (Bonde do Arroto, Comunidades, Arena, Perfis e Grupos) hospedada no Firebase Hosting.
- **Fora de escopo (Não vira):**
  - Não vamos alterar o motor de áudio nem a lógica de captura da Arena nesta missão.
  - Não vamos apagar o acervo bruto de áudios em `audios/` nesta etapa.
  - Não vamos quebrar rotas ativas ou contratos do Supabase.
- **Pista (Lane):** Full flow sistêmica
- **Por que esta pista:** Mexe na governança documental, remove integrações nativas (Capacitor/Android/iOS e workflow relacionado), renomeia ADR conflitante e sincroniza a squad e os índices.
- **Fonte de verdade afetada:** `AGENTS.md`, `README.md`, `docs/README.md`, `docs/technical/adr/`, `package.json`, `.github/workflows/`.

## 2. Donos e Fronteiras (Iury)

- **Braço direito e Aceite Final:** Tiago
- **Orquestração e Mesa Limpa:** Iury
- **Responsável pela implementação:** Camillo (Plataforma/Arquitetura) e Kayky (Documentação/Frontend)
- **Especificação e Auditoria Visual:** Rian
- **Gate Arquitetural (Camillo / Lucas):** Aprovado (remoção de casca nativa alinhada com o Luiz e com a premissa de produto 100% web do AGENTS.md).
- **Auditoria e Prova Real:** Marcelo
- **Decisão do Luiz:** Autorizado arrancar fora as cascas nativas (Android e iOS) e alinhar a documentação com a verdade da rede social.

## 3. Comportamento, Plataformas e Risco

- **Plataformas afetadas:** Webapp Mobile e Desktop (Web moderna).
- **Estados obrigatórios da Arena:** Preservados intactos.
- **Maior risco de quebra ou mentira visual:** Quebrar algum script de build ou teste que ainda referencie cascas nativas ou caminhos antigos.
- **Limite da promessa:** Manter todos os testes e builds da web 100% verdes após a remoção.

## 4. Matriz de Aceite e Evidência (Marcelo & Rian → Tiago)

| Critério observável | Dono da prova | Ambiente exigido | Estado |
|---|---|---|---|
| README.md da raiz reflete a rede social Auê (Bonde, Comunidades, Arena e Grupos) | Marcelo / Rian | Código / Leitura | validado |
| docs/README.md e .agents/README.md sincronizados com a squad de 8 membros e links canônicos | Marcelo | Código / Leitura | validado |
| Conflito do ADR 0004 resolvido com sequência unívoca (ADR 0008) | Marcelo | Código / Leitura | validado |
| Pastas android/ e ios/ removidas junto com referências Capacitor e workflow de build Android | Marcelo / Camillo | Código / Git | validado |
| Protótipos antigos soltos arquivados em docs/_arquivo/ | Rian / Marcelo | Código / Git | validado |
| Typecheck, lint, test e build passam 100% sem erros (1414 testes verdes) | Marcelo | CLI (npm run ...) | validado |

## 5. Encerramento e Parecer Final

- **Arquivos/módulos alterados:**
  - `README.md` e `docs/README.md`: reescritos para espelhar a rede social, jornada e protótipos canônicos.
  - `.agents/README.md`: corrigido número de membros da squad para 8.
  - `docs/technical/adr/`: renomeado `0004-paginas-publicas-dos-grupos.md` para `0008-paginas-publicas-dos-grupos.md`, atualizado `README.md` e `0002-o-aue-nas-lojas.md` marcado como substituído.
  - `docs/escopo/ESCOPO_ATUAL.md`: referência atualizada para o ADR 0008.
  - `docs/_arquivo/prototipo-comunidade/`: movido protótipo legado solto para a pasta de arquivos históricos.
  - `android/`, `ios/`, `capacitor.config.ts`, `.github/workflows/build-android.yml`, `.env.casca`: removidos por completo.
  - `package.json`, `vite.config.ts`, `.gitignore`, `src/corte-de-producao.paridade.test.ts`: desvinculados de modo casca e Capacitor.
- **Parecer do Marcelo:** `SEM ACHADOS MATERIAIS` — a suíte de testes (129 arquivos, 1.414 testes) rodou com 100% de sucesso; typecheck e lint zerados; build de produção gerado sem falhas.
- **Veredito Final do Tiago:** `APROVADO` — documentação e estrutura do repositório sincronizadas com a verdade do produto (100% webapp mobile e desktop).
- **Pendências ou decisão necessária do Luiz:** Nenhuma.
