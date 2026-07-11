package br.com.remind.controller;

import br.com.remind.controller.request.patient.InsertPatientRequest;
import br.com.remind.controller.response.patient.InsertPatientResponse;
import br.com.remind.controller.response.patient.ListPatientQuestionnaireResponse;
import br.com.remind.controller.response.patient.ListPatientResponse;
import br.com.remind.controller.request.patient.UpdatePatientRequest;
import br.com.remind.controller.response.patient.UpdatePatientResponse;
import br.com.remind.service.patient.DeletePatientService;
import br.com.remind.service.patient.GetPatientService;
import br.com.remind.service.patient.InsertPatientService;
import br.com.remind.service.patient.ListPatientQuestionnairesService;
import br.com.remind.service.patient.ListPatientService;
import br.com.remind.service.patient.UpdatePatientService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RequiredArgsConstructor
@RestController
@RequestMapping("/pacientes")
public class PatientController {

    private final ListPatientService listPatientService;
    private final GetPatientService getPatientService;
    private final ListPatientQuestionnairesService listPatientQuestionnairesService;
    private final InsertPatientService insertPatientService;
    private final DeletePatientService deletePatientService;
    private final UpdatePatientService updatePatientService;

    @GetMapping
    public Page<ListPatientResponse> listPatient(Pageable pageable) {
        return listPatientService.list(pageable);
    }

    @GetMapping("/{id}")
    public ListPatientResponse getPatient(@PathVariable Long id) {
        return getPatientService.get(id);
    }

    @GetMapping("/{id}/avaliacoes")
    public Page<ListPatientQuestionnaireResponse> listPatientQuestionnaires(@PathVariable Long id,
                                                                             Pageable pageable) {
        return listPatientQuestionnairesService.list(id, pageable);
    }

    @PostMapping
    public InsertPatientResponse insertPatient(@RequestBody @Valid InsertPatientRequest request) {
        return insertPatientService.insert(request);
    }

    @PutMapping("/{id}")
    public UpdatePatientResponse updatePatient(@PathVariable Long id,
                                               @RequestBody @Valid UpdatePatientRequest request) {
        return updatePatientService.update(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deletePatient(@PathVariable Long id) {
        deletePatientService.delete(id);
    }
}
