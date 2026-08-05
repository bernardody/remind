package br.com.remind.controller.request.admin;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CreatePsychologistRequest {

    @NotBlank
    private String name;

    @NotNull
    @Email
    private String email;
}
