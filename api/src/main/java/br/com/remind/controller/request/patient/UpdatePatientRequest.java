package br.com.remind.controller.request.patient;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
public class UpdatePatientRequest {

    @NotBlank
    private String name;

    @NotBlank
    private String phone;

    @NotNull
    private LocalDate birthDate;

    @NotNull
    private Character gender;
}