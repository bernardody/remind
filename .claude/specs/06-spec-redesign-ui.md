# Spec 06 — Redesign de UI/UX (Design System + Telas)

> Spec de implementação derivada do [`PRD.md`](../../PRD.md) (redesign de UI/UX, raiz do
> repo). Traduz as 8 seções do PRD em lista acionável de arquivos a **criar** e
> **modificar**, no mesmo formato das specs anteriores (`04-spec-aplicacao.md`).
> **Pré-requisito:** Fases 0–5a já implementadas e em produção (`04-spec-aplicacao.md`).
> **Status:** proposta — nenhum arquivo abaixo foi criado/modificado ainda.
> **Regra de execução:** produto já está em uso por psicólogos/pacientes reais — cada
> fase abaixo deve ser um PR/deploy incremental próprio, nunca um "big bang" (PRD §8.5).
> Todos os caminhos são relativos a `remind-web/`, salvo indicação contrária.

---

## 0. Decisão de produto pendente — bloqueia parte do escopo

Antes de iniciar a Fase 3 (telas), uma decisão **não técnica** precisa ser tomada com o
time/clínico (PRD §4.18 item 3, §8.1):

> **A rampa de risco (Baixo/Moderado/Alto) usa um único matiz (teal) no produto real,
> mas a landing (`solution.tsx`) mostra um mock com semáforo vermelho/âmbar/verde.**
> Escolher uma linguagem visual única e aplicá-la nos dois lugares — não é opcional,
> ver §3 desta spec (`Fase 3`, item da landing).

Sem essa decisão, os itens que tocam `solution.tsx`/`app-showcase.tsx` (Fase 3) ficam
bloqueados. Os itens de Fase 1 e Fase 2 **não dependem** dessa decisão e podem começar
imediatamente.

---

## 1. Fase 1 — Correções e bloqueadores

Sem dependência de componente novo, sem risco de regressão. Pode ir para produção como
um único PR pequeno ou vários PRs triviais.

| Arquivo | Mudança | Motivo (PRD §) |
|---|---|---|
| `app/(marketing)/privacidade/page.tsx` | Remover `⚠️ Texto provisório, a ser revisado juridicamente...`. Substituir por texto jurídico definitivo (se disponível) ou por um `Alert` de rascunho controlado (depende do componente novo da Fase 2 — até lá, manter aviso discreto sem emoji cru) | §2.2 "Bloqueador de release", §5.2 |
| `app/(marketing)/termos/page.tsx` | Idem acima | §2.2, §5.2 |
| `components/charts/gauge.tsx` | Badge de risco: cor do texto passa a depender do fundo — Grafite-Verde (`#1C2B2B`) quando `band.color === "#7AB1A8"` (Baixo), branco nos demais. Hoje `text-white` fixo na `<span>` de risco (linha ~60-65) | §2.3, §4.1, §4.18 — **correção de WCAG AA verificada por cálculo (2.42:1 → reprova)** |
| `components/charts/domain-bars.tsx` | Mesma correção de contraste no badge de risco por escala | §2.3, §4.1, §4.18 |
| `lib/constants.ts` | `RISK_BANDS`: adicionar campo `textColor` por item (`"#1C2B2B"` para Baixo, `"#FFFFFF"` para Moderado/Alto). `gauge.tsx`/`domain-bars.tsx` passam a ler `band.textColor` em vez de assumir branco | §4.1 — token de origem da correção acima |
| `stores/wizard-store.ts` | Adicionar middleware `persist` do Zustand (ex. `sessionStorage`, já que é um fluxo de sessão única) ao redor do store atual, mantendo a lógica existente de `start()` (só reseta se o paciente mudou de questionário) | §2.2 "perda de progresso", §5.13 — **prevenção de perda de dados do paciente** |
| `features/patients/components/patients-view.tsx` (ou onde estiver o `AlertDialog` de exclusão) | Rótulo do botão de ação: `"Remover"` → `"Inativar"`. Manter a descrição existente (já explica corretamente que é reversível só por suporte) | §2.2, §5.5 — rótulo≠comportamento |
| `app/(app)/psicologo/avaliacoes/[id]/page.tsx` | Trocar os dois `<span border border-border>` de contagem (perguntas/escalas) por `<Badge variant="outline">` | §2.2, §4.7, §5.8 — unificação de componente |
| `components/marketing/site-footer.tsx` | `const year = 2026` → `new Date().getFullYear()` (linha ~9), alinhando com `app-shell.tsx`/`brand-panel.tsx` | §2.2 — inconsistência de padrão |
| `components/layout/sidebar-nav.tsx` + `lib/constants.ts#PSYCHOLOGIST_NAV` | Item "Relatórios": adicionar indicador visual "Em breve" (badge pequeno ao lado do label) | §2.2, §4.10, §5.10 |
| `app/(app)/psicologo/relatorios/page.tsx` | Copy do `EmptyState`: trocar "Condicionado a dados do backend" por texto orientado a produto (ex. "Em desenvolvimento — chegará em breve com a evolução dos seus pacientes ao longo do tempo") | §5.10 — linguagem interna vazando pro usuário |
| `components/ui/dialog.tsx` | `DialogContent`: `bg-background` → `bg-card` (linha ~64) para gerar contraste de elevação real com o fundo da página | §2.2, §4.5 |
| `components/ui/select.tsx`, `components/ui/badge.tsx` | Padronizar `focus-visible:ring-ring/50` → `focus-visible:ring-2 focus-visible:ring-ring` (sem opacidade), igual já está em `button.tsx` | §3.2 (achado de auditoria shadcn 2026), §4.1 |
| Colunas `"Ações"` em tabelas (`patients-view.tsx`, demais usos de `DataTable`) | `header: ""` → `header: () => <span className="sr-only">Ações</span>` (ou equivalente `aria-label` na `TableHead`) | §2.2, §4.6 — leitor de tela sem contexto |

