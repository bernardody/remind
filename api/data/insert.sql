INSERT INTO addresses (id, street, number, cep, neighborhood, city, created_at, updated_at, active) VALUES
(101, 'Rua das Flores', 123, '95780000', 'Centro', 'Montenegro', '2025-12-15', '2025-12-15', true),
(102, 'Avenida Júlio de Castilhos', 456, '90030130', 'Centro Histórico', 'Porto Alegre', '2025-08-12', '2025-08-12', true),
(103, 'Rua Bento Gonçalves', 789, '95020412', 'São Pelegrino', 'Caxias do Sul', '2025-10-05', '2025-10-05', true);


INSERT INTO users (name, email, cpf, phone, password, type, profile_complete, created_at, updated_at, active) VALUES
('Rafael Monteiro Duarte', 'rafael.duarte87@gmail.com', '51756699070', '9224732623', '$2a$10$n39fOvjLehiGh/OUXoV01OPWy1Ilf4XTNAjm/Fo9sh2h8smlA50ze', 'PATIENT', true, '2025-11-03', '2025-11-03', true),
('Camila Ferreira Nogueira', 'camila.nogueira.cf@gmail.com', '38492017566', '9812345678', '$2a$10$n39fOvjLehiGh/OUXoV01OPWy1Ilf4XTNAjm/Fo9sh2h8smlA50ze', 'PSYCHOLOGIST', true, '2025-12-15', '2025-12-15', true),
('Lucas Martins Azevedo', 'lucas.azevedo.martins@gmail.com', '72910485632', '9897654321', '$2a$10$n39fOvjLehiGh/OUXoV01OPWy1Ilf4XTNAjm/Fo9sh2h8smlA50ze', 'PATIENT', true, '2025-10-28', '2025-10-28', true),
('Beatriz Carvalho Lopes', 'beatriz.lopes.carvalho@gmail.com', '15893746205', '9771122334', '$2a$10$n39fOvjLehiGh/OUXoV01OPWy1Ilf4XTNAjm/Fo9sh2h8smlA50ze', 'PATIENT', true, '2025-09-19', '2025-09-19', true),
('Felipe Gonçalves Ribeiro', 'felipe.ribeiro.gr@gmail.com', '60482917355', '9883344556', '$2a$10$n39fOvjLehiGh/OUXoV01OPWy1Ilf4XTNAjm/Fo9sh2h8smlA50ze', 'PATIENT', true, '2025-11-27', '2025-11-27', true),
('Mariana Teixeira Freitas', 'mariana.freitas.teixeira@gmail.com', '93720518466', '9995566778', '$2a$10$n39fOvjLehiGh/OUXoV01OPWy1Ilf4XTNAjm/Fo9sh2h8smlA50ze', 'PSYCHOLOGIST', true, '2025-08-12', '2025-08-12', true),
('Eduardo Almeida Barros', 'eduardo.barros.almeida@gmail.com', '48261903715', '9667788990', '$2a$10$n39fOvjLehiGh/OUXoV01OPWy1Ilf4XTNAjm/Fo9sh2h8smlA50ze', 'PATIENT', true, '2025-12-02', '2025-12-02', true),
('Juliana Correia Batista', 'juliana.batista.correia@gmail.com', '31590728461', '9558899001', '$2a$10$n39fOvjLehiGh/OUXoV01OPWy1Ilf4XTNAjm/Fo9sh2h8smlA50ze', 'PSYCHOLOGIST', true, '2025-10-05', '2025-10-05', true),
('Thiago Moreira Farias', 'thiago.farias.moreira@gmail.com', '86420197533', '9440011223', '$2a$10$n39fOvjLehiGh/OUXoV01OPWy1Ilf4XTNAjm/Fo9sh2h8smlA50ze', 'PATIENT', true, '2025-07-21', '2025-07-21', true);


INSERT INTO psychologists (id_user, id_address, created_at, updated_at, active) VALUES
(2, 101, '2025-12-15', '2025-12-15', true),
(6, 102, '2025-08-12', '2025-08-12', true),
(8, 103, '2025-10-05', '2025-10-05', true);


