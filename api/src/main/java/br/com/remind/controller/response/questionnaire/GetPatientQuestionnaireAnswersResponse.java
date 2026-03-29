package br.com.remind.controller.response.questionnaire;

import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Builder
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
public class GetPatientQuestionnaireAnswersResponse {

    private Long questionnaireAnswerId;
    private String patientName;
    private String questionnaireTitle;
    private LocalDateTime answeredAt;
    private List<QuestionAnswerDetail> responses;

    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    @Getter
    @Setter
    public static class QuestionAnswerDetail {
        private Long questionId;
        private String questionText;
        private String chosenOption;
        private Integer chosenValue;
    }
}