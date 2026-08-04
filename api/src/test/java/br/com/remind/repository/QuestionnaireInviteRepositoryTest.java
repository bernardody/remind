package br.com.remind.repository;

import br.com.remind.domain.Address;
import br.com.remind.domain.Patient;
import br.com.remind.domain.Psychologist;
import br.com.remind.domain.Questionnaire;
import br.com.remind.domain.QuestionnaireInvite;
import br.com.remind.domain.User;
import br.com.remind.enums.InviteStatus;
import br.com.remind.enums.UserType;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.boot.jpa.test.autoconfigure.TestEntityManager;
import org.springframework.test.context.TestPropertySource;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Slice de persistência para {@link QuestionnaireInviteRepository}, focado no consumo
 * atômico do token (INV-008, docs/specs/002-convite-questionario/PRD.md §16) — a peça
 * de maior risco da Fase A, já que uma corrida entre duas requisições com o mesmo token
 * não pode resultar em consumo duplo.
 *
 * <p>H2 em memória (mesmo padrão de {@code UserRepositoryTest}); a coerência com
 * {@code api/data/schema.sql} sob {@code ddl-auto: validate} já foi verificada subindo
 * a aplicação real contra Postgres.
 */
@DataJpaTest
@TestPropertySource(properties = "spring.jpa.hibernate.ddl-auto=create-drop")
class QuestionnaireInviteRepositoryTest {

    @Autowired
    private QuestionnaireInviteRepository questionnaireInviteRepository;

    @Autowired
    private TestEntityManager entityManager;

    private Patient patient;
    private Questionnaire questionnaire;
    private Psychologist psychologist;

    private QuestionnaireInvite persistInvite(String tokenHash, InviteStatus status,
                                               LocalDateTime expiresAt, LocalDateTime consumedAt, boolean active) {
        setUpGraphIfNeeded();

        QuestionnaireInvite invite = QuestionnaireInvite.builder()
                .patient(patient)
                .questionnaire(questionnaire)
                .psychologist(psychologist)
                .token_hash(tokenHash)
                .status(status)
                .expires_at(expiresAt)
                .consumed_at(consumedAt)
                .created_at(LocalDate.now())
                .updated_at(LocalDate.now())
                .active(active)
                .build();

        return entityManager.persistAndFlush(invite);
    }

    private void setUpGraphIfNeeded() {
        if (patient != null) {
            return;
        }

        Address address = entityManager.persistAndFlush(Address.builder()
                .street("Rua Teste").number(1).cep("12345678").neighborhood("Centro").city("Cidade Teste")
                .created_at(LocalDate.now()).updated_at(LocalDate.now()).active(true).build());

        User psychologistUser = entityManager.persistAndFlush(User.builder()
                .name("Psicólogo Teste").email("psicologo@example.com").type(UserType.PSYCHOLOGIST)
                .profileComplete(true)
                .created_at(LocalDate.now()).updated_at(LocalDate.now()).active(true).build());

        psychologist = entityManager.persistAndFlush(Psychologist.builder()
                .user(psychologistUser).address(address)
                .created_at(LocalDate.now()).updated_at(LocalDate.now()).active(true).build());

        User patientUser = entityManager.persistAndFlush(User.builder()
                .name("Paciente Teste").email("paciente@example.com").type(UserType.PATIENT)
                .profileComplete(true)
                .created_at(LocalDate.now()).updated_at(LocalDate.now()).active(true).build());

        patient = entityManager.persistAndFlush(Patient.builder()
                .user(patientUser).psychologist(psychologist)
                .birth_date(LocalDate.of(2010, 1, 1)).gender('F')
                .created_at(LocalDate.now()).updated_at(LocalDate.now()).active(true).build());

        questionnaire = entityManager.persistAndFlush(Questionnaire.builder()
                .title("Questionário Teste")
                .created_at(LocalDate.now()).updated_at(LocalDate.now()).active(true).build());
    }

    @Test
    void consumeByTokenHash_marksOpenedAndConsumed_whenValidNotExpiredAndActive() {
        persistInvite("hash-valido", InviteStatus.SENT, LocalDateTime.now().plusDays(1), null, true);

        LocalDateTime now = LocalDateTime.now();
        int rows = questionnaireInviteRepository.consumeByTokenHash("hash-valido", now, now.toLocalDate());

        assertThat(rows).isEqualTo(1);

        QuestionnaireInvite reloaded = questionnaireInviteRepository.findByTokenHash("hash-valido").orElseThrow();
        assertThat(reloaded.getStatus()).isEqualTo(InviteStatus.OPENED);
        assertThat(reloaded.getConsumed_at()).isNotNull();
        assertThat(reloaded.getOpened_at()).isNotNull();
    }

    @Test
    void consumeByTokenHash_returnsZero_secondTimeOnSameToken_provingSingleUse() {
        persistInvite("hash-reuso", InviteStatus.SENT, LocalDateTime.now().plusDays(1), null, true);

        LocalDateTime now = LocalDateTime.now();
        int first = questionnaireInviteRepository.consumeByTokenHash("hash-reuso", now, now.toLocalDate());
        int second = questionnaireInviteRepository.consumeByTokenHash("hash-reuso", now, now.toLocalDate());

        assertThat(first).isEqualTo(1);
        assertThat(second).isEqualTo(0); // já consumido (consumed_at != null) — não consome de novo
    }

    @Test
    void consumeByTokenHash_returnsZero_whenExpired() {
        persistInvite("hash-expirado", InviteStatus.SENT, LocalDateTime.now().minusMinutes(1), null, true);

        LocalDateTime now = LocalDateTime.now();
        int rows = questionnaireInviteRepository.consumeByTokenHash("hash-expirado", now, now.toLocalDate());

        assertThat(rows).isEqualTo(0);
    }

    @Test
    void consumeByTokenHash_returnsZero_whenInactive() {
        persistInvite("hash-revogado", InviteStatus.REVOKED, LocalDateTime.now().plusDays(1), null, false);

        LocalDateTime now = LocalDateTime.now();
        int rows = questionnaireInviteRepository.consumeByTokenHash("hash-revogado", now, now.toLocalDate());

        assertThat(rows).isEqualTo(0);
    }

    @Test
    void consumeByTokenHash_returnsZero_whenAlreadyConsumedPreviously() {
        persistInvite("hash-ja-consumido", InviteStatus.ANSWERED, LocalDateTime.now().plusDays(1), LocalDateTime.now().minusHours(1), true);

        LocalDateTime now = LocalDateTime.now();
        int rows = questionnaireInviteRepository.consumeByTokenHash("hash-ja-consumido", now, now.toLocalDate());

        assertThat(rows).isEqualTo(0);
    }

    @Test
    void findByPatientAndQuestionnaireAndActiveTrue_findsExistingInvite_forReuseOnCreate() {
        QuestionnaireInvite invite = persistInvite("hash-existente", InviteStatus.SENT, LocalDateTime.now().plusDays(1), null, true);

        Optional<QuestionnaireInvite> found =
                questionnaireInviteRepository.findByPatientAndQuestionnaireAndActiveTrue(patient, questionnaire);

        assertThat(found).isPresent();
        assertThat(found.get().getId()).isEqualTo(invite.getId());
    }
}
