package br.com.remind.controller;

import br.com.remind.controller.request.login.GoogleLoginRequest;
import br.com.remind.controller.response.login.LoginResponse;
import br.com.remind.service.login.GoogleLoginService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RequiredArgsConstructor
@RestController
@RequestMapping("/login/google")
public class GoogleLoginController {

    private final GoogleLoginService googleLoginService;

    @PostMapping
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody GoogleLoginRequest request) {
        return ResponseEntity.ok(googleLoginService.login(request.getIdToken()));
    }
}
