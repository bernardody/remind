package br.com.remind.service.patient;

import br.com.remind.controller.request.patient.UpdatePatientRequest;
import br.com.remind.controller.response.patient.UpdatePatientResponse;
import br.com.remind.domain.Patient;
import br.com.remind.domain.Psychologist;
import br.com.remind.domain.User;
import br.com.remind.mapper.patient.UpdatePatientMapper;
import br.com.remind.repository.PatientRepository;
import br.com.remind.repository.PsychologistRepository;
import br.com.remind.repository.UserRepository;
import br.com.remind.service.user.AuthenticatedUserService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;

import static org.springframework.http.HttpStatus.FORBIDDEN;
import static org.springframework.http.HttpStatus.NOT_FOUND;

@RequiredArgsConstructor
@Service
public class UpdatePatientService {

    private final PatientRepository patientRepository;
    private final PsychologistRepository psychologistRepository;
    private final UserRepository userRepository;
    private final AuthenticatedUserService authenticatedUserService;
    private final UpdatePatientMapper updatePatientMapper;

    @Transactional
    public UpdatePatientResponse update(Long id, UpdatePatientRequest request) {
        User authenticatedUser = authenticatedUserService.get();

        Psychologist psychologist = psychologistRepository.findByUser(authenticatedUser)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Psicólogo não encontrado"));

        Patient patient = patientRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Paciente não encontrado"));

        if (!patient.getPsychologist().equals(psychologist)) {
            throw new ResponseStatusException(FORBIDDEN, "Você não tem permissão para editar este paciente");
        }

        User patientUser = patient.getUser();
        patientUser.setName(request.getName());
        patientUser.setPhone(request.getPhone());
        patientUser.setUpdated_at(LocalDate.now());
        userRepository.save(patientUser);

        patient.setBirth_date(request.getBirthDate());
        patient.setGender(request.getGender());
        patient.setUpdated_at(LocalDate.now());
        patientRepository.save(patient);

        return updatePatientMapper.toResponse(patient);
    }
}
