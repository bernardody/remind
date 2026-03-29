package br.com.remind.mapper.questionnaire;

import br.com.remind.controller.response.questionnaire.GetPatientQuestionnaireResultResponse;
import br.com.remind.domain.QuestionnaireResult;
import org.springframework.stereotype.Component;

@Component
public class GetPatientQuestionnaireResultMapper {

    public GetPatientQuestionnaireResultResponse toResponse(QuestionnaireResult result) {
        return GetPatientQuestionnaireResultResponse.builder()
                .questionnaireAnswerId(result.getQuestionnaireResponse().getId())
                .patientName(result.getQuestionnaireResponse().getPatient().getUser().getName())
                .questionnaireTitle(result.getQuestionnaireResponse().getQuestionnaire().getTitle())
                .average(result.getAverage())
                .answeredAt(result.getQuestionnaireResponse().getAnswered_at())
                .build();
    }
}