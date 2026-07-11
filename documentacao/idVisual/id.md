# IDENTIDADE VISUAL — ReMind
> Este arquivo define as regras obrigatórias de identidade visual do projeto ReMind.
> Sempre que produzir qualquer interface, componente, design, código CSS, apresentação ou material visual relacionado ao ReMind, siga estas regras à risca. Não improvise. Não substitua cores, fontes ou estilos por preferências próprias.

---

## 1. PALETA DE CORES

Use **exclusivamente** estas quatro cores. Nenhuma outra cor é permitida sem aprovação explícita.

| Nome | Hex | Uso obrigatório |
|---|---|---|
| Branco Neve | `#F5F6F4` | Fundo padrão de todas as páginas e áreas de leitura |
| Verde Névoa | `#A8C5C0` | Ícones, backgrounds secundários, divisores, elementos de respiro |
| Ciano Escuro | `#1A7A6E` | Cor primária — logotipo, títulos, botões principais, CTAs, destaques |
| Grafite Verde | `#1C2B2B` | Textos corridos, headers escuros, rodapés, fundos de contraste |

### Regras de uso das cores

- **Fundo padrão:** sempre `#F5F6F4` (Branco Neve)
- **Texto principal:** sempre `#1C2B2B` (Grafite Verde)
- **Botão primário:** fundo `#1A7A6E`, texto `#FFFFFF`
- **Botão outline:** borda `#1A7A6E`, texto `#1A7A6E`, fundo transparente
- **Elementos de apoio / separadores / badges secundários:** `#A8C5C0` (Verde Névoa)
- **Fundos escuros (ex: sidebar, header dark, splash):** `#1C2B2B` ou `#1A7A6E`
- **Ícones sobre fundo escuro:** `#FFFFFF`
- **Verde Névoa `#A8C5C0` nunca deve ser usado como cor de texto principal** — contraste insuficiente

### Tokens CSS obrigatórios

Sempre declare estas variáveis ao gerar CSS:

```css
:root {
  --color-white:    #F5F6F4;
  --color-mist:     #A8C5C0;
  --color-teal:     #1A7A6E;
  --color-graphite: #1C2B2B;
}
```

---

## 2. TIPOGRAFIA

### Fonte oficial: **Plus Jakarta Sans**

Nenhuma outra fonte é permitida. Use sempre Plus Jakarta Sans em todos os elementos de texto.

### Como importar

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;600;700;900&display=swap" rel="stylesheet">
```

```css
body {
  font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
}
```

### Pesos e aplicações obrigatórias

| Peso | Valor | Onde usar |
|---|---|---|
| Black | `900` | Logotipo, títulos de capa, chamadas principais |
| Bold | `700` | Subtítulos, labels, destaques |
| SemiBold | `600` | Botões, navegação, elementos interativos |
| Regular | `400` | Corpo de texto, descrições, parágrafos |
| Light | `300` | Legendas, metadados, textos auxiliares |

### Hierarquia tipográfica obrigatória

```css
/* Display / Logotipo */
font-size: 56px; font-weight: 900; color: #1A7A6E;

/* H1 */
font-size: 40px; font-weight: 900; color: #1C2B2B;

/* H2 */
font-size: 32px; font-weight: 700; color: #1C2B2B;

/* H3 */
font-size: 24px; font-weight: 600; color: #1C2B2B;

/* Body */
font-size: 16px; font-weight: 400; color: #1C2B2B; line-height: 1.7;

/* Small / Labels */
font-size: 14px; font-weight: 400; color: #1C2B2B;

