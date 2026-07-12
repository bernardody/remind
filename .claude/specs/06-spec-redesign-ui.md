# Spec 06 — Redesign de UI/UX (Design System + Telas)

> Spec de implementação derivada do [`PRD.md`](../../PRD.md) (redesign de UI/UX, raiz do
> repo). Traduz as 8 seções do PRD em lista acionável de arquivos a **criar** e
> **modificar**, no mesmo formato das specs anteriores (`04-spec-aplicacao.md`).
> **Pré-requisito:** Fases 0–5a já implementadas e em produção (`04-spec-aplicacao.md`).
> **Status (atualizado 2026-07-12):** **Fases 1, 2 e 3 implementadas e commitadas.**
> Fase 4 não iniciada (depende de backend, ver §4). Verificação: `typecheck`/`lint`/
> `test`/`build` limpos após cada fase; a tela de login (Fase 3 + polimento adicional,
> ver §3.1) foi validada ponta a ponta com login real via Auth.js contra backend +
> Postgres locais (skill `verify`), não só lida no código.
> **Regra de execução:** produto já está em uso por psicólogos/pacientes reais — cada
> fase foi um commit incremental próprio, nunca um "big bang" (PRD §8.5).
> Todos os caminhos são relativos a `remind-web/`, salvo indicação contrária.

---

## 0. Decisão de produto — resolvida

~~Antes de iniciar a Fase 3 (telas), uma decisão não técnica precisava ser tomada~~ —
**decidido: Opção A, rampa de teal em tudo** (a mesma linguagem visual de
`RISK_BANDS`/`gauge.tsx`/`domain-bars.tsx` do produto real). Aplicado em `solution.tsx`
(gráfico + legenda, via `getRiskBandByLabel`) e `app-showcase.tsx` (badges de risco do
mock, via `Badge variant="risk"`, o mesmo componente do produto real).

---

## 1. Fase 1 — Correções e bloqueadores ✅ Implementada

Todos os itens abaixo foram aplicados, verificados (`typecheck`/`lint`/`test`/`build`
limpos) e commitados. Sem regressão.

| Arquivo | Mudança | Status |
|---|---|---|
| `app/(marketing)/privacidade/page.tsx`, `termos/page.tsx` | Aviso "⚠️ provisório" trocado por texto discreto sem emoji (`Alert` da Fase 2 não existia ainda neste ponto — ficou como parágrafo simples, conforme previsto) | ✅ |
| `components/charts/gauge.tsx`, `domain-bars.tsx` | Badge de risco: texto Grafite-Verde quando o fundo é o tom claro da rampa (`#7AB1A8`, "Baixo"), branco nos demais — corrige reprovação WCAG AA (2.42:1 → 6.07:1) | ✅ |
| `lib/constants.ts` | `RISK_BANDS` ganhou campo `textColor` por item | ✅ |
| `stores/wizard-store.ts` | Middleware `persist` do Zustand (`sessionStorage`) — progresso do wizard sobrevive a fechar aba/refresh | ✅ |
| `features/patients/components/patients-view.tsx` | Rótulo "Remover" → "Inativar" (botão, `AlertDialog`, toasts) | ✅ |
| `app/(app)/psicologo/avaliacoes/[id]/page.tsx` | Chips de contagem unificados em `Badge variant="outline"` | ✅ |
| `components/marketing/site-footer.tsx` | Ano do copyright dinâmico | ✅ |
| `components/layout/sidebar-nav.tsx` + `lib/constants.ts` | Badge "Em breve" no item "Relatórios" (novo campo `NavItem.badge`) | ✅ |
| `app/(app)/psicologo/relatorios/page.tsx` | Copy do placeholder reescrita (sem linguagem interna de engenharia) | ✅ |
| `components/ui/dialog.tsx` | `bg-background` → `bg-card` (elevação real do modal) | ✅ |
| `components/ui/select.tsx`, `components/ui/badge.tsx` | Focus ring sem opacidade `/50`, igual a `button.tsx` | ✅ |
| 5 tabelas (`patients-view`, `patient-questionnaires-table`, `questionnaire-patients-table`, `questionnaires-view`, `available-questionnaires`) | Coluna "Ações" com `header: () => <span className="sr-only">Ações</span>` | ✅ |