---

## 2. Fase 2 — Extensão do design system

Componentes novos em `components/ui/` (todos via `npx shadcn@latest add <nome>`, estilo
`new-york` já configurado em `components.json` — manter consistência de instalação).
Nenhuma tela é tocada nesta fase; é só base para a Fase 3.

### 2.1 Componentes a criar

| Arquivo | Conteúdo | Primeiro uso previsto (Fase 3) |
|---|---|---|
| `components/ui/alert.tsx` | Padrão shadcn, variantes `default`/`warning`/`destructive` | Banner "complete seu perfil" (R9 pendente), aviso legal temporário em `privacidade`/`termos` |
| `components/ui/breadcrumb.tsx` | Padrão shadcn | `pacientes/[id]`, `avaliacoes/[id]/pacientes/[pid]` — **nunca** no wizard do paciente |
| `components/ui/tabs.tsx` | Radix Tabs | Tela de resultado (`avaliacoes/[id]/pacientes/[pid]`) — "Resumo" vs. "Respostas detalhadas" |
| `components/ui/tooltip.tsx` | Radix Tooltip | Ícones de ação sem label em tabelas |
| `components/ui/popover.tsx` | Radix Popover | Pré-requisito de `calendar.tsx`; menus de filtro avançado |
| `components/ui/avatar.tsx` | Padrão shadcn | Extrai o `<span>` de iniciais hoje hardcoded em `topbar.tsx` |
| `components/ui/progress.tsx` | Padrão shadcn (Radix Progress) | Extraído de `features/questionnaires/components/wizard/progress-bar.tsx`; reuso futuro (ex. completude de perfil) |
| `components/ui/radio-group.tsx` | Radix RadioGroup | Substitui o `<button role="radio">` manual em `question-step.tsx` |
| `components/ui/calendar.tsx` | Padrão shadcn (baixa prioridade) | Formulário de paciente, se/quando substituir `<input type="date">` nativo |
| `components/ui/command.tsx` | `cmdk` + shadcn (Fase 4, não bloqueia esta fase) | Command palette (⌘K) do psicólogo |

### 2.2 Alterações em componentes existentes

| Arquivo | Mudança |
|---|---|
| `components/ui/badge.tsx` | Nova variante `variant="risk"`, recebendo `style={{ backgroundColor, color: textColor }}` a partir de um `RiskBand` — elimina a duplicação de `<span>` de badge de risco hoje recriada em `gauge.tsx` e `domain-bars.tsx` |
| `components/shared/data-table.tsx` | Adicionar `getSortedRowModel()` ao `useReactTable`; headers ganham indicador de ordenação (ícone) e `onClick`. Paginação: adicionar "Página X de Y" entre os botões Anterior/Próxima, mantendo a API `Page<T>` do Spring já consumida |
| `features/questionnaires/components/wizard/question-step.tsx` | Migrar de `<button role="radio">` manual para `RadioGroup`/`RadioGroupItem` do novo `components/ui/radio-group.tsx`, preservando o visual de "cards selecionáveis" (className customizado no `RadioGroupItem`, não o indicador circular padrão) |
| `components/ui/button.tsx` | Adicionar prop `isLoading?: boolean` que troca o conteúdo por `<Spinner />` (requer `components/ui/spinner.tsx`, shadcn 2025) e aplica `disabled` automaticamente |

### 2.3 Documentação (não é código, mas é parte do design system)

