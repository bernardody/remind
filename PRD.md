# ReMind UI/UX Redesign PRD

> Documento de requisitos para a reformulação de UI/UX do ReMind — plataforma clínica
> que auxilia psicólogos na avaliação do uso problemático de redes sociais por
> adolescentes via escalas psicométricas digitais.
> **Baseado em:** auditoria completa do código-fonte (`remind-web/`, 14 telas + design
> system), leitura de `documentacao/idVisual/id.md` e `.claude/specs/{02-frontend-prd,04-spec-aplicacao}.md`,
> e pesquisa externa (shadcn/ui, Radix, Material Design 3, Apple HIG, Nielsen Norman
> Group, Linear/Notion/Stripe/Vercel, SimplePractice/TherapyNotes/Doctolib, WCAG 2.1/2.2).
> **Status:** proposta para aprovação. Nenhuma alteração de código foi feita — este
> documento é só planejamento, conforme solicitado.
> **Estado do produto:** Fases 0–5a **já em produção** com usuários reais (ver
> `.claude/specs/04-spec-aplicacao.md`). Este não é um redesign de MVP no papel — é a
> evolução de um produto que já funciona. Qualquer mudança proposta aqui precisa
> respeitar isso: nada de "big bang", migração incremental sem quebrar o que já roda.

---

## 1. Visão Geral

### 1.1 Objetivos do redesign

1. **Fechar o gap entre a promessa de marketing e o produto real.** A landing page
   (`app-showcase.tsx`, `solution.tsx`) mostra um dashboard rico — "Risco alto: 7",
   avaliações recentes, gráfico vermelho/âmbar/verde — que **não existe** no produto
   autenticado. O dashboard real do psicólogo tem 2 cards de contagem. Isso não é só
   estética: é a primeira impressão de um cliente pagante depois da demo.
2. **Completar a especificação do design system.** O produto já usa shadcn/ui + Radix
   corretamente (acessível, tokenizado), mas cobre menos da metade dos componentes que
   um SaaS clínico denso em dados precisa: faltam Tabs, Breadcrumbs, Tooltip, Popover,
   Avatar, Command palette, Calendário, Progress standalone. Cada tela nova hoje reinventa
   padrão ad-hoc (ex.: badges de contagem como `<span>` cru em vez de `<Badge>`).
3. **Corrigir bugs de acessibilidade e consistência já identificados e verificados**
   nesta auditoria — não teóricos, encontrados lendo o código real e validados com
   cálculo de contraste WCOAG real (ver §2.3).
4. **Resolver a tensão entre paleta de marca restrita (4 cores, obrigatória) e
   necessidade de codificação visual de risco clínico** — hoje resolvida de duas formas
   diferentes e conflitantes no mesmo produto (rampa monocromática no app real vs.
   semáforo vermelho/âmbar/verde no mock da landing).
5. **Elevar duas experiências muito diferentes dentro do mesmo app**: o psicólogo
   (power user, sessões longas, densidade de dados) e o adolescente paciente
   (sessão única, mobile-first, baixa tolerância a atrito, viés de resposta Likert
   documentado em adolescentes — ver §3.6).
6. **Remover bloqueadores de produção** encontrados durante a auditoria (texto legal
   "provisório" ainda em produção — ver §2.2).

### 1.2 Problemas encontrados (resumo executivo)

Catalogados em detalhe nas seções 2 e 5; os de maior impacto:

| # | Problema | Onde | Severidade |
|---|---|---|---|
| 1 | Dashboard do psicólogo raso vs. promessa da landing | `psicologo/dashboard` | Alta |
| 2 | Esquema de cor de risco inconsistente (mono teal vs. semáforo) | `lib/constants.ts` vs. `marketing/solution.tsx` | Alta |
| 3 | Texto legal "⚠️ provisório" em produção | `privacidade/`, `termos/` | **Bloqueador** |
| 4 | Badge de risco "Baixo" com texto branco reprova WCAG AA (2.42:1) | `gauge.tsx`, `domain-bars.tsx` | Alta (a11y) |
| 5 | Wizard do paciente não persiste progresso (perda de dados ao fechar aba) | `stores/wizard-store.ts` | Alta |
| 6 | Busca de pacientes é só client-side da página carregada, não busca real | `patients-view.tsx` | Média |
| 7 | Telas de Perfil (psicólogo e paciente) são 100% somente-leitura | `*/perfil/page.tsx` | Média |
| 8 | Sem evolução longitudinal em lugar nenhum do produto | `relatorios/` (placeholder) | Média (produto, não deste PRD) |
| 9 | Radiogroup do wizard reimplementado à mão, sem navegação por seta | `question-step.tsx` | Média (a11y) |
| 10 | Rótulo de ação ("Remover") não condiz com o comportamento real (inativação) | `patients-view.tsx` | Baixa |
| 11 | Design system incompleto (faltam 8 componentes de uso comum) | `components/ui/` | Estrutural |
| 12 | Modal (`Dialog`) sem contraste de elevação com o fundo da página | `dialog.tsx` | Baixa |

### 1.3 Justificativa

Este não é um redesign estético isolado — é justificado por evidência de três fontes:

- **Código real**: os problemas acima foram lidos diretamente no código-fonte e, no
  caso do contraste do badge de risco, **verificados por cálculo de luminância relativa
  WCOAG** (não é opinião — é reprovação objetiva: 2.42:1 contra o mínimo de 4.5:1 exigido
  para texto normal).
- **Padrão de mercado em produtos de saúde**: a Doctolib documenta publicamente que,
  em software clínico, "um erro de design pode levar a uma decisão médica errada" —
  acessibilidade e clareza de leitura de escore não são polimento, são requisito de
  segurança do paciente. O padrão de qualidade citado na categoria (SimplePractice vs.
  TherapyNotes) é: "parecer um produto de consumo bem feito, com rigor clínico por trás"
  — não "parecer confiável porque é burocrático".
- **Pesquisa de usabilidade aplicada**: Nielsen Norman Group tem heurísticas específicas
  para aplicações complexas de domínio (não SaaS genérico) diretamente aplicáveis às
  telas de maior densidade deste produto (lista de pacientes, resultado clínico, wizard).

---

## 2. Auditoria da Interface Atual

### 2.1 Pontos positivos (preservar no redesign)

A base é sólida — o redesign deve **estender**, não recomeçar:

- **Stack madura e correta para o caso de uso**: Next.js 15 App Router + Tailwind v4 +
  shadcn/ui (estilo "new-york") + Radix UI. Componente por componente, o código já
  segue convenções corretas de composição shadcn (`data-slot`, `cva` para variantes,
  `cn()` para merge de classes).
- **Acessibilidade real, não decorativa**: `Gauge` e `DomainBars` usam `role="img"` com
  `aria-label` textual completo, nunca dependem só de cor para comunicar nível de risco
  (texto "Risco {label}" sempre visível), e tratam `riskLabel: null` com "Sem faixa" em
  vez de quebrar. `components/ui/form.tsx` encadeia `aria-describedby`/`aria-invalid`
  corretamente em todos os formulários.
- **Tokens de marca bem implementados**: `app/globals.css` declara os 4 tokens
  canônicos (`--color-white/mist/teal/graphite`) e os expande em tokens semânticos
  shadcn (`--primary`, `--muted`, `--accent` etc.) sem perder rastreabilidade à
  identidade visual original.
- **Grid de espaçamento de 8px respeitado** de forma consistente em toda a aplicação.
- **Estados padronizados**: `LoadingState`/`EmptyState`/`ErrorState` existem como
  componentes reutilizáveis e são usados de forma consistente nas telas com dados
  assíncronos (RF-21 do PRD original, cumprido).
- **Decisões de produto documentadas no próprio código** (comentários explicando *por
  que* uma limitação existe, não só *que* existe) — isso é maturidade de engenharia rara
  e deve ser preservado como convenção ao longo do redesign.
- **Testado em produção com usuários reais**, não é mockup — qualquer mudança precisa
  ser incremental e não regressiva (ver risco R12 do histórico: um deploy sem migração
  de schema já derrubou produção uma vez).

### 2.2 Problemas (por categoria)

