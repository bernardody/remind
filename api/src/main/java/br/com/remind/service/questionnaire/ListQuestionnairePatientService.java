package br.com.remind.service.questionnaire;

import br.com.remind.controller.response.questionnaire.ListQuestionnairePatientResponse;
import br.com.remind.domain.Psychologist;
import br.com.remind.domain.Questionnaire;
import br.com.remind.domain.User;
import br.com.remind.mapper.questionnaire.ListQuestionnairePatientMapper;
import br.com.remind.repository.PsychologistRepository;
import br.com.remind.repository.QuestionnaireAnswerRepository;
import br.com.remind.repository.QuestionnaireRepository;
import br.com.remind.service.user.AuthenticatedUserService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatusCode;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@RequiredArgsConstructor
@Service
public class ListQuestionnairePatientService {

    private final QuestionnaireRepository questionnaireRepository;
    private final QuestionnaireAnswerRepository questionnaireAnswerRepository;
    private final PsychologistRepository psychologistRepository;
    private final AuthenticatedUserService authenticatedUserService;
    private final ListQuestionnairePatientMapper listQuestionnairePatientMapper;

    public Page<ListQuestionnairePatientResponse> list(Long questionnaireId, Pageable pageable) {
        User authenticatedUser = authenticatedUserService.get();

        Psychologist psychologist = psychologistRepository.findByUser(authenticatedUser)
                .orElseThrow(() -> new ResponseStatusException(HttpStatusCode.valueOf(404), "Psicólogo não encontrado"));

        Questionnaire questionnaire = questionnaireRepository.findByIdAndActiveTrue(questionnaireId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatusCode.valueOf(404), "Questionário não encontrado"));

        return questionnaireAnswerRepository.findByQuestionnaireAndPatient_Psychologist(questionnaire, psychologist, pageable)
                .map(listQuestionnairePatientMapper::toResponse);
    }
}