/* Caption */
font-size: 12px; font-weight: 300; color: rgba(28,43,43,0.7);
```

---

## 3. LOGOTIPO E SÍMBOLO

### Conceito (entenda antes de usar)

O símbolo do ReMind é composto por **dois elos/balões interligados** que carregam dupla leitura:
- Vistos como **corrente** → representam o ciclo da dependência digital
- Vistos como **balões de conversa** → representam a intervenção clínica

O elo da esquerda é sólido (comportamento consolidado). O elo da direita tem uma quebra no traço (o momento do diagnóstico que rompe o ciclo).

### Cores do símbolo

- **Elo esquerdo (sólido):** `#1A7A6E` (Ciano Escuro)
- **Elo direito (com abertura):** `#A8C5C0` (Verde Névoa)
- **Texto "Remind":** `#1A7A6E` (Ciano Escuro), fonte Plus Jakarta Sans

### Variações permitidas

| Variação | Fundo | Símbolo | Texto |
|---|---|---|---|
| Principal (padrão) | `#F5F6F4` ou `#FFFFFF` | Bicolor (`#1A7A6E` + `#A8C5C0`) | `#1A7A6E` |
| Escura | `#1C2B2B` | `#FFFFFF` | `#FFFFFF` |
| Teal | `#1A7A6E` | `#FFFFFF` | `#FFFFFF` |
| Ícone claro | `#FFFFFF` | Bicolor (`#1A7A6E` + `#A8C5C0`) | — |
| Ícone escuro | `#1A7A6E` | `#FFFFFF` | — |

### O que nunca fazer com o logotipo

- Nunca distorcer ou alterar as proporções
- Nunca trocar as cores por outras não previstas acima
- Nunca adicionar sombra, gradiente ou brilho
- Nunca colocar sobre fundo de baixo contraste
- Nunca recriar o símbolo manualmente com formas genéricas
- Nunca separar os elos como elementos independentes
- Nunca rotacionar o logotipo

---

## 4. ESPAÇAMENTO

Use sempre múltiplos de 8px. Declare como variáveis:

```css
:root {
  --space-xs:  4px;
  --space-sm:  8px;
  --space-md:  16px;
  --space-lg:  24px;
  --space-xl:  32px;
  --space-2xl: 48px;
  --space-3xl: 64px;
}
```

---

## 5. BORDER RADIUS

```css
:root {
  --radius-sm:   4px;
  --radius-md:   8px;
  --radius-lg:   12px;
  --radius-xl:   16px;
  --radius-full: 9999px;
}
```

Botões usam `--radius-full` por padrão.
Cards e containers usam `--radius-lg` ou `--radius-xl`.

---

## 6. COMPONENTES PADRÃO

### Botão primário
```css
background-color: #1A7A6E;
color: #FFFFFF;
font-family: 'Plus Jakarta Sans', sans-serif;
font-weight: 600;
font-size: 16px;
border-radius: 9999px;
padding: 12px 32px;
border: none;
```

### Botão outline
```css
background-color: transparent;
color: #1A7A6E;
font-family: 'Plus Jakarta Sans', sans-serif;
font-weight: 600;
font-size: 16px;
border-radius: 9999px;
padding: 12px 32px;
border: 2px solid #1A7A6E;
```

### Card padrão
```css
background-color: #FFFFFF;
border-radius: 12px;
padding: 24px;
/* sem border, usa sombra sutil se necessário */
box-shadow: 0 1px 4px rgba(28, 43, 43, 0.08);
```

### Sidebar / Header escuro
```css
background-color: #1C2B2B;
color: #FFFFFF;
```

### Badge / Tag secundária
```css
background-color: #A8C5C0;
color: #1C2B2B;
border-radius: 9999px;
font-size: 12px;
font-weight: 600;
padding: 4px 12px;
```

---

## 7. ÍCONES

- Estilo: **outline** (traço), com terminais arredondados
- Cor primária: `#1A7A6E`
- Cor secundária / apoio: `#A8C5C0`
- Sobre fundos escuros: `#FFFFFF`
- Tamanhos padrão: `16px`, `24px`, `32px`, `48px`

---

## 8. ACESSIBILIDADE