---

## 2. Fase 2 — Extensão do design system ✅ Implementada

### 2.1 Componentes criados

| Arquivo | Status | Observação |
|---|---|---|
| `components/ui/alert.tsx` | ✅ | Variantes `default`/`warning`/`destructive`. Usado em `ProfileCard` (Fase 3) |
| `components/ui/breadcrumb.tsx` | ✅ | Usado em `pacientes/[id]/page.tsx` (Fase 3) |
| `components/ui/tabs.tsx` | ✅ | Usado na tela de resultado (Fase 3) |
| `components/ui/spinner.tsx` | ✅ | Não estava na lista original — necessário pro `isLoading` do `Button` |
| `components/ui/tooltip.tsx` | ✅ criado | ⏳ **ainda não usado em nenhuma tela** — fica disponível pra Fase 4+ |
| `components/ui/popover.tsx` | ✅ criado | ⏳ **ainda não usado** — o uso previsto (`Calendar`) não foi criado |
| `components/ui/avatar.tsx` | ✅ criado | ⏳ **ainda não usado** — `Topbar` continua com o `<span>` de iniciais hand-rolled; extrair fica pra quando mexer no Topbar de novo |
| `components/ui/progress.tsx` | ✅ criado | ⏳ **ainda não usado** — `progress-bar.tsx` do wizard continua com sua barra própria (a Fase 3 só ajustou o rótulo de texto, não trocou a implementação) |
| `components/ui/radio-group.tsx` | ✅ criado | Usado só como componente genérico de referência — o wizard (`question-step.tsx`) usa `RadioGroupPrimitive` diretamente (ver §3) porque precisava do card inteiro clicável, não do círculo pequeno padrão |
| `components/ui/calendar.tsx` | ❌ **não criado** | Decisão mantida: exigiria a dependência nova `react-day-picker`; `<input type="date">` nativo continua em uso, nenhuma tela pediu por isso ainda |
| `components/ui/command.tsx` | ❌ **não criado** | Fase 4 (exigiria `cmdk`), conforme já previsto |

### 2.2 Alterações em componentes existentes ✅

| Arquivo | Mudança |
|---|---|
| `components/ui/badge.tsx` | Nova variante `variant="risk"` (cor via `style`) — usada em `gauge.tsx`, `domain-bars.tsx`, `app-showcase.tsx` |
| `components/shared/data-table.tsx` | `getSortedRowModel` + header clicável com ícone de ordenação (`ArrowUp`/`ArrowDown`/`ArrowUpDown`); `enableSorting: false` explícito nas colunas "Ações" |
| `features/questionnaires/components/wizard/question-step.tsx` | Migrado para `RadioGroupPrimitive` do Radix (import direto, não o `components/ui/radio-group.tsx` genérico — ver nota acima) |
| `components/ui/button.tsx` | Prop `isLoading` (troca conteúdo por `<Spinner/>`, ignorada quando `asChild=true`) |

### 2.3 Documentação ✅

| Arquivo | Status |
|---|---|
| `documentacao/idVisual/id.md` | Seção **8.1** adicionada (tabela de contraste estendida) |
| `documentacao/idVisual/design-system-uso.md` | **Criado** (não existia antes) — convenções Toast vs. Alert, uso do badge `risk`, Breadcrumb, Skeleton vs. Spinner, Tooltip, **e uma seção 5 nova sobre o pitfall do import de `Slot`** (ver §2.4 abaixo) |

### 2.4 Achado não previsto — regressão de bundle size, corrigida

Não estava no plano original. Ao concluir a Fase 3, o build de produção acusou a
landing page crescendo de **194 kB → 269 kB** de First Load JS. Investigação (ver
histórico da sessão): `components/ui/badge.tsx` importava `Slot` do pacote bundlado
`"radix-ui"` (~25 primitivos num módulo só, incl. Menubar/ScrollArea/OTP — nada disso
usado no projeto), em vez do pacote individual `@radix-ui/react-slot` que
`button.tsx` já usa. A landing nunca tinha importado `Badge` antes de
`app-showcase.tsx` (Fase 3, §0), então herdou o pacote inteiro na primeira vez.

