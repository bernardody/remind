package br.com.remind.mapper.questionnaire;

import br.com.remind.controller.response.questionnaire.ListQuestionnairePatientResponse;
import br.com.remind.domain.QuestionnaireAnswer;
import org.springframework.stereotype.Component;

@Component
public class ListQuestionnairePatientMapper {

    public ListQuestionnairePatientResponse toResponse(QuestionnaireAnswer answer) {
        return ListQuestionnairePatientResponse.builder()
                .patientId(answer.getPatient().getId())
                .patientName(answer.getPatient().getUser().getName())
                .answeredAt(answer.getAnswered_at())
                .build();
    }
}