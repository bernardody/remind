package br.com.remind.mapper.patient;

import br.com.remind.controller.response.patient.UpdatePatientResponse;
import br.com.remind.domain.Patient;
import org.springframework.stereotype.Component;

@Component
public class UpdatePatientMapper {

    public UpdatePatientResponse toResponse(Patient patient) {
        return UpdatePatientResponse.builder()
                .id(patient.getId())
                .name(patient.getUser().getName())
                .email(patient.getUser().getEmail())
                .phone(patient.getUser().getPhone())
                .birthDate(patient.getBirth_date())
                .gender(patient.getGender())
                .updatedAt(patient.getUpdated_at())
                .active(patient.getActive())
                .build();
    }
}