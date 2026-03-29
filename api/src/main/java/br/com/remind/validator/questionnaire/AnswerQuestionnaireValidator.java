package br.com.remind.validator.questionnaire;

import br.com.remind.controller.request.questionnaire.AnswerQuestionnaireRequest;
import br.com.remind.domain.Questionnaire;
import br.com.remind.repository.QuestionOptionRepository;
import br.com.remind.repository.QuestionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatusCode;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RequiredArgsConstructor
@Component
public class AnswerQuestionnaireValidator {

    private final QuestionRepository questionRepository;
    private final QuestionOptionRepository questionOptionRepository;

    public void validate(Questionnaire questionnaire, AnswerQuestionnaireRequest request) {
        validateAllQuestionsAnswered(questionnaire, request);
        validateNoDuplicateQuestions(request);
        validateOptionsbelongToQuestions(questionnaire, request);
    }

    private void validateAllQuestionsAnswered(Questionnaire questionnaire, AnswerQuestionnaireRequest request) {
        long totalQuestions = questionRepository.countByQuestionnaireAndActiveTrue(questionnaire);
        long totalAnswered = request.getResponses().size();

        if (totalAnswered != totalQuestions) {
            throw new ResponseStatusException(HttpStatusCode.valueOf(422),
                    "O questionário possui %d perguntas, mas %d foram respondidas"
                            .formatted(totalQuestions, totalAnswered));
        }
    }

    private void validateNoDuplicateQuestions(AnswerQuestionnaireRequest request) {
        List<Long> questionIds = request.getResponses().stream()
                .map(AnswerQuestionnaireRequest.QuestionResponseRequest::getQuestionId)
                .toList();

        long distinct = questionIds.stream().distinct().count();

        if (distinct != questionIds.size()) {
            throw new ResponseStatusException(HttpStatusCode.valueOf(422),
                    "Existem perguntas respondidas mais de uma vez");
        }
    }

    private void validateOptionsbelongToQuestions(Questionnaire questionnaire, AnswerQuestionnaireRequest request) {
        request.getResponses().forEach(responseRequest -> {
            questionRepository.findByIdAndQuestionnaireAndActiveTrue(
                            responseRequest.getQuestionId(), questionnaire)
                    .ifPresentOrElse(question ->
                                    questionOptionRepository.findByIdAndQuestionAndActiveTrue(
                                                    responseRequest.getQuestionOptionId(), question)
                                            .orElseThrow(() -> new ResponseStatusException(HttpStatusCode.valueOf(422),
                                                    "Opção %d não pertence à pergunta %d"
                                                            .formatted(responseRequest.getQuestionOptionId(), responseRequest.getQuestionId()))),
                            () -> { throw new ResponseStatusException(HttpStatusCode.valueOf(422),
                                    "Pergunta %d não pertence a este questionário"
                                            .formatted(responseRequest.getQuestionId())); }
                    );
        });
    }
}