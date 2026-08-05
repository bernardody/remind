package br.com.remind.controller;

import br.com.remind.controller.request.admin.CreatePsychologistRequest;
import br.com.remind.service.admin.CreatePsychologistService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/** Endpoints restritos a {@code UserType.ADMIN} — ver {@code AdminAuthorizationFilter}. */
@RequiredArgsConstructor
@RestController
@RequestMapping("/admin")
public class AdminController {

    private final CreatePsychologistService createPsychologistService;

    @ResponseStatus(HttpStatus.CREATED)
    @PostMapping("/psychologists")
    public void createPsychologist(@RequestBody @Valid CreatePsychologistRequest request) {
        createPsychologistService.create(request.getName(), request.getEmail());
    }
}
