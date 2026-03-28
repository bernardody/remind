package br.com.remind.service.patient;

import br.com.remind.controller.response.patient.ListPatientResponse;
import br.com.remind.domain.Psychologist;
import br.com.remind.domain.User;
import br.com.remind.mapper.patient.ListPatientMapper;
import br.com.remind.repository.PatientRepository;
import br.com.remind.repository.PsychologistRepository;
import br.com.remind.service.user.AuthenticatedUserService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import static org.springframework.http.HttpStatus.NOT_FOUND;

@RequiredArgsConstructor
@Service
public class ListPatientService {

    private final PatientRepository patientRepository;
    private final PsychologistRepository psychologistRepository;
    private final AuthenticatedUserService authenticatedUserService;
    private final ListPatientMapper listPatientMapper;

    public Page<ListPatientResponse> list(Pageable pageable) {
        User authenticatedUser = authenticatedUserService.get();

        Psychologist psychologist = psychologistRepository.findByUser(authenticatedUser)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Psicólogo não encontrado"));

        return patientRepository.findByPsychologistAndActiveTrue(psychologist, pageable)
                .map(listPatientMapper::toResponse);
    }
}