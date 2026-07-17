-- Migration manual: adiciona as escalas BSMAS, SMD Scale, FoMOs, SAS-SV e
-- SISES ao "Questionário 1" existente, e recalcula a média global histórica
-- com a fórmula nova (média das médias por escala — ver
-- QuestionnaireResultCalculator.java).
--
-- Este projeto não usa Flyway/Liquibase (spring.jpa.hibernate.ddl-auto:
-- validate em todos os ambientes) — rodar este script manualmente, uma
-- única vez, em cada ambiente que já tem dados reais (ex.: prod).
--
-- NÃO usar em bancos recém-criados a partir de schema.sql + insert.sql —
-- lá as escalas/perguntas novas já entram direto no seed, rodar os dois
-- scripts causaria duplicação (a menos que os NOT EXISTS abaixo bloqueiem).
--
-- Idempotência: todo INSERT usa NOT EXISTS, então rodar de novo não
-- duplica nada. O UPDATE de backfill (passo 6) sempre recalcula a partir
-- de questionnaire_scale_results, então também é seguro rodar mais de uma
-- vez.

BEGIN;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM questionnaires WHERE title = 'Questionário 1') THEN
        RAISE EXCEPTION 'Questionário "Questionário 1" não encontrado — ajuste o filtro do passo 3 antes de rodar esta migration.';
    END IF;
END $$;

-- 1. Escalas novas
INSERT INTO scales (name, created_at, updated_at, active)
SELECT v.name, CURRENT_DATE, CURRENT_DATE, true
FROM (VALUES ('BSMAS'), ('SMD Scale'), ('FoMOs'), ('SAS-SV'), ('SISES')) AS v(name)
WHERE NOT EXISTS (SELECT 1 FROM scales s WHERE s.name = v.name);

-- 2. Corrige order_number das 11 perguntas originais (hoje todas = 1 — ver
--    relatório de auditoria, jul/2026: a ordem exibida no wizard dependia
--    só da ordem implícita de retorno da query, sem garantia formal).
UPDATE questions SET order_number = 1, updated_at = CURRENT_DATE WHERE text = 'Você sente a necessidade de verificar as redes sociais logo ao acordar ou antes de dormir?';
UPDATE questions SET order_number = 2, updated_at = CURRENT_DATE WHERE text = 'Quando está em situações sociais, você sente que precisa usar as redes sociais para se distrair ou se sentir mais confortável?';
UPDATE questions SET order_number = 3, updated_at = CURRENT_DATE WHERE text = 'Com que frequência você sente que seu humor piora quando não consegue acessar suas redes sociais?';
UPDATE questions SET order_number = 4, updated_at = CURRENT_DATE WHERE text = 'Você sente que dedica mais tempo às redes sociais do que planejava originalmente?';
UPDATE questions SET order_number = 5, updated_at = CURRENT_DATE WHERE text = 'Você sente que o uso de redes sociais substitui a interação face a face com outras pessoas?';
UPDATE questions SET order_number = 6, updated_at = CURRENT_DATE WHERE text = 'Com que frequência você sente que seus amigos online realmente compreendem você?';
UPDATE questions SET order_number = 7, updated_at = CURRENT_DATE WHERE text = 'Você se sente isolado(a), mesmo ao interagir nas redes sociais?';
UPDATE questions SET order_number = 8, updated_at = CURRENT_DATE WHERE text = 'Com que frequência você recorre às redes sociais quando está se sentindo sozinho(a)?';
UPDATE questions SET order_number = 9, updated_at = CURRENT_DATE WHERE text = 'O uso das redes sociais já causou conflitos com pessoas próximas a você.';
UPDATE questions SET order_number = 10, updated_at = CURRENT_DATE WHERE text = 'Eu me irrito facilmente se alguém interfere no meu uso das redes sociais.';
UPDATE questions SET order_number = 11, updated_at = CURRENT_DATE WHERE text = 'Já percebi que as redes sociais afetam a qualidade dos meus relacionamentos pessoais.';

