package br.com.remind.controller.request.password;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ChangePasswordRequest {

    /** Opcional: contas sem senha ainda (login Google, ou recém-criadas por um admin) não têm o que comparar. */
    private String currentPassword;

    @NotBlank
    @Size(min = 8, message = "A senha deve ter ao menos 8 caracteres")
    private String newPassword;
}