**Corrigido**: `badge.tsx` e `breadcrumb.tsx` trocados para `@radix-ui/react-slot`.
Resultado após rebuild limpo:

| Rota | Antes | Depois |
|---|---|---|
| `/` (landing) | 269 kB | **194 kB** |
| `/psicologo/avaliacoes/[id]` | 232 kB | **156 kB** |
| `/psicologo/pacientes/[id]` | 232 kB | **156 kB** |

Regra documentada em `design-system-uso.md` §5: componentes que só precisam de `Slot`
sempre importam de `@radix-ui/react-slot`, nunca do pacote `"radix-ui"` bundlado.

---

## 3. Fase 3 — Redesign de telas de alto impacto ✅ Implementada

| Tela / arquivo | O que foi feito | Desvio do plano original |
|---|---|---|
| `app/(app)/psicologo/dashboard/page.tsx` + `loading.tsx` (novo) | Card "Avaliações recentes" (agregação de `/questionarios/{id}/pacientes` de até 5 questionários, 5 respostas cada, ordenado no frontend); grid `sm:grid-cols-2 lg:grid-cols-4`; skeleton via `loading.tsx` nativo do App Router | Nenhum |
| `patients-view.tsx` | `getSortedRowModel` ativado; layout em cards abaixo de `md` (`hidden md:block` na tabela + bloco `md:hidden` próprio, com paginação duplicada); ícone `Info` reforçando o aviso de busca | Nenhum |
| `pacientes/[id]/page.tsx` | `Breadcrumb`; grid `lg:grid-cols-3` (`PatientInfoCard` 1 coluna + card "Resumo clínico" 2 colunas com última avaliação + `Badge risk`); `formatRelativeDate` novo em `lib/utils.ts` | O "resumo/mini-histórico" buscou `average` via `/resultado` da avaliação mais recente (endpoint extra não citado explicitamente no plano, mas dentro do espírito "dado que já existe") |
| `questionnaires-view.tsx` | Texto explicativo; filtro por **status** (real); coluna "Respondida por" via `useQueries` (`/questionarios/{id}/pacientes?size=1` por linha, só `totalElements`) | **Filtro por escala não implementado** — documentado no código: `/questionarios` (lista) não traz `scale`, só o detalhe (`/questionarios/{id}`); filtrar exigiria N+1 fetches de detalhe só pra isso, custo não justificado pelo catálogo pequeno de hoje |
| `avaliacoes/[id]/pacientes/[pid]/page.tsx` | `Tabs` ("Resumo" / "Respostas detalhadas"); `Accordion` agrupando respostas por escala — precisou de um fetch extra (`QuestionnaireDetail`) só pra mapear `questionId → scale.name`, porque `/respostas` não traz a escala de cada pergunta | **Bullet chart não prototipado** — decisão de design que a spec já marcava como "validar com psicólogos antes", segue em aberto, gauge circular mantido |
| `perfil/page.tsx` (×2) + `ProfileCard` | Não viraram um único componente de rota, mas já **compartilhavam** `ProfileCard` — a "unificação" virou: `ProfileCard` ganhou um `Alert variant="warning"` ("Edição de perfil em breve"), mudança no único ponto compartilhado | Interpretação mais enxuta que "componente único parametrizado por userType" — as duas páginas já eram idênticas via `ProfileCard`, criar um wrapper novo seria abstração sem ganho |
| `available-questionnaires.tsx` | Ícones por estado: `CheckCircle2` (já respondido), `Lock` (indisponível), `ArrowRight` (responder) | Nenhum |
| `question-step.tsx` + `questionnaire-wizard.tsx` | Transição `AnimatePresence`/`motion` entre perguntas (respeitando `useReducedMotion`) | Nenhum |
| `progress-bar.tsx` | Prop `isReview` — rótulo "Revisão das respostas" / "Pronta para enviar" em vez de "Pergunta Y de Y" | Não foi extraído para `components/ui/progress.tsx` (ver §2.1) — o componente próprio do wizard já resolvia, trocar a implementação não era necessário só pelo rótulo |
| `app-showcase.tsx`, `solution.tsx` | Linguagem de risco já alinhada em §0 | Números/stats do mock (48 pacientes, 126 avaliações) **não foram realinhados** ao dashboard real — ilustrativos, não é dado real, decisão de deixar como está |
| `challenge.tsx` | Ícone do card em `bg-graphite/8 text-graphite` (tom sério) em vez de `bg-secondary/30 text-primary` — diferencia do tom de `features.tsx` (mantido teal/positivo) | Nenhum |
| `hero.tsx` | Asset **já existia** (`public/brand/hero-bg.png`, confirmado com `ls`) — só o comentário no código estava desatualizado (citava `.jpg`), corrigido | Não era bug real, só doc desatualizada |
| `demo-form.tsx` | Asterisco nos labels dos 3 campos obrigatórios (Nome, E-mail, Telefone), confirmado contra `leadSchema` (zod) que `clinica`/`mensagem` são os únicos opcionais | Nenhum |
| `contato/page.tsx` | Legenda de uma linha em cada card (Email/Telefone) | Sem WhatsApp/horário — dado não existe em `lib/constants.ts#SITE`, decidiu não inventar |
| `login-form.tsx` | Erro de rede/5xx diferenciado de credencial inválida via `ServerUnavailableError` (subclasse de `CredentialsSignin` do Auth.js, `code="server-unavailable"`) em `lib/auth/config.ts` — **verificado ponta a ponta** (login real, senha errada, backend derrubado de propósito) contra backend+Postgres locais | Implementado além do previsto: ver §3.1 |
| `app/(auth)/layout.tsx` | Tagline (`SITE.tagline`) abaixo do logo em mobile (não em `brand-panel.tsx`, que só existe pro desktop) | O plano citava `brand-panel.tsx`; a mudança certa era no `layout.tsx`, que já tem o bloco condicional `lg:hidden` |

