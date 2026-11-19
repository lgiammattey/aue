# Missão 0038 — Player da Arena

- **Dor:** o reprodutor padrão do navegador destoa da Arena e varia entre aparelhos.
- **Pedido:** um player compacto inspirado em áudio de conversa, com WaveSurfer, play, pausa, tempo e onda real navegável na revisão da Arena.
- **Pista:** full flow comum com revisão de plataforma: a captura, a medição, o compartilhamento e o contrato de duelo continuam os mesmos.
- **Desenho:** botão de play, barras discretas que representam o arquivo, progresso e tempo; acessível por toque e teclado. Se a onda falhar, manter o player nativo e o áudio original.
- **Privacidade:** usar somente o Blob local existente. Não enviar para nenhum serviço nem trocar o áudio da tentativa. Soltar a instância e o endereço local ao sair; pausar antes de avançar ao duelo.
- **Evidência:** WaveSurfer 8.1.0; typecheck, lint e build passaram. Na missão 0039 o player foi reaproveitado no resultado e em Meus Duelos, após o carregamento autorizado do áudio. Chromium verificou play/pause e posição com áudio sintético; testes verificam fallback nativo e limpeza da inicialização tardia. iPhone, Android e audição física seguem sem prova.
- **Aceite:** com ressalvas para revisão local; não publicado.