| Combinação | Contraste | Status |
|---|---|---|
| `#1A7A6E` sobre `#F5F6F4` | ~5.8:1 | ✅ WCAG AA |
| `#1C2B2B` sobre `#F5F6F4` | ~14.2:1 | ✅ WCAG AAA |
| `#FFFFFF` sobre `#1C2B2B` | ~14.2:1 | ✅ WCAG AAA |
| `#FFFFFF` sobre `#1A7A6E` | ~5.8:1 | ✅ WCAG AA |
| `#A8C5C0` sobre `#F5F6F4` | ~2.1:1 | ❌ Só decorativo |

**Nunca usar `#A8C5C0` como cor de texto.** Apenas para elementos decorativos, ícones e fundos secundários.

### 8.1 Tabela de contraste estendida (adendo — redesign UI/UX, jul/2026)

Validada por cálculo de luminância relativa (WCAG). Cobre combinações usadas na prática
(ex. badges de faixa de risco, sidebar) que a tabela acima não cobria.

| Combinação | Contraste | Uso permitido |
|---|---|---|
| Grafite-Verde sobre Branco-Neve | 13.55:1 | Texto em qualquer tamanho/peso |
| Ciano-Escuro sobre Branco-Neve | 4.78:1 | Texto normal — evitar peso `font-light` (margem apertada) |
| Branco sobre Ciano-Escuro | 5.18:1 | Botão primário, badge de risco "Moderado" |
| Branco sobre `#0B4A42` (teal escuro, risco "Alto") | 10.13:1 | Seguro para qualquer peso |
| **Branco sobre `#7AB1A8` (teal claro, risco "Baixo")** | **2.42:1** | ❌ **Proibido** — usar Grafite-Verde (6.07:1) em vez de branco |
| Grafite-Verde sobre Verde-Névoa (chip/badge) | 7.98:1 | Único jeito seguro de "ativar" Verde-Névoa com texto em cima |
| **Ciano-Escuro sobre Grafite-Verde** | **2.83:1** | ❌ **Nunca** usar Ciano-Escuro como texto/ícone sobre fundo escuro (ex. sidebar) — usar branco |

---

## 9. FOTOGRAFIA E IMAGENS

Quando precisar sugerir ou usar imagens:

- Contexto: consultórios, clínicas, profissionais de saúde mental, laptops, smartphones em ambientes tranquilos
- Paleta das fotos: tons neutros, verdes naturais, ambientes organizados e acolhedores
- Evitar: imagens genéricas de stock sem contexto clínico, cores vibrantes fora da paleta, cenas de crise ou sofrimento extremo

---

## 10. TOM VISUAL GERAL

Toda interface ReMind deve transmitir simultaneamente:

- **Confiança** — layout limpo, hierarquia clara, tipografia legível
- **Precisão** — uso consistente de cores e espaçamentos
- **Acolhimento** — terminais arredondados, espaço em branco generoso, cores suaves
- **Modernidade** — sem excessos decorativos, interface funcional

A marca é **profissional sem ser fria**, **tecnológica sem ser asséptica**, **clínica sem ser intimidadora**.

---

## 11. CHECKLIST ANTES DE ENTREGAR QUALQUER VISUAL

Antes de finalizar qualquer interface ou material visual para o ReMind, confirme:

- [ ] Apenas as 4 cores da paleta foram usadas
- [ ] A fonte é Plus Jakarta Sans em todos os elementos
- [ ] Os pesos tipográficos seguem a hierarquia definida
- [ ] O fundo padrão é `#F5F6F4`
- [ ] Textos estão em `#1C2B2B`
- [ ] Botões primários estão em `#1A7A6E` com texto branco
- [ ] Nenhum elemento usa `#A8C5C0` como cor de texto
- [ ] Border radius segue o sistema definido
- [ ] Espaçamentos são múltiplos de 8px
- [ ] O logotipo está na variação correta para o fundo usado

---

*ReMind Visual Identity System · V1.00 · 2026 · KOHESA*