### 3.1 Polimento adicional da tela de login (skill `impeccable`, pós-Fase 3)

Fora do escopo original desta spec — pedido separado do usuário ("a página de login
tá muito confusa"), usando o skill `impeccable` (registro "product"). Tocou o mesmo
`login-form.tsx` já modificado na Fase 3:

- Link "Voltar ao site" movido do rodapé (quase invisível) pro topo do form, com ícone
  `ArrowLeft` — dá âncora/saída clara, resolve a assimetria do form "flutuando" sem
  nada acima dele no desktop.
- Animação do alerta de erro reformulada: **reveal** (opacity/height) e **shake** (só
  `x`) separados em elementos aninhados em vez de uma única transição fazendo os três
  ao mesmo tempo (que competiam visualmente); passou a respeitar
  `prefers-reduced-motion` de verdade (`useReducedMotion`), o que não acontecia antes
  apesar da spec original já reivindicar isso.
- Botão de submit migrado pro `isLoading` do `Button` (Fase 2) — antes usava um
  `Loader2` solto manual, inconsistente com o resto do design system.
- Transição sutil (fade+scale, 150ms) na troca do ícone mostrar/ocultar senha.

**Verificação real** (skill `verify`): Postgres 16 em Docker (porta 5433, isolado do
Postgres nativo da máquina), schema+seed carregados, usuário de teste com hash bcrypt
gerado via teste JUnit descartável (removido depois), backend Spring Boot local,
frontend Next.js local (porta 3100) — login válido, senha errada e backend
derrubado de propósito testados via `curl` através do fluxo real do Auth.js
(`/api/auth/callback/credentials`), confirmando `code=credentials` vs.
`code=server-unavailable` chegando corretamente no cliente. Ambiente todo limpo depois
(container removido, servidores parados).

---

## 4. Fase 4 — Pré-requisitos de backend / decisão de produto ⏳ Não iniciada

**Não implementável só no frontend.** Nenhum item abaixo foi tocado — segue como
backlog de backend, igual ao planejamento original.

| Item | Endpoint/contrato necessário | Tela impactada |
|---|---|---|
| Busca real de pacientes | `GET /pacientes?search=` (ou equivalente) | `pacientes/page.tsx` |
| Edição de perfil / troca de senha | `PUT /me` ou equivalente para paciente | `perfil/page.tsx` (ambos os perfis) |
| Escopo real de "avaliação atribuída ao paciente" | Endpoint que filtre `/questionarios` por atribuição | `paciente/inicio/page.tsx` |
| Evolução longitudinal (Fase 5b, já adiada) | Ver `04-spec-aplicacao.md` §6 | `relatorios/page.tsx`, novo `trend-line.tsx` |
| Recuperação de senha | Endpoint de reset ainda inexistente | `login/page.tsx` |
| "Pacientes em risco alto" agregado no dashboard | Endpoint de agregação (hoje `scaleResults` só por avaliação individual) | `dashboard/page.tsx` |
| Filtro por escala na lista de avaliações | `/questionarios` (lista) não traz `scale` — endpoint precisaria expor isso, ou aceitar N+1 | `avaliacoes/page.tsx` |

---

## 5. Testes a adicionar ⏳ Não implementado

Nenhum teste novo foi escrito nesta rodada — a verificação foi manual/via build em
cada fase (`typecheck`/`lint`/`test`/`build`, mais a verificação end-to-end da tela de
login em §3.1). Os testes automatizados abaixo continuam como trabalho futuro:

| Teste | Ferramenta | Cobre |
|---|---|---|
| Contraste automatizado dos componentes de risco (`Gauge`, `DomainBars`, `Badge variant="risk"`) | axe-core (via Vitest/Testing Library, já configurado) | Regressão do fix de contraste da Fase 1 |
| Fechar aba/refresh no meio do wizard → progresso preservado | Playwright (já configurado, `tests/`) | `stores/wizard-store.ts` com `persist` |
| Navegação por teclado (setas ↑↓) no `RadioGroup` do wizard | Playwright ou Testing Library | Migração de `question-step.tsx` |
| Ordenação de coluna no `DataTable` | Testing Library | `getSortedRowModel` novo |
| Login: credencial inválida vs. servidor indisponível | Playwright ou teste de integração do Auth.js | `ServerUnavailableError`/`code` (verificado manualmente em §3.1, não automatizado) |

---

## 6. Resumo — arquivos desta spec (estado final)

**Fase 1:** `privacidade/page.tsx`, `termos/page.tsx`, `gauge.tsx`, `domain-bars.tsx`,
`lib/constants.ts`, `stores/wizard-store.ts`, `patients-view.tsx`,
`avaliacoes/[id]/page.tsx`, `site-footer.tsx`, `sidebar-nav.tsx`, `relatorios/page.tsx`,
`components/ui/{dialog,select,badge}.tsx`, colunas de ação de 5 tabelas.

**Fase 2 (criados):** `components/ui/{alert,breadcrumb,tabs,tooltip,popover,avatar,
progress,radio-group,spinner}.tsx`, `documentacao/idVisual/design-system-uso.md`.
**Fase 2 (modificados):** `badge.tsx`, `data-table.tsx`, `question-step.tsx`,
`button.tsx`, `documentacao/idVisual/id.md` (§8.1). **Não criados:** `calendar.tsx`,
`command.tsx` (deliberado).

**Fase 2 (correção pós-hoc, §2.4):** `badge.tsx`, `breadcrumb.tsx` — import de `Slot`
trocado pra `@radix-ui/react-slot` (regressão de bundle size encontrada e corrigida).

**Fase 3:** `dashboard/page.tsx` + `loading.tsx` (novo), `patients-view.tsx`,
`pacientes/[id]/page.tsx`, `lib/utils.ts` (+`formatRelativeDate`),
`patient-info-card.tsx`, `questionnaires-view.tsx`,
`avaliacoes/[id]/pacientes/[pid]/page.tsx`, `profile-card.tsx`,
`available-questionnaires.tsx`, `question-step.tsx`, `questionnaire-wizard.tsx`,
`progress-bar.tsx`, `challenge.tsx`, `hero.tsx`, `demo-form.tsx`, `contato/page.tsx`,
`login-form.tsx`, `app/(auth)/layout.tsx`, `lib/auth/config.ts`
(+`ServerUnavailableError`).

**Fase 3.1 (polimento login, pós-hoc):** `login-form.tsx` (segunda rodada de mudanças
no mesmo arquivo — ver §3.1).

**Fase 4:** nada tocado, backlog de backend inalterado.

**Testes automatizados (§5):** nada criado — pendência real, não fictícia.
