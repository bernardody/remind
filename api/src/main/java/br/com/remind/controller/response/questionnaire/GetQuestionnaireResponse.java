package br.com.remind.controller.response.questionnaire;

import br.com.remind.controller.response.question.QuestionResponse;
import lombok.*;

import java.time.LocalDate;
import java.util.List;

@Builder
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
public class GetQuestionnaireResponse {

    private Long id;
    private String title;
    private LocalDate created_at;
    private LocalDate updated_at;
    private Boolean active;
    private List<QuestionResponse> questions;
}
