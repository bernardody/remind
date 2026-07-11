package br.com.remind.calculator.questionnaire;

import br.com.remind.domain.PatientQuestionResponse;
import br.com.remind.domain.QuestionnaireAnswer;
import br.com.remind.domain.QuestionnaireResult;
import br.com.remind.repository.QuestionnaireResultRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;

@RequiredArgsConstructor
@Component
public class QuestionnaireResultCalculator {

    private final QuestionnaireResultRepository questionnaireResultRepository;

    public void calculate(QuestionnaireAnswer questionnaireAnswer, List<PatientQuestionResponse> responses) {
        BigDecimal average = responses.stream()
                .map(r -> BigDecimal.valueOf(r.getQuestionOption().getValue()))
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .divide(BigDecimal.valueOf(responses.size()), 2, RoundingMode.HALF_UP);

        QuestionnaireResult result = QuestionnaireResult.builder()
                .questionnaireResponse(questionnaireAnswer)
                .average(average)
                .created_at(LocalDate.now())
                .updated_at(LocalDate.now())
                .active(true)
                .build();

        questionnaireResultRepository.save(result);
    }
}