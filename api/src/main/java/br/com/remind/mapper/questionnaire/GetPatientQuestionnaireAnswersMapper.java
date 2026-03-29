package br.com.remind.mapper.questionnaire;

import br.com.remind.controller.response.questionnaire.GetPatientQuestionnaireAnswersResponse;
import br.com.remind.domain.PatientQuestionResponse;
import br.com.remind.domain.QuestionnaireAnswer;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class GetPatientQuestionnaireAnswersMapper {

    public GetPatientQuestionnaireAnswersResponse toResponse(QuestionnaireAnswer answer,
                                                             List<PatientQuestionResponse> responses) {
        List<GetPatientQuestionnaireAnswersResponse.QuestionAnswerDetail> details = responses.stream()
                .map(r -> GetPatientQuestionnaireAnswersResponse.QuestionAnswerDetail.builder()
                        .questionId(r.getQuestion().getId())
                        .questionText(r.getQuestion().getText())
                        .chosenOption(r.getQuestionOption().getName())
                        .chosenValue(r.getQuestionOption().getValue())
                        .build())
                .toList();

        return GetPatientQuestionnaireAnswersResponse.builder()
                .questionnaireAnswerId(answer.getId())
                .patientName(answer.getPatient().getUser().getName())
                .questionnaireTitle(answer.getQuestionnaire().getTitle())
                .answeredAt(answer.getAnswered_at())
                .responses(details)
                .build();
    }
}