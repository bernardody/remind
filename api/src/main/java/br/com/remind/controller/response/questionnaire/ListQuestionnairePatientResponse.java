package br.com.remind.controller.response.questionnaire;

import lombok.*;

import java.time.LocalDateTime;

@Builder
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
public class ListQuestionnairePatientResponse {

    private Long patientId;
    private String patientName;
    private LocalDateTime answeredAt;
}