package br.com.remind.controller.response.invite;

import lombok.*;

@Builder
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
public class ConsumeInviteResponse {

    private String accessToken;
    private Long expiresIn;
    private Long questionnaireId;
    private String questionnaireTitle;
}
