/* Otimizações para imagens da Belz */

## Status Atual
- ✅ Logo: PNG (adequado para logo com transparência)
- ❓ Sala: JPG (pode ser otimizado)

## Recomendações:

### 1. **Para o logo (logo-belz.png):**
- **Manter PNG** se tiver transparência
- **Converter para SVG** se for um logo simples (melhor escalabilidade)
- Tamanho recomendado: máximo 50KB

### 2. **Para a foto da sala (sala.jpg):**
- **Opção 1 - WebP**: Melhor compressão (até 30% menor)
- **Opção 2 - JPG otimizado**: Máximo 200KB, qualidade 80-85%
- **Opção 3 - PNG**: Se precisar de transparência
- **Evitar SVG**: Não adequado para fotos reais

### 3. **Implementar imagens responsivas:**
```html
<picture>
  <source srcset="sala.webp" type="image/webp">
  <source srcset="sala.jpg" type="image/jpeg">
  <img src="sala.jpg" alt="Sala de Reunião">
</picture>
```

### 4. **Lazy loading já implementado** ✅

### 5. **Service Worker melhorado** ✅

## Ação Recomendada:
1. Substitua sala.jpg por uma versão otimizada (WebP + fallback JPG)
2. Reduza o tamanho para web (máximo 1200px largura)
3. Mantenha o PNG do logo (se tiver transparência)

## Ferramentas para otimização:
- TinyPNG/TinyJPG
- Squoosh (Google)
- ImageOptim
