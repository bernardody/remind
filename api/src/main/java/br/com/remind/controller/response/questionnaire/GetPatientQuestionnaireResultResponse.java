package br.com.remind.controller.response.questionnaire;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Builder
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
public class GetPatientQuestionnaireResultResponse {

    private Long questionnaireAnswerId;
    private String patientName;
    private String questionnaireTitle;
    private BigDecimal average;
    private LocalDateTime answeredAt;
    private List<ScaleResultResponse> scaleResults;

    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    @Getter
    @Setter
    public static class ScaleResultResponse {
        private Long scaleId;
        private String scaleName;
        private BigDecimal average;
        private String riskLabel;
    }
}
