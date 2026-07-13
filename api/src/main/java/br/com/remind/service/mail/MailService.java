package br.com.remind.service.mail;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.util.HtmlUtils;

import java.io.UnsupportedEncodingException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

import static org.springframework.http.HttpStatus.INTERNAL_SERVER_ERROR;

/**
 * Envio de e-mails transacionais via SMTP (Zoho Mail, domínio {@code remindapp.com.br} —
 * ver docs/specs/002-convite-questionario/PRD.md §17). Usa {@link JavaMailSender},
 * autoconfigurado pelo Spring Boot a partir de {@code spring.mail.*}; nenhum SDK de
 * provedor terceiro é necessário.
 */
@Service
public class MailService {

    private static final DateTimeFormatter EXPIRES_AT_FORMAT =
            DateTimeFormatter.ofPattern("dd/MM/yyyy 'às' HH:mm");

    private final JavaMailSender javaMailSender;
    private final String fromAddress;
    private final String fromName;

    public MailService(JavaMailSender javaMailSender,
                        @Value("${spring.mail.username}") String fromAddress,
                        @Value("${remind.mail.from-name:ReMind}") String fromName) {
        this.javaMailSender = javaMailSender;
        this.fromAddress = fromAddress;
        this.fromName = fromName;
    }

    /**
     * Envia o e-mail de convite para responder um questionário (docs/specs/002-convite-questionario).
     *
     * @param to                 e-mail cadastrado do paciente
     * @param patientName        nome do paciente (exibido na saudação; escapado antes de ir ao HTML)
     * @param questionnaireTitle título do questionário (escapado antes de ir ao HTML)
     * @param inviteLink         URL completa do convite (já contém o token — nunca logar este valor)
     * @param expiresAt          validade do link, exibida ao paciente
     */
    public void sendQuestionnaireInvite(String to, String patientName, String questionnaireTitle,
                                         String inviteLink, LocalDateTime expiresAt) {
        MimeMessage message = javaMailSender.createMimeMessage();
        try {
            MimeMessageHelper helper = new MimeMessageHelper(message, false, "UTF-8");
            helper.setFrom(fromAddress, fromName);
            helper.setTo(to);
            helper.setSubject("Você foi convidado(a) a responder um questionário — ReMind");
            helper.setText(buildInviteHtml(patientName, questionnaireTitle, inviteLink, expiresAt), true);
        } catch (MessagingException | UnsupportedEncodingException e) {
            throw new ResponseStatusException(INTERNAL_SERVER_ERROR, "Falha ao montar e-mail de convite", e);
        }

        try {
            javaMailSender.send(message);
        } catch (MailException e) {
            throw new ResponseStatusException(INTERNAL_SERVER_ERROR, "Falha ao enviar e-mail de convite", e);
        }
    }

    private String buildInviteHtml(String patientName, String questionnaireTitle, String inviteLink,
                                    LocalDateTime expiresAt) {
        return INVITE_TEMPLATE
                .replace("{{PATIENT_NAME}}", HtmlUtils.htmlEscape(patientName))
                .replace("{{QUESTIONNAIRE_TITLE}}", HtmlUtils.htmlEscape(questionnaireTitle))
                .replace("{{INVITE_LINK}}", inviteLink)
                .replace("{{EXPIRES_AT}}", expiresAt.format(EXPIRES_AT_FORMAT));
    }

    // Paleta e fonte seguem documentacao/idVisual/id.md (obrigatório para qualquer material com a marca ReMind).
    private static final String INVITE_TEMPLATE = """
            <!DOCTYPE html>
            <html lang="pt-BR">
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Convite ReMind</title>
            </head>
            <body style="margin:0; padding:0; background-color:#F5F6F4; font-family:'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F5F6F4; padding:32px 16px;">
                <tr>
                  <td align="center">
                    <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="max-width:480px; width:100%; background-color:#FFFFFF; border-radius:12px; overflow:hidden;">
                      <tr>
                        <td style="background-color:#1C2B2B; padding:24px 32px;">
                          <span style="font-size:24px; font-weight:900; color:#1A7A6E; letter-spacing:0.5px;">ReMind</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:32px;">
                          <p style="margin:0 0 16px; font-size:16px; color:#1C2B2B;">Olá, {{PATIENT_NAME}},</p>
                          <p style="margin:0 0 24px; font-size:16px; line-height:1.5; color:#1C2B2B;">
                            Seu psicólogo(a) te convidou para responder ao questionário
                            <strong>{{QUESTIONNAIRE_TITLE}}</strong>. Leva só alguns minutos.
                          </p>
                          <table role="presentation" cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="border-radius:8px; background-color:#1A7A6E;">
                                <a href="{{INVITE_LINK}}"
                                   style="display:inline-block; padding:14px 28px; font-size:16px; font-weight:600; color:#FFFFFF; text-decoration:none; border-radius:8px;">
                                  Responder questionário
                                </a>
                              </td>
                            </tr>
                          </table>
                          <p style="margin:24px 0 0; font-size:13px; color:#1C2B2B;">
                            Este link é pessoal e expira em <strong>{{EXPIRES_AT}}</strong>.
                          </p>
                          <p style="margin:8px 0 0; font-size:13px; color:#1C2B2B;">
                            Se o botão não funcionar, copie e cole este endereço no navegador:<br>
                            <span style="color:#1A7A6E; word-break:break-all;">{{INVITE_LINK}}</span>
                          </p>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:16px 32px; background-color:#A8C5C0;">
                          <p style="margin:0; font-size:12px; color:#1C2B2B;">
                            Você recebeu este e-mail porque seu psicólogo(a) te cadastrou na plataforma ReMind.
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </body>
            </html>
            """;
}
