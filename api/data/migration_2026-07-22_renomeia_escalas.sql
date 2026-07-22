-- Migration manual: renomeia as 8 escalas de sigla de instrumento clínico
-- (CARS, UCLA, SPI, BSMAS, SMD Scale, FoMOs, SAS-SV, SISES) para nome
-- descritivo do eixo que de fato é medido.
--
-- Por quê: os itens de cada eixo (ver api/data/insert.sql e
-- migration_2026-07-16_novas_escalas.sql) são de autoria própria, inspirados
-- na literatura sobre uso problemático de redes sociais — não são a
-- tradução/aplicação fiel de nenhum desses instrumentos validados (item
-- count, formato de resposta e regra de pontuação divergem dos originais em
-- todos os 8 casos). Manter o nome da sigla emprestava credibilidade
-- científica que os dados coletados não sustentam — a landing chegava a
-- dizer "instrumentos validados... prontos para aplicação clínica", o que é
-- falso. Ver features/results/components/score-disclaimer.tsx pro aviso
-- equivalente adicionado nas telas de resultado.
--
-- Este projeto não usa Flyway/Liquibase (spring.jpa.hibernate.ddl-auto:
-- validate em todos os ambientes) — rodar manualmente, uma única vez, em
-- cada ambiente com dados reais (ex.: prod). Só UPDATE, sem mudança de
-- schema — pode rodar em qualquer momento em relação ao deploy do /api,
-- não tem o risco de crash loop de migrations que criam tabela/coluna nova.
--
-- Idempotente: casa pelo nome antigo, então rodar de novo (depois que já
-- rodou) não faz nada na segunda vez.

BEGIN;

UPDATE scales SET name = 'Uso compulsivo', updated_at = CURRENT_DATE WHERE name = 'CARS';
UPDATE scales SET name = 'Isolamento social', updated_at = CURRENT_DATE WHERE name = 'UCLA';
UPDATE scales SET name = 'Conflitos por uso', updated_at = CURRENT_DATE WHERE name = 'SPI';
UPDATE scales SET name = 'Sinais de dependência', updated_at = CURRENT_DATE WHERE name = 'BSMAS';
UPDATE scales SET name = 'Prejuízo funcional', updated_at = CURRENT_DATE WHERE name = 'SMD Scale';
UPDATE scales SET name = 'Medo de ficar por fora', updated_at = CURRENT_DATE WHERE name = 'FoMOs';
UPDATE scales SET name = 'Impacto físico', updated_at = CURRENT_DATE WHERE name = 'SAS-SV';
UPDATE scales SET name = 'Autoestima e comparação', updated_at = CURRENT_DATE WHERE name = 'SISES';

COMMIT;
