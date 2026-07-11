package br.com.remind.service.questionnaire;

import br.com.remind.controller.response.questionnaire.GetPatientQuestionnaireResultResponse;
import br.com.remind.domain.Patient;
import br.com.remind.domain.Questionnaire;
import br.com.remind.domain.QuestionnaireAnswer;
import br.com.remind.domain.QuestionnaireResult;
import br.com.remind.domain.User;
import br.com.remind.mapper.questionnaire.GetPatientQuestionnaireResultMapper;
import br.com.remind.repository.PatientRepository;
import br.com.remind.repository.QuestionnaireAnswerRepository;
import br.com.remind.repository.QuestionnaireRepository;
import br.com.remind.repository.QuestionnaireResultRepository;
import br.com.remind.service.user.AuthenticatedUserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatusCode;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@RequiredArgsConstructor
@Service
public class GetMyQuestionnaireResultService {

    private final QuestionnaireRepository questionnaireRepository;
    private final QuestionnaireAnswerRepository questionnaireAnswerRepository;
    private final QuestionnaireResultRepository questionnaireResultRepository;
    private final PatientRepository patientRepository;
    private final AuthenticatedUserService authenticatedUserService;
    private final GetPatientQuestionnaireResultMapper getPatientQuestionnaireResultMapper;

    public GetPatientQuestionnaireResultResponse get(Long questionnaireId) {
        User authenticatedUser = authenticatedUserService.get();

        Patient patient = patientRepository.findByUserAndActiveTrue(authenticatedUser)
                .orElseThrow(() -> new ResponseStatusException(HttpStatusCode.valueOf(404), "Paciente não encontrado"));

        Questionnaire questionnaire = questionnaireRepository.findByIdAndActiveTrue(questionnaireId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatusCode.valueOf(404), "Questionário não encontrado"));

        QuestionnaireAnswer answer = questionnaireAnswerRepository.findByPatientAndQuestionnaire(patient, questionnaire)
                .orElseThrow(() -> new ResponseStatusException(HttpStatusCode.valueOf(404), "Você ainda não respondeu este questionário"));

        QuestionnaireResult result = questionnaireResultRepository.findByQuestionnaireResponse(answer)
                .orElseThrow(() -> new ResponseStatusException(HttpStatusCode.valueOf(404), "Resultado não encontrado"));

        return getPatientQuestionnaireResultMapper.toResponse(result);
    }
}
