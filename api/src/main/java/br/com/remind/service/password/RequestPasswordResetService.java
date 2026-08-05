package br.com.remind.service.password;

import br.com.remind.domain.PasswordResetToken;
import br.com.remind.domain.User;
import br.com.remind.repository.PasswordResetTokenRepository;
import br.com.remind.repository.UserRepository;
import br.com.remind.service.invite.InviteTokenGenerator;
import br.com.remind.service.mail.MailService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Optional;

/**
 * Solicita a redefinição de senha de um usuário (psicólogo ou admin). Serve tanto o fluxo
 * self-service de "esqueci minha senha" quanto o e-mail de ativação disparado ao cadastrar um
 * psicólogo novo ({@code CreatePsychologistService}) — mesmo mecanismo de token, só muda quem
 * dispara a chamada.
 *
 * <p>Nunca revela se o e-mail existe (mesmo princípio já usado no login por senha): se o usuário
 * não existir, o método retorna silenciosamente.
 */
@RequiredArgsConstructor
@Service
public class RequestPasswordResetService {

    private final UserRepository userRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final InviteTokenGenerator inviteTokenGenerator;
    private final MailService mailService;

    @Value("${remind.password-reset.expiration-minutes:30}")
    private long expirationMinutes;

    @Value("${remind.invite.base-url}")
    private String baseUrl;

    @Transactional
    public void request(String email) {
        Optional<User> maybeUser = userRepository.findByEmail(email);
        if (maybeUser.isEmpty()) {
            return;
        }

        User user = maybeUser.get();
        LocalDate today = LocalDate.now();

        // Evita múltiplos links válidos simultâneos para o mesmo usuário.
        passwordResetTokenRepository.deactivateAllByUser(user, today);

        String rawToken = inviteTokenGenerator.generateRawToken();
        LocalDateTime expiresAt = LocalDateTime.now().plusMinutes(expirationMinutes);

        PasswordResetToken token = PasswordResetToken.builder()
                .user(user)
                .token_hash(inviteTokenGenerator.hash(rawToken))
                .expires_at(expiresAt)
                .created_at(today)
                .updated_at(today)
                .active(true)
                .build();

        passwordResetTokenRepository.save(token);

        String resetLink = baseUrl + "/redefinir-senha?token=" + rawToken;

        mailService.sendPasswordResetEmail(user.getEmail(), user.getName(), resetLink, expiresAt);
    }
}
