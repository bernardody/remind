package br.com.remind.domain;

import br.com.remind.enums.InviteStatus;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

import static jakarta.persistence.GenerationType.IDENTITY;

@Builder
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
@EqualsAndHashCode(of = "id")
@ToString(of = "id")
@Entity
@Table(name = "questionnaire_invites")
public class QuestionnaireInvite {

    @Id
    @GeneratedValue(strategy = IDENTITY)
    private Long id;

    @NotNull
    @ManyToOne
    @JoinColumn(name = "id_patient", nullable = false)
    private Patient patient;

    @NotNull
    @ManyToOne
    @JoinColumn(name = "id_questionnaire", nullable = false)
    private Questionnaire questionnaire;

    @NotNull
    @ManyToOne
    @JoinColumn(name = "id_psychologist", nullable = false)
    private Psychologist psychologist;

    /** Preenchido só quando o paciente efetivamente responde (INV-009). */
    @ManyToOne
    @JoinColumn(name = "id_questionnaire_answer")
    private QuestionnaireAnswer questionnaireAnswer;

    /** SHA-256 do token de convite — o valor em claro nunca é persistido (PRD §16). */
    @NotBlank
    private String token_hash;

    @NotNull
    @Enumerated(EnumType.STRING)
    private InviteStatus status;

    @NotNull
    private LocalDateTime expires_at;

    private LocalDateTime sent_at;

    private LocalDateTime opened_at;

    private LocalDateTime consumed_at;

    @NotNull
    private LocalDate created_at;

    @NotNull
    private LocalDate updated_at;

    @NotNull
    private Boolean active;
}