INSERT INTO patients (id_user, id_psychologist, birth_date, gender, created_at, updated_at, active) VALUES
(1, 1, '1998-04-12', 'M', '2025-11-03', '2025-11-03', true),
(3, 1, '2001-09-27', 'M', '2025-10-28', '2025-10-28', true),
(4, 2, '1995-02-18', 'F', '2025-09-19', '2025-09-19', true),
(5, 2, '1999-12-03', 'M', '2025-11-27', '2025-11-27', true),
(7, 3, '1997-06-21', 'M', '2025-12-02', '2025-12-02', true),
(9, 3, '2000-01-15', 'M', '2025-07-21', '2025-07-21', true);


INSERT INTO questionnaires (title, created_at, updated_at, active) VALUES
('Questionário 1', '2026-02-17', '2026-02-17', true);


INSERT INTO scales (name, created_at, updated_at, active) VALUES
('CARS', '2026-02-17', '2026-02-17', true),
('UCLA', '2026-02-17', '2026-02-17', true),
('SPI', '2026-02-17', '2026-02-17', true),
('BSMAS', '2026-07-16', '2026-07-16', true),
('SMD Scale', '2026-07-16', '2026-07-16', true),
('FoMOs', '2026-07-16', '2026-07-16', true),
('SAS-SV', '2026-07-16', '2026-07-16', true),
('SISES', '2026-07-16', '2026-07-16', true);


-- Faixas de risco por escala — cortes placeholder (tercis 0-2/2-3.5/3.5-5,
-- espelhando o RISK_BANDS que hoje só existe hardcoded no frontend), até
-- termos os pontos de corte clínicos reais de cada escala (CARS/UCLA/SPI/
-- BSMAS/SMD Scale/FoMOs/SAS-SV/SISES).
INSERT INTO scale_risk_bands (id_scale, label, min_value, max_value, created_at, updated_at, active) VALUES
(1, 'Baixo', 0, 2, '2026-02-17', '2026-02-17', true),
(1, 'Moderado', 2, 3.5, '2026-02-17', '2026-02-17', true),
(1, 'Alto', 3.5, 5, '2026-02-17', '2026-02-17', true),
(2, 'Baixo', 0, 2, '2026-02-17', '2026-02-17', true),
(2, 'Moderado', 2, 3.5, '2026-02-17', '2026-02-17', true),
(2, 'Alto', 3.5, 5, '2026-02-17', '2026-02-17', true),
(3, 'Baixo', 0, 2, '2026-02-17', '2026-02-17', true),
(3, 'Moderado', 2, 3.5, '2026-02-17', '2026-02-17', true),
(3, 'Alto', 3.5, 5, '2026-02-17', '2026-02-17', true),
(4, 'Baixo', 0, 2, '2026-07-16', '2026-07-16', true),
(4, 'Moderado', 2, 3.5, '2026-07-16', '2026-07-16', true),
(4, 'Alto', 3.5, 5, '2026-07-16', '2026-07-16', true),
(5, 'Baixo', 0, 2, '2026-07-16', '2026-07-16', true),
(5, 'Moderado', 2, 3.5, '2026-07-16', '2026-07-16', true),
(5, 'Alto', 3.5, 5, '2026-07-16', '2026-07-16', true),
(6, 'Baixo', 0, 2, '2026-07-16', '2026-07-16', true),
(6, 'Moderado', 2, 3.5, '2026-07-16', '2026-07-16', true),
(6, 'Alto', 3.5, 5, '2026-07-16', '2026-07-16', true),
(7, 'Baixo', 0, 2, '2026-07-16', '2026-07-16', true),
(7, 'Moderado', 2, 3.5, '2026-07-16', '2026-07-16', true),
(7, 'Alto', 3.5, 5, '2026-07-16', '2026-07-16', true),
(8, 'Baixo', 0, 2, '2026-07-16', '2026-07-16', true),
(8, 'Moderado', 2, 3.5, '2026-07-16', '2026-07-16', true),
(8, 'Alto', 3.5, 5, '2026-07-16', '2026-07-16', true);