| Arquivo | Mudança |
|---|---|
| `documentacao/idVisual/id.md` | Adicionar seção **8.1 — Tabela de contraste estendida**, com as combinações validadas no PRD §4.1 (incluindo a regra nova: "Ciano-Escuro nunca como texto/ícone sobre Grafite-Verde", achado §2.3 do PRD) |
| `documentacao/idVisual/id.md` ou novo `documentacao/idVisual/design-system-uso.md` | Documentar a regra Toast vs. Alert (PRD §4.9): toast = evento pontual auto-dismiss; Alert = estado contínuo até resolvido — nunca usar toast para erro que bloqueia fluxo clínico |

---

## 3. Fase 3 — Redesign de telas de alto impacto

Depende da Fase 2 (componentes prontos). Cada linha pode ser um PR próprio — não há
dependência entre telas diferentes, exceto onde indicado.

| Tela / arquivo | Mudança | Depende de |
|---|---|---|
| `app/(app)/psicologo/dashboard/page.tsx` | Adicionar card "Avaliações recentes" (agregação de `/questionarios/{id}/pacientes` no frontend, sem endpoint novo); reorganizar grid para 3-4 colunas em telas largas; criar `app/(app)/psicologo/dashboard/loading.tsx` (skeleton nativo do App Router) | — |
| `app/(app)/psicologo/pacientes/page.tsx` + `patients-view.tsx` | Ativar `getSortedRowModel` (Fase 2); layout alternativo em cards abaixo do breakpoint `md` (a tabela tem 7 colunas); reforçar visualmente (não só texto pequeno) que a busca é só da página carregada, até a busca real de backend existir (Fase 4) | `data-table.tsx` (Fase 2) |
| `app/(app)/psicologo/pacientes/[id]/page.tsx` | Layout de 2 colunas em desktop (dados cadastrais + resumo/mini-histórico com "última avaliação: {data}, risco {label}", dado já disponível via `/pacientes/{id}/avaliacoes`); adicionar `Breadcrumb` "Pacientes › {Nome}"; formatação relativa de data | `components/ui/breadcrumb.tsx` (Fase 2) |
| `app/(app)/psicologo/avaliacoes/page.tsx` (`questionnaires-view.tsx`) | Texto explicativo curto sobre ausência de CTA de criar avaliação; filtro por escala/status; trocar coluna "Atualizado em" por "Respondida por N pacientes" | — |
| `app/(app)/psicologo/avaliacoes/[id]/pacientes/[pid]/page.tsx` | Agrupar lista de respostas por escala usando `Accordion` (já existe, subaproveitado); considerar `Tabs` "Resumo"/"Respostas detalhadas"; prototipar bullet chart como alternativa ao `Gauge` circular (decisão de design, validar com 2-3 psicólogos antes de trocar definitivamente) | `components/ui/tabs.tsx` (Fase 2); correção de contraste já feita na Fase 1 |
| `app/(app)/psicologo/perfil/page.tsx` + `app/(app)/paciente/perfil/page.tsx` + `ProfileCard` | Unificar como componente único parametrizado por `userType`; adicionar estado visual "em breve" para edição de dados/senha (a edição real depende de `PUT /me`, Fase 4) | — |
| `app/(app)/paciente/inicio/page.tsx` (`available-questionnaires.tsx`) | Diferenciar os 3 estados (Responder/Já respondido/Indisponível) com ícone, não só texto | — |
| `features/questionnaires/components/wizard/question-step.tsx` | Adicionar transição `motion/react` entre perguntas (já é dependência do projeto) | Migração para `RadioGroup` (Fase 2) |
| `features/questionnaires/components/wizard/progress-bar.tsx` | Tratar o passo de revisão como etapa visualmente distinta, não "Pergunta Y de Y" | `components/ui/progress.tsx` (Fase 2), se optar por extrair |
| `components/marketing/app-showcase.tsx`, `components/marketing/solution.tsx` | Realinhar o mock ao estado real do produto **após** o redesign do dashboard (linha acima) — inclui aplicar a decisão de linguagem de risco tomada em §0 desta spec | §0 desta spec (decisão de produto) + redesign do dashboard |
| `components/marketing/challenge.tsx`, `components/marketing/features.tsx` | Diferenciar visualmente tom "problema" de tom "solução" (hoje mesmo padrão de card) | — |
| `components/marketing/hero.tsx` | Verificar/corrigir asset `hero-bg.png` (comentário no código cita `.jpg`, possível descompasso) | — |
| `components/marketing/demo-form.tsx` | Indicador visual consistente para campos obrigatórios vs. opcionais | — |
| `app/(marketing)/contato/page.tsx` | Enriquecer cards de contato (horário, WhatsApp) para reduzir espaço vazio | — |
| `features/auth/components/login-form.tsx` | Diferenciar estado de erro de rede/5xx detectável (timeout, `fetch` falhou) da mensagem de "credencial inválida" — mantendo a mensagem ambígua só para o caso real de credencial errada (não vazar existência de conta) | — |
| `features/auth/components/brand-panel.tsx` | Trazer ao menos a tagline de marca para o topo do formulário em mobile (hoje só logo pequeno) | — |

