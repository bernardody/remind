package br.com.remind.service.questionnaire;

import br.com.remind.controller.response.questionnaire.GetPatientQuestionnaireEvolutionResponse;
import br.com.remind.controller.response.questionnaire.GetPatientQuestionnaireEvolutionResponse.ApplicationResult;
import br.com.remind.controller.response.questionnaire.GetPatientQuestionnaireEvolutionResponse.ScaleEvolutionResult;
import br.com.remind.domain.Patient;
import br.com.remind.domain.Psychologist;
import br.com.remind.domain.Questionnaire;
import br.com.remind.domain.QuestionnaireAnswer;
import br.com.remind.domain.QuestionnaireResult;
import br.com.remind.domain.QuestionnaireScaleResult;
import br.com.remind.domain.Scale;
import br.com.remind.domain.ScaleRiskBand;
import br.com.remind.domain.User;
import br.com.remind.enums.EvolutionTrend;
import br.com.remind.mapper.questionnaire.GetPatientQuestionnaireEvolutionMapper;
import br.com.remind.repository.PatientRepository;
import br.com.remind.repository.PsychologistRepository;
import br.com.remind.repository.QuestionnaireAnswerRepository;
import br.com.remind.repository.QuestionnaireRepository;
import br.com.remind.repository.QuestionnaireResultRepository;
import br.com.remind.repository.QuestionnaireScaleResultRepository;
import br.com.remind.repository.ScaleRiskBandRepository;
import br.com.remind.service.user.AuthenticatedUserService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

/**
 * Cobre o cálculo de tendência por escala entre rodadas consecutivas
 * (docs/specs/003-relatorios-evolucao-longitudinal/PRD.md §4.4): cruzamento de faixa de risco
 * como critério primário, delta numérico como desempate, sem tendência na 1ª rodada.
 */
@ExtendWith(MockitoExtension.class)
class GetPatientQuestionnaireEvolutionServiceTest {

    @Mock private QuestionnaireRepository questionnaireRepository;
    @Mock private QuestionnaireAnswerRepository questionnaireAnswerRepository;
    @Mock private QuestionnaireResultRepository questionnaireResultRepository;
    @Mock private QuestionnaireScaleResultRepository questionnaireScaleResultRepository;
    @Mock private ScaleRiskBandRepository scaleRiskBandRepository;
    @Mock private PatientRepository patientRepository;
    @Mock private PsychologistRepository psychologistRepository;
    @Mock private AuthenticatedUserService authenticatedUserService;
    @Mock private GetPatientQuestionnaireEvolutionMapper getPatientQuestionnaireEvolutionMapper;

    @InjectMocks
    private GetPatientQuestionnaireEvolutionService service;

    private final User psychologistUser = User.builder().id(1L).name("Psicóloga").build();
    private final Psychologist psychologist = Psychologist.builder().id(5L).build();
    private final User patientUser = User.builder().id(2L).name("Paciente").build();
    private final Patient patient = Patient.builder().id(10L).user(patientUser).psychologist(psychologist).build();
    private final Questionnaire questionnaire = Questionnaire.builder().id(100L).title("Questionário 1").active(true).build();

    private final Scale bsmas = Scale.builder().id(1L).name("BSMAS").build();
    private final Scale sises = Scale.builder().id(2L).name("SISES").build();

    private final ScaleRiskBand baixo = ScaleRiskBand.builder()
            .min_value(new BigDecimal("0")).max_value(new BigDecimal("2")).label("Baixo").build();
    private final ScaleRiskBand alto = ScaleRiskBand.builder()
            .min_value(new BigDecimal("3.5")).max_value(new BigDecimal("5")).label("Alto").build();

    private QuestionnaireScaleResult scaleResult(QuestionnaireResult result, Scale scale, String average, String riskLabel) {
        return QuestionnaireScaleResult.builder()
                .questionnaireResult(result).scale(scale).average(new BigDecimal(average)).risk_label(riskLabel).build();
    }