-- order_number agora reflete a posição real (1..26) — antes todas as perguntas
-- tinham order_number=1, e a ordem exibida no wizard dependia só da ordem
-- implícita de retorno da query (ver relatório de auditoria, jul/2026).
INSERT INTO questions (id_questionnaire, id_scale, text, order_number, created_at, updated_at, active) VALUES
(1, 1, 'Você sente a necessidade de verificar as redes sociais logo ao acordar ou antes de dormir?', 1, '2026-02-17', '2026-02-17', true),
(1, 1, 'Quando está em situações sociais, você sente que precisa usar as redes sociais para se distrair ou se sentir mais confortável?', 2, '2026-02-17', '2026-02-17', true),
(1, 1, 'Com que frequência você sente que seu humor piora quando não consegue acessar suas redes sociais?', 3, '2026-02-17', '2026-02-17', true),
(1, 1, 'Você sente que dedica mais tempo às redes sociais do que planejava originalmente?', 4, '2026-02-17', '2026-02-17', true),
(1, 2, 'Você sente que o uso de redes sociais substitui a interação face a face com outras pessoas?', 5, '2026-02-17', '2026-02-17', true),
(1, 2, 'Com que frequência você sente que seus amigos online realmente compreendem você?', 6, '2026-02-17', '2026-02-17', true),
(1, 2, 'Você se sente isolado(a), mesmo ao interagir nas redes sociais?', 7, '2026-02-17', '2026-02-17', true),
(1, 2, 'Com que frequência você recorre às redes sociais quando está se sentindo sozinho(a)?', 8, '2026-02-17', '2026-02-17', true),
(1, 3, 'O uso das redes sociais já causou conflitos com pessoas próximas a você.', 9, '2026-02-17', '2026-02-17', true),
(1, 3, 'Eu me irrito facilmente se alguém interfere no meu uso das redes sociais.', 10, '2026-02-17', '2026-02-17', true),
(1, 3, 'Já percebi que as redes sociais afetam a qualidade dos meus relacionamentos pessoais.', 11, '2026-02-17', '2026-02-17', true),
(1, 4, 'Com que frequência você pensa nas redes sociais mesmo quando não está usando-as?', 12, '2026-07-16', '2026-07-16', true),
(1, 4, 'Com que frequência você sente que precisa passar cada vez mais tempo nas redes sociais para se sentir satisfeito(a)?', 13, '2026-07-16', '2026-07-16', true),
(1, 4, 'Com que frequência você tenta reduzir o uso das redes sociais e não consegue?', 14, '2026-07-16', '2026-07-16', true),
(1, 4, 'Com que frequência você fica inquieto(a) ou incomodado(a) quando é impedido(a) de usar as redes sociais?', 15, '2026-07-16', '2026-07-16', true),
(1, 5, 'Eu já deixei de fazer atividades importantes (estudar, trabalhar, praticar exercícios) por causa das redes sociais.', 16, '2026-07-16', '2026-07-16', true),
(1, 5, 'Eu já menti para familiares ou amigos sobre quanto tempo passo nas redes sociais.', 17, '2026-07-16', '2026-07-16', true),
(1, 5, 'Mesmo depois de discutir ou ter problemas por causa das redes sociais, eu continuo usando-as da mesma forma.', 18, '2026-07-16', '2026-07-16', true),
(1, 6, 'Com que frequência você se preocupa achando que seus amigos estão se divertindo mais do que você?', 19, '2026-07-16', '2026-07-16', true),
(1, 6, 'Com que frequência você sente ansiedade por não saber o que seus contatos estão publicando ou fazendo?', 20, '2026-07-16', '2026-07-16', true),
(1, 6, 'Com que frequência você checa as redes sociais com medo de ter perdido alguma novidade?', 21, '2026-07-16', '2026-07-16', true),
(1, 7, 'Com que frequência você sente dor ou desconforto físico (olhos, pescoço ou punhos) por usar o celular nas redes sociais por muito tempo?', 22, '2026-07-16', '2026-07-16', true),
(1, 7, 'Com que frequência seu desempenho em tarefas do dia a dia (estudo, trabalho, tarefas domésticas) é prejudicado pelo tempo que você passa nas redes sociais?', 23, '2026-07-16', '2026-07-16', true),
(1, 8, 'Eu tenho autoestima elevada.', 24, '2026-07-16', '2026-07-16', true),
(1, 8, 'Eu me sinto inferior quando me comparo com as publicações de outras pessoas nas redes sociais.', 25, '2026-07-16', '2026-07-16', true),
(1, 8, 'Curtidas, comentários e seguidores nas redes sociais influenciam diretamente como eu me sinto em relação a mim mesmo(a).', 26, '2026-07-16', '2026-07-16', true);


