package br.com.remind.service.questionnaire;

import br.com.remind.controller.response.questionnaire.GetPatientQuestionnaireResultResponse;
import br.com.remind.domain.*;
import br.com.remind.mapper.questionnaire.GetPatientQuestionnaireResultMapper;
import br.com.remind.repository.*;
import br.com.remind.service.user.AuthenticatedUserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatusCode;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RequiredArgsConstructor
@Service
public class GetPatientQuestionnaireResultService {

    private final QuestionnaireRepository questionnaireRepository;
    private final QuestionnaireAnswerRepository questionnaireAnswerRepository;
    private final QuestionnaireResultRepository questionnaireResultRepository;
    private final QuestionnaireScaleResultRepository questionnaireScaleResultRepository;
    private final PatientRepository patientRepository;
    private final PsychologistRepository psychologistRepository;
    private final AuthenticatedUserService authenticatedUserService;
    private final GetPatientQuestionnaireResultMapper getPatientQuestionnaireResultMapper;

    public GetPatientQuestionnaireResultResponse get(Long questionnaireId, Long patientId) {
        User authenticatedUser = authenticatedUserService.get();

        Psychologist psychologist = psychologistRepository.findByUser(authenticatedUser)
                .orElseThrow(() -> new ResponseStatusException(HttpStatusCode.valueOf(404), "Psicólogo não encontrado"));

        Questionnaire questionnaire = questionnaireRepository.findByIdAndActiveTrue(questionnaireId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatusCode.valueOf(404), "Questionário não encontrado"));

        Patient patient = patientRepository.findById(patientId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatusCode.valueOf(404), "Paciente não encontrado"));

        if (!patient.getPsychologist().equals(psychologist)) {
            throw new ResponseStatusException(HttpStatusCode.valueOf(403), "Você não tem permissão para ver o resultado deste paciente");
        }

        // Índice 0 = rodada mais recente (findAll... já vem ordenado desc) — este endpoint
        // devolve sempre "o resultado atual"; o histórico completo é servido por
        // GetPatientQuestionnaireEvolutionService.
        List<QuestionnaireAnswer> answers = questionnaireAnswerRepository
                .findAllByPatientAndQuestionnaireOrderByAnsweredAtDesc(patient, questionnaire);

        if (answers.isEmpty()) {
            throw new ResponseStatusException(HttpStatusCode.valueOf(404), "Paciente ainda não respondeu este questionário");
        }

        QuestionnaireAnswer answer = answers.get(0);

        QuestionnaireResult result = questionnaireResultRepository.findByQuestionnaireResponse(answer)
                .orElseThrow(() -> new ResponseStatusException(HttpStatusCode.valueOf(404), "Resultado não encontrado"));

        List<QuestionnaireScaleResult> scaleResults = questionnaireScaleResultRepository.findByQuestionnaireResult(result);

        return getPatientQuestionnaireResultMapper.toResponse(result, scaleResults);
    }
}