---
name: design-ux
description: Procedimento do Diego para desenhar a UX do Auê: a Arena de gravar e mandar, a nota, o X1 e o mural, em desktop e webapp.
---

# Skill: design-ux

Procedimento do **Diego** para desenhar a experiência do Auê. A definição do produto é [`docs/jogo/AUE.md`](../../../docs/jogo/AUE.md) e a jornada está em [`docs/jogo/JORNADA.md`](../../../docs/jogo/JORNADA.md).

## 1. A jornada

1. **Entrada:** a pessoa vê uma coisa, gravar e mandar. Sem conta, sem explicação antes.
2. **Arena:** permissão do microfone, calibração, gravação e revisão.
3. **Resiliência:** microfone negado, silêncio e falha de rede viram erro claro com saída para tentar de novo. Nunca fingir sucesso.
4. **Depois da nota:** a nota do juiz e três caminhos, desafiar no X1, tentar de novo ou ir ao mural.
5. **X1:** link de desafio, resposta de quem recebe, resultado provisório e revanche.
6. **Mural e perfil:** arrotos publicados, perfil e ranking. Publicar exige autorização explícita.

Protótipos de referência em `docs/design/prototipo/`. Antes de mexer em tela, consulte o [mapa de telas](../../../docs/design/MAPA_DE_PAGINAS_E_FLUXOS.md).

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
