package br.com.remind.controller;

import br.com.remind.controller.request.patient.InsertPatientRequest;
import br.com.remind.controller.response.patient.InsertPatientResponse;
import br.com.remind.controller.response.patient.ListPatientResponse;
import br.com.remind.service.patient.DeletePatientService;
import br.com.remind.service.patient.InsertPatientService;
import br.com.remind.service.patient.ListPatientService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.bind.annotation.*;

@RequiredArgsConstructor
@RestController
@RequestMapping("/pacientes")
public class PatientController {

    private final ListPatientService listPatientService;
    private final InsertPatientService insertPatientService;
    private final DeletePatientService deletePatientService;

    @GetMapping
    public Page<ListPatientResponse> listPatient(Pageable pageable) {
        return listPatientService.list(pageable);
    }

    @PostMapping
    public InsertPatientResponse insertPatient(@RequestBody @Valid InsertPatientRequest request) {
        return insertPatientService.insert(request);
    }

    @DeleteMapping("/{id}")
    public void deletePatient(@PathVariable Long id) {
        deletePatientService.delete(id);
    }
}
