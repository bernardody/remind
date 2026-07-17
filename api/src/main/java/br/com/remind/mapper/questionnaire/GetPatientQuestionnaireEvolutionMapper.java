package br.com.remind.mapper.questionnaire;

import br.com.remind.controller.response.questionnaire.GetPatientQuestionnaireEvolutionResponse;
import br.com.remind.controller.response.questionnaire.GetPatientQuestionnaireEvolutionResponse.ApplicationResult;
import br.com.remind.domain.Patient;
import br.com.remind.domain.Questionnaire;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class GetPatientQuestionnaireEvolutionMapper {

    public GetPatientQuestionnaireEvolutionResponse toResponse(
            Patient patient, Questionnaire questionnaire, List<ApplicationResult> applications) {
        return GetPatientQuestionnaireEvolutionResponse.builder()
                .patientId(patient.getId())
                .patientName(patient.getUser().getName())
                .questionnaireId(questionnaire.getId())
                .questionnaireTitle(questionnaire.getTitle())
                .applications(applications)
                .build();
    }
}
