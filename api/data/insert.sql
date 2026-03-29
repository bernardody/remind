INSERT INTO addresses (id, street, number, cep, neighborhood, city, created_at, updated_at, active) VALUES
(101, 'Rua das Flores', 123, '95780000', 'Centro', 'Montenegro', '2025-12-15', '2025-12-15', true),
(102, 'Avenida Júlio de Castilhos', 456, '90030130', 'Centro Histórico', 'Porto Alegre', '2025-08-12', '2025-08-12', true),
(103, 'Rua Bento Gonçalves', 789, '95020412', 'São Pelegrino', 'Caxias do Sul', '2025-10-05', '2025-10-05', true);


INSERT INTO users (name, email, cpf, phone, password, type, created_at, updated_at, active) VALUES
('Rafael Monteiro Duarte', 'rafael.duarte87@gmail.com', '51756699070', '9224732623', '$2a$10$n39fOvjLehiGh/OUXoV01OPWy1Ilf4XTNAjm/Fo9sh2h8smlA50ze', 'PATIENT', '2025-11-03', '2025-11-03', true),
('Camila Ferreira Nogueira', 'camila.nogueira.cf@gmail.com', '38492017566', '9812345678', '$2a$10$n39fOvjLehiGh/OUXoV01OPWy1Ilf4XTNAjm/Fo9sh2h8smlA50ze', 'PSYCHOLOGIST', '2025-12-15', '2025-12-15', true),
('Lucas Martins Azevedo', 'lucas.azevedo.martins@gmail.com', '72910485632', '9897654321', '$2a$10$n39fOvjLehiGh/OUXoV01OPWy1Ilf4XTNAjm/Fo9sh2h8smlA50ze', 'PATIENT', '2025-10-28', '2025-10-28', true),
('Beatriz Carvalho Lopes', 'beatriz.lopes.carvalho@gmail.com', '15893746205', '9771122334', '$2a$10$n39fOvjLehiGh/OUXoV01OPWy1Ilf4XTNAjm/Fo9sh2h8smlA50ze', 'PATIENT', '2025-09-19', '2025-09-19', true),
('Felipe Gonçalves Ribeiro', 'felipe.ribeiro.gr@gmail.com', '60482917355', '9883344556', '$2a$10$n39fOvjLehiGh/OUXoV01OPWy1Ilf4XTNAjm/Fo9sh2h8smlA50ze', 'PATIENT', '2025-11-27', '2025-11-27', true),
('Mariana Teixeira Freitas', 'mariana.freitas.teixeira@gmail.com', '93720518466', '9995566778', '$2a$10$n39fOvjLehiGh/OUXoV01OPWy1Ilf4XTNAjm/Fo9sh2h8smlA50ze', 'PSYCHOLOGIST', '2025-08-12', '2025-08-12', true),
('Eduardo Almeida Barros', 'eduardo.barros.almeida@gmail.com', '48261903715', '9667788990', '$2a$10$n39fOvjLehiGh/OUXoV01OPWy1Ilf4XTNAjm/Fo9sh2h8smlA50ze', 'PATIENT', '2025-12-02', '2025-12-02', true),
('Juliana Correia Batista', 'juliana.batista.correia@gmail.com', '31590728461', '9558899001', '$2a$10$n39fOvjLehiGh/OUXoV01OPWy1Ilf4XTNAjm/Fo9sh2h8smlA50ze', 'PSYCHOLOGIST', '2025-10-05', '2025-10-05', true),
('Thiago Moreira Farias', 'thiago.farias.moreira@gmail.com', '86420197533', '9440011223', '$2a$10$n39fOvjLehiGh/OUXoV01OPWy1Ilf4XTNAjm/Fo9sh2h8smlA50ze', 'PATIENT', '2025-07-21', '2025-07-21', true);


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
('Questionário Exemplo', '2026-02-17', '2026-02-17', true);


INSERT INTO scales (name, created_at, updated_at, active) VALUES
('CARS', '2026-02-17', '2026-02-17', true),
('UCLA', '2026-02-17', '2026-02-17', true),
('SPI', '2026-02-17', '2026-02-17', true);


INSERT INTO questions (id_questionnaire, id_scale, text, order_number, created_at, updated_at, active) VALUES
(1, 1, 'Você sente a necessidade de verificar as redes sociais logo ao acordar ou antes de dormir?', 1, '2026-02-17', '2026-02-17', true),
(1, 1, 'Quando está em situações sociais, você sente que precisa usar as redes sociais para se distrair ou se sentir mais confortável?', 1, '2026-02-17', '2026-02-17', true),
(1, 1, 'Com que frequência você sente que seu humor piora quando não consegue acessar suas redes sociais?', 1, '2026-02-17', '2026-02-17', true),
(1, 1, 'Você sente que dedica mais tempo às redes sociais do que planejava originalmente?', 1, '2026-02-17', '2026-02-17', true),
(1, 2, 'Você sente que o uso de redes sociais substitui a interação face a face com outras pessoas?', 1, '2026-02-17', '2026-02-17', true),
(1, 2, 'Com que frequência você sente que seus amigos online realmente compreendem você?', 1, '2026-02-17', '2026-02-17', true),
(1, 2, 'Você se sente isolado(a), mesmo ao interagir nas redes sociais?', 1, '2026-02-17', '2026-02-17', true),
(1, 2, 'Com que frequência você recorre às redes sociais quando está se sentindo sozinho(a)?', 1, '2026-02-17', '2026-02-17', true),
(1, 3, 'O uso das redes sociais já causou conflitos com pessoas próximas a você.', 1, '2026-02-17', '2026-02-17', true),
(1, 3, 'Eu me irrito facilmente se alguém interfere no meu uso das redes sociais.', 1, '2026-02-17', '2026-02-17', true),
(1, 3, 'Já percebi que as redes sociais afetam a qualidade dos meus relacionamentos pessoais.', 1, '2026-02-17', '2026-02-17', true);


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
(11, 'Concordo totalmente', 5, '2026-02-17', '2026-02-17', true);