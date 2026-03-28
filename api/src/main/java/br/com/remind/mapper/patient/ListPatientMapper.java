package br.com.remind.mapper.patient;

import br.com.remind.controller.response.patient.ListPatientResponse;
import br.com.remind.domain.Patient;
import org.springframework.stereotype.Component;

@Component
public class ListPatientMapper {

    public ListPatientResponse toResponse(Patient patient) {
        return new ListPatientResponse(
                patient.getId(),
                patient.getUser().getName(),
                patient.getUser().getEmail(),
                patient.getUser().getPhone(),
                patient.getBirth_date(),
                patient.getGender(),
                patient.getCreated_at(),
                patient.getActive()
        );
    }
}