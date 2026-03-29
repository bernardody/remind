package br.com.remind.controller.response.questionnaire;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

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
}