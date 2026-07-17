package br.com.remind.controller.response.questionnaire;

import br.com.remind.enums.EvolutionTrend;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Builder
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
public class GetPatientQuestionnaireEvolutionResponse {

    private Long patientId;
    private String patientName;
    private Long questionnaireId;
    private String questionnaireTitle;
    private List<ApplicationResult> applications;

    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    @Getter
    @Setter
    public static class ApplicationResult {
        private Long questionnaireAnswerId;
        private LocalDateTime answeredAt;
        private BigDecimal average;
        private List<ScaleEvolutionResult> scaleResults;
    }

    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    @Getter
    @Setter
    public static class ScaleEvolutionResult {
        private Long scaleId;
        private String scaleName;
        private BigDecimal average;
        private String riskLabel;
        /** {@code null} na primeira rodada — não há rodada anterior pra comparar. */
        private EvolutionTrend trend;
    }
}
