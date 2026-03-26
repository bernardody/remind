package br.com.remind.controller.response.questionnaire;


import lombok.*;

import java.time.LocalDate;

@Builder
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
public class QuestionnaireResponse {

    private Long id;
    private String title;
    private LocalDate created_at;
    private LocalDate updated_at;
    private Boolean active;
}
