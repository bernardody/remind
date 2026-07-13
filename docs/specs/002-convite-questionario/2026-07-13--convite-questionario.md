# Especificação Funcional: Convite para Paciente Responder Questionário

- **Spec ID**: 002-convite-questionario
- **Data**: 2026-07-13
- **Status**: Consolidada a partir do PRD (`PRD.md`) — Fases A (backend base), B
  (frontend base) e C (e-mail) já **implementadas e validadas** em produção; Fase D
  (rate limiting e telemetria) **não iniciada**. Ver `PRD.md` §22 para o registro
  factual completo de implementação; esta spec descreve o comportamento requerido
  (o que o sistema SHALL fazer), não o histórico de construção.
- **Escopo**: Backend (`api/`) + Frontend (`remind-web/`)

---

## Contexto de Negócio

**Problema**: não existe hoje nenhuma noção de "este questionário é para este
paciente" — todo questionário ativo é visível a todo paciente do psicólogo
(`ListQuestionnaireService.list()`, sem filtro). Não há canal de notificação
(o paciente só sabe que precisa responder se for avisado por fora do sistema), e o
primeiro acesso do paciente depende de o psicólogo definir manualmente sua senha,
sem fluxo de ativação de conta ou recuperação de senha.

**Objetivo**: permitir que um psicólogo **convide um paciente específico para
responder um questionário específico**, por e-mail (com link copiável e
compartilhamento por WhatsApp como canais alternativos), sem exigir que o paciente
já tenha senha definida — e sem expor ao paciente questionários que não foram
destinados a ele através desse caminho.

**Usuários e metas**:
- **Psicólogo**: atribuir um questionário a um paciente específico, acompanhar o
  status do convite (enviado/aberto/respondido/expirado), reenviar ou revogar.
- **Paciente**: abrir um link recebido (e-mail ou WhatsApp) e responder o
  questionário associado sem precisar logar antes; opcionalmente, definir uma senha
  própria para acessos futuros.

**Encaixe no sistema**: novo Bounded Context **Convites**, dependente de
**Pacientes** e **Questionários** (`PRD.md` §17). Reaproveita a infraestrutura de
JWT já existente (`AccessTokenService`/`JwtEncoder`, chaves RSA), o padrão de
filtro de autorização com escopo restrito já usado para perfil incompleto
(`IncompleteProfileAuthorizationFilter`), o wizard de resposta existente
(`questionnaire-wizard.tsx`, `POST /questionarios/{id}/responder`) e o BFF proxy
genérico do frontend. **Decisão deliberada de escopo**: o login por senha
continua existindo; o convite é um caminho *adicional* de acesso, não uma
substituição — `/paciente/inicio` (lista global de questionários ativos) não é
alterada por esta funcionalidade.

---

## Clarifications

### Session 2026-07-12
- Q: Qual provedor de e-mail usar para o envio do convite? → A: Zoho Mail via SMTP
  (`smtppro.zoho.com:465`, domínio próprio `remindapp.com.br`), usando
  `spring-boot-starter-mail`/`JavaMailSender` — sem SDK de provedor terceiro.
- Q: O prazo de expiração de 7 dias para o link do convite é aceitável
  clinicamente (mais longo que os ~15 min recomendados pelo OWASP para magic
  links de *login*)? → A: Sim, confirmado pelo usuário depois de testar em
  produção e ver o texto real do e-mail. Justificativa registrada: convite é
  assíncrono (paciente, frequentemente adolescente, pode levar dias para checar o
  e-mail), diferente de um magic link de login clicado segundos após ser
  solicitado.
- Q: O token que trafega no link do convite deve ser um JWT autocontido ou um
  token opaco? → A: Token opaco (256 bits, aleatório), com apenas o hash SHA-256
  persistido. Motivo: precisa ser revogável instantaneamente (INV-007) e
  consumível atomicamente como uso único (INV-008); um JWT autocontido não pode
  ser invalidado sem uma lista de revogação, o que anularia a vantagem de ser
  stateless. Depois do consumo do token opaco, a sessão de fato passa a ser um
  JWT de escopo restrito e curta duração (30 min) — reaproveitando a
  infraestrutura JWT já existente.

