package br.com.remind.domain;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;
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
@Table(name = "questionnaire_scale_results")
public class QuestionnaireScaleResult {

    @Id
    @GeneratedValue(strategy = IDENTITY)
    private Long id;

    @NotNull
    @ManyToOne
    @JoinColumn(name = "id_questionnaire_result", nullable = false)
    private QuestionnaireResult questionnaireResult;

    @NotNull
    @ManyToOne
    @JoinColumn(name = "id_scale", nullable = false)
    private Scale scale;

    @NotNull
    private BigDecimal average;

    /** Nulo se a escala ainda não tem faixas de risco cadastradas (degrade graceful). */
    private String risk_label;

    @NotNull
    private LocalDate created_at;

    @NotNull
    private LocalDate updated_at;

    @NotNull
    private Boolean active;
}
