package br.com.remind.controller.response.invite;

import lombok.*;

import java.time.LocalDateTime;

@Builder
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
public class ListPatientInviteResponse {

    private Long id;
    private Long questionnaireId;
    private String questionnaireTitle;
    private String status;
    private LocalDateTime expiresAt;
    private LocalDateTime sentAt;
    private LocalDateTime openedAt;
}