### Session 2026-07-13
- Q: Vale integrar a API oficial do WhatsApp Business para o envio do convite?
  → A: Não. Exigiria conta verificada e template pré-aprovado pela Meta (não é
  possível mandar texto livre na primeira mensagem) e tem custo por conversa. Em
  vez disso, usar link `wa.me` (click-to-chat): o sistema apenas monta a URL com
  o telefone já cadastrado do paciente e uma mensagem pronta; quem efetivamente
  envia é o próprio psicólogo, clicando "Enviar" dentro do WhatsApp. Trade-off
  aceito: não é automático como o e-mail, mas exige zero integração/aprovação/custo.

---

## Requisitos Funcionais

Sintaxe EARS (SHALL/WILL/MAY). IDs mantidos como `INV-xxx` (mesma numeração já
usada no PRD e no código/testes, para preservar rastreabilidade).

| ID | Requisito |
|----|-----------|
| INV-001 | O sistema SHALL permitir que um psicólogo crie um convite associando um `Patient` seu a um `Questionnaire` ativo. |
| INV-002 | IF já existe um convite ativo (status não-terminal) para o mesmo par paciente/questionário THEN o sistema SHALL reutilizá-lo em vez de criar um segundo registro. |
| INV-003 | WHEN um convite é criado THEN o sistema SHALL gerar um token de uso único, armazenar apenas seu hash (SHA-256), e enviar automaticamente o link por e-mail ao endereço cadastrado do paciente, como canal de backup — independente de o psicólogo também usar o WhatsApp (INV-016). |
| INV-004 | IF o paciente já respondeu esse questionário (existe `QuestionnaireAnswer`) THEN o sistema SHALL rejeitar a criação do convite. |
| INV-005 | WHEN o token expira (`expires_at` no passado) THEN o sistema SHALL rejeitar seu uso e o convite SHALL transicionar para `EXPIRED` na próxima consulta/tentativa de uso. |
| INV-006 | O sistema SHALL permitir reenviar um convite não respondido, o que SHALL invalidar o token anterior e emitir um novo com novo prazo de expiração (rotação, não acúmulo). |
| INV-007 | O sistema SHALL permitir que o psicólogo revogue (`REVOKED`) um convite ainda não respondido a qualquer momento. |
| INV-008 | WHEN um token válido é trocado por acesso pela primeira vez THEN o sistema SHALL invalidá-lo para reuso como link, emitindo em seu lugar uma sessão de curta duração (JWT de escopo restrito, 30 min) restrita ao fluxo de resposta daquele questionário. |
| INV-009 | WHEN o paciente conclui a resposta ao questionário associado THEN o sistema SHALL marcar o convite como `ANSWERED` e vincular a `QuestionnaireAnswer` gerada — sem exigir que a resposta em si saiba da existência de convites (o vínculo é feito por busca de convite ativo do par, sem alterar o fluxo de resposta já existente). |
| INV-010 | IF um convite está `EXPIRED`, `REVOKED` ou `ANSWERED` THEN o sistema SHALL rejeitar qualquer tentativa de uso do token, com mensagem apropriada ao estado (expirado / revogado / já utilizado / já respondido são mensagens distintas). |
| INV-011 | O sistema SHALL impedir que um psicólogo crie, reenvie ou revogue convite de paciente que não é seu (checagem de posse, mesmo padrão de `InsertPatientService`), retornando um erro que não distinga "paciente inexistente" de "paciente de outro psicólogo". |
| INV-012 | O JWT de escopo restrito emitido a partir de um convite SHALL autorizar apenas: ler o `Questionnaire` do convite, responder esse `Questionnaire`, consultar se o paciente já respondeu (`GET /questionarios/{id}/resultado`), e definir a própria senha (INV-014) — SHALL NOT autorizar qualquer outro endpoint. |
| INV-013 | O sistema SHALL NOT expor, em qualquer resposta de API, o token em claro após sua criação/rotação inicial (nem em logs). |
| INV-014 | O sistema SHALL permitir que um paciente (autenticado normalmente ou via sessão de convite) defina ou altere sua própria senha. |
| INV-015 | O sistema SHALL permitir que o psicólogo liste os convites de um paciente seu, com status atual de cada um, sem reexpor o link/token depois do momento de criação/reenvio. |
| INV-016 | O sistema SHALL apresentar o link pré-preenchido de WhatsApp como a ação principal recomendada ao psicólogo logo após criar/reenviar um convite, com "copiar link" como ação secundária — dado que o público do produto (frequentemente adolescente) tende a checar WhatsApp com muito mais frequência que e-mail; o envio automático por e-mail (INV-003) continua acontecendo em paralelo, como reforço, não como substituto. |

