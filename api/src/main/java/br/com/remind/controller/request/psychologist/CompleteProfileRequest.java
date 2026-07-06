package br.com.remind.controller.request.psychologist;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CompleteProfileRequest {

    @NotBlank
    @Size(max = 11)
    private String cpf;

    @NotBlank
    @Size(max = 11)
    private String phone;

    @NotBlank
    private String street;

    @NotNull
    private Integer number;

    @NotBlank
    @Size(min = 8, max = 8)
    private String cep;

    @NotBlank
    private String neighborhood;

    @NotBlank
    private String city;
}
