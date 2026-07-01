package br.com.remind.repository;

import br.com.remind.domain.User;
import br.com.remind.enums.UserType;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.boot.jpa.test.autoconfigure.TestEntityManager;
import org.springframework.test.context.TestPropertySource;

import java.time.LocalDate;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Slice de persistência para {@link UserRepository}, focado nas capacidades
 * introduzidas pela TASK-001 (identidade Google e conta pendente).
 *
 * <p>Usa H2 em memória (escopo de teste) com o schema gerado a partir das entidades
 * ({@code ddl-auto=create-drop}); a coerência com {@code api/data/schema.sql} sob
 * {@code ddl-auto: validate} é verificada pelo boot da aplicação contra Postgres.
 */
@DataJpaTest
@TestPropertySource(properties = "spring.jpa.hibernate.ddl-auto=create-drop")
class UserRepositoryTest {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TestEntityManager entityManager;

    private User.UserBuilder baseUser() {
        return User.builder()
                .name("Teste")
                .email("teste@example.com")
                .type(UserType.PSYCHOLOGIST)
                .created_at(LocalDate.now())
                .updated_at(LocalDate.now())
                .active(true);
    }

    @Test
    void findByGoogleSub_returnsAccount_whenGoogleSubExists() {
        User user = baseUser()
                .email("google.user@example.com")
                .googleSub("google-sub-123")
                .profileComplete(false)
                .build();
        entityManager.persistAndFlush(user);

        Optional<User> found = userRepository.findByGoogleSub("google-sub-123");

        assertThat(found).isPresent();
        assertThat(found.get().getEmail()).isEqualTo("google.user@example.com");
        assertThat(found.get().getGoogleSub()).isEqualTo("google-sub-123");
    }

    @Test
    void findByGoogleSub_returnsEmpty_whenNoMatch() {
        User user = baseUser().googleSub("existing-sub").build();
        entityManager.persistAndFlush(user);

        Optional<User> found = userRepository.findByGoogleSub("unknown-sub");

        assertThat(found).isEmpty();
    }

    @Test
    void persist_pendingAccount_withNullCredentials_succeeds() {
        User pending = baseUser()
                .email("pending@example.com")
                .cpf(null)
                .phone(null)
                .password(null)
                .googleSub("pending-sub")
                .profileComplete(false)
                .build();

        User saved = userRepository.saveAndFlush(pending);

        assertThat(saved.getId()).isNotNull();
        assertThat(saved.getCpf()).isNull();
        assertThat(saved.getPhone()).isNull();
        assertThat(saved.getPassword()).isNull();
        assertThat(saved.getProfileComplete()).isFalse();
    }

    @Test
    void multipleUsers_withNullGoogleSub_canCoexist() {
        User first = baseUser().email("first@example.com").build();
        User second = baseUser().email("second@example.com").build();

        userRepository.saveAndFlush(first);
        userRepository.saveAndFlush(second);

        assertThat(first.getGoogleSub()).isNull();
        assertThat(second.getGoogleSub()).isNull();
        assertThat(userRepository.count()).isEqualTo(2);
    }
}