---

## 4. Fase 4 — Pré-requisitos de backend / decisão de produto

**Não implementável só no frontend.** Registrar como itens de backlog de backend
separados — não iniciar UI que dependa deles sem o contrato de API definido primeiro
(mesmo padrão de risco já documentado em `04-spec-aplicacao.md` §7, R12: migração de
schema em produção precisa vir *antes* do deploy do frontend que a consome).

| Item | Endpoint/contrato necessário | Tela impactada |
|---|---|---|
| Busca real de pacientes | `GET /pacientes?search=` (ou equivalente) | `pacientes/page.tsx` |
| Edição de perfil / troca de senha | `PUT /me` ou `PUT /psychologists/me/profile` equivalente para paciente (hoje só existe para psicólogo com perfil incompleto, ver `05-spec-login-google.md`) | `perfil/page.tsx` (ambos os perfis) |
| Escopo real de "avaliação atribuída ao paciente" | Endpoint que filtre `/questionarios` por atribuição, não só por `active` | `paciente/inicio/page.tsx` |
| Evolução longitudinal (Fase 5b, já adiada) | Ver `04-spec-aplicacao.md` §6 — questionários novos por escala, agregação por `Scale` | `relatorios/page.tsx`, novo `trend-line.tsx` |
| Recuperação de senha | Endpoint de reset ainda inexistente | `login/page.tsx` |
| "Pacientes em risco alto" agregado no dashboard | Hoje `scaleResults` só é acessível por avaliação individual — precisaria de endpoint de agregação, ou o frontend aceita não ter esse card até existir | `dashboard/page.tsx` |

---

## 5. Testes a adicionar

| Teste | Ferramenta | Cobre |
|---|---|---|
| Contraste automatizado dos componentes de risco (`Gauge`, `DomainBars`, `Badge variant="risk"`) | axe-core (via Vitest/Testing Library, já configurado) | Não deixar a correção da Fase 1 regredir silenciosamente |
| Fechar aba/refresh no meio do wizard → progresso preservado | Playwright (já configurado, `tests/`) | `stores/wizard-store.ts` com `persist` |
| Navegação por teclado (setas ↑↓) no `RadioGroup` do wizard | Playwright ou Testing Library | Migração de `question-step.tsx` |
| Ordenação de coluna no `DataTable` | Testing Library | `getSortedRowModel` novo |

---

## 6. Resumo — arquivos desta spec

**Fase 1 (correção, sem componente novo):** `privacidade/page.tsx`, `termos/page.tsx`,
`gauge.tsx`, `domain-bars.tsx`, `lib/constants.ts`, `stores/wizard-store.ts`,
`patients-view.tsx`, `avaliacoes/[id]/page.tsx`, `site-footer.tsx`, `sidebar-nav.tsx`,
`relatorios/page.tsx`, `components/ui/dialog.tsx`, `components/ui/select.tsx`,
`components/ui/badge.tsx`, colunas de ação de tabelas.

**Fase 2 (design system, arquivos novos):** `components/ui/{alert,breadcrumb,tabs,
tooltip,popover,avatar,progress,radio-group,calendar,command,spinner}.tsx` +
alterações em `badge.tsx`, `data-table.tsx`, `question-step.tsx`, `button.tsx` +
adendo ao `id.md`.

**Fase 3 (telas):** `dashboard/page.tsx` (+`loading.tsx` novo), `pacientes/page.tsx`,
`pacientes/[id]/page.tsx`, `avaliacoes/page.tsx`, `avaliacoes/[id]/pacientes/[pid]/
page.tsx`, `perfil/page.tsx` (×2, unificados), `paciente/inicio/page.tsx`,
`question-step.tsx`, `progress-bar.tsx`, `app-showcase.tsx`, `solution.tsx`,
`challenge.tsx`, `features.tsx`, `hero.tsx`, `demo-form.tsx`, `contato/page.tsx`,
`login-form.tsx`, `brand-panel.tsx`.

**Fase 4 (backlog de backend, fora deste frontend):** busca de pacientes, `PUT /me`,
escopo de atribuição de avaliação, Fase 5b (já registrada em `04-spec-aplicacao.md`),
recuperação de senha, agregação de risco alto para o dashboard.

**Bloqueado por decisão de produto (§0):** unificação da linguagem visual de risco
entre `solution.tsx`/`app-showcase.tsx` (landing) e `gauge.tsx`/`domain-bars.tsx`
(produto real) — decidir antes de tocar os arquivos de marketing na Fase 3.