**Bloqueador de release**
- `(marketing)/privacidade/page.tsx` e `(marketing)/termos/page.tsx` exibem literalmente
  `⚠️ Texto provisório, a ser revisado juridicamente antes da publicação em produção.`
  — isso está em produção agora. Precisa virar conteúdo jurídico real ou, no mínimo, um
  aviso controlado de produto (não um comentário de desenvolvimento vazando pro usuário).

**Gap de promessa vs. produto**
- `components/marketing/app-showcase.tsx` mostra um dashboard fake com "Pacientes
  ativos: 48", "Risco alto: 7", "Avaliações recentes" com badges coloridas — nada disso
  existe em `psicologo/dashboard/page.tsx`, que hoje só tem 2 cards de contagem total.
- `components/marketing/solution.tsx` usa um gráfico de exemplo com cores
  vermelho/âmbar/verde (`#C0432F`/`#E0A21F`/`#1A7A6E`) rotuladas Alto/Moderado/Baixo —
  o produto real nunca usa essas cores para risco (usa rampa monocromática de teal). A
  landing promete uma linguagem visual que o produto não cumpre.

**Acessibilidade (verificada por cálculo, não estimativa)**

| Combinação real usada no código | Contraste calculado | Resultado |
|---|---|---|
| Texto branco sobre `#7AB1A8` (badge "Risco Baixo" em `gauge.tsx`/`domain-bars.tsx`) | **2.42:1** | ❌ Reprova AA (mín. 4.5:1) |
| Texto branco sobre `#1A7A6E` (badge "Risco Moderado") | 5.18:1 | ✅ Passa AA |
| Texto branco sobre `#0B4A42` (badge "Risco Alto") | 10.13:1 | ✅ Passa AAA |
| Texto Grafite-Verde sobre `#7AB1A8` (alternativa) | 6.07:1 | ✅ Passa AAA |

  → **Correção obrigatória, não opcional**: o badge de nível "Baixo" (o nível mais
  citado, já que é o mais comum estatisticamente) está ilegível para uma fração real de
  usuários com baixa visão. Fix é trivial (texto Grafite-Verde em vez de branco quando o
  fundo é o tom claro da rampa) — ver §4.18.
- Radiogroup do wizard (`features/questionnaires/components/wizard/question-step.tsx`)
  é reimplementado com `<button role="radio">` em vez do primitivo Radix `RadioGroup`
  — funciona com leitor de tela (tem `aria-checked`), mas não implementa navegação por
  seta (↑↓) esperada num `role="radiogroup"` real.
- Coluna "Ações" da tabela de pacientes tem `header: ""` — leitor de tela anuncia coluna
  sem nome.

**Inconsistências de componente**
- `Dialog` (`components/ui/dialog.tsx:64`) usa `bg-background` — a mesma cor do fundo
  da página (`Branco-Neve`). Um modal deveria ter contraste de elevação com o que está
  atrás dele; hoje só a sombra (`shadow-lg`) e a borda separam visualmente. Card
  (`bg-card` = branco puro) resolve isso corretamente — Dialog deveria seguir o mesmo
  padrão.
- `avaliacoes/[id]/page.tsx` mistura três estilos de "chip" na mesma linha: o `Badge`
  shadcn de verdade (Ativo/Inativo) e dois `<span>` customizados com `border
  border-border` para contagem de perguntas/escalas — visualmente parecidos, mas não são
  o mesmo componente. Qualquer mudança futura no `Badge` (hover, focus) não se propaga.
- `AlertDialog` de exclusão de paciente usa o rótulo "Remover" no botão, mas a descrição
  explica que é, na prática, uma **inativação reversível só por suporte**. Rótulo
  promete uma ação mais destrutiva do que a real — gera ansiedade desnecessária.
- Rodapé da landing (`site-footer.tsx`) usa `const year = 2026` fixo; o resto do app usa
  `new Date().getFullYear()` — vai gerar copyright desatualizado silenciosamente a
  partir de 2027.
- Hierarquia tipográfica salta abruptamente de `h1` (`text-2xl font-extrabold`, no
  `PageHeader`) para `h2` (`text-sm font-semibold`, título de seção de tabela) em várias
  telas de detalhe (`pacientes/[id]`, `avaliacoes/[id]`) sem nível intermediário.
- Topbar (`components/layout/topbar.tsx:43`) tem um `<span className="hidden
  lg:block" />` vazio, sem função — espaço morto no topo de toda tela autenticada, onde
  um breadcrumb ou busca global fariam mais sentido.

**Lacunas funcionais com impacto direto em UX**
- Busca de pacientes (`patients-view.tsx`) filtra **só a página já carregada** — com
  paginação de 20, um psicólogo com 50+ pacientes não encontra alguém fora da página
  atual, apesar do campo de busca parecer global.
- `DataTable` genérico não expõe ordenação de coluna (`useReactTable` só usa
  `getCoreRowModel`) apesar dos headers parecerem clicáveis/ordenáveis visualmente.
- Paginação é só "Anterior/Próxima", sem indicador de página nem salto direto.
- Wizard do paciente guarda estado só em memória (Zustand sem `persist`) — fechar a aba
  ou dar refresh no meio do questionário **perde todo o progresso sem aviso**, o que
  contradiz o próprio texto da tela ("responda com calma, no seu tempo").
- Telas de Perfil (psicólogo e paciente) são idênticas estruturalmente e **100%
  somente-leitura** — nome vindo do JWT (`sub`), sem edição de dados nem troca de senha.
- `accordion.tsx` existe no design system mas não é usado em nenhuma tela — componente
  pronto e subaproveitado, ótimo candidato para condensar a lista de respostas por
  escala na tela de resultado.

### 2.3 Regra de marca vs. realidade técnica — achado crítico

O `id.md` (identidade visual, §8) já documenta corretamente que Verde-Névoa `#A8C5C0`
nunca deve ser texto — isso está certo e é respeitado no código. Mas a auditoria externa
(§3) encontrou uma **segunda combinação que o `id.md` não cobre e que falha WCAG**:

> **Ciano-Escuro `#1A7A6E` sobre Grafite-Verde `#1C2B2B` = 2.83:1 — reprova AA.**

Isso importa porque a sidebar (fundo Grafite-Verde) e outros contextos de "fundo
escuro" do `id.md` podem tentar usar o Ciano-Escuro como cor de destaque/ícone sobre
esse fundo — hoje o código evita isso corretamente (usa branco/opacidade de branco na
`sidebar-nav.tsx`), mas a regra precisa ser **documentada explicitamente** como adendo
ao `id.md`, porque não está escrita em lugar nenhum hoje — só "acertada por sorte" no
código atual. Ver §4.1 para a tabela de contraste completa proposta como adendo oficial.

---

## 3. Benchmark

### 3.1 Produtos e sistemas analisados

| Categoria | Referências |
|---|---|
| Design systems / primitivas | shadcn/ui, Radix UI, Material Design 3, Apple HIG |
| SaaS B2B com paleta restrita | Linear, Notion, Stripe Dashboard, Vercel Dashboard |
| Saúde / clínico / telepsicologia | SimplePractice, TherapyNotes, Doctolib (design system "Oxygen") |
| Usabilidade | Nielsen Norman Group (heurísticas para apps complexos, dark mode, teens, cognitive load, breadcrumbs, skeleton screens) |
| Padrões / acessibilidade | WCAG 2.1 (1.4.1 uso de cor), WCAG 2.2 (2.5.8 target size), Carbon Design System, PatternFly |

### 3.2 shadcn/ui, Radix, Material Design 3, Apple HIG — o que aplicar

