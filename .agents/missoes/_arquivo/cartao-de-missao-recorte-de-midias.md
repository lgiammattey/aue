# Cartão de Missão — recorte e publicação de imagens

## Dor e resultado esperado

Quem troca foto hoje não escolhe o enquadramento: o perfil corta no centro. Na
comunidade, pior: a foto e a capa aparecem como prévia local e o modal diz que
salvou, mas tudo some no recarregamento.

Ao escolher uma imagem, a pessoa deve abrir um modal de ajuste antes do envio.
Ele permite reposicionar e aproximar a foto, mostra a moldura certa para cada
uso e só confirma depois de o arquivo recortado estar persistido de verdade.

| Uso | Moldura | Saída |
| --- | --- | --- |
| Foto de perfil | 1:1 | JPEG 512 × 512 |
| Foto de comunidade | 1:1 | JPEG 512 × 512 |
| Capa de perfil | 3:1 | JPEG 1500 × 500 |
| Capa de comunidade | 3:1 | JPEG 1500 × 500 |

Aceita JPEG, PNG e WebP. A entrada pode ter até 10 MB, precisa ter ao menos
320 × 320 para fotos ou 1200 × 400 para capas e não pode ultrapassar 24 MP.
SVG, GIF e HEIC não entram nesta entrega. A saída normalizada respeita 2 MB
para foto e 3 MB para capa.

## Pista

**Full flow sistêmica.** Envolve API de navegador para recorte, porta
compartilhada, Storage, banco, RPC e RLS. A CTA de Arrotos já em WIP é uma
frente isolada e não muda de comportamento.

## Fora de escopo

- Arena, score, YAMNet e áudio;
- filtros, edição ou geração por IA;
- GIF animado, SVG, HEIC, vídeo e documentos;
- prévia `blob:` ou sucesso falso para mídia de comunidade.

## Critérios de aceite

1. Arquivo inválido por tipo, MB ou dimensão recebe motivo específico antes de
   abrir o editor.
2. Zoom e reposicionamento mudam o JPEG enviado, não apenas a prévia.
3. Perfil e comunidade persistem foto/capa, inclusive após recarregar.
4. O Storage e as RPCs rejeitam tipo, tamanho ou caminho fora do contrato.
5. Só criador ou moderador autorizado da comunidade pode publicar ou trocar a
   mídia dela; esconder botão não vale como permissão.
6. Modal é usável em desktop e webapp: foco, Escape, teclado, safe area e
   alvos de ao menos 44 px.
7. `typecheck`, `lint`, testes e build passam antes de qualquer merge.
