package br.com.remind.calculator.questionnaire;

import br.com.remind.domain.PatientQuestionResponse;
import br.com.remind.domain.Scale;
import br.com.remind.domain.ScaleRiskBand;
import br.com.remind.domain.QuestionnaireAnswer;
import br.com.remind.domain.QuestionnaireResult;
import br.com.remind.domain.QuestionnaireScaleResult;
import br.com.remind.repository.QuestionnaireResultRepository;
import br.com.remind.repository.QuestionnaireScaleResultRepository;
import br.com.remind.repository.ScaleRiskBandRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@RequiredArgsConstructor
@Component
public class QuestionnaireResultCalculator {

    private final QuestionnaireResultRepository questionnaireResultRepository;
    private final QuestionnaireScaleResultRepository questionnaireScaleResultRepository;
    private final ScaleRiskBandRepository scaleRiskBandRepository;

    public void calculate(QuestionnaireAnswer questionnaireAnswer, List<PatientQuestionResponse> responses) {
        BigDecimal average = average(responses);

        QuestionnaireResult result = QuestionnaireResult.builder()
                .questionnaireResponse(questionnaireAnswer)
                .average(average)
                .created_at(LocalDate.now())
                .updated_at(LocalDate.now())
                .active(true)
                .build();

        questionnaireResultRepository.save(result);

        List<QuestionnaireScaleResult> scaleResults = responses.stream()
                .collect(Collectors.groupingBy(r -> r.getQuestion().getScale()))
                .entrySet().stream()
                .map(entry -> buildScaleResult(result, entry.getKey(), entry.getValue()))
                .toList();

        questionnaireScaleResultRepository.saveAll(scaleResults);
    }

    private QuestionnaireScaleResult buildScaleResult(
            QuestionnaireResult result, Scale scale, List<PatientQuestionResponse> scaleResponses) {
        BigDecimal scaleAverage = average(scaleResponses);

        return QuestionnaireScaleResult.builder()
                .questionnaireResult(result)
                .scale(scale)
                .average(scaleAverage)
                .risk_label(classify(scale, scaleAverage))
                .created_at(LocalDate.now())
                .updated_at(LocalDate.now())
                .active(true)
                .build();
    }

    private BigDecimal average(List<PatientQuestionResponse> responses) {
        return responses.stream()
                .map(r -> BigDecimal.valueOf(r.getQuestionOption().getValue()))
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .divide(BigDecimal.valueOf(responses.size()), 2, RoundingMode.HALF_UP);
    }

    /**
     * A faixa é o maior "piso" (`min_value`) que a média atinge — não usa `max_value` na
     * comparação. Faixas com limite superior exclusivo (ex.: Alto = 3.5–5) deixariam a nota
     * máxima da escala (5.0) sem classificação, já que `5 < 5` é falso.
     */
    private String classify(Scale scale, BigDecimal average) {
        return scaleRiskBandRepository.findByScaleAndActiveTrue(scale).stream()
                .filter(band -> average.compareTo(band.getMin_value()) >= 0)
                .max(Comparator.comparing(ScaleRiskBand::getMin_value))
                .map(ScaleRiskBand::getLabel)
                .orElse(null);
    }
}
