package br.com.remind.service.patient;

import br.com.remind.domain.Patient;
import br.com.remind.domain.Psychologist;
import br.com.remind.domain.User;
import br.com.remind.repository.PatientRepository;
import br.com.remind.repository.PsychologistRepository;
import br.com.remind.service.user.AuthenticatedUserService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import static org.springframework.http.HttpStatus.FORBIDDEN;
import static org.springframework.http.HttpStatus.NOT_FOUND;

@RequiredArgsConstructor
@Service
public class DeletePatientService {

    private final PatientRepository patientRepository;
    private final PsychologistRepository psychologistRepository;
    private final AuthenticatedUserService authenticatedUserService;

    @Transactional
    public void delete(Long id) {
        User authenticatedUser = authenticatedUserService.get();

        Psychologist psychologist = psychologistRepository.findByUser(authenticatedUser)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Psicólogo não encontrado"));

        Patient patient = patientRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Paciente não encontrado"));

        if (!patient.getPsychologist().equals(psychologist)) {
            throw new ResponseStatusException(FORBIDDEN, "Você não tem permissão para deletar este paciente");
        }

        patient.setActive(false);
    }
}
