package br.com.remind.controller.request.questionnaire;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class AnswerQuestionnaireRequest {

    @Valid
    @NotEmpty
    private List<QuestionResponseRequest> responses;

    @Getter
    @Setter
    public static class QuestionResponseRequest {

        @NotNull
        private Long questionId;

        @NotNull
        private Long questionOptionId;
    }
}
