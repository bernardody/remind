package br.com.remind.controller.request.invite;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ConsumeInviteRequest {

    @NotBlank
    private String token;
}
