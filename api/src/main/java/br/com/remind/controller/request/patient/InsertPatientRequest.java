package br.com.remind.controller.request.patient;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
public class InsertPatientRequest {

    @NotBlank
    private String name;

    @NotBlank
    private String email;

    @NotBlank
    private String cpf;

    @NotBlank
    private String phone;

    @NotBlank
    private String password;

    @NotNull
    private LocalDate birthDate;

    @NotNull
    private Character gender;
}
