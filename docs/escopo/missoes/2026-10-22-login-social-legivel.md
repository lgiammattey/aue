# Cartão de Missão — entradas sociais legíveis no login

- **Pedido:** corrigir o X duplicado e o aviso cortado mostrado pelo Luiz.
- **Pista:** Fast lane; apenas o bloco social do login canônico em `InicioOpenDesign`.
- **Aceite esperado:** uma marca por provedor, aviso “Em breve” integral em 320, 390 e 1440 px, alvos de 44 px e controles indisponíveis desabilitados.
- **Fora de escopo:** tema, cores, demais componentes do login, autenticação social e publicação.
- **Implementação:** Kayky no JSX/CSS do bloco; agente principal na prova de regressão e revisão visual.
- **Prova:** 9/9 cenários do contrato visual passaram; os três novos cenários cobrem 320, 390 e 1440 px, duplicação, aviso completo, estado desabilitado e alvos de 44 px. Typecheck passou. Capturas do servidor local foram abertas e revisadas.
- **Aceite:** aprovado no escopo. Uma marca X, aviso integral nos dois provedores e tema anterior preservado. Nada publicado.
