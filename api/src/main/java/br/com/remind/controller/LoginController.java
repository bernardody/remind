package br.com.remind.controller;

import br.com.remind.controller.request.login.LoginRequest;
import br.com.remind.controller.response.login.LoginResponse;
import br.com.remind.domain.User;
import br.com.remind.service.login.AccessTokenService;
import br.com.remind.service.login.SearchUserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import static org.springframework.http.HttpStatus.UNAUTHORIZED;

@RequiredArgsConstructor
@RestController
@RequestMapping("/login")
public class LoginController {

    private final SearchUserService searchUserService;
    private final PasswordEncoder passwordEncoder;
    private final AccessTokenService accessTokenService;

    @PostMapping
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest loginRequest) {
        User usuario = searchUserService.searchByEmail(loginRequest.getEmail())
                .orElseThrow(() -> new ResponseStatusException(UNAUTHORIZED, "Usuário ou senha incorretos!"));

        // Conta criada via Google não possui senha (REQ-011): rejeitar antes de comparar.
        if (usuario.getPassword() == null) {
            throw new ResponseStatusException(UNAUTHORIZED, "Esta conta utiliza login do Google.");
        }

        if (!passwordEncoder.matches(loginRequest.getPassword(), usuario.getPassword())) {
            throw new ResponseStatusException(UNAUTHORIZED, "Usuário ou senha incorretos!");
        }

        String token = accessTokenService.generate(usuario).getTokenValue();

        LoginResponse response = new LoginResponse(
                token,
                AccessTokenService.EXPIRES_IN,
                usuario.getType(),
                Boolean.TRUE.equals(usuario.getProfileComplete())
        );

        return ResponseEntity.ok(response);
    }
}
