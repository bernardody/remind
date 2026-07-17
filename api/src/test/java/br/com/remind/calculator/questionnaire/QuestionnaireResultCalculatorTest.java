package br.com.remind.calculator.questionnaire;

import br.com.remind.domain.PatientQuestionResponse;
import br.com.remind.domain.Question;
import br.com.remind.domain.QuestionOption;
import br.com.remind.domain.QuestionnaireAnswer;
import br.com.remind.domain.QuestionnaireResult;
import br.com.remind.domain.QuestionnaireScaleResult;
import br.com.remind.domain.Scale;
import br.com.remind.domain.ScaleRiskBand;
import br.com.remind.repository.QuestionnaireResultRepository;
import br.com.remind.repository.QuestionnaireScaleResultRepository;
import br.com.remind.repository.ScaleRiskBandRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class QuestionnaireResultCalculatorTest {

    @Mock
    private QuestionnaireResultRepository questionnaireResultRepository;

    @Mock
    private QuestionnaireScaleResultRepository questionnaireScaleResultRepository;

    @Mock
    private ScaleRiskBandRepository scaleRiskBandRepository;

    @InjectMocks
    private QuestionnaireResultCalculator calculator;

    private PatientQuestionResponse response(Scale scale, int value) {
        Question question = Question.builder().id(scale.getId() * 100).scale(scale).build();
        QuestionOption option = QuestionOption.builder().value(value).build();
        return PatientQuestionResponse.builder().question(question).questionOption(option).build();
    }

    /**
     * Escala A tem só 2 itens (média 5.00) e escala B tem 4 itens (média 1.00). A média das
     * respostas brutas seria (5+5+1+1+1+1)/6 = 2.33 — puxada pra baixo pela escala com mais
     * itens. A fórmula atual (média das médias por escala) dá peso igual às duas: (5.00+1.00)/2
     * = 3.00, que é o valor que este teste verifica.
     */
    @Test
    void calculate_globalAverageIsAverageOfScaleAverages_notOfRawResponses() {
        Scale scaleA = Scale.builder().id(1L).name("A").build();
        Scale scaleB = Scale.builder().id(2L).name("B").build();
        lenient().when(scaleRiskBandRepository.findByScaleAndActiveTrue(any())).thenReturn(List.of());

        List<PatientQuestionResponse> responses = List.of(
                response(scaleA, 5), response(scaleA, 5),
                response(scaleB, 1), response(scaleB, 1), response(scaleB, 1), response(scaleB, 1));

        calculator.calculate(QuestionnaireAnswer.builder().build(), responses);

        ArgumentCaptor<QuestionnaireResult> resultCaptor = ArgumentCaptor.forClass(QuestionnaireResult.class);
        verify(questionnaireResultRepository).save(resultCaptor.capture());
        assertThat(resultCaptor.getValue().getAverage()).isEqualByComparingTo("3.00");
    }

    @Test
    void calculate_buildsOneScaleResultPerScale_withItsOwnAverage() {
        Scale scaleA = Scale.builder().id(1L).name("A").build();
        Scale scaleB = Scale.builder().id(2L).name("B").build();
        lenient().when(scaleRiskBandRepository.findByScaleAndActiveTrue(any())).thenReturn(List.of());
        when(questionnaireResultRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        List<PatientQuestionResponse> responses = List.of(
                response(scaleA, 5), response(scaleA, 5),
                response(scaleB, 1), response(scaleB, 1), response(scaleB, 1), response(scaleB, 1));

        calculator.calculate(QuestionnaireAnswer.builder().build(), responses);

        ArgumentCaptor<List<QuestionnaireScaleResult>> scaleResultsCaptor = ArgumentCaptor.forClass(List.class);
        verify(questionnaireScaleResultRepository).saveAll(scaleResultsCaptor.capture());
        List<QuestionnaireScaleResult> scaleResults = scaleResultsCaptor.getValue();

        assertThat(scaleResults).hasSize(2);
        assertThat(scaleResults)
                .filteredOn(r -> r.getScale().equals(scaleA))
                .extracting(QuestionnaireScaleResult::getAverage)
                .containsExactly(new BigDecimal("5.00"));
        assertThat(scaleResults)
                .filteredOn(r -> r.getScale().equals(scaleB))
                .extracting(QuestionnaireScaleResult::getAverage)
                .containsExactly(new BigDecimal("1.00"));
    }

    @Test
    void calculate_classifiesRiskLabelPerScale_usingThatScaleAverage() {
        Scale scale = Scale.builder().id(1L).name("BSMAS").build();
        ScaleRiskBand baixo = ScaleRiskBand.builder().scale(scale).label("Baixo")
                .min_value(new BigDecimal("0")).max_value(new BigDecimal("2")).build();
        ScaleRiskBand alto = ScaleRiskBand.builder().scale(scale).label("Alto")
                .min_value(new BigDecimal("3.5")).max_value(new BigDecimal("5")).build();
        when(scaleRiskBandRepository.findByScaleAndActiveTrue(scale)).thenReturn(List.of(baixo, alto));
        when(questionnaireResultRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        List<PatientQuestionResponse> responses = List.of(response(scale, 5), response(scale, 5));

        calculator.calculate(QuestionnaireAnswer.builder().build(), responses);

        ArgumentCaptor<List<QuestionnaireScaleResult>> scaleResultsCaptor = ArgumentCaptor.forClass(List.class);
        verify(questionnaireScaleResultRepository).saveAll(scaleResultsCaptor.capture());

        assertThat(scaleResultsCaptor.getValue())
                .extracting(QuestionnaireScaleResult::getRisk_label)
                .containsExactly("Alto");
    }

    @Test
    void calculate_singleScale_globalAverageMatchesScaleAverage() {
        Scale scale = Scale.builder().id(1L).name("SAS-SV").build();
        lenient().when(scaleRiskBandRepository.findByScaleAndActiveTrue(any())).thenReturn(List.of());

        List<PatientQuestionResponse> responses = List.of(
                response(scale, 3), response(scale, 4), response(scale, 5));

        calculator.calculate(QuestionnaireAnswer.builder().build(), responses);

        ArgumentCaptor<QuestionnaireResult> resultCaptor = ArgumentCaptor.forClass(QuestionnaireResult.class);
        verify(questionnaireResultRepository).save(resultCaptor.capture());
        assertThat(resultCaptor.getValue().getAverage()).isEqualByComparingTo("4.00");
    }
}
