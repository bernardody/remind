package br.com.remind.service.questionnaire;

import br.com.remind.controller.response.patient.ListPatientQuestionnaireResponse;
import br.com.remind.domain.Patient;
import br.com.remind.domain.User;
import br.com.remind.mapper.patient.ListPatientQuestionnaireMapper;
import br.com.remind.repository.PatientRepository;
import br.com.remind.repository.QuestionnaireAnswerRepository;
import br.com.remind.service.user.AuthenticatedUserService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import static org.springframework.http.HttpStatus.NOT_FOUND;

@RequiredArgsConstructor
@Service
public class ListMyQuestionnairesService {

    private final PatientRepository patientRepository;
    private final QuestionnaireAnswerRepository questionnaireAnswerRepository;
    private final AuthenticatedUserService authenticatedUserService;
    private final ListPatientQuestionnaireMapper listPatientQuestionnaireMapper;

    public Page<ListPatientQuestionnaireResponse> list(Pageable pageable) {
        User authenticatedUser = authenticatedUserService.get();

        Patient patient = patientRepository.findByUserAndActiveTrue(authenticatedUser)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Paciente não encontrado"));

        return questionnaireAnswerRepository.findByPatient(patient, pageable)
                .map(listPatientQuestionnaireMapper::toResponse);
    }
}
