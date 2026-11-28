# M05 | Experiência do Auê 2.0

Luiz autorizou a implementação e definiu o protótipo mais recente como referência. A missão parte da `develop` em `dd0e102` e preserva o protótipo de `499ff29`. A aprovação da entrega pelo Product Owner é posterior à validação.

Quem entra precisa achar a gravação de cara, decidir o que fazer com a tentativa e ouvir o que a galera publicou. Início, Resenha, Arrotar, Disputas e Perfil formam a navegação. A tela mantém Carbono, Laranja Elétrico, Anton e Archivo. O jogo solo aceita visitante, e a gravação da Arena passa por uma confirmação separada antes de ser publicada. Desafios continuam privados e com comparação experimental.

| Área | Prova esperada |
|---|---|
| Início e Resenha | PT/EN, cinco publicações elegíveis, reprodução, indicação de novas sem trocar o áudio em uso, avaliações confirmadas, formatos e ações existentes |
| Arrotar e Disputas | Gravação, revisão, descarte, consentimento, convite, resposta, recuperação, expiração e áudio restrito a quem pode ouvir |
| Perfil | Identidade, publicações, seguidores e dados disponíveis, sem atribuir patente ou consequência competitiva |
| Interface e publicidade | Desktop e mobile em Chromium e WebKit, comparação com o protótipo, largura travada, anúncios simulados em placements compatíveis com o jogo |
| Dados e qualidade | Supabase isolado, sessão anônima habilitada, dados sintéticos, permissões, migrations, typecheck, lint, testes e build |

Marcelo enquadra e dá o parecer. Felipe aplica a referência visual. Camillo responde pela arquitetura, áudio e contratos. Renan faz a revisão final de quem não escreveu o produto. Os perfis disponíveis foram usados por função no ambiente.

A avaliação positiva/negativa reutiliza as RPCs dos tópicos, que já atendem publicações pessoais. A publicação da Arena reutiliza o Storage privado e o compositor. O único acréscimo de schema aceita WAV no contrato de anexos, preservando autoria, visibilidade, tamanho e duração. Em rollback do aplicativo, manter o suporte a WAV enquanto houver conteúdo nesse formato.

Vitória oficial, XP, patentes, votação de disputas e disputas públicas ficam fora desta entrega. A M05 termina na PR em rascunho para `develop`. A autorização cobre testes e mudanças exclusivamente locais no Supabase. M06 depende de decisão do Luiz.
