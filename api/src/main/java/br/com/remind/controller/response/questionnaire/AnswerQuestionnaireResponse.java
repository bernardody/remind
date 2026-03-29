package br.com.remind.controller.response.questionnaire;

import lombok.*;

import java.time.LocalDateTime;

@Builder
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
public class AnswerQuestionnaireResponse {

    private Long id;
    private String patientName;
    private String questionnaireTitle;
    private Integer totalResponses;
    private LocalDateTime answeredAt;
}
