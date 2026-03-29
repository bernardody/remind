package br.com.remind.mapper.questionnaire;

import br.com.remind.controller.response.questionnaire.AnswerQuestionnaireResponse;
import br.com.remind.domain.QuestionnaireAnswer;
import org.springframework.stereotype.Component;

@Component
public class AnswerQuestionnaireMapper {

    public AnswerQuestionnaireResponse toResponse(QuestionnaireAnswer answer, Integer totalResponses) {
        return AnswerQuestionnaireResponse.builder()
                .id(answer.getId())
                .patientName(answer.getPatient().getUser().getName())
                .questionnaireTitle(answer.getQuestionnaire().getTitle())
                .totalResponses(totalResponses)
                .answeredAt(answer.getAnswered_at())
                .build();
    }
}