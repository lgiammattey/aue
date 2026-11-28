# Preservação do protótipo aprovado — AUÊ V2 (M05)

Este registro documenta o resgate e a preservação do protótipo visual do **AUÊ V2** (M05), aprovado pelo Product Owner.

## Origem identificada

- **Servidor local original:** `Python -u -m http.server --bind 127.0.0.1 8765` (PID `10448`)
- **Diretório de origem:** `/Users/giammattey/.codex/worktrees/aue-m05-experience/aue` (Git worktree do Codex)
- **Branch e commit de origem:** `codex/m05-experience` (`eaa43ec`)
- **URL do protótipo:** `/docs/missoes/m05/prototipo/`
- **Referência secundária em execução:** `127.0.0.1:8766` (PID `13537`) servindo `/tmp/aue-m05-v1.tWBRwS` (snapshot da V1 usado em `comparativo.html`)

## Arquivos necessários para reproduzir o protótipo

- `docs/missoes/m05/prototipo/` (HTML, CSS, JS, áudios `.wav`, vídeo `resenha-demo.mp4`, ilustrações `.webp` e capturas originais em `capturas/`)
- `public/fonts/anton-latin.woff2` e `public/fonts/archivo-latin.woff2` (referenciadas via `../../../../public/fonts/` em `style.css` e `comparativo.html`)
- `public/ilustracoes/como-arrotar-postura-codex.png` e `public/ilustracoes/como-arrotar-comando-codex.png` (referenciadas via `../../../../public/ilustracoes/` em `index.html`)

Nenhum arquivo do protótipo original foi alterado ou sobrescrito nesta branch. Nenhuma credencial ou segredo foi incluído.

## Como executar de forma independente

Na raiz de um clone ou worktree da branch `reference/aue-v2-approved`:

```bash
python3 -m http.server --bind 127.0.0.1 8765
```

Depois, abra `http://127.0.0.1:8765/docs/missoes/m05/prototipo/` no navegador.

## Capturas de referência

As capturas de todas as telas em desktop (`1440x900`) e mobile (`390x844`), geradas a partir de uma execução independente desta cópia preservada sem erros de console nem requisições com erro, estão salvas em `docs/missoes/m05/prototipo/capturas-referencia/`.
