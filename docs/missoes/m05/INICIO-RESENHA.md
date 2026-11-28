# Início com Resenha

A proposta coloca a prévia **Na Resenha** após o primeiro espaço publicitário. Os cinco posts são exemplos locais, com áudio sintético e o mesmo visual de publicação e player da Resenha. A seção também abre Disputas e reserva um lugar para talentos públicos quando houver dados.

Em **Simular estados da Resenha**, use **Chegar publicação** para mostrar o indicador **Novos na Resenha**. O conteúdo atual permanece até a pessoa pedir a atualização. Se um áudio estiver tocando, a prévia pede para pausá-lo antes de trocar os posts. **Sem publicações** mostra o estado vazio e **Restaurar exemplos** volta aos cinco posts. O áudio usa preload none e a reprodução começa por escolha do visitante.

A seção também aparece em inglês como **In the Hangout**, com exemplos e controles de simulação localizados.

## Para a implementação após aceite

Camillo encontrou paginação existente que reúne publicações pessoais e tópicos, com cursor de data e identificador em [paginacaoDoMural.ts](../../../src/features/novo-aue/paginacaoDoMural.ts) e consulta em [forum.ts](../../../src/plataforma/web/forum.ts). A consulta de publicações pessoais filtra estados e autor, e as policies de Storage restringem anexos a conteúdo visível. A publicação de áudio deve respeitar o fluxo de consentimento aplicável. Antes de integrar, verificar a definição vigente de denúncia, ocultação e conteúdo elegível nos serviços implantados.

A primeira opção a avaliar é repetir a consulta existente em intervalo de baixo custo e sinalizar diferenças por identificador, sem trocar o feed em uso. Realtime exigiria verificar publicação de eventos e permissões, e tratar evento apenas como sinal para consultar de novo pela mesma regra de elegibilidade. O código inspecionado não comprovou uma inscrição Realtime de feed. A política de frequência, custo e comportamento em desconexão precisa ser medida no ambiente autorizado.

Nenhuma fonte remota, configuração Realtime ou política aplicada foi verificada nesta rodada. Posts reais, serviço de áudio, aparelho físico e autenticação continuam fora da prova do protótipo.
