package br.com.remind.mapper.questionnaire;

import br.com.remind.controller.response.questionnaire.QuestionnaireResponse;
import br.com.remind.domain.Questionnaire;

public class ListQuestionnaireMapper {

    public static QuestionnaireResponse toResponse(Questionnaire entity) {
        return QuestionnaireResponse.builder()
                .id(entity.getId())
                .title(entity.getTitle())
                .created_at(entity.getCreated_at())
                .updated_at(entity.getUpdated_at())
                .active(entity.getActive())
                .build();
    }
}
