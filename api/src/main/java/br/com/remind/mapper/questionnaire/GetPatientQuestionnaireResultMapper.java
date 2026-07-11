package br.com.remind.mapper.questionnaire;

import br.com.remind.controller.response.questionnaire.GetPatientQuestionnaireResultResponse;
import br.com.remind.controller.response.questionnaire.GetPatientQuestionnaireResultResponse.ScaleResultResponse;
import br.com.remind.domain.QuestionnaireResult;
import br.com.remind.domain.QuestionnaireScaleResult;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class GetPatientQuestionnaireResultMapper {

    public GetPatientQuestionnaireResultResponse toResponse(
            QuestionnaireResult result, List<QuestionnaireScaleResult> scaleResults) {
        return GetPatientQuestionnaireResultResponse.builder()
                .questionnaireAnswerId(result.getQuestionnaireResponse().getId())
                .patientName(result.getQuestionnaireResponse().getPatient().getUser().getName())
                .questionnaireTitle(result.getQuestionnaireResponse().getQuestionnaire().getTitle())
                .average(result.getAverage())
                .answeredAt(result.getQuestionnaireResponse().getAnswered_at())
                .scaleResults(scaleResults.stream().map(this::toScaleResultResponse).toList())
                .build();
    }

    private ScaleResultResponse toScaleResultResponse(QuestionnaireScaleResult scaleResult) {
        return ScaleResultResponse.builder()
                .scaleId(scaleResult.getScale().getId())
                .scaleName(scaleResult.getScale().getName())
                .average(scaleResult.getAverage())
                .riskLabel(scaleResult.getRisk_label())
                .build();
    }
}
