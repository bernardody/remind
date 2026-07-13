package br.com.remind.service.mail;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.springframework.mail.javamail.JavaMailSenderImpl;

import java.time.LocalDateTime;
import java.util.Properties;

/**
 * Teste manual e isolado: envia um e-mail de convite REAL via Zoho SMTP para validar a
 * configuração (docs/specs/002-convite-questionario/PRD.md §17), sem depender de banco
 * de dados nem do contexto Spring completo (ao contrário de um {@code @SpringBootTest},
 * que exigiria Postgres local rodando).
 *
 * <p>Só roda se {@code REMIND_MAIL_MANUAL_TEST=true} estiver definida — por padrão fica
 * desabilitado (não roda em CI nem em {@code mvn test} comum).
 *
 * <p>Para rodar, defina as variáveis de ambiente e execute:
 * <pre>
 *   ZOHO_MAIL_USERNAME=contato@remindapp.com.br
 *   ZOHO_MAIL_PASSWORD=&lt;senha de app gerada no Zoho&gt;
 *   REMIND_MAIL_MANUAL_TEST=true
 *   REMIND_MAIL_TEST_TO=&lt;opcional; padrão é enviar para o próprio ZOHO_MAIL_USERNAME&gt;
 *
 *   ./mvnw test -Dtest=MailServiceManualTest
 * </pre>
 */
@EnabledIfEnvironmentVariable(named = "REMIND_MAIL_MANUAL_TEST", matches = "true")
class MailServiceManualTest {

    @Test
    void sendsRealInviteEmailViaZoho() {
        String username = requireEnv("ZOHO_MAIL_USERNAME");
        String password = requireEnv("ZOHO_MAIL_PASSWORD");
        String to = System.getenv().getOrDefault("REMIND_MAIL_TEST_TO", username);

        JavaMailSenderImpl javaMailSender = new JavaMailSenderImpl();
        javaMailSender.setHost("smtppro.zoho.com");
        javaMailSender.setPort(465);
        javaMailSender.setUsername(username);
        javaMailSender.setPassword(password);

        Properties mailProperties = javaMailSender.getJavaMailProperties();
        mailProperties.put("mail.smtp.auth", "true");
        mailProperties.put("mail.smtp.ssl.enable", "true");
        mailProperties.put("mail.smtp.socketFactory.class", "javax.net.ssl.SSLSocketFactory");
        mailProperties.put("mail.smtp.socketFactory.port", "465");

        MailService mailService = new MailService(javaMailSender, username, "ReMind (teste)");

        mailService.sendQuestionnaireInvite(
                to,
                "Paciente de Teste",
                "Questionário de Teste — Validação SMTP",
                "https://remindapp.com.br/convite/token-de-teste",
                LocalDateTime.now().plusDays(7)
        );

        System.out.println("E-mail de teste enviado para " + to + " — confira a caixa de entrada.");
    }

    private static String requireEnv(String name) {
        String value = System.getenv(name);
        if (value == null || value.isBlank()) {
            throw new IllegalStateException("Variável de ambiente " + name + " não definida.");
        }
        return value;
    }
}
