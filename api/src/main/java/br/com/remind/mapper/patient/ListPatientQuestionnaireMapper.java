package br.com.remind.mapper.patient;

import br.com.remind.controller.response.patient.ListPatientQuestionnaireResponse;
import br.com.remind.domain.QuestionnaireAnswer;
import org.springframework.stereotype.Component;

@Component
public class ListPatientQuestionnaireMapper {

    public ListPatientQuestionnaireResponse toResponse(QuestionnaireAnswer answer) {
        return ListPatientQuestionnaireResponse.builder()
                .questionnaireId(answer.getQuestionnaire().getId())
                .questionnaireTitle(answer.getQuestionnaire().getTitle())
                .answeredAt(answer.getAnswered_at())
                .build();
    }
}