- **shadcn/ui 2025** lançou `Spinner`, `Kbd`, `Button Group`, `Input Group`, `Field`,
  `Item`, `Empty` — praticamente sob medida para o wizard de questionário e para os
  empty states já usados neste produto ([ui.shadcn.com/docs/changelog/2025-10-new-components](https://ui.shadcn.com/docs/changelog/2025-10-new-components)).
- **Achado citável e diretamente relevante**: auditorias de acessibilidade do shadcn
  apontam que o `focus-visible:ring-ring/50` padrão (opacidade 50%) cai para ~2.4:1 de
  contraste — abaixo de AA. O `button.tsx` deste projeto **já corrigiu isso**
  (`focus-visible:ring-2 focus-visible:ring-ring`, sem `/50`), mas `select.tsx` e
  `badge.tsx` ainda usam `ring-ring/50` — inconsistência a corrigir no design system
  (ver §4.1) ([thefrontkit.com/blogs/shadcn-ui-accessibility-audit-2026](https://thefrontkit.com/blogs/shadcn-ui-accessibility-audit-2026)).
- **Radix UI** segue as WAI-ARIA Authoring Practices e testa contra NVDA/JAWS/VoiceOver
  — justifica manter Radix como base em vez de componentes 100% custom (como o
  radiogroup do wizard, que deveria migrar para `RadixRadioGroup` — ver §5.13)
  ([radix-ui.com/primitives/docs/overview/accessibility](https://www.radix-ui.com/primitives/docs/overview/accessibility)).
- **Material Design 3** organiza estado por camada: Enabled → Hover (state layer fraca)
  → Focused (mais forte, via teclado) → Pressed → Disabled. Adotado como vocabulário
  padrão da tabela de spec de componentes em §4 ([m3.material.io/foundations/interaction/states](https://m3.material.io/foundations/interaction/states)).
  MD3 também trata **elevação como comunicação de hierarquia via sombra, não cor** — útil
  aqui porque a paleta é restrita: Card/Dialog/Popover devem se diferenciar por
  elevação (`shadow-soft` → `shadow-card` → `shadow-lg`), não por matiz.
- **Apple HIG**: rotular ações pelo resultado, não pelo verbo genérico ("Enviar
  Respostas", não "Enviar" — aplicado ao wizard). Regra de feedback imediato aplica
  direto ao autosave do wizard (§5.13) e ao submit do CRUD de pacientes.
- **Tamanho de alvo de toque**: WCAG 2.2 (2.5.8) exige mínimo 24×24px (AA); pesquisa da
  University of Maryland citada mostra 3x mais erro abaixo de 44px. Para o wizard em
  mobile (adolescente respondendo Likert), recomenda-se **44×44px como padrão de
  produto**, acima do mínimo — os botões de opção do wizard hoje precisam ser auditados
  contra esse número.

### 3.3 Heurísticas NN/g para aplicações complexas — aplicação direta

Fonte: [nngroup.com/articles/usability-heuristics-complex-applications](https://www.nngroup.com/articles/usability-heuristics-complex-applications/)

| Heurística | Aplicação no ReMind |
|---|---|
| Visibilidade do status do sistema | "Pergunta 4 de 20" no wizard; "sincronizado há 2 min" na lista de pacientes |
| Prevenção de erro | Preview antes de confirmar — relevante quando a Fase 5b trouxer criação de questionário |
| Reconhecimento > recall | Badge de faixa de risco visível direto na lista de pacientes, sem abrir o registro |
| Consistência | Se a rampa de teal significa "risco" no gauge, não pode significar outra coisa (ex. progresso) em outra tela — corrige o conflito identificado em §2.2 |
| Minimalismo / disclosure progressivo | 1 pergunta por vez no wizard (já feito); "Mais filtros" escondendo filtros avançados na lista de pacientes (não feito ainda) |
| Ajudar a reconhecer/recuperar erros | Mensagem de bloqueio de reentrada no wizard deveria explicar o porquê, não só bloquear |
| Flexibilidade para usuários avançados | Command palette (⌘K) para psicólogos que usam o sistema todo dia — não obrigatório para quem não usa |

### 3.4 SaaS B2B com paleta restrita — Linear, Notion, Stripe, Vercel

- **Linear**: tema reduzido a 3 variáveis (base, accent, contraste) — validação direta
  da estratégia de 4 cores do ReMind. Grid de 4px cria "ritmo que o cérebro processa
  como ordenado mesmo em alta densidade" (equivalente ao grid de 8px já usado aqui).
  Sidebar deliberadamente "apagada" (dimmed) para dar precedência ao conteúdo —
  aplicável à sidebar Grafite-Verde do ReMind, hoje já discreta, mas pode reduzir ainda
  mais o peso visual dos itens inativos.
- **Notion**: empty states como preview de conteúdo preenchido, não ícone + texto
  genérico. Aplicação direta: "nenhum paciente cadastrado ainda" deveria mostrar como
  fica um card de paciente preenchido, reforçando o próximo passo (isso já é parte da
  filosofia do `EmptyState` atual — "ensina o próximo passo" — só falta a versão visual
  mais rica).
- **Stripe**: "verde para sucesso, vermelho só para falha, resto neutro" — valida
  reservar variação de Ciano-Escuro exclusivamente para status/risco/CTA, nunca como
  decoração. "Densidade nos dados, respiro na moldura": tabelas compactas, chrome ao
  redor espaçoso.
- **Vercel**: paleta quase 100% neutra com **um único accent** restrito a foco/status —
  manual de uso do Ciano-Escuro do ReMind. Transições de ~200ms como referência para
  todas as micro-interações do design system.
- **Command palette (⌘K)**: aumenta 25% a conclusão de tarefa entre power users — ganho
  real e barato de implementar (via `cmdk`, já compatível com shadcn) para "ir para
  paciente X" no dashboard do psicólogo.

### 3.5 Saúde / clínico / telepsicologia

- **SimplePractice vs. TherapyNotes**: SimplePractice tem "a sensibilidade UX que se
  espera de um app fintech moderno, não de um sistema de saúde de 2005"; TherapyNotes é
  mais forte em rigor documental mas visualmente datado. **O padrão a perseguir**:
  parecer produto de consumo bem feito, com rigor clínico por trás — não parecer
  confiável só por ser burocrático.
- **Doctolib** ("Oxygen" design system): "accessible by design" é tratado como requisito
  de segurança do paciente, não preferência estética — justifica formalmente por que
  este PRD trata WCAG como obrigatório, não aspiracional.
- **Tendência de dashboards clínicos 2025/26**: layouts por papel (o que o psicólogo vê
  ≠ o que o paciente vê) — o ReMind já faz isso estruturalmente (dois shells de
  navegação); falta aplicar a mesma lógica de "visão unificada" ao resultado de uma
  avaliação (reunir escore atual + histórico + observações numa tela só, em vez de
  forçar navegação separada quando a Fase 5b chegar).

### 3.6 Formulários longos / wizard em mobile (paciente adolescente)

- Grid Likert horizontal funciona em desktop, mas é ruim em mobile — pesquisa confirma
  diretamente a escolha já feita pelo ReMind (1 pergunta por vez, escala vertical).
- Até 83% dos usuários abandonam pesquisas não otimizadas para mobile.
- **Adolescentes especificamente** (NN/g, relatório dedicado): mobile-first, sensíveis a
  privacidade, e **tendem a escolher respostas extremas em escalas Likert** mais que
  adultos — isso é um viés psicométrico relevante para a equipe clínica, não só UX: a
  UI da escala precisa deixar claro que pontos intermediários são normais, não
  "indecisão".
- Autosave: >80% dos usuários já abandonaram algum formulário por medo de perder
  progresso — argumento quantitativo direto para priorizar persistência no wizard
  (achado #5 da auditoria, §2.2).
- Tela de revisão com "Editar" por seção antes do envio definitivo é padrão
  estabelecido (PatternFly, Smashing Magazine) — o ReMind já implementa isso
  (`review-step.tsx`), ponto positivo a preservar.
- **Nunca usar breadcrumbs dentro de um wizard** — reforça que o fluxo do paciente deve
  continuar sem navegação lateral/breadcrumb, só a barra de progresso linear.

### 3.7 Visualização de risco ordinal — validação e alternativa ao gauge

- Rampas sequenciais de matiz único ("light-to-dark, single hue") são a recomendação
  padrão da literatura de dataviz para dados ordinais — **valida tecnicamente** a
  decisão de produto já tomada pelo ReMind (rampa de teal em vez de semáforo).
- **Condição não-negociável (WCAG 1.4.1)**: cor nunca pode ser o único diferenciador —
  precisa de rótulo textual sempre junto. O ReMind já cumpre isso no gauge/domain-bars
  (texto "Risco {label}" sempre visível) — o problema não é a ausência de redundância,
  é o contraste do texto em cima da cor mais clara da rampa (achado §2.2, corrigir).
- **Alternativa ao gauge circular**: a literatura de dataviz clínico/BI (Stephen Few)
  critica gauges por baixa densidade informacional e recomenda **bullet chart** —
  compara o valor atual contra faixas de referência numa barra horizontal compacta,
  ocupa menos espaço vertical, e é mais fácil de rotular de forma acessível. **Proposto
  como opção B no redesign do componente de resultado** (ver §4.17, §5.9) — não uma
  substituição obrigatória, mas vale prototipar as duas.

### 3.8 Dark mode — recomendação: não priorizar

- A favor: redução de fadiga em sessões longas do psicólogo, economia de bateria mobile.
- **Contra, e decisivo para o ReMind**: fundos escuros comprimem a diferença perceptual
  entre cores — e a rampa de risco (Ciano-Escuro) **já reprova contraste sobre
  Grafite-Verde** (2.83:1, achado §2.3). Um dark mode não seria "inverter" o tema atual
  — exigiria uma paleta de risco inteiramente separada e validada, o que colide direto
  com a regra de marca de 4 cores fixas.
- Especialistas em UI de dispositivos médicos (Emergo/UL) recomendam não assumir que
  "profissional de saúde = prefere dark mode"; muitos preferem light mode pela precisão
  de leitura de cores de status.
- **Recomendação**: manter `forcedTheme="light"` (decisão já tomada no código,
  `providers.tsx`) neste ciclo de redesign. Se houver demanda futura, tratar dark mode
  como iniciativa própria com paleta de risco redesenhada do zero — não uma tarefa do
  design system atual.

---

## 4. Design System

Especificação consolidada — para cada componente: **estado atual**, **especificação
proposta** e **gaps**. Vocabulário de estado segue Material Design 3 (§3.2): Default →
Hover → Focus → Active/Pressed → Disabled → (Loading quando aplicável).

### 4.1 Tokens de cor e contraste (adendo formal ao `id.md`)

Tabela de contraste **validada por cálculo**, para ser adicionada como seção 8.1 do
`id.md` (hoje a seção 8 do `id.md` não cobre as combinações abaixo):

| Combinação | Contraste | Uso permitido |
|---|---|---|
| Grafite-Verde sobre Branco-Neve | 13.55:1 | Texto em qualquer tamanho/peso |
| Ciano-Escuro sobre Branco-Neve | 4.78:1 | Texto normal — **evitar peso `font-light`**, margem apertada |
| Branco sobre Ciano-Escuro | 5.18:1 | Botão primário, badges de risco "Moderado" |
| Branco sobre `#0B4A42` (teal escuro, risco "Alto") | 10.13:1 | Seguro para qualquer peso |
| **Branco sobre `#7AB1A8` (teal claro, risco "Baixo")** | **2.42:1** | ❌ **Proibido** — usar Grafite-Verde (6.07:1) |
| Verde-Névoa sobre Branco-Neve | 1.70:1 | ❌ Só decorativo, nunca texto (regra já existente no `id.md`) |
| Grafite-Verde sobre Verde-Névoa (chip/badge) | 7.98:1 | Único jeito seguro de "ativar" Verde-Névoa com texto em cima |
| **Ciano-Escuro sobre Grafite-Verde** | **2.83:1** | ❌ **Novo — não documentado no `id.md` hoje.** Nunca usar Ciano-Escuro como texto/ícone sobre fundo escuro; usar branco ou um tom de Ciano-Escuro clareado especificamente para esse contexto |

**Ação de design system**: `lib/constants.ts#RISK_BANDS` precisa de um campo adicional
`textColor` por faixa (`"#1C2B2B"` para Baixo, `"#FFFFFF"` para Moderado/Alto) em vez de
assumir branco fixo em `gauge.tsx`/`domain-bars.tsx`.

### 4.2 Botões

- **Estado atual**: `button.tsx` já é sólido — 6 variantes (default/secondary/outline/
  ghost/destructive/link), 4 tamanhos, `border-radius: full` (conforme `id.md` §5),
  focus ring correto (sem o bug de opacidade `/50` encontrado em outros componentes).
- **Especificação**:
  - Altura mínima de alvo de toque: manter `h-11` (44px) como padrão em qualquer
    contexto tocado por paciente (wizard) — já cumprido.
  - Adicionar variante `size="icon-sm"` (36px) para ações densas em tabela, hoje
    ausente (tabelas usam `DropdownMenu` para compensar).
  - Estado de loading (`isLoading` prop com `Spinner` do shadcn, gap novo — ver §4.15):
    hoje formulários não têm um padrão único de "botão enviando"; alguns usam `disabled`
    + texto trocado manualmente. Padronizar via prop.
- **Gap**: nenhum crítico — extensão, não correção.

### 4.3 Inputs

- **Estado atual**: `input.tsx` consistente com o design system (`h-11`, `rounded-xl`,
  estado `aria-invalid`). `textarea.tsx`/`label.tsx`/`form.tsx` seguem o mesmo padrão.
- **Especificação**: adicionar `Field`/`Input Group` (padrão shadcn 2025) para casos com
  ícone/prefixo/sufixo (ex.: campo de busca de pacientes, hoje com ícone posicionado
  manualmente via CSS absoluto em `patients-view.tsx` em vez de um componente
  reutilizável).
- **Gap**: sem componente `Combobox`/autocomplete — necessário se a busca de pacientes
  virar busca real no backend (§5.5) com sugestão em tempo real.

### 4.4 Cards

- **Estado atual**: `card.tsx` consistente (`rounded-2xl`, `shadow-soft`,
  composição Header/Title/Description/Content/Footer). Usado de forma disciplinada em
  quase todas as telas.
- **Especificação**: adicionar variante `interactive` (hover com leve elevação +
  `cursor-pointer`) para cards que são links/clicáveis (hoje simulado ad-hoc em alguns
  lugares) — reduz a chance de um card "parecer clicável" sem sinalizar isso
  visualmente.
- **Gap**: nenhum estrutural.

### 4.5 Modais (Dialog)

- **Estado atual**: implementação Radix correta, mas `bg-background` = mesma cor do
  fundo da página (achado §2.2).
- **Especificação**: trocar para `bg-card` (branco puro) para gerar contraste de
  elevação real entre o modal e o que está atrás — consistente com o próprio Card. Overlay
  mantém `bg-black/50`.
- **Gap**: nenhum estrutural, é correção pontual.

### 4.6 Tabelas

- **Estado atual**: `table.tsx` (primitivo shadcn) + `data-table.tsx` (wrapper TanStack
  Table) cobrem paginação estilo Spring `Page<T>` e delegam loading/empty state.
- **Especificação**:
  - Adicionar `getSortedRowModel` — headers já parecem clicáveis visualmente, usuário
    vai tentar ordenar e hoje nada acontece (achado §2.2).
  - Paginação: adicionar indicador "Página X de Y" + salto direto, não só
    Anterior/Próxima.
  - Toda tabela clínica (pacientes, avaliações, respostas) ganha `<caption>` ou
    `aria-label` descritivo — hoje ausente (achado da pesquisa externa, aplicável ao
    projeto).
  - Coluna de ações sempre com `header` acessível (ex.: `sr-only`"Ações"), nunca vazio.
  - Em telas com 5+ colunas em mobile (ex. lista de pacientes com 7 colunas), oferecer
    layout alternativo em cards empilhados abaixo do breakpoint `sm`, em vez de só
    scroll horizontal.
- **Gap**: sem componente de layout responsivo tabela↔card.

### 4.7 Badges

- **Estado atual**: `badge.tsx` correto e completo (6 variantes). Problema não é o
  componente, é o **uso inconsistente** (`<span>` custom em vez de `<Badge>` em
  `avaliacoes/[id]/page.tsx`, achado §2.2).
- **Especificação**: banir `<span>` ad-hoc estilizado como badge fora de `components/ui/
  badge.tsx` — checklist de PR/lint pode reforçar isso (ver §7).
- **Gap**: variante `variant="risk"` dedicada, parametrizada por `RiskBand`, para
  eliminar a duplicação de estilo entre `gauge.tsx` e `domain-bars.tsx` (ambos hoje
  recriam o mesmo `<span>` de badge de risco com estilo inline).

### 4.8 Alertas

- **Estado atual**: `ErrorState` cobre erro de carregamento de lista/página. Não existe
  um componente `Alert` (banner persistente, shadcn tem `alert.tsx` como componente
  próprio, ausente aqui) para avisos contínuos dentro de uma tela (ex.: "conta com
  perfil incompleto", já mencionado como pendência em `.claude/specs/04-spec-aplicacao.md`
  R9).
- **Especificação**: adicionar `components/ui/alert.tsx` (shadcn padrão) — variantes
  `default`/`warning`/`destructive`. Usar para o banner de "complete seu perfil" (R9,
  hoje sem UI nenhuma) e para o aviso legal temporário em `privacidade`/`termos`
  enquanto o texto jurídico definitivo não está pronto (em vez do comentário cru atual).
- **Gap**: componente inexistente — criar do zero (baixo esforço, é primitivo simples).

### 4.9 Toasts

- **Estado atual**: `sonner.tsx` implementado e tokenizado corretamente
  (`bg-card`, `shadow-card`). Usado para feedback de ações (criar/editar/remover
  paciente).
- **Especificação**: regra de uso a documentar — toast é para eventos pontuais
  auto-dismiss (ex. "Paciente cadastrado"), nunca para erros que bloqueiam o fluxo
  clínico (ex. falha ao carregar resultado de uma avaliação deve usar `ErrorState`
  inline, não toast que desaparece sozinho). Essa distinção hoje não está escrita em
  lugar nenhum do código — formalizar como convenção do design system.
- **Gap**: nenhum técnico, é documentação de uso.

### 4.10 Sidebar

- **Estado atual**: `sidebar-nav.tsx` + `app-shell.tsx` sólidos — fundo Grafite-Verde
  (conforme `id.md`), item ativo com `bg-white/10`, ícones Lucide, `Sheet` para mobile.
- **Especificação**:
  - Adicionar indicador visual (badge "Em breve" ou item com opacidade reduzida +
    `aria-disabled`) para "Relatórios", que hoje leva a um placeholder sem aviso prévio
    (achado §2.2, tela 10).
  - Considerar "apagar" (dim) ainda mais os itens inativos vs. o ativo, no espírito do
    benchmark do Linear (§3.4), para reduzir peso visual da navegação frente ao
    conteúdo.
- **Gap**: nenhum estrutural.

### 4.11 Navbar / Topbar

- **Estado atual**: `topbar.tsx` funcional — trigger mobile, dropdown de conta com
  iniciais.
- **Especificação**: preencher o espaço morto (`<span className="hidden lg:block"
  />`, achado §2.2) com **breadcrumb contextual** (ver §4.13) ou, no psicólogo, um
  atalho de busca/command palette (§3.4).
- **Gap**: nenhum componente novo — é composição do que falta em §4.13/§4.19.

### 4.12 Dropdowns

- **Estado atual**: `dropdown-menu.tsx` (Radix) bem implementado, variante
  `destructive` usada corretamente para ações irreversíveis.
- **Gap**: nenhum.

### 4.13 Breadcrumbs

- **Estado atual**: **não existe no design system.** Nenhuma tela usa breadcrumb —
  navegação de volta depende só do botão "voltar" do navegador ou da sidebar.
- **Especificação**: adicionar `components/ui/breadcrumb.tsx` (shadcn padrão) e usar em
  telas de hierarquia profunda do **psicólogo**: `Pacientes › [Nome] `,
  `Avaliações › [Título] › [Paciente]`. Regra da pesquisa (NN/g, §3.6): **nunca**
  usar breadcrumb no wizard do paciente — fluxo linear intencional.
- **Gap**: componente inexistente — criar (esforço baixo, primitivo simples do shadcn).

### 4.14 Dropdowns / Tabs

- **Estado atual**: **Tabs não existe no design system.** Nenhuma tela usa abas —
  telas com múltiplas visões relacionadas (ex. resultado de avaliação: "Resumo" /
  "Respostas detalhadas" / futuro "Histórico") hoje empilham tudo verticalmente numa
  página só.
- **Especificação**: adicionar `components/ui/tabs.tsx` (Radix Tabs). Primeiro uso
  proposto: tela de resultado do paciente (§5.9) — separar "Escore & risco" de
  "Respostas detalhadas" em abas, reduzindo a rolagem na tela clinicamente mais densa
  do produto.
- **Gap**: componente inexistente — criar.

### 4.15 Dialogs

Ver §4.5 (Modais) — mesma especificação.

### 4.16 Empty States

- **Estado atual**: `EmptyState` bem desenhado (ícone + título + descrição + ação),
  filosofia correta ("ensina o próximo passo").
- **Especificação**: para o empty state de "nenhum paciente cadastrado" (a tela de
  maior probabilidade de ser vista por um psicólogo novo, logo após onboarding),
  adotar o padrão Notion (§3.4): ilustração leve/preview de como fica um card
  preenchido, monocromática (só tons de Grafite-Verde/Verde-Névoa), em vez de só ícone
  Lucide + texto.
- **Gap**: variação visual mais rica para o caso de maior impacto (primeiro acesso),
  mantendo o componente base atual para os demais casos.

### 4.17 Skeletons / Loading

- **Estado atual**: `LoadingState` (linhas de `Skeleton`) usado em listas/tabelas.
  Server Components (ex. `psicologo/dashboard`) não têm skeleton — a página bloqueia até
  os dados resolverem, sem feedback (achado §2.2, tela 4).
- **Especificação**: regra de uso (validada pela pesquisa NN/g §3.2): **skeleton para
  carregamento de conteúdo com layout relevante** (listas, dashboard, tabelas —
  já feito); **spinner para ações curtas/bloqueantes** (submit de formulário, login —
  parcialmente feito, falta padronizar via `Button` com prop `isLoading`, §4.2).
  Adicionar skeleton específico para o dashboard do psicólogo mesmo sendo Server
  Component (via `loading.tsx` do App Router, recurso nativo do Next.js ainda não
  usado no projeto).
- **Gap**: `loading.tsx` do App Router não está sendo aproveitado em nenhuma rota.

### 4.18 Charts

- **Estado atual**: `Gauge` (radial) e `DomainBars` (barra) sobre Recharts, ambos
  acessíveis (role="img", nunca só cor). `bar-chart.tsx`/`lazy-bar-chart.tsx` são só
  decorativos na landing (`aria-hidden`, corretamente marcados).
- **Especificação**:
  1. **Corrigir o bug de contraste do badge "Baixo"** (§2.3/§4.1) — prioridade alta,
     é acessibilidade real, não estética.
  2. **Prototipar bullet chart como alternativa ao gauge circular** (§3.7) para a tela
     de resultado — comparar densidade de informação e espaço ocupado; decisão de
     design, não substituição automática.
  3. **Resolver a inconsistência de paleta entre landing e produto** (§2.2): ou o mock
     da landing (`solution.tsx`) passa a usar a mesma rampa monocromática do produto
     real, ou — se a equipe decidir que semáforo é aceitável clinicamente em algum
     nível — essa decisão precisa ser tomada uma vez e aplicada nos dois lugares. **Não
     deixar como está** (duas linguagens visuais de risco coexistindo).
  4. Adicionar variante de gráfico para o futuro **trend-line** (Fase 5b, fora do
     escopo de implementação deste PRD, mas o componente de chart do design system
     deveria já reservar o padrão visual — linha com a mesma rampa de cor, nunca
     introduzir uma cor nova só para "tendência").
- **Gap**: nenhum componente ausente, são refinamentos e uma correção de bug real.

### 4.19 Calendários

- **Estado atual**: **não existe.** Nenhuma tela usa datas interativas — campos de
  data (ex. nascimento no cadastro de paciente) usam `<input type="date">` nativo do
  navegador.
- **Especificação**: adicionar `components/ui/calendar.tsx` + `popover.tsx` (Radix
  Popover, também ausente hoje) para um seletor de data consistente com a marca, a
  usar no formulário de cadastro/edição de paciente. Não é urgente (o `<input
  type="date">` nativo funciona e é acessível por padrão), mas é uma lacuna real do
  checklist pedido e necessária se o produto evoluir para agendamento/histórico por
  data (Fase 5b).
- **Gap**: componente inexistente — baixa prioridade, criar sob demanda.

### 4.20 Componentes adicionais identificados como gap (fora da lista original, mas necessários)

| Componente | Por que falta | Prioridade |
|---|---|---|
| `Tooltip` | Nenhuma tela usa dica contextual — útil em ícones sem label (ex. ações de tabela) | Média |
| `Popover` | Pré-requisito para `Calendar` e para menus de filtro avançado | Média |
| `Avatar` | Hoje reimplementado ad-hoc como `<span>` com iniciais no `Topbar` — extrair como componente reutilizável | Baixa |
| `Progress` | Wizard tem `progress-bar.tsx` próprio; extrair como primitivo do design system (`components/ui/progress.tsx`) para reuso em outros contextos (ex. barra de completude de perfil) | Baixa |
| `Command` (⌘K) | Nenhum atalho de navegação hoje — ganho de eficiência para psicólogos (§3.4) | Média (Fase 3+) |
| `RadioGroup` (Radix) | Existe no ecossistema Radix mas não foi adotado — wizard reimplementa à mão (achado §2.2) | Alta (é correção de a11y) |

---

## 5. Melhorias por Tela

### 5.1 Landing page (`(marketing)/page.tsx`)

- **Problemas atuais**: `AppShowcase` promete um dashboard rico que o produto real não
  tem; `Challenge` e `Features` usam o mesmo padrão visual de card para tom "problema"
  e tom "solução", sem diferenciação; `Hero` referencia `hero-bg.png` num comentário que
  cita `.jpg` (indício de asset possivelmente ausente/desatualizado); `DemoForm` não
  distingue visualmente campos obrigatórios de opcionais além do texto do label.
- **Melhorias propostas**: (1) alinhar `AppShowcase` ao dashboard real após o
  redesign do dashboard (§5.4) — mockup de marketing deve refletir o produto entregue,
  não uma aspiração; (2) diferenciar visualmente `Challenge` (tom problema — pode usar
  fundo levemente mais neutro/Grafite-Verde) de `Features` (tom solução — Ciano-Escuro
  como acento); (3) verificar/corrigir asset do hero; (4) marcar campos obrigatórios com
  indicador visual consistente (asterisco ou peso de fonte) no `DemoForm`.
- **Componentes alterados**: `app-showcase.tsx`, `challenge.tsx`, `features.tsx`,
  `hero.tsx`, `demo-form.tsx`.
- **Justificativa**: a landing é a primeira impressão de um lead que acabou de ver uma
  demo — inconsistência entre o que é mostrado ali e o produto real gera desconfiança no
  momento de decisão de compra (achado §2.2, maior gap identificado no produto).

### 5.2 Páginas institucionais (`sobre`, `contato`, `privacidade`, `termos`)

- **Problemas atuais**: texto "⚠️ provisório" em produção em `privacidade`/`termos`
  (bloqueador); datas de atualização hardcoded como string solta; `contato` com dois
  cards subutilizados (muito espaço em branco); nenhuma navegação de retorno além do
  header/footer.
- **Melhorias propostas**: (1) substituir o aviso cru por conteúdo jurídico definitivo
  ou, na ausência dele, por um componente `Alert` controlado (§4.8) em vez de texto solto
  com emoji; (2) enriquecer `contato` com mais informação de contato (horário, WhatsApp)
  para preencher o espaço com conteúdo útil em vez de vazio; (3) considerar breadcrumb
  simples ("Início › Sobre") usando o novo componente (§4.13).
- **Componentes alterados**: `privacidade/page.tsx`, `termos/page.tsx`, `contato/page.tsx`.
- **Justificativa**: texto jurídico provisório em produção é risco de compliance, não só
  estética — prioridade de remoção imediata independente do resto do roadmap.

### 5.3 Login (`(auth)/login`)

- **Problemas atuais**: mensagem de erro deliberadamente ambígua (correta por segurança,
  mas sem diferenciar "credencial errada" de "backend fora do ar", frustrando o usuário
  que erra repetidamente sem saber a causa real); sem "Esqueci minha senha"; assimetria
  grande de investimento visual entre desktop (painel de marca animado) e mobile
  (formulário nu).
- **Melhorias propostas**: (1) manter a mensagem de segurança para credencial errada,
  mas adicionar um estado visualmente distinto para erro 5xx/rede detectável
  (ex. timeout, `fetch` falhou) — "Não conseguimos conectar. Tente novamente."; (2)
  planejar fluxo de recuperação de senha (depende de endpoint de backend ainda
  inexistente — registrar como pré-requisito, não implementar sem API); (3) trazer ao
  menos a tagline de marca para o topo do formulário em mobile, não só o logo pequeno.
- **Componentes alterados**: `features/auth/components/login-form.tsx`, `brand-panel.tsx`.
- **Justificativa**: login é o ponto de maior fricção possível — qualquer ambiguidade de
  erro tem custo desproporcional em confiança, especialmente para psicólogos não
  tão técnicos.

### 5.4 Dashboard do Psicólogo

- **Problemas atuais**: 2 cards de contagem apenas; nenhum gráfico apesar do design
  system já ter `Gauge`/`DomainBars`/`BarChart` prontos; sem alertas de risco alto, sem
  atividade recente; layout esparso em telas largas; sem skeleton (Server Component
  bloqueia até resolver).
- **Melhorias propostas**: (1) adicionar card de "Avaliações recentes" (últimas N
  respondidas, com link direto ao resultado) — dado já existe via `/questionarios/{id}/
  pacientes`, é questão de agregação no frontend, não depende de endpoint novo; (2)
  considerar destaque de "pacientes em risco alto" **somente se agregável sem endpoint
  novo** (hoje `scaleResults` só é acessível por avaliação individual — registrar como
  possível pré-requisito de backend, não simular dado); (3) usar `loading.tsx` do App
  Router para esqueleto imediato; (4) redistribuir grid para ocupar melhor telas largas
  (3–4 colunas em vez de 2).
- **Componentes alterados**: `psicologo/dashboard/page.tsx`, novo `loading.tsx`.
- **Justificativa**: é a tela de maior gap entre promessa (landing) e realidade —
  prioridade #1 do roadmap (§6).

### 5.5 Lista de Pacientes

- **Problemas atuais**: busca só filtra a página carregada (não é busca real); tabela
  com 7 colunas sem alternativa mobile; rótulo "Remover" para uma ação que na verdade é
  inativação reversível; sem ordenação de coluna; `GENDER_OPTIONS` restrito a M/F.
- **Melhorias propostas**: (1) mover a busca para o backend (`GET /pacientes?search=`,
  requer suporte de backend — registrar como pré-requisito) ou, no mínimo, deixar
  claro na UI que a busca é só da página atual até isso existir (hoje já tem texto de
  ajuda — reforçar visualmente, não só texto pequeno); (2) trocar rótulo do botão de
  exclusão para "Inativar" (correção de copy, sem custo); (3) ativar `getSortedRowModel`
  na tabela; (4) layout em cards abaixo do breakpoint `md` para a lista de pacientes.
- **Componentes alterados**: `patients-view.tsx`, `data-table.tsx`, `patient-form-dialog.tsx`.
- **Justificativa**: é a tela mais usada no dia a dia do psicólogo — fricção de busca
  tem custo cumulativo alto.

### 5.6 Detalhe do Paciente

- **Problemas atuais**: `PatientInfoCard` isolado com `max-w-md`, muito espaço vazio em
  telas largas; sem resumo agregado (nº de avaliações, última atividade, tendência);
  sem breadcrumb de volta.
- **Melhorias propostas**: (1) layout de duas colunas em desktop — dados cadastrais à
  esquerda, resumo/mini-histórico à direita (usando componentes de chart já existentes,
  sem esperar Fase 5b completa: já dá para mostrar "última avaliação: {data}, risco
  {label}" com o dado que já existe); (2) breadcrumb "Pacientes › {Nome}" (§4.13); (3)
  usar formatação relativa de data ("há 3 meses") junto da data absoluta.
- **Componentes alterados**: `pacientes/[id]/page.tsx`, `PatientInfoCard`.
- **Justificativa**: é a ficha central do paciente — hoje entrega menos informação do
  que poderia com os dados que já existem.

### 5.7 Lista de Avaliações

- **Problemas atuais**: nenhuma explicação de por que não há ação de criar/editar
  (ausência pode parecer bug); sem filtro por status/escala; coluna "Atualizado em" de
  baixo valor clínico.
- **Melhorias propostas**: (1) adicionar texto explicativo curto ("Avaliações são
  cadastradas pela equipe ReMind" ou equivalente) em vez de omitir silenciosamente a
  ação; (2) filtro por escala (CARS/UCLA/SPI) e por status; (3) trocar "Atualizado em"
  por "Respondida por N pacientes" (mais acionável).
- **Componentes alterados**: `questionnaires-view.tsx`.
- **Justificativa**: baixo custo de implementação, resolve confusão real de usuário.

### 5.8 Detalhe da Avaliação

- **Problemas atuais**: mistura `Badge` real com `<span>` customizado para chips de
  metadado (achado §2.2); sem indicação de quem ainda não respondeu.
- **Melhorias propostas**: (1) unificar todos os chips em `Badge` (§4.7); (2) adicionar
  contagem "N de M pacientes responderam" cruzando com a lista total de pacientes do
  psicólogo (dado já disponível via `/pacientes`, é agregação de frontend).
- **Componentes alterados**: `avaliacoes/[id]/page.tsx`.
- **Justificativa**: unificação de componente reduz dívida de design system; contagem
  de pendentes é valor clínico real de baixo custo.

### 5.9 Resultado do Paciente (tela clínica central)

- **Problemas atuais**: **contraste do badge "Baixo" reprova WCAG** (achado §2.3,
  prioridade máxima); sem navegação para avaliação anterior do mesmo paciente; lista de
  respostas não agrupada por escala apesar do resumo já ser por escala; sem anotação
  clínica nem exportação/impressão.
- **Melhorias propostas**: (1) **corrigir contraste do badge imediatamente** (§4.1,
  §4.18); (2) agrupar a lista de respostas por escala usando `Accordion` (componente já
  existente e subaproveitado, §2.2) — uma seção colapsável por escala, com o resumo
  (`DomainBars`) no topo de cada uma; (3) considerar `Tabs` (§4.14) separando "Resumo" de
  "Respostas detalhadas"; (4) exportação em PDF/impressão fica registrada como
  pré-requisito de produto para fase futura (fora do escopo de UI pura, envolve
  geração de documento); (5) prototipar bullet chart como alternativa ao gauge (§3.7).
- **Componentes alterados**: `gauge.tsx`, `domain-bars.tsx`,
  `avaliacoes/[id]/pacientes/[pid]/page.tsx`, novo `Accordion`/`Tabs`.
- **Justificativa**: é a tela de maior densidade clínica do produto — a correção de
  contraste aqui não é opcional, é acessibilidade obrigatória (WCAG AA).

### 5.10 Relatórios (placeholder)

- **Problemas atuais**: item de menu sempre clicável leva a tela vazia sem aviso prévio;
  copy interna de engenharia ("condicionado a dados do backend") vazando pro usuário.
- **Melhorias propostas**: (1) badge "Em breve" no item da sidebar (§4.10); (2) copy
  orientada a produto ("Em desenvolvimento — chegará em breve com a evolução dos seus
  pacientes ao longo do tempo").
- **Componentes alterados**: `sidebar-nav.tsx`, `relatorios/page.tsx`.
- **Justificativa**: correção de copy de baixíssimo custo, remove uma fonte de confusão
  recorrente (todo psicólogo vai clicar em "Relatórios" ao menos uma vez).

### 5.11 Perfil (psicólogo e paciente)

- **Problemas atuais**: tela 100% somente-leitura em ambos os perfis — nenhuma edição,
  nenhuma troca de senha; cards isolados com espaço vazio ao redor.
- **Melhorias propostas**: (1) unificar como um único componente parametrizado por
  `userType` (hoje são duas telas estruturalmente idênticas); (2) adicionar edição de
  dados básicos e troca de senha **assim que o backend expuser os endpoints
  necessários** (`PUT /me` ou equivalente — hoje inexistente, pré-requisito de backend,
  já listado no PRD original §10); (3) até lá, ao menos comunicar visualmente "em breve"
  em vez de simplesmente não ter nenhuma ação.
- **Componentes alterados**: `ProfileCard`, ambas as `perfil/page.tsx`.
- **Justificativa**: uma tela chamada "Perfil" sem nenhuma ação é semanticamente
  enganosa para o usuário.

### 5.12 Início do Paciente

- **Problemas atuais**: lista mostra todas as avaliações ativas do sistema, não as
  atribuídas a esse paciente (limitação de dado, não de UI); estados textuais
  (Responder/Já respondido/Indisponível) pouco escaneáveis sem cor/ícone.
- **Melhorias propostas**: (1) diferenciar visualmente os 3 estados com ícone (não só
  texto) — respeitando a regra "nunca só cor"; (2) registrar a falta de escopo real
  "atribuído a este paciente" como pré-requisito de backend, não simular no frontend.
- **Componentes alterados**: `available-questionnaires.tsx`.
- **Justificativa**: melhoria de escaneabilidade de baixo custo; o problema de fundo
  (escopo de atribuição) é responsabilidade de backend, fora do escopo deste PRD de UI.

### 5.13 Wizard de Resposta (paciente)

- **Problemas atuais**: **perda de progresso ao fechar aba** (achado #5, alta
  severidade); radiogroup reimplementado sem navegação por seta; sem transição de
  Motion entre perguntas (inconsistente com o resto do produto); passo de revisão
  "trava" a barra em 100% de forma confusa.
- **Melhorias propostas**: (1) **adicionar `persist` do Zustand** (localStorage/
  sessionStorage) ao `wizard-store.ts` — baixo esforço, alto impacto, resolve o risco
  real de perda de dados do paciente; (2) migrar para Radix `RadioGroup` (§4.20)
  mantendo o visual de "cards selecionáveis" já usado; (3) adicionar transição sutil
  (`motion/react`, já é dependência do projeto) entre perguntas, consistente com o resto
  do produto; (4) ajustar a barra de progresso para tratar a revisão como um passo
  visualmente distinto, não "Pergunta Y de Y".
- **Componentes alterados**: `stores/wizard-store.ts`, `question-step.tsx`,
  `progress-bar.tsx`.
- **Justificativa**: é o único fluxo que o paciente (menor de idade, em muitos casos)
  executa sozinho sem supervisão — perda de progresso tem custo emocional real, não só
  técnico. Prioridade alta no roadmap.

---

## 6. Roadmap de Implementação

Priorizado por impacto × custo de implementação — maior impacto e menor custo primeiro.

### Fase 1 — Correções e bloqueadores (1–2 semanas)
Sem risco de regressão, sem dependência de backend novo.

- Remover texto legal "provisório" de `privacidade`/`termos` (ou substituir por `Alert`
  controlado enquanto o jurídico não fecha o texto definitivo) — **bloqueador de
  release**.
- Corrigir contraste do badge "Baixo" em `gauge.tsx`/`domain-bars.tsx` (texto
  Grafite-Verde em vez de branco) — **acessibilidade WCAG**.
- Adicionar `persist` ao `wizard-store.ts` — **prevenção de perda de dados**.
- Trocar rótulo "Remover" → "Inativar" no `AlertDialog` de pacientes.
- Corrigir `Dialog` para `bg-card` em vez de `bg-background`.
- Unificar chips de `avaliacoes/[id]/page.tsx` em `Badge`.
- Trocar `const year = 2026` por `new Date().getFullYear()` no footer.
- Badge "Em breve" no item "Relatórios" da sidebar + copy do placeholder.
- Corrigir `header: ""` da coluna de ações nas tabelas para `aria-label`/`sr-only`.

### Fase 2 — Extensão do design system (2–4 semanas)
Componentes novos, sem tocar telas ainda.

- Adicionar ao `components/ui/`: `alert.tsx`, `breadcrumb.tsx`, `tabs.tsx`,
  `tooltip.tsx`, `popover.tsx`, `avatar.tsx`, `progress.tsx` (extraído do
  `progress-bar.tsx` do wizard), `radio-group.tsx` (Radix).
- Migrar radiogroup do wizard para `RadioGroup` do Radix.
- Adicionar variante `variant="risk"` ao `Badge`, parametrizada por `RiskBand`
  (incluindo `textColor` corrigido, §4.1).
- Ativar `getSortedRowModel` no `data-table.tsx` + paginação com indicador de página.
- Documentar adendo de contraste (§4.1) no `id.md` como seção 8.1 oficial.
- Padronizar prop `isLoading` no `Button` (spinner) em vez de tratamento manual
  disperso por formulário.

### Fase 3 — Redesign de telas de alto impacto (4–6 semanas)
Depende da Fase 2 (componentes prontos), pode rodar em paralelo por tela.

- Dashboard do psicólogo: cards adicionais de "avaliações recentes", grid reorganizado,
  `loading.tsx`.
- Resultado do paciente: `Accordion` por escala, correção de contraste já aplicada
  (Fase 1), protótipo de bullet chart como alternativa ao gauge para decisão de design.
- Lista de pacientes: layout em cards para mobile, ordenação de coluna, copy de busca
  reforçada.
- Detalhe do paciente: layout de duas colunas, breadcrumb.
- Wizard: transições de Motion entre perguntas, ajuste da barra de progresso na revisão.
- Alinhar `AppShowcase`/`solution.tsx` da landing ao estado real do produto pós-redesign
  do dashboard.

### Fase 4 — Iniciativas dependentes de backend / decisão de produto (fora do controle só de frontend)
Registrar como pré-requisito, não implementar sem o backend correspondente.

- Busca real de pacientes no backend (`GET /pacientes?search=`).
- Endpoints de edição de perfil (`PUT /me`, troca de senha).
- Escopo real de "avaliação atribuída ao paciente" (hoje lista todas as ativas).
- Fase 5b (evolução longitudinal, `trend-line.tsx`, tela de criação de questionário) —
  já planejada e adiada por decisão de produto (`.claude/specs/04-spec-aplicacao.md`
  §6); quando retomada, deve reaproveitar os componentes de chart já refinados neste
  redesign (mesma rampa de cor, nunca introduzir cor nova para "tendência").
- Command palette (⌘K) para navegação rápida do psicólogo — não bloqueante, ganho de
  eficiência para usuário avançado.

---

## 7. Checklist Técnico

### Componentes novos a criar (`components/ui/`)
- [ ] `alert.tsx`
- [ ] `breadcrumb.tsx`
- [ ] `tabs.tsx`
- [ ] `tooltip.tsx`
- [ ] `popover.tsx`
- [ ] `avatar.tsx`
- [ ] `progress.tsx`
- [ ] `radio-group.tsx`
- [ ] `calendar.tsx` (baixa prioridade, sob demanda)
- [ ] `command.tsx` (Fase 4)

### Correções em componentes existentes
- [ ] `components/charts/gauge.tsx` — texto do badge de risco com cor condicional ao
      fundo (Grafite-Verde sobre `#7AB1A8`, branco nos demais)
- [ ] `components/charts/domain-bars.tsx` — mesma correção de contraste
- [ ] `lib/constants.ts#RISK_BANDS` — adicionar campo `textColor` por faixa
- [ ] `components/ui/dialog.tsx` — `bg-background` → `bg-card`
- [ ] `components/ui/select.tsx`, `components/ui/badge.tsx` — padronizar
      `focus-visible:ring-ring` sem `/50` (alinhar com `button.tsx`)
- [ ] `components/ui/badge.tsx` — nova variante `variant="risk"`
- [ ] `components/shared/data-table.tsx` — `getSortedRowModel`, paginação com indicador
      de página, `<caption>`/`aria-label` obrigatório por uso
- [ ] `stores/wizard-store.ts` — middleware `persist` (Zustand)
- [ ] `features/questionnaires/components/wizard/question-step.tsx` — migrar para Radix
      `RadioGroup`

### Telas a ajustar
- [ ] `(marketing)/privacidade/page.tsx`, `(marketing)/termos/page.tsx` — remover aviso
      provisório
- [ ] `(marketing)/page.tsx` (`app-showcase.tsx`, `solution.tsx`) — realinhar após
      redesign do dashboard
- [ ] `(app)/psicologo/dashboard/page.tsx` — cards adicionais + `loading.tsx`
- [ ] `(app)/psicologo/pacientes/page.tsx` (`patients-view.tsx`) — rótulo "Inativar",
      layout mobile em cards
- [ ] `(app)/psicologo/pacientes/[id]/page.tsx` — layout 2 colunas, breadcrumb
- [ ] `(app)/psicologo/avaliacoes/[id]/page.tsx` — badges unificados, contagem de
      pendentes
- [ ] `(app)/psicologo/avaliacoes/[id]/pacientes/[pid]/page.tsx` — `Accordion` por
      escala
- [ ] `(app)/psicologo/relatorios/page.tsx` + `sidebar-nav.tsx` — badge "Em breve" +
      copy
- [ ] `(app)/psicologo/perfil/page.tsx`, `(app)/paciente/perfil/page.tsx` — unificar
      componente, preparar para edição futura
- [ ] `(app)/paciente/inicio/page.tsx` (`available-questionnaires.tsx`) — ícones por
      estado

### Documentação / marca
- [ ] Adicionar seção 8.1 ao `documentacao/idVisual/id.md` com a tabela de contraste
      completa (§4.1 deste PRD), incluindo a regra nova "Ciano-Escuro nunca como
      texto/ícone sobre Grafite-Verde"
- [ ] Documentar regra de uso Toast vs. Alert (§4.9) como convenção do design system

### Testes
- [ ] Testes de contraste automatizados (axe-core ou similar) no CI para os
      componentes de risco, evitando regressão do bug corrigido na Fase 1
- [ ] Teste e2e (Playwright, já configurado no projeto) cobrindo: fechar aba no meio do
      wizard e reabrir → progresso preservado
- [ ] Teste de navegação por teclado no `RadioGroup` migrado (setas ↑↓)

---

## 8. Próximos Passos

1. **Validar este PRD com o time/produto** — em especial a decisão pendente do §4.18
   item 3 (unificar linguagem visual de risco entre landing e produto: mono-teal em
   tudo, ou reconsiderar semáforo em algum nível com cautela clínica). Essa é a única
   decisão deste documento que não é puramente técnica — precisa de aval de produto/
   clínico antes de qualquer implementação.
2. **Priorizar a Fase 1 imediatamente** — nenhum item depende de decisão de design
   pendente, todos são correções objetivas (bug de contraste, texto legal, perda de
   dados do wizard). Podem começar em paralelo à validação do restante do PRD.
3. **Prototipar as duas alternativas de visualização de risco** (gauge atual vs. bullet
   chart, §3.7) antes de decidir — não é uma correção, é uma escolha de produto que vale
   validar com 2-3 psicólogos reais antes de investir na Fase 3.
4. **Abrir os pré-requisitos de backend da Fase 4** como itens separados de backlog
   (busca de pacientes, edição de perfil, escopo de atribuição de avaliação) — já que
   nenhum é implementável só no frontend, e o histórico do projeto (`.claude/specs/04-spec-aplicacao.md`
   §7, R12) mostra que mudanças de schema em produção precisam ser coordenadas com
   cuidado (migração antes do deploy, nunca depois).
5. **Rodar cada fase contra produção real incrementalmente**, nunca como um "big bang"
   — este produto já está em uso por psicólogos e pacientes reais; qualquer regressão
   visual ou funcional tem custo direto em confiança clínica, não é só bug de software.
6. **Adicionar verificação de contraste ao processo de review** (checklist técnico §7)
   para que o tipo de bug encontrado neste PRD (badge de risco reprovando WCAG) não se
   repita silenciosamente em componentes futuros.
