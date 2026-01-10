# Instruções para Gerar Ícones do PWA

## Opção 1: Usar Ferramenta Online (Recomendado)

1. Acesse: https://realfavicongenerator.net/ ou https://favicon.io/
2. Faça upload do arquivo `icon.svg` que está na pasta `public`
3. Configure:
   - Tamanho: 192x192 e 512x512
   - Formato: PNG
4. Baixe os ícones gerados
5. Salve como:
   - `public/icon-192.png` (192x192)
   - `public/icon-512.png` (512x512)

## Opção 2: Usar ImageMagick (Linha de Comando)

Se você tiver ImageMagick instalado:

```bash
# Converter SVG para PNG 192x192
magick convert -background none -resize 192x192 public/icon.svg public/icon-192.png

# Converter SVG para PNG 512x512
magick convert -background none -resize 512x512 public/icon.svg public/icon-512.png
```

## Opção 3: Usar Node.js Script

Crie um script temporário para converter:

```javascript
// convert-icons.js
const fs = require('fs');
const { createCanvas } = require('canvas');

// Ler SVG e converter para PNG
// (requer biblioteca canvas ou sharp)
```

## Nota

Por enquanto, o PWA funcionará mesmo sem os ícones PNG perfeitos.
O navegador usará o SVG como fallback, mas é recomendado ter os PNGs
para melhor compatibilidade com todos os dispositivos.
