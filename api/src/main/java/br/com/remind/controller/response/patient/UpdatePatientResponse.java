package br.com.remind.controller.response.patient;

import lombok.*;

import java.time.LocalDate;

@Builder
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
public class UpdatePatientResponse {

    private Long id;
    private String name;
    private String email;
    private String phone;
    private LocalDate birthDate;
    private Character gender;
    private LocalDate updatedAt;
    private Boolean active;
}