package br.com.remind.service.questionnaire;

import br.com.remind.controller.response.questionnaire.GetPatientQuestionnaireAnswersResponse;
import br.com.remind.domain.*;
import br.com.remind.mapper.questionnaire.GetPatientQuestionnaireAnswersMapper;
import br.com.remind.repository.*;
import br.com.remind.service.user.AuthenticatedUserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatusCode;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RequiredArgsConstructor
@Service
public class GetPatientQuestionnaireAnswersService {

    private final QuestionnaireRepository questionnaireRepository;
    private final QuestionnaireAnswerRepository questionnaireAnswerRepository;
    private final PatientQuestionResponseRepository patientQuestionResponseRepository;
    private final PatientRepository patientRepository;
    private final PsychologistRepository psychologistRepository;
    private final AuthenticatedUserService authenticatedUserService;
    private final GetPatientQuestionnaireAnswersMapper getPatientQuestionnaireAnswersMapper;

    public GetPatientQuestionnaireAnswersResponse get(Long questionnaireId, Long patientId) {
        User authenticatedUser = authenticatedUserService.get();

        Psychologist psychologist = psychologistRepository.findByUser(authenticatedUser)
                .orElseThrow(() -> new ResponseStatusException(HttpStatusCode.valueOf(404), "Psicólogo não encontrado"));

        Questionnaire questionnaire = questionnaireRepository.findByIdAndActiveTrue(questionnaireId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatusCode.valueOf(404), "Questionário não encontrado"));

        Patient patient = patientRepository.findById(patientId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatusCode.valueOf(404), "Paciente não encontrado"));

        if (!patient.getPsychologist().equals(psychologist)) {
            throw new ResponseStatusException(HttpStatusCode.valueOf(403), "Você não tem permissão para ver as respostas deste paciente");
        }

        QuestionnaireAnswer answer = questionnaireAnswerRepository.findByPatientAndQuestionnaire(patient, questionnaire)
                .orElseThrow(() -> new ResponseStatusException(HttpStatusCode.valueOf(404), "Paciente ainda não respondeu este questionário"));

        List<PatientQuestionResponse> responses = patientQuestionResponseRepository.findByQuestionnaireResponse(answer);

        return getPatientQuestionnaireAnswersMapper.toResponse(answer, responses);
    }
}