package br.com.remind.service.questionnaire;

import br.com.remind.calculator.questionnaire.QuestionnaireResultCalculator;
import br.com.remind.controller.request.questionnaire.AnswerQuestionnaireRequest;
import br.com.remind.controller.response.questionnaire.AnswerQuestionnaireResponse;
import br.com.remind.domain.*;
import br.com.remind.enums.InviteStatus;
import br.com.remind.mapper.questionnaire.AnswerQuestionnaireMapper;
import br.com.remind.repository.*;
import br.com.remind.service.user.AuthenticatedUserService;
import br.com.remind.validator.questionnaire.AnswerQuestionnaireValidator;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatusCode;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@RequiredArgsConstructor
@Service
public class AnswerQuestionnaireService {

    private final QuestionnaireAnswerRepository questionnaireAnswerRepository;
    private final PatientQuestionResponseRepository patientQuestionResponseRepository;
    private final QuestionnaireRepository questionnaireRepository;
    private final QuestionRepository questionRepository;
    private final QuestionOptionRepository questionOptionRepository;
    private final PatientRepository patientRepository;
    private final QuestionnaireInviteRepository questionnaireInviteRepository;
    private final AuthenticatedUserService authenticatedUserService;
    private final AnswerQuestionnaireMapper answerQuestionnaireMapper;
    private final AnswerQuestionnaireValidator answerQuestionnaireValidator;
    private final QuestionnaireResultCalculator questionnaireResultCalculator;

    @Transactional
    public AnswerQuestionnaireResponse answer(Long questionnaireId, AnswerQuestionnaireRequest request) {
        User authenticatedUser = authenticatedUserService.get();

        Patient patient = patientRepository.findByUserAndActiveTrue(authenticatedUser)
                .orElseThrow(() -> new ResponseStatusException(HttpStatusCode.valueOf(404), "Paciente não encontrado"));

        Questionnaire questionnaire = questionnaireRepository.findByIdAndActiveTrue(questionnaireId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatusCode.valueOf(404), "Questionário não encontrado"));

        // Convite vivo é obrigatório pra responder — inclusive na 1ª vez, não só em reaplicações
        // (docs/specs/003-relatorios-evolucao-longitudinal/PRD.md §3/§4.1). Consumo atômico evita
        // que dois submits simultâneos do mesmo convite gerem duas respostas.
        int consumed = questionnaireInviteRepository.markAnsweredIfLive(patient, questionnaire);
        if (consumed == 0) {
            QuestionnaireInvite existingInvite = questionnaireInviteRepository
                    .findByPatientAndQuestionnaireAndActiveTrue(patient, questionnaire)
                    .orElse(null);

            if (existingInvite != null && existingInvite.getStatus() == InviteStatus.ANSWERED) {
                throw new ResponseStatusException(HttpStatusCode.valueOf(409), "Você já respondeu este questionário");
            }
            throw new ResponseStatusException(HttpStatusCode.valueOf(403),
                    "Você precisa de um convite ativo do seu psicólogo para responder este questionário");
        }

        answerQuestionnaireValidator.validate(questionnaire, request);

        QuestionnaireAnswer questionnaireAnswer = QuestionnaireAnswer.builder()
                .patient(patient)
                .questionnaire(questionnaire)
                .answered_at(LocalDateTime.now())
                .created_at(LocalDate.now())
                .updated_at(LocalDate.now())
                .active(true)
                .build();

        questionnaireAnswerRepository.save(questionnaireAnswer);

        // INV-009: o convite já foi marcado ANSWERED atomicamente acima — aqui só vincula a
        // resposta gerada a ele. Convite é reaproveitado a cada reaplicação (INV-002), então
        // esse vínculo sempre reflete a rodada mais recente.
        questionnaireInviteRepository.findByPatientAndQuestionnaireAndActiveTrue(patient, questionnaire)
                .ifPresent(invite -> {
                    invite.setQuestionnaireAnswer(questionnaireAnswer);
                    invite.setUpdated_at(LocalDate.now());
                    questionnaireInviteRepository.save(invite);
                });

        List<PatientQuestionResponse> responses = request.getResponses().stream()
                .map(responseRequest -> {
                    Question question = questionRepository.findByIdAndQuestionnaireAndActiveTrue(
                            responseRequest.getQuestionId(), questionnaire).get();

                    QuestionOption option = questionOptionRepository.findByIdAndQuestionAndActiveTrue(
                            responseRequest.getQuestionOptionId(), question).get();

                    return PatientQuestionResponse.builder()
                            .questionnaireResponse(questionnaireAnswer)
                            .question(question)
                            .questionOption(option)
                            .created_at(LocalDate.now())
                            .updated_at(LocalDate.now())
                            .active(true)
                            .build();
                })
                .toList();

        patientQuestionResponseRepository.saveAll(responses);

        questionnaireResultCalculator.calculate(questionnaireAnswer, responses);

        return answerQuestionnaireMapper.toResponse(questionnaireAnswer, responses.size());
    }
}