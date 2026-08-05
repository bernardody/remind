package br.com.remind.service.password;

import br.com.remind.domain.PasswordResetToken;
import br.com.remind.repository.PasswordResetTokenRepository;
import br.com.remind.repository.UserRepository;
import br.com.remind.service.invite.InviteTokenGenerator;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.LocalDateTime;

import static org.springframework.http.HttpStatus.GONE;
import static org.springframework.http.HttpStatus.NOT_FOUND;

/**
 * Consome um token de redefinição de senha (uso único) e grava a nova senha do usuário —
 * mesmo padrão de {@code ConsumeInviteService}: o UPDATE atômico decide sozinho se o consumo é
 * válido, a busca anterior serve só para diagnosticar por que ele não afetou nenhuma linha.
 */
@RequiredArgsConstructor
@Service
public class ResetPasswordService {

    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final UserRepository userRepository;
    private final InviteTokenGenerator inviteTokenGenerator;
    private final PasswordEncoder passwordEncoder;

    @Transactional
    public void reset(String rawToken, String newPassword) {
        String tokenHash = inviteTokenGenerator.hash(rawToken);

        PasswordResetToken token = passwordResetTokenRepository.findByTokenHash(tokenHash)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Link de redefinição não encontrado."));

        LocalDateTime now = LocalDateTime.now();
        int consumed = passwordResetTokenRepository.consumeByTokenHash(tokenHash, now, now.toLocalDate());

        if (consumed == 0) {
            if (!Boolean.TRUE.equals(token.getActive())) {
                throw new ResponseStatusException(GONE, "Este link não está mais disponível.");
            }
            if (token.getConsumed_at() != null) {
                throw new ResponseStatusException(GONE, "Este link já foi utilizado.");
            }
            throw new ResponseStatusException(GONE, "Este link expirou. Solicite uma nova redefinição de senha.");
        }

        var user = token.getUser();
        user.setPassword(passwordEncoder.encode(newPassword));
        user.setUpdated_at(LocalDate.now());
        userRepository.save(user);
    }
}
