# Cartão de Missão — Mídias reais das comunidades

## Enquadramento

- **Dor:** foto, capa e até a apresentação de algumas comunidades tinham fallback no código, então não eram conteúdo real da comunidade.
- **Resultado:** avatar e capa são sempre lidos das colunas `caminho_do_avatar` e `caminho_da_capa`, por meio do bucket `midias_de_comunidades`; o fluxo administrativo normal recorta, normaliza e grava a mídia.
- **Fora de escopo:** URL arbitrária, cópia de marca de terceiro ou imagem apresentada como original sem ter sido enviada ao Storage.
- **Pista:** Full flow comum — contrato existente, sem tabela, RLS ou RPC nova.

## Aceite

| Critério | Evidência | Estado |
|---|---|---|
| A interface não contém fallback de arquivo público por slug | teste de fonte | passou |
| A administração chama foto e capa de comunidade, não de perfil | teste do modal | passou |
| As imagens aparecem após upload normal de cada comunidade | navegador + Storage remoto | pendente externo |

## Limite atual

O repositório não contém um canal que suba binários para o Storage no merge. Cada imagem deve ser enviada pelo modal administrativo da comunidade; é assim que a RPC valida o caminho, o JPEG e a permissão do moderador antes de persistir a referência.
