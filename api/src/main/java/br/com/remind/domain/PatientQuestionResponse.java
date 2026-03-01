package br.com.remind.domain;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.time.LocalDate;

import static jakarta.persistence.GenerationType.IDENTITY;

@Builder
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
@EqualsAndHashCode(of = "id")
@ToString(of = "id")
@Entity
@Table(name = "patient_question_responses")
public class PatientQuestionResponse {

    @Id
    @GeneratedValue(strategy = IDENTITY)
    private Long id;

    @NotNull
    @ManyToOne
    @JoinColumn(name = "id_questionnaire_response", nullable = false)
    private QuestionnaireResponse questionnaireResponse;

    @NotNull
    @ManyToOne
    @JoinColumn(name = "id_question", nullable = false)
    private Question question;

    @NotNull
    @ManyToOne
    @JoinColumn(name = "id_question_option", nullable = false)
    private QuestionOption questionOption;

    @NotNull
    private LocalDate created_at;

    private LocalDate updated_at;

    @NotNull
    private Boolean active;
}