INSERT INTO question_options (id_question, name, value, created_at, updated_at, active) VALUES
(1, 'Nunca', 1, '2026-02-17', '2026-02-17', true),
(1, 'Raramente', 2, '2026-02-17', '2026-02-17', true),
(1, 'Às vezes', 3, '2026-02-17', '2026-02-17', true),
(1, 'Frequentemente', 4, '2026-02-17', '2026-02-17', true),
(1, 'Sempre', 5, '2026-02-17', '2026-02-17', true),

(2, 'Nunca', 1, '2026-02-17', '2026-02-17', true),
(2, 'Raramente', 2, '2026-02-17', '2026-02-17', true),
(2, 'Às vezes', 3, '2026-02-17', '2026-02-17', true),
(2, 'Frequentemente', 4, '2026-02-17', '2026-02-17', true),
(2, 'Sempre', 5, '2026-02-17', '2026-02-17', true),

(3, 'Nunca', 1, '2026-02-17', '2026-02-17', true),
(3, 'Raramente', 2, '2026-02-17', '2026-02-17', true),
(3, 'Às vezes', 3, '2026-02-17', '2026-02-17', true),
(3, 'Frequentemente', 4, '2026-02-17', '2026-02-17', true),
(3, 'Sempre', 5, '2026-02-17', '2026-02-17', true),

(4, 'Nunca', 1, '2026-02-17', '2026-02-17', true),
(4, 'Raramente', 2, '2026-02-17', '2026-02-17', true),
(4, 'Às vezes', 3, '2026-02-17', '2026-02-17', true),
(4, 'Frequentemente', 4, '2026-02-17', '2026-02-17', true),
(4, 'Sempre', 5, '2026-02-17', '2026-02-17', true),

(5, 'Nunca', 1, '2026-02-17', '2026-02-17', true),
(5, 'Raramente', 2, '2026-02-17', '2026-02-17', true),
(5, 'Às vezes', 3, '2026-02-17', '2026-02-17', true),
(5, 'Frequentemente', 4, '2026-02-17', '2026-02-17', true),
(5, 'Sempre', 5, '2026-02-17', '2026-02-17', true),

(6, 'Nunca', 1, '2026-02-17', '2026-02-17', true),
(6, 'Raramente', 2, '2026-02-17', '2026-02-17', true),
(6, 'Às vezes', 3, '2026-02-17', '2026-02-17', true),
(6, 'Frequentemente', 4, '2026-02-17', '2026-02-17', true),
(6, 'Sempre', 5, '2026-02-17', '2026-02-17', true),

(7, 'Nunca', 1, '2026-02-17', '2026-02-17', true),
(7, 'Raramente', 2, '2026-02-17', '2026-02-17', true),
(7, 'Às vezes', 3, '2026-02-17', '2026-02-17', true),
(7, 'Frequentemente', 4, '2026-02-17', '2026-02-17', true),
(7, 'Sempre', 5, '2026-02-17', '2026-02-17', true),

(8, 'Nunca', 1, '2026-02-17', '2026-02-17', true),
(8, 'Raramente', 2, '2026-02-17', '2026-02-17', true),
(8, 'Às vezes', 3, '2026-02-17', '2026-02-17', true),
(8, 'Frequentemente', 4, '2026-02-17', '2026-02-17', true),
(8, 'Sempre', 5, '2026-02-17', '2026-02-17', true),

