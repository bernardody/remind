# CONVENÇÕES DE USO — Design System ReMind

> Complementa `id.md` (identidade visual). Este arquivo documenta regras de **uso** de
> componentes/padrões que não são sobre cor/tipografia, mas sobre *quando* usar cada
> componente. Origem: redesign de UI/UX (`PRD.md`, jul/2026).

---

## 1. Toast vs. Alert

Dois componentes parecidos, propósitos diferentes — não são intercambiáveis.

| | `Toast` (`components/ui/sonner.tsx`) | `Alert` (`components/ui/alert.tsx`) |
|---|---|---|
| Duração | Pontual, some sozinho | Contínuo, fica até ser resolvido/dispensado |
| Posição | Canto da tela, sobrepõe conteúdo | Inline, dentro do fluxo da página |
| Uso | Confirmação de uma ação do usuário (ex. "Paciente cadastrado") | Estado persistente que precisa de atenção (ex. "Complete seu perfil", aviso de conteúdo em revisão) |
| **Nunca usar para** | Erro que bloqueia o fluxo clínico (ex. falha ao carregar resultado de uma avaliação) | — |

Regra: se o usuário pode continuar sem notar a mensagem, é `Toast`. Se a mensagem
precisa continuar visível até algo mudar, é `Alert` (ou `ErrorState`/`EmptyState` para
o caso específico de página/lista vazia ou com erro de carregamento).

---

## 2. Badge `variant="risk"`

`components/ui/badge.tsx` tem uma variante `risk` sem cor própria — a cor vem sempre via
`style` a partir de um `RiskBand` (`lib/constants.ts#RISK_BANDS`), nunca hardcoded:

```tsx
<Badge
  variant="risk"
  style={{ backgroundColor: band.color, color: band.textColor }}
>
  Risco {band.label.toLowerCase()}
</Badge>
```

`textColor` já é o texto seguro (WCAG AA) para aquele `color` especificamente — nunca
sobrescrever para branco fixo (ver `id.md` §8.1, o tom claro da rampa reprova contraste
com texto branco).

---

## 3. Breadcrumb

Só em telas de hierarquia profunda do **psicólogo** (`Pacientes › {Nome}`,
`Avaliações › {Título} › {Paciente}`). **Nunca** no wizard do paciente
(`paciente/questionarios/[id]/responder`) — o fluxo é linear por decisão de produto, e
breadcrumb convida a sair dele no meio de um questionário clínico.

---

## 4. Skeleton vs. Spinner

- **Skeleton** (`LoadingState`, `components/ui/skeleton.tsx`): carregamento de conteúdo
  com layout relevante — listas, tabelas, dashboard.
- **Spinner** (`components/ui/spinner.tsx`, via `Button isLoading`): ação curta e
  bloqueante — submit de formulário, login.

---

## 5. Import de `Slot` — nunca do pacote `radix-ui` bundlado

`components/ui/badge.tsx` e `components/ui/breadcrumb.tsx` só precisam de `Slot`
(polimorfismo `asChild`), mas importar de `"radix-ui"` (o pacote que bundla ~25
primitivos — Menubar, ScrollArea, OTP input etc. — num só módulo) traz esse pacote
inteiro pro bundle, porque ele não faz tree-shaking limpo dos exports não usados.

**Achado real (redesign UI/UX, jul/2026):** isso inflou o bundle da landing em
+75kB (194kB → 269kB) só por `app-showcase.tsx` importar `Badge` pela primeira vez —
a landing não usa nenhum outro primitivo Radix, então herdou a "taxa" inteira do
pacote por causa de um único `Slot`. Corrigido trocando por `@radix-ui/react-slot`
(pacote individual, o mesmo que `components/ui/button.tsx` já usa) — o bundle voltou
a 194kB, e rotas autenticadas que usam `Badge` também encolheram (ex.
`avaliacoes/[id]` caiu de 232kB pra 156kB).

**Regra:** qualquer componente que só precisa de `Slot` (`asChild`) importa de
`@radix-ui/react-slot`, nunca de `"radix-ui"`. O pacote bundlado só vale a pena
quando o componente já usa uma primitiva interativa de verdade dele (Dialog, Select,
Tabs etc.) — nesses casos o custo já é pago pela primitiva em si.

## 6. Tooltip

Só para reforçar contexto de um ícone sem label visível (ex. ação de tabela só com
ícone). Nunca para informação essencial — se o conteúdo é necessário para operar a tela,
ele precisa estar visível, não escondido atrás de hover (isso quebra em touch/mobile).
