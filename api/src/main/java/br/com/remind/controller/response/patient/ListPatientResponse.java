package br.com.remind.controller.response.patient;

import lombok.*;

import java.time.LocalDate;

@Builder
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
public class ListPatientResponse{

        private Long id;
        private String name;
        private String email;
        private String phone;
        private LocalDate birthDate;
        private Character gender;
        private LocalDate createdAt;
        private Boolean active;

}