    @Test
    void get_withTwoRounds_classifiesTrendPerScale_bandCrossingAndDeltaWithinBand() {
        stubMapperToDelegateToRealImplementation();

        QuestionnaireAnswer round1 = QuestionnaireAnswer.builder().id(1L).patient(patient).questionnaire(questionnaire)
                .answered_at(LocalDateTime.of(2026, 1, 10, 9, 0)).build();
        QuestionnaireAnswer round2 = QuestionnaireAnswer.builder().id(2L).patient(patient).questionnaire(questionnaire)
                .answered_at(LocalDateTime.of(2026, 3, 10, 9, 0)).build();

        QuestionnaireResult result1 = QuestionnaireResult.builder().id(1L).questionnaireResponse(round1).average(new BigDecimal("2.75")).build();
        QuestionnaireResult result2 = QuestionnaireResult.builder().id(2L).questionnaireResponse(round2).average(new BigDecimal("3.80")).build();

        // BSMAS: 4.00 -> 3.60, mesma faixa (Alto), delta -0.40 (além do epsilon 0.2) => MELHORA.
        // SISES: 1.50 (Baixo) -> 4.00 (Alto), cruza faixa => PIORA.
        List<QuestionnaireScaleResult> round1Scales = List.of(
                scaleResult(result1, bsmas, "4.00", "Alto"),
                scaleResult(result1, sises, "1.50", "Baixo"));
        List<QuestionnaireScaleResult> round2Scales = List.of(
                scaleResult(result2, bsmas, "3.60", "Alto"),
                scaleResult(result2, sises, "4.00", "Alto"));

        when(authenticatedUserService.get()).thenReturn(psychologistUser);
        when(psychologistRepository.findByUser(psychologistUser)).thenReturn(Optional.of(psychologist));
        when(questionnaireRepository.findByIdAndActiveTrue(100L)).thenReturn(Optional.of(questionnaire));
        when(patientRepository.findById(10L)).thenReturn(Optional.of(patient));
        // Repositório de base devolve desc (mesma convenção usada pro resultado "atual") — o
        // serviço inverte pra ordem cronológica internamente.
        when(questionnaireAnswerRepository.findAllByPatientAndQuestionnaireOrderByAnsweredAtDesc(patient, questionnaire))
                .thenReturn(List.of(round2, round1));
        when(questionnaireResultRepository.findByQuestionnaireResponseIn(any())).thenReturn(List.of(result1, result2));
        when(questionnaireScaleResultRepository.findByQuestionnaireResultIn(any()))
                .thenReturn(concat(round1Scales, round2Scales));
        when(scaleRiskBandRepository.findByScaleAndActiveTrue(any())).thenReturn(List.of(baixo, alto));

        GetPatientQuestionnaireEvolutionResponse response = service.get(100L, 10L);

        assertThat(response.getApplications()).hasSize(2);

        ApplicationResult first = response.getApplications().get(0);
        assertThat(first.getQuestionnaireAnswerId()).isEqualTo(1L);
        assertThat(trendOf(first, "BSMAS")).isNull();
        assertThat(trendOf(first, "SISES")).isNull();

        ApplicationResult second = response.getApplications().get(1);
        assertThat(second.getQuestionnaireAnswerId()).isEqualTo(2L);
        assertThat(trendOf(second, "BSMAS")).isEqualTo(EvolutionTrend.MELHORA);
        assertThat(trendOf(second, "SISES")).isEqualTo(EvolutionTrend.PIORA);
    }

    @Test
    void get_whenDeltaIsWithinEpsilon_andSameBand_isStable() {
        stubMapperToDelegateToRealImplementation();

        QuestionnaireAnswer round1 = QuestionnaireAnswer.builder().id(1L).patient(patient).questionnaire(questionnaire)
                .answered_at(LocalDateTime.of(2026, 1, 10, 9, 0)).build();
        QuestionnaireAnswer round2 = QuestionnaireAnswer.builder().id(2L).patient(patient).questionnaire(questionnaire)
                .answered_at(LocalDateTime.of(2026, 2, 10, 9, 0)).build();

        QuestionnaireResult result1 = QuestionnaireResult.builder().id(1L).questionnaireResponse(round1).average(new BigDecimal("4.00")).build();
        QuestionnaireResult result2 = QuestionnaireResult.builder().id(2L).questionnaireResponse(round2).average(new BigDecimal("4.10")).build();

        List<QuestionnaireScaleResult> round1Scales = List.of(scaleResult(result1, bsmas, "4.00", "Alto"));
        List<QuestionnaireScaleResult> round2Scales = List.of(scaleResult(result2, bsmas, "4.10", "Alto"));

        when(authenticatedUserService.get()).thenReturn(psychologistUser);
        when(psychologistRepository.findByUser(psychologistUser)).thenReturn(Optional.of(psychologist));
        when(questionnaireRepository.findByIdAndActiveTrue(100L)).thenReturn(Optional.of(questionnaire));
        when(patientRepository.findById(10L)).thenReturn(Optional.of(patient));
        when(questionnaireAnswerRepository.findAllByPatientAndQuestionnaireOrderByAnsweredAtDesc(patient, questionnaire))
                .thenReturn(List.of(round2, round1));
        when(questionnaireResultRepository.findByQuestionnaireResponseIn(any())).thenReturn(List.of(result1, result2));
        when(questionnaireScaleResultRepository.findByQuestionnaireResultIn(any()))
                .thenReturn(concat(round1Scales, round2Scales));
        when(scaleRiskBandRepository.findByScaleAndActiveTrue(any())).thenReturn(List.of(baixo, alto));

        GetPatientQuestionnaireEvolutionResponse response = service.get(100L, 10L);

        ApplicationResult second = response.getApplications().get(1);
        assertThat(trendOf(second, "BSMAS")).isEqualTo(EvolutionTrend.ESTAVEL);
    }

    private EvolutionTrend trendOf(ApplicationResult application, String scaleName) {
        // Não usar .map(getTrend).findFirst() aqui: findFirst() lança NPE se o elemento
        // encontrado do stream for null, e trend É null de propósito na 1ª rodada.
        return application.getScaleResults().stream()
                .filter(sr -> sr.getScaleName().equals(scaleName))
                .findFirst()
                .orElseThrow()
                .getTrend();
    }

    private List<QuestionnaireScaleResult> concat(List<QuestionnaireScaleResult> a, List<QuestionnaireScaleResult> b) {
        return java.util.stream.Stream.concat(a.stream(), b.stream()).toList();
    }

    /** Mapper é trivial (monta o DTO) — delega pra uma instância real em vez de duplicar a lógica no stub. */
    private void stubMapperToDelegateToRealImplementation() {
        GetPatientQuestionnaireEvolutionMapper real = new GetPatientQuestionnaireEvolutionMapper();
        when(getPatientQuestionnaireEvolutionMapper.toResponse(any(), any(), any()))
                .thenAnswer(invocation -> real.toResponse(
                        invocation.getArgument(0), invocation.getArgument(1), invocation.getArgument(2)));
    }
}
