package br.com.remind.service.patient;

import br.com.remind.controller.request.patient.InsertPatientRequest;
import br.com.remind.controller.response.patient.InsertPatientResponse;
import br.com.remind.domain.Patient;
import br.com.remind.domain.Psychologist;
import br.com.remind.domain.User;
import br.com.remind.enums.UserType;
import br.com.remind.mapper.patient.InsertPatientMapper;
import br.com.remind.repository.PatientRepository;
import br.com.remind.repository.PsychologistRepository;
import br.com.remind.repository.UserRepository;
import br.com.remind.service.user.AuthenticatedUserService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;

import static org.springframework.http.HttpStatus.CONFLICT;
import static org.springframework.http.HttpStatus.NOT_FOUND;

@RequiredArgsConstructor
@Service
public class InsertPatientService {

    private final PatientRepository patientRepository;
    private final PsychologistRepository psychologistRepository;
    private final UserRepository userRepository;
    private final AuthenticatedUserService authenticatedUserService;
    private final InsertPatientMapper insertPatientMapper;
    private final PasswordEncoder passwordEncoder;

    @Transactional
    public InsertPatientResponse insert(InsertPatientRequest request) {
        User authenticatedUser = authenticatedUserService.get();

        Psychologist psychologist = psychologistRepository.findByUser(authenticatedUser)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Psicólogo não encontrado"));

        if (userRepository.existsByEmail(request.getEmail())) {
            throw new ResponseStatusException(CONFLICT, "E-mail já cadastrado");
        }

        User user = User.builder()
                .name(request.getName())
                .email(request.getEmail())
                .cpf(request.getCpf())
                .phone(request.getPhone())
                .password(passwordEncoder.encode(request.getPassword()))
                .type(UserType.PATIENT)
                .created_at(LocalDate.now())
                .updated_at(LocalDate.now())
                .active(true)
                .build();

        userRepository.save(user);

        Patient patient = Patient.builder()
                .user(user)
                .psychologist(psychologist)
                .birth_date(request.getBirthDate())
                .gender(request.getGender())
                .created_at(LocalDate.now())
                .updated_at(LocalDate.now())
                .active(true)
                .build();

        patientRepository.save(patient);

        return insertPatientMapper.toResponse(patient);
    }
}