(9, 'Discordo totalmente', 1, '2026-02-17', '2026-02-17', true),
(9, 'Discordo', 2, '2026-02-17', '2026-02-17', true),
(9, 'Neutro', 3, '2026-02-17', '2026-02-17', true),
(9, 'Concordo', 4, '2026-02-17', '2026-02-17', true),
(9, 'Concordo totalmente', 5, '2026-02-17', '2026-02-17', true),

(10, 'Discordo totalmente', 1, '2026-02-17', '2026-02-17', true),
(10, 'Discordo', 2, '2026-02-17', '2026-02-17', true),
(10, 'Neutro', 3, '2026-02-17', '2026-02-17', true),
(10, 'Concordo', 4, '2026-02-17', '2026-02-17', true),
(10, 'Concordo totalmente', 5, '2026-02-17', '2026-02-17', true),

(11, 'Discordo totalmente', 1, '2026-02-17', '2026-02-17', true),
(11, 'Discordo', 2, '2026-02-17', '2026-02-17', true),
(11, 'Neutro', 3, '2026-02-17', '2026-02-17', true),
(11, 'Concordo', 4, '2026-02-17', '2026-02-17', true),
(11, 'Concordo totalmente', 5, '2026-02-17', '2026-02-17', true),

-- BSMAS (12-15) e FoMOs/SAS-SV (19-23) usam a variação de Frequência.
(12, 'Nunca', 1, '2026-07-16', '2026-07-16', true),
(12, 'Raramente', 2, '2026-07-16', '2026-07-16', true),
(12, 'Às vezes', 3, '2026-07-16', '2026-07-16', true),
(12, 'Frequentemente', 4, '2026-07-16', '2026-07-16', true),
(12, 'Sempre', 5, '2026-07-16', '2026-07-16', true),

(13, 'Nunca', 1, '2026-07-16', '2026-07-16', true),
(13, 'Raramente', 2, '2026-07-16', '2026-07-16', true),
(13, 'Às vezes', 3, '2026-07-16', '2026-07-16', true),
(13, 'Frequentemente', 4, '2026-07-16', '2026-07-16', true),
(13, 'Sempre', 5, '2026-07-16', '2026-07-16', true),

(14, 'Nunca', 1, '2026-07-16', '2026-07-16', true),
(14, 'Raramente', 2, '2026-07-16', '2026-07-16', true),
(14, 'Às vezes', 3, '2026-07-16', '2026-07-16', true),
(14, 'Frequentemente', 4, '2026-07-16', '2026-07-16', true),
(14, 'Sempre', 5, '2026-07-16', '2026-07-16', true),

(15, 'Nunca', 1, '2026-07-16', '2026-07-16', true),
(15, 'Raramente', 2, '2026-07-16', '2026-07-16', true),
(15, 'Às vezes', 3, '2026-07-16', '2026-07-16', true),
(15, 'Frequentemente', 4, '2026-07-16', '2026-07-16', true),
(15, 'Sempre', 5, '2026-07-16', '2026-07-16', true),

-- SMD Scale (16-18) usa a variação de Concordância.
(16, 'Discordo totalmente', 1, '2026-07-16', '2026-07-16', true),
(16, 'Discordo', 2, '2026-07-16', '2026-07-16', true),
(16, 'Neutro', 3, '2026-07-16', '2026-07-16', true),
(16, 'Concordo', 4, '2026-07-16', '2026-07-16', true),
(16, 'Concordo totalmente', 5, '2026-07-16', '2026-07-16', true),

(17, 'Discordo totalmente', 1, '2026-07-16', '2026-07-16', true),
(17, 'Discordo', 2, '2026-07-16', '2026-07-16', true),
(17, 'Neutro', 3, '2026-07-16', '2026-07-16', true),
(17, 'Concordo', 4, '2026-07-16', '2026-07-16', true),
(17, 'Concordo totalmente', 5, '2026-07-16', '2026-07-16', true),

