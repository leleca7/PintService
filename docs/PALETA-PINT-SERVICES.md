# Paleta visual de trabalho — Pint Services

Enquanto não houver um manual de marca oficial fornecido pela Pint Services, o PintService deve seguir a identidade observada na marca existente.

## Paleta principal

- Dourado da marca: `#BD9558`
- Preto: `#090A0A`
- Grafite: `#17191C`
- Cinza institucional: `#8F918D`
- Fundo mineral: `#F3F1EC`
- Branco: `#FFFFFF`

## Regra de uso

O dourado é a única cor decorativa/institucional de destaque. Laranja não deve ser introduzido em botões, navegação, cards, linhas, badges, gradientes ou estados informativos.

Cores semânticas continuam permitidas quando comunicam estado operacional:

- verde: concluído, disponível, OK;
- vermelho: erro, urgência real, sobrecarga crítica;
- dourado: atenção, espera, parcial, no limite, seleção ou destaque institucional;
- cinza: neutro, inativo, sem informação ou sem pedido.

## Implementação

Os tokens globais ficam em `app/precision-tokens.css` e a consolidação/compatibilidade com estilos legados fica em `app/brand-palette.css`, carregado por último no layout raiz.

Novas telas devem preferir os tokens e variáveis de marca em vez de valores de cor hard-coded.
