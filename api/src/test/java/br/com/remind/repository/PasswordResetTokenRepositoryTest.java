package br.com.remind.repository;

import br.com.remind.domain.PasswordResetToken;
import br.com.remind.domain.User;
import br.com.remind.enums.UserType;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.boot.jpa.test.autoconfigure.TestEntityManager;
import org.springframework.test.context.TestPropertySource;

import java.time.LocalDate;
import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Slice de persistência para {@link PasswordResetTokenRepository}, mesmo foco de
 * {@code QuestionnaireInviteRepositoryTest}: o consumo atômico do token não pode permitir
 * reuso nem ignorar expiração/inatividade.
 */
@DataJpaTest
@TestPropertySource(properties = "spring.jpa.hibernate.ddl-auto=create-drop")
class PasswordResetTokenRepositoryTest {

    @Autowired
    private PasswordResetTokenRepository passwordResetTokenRepository;

    @Autowired
    private TestEntityManager entityManager;

    private User user;

    private PasswordResetToken persistToken(String tokenHash, LocalDateTime expiresAt,
                                             LocalDateTime consumedAt, boolean active) {
        setUpUserIfNeeded();

        PasswordResetToken token = PasswordResetToken.builder()
                .user(user)
                .token_hash(tokenHash)
                .expires_at(expiresAt)
                .consumed_at(consumedAt)
                .created_at(LocalDate.now())
                .updated_at(LocalDate.now())
                .active(active)
                .build();

        return entityManager.persistAndFlush(token);
    }

    private void setUpUserIfNeeded() {
        if (user != null) {
            return;
        }

        user = entityManager.persistAndFlush(User.builder()
                .name("Psicólogo Teste").email("psicologo@example.com").type(UserType.PSYCHOLOGIST)
                .profileComplete(true)
                .created_at(LocalDate.now()).updated_at(LocalDate.now()).active(true).build());
    }

    @Test
    void consumeByTokenHash_marksConsumed_whenValidNotExpiredAndActive() {
        persistToken("hash-valido", LocalDateTime.now().plusMinutes(30), null, true);

        LocalDateTime now = LocalDateTime.now();
        int rows = passwordResetTokenRepository.consumeByTokenHash("hash-valido", now, now.toLocalDate());

        assertThat(rows).isEqualTo(1);

        PasswordResetToken reloaded = passwordResetTokenRepository.findByTokenHash("hash-valido").orElseThrow();
        assertThat(reloaded.getConsumed_at()).isNotNull();
    }

    @Test
    void consumeByTokenHash_returnsZero_secondTimeOnSameToken_provingSingleUse() {
        persistToken("hash-reuso", LocalDateTime.now().plusMinutes(30), null, true);

        LocalDateTime now = LocalDateTime.now();
        int first = passwordResetTokenRepository.consumeByTokenHash("hash-reuso", now, now.toLocalDate());
        int second = passwordResetTokenRepository.consumeByTokenHash("hash-reuso", now, now.toLocalDate());

        assertThat(first).isEqualTo(1);
        assertThat(second).isEqualTo(0);
    }

    @Test
    void consumeByTokenHash_returnsZero_whenExpired() {
        persistToken("hash-expirado", LocalDateTime.now().minusMinutes(1), null, true);

        LocalDateTime now = LocalDateTime.now();
        int rows = passwordResetTokenRepository.consumeByTokenHash("hash-expirado", now, now.toLocalDate());

        assertThat(rows).isEqualTo(0);
    }

    @Test
    void consumeByTokenHash_returnsZero_whenInactive() {
        persistToken("hash-inativo", LocalDateTime.now().plusMinutes(30), null, false);

        LocalDateTime now = LocalDateTime.now();
        int rows = passwordResetTokenRepository.consumeByTokenHash("hash-inativo", now, now.toLocalDate());

        assertThat(rows).isEqualTo(0);
    }

    @Test
    void deactivateAllByUser_deactivatesLiveTokens_soOnlyNewestLinkStaysValid() {
        persistToken("hash-antigo", LocalDateTime.now().plusMinutes(30), null, true);

        passwordResetTokenRepository.deactivateAllByUser(user, LocalDate.now());

        LocalDateTime now = LocalDateTime.now();
        int rows = passwordResetTokenRepository.consumeByTokenHash("hash-antigo", now, now.toLocalDate());

        assertThat(rows).isEqualTo(0);
    }
}