-- 3. Perguntas novas (12-26), vinculadas ao Questionário 1 e à escala correta
WITH alvo AS (
    SELECT id FROM questionnaires WHERE title = 'Questionário 1'
),
novas_perguntas (scale_name, text, order_number) AS (
    VALUES
    ('BSMAS', 'Com que frequência você pensa nas redes sociais mesmo quando não está usando-as?', 12),
    ('BSMAS', 'Com que frequência você sente que precisa passar cada vez mais tempo nas redes sociais para se sentir satisfeito(a)?', 13),
    ('BSMAS', 'Com que frequência você tenta reduzir o uso das redes sociais e não consegue?', 14),
    ('BSMAS', 'Com que frequência você fica inquieto(a) ou incomodado(a) quando é impedido(a) de usar as redes sociais?', 15),
    ('SMD Scale', 'Eu já deixei de fazer atividades importantes (estudar, trabalhar, praticar exercícios) por causa das redes sociais.', 16),
    ('SMD Scale', 'Eu já menti para familiares ou amigos sobre quanto tempo passo nas redes sociais.', 17),
    ('SMD Scale', 'Mesmo depois de discutir ou ter problemas por causa das redes sociais, eu continuo usando-as da mesma forma.', 18),
    ('FoMOs', 'Com que frequência você se preocupa achando que seus amigos estão se divertindo mais do que você?', 19),
    ('FoMOs', 'Com que frequência você sente ansiedade por não saber o que seus contatos estão publicando ou fazendo?', 20),
    ('FoMOs', 'Com que frequência você checa as redes sociais com medo de ter perdido alguma novidade?', 21),
    ('SAS-SV', 'Com que frequência você sente dor ou desconforto físico (olhos, pescoço ou punhos) por usar o celular nas redes sociais por muito tempo?', 22),
    ('SAS-SV', 'Com que frequência seu desempenho em tarefas do dia a dia (estudo, trabalho, tarefas domésticas) é prejudicado pelo tempo que você passa nas redes sociais?', 23),
    ('SISES', 'Eu tenho autoestima elevada.', 24),
    ('SISES', 'Eu me sinto inferior quando me comparo com as publicações de outras pessoas nas redes sociais.', 25),
    ('SISES', 'Curtidas, comentários e seguidores nas redes sociais influenciam diretamente como eu me sinto em relação a mim mesmo(a).', 26)
)
INSERT INTO questions (id_questionnaire, id_scale, text, order_number, created_at, updated_at, active)
SELECT alvo.id, sc.id, np.text, np.order_number, CURRENT_DATE, CURRENT_DATE, true
FROM novas_perguntas np
JOIN scales sc ON sc.name = np.scale_name
CROSS JOIN alvo
WHERE NOT EXISTS (SELECT 1 FROM questions q WHERE q.text = np.text);