**Dados envolvidos (o quê, não como)**:
- Do convite: paciente, questionário, psicólogo que convidou, hash do token,
  status, prazo de expiração, timestamps de envio/abertura/consumo, resposta
  vinculada quando concluído.
- Do paciente: e-mail e telefone já cadastrados (usados como destino do convite,
  não coletados de novo); senha, agora opcional no cadastro.

**Capacidades externas necessárias**:
- Envio de e-mail transacional (Zoho Mail via SMTP).
- Nenhuma API externa para WhatsApp — apenas construção de um link `wa.me`.

---

## Interações do Usuário

### Fluxo 1 — Psicólogo convida paciente para um questionário
1. Na tela do paciente, o psicólogo escolhe "Convidar para responder" e seleciona
   o questionário.
2. O sistema cria (ou reutiliza) o convite, gera o token, envia e-mail e
   apresenta ações para copiar o link e/ou abrir o WhatsApp com uma mensagem
   pronta.
3. A tela do paciente passa a mostrar o status do convite (enviado / aberto,
   aguardando resposta / respondido / expirado).

### Fluxo 2 — Paciente abre o link do convite
1. O paciente acessa `/convite/{token}` (e-mail ou WhatsApp).
2. O sistema valida e consome o token (uso único), emite uma sessão restrita e
   redireciona direto ao wizard daquele questionário — sem tela de login.
3. O paciente responde o questionário normalmente (wizard já existente, sem
   alterações).
4. Ao concluir, o convite é marcado como respondido e vinculado à resposta.

### Fluxo 3 — Paciente sem senha ainda
1. Em qualquer momento (antes ou depois de responder), o paciente pode acessar a
   tela de definir senha própria, para poder logar normalmente no futuro.
2. Isso não bloqueia nem é pré-requisito para responder ao questionário do
   convite.

### Fluxo 4 — Psicólogo reenvia ou revoga um convite
1. Na lista de convites do paciente, o psicólogo escolhe "Reenviar" (gera novo
   token, invalida o anterior, novo e-mail) ou "Revogar" (bloqueia o uso futuro
   do link, sem apagar o histórico).