(18, 'Discordo totalmente', 1, '2026-07-16', '2026-07-16', true),
(18, 'Discordo', 2, '2026-07-16', '2026-07-16', true),
(18, 'Neutro', 3, '2026-07-16', '2026-07-16', true),
(18, 'Concordo', 4, '2026-07-16', '2026-07-16', true),
(18, 'Concordo totalmente', 5, '2026-07-16', '2026-07-16', true),

-- FoMOs (19-21), variação de Frequência.
(19, 'Nunca', 1, '2026-07-16', '2026-07-16', true),
(19, 'Raramente', 2, '2026-07-16', '2026-07-16', true),
(19, 'Às vezes', 3, '2026-07-16', '2026-07-16', true),
(19, 'Frequentemente', 4, '2026-07-16', '2026-07-16', true),
(19, 'Sempre', 5, '2026-07-16', '2026-07-16', true),

(20, 'Nunca', 1, '2026-07-16', '2026-07-16', true),
(20, 'Raramente', 2, '2026-07-16', '2026-07-16', true),
(20, 'Às vezes', 3, '2026-07-16', '2026-07-16', true),
(20, 'Frequentemente', 4, '2026-07-16', '2026-07-16', true),
(20, 'Sempre', 5, '2026-07-16', '2026-07-16', true),

(21, 'Nunca', 1, '2026-07-16', '2026-07-16', true),
(21, 'Raramente', 2, '2026-07-16', '2026-07-16', true),
(21, 'Às vezes', 3, '2026-07-16', '2026-07-16', true),
(21, 'Frequentemente', 4, '2026-07-16', '2026-07-16', true),
(21, 'Sempre', 5, '2026-07-16', '2026-07-16', true),

-- SAS-SV (22-23), variação de Frequência.
(22, 'Nunca', 1, '2026-07-16', '2026-07-16', true),
(22, 'Raramente', 2, '2026-07-16', '2026-07-16', true),
(22, 'Às vezes', 3, '2026-07-16', '2026-07-16', true),
(22, 'Frequentemente', 4, '2026-07-16', '2026-07-16', true),
(22, 'Sempre', 5, '2026-07-16', '2026-07-16', true),

(23, 'Nunca', 1, '2026-07-16', '2026-07-16', true),
(23, 'Raramente', 2, '2026-07-16', '2026-07-16', true),
(23, 'Às vezes', 3, '2026-07-16', '2026-07-16', true),
(23, 'Frequentemente', 4, '2026-07-16', '2026-07-16', true),
(23, 'Sempre', 5, '2026-07-16', '2026-07-16', true),

-- SISES (24-26), variação de Concordância. Item 24 é redigido na direção
-- oposta aos itens 25-26 (concordar = protetor, não risco) — os VALORES das
-- opções são invertidos de propósito (Concordo totalmente=1 .. Discordo
-- totalmente=5) para que "valor alto" continue significando "mais risco" em
-- toda a escala, igual às outras perguntas. Não mexer sem entender isso.
(24, 'Discordo totalmente', 5, '2026-07-16', '2026-07-16', true),
(24, 'Discordo', 4, '2026-07-16', '2026-07-16', true),
(24, 'Neutro', 3, '2026-07-16', '2026-07-16', true),
(24, 'Concordo', 2, '2026-07-16', '2026-07-16', true),
(24, 'Concordo totalmente', 1, '2026-07-16', '2026-07-16', true),

(25, 'Discordo totalmente', 1, '2026-07-16', '2026-07-16', true),
(25, 'Discordo', 2, '2026-07-16', '2026-07-16', true),
(25, 'Neutro', 3, '2026-07-16', '2026-07-16', true),
(25, 'Concordo', 4, '2026-07-16', '2026-07-16', true),
(25, 'Concordo totalmente', 5, '2026-07-16', '2026-07-16', true),

(26, 'Discordo totalmente', 1, '2026-07-16', '2026-07-16', true),
(26, 'Discordo', 2, '2026-07-16', '2026-07-16', true),
(26, 'Neutro', 3, '2026-07-16', '2026-07-16', true),
(26, 'Concordo', 4, '2026-07-16', '2026-07-16', true),
(26, 'Concordo totalmente', 5, '2026-07-16', '2026-07-16', true);