package br.com.remind.mapper.questionnaire;

import br.com.remind.controller.response.option.OptionResponse;
import br.com.remind.controller.response.question.QuestionResponse;
import br.com.remind.controller.response.questionnaire.GetQuestionnaireResponse;
import br.com.remind.domain.Question;
import br.com.remind.domain.QuestionOption;
import br.com.remind.domain.Questionnaire;
import br.com.remind.mapper.question.QuestionMapper;

import java.util.List;
import java.util.Map;

public class GetQuestionnaireMapper {

    public static GetQuestionnaireResponse toResponse(Questionnaire questionnaire, List<Question> questions, Map<Long, List<QuestionOption>> optionsByQuestion) {
        List<QuestionResponse> questionResponses = questions.stream()
                .map(q -> QuestionMapper.toResponse(
                        q,
                        optionsByQuestion.getOrDefault(q.getId(), List.of())
                ))
                .toList();

        return GetQuestionnaireResponse.builder()
                .id(questionnaire.getId())
                .title(questionnaire.getTitle())
                .questions(questionResponses)
                .created_at(questionnaire.getCreated_at())
                .updated_at(questionnaire.getUpdated_at())
                .active(questionnaire.getActive())
                .build();
    }
}
