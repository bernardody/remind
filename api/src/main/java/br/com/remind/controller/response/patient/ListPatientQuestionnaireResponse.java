package br.com.remind.controller.response.patient;

import lombok.*;

import java.time.LocalDateTime;

@Builder
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
public class ListPatientQuestionnaireResponse {

    private Long questionnaireId;
    private String questionnaireTitle;
    private LocalDateTime answeredAt;
}
