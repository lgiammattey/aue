---
name: design-ux
description: "Procedimento do Felipe para desenhar a UX do Auê: Arena, nota, X1 e Mural em desktop e webapp."
---

# Skill: design-ux

Procedimento do **Felipe** para desenhar a experiência do Auê. A definição do produto é [`docs/jogo/AUE.md`](../../../docs/jogo/AUE.md) e a jornada está em [`docs/jogo/JORNADA.md`](../../../docs/jogo/JORNADA.md).

## 1. A jornada de referência

Antes de especificar ou alterar uma tela, confirme a rota, flags, componente canônico e estado real no mapa e no código. A jornada abaixo orienta apenas fluxos autorizados: não afirma que gravação, nota ou duelo estejam ativos em toda rota ou ambiente.

1. **Entrada:** quando o fluxo de jogo estiver disponível, a pessoa deve conseguir encontrar gravar e mandar sem atrito indevido.
2. **Arena:** permissão do microfone, calibração, gravação e revisão só entram nos estados já permitidos pela Arena ativa.
3. **Resiliência:** microfone negado, silêncio e falha de rede viram erro claro com saída para tentar de novo. Nunca fingir sucesso.
4. **Depois da nota:** se o resultado existir no fluxo autorizado, os caminhos possíveis seguem o contrato ativo: desafiar no X1, tentar de novo ou ir ao mural.
5. **X1:** link de desafio, resposta, resultado provisório e revanche dependem da rota e do contrato ativos; não criar estado por esta descrição.
6. **Mural e perfil:** publicação, perfil e ranking seguem o que a rota e o contrato expõem. Publicar exige autorização explícita.

Não há protótipos: tela nova é proposta pelo Felipe e aprovada pelo Product Owner antes do código. Antes de mexer em tela, consulte o [mapa de telas](../../../docs/design/MAPA_DE_PAGINAS_E_FLUXOS.md).

---

## 2. Padrões de Layout Responsivo (3 Larguras)

1. **Desktop (>= 1060px):**
   - 3 colunas: Barra de navegação esquerda (275px), Área central com Arena ou mural (600px), Barra lateral de tendências e ranking (320px).
2. **Tablet (700px a 1059px):**
   - Menu esquerdo encolhido em ícones (76px) para privilegiar o conteúdo.
3. **Webapp Mobile (< 700px):**
   - Header minimalista superior (53px).
   - Barra de navegação inferior (56px) para troca entre Início, Desafios e Perfil.
   - Botão flutuante (FAB) verde para nova postagem ou arroto rápido.
   - Respeito à safe area e piso de 44px para qualquer alvo tocável.

---

## 3. As 4 Trava-Regras de UX

1. **O áudio toca num clique só:** Sem redirects nem telas intermediárias para escutar o arroto de outra pessoa.
2. **Da abertura ao arroto em menos de 10 segundos:** Zero atrito para quem quer arrotar na hora.
3. **O perdedor nunca é humilhado com vermelho:** Vermelho é erro de sistema; a zoeira de jogo se sustenta na nota e na revanche.
4. **Revanche sem tela de fim:** O resultado do X1 nunca diz "acabou"; diz "vai deixar assim?" e engatilha o próximo arroto.
