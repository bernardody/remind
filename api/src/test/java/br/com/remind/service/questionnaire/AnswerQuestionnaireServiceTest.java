package br.com.remind.service.questionnaire;

import br.com.remind.calculator.questionnaire.QuestionnaireResultCalculator;
import br.com.remind.controller.request.questionnaire.AnswerQuestionnaireRequest;
import br.com.remind.controller.response.questionnaire.AnswerQuestionnaireResponse;
import br.com.remind.domain.Patient;
import br.com.remind.domain.Question;
import br.com.remind.domain.QuestionOption;
import br.com.remind.domain.Questionnaire;
import br.com.remind.domain.QuestionnaireAnswer;
import br.com.remind.domain.QuestionnaireInvite;
import br.com.remind.domain.User;
import br.com.remind.enums.InviteStatus;
import br.com.remind.mapper.questionnaire.AnswerQuestionnaireMapper;
import br.com.remind.repository.PatientQuestionResponseRepository;
import br.com.remind.repository.PatientRepository;
import br.com.remind.repository.QuestionOptionRepository;
import br.com.remind.repository.QuestionRepository;
import br.com.remind.repository.QuestionnaireAnswerRepository;
import br.com.remind.repository.QuestionnaireInviteRepository;
import br.com.remind.repository.QuestionnaireRepository;
import br.com.remind.service.user.AuthenticatedUserService;
import br.com.remind.validator.questionnaire.AnswerQuestionnaireValidator;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Cobre o gate de convite obrigatório (docs/specs/003-relatorios-evolucao-longitudinal/PRD.md
 * §4.1) que substituiu o antigo bloqueio "já respondeu este questionário" — a regra de negócio
 * mais sensível desta spec, dado o incidente real que motivou o desenho anterior (R10,
 * `.claude/specs/04-spec-aplicacao.md` §7).
 */
@ExtendWith(MockitoExtension.class)
class AnswerQuestionnaireServiceTest {

    @Mock private QuestionnaireAnswerRepository questionnaireAnswerRepository;
    @Mock private PatientQuestionResponseRepository patientQuestionResponseRepository;
    @Mock private QuestionnaireRepository questionnaireRepository;
    @Mock private QuestionRepository questionRepository;
    @Mock private QuestionOptionRepository questionOptionRepository;
    @Mock private PatientRepository patientRepository;
    @Mock private QuestionnaireInviteRepository questionnaireInviteRepository;
    @Mock private AuthenticatedUserService authenticatedUserService;
    @Mock private AnswerQuestionnaireMapper answerQuestionnaireMapper;
    @Mock private AnswerQuestionnaireValidator answerQuestionnaireValidator;
    @Mock private QuestionnaireResultCalculator questionnaireResultCalculator;

    @InjectMocks
    private AnswerQuestionnaireService answerQuestionnaireService;

    private final User user = User.builder().id(1L).name("Paciente Teste").email("p@x.com").build();
    private final Patient patient = Patient.builder().id(10L).user(user).build();
    private final Questionnaire questionnaire = Questionnaire.builder().id(100L).title("Questionário 1").active(true).build();

    private AnswerQuestionnaireRequest requestWith(long questionId, long optionId) {
        AnswerQuestionnaireRequest.QuestionResponseRequest item = new AnswerQuestionnaireRequest.QuestionResponseRequest();
        item.setQuestionId(questionId);
        item.setQuestionOptionId(optionId);
        AnswerQuestionnaireRequest request = new AnswerQuestionnaireRequest();
        request.setResponses(List.of(item));
        return request;
    }

    private void stubPatientAndQuestionnaire() {
        when(authenticatedUserService.get()).thenReturn(user);
        when(patientRepository.findByUserAndActiveTrue(user)).thenReturn(Optional.of(patient));
        when(questionnaireRepository.findByIdAndActiveTrue(100L)).thenReturn(Optional.of(questionnaire));
    }

    @Test
    void answer_withoutAnyInvite_isRejectedWith403_andNeverPersistsAnswer() {
        stubPatientAndQuestionnaire();
        when(questionnaireInviteRepository.markAnsweredIfLive(
                any(), any(), any(LocalDateTime.class), any(LocalDate.class))).thenReturn(0);
        when(questionnaireInviteRepository.findByPatientAndQuestionnaireAndActiveTrue(patient, questionnaire))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() -> answerQuestionnaireService.answer(100L, requestWith(1L, 2L)))
                .isInstanceOf(ResponseStatusException.class)
                .extracting(ex -> ((ResponseStatusException) ex).getStatusCode().value())
                .isEqualTo(403);

        verify(questionnaireAnswerRepository, never()).save(any());
        verify(answerQuestionnaireValidator, never()).validate(any(), any());
    }

    @Test
    void answer_whenInviteAlreadyAnswered_isRejectedWith409_notGeneric403() {
        QuestionnaireInvite answered = QuestionnaireInvite.builder()
                .patient(patient).questionnaire(questionnaire).status(InviteStatus.ANSWERED).active(true).build();

        stubPatientAndQuestionnaire();
        when(questionnaireInviteRepository.markAnsweredIfLive(
                any(), any(), any(LocalDateTime.class), any(LocalDate.class))).thenReturn(0);
        when(questionnaireInviteRepository.findByPatientAndQuestionnaireAndActiveTrue(patient, questionnaire))
                .thenReturn(Optional.of(answered));

        assertThatThrownBy(() -> answerQuestionnaireService.answer(100L, requestWith(1L, 2L)))
                .isInstanceOf(ResponseStatusException.class)
                .extracting(ex -> ((ResponseStatusException) ex).getStatusCode().value())
                .isEqualTo(409);

        verify(questionnaireAnswerRepository, never()).save(any());
    }

    @Test
    void answer_withLiveInvite_persistsAnswer_andLinksInviteToIt() {
        Question question = Question.builder().id(1L).questionnaire(questionnaire).build();
        QuestionOption option = QuestionOption.builder().id(2L).question(question).value(3).build();
        QuestionnaireInvite invite = QuestionnaireInvite.builder()
                .patient(patient).questionnaire(questionnaire).status(InviteStatus.SENT).active(true).build();

        stubPatientAndQuestionnaire();
        when(questionnaireInviteRepository.markAnsweredIfLive(
                any(), any(), any(LocalDateTime.class), any(LocalDate.class))).thenReturn(1);
        when(questionnaireInviteRepository.findByPatientAndQuestionnaireAndActiveTrue(patient, questionnaire))
                .thenReturn(Optional.of(invite));
        when(questionRepository.findByIdAndQuestionnaireAndActiveTrue(1L, questionnaire)).thenReturn(Optional.of(question));
        when(questionOptionRepository.findByIdAndQuestionAndActiveTrue(2L, question)).thenReturn(Optional.of(option));
        when(answerQuestionnaireMapper.toResponse(any(), any()))
                .thenReturn(AnswerQuestionnaireResponse.builder().totalResponses(1).build());

        AnswerQuestionnaireResponse response = answerQuestionnaireService.answer(100L, requestWith(1L, 2L));

        assertThat(response.getTotalResponses()).isEqualTo(1);
        verify(questionnaireAnswerRepository).save(any(QuestionnaireAnswer.class));
        verify(patientQuestionResponseRepository).saveAll(any());
        verify(questionnaireResultCalculator).calculate(any(), any());
        verify(questionnaireInviteRepository).save(argThat(saved -> saved.getQuestionnaireAnswer() != null));
    }
}
