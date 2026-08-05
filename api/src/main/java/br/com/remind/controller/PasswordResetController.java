package br.com.remind.controller;

import br.com.remind.controller.request.password.ForgotPasswordRequest;
import br.com.remind.controller.request.password.ResetPasswordRequest;
import br.com.remind.service.password.RequestPasswordResetService;
import br.com.remind.service.password.ResetPasswordService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RequiredArgsConstructor
@RestController
@RequestMapping("/auth")
public class PasswordResetController {

    private final RequestPasswordResetService requestPasswordResetService;
    private final ResetPasswordService resetPasswordService;

    /** Sempre 200, exista ou não o e-mail (nunca revela se uma conta existe). */
    @PostMapping("/forgot-password")
    public void forgotPassword(@RequestBody @Valid ForgotPasswordRequest request) {
        requestPasswordResetService.request(request.getEmail());
    }

    @PostMapping("/reset-password")
    public void resetPassword(@RequestBody @Valid ResetPasswordRequest request) {
        resetPasswordService.reset(request.getToken(), request.getNewPassword());
    }
}