### Caminhos alternativos e erros
- **Link expirado**: tela de erro bloqueante clara ("Este link expirou. Peça um
  novo convite ao seu psicólogo."), sem opção de auto-reenvio. (INV-005, INV-010)
- **Link revogado**: tela de erro bloqueante ("Este convite não está mais
  disponível."). (INV-007, INV-010)
- **Já respondido**: mesmo `EmptyState` de "já respondido" usado no fluxo
  autenticado normal. (INV-004, INV-009, INV-010)
- **Link já utilizado antes (sem ter expirado)**: mensagem distinta de expirado
  ("Este link já foi utilizado."). (INV-008, INV-010)
- **Psicólogo tenta convidar/reenviar/revogar paciente de outro psicólogo**:
  erro genérico, sem distinguir "não existe" de "não é seu". (INV-011)
- **Paciente tenta acessar qualquer rota fora do escopo do convite** (ex.:
  perfil, lista de questionários) durante a sessão restrita: acesso negado; a
  navegação para essas rotas não deve nem ser oferecida na interface durante
  essa sessão. (INV-012)

---

## Critérios de Aceite

Taxonomia: `[IMP]` Implementável · `[SEF]` Efeito colateral · `[EXT]` Verificação
externa.

- **[IMP]** Dado um paciente seu sem convite ativo para um questionário, quando o
  psicólogo cria um convite, então um registro é criado, um e-mail é enviado ao
  paciente, e o link leva direto ao wizard daquele questionário. (INV-001, INV-003)
- **[IMP]** Dado um paciente com convite ativo (não-terminal) para o mesmo
  questionário, quando o psicólogo tenta criar outro convite para o mesmo par,
  então o convite existente é reutilizado, não duplicado. (INV-002)
- **[IMP]** Dado um paciente que já respondeu um questionário, quando o
  psicólogo tenta convidá-lo para o mesmo questionário, então a criação é
  rejeitada. (INV-004)
- **[IMP]** Dado um token de convite expirado, quando alguém tenta consumi-lo,
  então o acesso é negado com mensagem de expiração e o convite passa a
  `EXPIRED`. (INV-005)
- **[IMP]** Dado um convite não respondido, quando o psicólogo reenvia, então um
  novo token é emitido, o anterior deixa de funcionar, e o prazo de expiração é
  resetado. (INV-006)
- **[IMP]** Dado um convite não respondido, quando o psicólogo revoga, então
  nenhuma tentativa de uso do token consegue mais ter sucesso. (INV-007)
- **[IMP]** Dado um token válido, quando é consumido pela primeira vez, então
  não pode ser consumido de novo, e uma sessão restrita ao questionário do
  convite é emitida no lugar. (INV-008)
- **[SEF]** Dado duas requisições simultâneas consumindo o mesmo token, quando
  processadas, então apenas uma tem sucesso — a segunda é rejeitada mesmo sem
  o token ter expirado. (INV-008)
- **[IMP]** Dado um paciente que conclui a resposta através de uma sessão de
  convite, quando a resposta é salva, então o convite correspondente passa a
  `ANSWERED` e fica vinculado à resposta gerada. (INV-009)
- **[IMP]** Dado um convite `EXPIRED`, `REVOKED` ou `ANSWERED`, quando seu token
  é usado, então o acesso é sempre negado, com mensagem específica para cada
  estado. (INV-010)
- **[IMP]** Dado um paciente que não pertence ao psicólogo autenticado, quando
  este tenta criar, reenviar ou revogar um convite para ele, então a operação é
  rejeitada sem revelar se o paciente existe. (INV-011)
- **[IMP]** Dado um JWT de escopo restrito emitido por um convite, quando usado
  em qualquer rota fora de ler/responder o questionário do convite, consultar
  se já respondeu, ou definir senha, então o acesso é negado (403). (INV-012)
- **[SEF]** Dado um convite criado ou reenviado, quando qualquer resposta de API
  ou log do sistema é inspecionado depois desse momento, então o token em claro
  não aparece em nenhum lugar. (INV-013)
- **[IMP]** Dado um paciente autenticado (por login normal ou por sessão de
  convite), quando ele envia uma nova senha válida, então sua senha é definida/
  atualizada. (INV-014)
- **[IMP]** Dado um paciente com convites criados, quando o psicólogo consulta a
  lista de convites desse paciente, então vê o status atual de cada um, sem o
  link/token sendo reexposto. (INV-015)
- **[IMP]** Dado um convite recém-criado ou reenviado, quando a tela de convite
  é exibida, então o psicólogo tem a opção de copiar o link e/ou abrir um link
  de WhatsApp pré-preenchido com o link e uma mensagem, além do envio automático
  por e-mail. (INV-016)
- **[EXT]** A entrega efetiva do e-mail depende do provedor SMTP (Zoho) e da
  configuração de DNS do domínio (SPF/DKIM/MX) — fora do controle direto do
  código da aplicação.

**Regra dos 60%**: 15 de 17 critérios são `[IMP]` (~88%).

---

## Requisitos de Integração

- **Envio de e-mail (Zoho Mail via SMTP)**: `spring-boot-starter-mail` +
  `JavaMailSender`, sem SDK de provedor terceiro. Depende de configuração de DNS
  (SPF, DKIM, MX) do domínio próprio para entrega efetiva — capacidade externa,
  não implementação.
- **Emissão de sessão pós-convite**: reaproveita a mesma infraestrutura de JWT
  (`AccessTokenService`/`JwtEncoder`, chaves RSA) já usada pelo login normal, com
  um escopo adicional (`scope=invite`) e o mesmo padrão de filtro de autorização
  restrita já usado para perfil incompleto.
- **Autenticação do frontend**: a sessão de convite é estabelecida através do
  mesmo mecanismo de sessão (NextAuth) já usado pelo login normal, para
  reaproveitar 100% do wizard/middleware existentes sem duplicar essa lógica.
- **Compartilhamento por WhatsApp**: apenas construção de um link `wa.me` com o
  telefone já cadastrado do paciente — nenhuma integração com a API do
  WhatsApp Business.

**Troca de dados**: o backend recebe do frontend um token de convite (rota
pública) e devolve uma sessão restrita; o frontend, por sua vez, nunca precisa
enviar de volta o token depois do primeiro consumo.

---

## Não-Objetivos

Esta funcionalidade NÃO inclui (decisões deliberadas de escopo, ver `PRD.md` §4 e
§20):

- **Migração de `/paciente/inicio`** para mostrar apenas questionários
  atribuídos — a lista global de questionários ativos continua existindo como
  está; o convite é um caminho adicional, não uma restrição do existente.
- **Convite em lote** (vários pacientes de uma vez para o mesmo questionário) —
  cada convite é sempre 1 paciente + 1 questionário.
- **Obrigatoriedade de senha própria** — um paciente pode, em tese, viver
  indefinidamente só de convites, sem nunca aparecer na tela de login normal.
- **Integração com a API do WhatsApp Business** — apenas link `wa.me`
  (click-to-chat), sem envio automático, template aprovado ou custo por
  conversa.
- **Rate limiting de criação/reenvio de convites** — reconhecido como
  superfície de abuso nova (spam de e-mail), mas adiado para uma fase futura
  (Fase D), não bloqueante para esta especificação.
- **Telemetria/contadores de status de convite** para o psicólogo — também
  adiado para a Fase D.
- **CRUD de `Questionnaire`** para o psicólogo — fora de escopo; segue populado
  apenas via seed.

---

## Requisitos Negativos

O sistema SHALL NOT:

### Segurança
- **REQ-NR001**: O sistema SHALL NOT usar um JWT autocontido como o token que
  trafega no link do convite — deve ser um token opaco, hasheado, para permitir
  revogação instantânea e consumo atômico de uso único.
- **REQ-NR002**: O sistema SHALL NOT persistir ou logar o token de convite em
  claro em nenhum momento após sua geração.
- **REQ-NR003**: O sistema SHALL NOT permitir que o mesmo token de convite seja
  consumido mais de uma vez, mesmo sob requisições concorrentes.
- **REQ-NR004**: O sistema SHALL NOT autorizar, através do JWT de escopo
  restrito de um convite, nenhuma rota além das explicitamente listadas em
  INV-012.
- **REQ-NR005**: O sistema SHALL NOT diferenciar, em mensagens de erro voltadas
  ao psicólogo, "paciente inexistente" de "paciente de outro psicólogo" (evita
  enumeração).
- **REQ-NR006**: O sistema SHALL NOT incluir dado sensível do paciente (CPF,
  identificador interno) na URL do link de convite, além do próprio token.
- **REQ-NR007**: O sistema SHALL NOT relaxar o bloqueio de resposta duplicada
  (409 já existente em `AnswerQuestionnaireService`) para o caminho do convite —
  a regra de "uma resposta por par paciente/questionário" vale igualmente
  para o fluxo de convite.

---

## Questões em Aberto

Pendências levantadas no PRD (`PRD.md` §20) ainda sem decisão fechada:

1. **Convite em lote** — se algum dia necessário, é extensão direta do modelo
   atual (1 convite = 1 par), mas muda a UI para seleção múltipla.
2. **Obrigatoriedade de senha própria** — hoje nunca é exigida; decisão de
   produto pendente sobre se isso deve mudar para pacientes de uso recorrente.
3. **Migração de `/paciente/inicio` para "só atribuídos"** — deixaria de existir
   a inconsistência de um paciente logado normalmente ainda ver/responder
   questionários não convidados; recomendado tratar como fase explícita futura,
   não implícita nesta especificação.
4. **Rate limiting** — bloqueante para produção com uso real em escala, ou
   aceitável adiar para a Fase D? Superfície de abuso nova (spam de e-mail via
   convites) que não existia antes desta funcionalidade.
5. **Mensagem do WhatsApp em terceira pessoa** — achado de teste em produção
   (2026-07-13): o texto atual soa estranho vindo do próprio psicólogo (ele
   mesmo clica "Enviar" na própria conversa). Provável correção: texto em
   primeira pessoa para o canal WhatsApp, mantendo terceira pessoa no e-mail
   (que vem de um remetente institucional). Ver `PRD.md` §20.7.
6. **Preview de link do WhatsApp expõe metadados institucionais/clínicos** —
   achado de teste em produção (2026-07-13): `/convite/[token]` herda o
   Open Graph do layout raiz (nome e descrição clínica do produto), visível no
   card de preview antes mesmo do clique — potencialmente indiscreto para um
   adolescente. Correção provável: Open Graph próprio e neutro para essa rota.
   Ver `PRD.md` §20.8.
7. **Colisão de sessão ao testar o link de convite logado como psicólogo no
   mesmo navegador** — comportamento observado (`PRD.md` §20.9), atribuído a
   cookie de sessão único por navegador (não por aba), não a um bug do
   endpoint de revogar. Ainda não confirmado com certeza (`GET
   /api/auth/session` não foi checado no momento exato do incidente). Avaliar
   se é só cuidado de teste (usar aba anônima) ou um risco real de produto.