-- 4. Opções das perguntas novas (Likert 1-5), reaproveitando os dois
--    conjuntos de rótulo já usados (Frequência / Concordância). O item 24
--    ("Eu tenho autoestima elevada") é redigido na direção oposta aos itens
--    25-26 (concordar é protetor, não risco) — os VALORES das opções são
--    invertidos de propósito (Concordo totalmente=1 .. Discordo
--    totalmente=5) para que "valor alto" continue significando "mais risco"
--    em toda a escala SISES. Não mexer sem entender isso.
WITH frequencia (label, val) AS (
    VALUES ('Nunca', 1), ('Raramente', 2), ('Às vezes', 3), ('Frequentemente', 4), ('Sempre', 5)
),
concordancia (label, val) AS (
    VALUES ('Discordo totalmente', 1), ('Discordo', 2), ('Neutro', 3), ('Concordo', 4), ('Concordo totalmente', 5)
),
concordancia_invertida (label, val) AS (
    VALUES ('Discordo totalmente', 5), ('Discordo', 4), ('Neutro', 3), ('Concordo', 2), ('Concordo totalmente', 1)
),
perguntas_frequencia AS (
    SELECT id FROM questions WHERE text IN (
        'Com que frequência você pensa nas redes sociais mesmo quando não está usando-as?',
        'Com que frequência você sente que precisa passar cada vez mais tempo nas redes sociais para se sentir satisfeito(a)?',
        'Com que frequência você tenta reduzir o uso das redes sociais e não consegue?',
        'Com que frequência você fica inquieto(a) ou incomodado(a) quando é impedido(a) de usar as redes sociais?',
        'Com que frequência você se preocupa achando que seus amigos estão se divertindo mais do que você?',
        'Com que frequência você sente ansiedade por não saber o que seus contatos estão publicando ou fazendo?',
        'Com que frequência você checa as redes sociais com medo de ter perdido alguma novidade?',
        'Com que frequência você sente dor ou desconforto físico (olhos, pescoço ou punhos) por usar o celular nas redes sociais por muito tempo?',
        'Com que frequência seu desempenho em tarefas do dia a dia (estudo, trabalho, tarefas domésticas) é prejudicado pelo tempo que você passa nas redes sociais?'
    )
),
perguntas_concordancia AS (
    SELECT id FROM questions WHERE text IN (
        'Eu já deixei de fazer atividades importantes (estudar, trabalhar, praticar exercícios) por causa das redes sociais.',
        'Eu já menti para familiares ou amigos sobre quanto tempo passo nas redes sociais.',
        'Mesmo depois de discutir ou ter problemas por causa das redes sociais, eu continuo usando-as da mesma forma.',
        'Eu me sinto inferior quando me comparo com as publicações de outras pessoas nas redes sociais.',
        'Curtidas, comentários e seguidores nas redes sociais influenciam diretamente como eu me sinto em relação a mim mesmo(a).'
    )
),
pergunta_invertida AS (
    SELECT id FROM questions WHERE text = 'Eu tenho autoestima elevada.'
)
INSERT INTO question_options (id_question, name, value, created_at, updated_at, active)
SELECT q.id, f.label, f.val, CURRENT_DATE, CURRENT_DATE, true
FROM perguntas_frequencia q CROSS JOIN frequencia f
WHERE NOT EXISTS (SELECT 1 FROM question_options o WHERE o.id_question = q.id)
UNION ALL
SELECT q.id, c.label, c.val, CURRENT_DATE, CURRENT_DATE, true
FROM perguntas_concordancia q CROSS JOIN concordancia c
WHERE NOT EXISTS (SELECT 1 FROM question_options o WHERE o.id_question = q.id)
UNION ALL
SELECT q.id, ci.label, ci.val, CURRENT_DATE, CURRENT_DATE, true
FROM pergunta_invertida q CROSS JOIN concordancia_invertida ci
WHERE NOT EXISTS (SELECT 1 FROM question_options o WHERE o.id_question = q.id);

-- 5. Faixas de risco (placeholder, tercis 0-2/2-3.5/3.5-5 — trocar pelos
--    cortes clínicos reais quando definidos) para as 5 escalas novas.
INSERT INTO scale_risk_bands (id_scale, label, min_value, max_value, created_at, updated_at, active)
SELECT s.id, b.label, b.min_value, b.max_value, CURRENT_DATE, CURRENT_DATE, true
FROM scales s
CROSS JOIN (VALUES
    ('Baixo', 0::numeric, 2::numeric),
    ('Moderado', 2::numeric, 3.5::numeric),
    ('Alto', 3.5::numeric, 5::numeric)
) AS b(label, min_value, max_value)
WHERE s.name IN ('BSMAS', 'SMD Scale', 'FoMOs', 'SAS-SV', 'SISES')
AND NOT EXISTS (
    SELECT 1 FROM scale_risk_bands srb WHERE srb.id_scale = s.id AND srb.label = b.label
);

-- 6. Backfill: recalcula a média global histórica (questionnaire_results.average)
--    com a fórmula nova — média das médias por escala, não média das
--    respostas brutas (ver QuestionnaireResultCalculator.calculate). Só é
--    possível reaproveitar o que já está calculado por escala
--    (questionnaire_scale_results), sem reprocessar as respostas brutas.
UPDATE questionnaire_results qr
SET average = sub.new_average,
    updated_at = CURRENT_DATE
FROM (
    SELECT id_questionnaire_result,
           ROUND(AVG(average), 2) AS new_average
    FROM questionnaire_scale_results
    WHERE active = true
    GROUP BY id_questionnaire_result
) sub
WHERE qr.id = sub.id_questionnaire_result
AND qr.average IS DISTINCT FROM sub.new_average;

COMMIT;
